"""
Executor Agent – Executes ready tasks by invoking registered tools.
"""
import json
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.entities import Task
from app.services.workflow_service import update_task_status
from app.services.audit_service import log_event
from app.tools.registry import registry


def execute_task(
    db: Session,
    task: Task,
    override_params: Optional[dict] = None,
) -> dict:
    """
    Execute a single ready task using the registered tool.
    Returns a result dict.
    """
    log_event(
        db,
        task.workflow_id,
        f"task_execution_started: {task.name}",
        "info",
        task_id=task.id,
        agent_name="executor",
        attempt_number=task.retry_count + 1,
        input_data={"tool": task.tool_name},
    )

    # Validate tool exists
    if not task.tool_name or not registry.get(task.tool_name):
        err = f"Tool '{task.tool_name}' is not registered"
        update_task_status(db, task.id, "failed", error_message=err)
        log_event(
            db, task.workflow_id,
            f"task_failed: {task.name}",
            "error",
            task_id=task.id,
            agent_name="executor",
            attempt_number=task.retry_count + 1,
            error_message=err,
        )
        return {"success": False, "error": err}

    # Build params
    params = {}
    if task.tool_input:
        try:
            params = json.loads(task.tool_input)
        except (json.JSONDecodeError, ValueError):
            params = {}
    if override_params:
        params.update(override_params)

    # Only add task_id for tools that support approval enforcement
    if task.tool_name == "send_email":
        params["task_id"] = task.id

    # Mark as running
    update_task_status(db, task.id, "running")

    try:
        result = registry.execute(task.tool_name, db, params)

        if result.get("blocked"):
            # Approval not granted
            update_task_status(db, task.id, "failed", error_message="Approval not granted")
            log_event(
                db, task.workflow_id,
                f"task_blocked_no_approval: {task.name}",
                "warning",
                task_id=task.id,
                agent_name="executor",
                attempt_number=task.retry_count + 1,
            )
            return {"success": False, "blocked": True, "error": "Approval not granted"}

        # Success
        update_task_status(db, task.id, "completed", tool_output=result)
        log_event(
            db, task.workflow_id,
            f"task_completed: {task.name}",
            "success",
            task_id=task.id,
            agent_name="executor",
            attempt_number=task.retry_count + 1,
            output_data=result,
        )
        return {"success": True, "result": result}

    except Exception as e:
        err_msg = str(e)
        # Increment retry count
        task.retry_count += 1
        task.updated_at = datetime.utcnow()
        db.commit()

        update_task_status(db, task.id, "failed", error_message=err_msg)
        log_event(
            db, task.workflow_id,
            f"task_failed: {task.name}",
            "error",
            task_id=task.id,
            agent_name="executor",
            attempt_number=task.retry_count,
            error_message=err_msg,
        )
        return {"success": False, "error": err_msg, "retry_count": task.retry_count}
