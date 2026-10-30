"""
Audit Service – Records every meaningful operation in execution_logs
"""
import json
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.entities import ExecutionLog


def log_event(
    db: Session,
    workflow_id: str,
    action: str,
    status: str = "info",
    task_id: Optional[str] = None,
    agent_name: Optional[str] = None,
    attempt_number: int = 1,
    input_data: Optional[Any] = None,
    output_data: Optional[Any] = None,
    error_message: Optional[str] = None,
) -> ExecutionLog:
    """Create an immutable audit log entry."""
    entry = ExecutionLog(
        workflow_id=workflow_id,
        task_id=task_id,
        agent_name=agent_name,
        action=action,
        status=status,
        attempt_number=attempt_number,
        input_data=json.dumps(input_data) if input_data is not None else None,
        output_data=json.dumps(output_data) if output_data is not None else None,
        error_message=error_message,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
