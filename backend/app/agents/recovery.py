"""
Recovery Agent – Handles task failures, applies retry policies,
marks permanent failures, triggers replanning.
"""
import time
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.entities import Task
from app.services.workflow_service import update_task_status, get_task
from app.services.audit_service import log_event


RETRY_DELAYS = [2, 5, 10]  # seconds for attempts 1, 2, 3


def is_recoverable_error(error_message: str) -> bool:
    """
    Determine if an error is recoverable (worth retrying).
    Permanent errors (validation, auth) are not retried.
    """
    if not error_message:
        return True

    permanent_keywords = [
        "validation error",
        "invalid",
        "not registered",
        "permission denied",
        "not found",
        "already exists",
        "approval not granted",
    ]
    err_lower = error_message.lower()
    for kw in permanent_keywords:
        if kw in err_lower:
            return False
    return True


def attempt_recovery(
    db: Session,
    task: Task,
    workflow_id: str,
) -> dict:
    """
    Attempt to recover a failed task.
    - Check if retryable
    - Increment retry counter
    - Reset status to 'ready'
    - Log the attempt
    Returns: {"retried": bool, "permanent_failure": bool, "message": str}
    """
    if task.status != "failed":
        return {"retried": False, "permanent_failure": False, "message": "Task not in failed state"}

    error_msg = task.error_message or ""
    retry_count = task.retry_count
    max_retries = task.max_retries

    # Check if already exhausted retries
    if retry_count >= max_retries:
        log_event(
            db, workflow_id,
            f"task_permanently_failed: {task.name}",
            "error",
            task_id=task.id,
            agent_name="recovery",
            attempt_number=retry_count,
            error_message=f"Max retries ({max_retries}) exhausted. Last error: {error_msg}",
        )
        return {
            "retried": False,
            "permanent_failure": True,
            "message": f"Task permanently failed after {max_retries} attempts",
        }

    # Check if error is recoverable
    if not is_recoverable_error(error_msg):
        log_event(
            db, workflow_id,
            f"task_non_recoverable_failure: {task.name}",
            "error",
            task_id=task.id,
            agent_name="recovery",
            attempt_number=retry_count,
            error_message=f"Non-recoverable error: {error_msg}",
        )
        # Mark as permanently failed
        task.retry_count = task.max_retries  # exhaust retries
        task.updated_at = datetime.utcnow()
        db.commit()
        return {
            "retried": False,
            "permanent_failure": True,
            "message": f"Non-recoverable error: {error_msg}",
        }

    # Apply retry delay
    delay_idx = min(retry_count, len(RETRY_DELAYS) - 1)
    delay = RETRY_DELAYS[delay_idx]

    log_event(
        db, workflow_id,
        f"task_retry_scheduled: {task.name}",
        "retry",
        task_id=task.id,
        agent_name="recovery",
        attempt_number=retry_count + 1,
        input_data={"delay_seconds": delay, "attempt": retry_count + 1},
        error_message=f"Retrying after: {error_msg}",
    )

    # Short delay (in real system this would be async)
    time.sleep(min(delay, 2))  # Cap at 2s for hackathon demo

    # Reset task to ready for re-execution
    task.status = "ready"
    task.error_message = None
    task.updated_at = datetime.utcnow()
    db.commit()

    log_event(
        db, workflow_id,
        f"task_retry_attempt_{retry_count + 1}: {task.name}",
        "retry",
        task_id=task.id,
        agent_name="recovery",
        attempt_number=retry_count + 1,
    )

    return {
        "retried": True,
        "permanent_failure": False,
        "message": f"Task reset for retry attempt {retry_count + 1}",
        "attempt": retry_count + 1,
    }


def run_recovery(db: Session, workflow_id: str) -> dict:
    """
    Check all failed tasks in a workflow and attempt recovery.
    """
    from app.models.entities import Task as TaskModel

    failed_tasks = (
        db.query(TaskModel)
        .filter(
            TaskModel.workflow_id == workflow_id,
            TaskModel.status == "failed",
        )
        .all()
    )

    results = []
    for task in failed_tasks:
        result = attempt_recovery(db, task, workflow_id)
        results.append({"task_id": task.id, "task_name": task.name, **result})

    log_event(
        db, workflow_id,
        "recovery_agent_completed",
        "info",
        agent_name="recovery",
        output_data={"tasks_processed": len(results)},
    )

    return {"recovered": results}
