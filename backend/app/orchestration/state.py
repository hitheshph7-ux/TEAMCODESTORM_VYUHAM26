"""
Shared Workflow State for LangGraph
"""
from typing import TypedDict, List, Optional, Annotated
import operator


class WorkflowState(TypedDict):
    """Shared state passed between LangGraph nodes."""
    workflow_id: str
    objective: str
    execution_mode: str
    simulate_failure: bool

    # Planning
    tasks_planned: bool
    task_count: int

    # Execution
    current_task_id: Optional[str]
    executed_task_ids: Annotated[List[str], operator.add]
    failed_task_ids: Annotated[List[str], operator.add]
    recovered_task_ids: Annotated[List[str], operator.add]

    # Approval
    awaiting_approval: bool
    approval_task_id: Optional[str]

    # Control
    iteration_count: int
    max_iterations: int
    status: str  # planning, running, paused, completed, failed
    error_message: Optional[str]
    recovery_attempted: bool
