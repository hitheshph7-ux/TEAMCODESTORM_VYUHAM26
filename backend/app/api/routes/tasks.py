"""
Task API Routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.task import TaskResponse, TaskDetailResponse
from app.services.workflow_service import get_task, list_workflow_tasks
from app.models.entities import TaskDependency

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/{task_id}", response_model=TaskDetailResponse)
def get_task_detail(task_id: str, db: Session = Depends(get_db)):
    """Get task details including dependencies."""
    task = get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    deps = (
        db.query(TaskDependency)
        .filter(TaskDependency.task_id == task_id)
        .all()
    )

    task_data = TaskDetailResponse.model_validate(task)
    task_data.dependencies = [d.depends_on_task_id for d in deps]
    return task_data
