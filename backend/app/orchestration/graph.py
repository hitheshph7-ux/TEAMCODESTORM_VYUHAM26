"""
LangGraph Orchestration Graph for VYUHAM.
Implements the full agentic workflow with state management.
"""
import asyncio
from typing import Literal
from sqlalchemy.orm import Session

from langgraph.graph import StateGraph, END, START

from app.orchestration.state import WorkflowState
from app.agents.planner import run_planner
from app.agents.executor import execute_task
from app.agents.monitor import run_monitor, get_ready_tasks
from app.agents.recovery import run_recovery
from app.services.workflow_service import (
    update_workflow_status, get_workflow, list_workflow_tasks,
    create_approval, update_task_status,
)
from app.services.audit_service import log_event
from app.core.database import SessionLocal


# ── Node Functions ─────────────────────────────────────────────────────────────

def planner_node(state: WorkflowState) -> WorkflowState:
    """Plan the workflow – break objective into tasks."""
    db: Session = SessionLocal()
    try:
        update_workflow_status(db, state["workflow_id"], "planning")
        tasks = run_planner(
            db,
            state["workflow_id"],
            state["objective"],
            state.get("execution_mode", "demo"),
            state.get("simulate_failure", False),
        )
        return {
            **state,
            "tasks_planned": True,
            "task_count": len(tasks),
            "status": "running",
        }
    finally:
        db.close()


def executor_node(state: WorkflowState) -> WorkflowState:
    """Execute all currently ready tasks."""
    db: Session = SessionLocal()
    try:
        update_workflow_status(db, state["workflow_id"], "running")
        ready_tasks = get_ready_tasks(db, state["workflow_id"])

        executed = []
        failed = []
        needs_approval = []

        for task in ready_tasks:
            # If this is an approval gate task (requires_approval=True, no tool)
            if task.requires_approval and not task.tool_name:
                from app.models.entities import Approval
                existing_approval = (
                    db.query(Approval)
                    .filter(
                        Approval.task_id == task.id,
                        Approval.status.in_(["pending", "approved"])
                    )
                    .first()
                )
                if not existing_approval:
                    create_approval(
                        db,
                        task_id=task.id,
                        workflow_id=state["workflow_id"],
                        action_description=f"Approve action: {task.name}\n\n{task.description}",
                        requested_by="system",
                    )
                update_task_status(db, task.id, "awaiting_approval")
                needs_approval.append(task.id)
                continue

            # Regular tool task
            result = execute_task(db, task)
            if result.get("success"):
                executed.append(task.id)
            else:
                failed.append(task.id)

        # Check approval gate tasks – if approved, mark them completed so dependents unblock
        from app.models.entities import Task as TaskModel, Approval
        approval_gate_tasks = (
            db.query(TaskModel)
            .filter(
                TaskModel.workflow_id == state["workflow_id"],
                TaskModel.status == "awaiting_approval",
                TaskModel.requires_approval == True,
            )
            .all()
        )
        for task in approval_gate_tasks:
            approval = (
                db.query(Approval)
                .filter(
                    Approval.task_id == task.id,
                    Approval.status == "approved"
                )
                .first()
            )
            if approval:
                # Approval granted for the gate – mark it completed (no tool to execute)
                update_task_status(db, task.id, "completed",
                                   tool_output={"approved": True, "decided_by": approval.decided_by})
                from app.services.audit_service import log_event
                log_event(
                    db, state["workflow_id"],
                    f"approval_gate_passed: {task.name}",
                    "success",
                    task_id=task.id,
                    agent_name="executor",
                )
                executed.append(task.id)
            elif needs_approval:
                pass  # still waiting


        new_state = {**state}
        if executed:
            new_state["executed_task_ids"] = executed
        if failed:
            new_state["failed_task_ids"] = failed
        new_state["iteration_count"] = state.get("iteration_count", 0) + 1
        new_state["recovery_attempted"] = False

        if needs_approval:
            new_state["awaiting_approval"] = True
            new_state["approval_task_id"] = needs_approval[0]
        else:
            new_state["awaiting_approval"] = False

        return new_state
    finally:
        db.close()


def monitor_node(state: WorkflowState) -> WorkflowState:
    """Monitor workflow progress and determine next action."""
    db: Session = SessionLocal()
    try:
        monitor_result = run_monitor(db, state["workflow_id"])
        new_status = monitor_result["workflow_status"]

        update_workflow_status(db, state["workflow_id"], new_status)

        return {
            **state,
            "status": new_status,
            "awaiting_approval": monitor_result["pending_approvals"] > 0,
        }
    finally:
        db.close()


def recovery_node(state: WorkflowState) -> WorkflowState:
    """Attempt recovery of failed tasks."""
    db: Session = SessionLocal()
    try:
        result = run_recovery(db, state["workflow_id"])
        recovered = [r["task_id"] for r in result["recovered"] if r.get("retried")]

        return {
            **state,
            "recovered_task_ids": recovered,
            "recovery_attempted": True,
        }
    finally:
        db.close()


def audit_node(state: WorkflowState) -> WorkflowState:
    """Final audit log when workflow completes."""
    db: Session = SessionLocal()
    try:
        tasks = list_workflow_tasks(db, state["workflow_id"])
        completed = sum(1 for t in tasks if t.status == "completed")
        failed = sum(1 for t in tasks if t.status == "failed")

        log_event(
            db, state["workflow_id"],
            "workflow_execution_completed",
            "success" if state.get("status") == "completed" else "info",
            agent_name="orchestrator",
            output_data={
                "final_status": state.get("status"),
                "completed_tasks": completed,
                "failed_tasks": failed,
                "total_iterations": state.get("iteration_count", 0),
            },
        )
        return state
    finally:
        db.close()


# ── Routing Functions ──────────────────────────────────────────────────────────

def route_after_monitor(state: WorkflowState) -> Literal["executor", "recovery", "audit", "end"]:
    """Decide what to do after monitoring."""
    status = state.get("status", "running")
    iter_count = state.get("iteration_count", 0)
    max_iter = state.get("max_iterations", 20)

    if iter_count >= max_iter:
        return "audit"

    if status in ("completed", "failed", "cancelled"):
        return "audit"

    if status == "paused":
        # Waiting for approval
        return "end"

    # Check for failed tasks that need recovery
    db: Session = SessionLocal()
    try:
        from app.models.entities import Task as TaskModel
        failed_tasks = (
            db.query(TaskModel)
            .filter(
                TaskModel.workflow_id == state["workflow_id"],
                TaskModel.status == "failed",
                TaskModel.retry_count < TaskModel.max_retries,
            )
            .count()
        )
        if failed_tasks > 0 and not state.get("recovery_attempted", False):
            return "recovery"
    finally:
        db.close()

    return "executor"


def route_after_executor(state: WorkflowState) -> Literal["monitor", "end"]:
    """After execution, always go to monitor (unless waiting for approval)."""
    if state.get("awaiting_approval") and not state.get("executed_task_ids"):
        # Nothing was executed, we're waiting for human
        return "end"
    return "monitor"


def route_after_recovery(state: WorkflowState) -> Literal["executor", "monitor"]:
    """After recovery, go back to execute."""
    recovered = state.get("recovered_task_ids", [])
    if recovered:
        return "executor"
    return "monitor"


# ── Build Graph ────────────────────────────────────────────────────────────────

def build_workflow_graph() -> StateGraph:
    """Build and compile the VYUHAM LangGraph workflow."""
    graph = StateGraph(WorkflowState)

    # Add nodes
    graph.add_node("planner", planner_node)
    graph.add_node("executor", executor_node)
    graph.add_node("monitor", monitor_node)
    graph.add_node("recovery", recovery_node)
    graph.add_node("audit", audit_node)

    # Entry point
    graph.set_entry_point("planner")

    # Edges
    graph.add_edge("planner", "executor")
    graph.add_conditional_edges("executor", route_after_executor, {
        "monitor": "monitor",
        "end": END,
    })
    graph.add_conditional_edges("monitor", route_after_monitor, {
        "executor": "executor",
        "recovery": "recovery",
        "audit": "audit",
        "end": END,
    })
    graph.add_conditional_edges("recovery", route_after_recovery, {
        "executor": "executor",
        "monitor": "monitor",
    })
    graph.add_edge("audit", END)

    return graph.compile()


# Singleton compiled graph
_compiled_graph = None


def get_compiled_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_workflow_graph()
    return _compiled_graph


def run_workflow_graph(
    workflow_id: str,
    objective: str,
    execution_mode: str = "demo",
    simulate_failure: bool = False,
) -> WorkflowState:
    """
    Execute the full workflow graph synchronously.
    """
    graph = get_compiled_graph()

    initial_state: WorkflowState = {
        "workflow_id": workflow_id,
        "objective": objective,
        "execution_mode": execution_mode,
        "simulate_failure": simulate_failure,
        "tasks_planned": False,
        "task_count": 0,
        "current_task_id": None,
        "executed_task_ids": [],
        "failed_task_ids": [],
        "recovered_task_ids": [],
        "awaiting_approval": False,
        "approval_task_id": None,
        "iteration_count": 0,
        "max_iterations": 20,
        "status": "planning",
        "error_message": None,
        "recovery_attempted": False,
    }

    final_state = graph.invoke(initial_state)
    return final_state


def resume_workflow_graph(
    workflow_id: str,
    objective: str,
    execution_mode: str = "demo",
) -> WorkflowState:
    """
    Resume a paused workflow (after approval granted).
    Runs executor -> monitor loop again.
    """
    graph = get_compiled_graph()

    # Build resume state
    db: Session = SessionLocal()
    try:
        from app.services.workflow_service import list_workflow_tasks
        tasks = list_workflow_tasks(db, workflow_id)
        executed = [t.id for t in tasks if t.status == "completed"]
        failed = [t.id for t in tasks if t.status == "failed"]
    finally:
        db.close()

    resume_state: WorkflowState = {
        "workflow_id": workflow_id,
        "objective": objective,
        "execution_mode": execution_mode,
        "simulate_failure": False,
        "tasks_planned": True,
        "task_count": len(tasks),
        "current_task_id": None,
        "executed_task_ids": executed,
        "failed_task_ids": failed,
        "recovered_task_ids": [],
        "awaiting_approval": False,
        "approval_task_id": None,
        "iteration_count": 0,
        "max_iterations": 15,
        "status": "running",
        "error_message": None,
        "recovery_attempted": False,
    }

    # Start from executor node for resume
    from langgraph.graph import StateGraph, END
    resume_graph = StateGraph(WorkflowState)
    resume_graph.add_node("executor", executor_node)
    resume_graph.add_node("monitor", monitor_node)
    resume_graph.add_node("recovery", recovery_node)
    resume_graph.add_node("audit", audit_node)
    resume_graph.set_entry_point("executor")
    resume_graph.add_conditional_edges("executor", route_after_executor, {
        "monitor": "monitor",
        "end": END,
    })
    resume_graph.add_conditional_edges("monitor", route_after_monitor, {
        "executor": "executor",
        "recovery": "recovery",
        "audit": "audit",
        "end": END,
    })
    resume_graph.add_conditional_edges("recovery", route_after_recovery, {
        "executor": "executor",
        "monitor": "monitor",
    })
    resume_graph.add_edge("audit", END)

    compiled = resume_graph.compile()
    final_state = compiled.invoke(resume_state)
    return final_state
