from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class WorkflowStatus(str, Enum):
    pending = "pending"
    planning = "planning"
    running = "running"
    paused = "paused"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class WorkflowCreate(BaseModel):
    objective: str = Field(..., min_length=10, max_length=2000)
    execution_mode: Optional[str] = Field(default="demo", pattern="^(ai|demo)$")


class WorkflowResponse(BaseModel):
    id: str
    objective: str
    status: WorkflowStatus
    execution_mode: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class WorkflowDetailResponse(WorkflowResponse):
    tasks: List["TaskResponse"] = []


class WorkflowStatusResponse(BaseModel):
    workflow_id: str
    status: WorkflowStatus
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    pending_tasks: int
    running_tasks: int
    pending_approvals: int


# Avoid circular imports
from app.schemas.task import TaskResponse  # noqa: E402
WorkflowDetailResponse.model_rebuild()
