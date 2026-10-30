"""
Monitor Agent – Tracks workflow progress, evaluates dependencies,
detects failures and completions.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.entities import Task, TaskDependency
from app.services.workflow_service import (
    list_workflow_tasks, update_task_status, update_workflow_status,
    get_pending_approvals,
)
from app.services.audit_service import log_event


def evaluate_dependencies(db: Session, task: Task) -> bool:
    """
    Return True if all dependencies of this task are completed.
    """
    deps = (
        db.query(TaskDependency)
        .filter(TaskDependency.task_id == task.id)
        .all()
    )
    if not deps:
        return True

    for dep in deps:
        dep_task = db.query(Task).filter(Task.id == dep.depends_on_task_id).first()
        if not dep_task or dep_task.status != "completed":
            return False
    return True


def check_dependency_failures(db: Session, task: Task) -> bool:
    """Return True if any dependency has permanently failed."""
    deps = (
        db.query(TaskDependency)
        .filter(TaskDependency.task_id == task.id)
        .all()
    )
    for dep in deps:
        dep_task = db.query(Task).filter(Task.id == dep.depends_on_task_id).first()
        if dep_task and dep_task.status == "failed" and dep_task.retry_count >= dep_task.max_retries:
            return True
    return False


def get_ready_tasks(db: Session, workflow_id: str) -> List[Task]:
    """
    Return list of tasks that are ready to execute:
    - status is 'pending' or 'ready'
    - all dependencies completed
    - does not require approval (or approval granted)
    """
    tasks = list_workflow_tasks(db, workflow_id)
    ready = []

    for task in tasks:
        if task.status not in ("pending", "ready", "blocked"):
            continue
        if check_dependency_failures(db, task):
            update_task_status(db, task.id, "blocked")
            continue
        if evaluate_dependencies(db, task):
            # Check approval tasks - if requires_approval, move to awaiting_approval
            if task.requires_approval and task.status == "pending":
                update_task_status(db, task.id, "awaiting_approval")
                continue
            if task.status != "awaiting_approval":
                update_task_status(db, task.id, "ready")
                ready.append(task)

    return ready


def get_workflow_completion_status(db: Session, workflow_id: str) -> str:
    """
    Analyze workflow tasks and return the new workflow status.
    Returns: 'running', 'paused', 'completed', 'failed'
    """
    tasks = list_workflow_tasks(db, workflow_id)
    if not tasks:
        return "running"

    statuses = [t.status for t in tasks]

    if all(s == "completed" for s in statuses):
        return "completed"

    if any(s == "running" for s in statuses):
        return "running"

    # Check if blocked by awaiting_approval
    if any(s == "awaiting_approval" for s in statuses):
        return "paused"

    # Check if any failed permanently
    permanently_failed = [
        t for t in tasks
        if t.status == "failed" and t.retry_count >= t.max_retries
    ]
    if permanently_failed:
        # Check if any remaining tasks can still run
        can_run = [t for t in tasks if t.status in ("pending", "ready")]
        if not can_run:
            return "failed"

    # Still has pending/ready tasks
    if any(s in ("pending", "ready") for s in statuses):
        return "running"

    return "running"


def run_monitor(db: Session, workflow_id: str) -> dict:
    """
    Main monitoring pass for a workflow.
    Returns diagnostic information about workflow state.
    """
    tasks = list_workflow_tasks(db, workflow_id)
    statuses = {t.status: 0 for t in tasks}
    for t in tasks:
        statuses[t.status] = statuses.get(t.status, 0) + 1

    ready_tasks = get_ready_tasks(db, workflow_id)
    workflow_status = get_workflow_completion_status(db, workflow_id)

    pending_approvals = get_pending_approvals(db, workflow_id)

    log_event(
        db, workflow_id,
        "monitor_check",
        "info",
        agent_name="monitor",
        output_data={
            "task_statuses": statuses,
            "ready_count": len(ready_tasks),
            "new_workflow_status": workflow_status,
            "pending_approvals": len(pending_approvals),
        },
    )

    return {
        "workflow_status": workflow_status,
        "ready_tasks": ready_tasks,
        "task_statuses": statuses,
        "pending_approvals": len(pending_approvals),
    }
