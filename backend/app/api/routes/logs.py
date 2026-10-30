"""
Execution Logs API Routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.log import ExecutionLogResponse
from app.models.entities import ExecutionLog

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=List[ExecutionLogResponse])
def get_logs(
    workflow_id: Optional[str] = Query(default=None),
    agent_name: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    """Get execution logs with optional filters."""
    q = db.query(ExecutionLog)
    if workflow_id:
        q = q.filter(ExecutionLog.workflow_id == workflow_id)
    if agent_name:
        q = q.filter(ExecutionLog.agent_name == agent_name)
    if status:
        q = q.filter(ExecutionLog.status == status)
    logs = q.order_by(ExecutionLog.created_at.desc()).limit(limit).all()
    return logs
