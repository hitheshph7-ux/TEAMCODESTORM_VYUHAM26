"""
Tool Registry – The Executor Agent can only invoke tools registered here.
No arbitrary function calls are allowed.
"""
from typing import Callable, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.tools.employee_tools import create_employee, get_employee
from app.tools.email_tools import prepare_email, send_email
from app.tools.training_tools import assign_training, get_training_status


class ToolRegistry:
    """Safe, bounded tool registry."""

    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._descriptions: Dict[str, str] = {}
        self._requires_approval: Dict[str, bool] = {}

    def register(self, name: str, fn: Callable, description: str = "", requires_approval: bool = False):
        self._tools[name] = fn
        self._descriptions[name] = description
        self._requires_approval[name] = requires_approval

    def get(self, name: str) -> Optional[Callable]:
        return self._tools.get(name)

    def requires_approval(self, name: str) -> bool:
        return self._requires_approval.get(name, False)

    def list_tools(self) -> list:
        return [
            {
                "name": name,
                "description": self._descriptions[name],
                "requires_approval": self._requires_approval[name],
            }
            for name in self._tools
        ]

    def execute(self, tool_name: str, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a registered tool with given params."""
        fn = self.get(tool_name)
        if fn is None:
            raise ValueError(f"Tool '{tool_name}' is not registered. Refusing execution.")
        return fn(db=db, **params)


# ── Singleton Registry ─────────────────────────────────────────────────────────

registry = ToolRegistry()

registry.register(
    "create_employee",
    create_employee,
    description="Create a new employee record in the system",
    requires_approval=False,
)

registry.register(
    "get_employee",
    get_employee,
    description="Retrieve an existing employee record",
    requires_approval=False,
)

registry.register(
    "prepare_email",
    prepare_email,
    description="Prepare an onboarding email (stored, not sent)",
    requires_approval=False,
)

registry.register(
    "send_email",
    send_email,
    description="Send a prepared email (requires prior approval)",
    requires_approval=True,
)

registry.register(
    "assign_training",
    assign_training,
    description="Assign mandatory training to an employee",
    requires_approval=False,
)

registry.register(
    "get_training_status",
    get_training_status,
    description="Check the status of a training assignment",
    requires_approval=False,
)
