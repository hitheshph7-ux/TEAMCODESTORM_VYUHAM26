from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class ApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    workflow_id: str
    status: ApprovalStatus
    requested_by: str
    decided_by: Optional[str] = None
    decision_reason: Optional[str] = None
    action_description: Optional[str] = None
    created_at: datetime
    decided_at: Optional[datetime] = None


class ApprovalDecision(BaseModel):
    decided_by: str = Field(default="admin", max_length=100)
    reason: Optional[str] = Field(default=None, max_length=500)


class ApprovalWithTask(ApprovalResponse):
    task_name: Optional[str] = None
    workflow_objective: Optional[str] = None
