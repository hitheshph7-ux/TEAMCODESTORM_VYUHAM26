"""
Workflow Service – CRUD operations for workflows, tasks, approvals.
"""
import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.entities import Workflow, Task, TaskDependency, Approval, ExecutionLog
from app.services.audit_service import log_event


# ── Workflow CRUD ──────────────────────────────────────────────────────────────

def create_workflow(db: Session, objective: str, execution_mode: str = "demo") -> Workflow:
    wf = Workflow(objective=objective, status="pending", execution_mode=execution_mode)
    db.add(wf)
    db.commit()
    db.refresh(wf)
    log_event(db, wf.id, "workflow_created", "info", output_data={"objective": objective})
    return wf


def get_workflow(db: Session, workflow_id: str) -> Optional[Workflow]:
    return db.query(Workflow).filter(Workflow.id == workflow_id).first()


def list_workflows(db: Session, skip: int = 0, limit: int = 50) -> List[Workflow]:
    return (
        db.query(Workflow)
        .order_by(Workflow.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_workflow_status(db: Session, workflow_id: str, status: str) -> Optional[Workflow]:
    wf = get_workflow(db, workflow_id)
    if not wf:
        return None
    wf.status = status
    wf.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(wf)
    log_event(db, workflow_id, f"workflow_status_changed_to_{status}", "info")
    return wf


def cancel_workflow(db: Session, workflow_id: str) -> Optional[Workflow]:
    wf = get_workflow(db, workflow_id)
    if not wf:
        return None
    if wf.status in ("completed", "failed", "cancelled"):
        return wf
    wf.status = "cancelled"
    wf.updated_at = datetime.utcnow()
    # Cancel pending tasks
    db.query(Task).filter(
        Task.workflow_id == workflow_id,
        Task.status.in_(["pending", "ready", "blocked"])
    ).update({"status": "skipped", "updated_at": datetime.utcnow()})
    db.commit()
    db.refresh(wf)
    log_event(db, workflow_id, "workflow_cancelled", "warning")
    return wf


# ── Task CRUD ──────────────────────────────────────────────────────────────────

def create_task(
    db: Session,
    workflow_id: str,
    name: str,
    description: str = "",
    assigned_agent: str = "executor",
    tool_name: str = "",
    tool_input: Optional[dict] = None,
    requires_approval: bool = False,
    order_index: int = 0,
) -> Task:
    task = Task(
        workflow_id=workflow_id,
        name=name,
        description=description,
        assigned_agent=assigned_agent,
        tool_name=tool_name,
        tool_input=json.dumps(tool_input) if tool_input else None,
        requires_approval=requires_approval,
        status="pending",
        order_index=order_index,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, task_id: str) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def list_workflow_tasks(db: Session, workflow_id: str) -> List[Task]:
    return (
        db.query(Task)
        .filter(Task.workflow_id == workflow_id)
        .order_by(Task.order_index)
        .all()
    )


def update_task_status(
    db: Session,
    task_id: str,
    status: str,
    error_message: Optional[str] = None,
    tool_output: Optional[dict] = None,
) -> Optional[Task]:
    task = get_task(db, task_id)
    if not task:
        return None
    task.status = status
    task.updated_at = datetime.utcnow()
    if error_message is not None:
        task.error_message = error_message
    if tool_output is not None:
        task.tool_output = json.dumps(tool_output)
    db.commit()
    db.refresh(task)
    return task


def add_task_dependency(db: Session, task_id: str, depends_on_task_id: str) -> TaskDependency:
    dep = TaskDependency(task_id=task_id, depends_on_task_id=depends_on_task_id)
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep


def get_task_dependencies(db: Session, task_id: str) -> List[str]:
    """Return list of task IDs that the given task depends on."""
    deps = (
        db.query(TaskDependency)
        .filter(TaskDependency.task_id == task_id)
        .all()
    )
    return [d.depends_on_task_id for d in deps]


# ── Approval CRUD ──────────────────────────────────────────────────────────────

def create_approval(
    db: Session,
    task_id: str,
    workflow_id: str,
    action_description: str = "",
    requested_by: str = "system",
) -> Approval:
    approval = Approval(
        task_id=task_id,
        workflow_id=workflow_id,
        status="pending",
        requested_by=requested_by,
        action_description=action_description,
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    log_event(
        db, workflow_id, "approval_requested", "approval_request",
        task_id=task_id,
        output_data={"action": action_description},
    )
    return approval


def get_pending_approvals(db: Session, workflow_id: Optional[str] = None) -> List[Approval]:
    q = db.query(Approval).filter(Approval.status == "pending")
    if workflow_id:
        q = q.filter(Approval.workflow_id == workflow_id)
    return q.order_by(Approval.created_at.desc()).all()


def get_all_approvals(db: Session) -> List[Approval]:
    return db.query(Approval).order_by(Approval.created_at.desc()).all()


def decide_approval(
    db: Session,
    approval_id: str,
    decision: str,  # "approved" or "rejected"
    decided_by: str = "admin",
    reason: Optional[str] = None,
) -> Optional[Approval]:
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval or approval.status != "pending":
        return None
    approval.status = decision
    approval.decided_by = decided_by
    approval.decision_reason = reason
    approval.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(approval)

    log_event(
        db,
        approval.workflow_id,
        f"approval_{decision}",
        "approval_decision",
        task_id=approval.task_id,
        output_data={"decided_by": decided_by, "reason": reason},
    )
    return approval


# ── Stats ──────────────────────────────────────────────────────────────────────

def get_dashboard_stats(db: Session) -> dict:
    from sqlalchemy import func

    total = db.query(func.count(Workflow.id)).scalar()
    running = db.query(func.count(Workflow.id)).filter(Workflow.status == "running").scalar()
    completed = db.query(func.count(Workflow.id)).filter(Workflow.status == "completed").scalar()
    failed = db.query(func.count(Workflow.id)).filter(Workflow.status == "failed").scalar()
    paused = db.query(func.count(Workflow.id)).filter(Workflow.status == "paused").scalar()
    pending_approvals = db.query(func.count(Approval.id)).filter(Approval.status == "pending").scalar()
    recent = list_workflows(db, skip=0, limit=5)

    return {
        "total_workflows": total,
        "running_workflows": running,
        "completed_workflows": completed,
        "failed_workflows": failed,
        "paused_workflows": paused,
        "pending_approvals": pending_approvals,
        "recent_workflows": recent,
    }
