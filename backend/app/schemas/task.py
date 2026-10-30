from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    pending = "pending"
    ready = "ready"
    running = "running"
    completed = "completed"
    failed = "failed"
    blocked = "blocked"
    skipped = "skipped"
    awaiting_approval = "awaiting_approval"


class DependencyInfo(BaseModel):
    task_id: str
    depends_on_task_id: str


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    name: str
    description: Optional[str] = None
    assigned_agent: Optional[str] = None
    tool_name: Optional[str] = None
    status: TaskStatus
    requires_approval: bool
    retry_count: int
    max_retries: int
    error_message: Optional[str] = None
    order_index: int
    created_at: datetime
    updated_at: datetime


class TaskDetailResponse(TaskResponse):
    tool_input: Optional[str] = None
    tool_output: Optional[str] = None
    dependencies: List[str] = []  # list of depends_on_task_ids
