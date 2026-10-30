"""
Approval API Routes – Human-in-the-loop approval mechanism
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.approval import ApprovalResponse, ApprovalDecision, ApprovalWithTask
from app.services.workflow_service import get_all_approvals, get_pending_approvals, decide_approval
from app.models.entities import Approval, Task, Workflow

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


def _enrich_approval(db: Session, approval: Approval) -> ApprovalWithTask:
    """Add task and workflow context to approval."""
    task = db.query(Task).filter(Task.id == approval.task_id).first()
    workflow = db.query(Workflow).filter(Workflow.id == approval.workflow_id).first()

    data = ApprovalWithTask.model_validate(approval)
    if task:
        data.task_name = task.name
    if workflow:
        data.workflow_objective = workflow.objective[:200]
    return data


@router.get("", response_model=List[ApprovalWithTask])
def list_approvals(
    pending_only: bool = False,
    db: Session = Depends(get_db),
):
    """List all approvals (optionally filter pending only)."""
    if pending_only:
        approvals = get_pending_approvals(db)
    else:
        approvals = get_all_approvals(db)
    return [_enrich_approval(db, a) for a in approvals]


@router.post("/{approval_id}/approve", response_model=ApprovalWithTask)
def approve_action(
    approval_id: str,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
):
    """Approve a pending action."""
    approval = decide_approval(db, approval_id, "approved", payload.decided_by, payload.reason)
    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval not found or already decided"
        )

    # Update the task status back to ready so it can execute
    task = db.query(Task).filter(Task.id == approval.task_id).first()
    if task and task.status == "awaiting_approval":
        from app.services.workflow_service import update_task_status, update_workflow_status
        update_task_status(db, task.id, "ready")

        # Resume the workflow
        workflow = db.query(Workflow).filter(Workflow.id == approval.workflow_id).first()
        if workflow and workflow.status == "paused":
            import threading

            def _resume():
                from app.orchestration.graph import resume_workflow_graph
                from app.core.database import SessionLocal
                db2 = SessionLocal()
                try:
                    resume_workflow_graph(workflow.id, workflow.objective, workflow.execution_mode)
                except Exception as e:
                    from app.services.audit_service import log_event
                    log_event(db2, workflow.id, "auto_resume_error", "error", error_message=str(e))
                finally:
                    db2.close()

            threading.Thread(target=_resume, daemon=True).start()

    return _enrich_approval(db, approval)


@router.post("/{approval_id}/reject", response_model=ApprovalWithTask)
def reject_action(
    approval_id: str,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
):
    """Reject a pending action."""
    approval = decide_approval(db, approval_id, "rejected", payload.decided_by, payload.reason)
    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval not found or already decided"
        )

    # Mark the task as failed and the workflow as failed
    task = db.query(Task).filter(Task.id == approval.task_id).first()
    if task and task.status == "awaiting_approval":
        from app.services.workflow_service import update_task_status, update_workflow_status
        # Exhaust retries to prevent retry of rejected tasks
        task.retry_count = task.max_retries
        db.commit()
        update_task_status(db, task.id, "failed", error_message="Rejected by approver")
        update_workflow_status(db, approval.workflow_id, "failed")

    return _enrich_approval(db, approval)
