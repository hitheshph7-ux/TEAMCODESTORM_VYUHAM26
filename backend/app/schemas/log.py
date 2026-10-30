from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ExecutionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    task_id: Optional[str] = None
    agent_name: Optional[str] = None
    action: str
    status: str
    attempt_number: int
    input_data: Optional[str] = None
    output_data: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
