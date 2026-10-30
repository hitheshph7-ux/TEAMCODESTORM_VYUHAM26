"""
Planner Agent – Converts natural-language objectives into structured task plans.
Supports AI mode (Claude) and Demo mode (deterministic templates).
"""
import json
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.workflow_service import create_task, add_task_dependency
from app.services.audit_service import log_event


# ── Demo Templates ─────────────────────────────────────────────────────────────

DEMO_TEMPLATES = {
    "onboard": {
        "tasks": [
            {
                "name": "Create Employee Record",
                "description": "Create a new employee record in the HR system",
                "assigned_agent": "executor",
                "tool_name": "create_employee",
                "requires_approval": False,
                "order_index": 0,
                "dep_indices": [],
            },
            {
                "name": "Prepare Onboarding Email",
                "description": "Prepare a welcome onboarding email for the new employee",
                "assigned_agent": "executor",
                "tool_name": "prepare_email",
                "requires_approval": False,
                "order_index": 1,
                "dep_indices": [0],
            },
            {
                "name": "Approve Email Sending",
                "description": "Manager must approve the email content before it is sent to the new employee",
                "assigned_agent": "monitor",
                "tool_name": "",
                "requires_approval": True,
                "order_index": 2,
                "dep_indices": [1],
            },
            {
                "name": "Send Onboarding Email",
                "description": "Send the approved onboarding email to the new employee",
                "assigned_agent": "executor",
                "tool_name": "send_email",
                "requires_approval": False,
                "order_index": 3,
                "dep_indices": [2],
            },
            {
                "name": "Assign Mandatory Training",
                "description": "Assign mandatory compliance and onboarding training modules",
                "assigned_agent": "executor",
                "tool_name": "assign_training",
                "requires_approval": False,
                "order_index": 4,
                "dep_indices": [0],
            },
        ]
    },
    "failure_demo": {
        "tasks": [
            {
                "name": "Create Employee Record",
                "description": "Create a new employee record",
                "assigned_agent": "executor",
                "tool_name": "create_employee",
                "requires_approval": False,
                "order_index": 0,
                "dep_indices": [],
            },
            {
                "name": "Assign Training (with retry demo)",
                "description": "Assign training with simulated failures to demonstrate retry mechanism",
                "assigned_agent": "executor",
                "tool_name": "assign_training",
                "requires_approval": False,
                "order_index": 1,
                "dep_indices": [0],
            },
        ]
    },
}


def _detect_template(objective: str) -> str:
    """Detect which demo template to use based on the objective."""
    obj_lower = objective.lower()
    if any(kw in obj_lower for kw in ["onboard", "new employee", "hire", "recruit"]):
        return "onboard"
    if any(kw in obj_lower for kw in ["failure", "retry", "demo", "test"]):
        return "failure_demo"
    return "onboard"  # default


def _extract_employee_name(objective: str) -> Optional[str]:
    """Try to extract a proper name from the objective string."""
    # Look for "named X" or "for X" patterns
    patterns = [
        r'named\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'employee\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
    ]
    for pattern in patterns:
        match = re.search(pattern, objective, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Avoid common words
            if name.lower() not in {"the", "a", "an", "new", "this", "that", "our"}:
                return name
    return None


def _build_tool_inputs(task_def: dict, employee_name: str, workflow_id: str) -> dict:
    """Build appropriate tool inputs based on tool name."""
    tool = task_def["tool_name"]
    if tool == "create_employee":
        return {"name": employee_name, "workflow_id": workflow_id}
    elif tool == "prepare_email":
        return {
            "recipient": employee_name,
            "subject": f"Welcome to the Team, {employee_name}!",
            "body": (
                f"Dear {employee_name},\n\n"
                "Welcome to the organization! We are thrilled to have you on board.\n\n"
                "Your first day will include:\n"
                "• Team introduction\n"
                "• System access setup\n"
                "• Mandatory training assignment\n\n"
                "Please don't hesitate to reach out if you have any questions.\n\n"
                "Best regards,\nHR Department"
            ),
            "workflow_id": workflow_id,
        }
    elif tool == "send_email":
        return {"workflow_id": workflow_id}
    elif tool == "assign_training":
        return {
            "employee_name": employee_name,
            "training_name": "New Employee Orientation & Compliance Training",
            "training_type": "mandatory",
            "workflow_id": workflow_id,
        }
    return {}


def plan_with_demo(
    db: Session,
    workflow_id: str,
    objective: str,
    simulate_failure: bool = False,
) -> List[Dict[str, Any]]:
    """
    Generate a deterministic task plan using templates.
    Does NOT call Claude API.
    """
    template_key = "failure_demo" if simulate_failure else _detect_template(objective)
    template = DEMO_TEMPLATES.get(template_key, DEMO_TEMPLATES["onboard"])
    task_defs = template["tasks"]

    employee_name = _extract_employee_name(objective) or "New Employee"

    # Create tasks in DB
    created_tasks = []
    for task_def in task_defs:
        tool_input = _build_tool_inputs(task_def, employee_name, workflow_id)
        task = create_task(
            db,
            workflow_id=workflow_id,
            name=task_def["name"],
            description=task_def["description"],
            assigned_agent=task_def["assigned_agent"],
            tool_name=task_def["tool_name"],
            tool_input=tool_input,
            requires_approval=task_def["requires_approval"],
            order_index=task_def["order_index"],
        )
        created_tasks.append(task)

    # Set up dependencies
    for i, task_def in enumerate(task_defs):
        for dep_idx in task_def["dep_indices"]:
            add_task_dependency(db, created_tasks[i].id, created_tasks[dep_idx].id)

    log_event(
        db, workflow_id, "planning_completed_demo_mode", "info",
        output_data={
            "template": template_key,
            "task_count": len(created_tasks),
            "employee_name": employee_name,
        }
    )

    return created_tasks


def plan_with_ai(
    db: Session,
    workflow_id: str,
    objective: str,
) -> List[Dict[str, Any]]:
    """
    Generate a task plan using Claude API.
    Falls back to demo mode if API key is missing or call fails.
    """
    if not settings.ANTHROPIC_API_KEY:
        log_event(
            db, workflow_id,
            "ai_planning_skipped_no_api_key",
            "warning",
            output_data={"fallback": "demo_mode"}
        )
        return plan_with_demo(db, workflow_id, objective)

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        available_tools = [
            "create_employee", "get_employee",
            "prepare_email", "send_email",
            "assign_training", "get_training_status",
        ]

        system_prompt = """You are a workflow planning AI for VYUHAM, an enterprise workflow orchestration system.
Your task is to analyze a user's objective and generate a structured JSON task plan.

Available tools (ONLY use these exact names):
- create_employee: Create employee record (no approval required)
- get_employee: Retrieve employee record (no approval required)
- prepare_email: Prepare an email message (no approval required)
- send_email: Send a prepared email (REQUIRES APPROVAL - always set requires_approval=true for this tool)
- assign_training: Assign training to employee (no approval required)
- get_training_status: Check training status (no approval required)

Return ONLY a valid JSON array of tasks, each with these fields:
{
  "name": "Short task name",
  "description": "Clear description",
  "assigned_agent": "executor",
  "tool_name": "one_of_available_tools",
  "requires_approval": false,
  "order_index": 0,
  "depends_on": []  // list of task name indices (0-based) this task depends on
}

Rules:
- send_email ALWAYS requires_approval: true
- Dependencies must be valid (no circular deps)
- Keep tasks focused and atomic
- Maximum 6 tasks"""

        user_message = f"Create a workflow plan for this objective:\n\n{objective}"

        response = client.messages.create(
            model="claude-3-haiku-20240307",  # Use cheaper model for planning
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        content = response.content[0].text
        # Extract JSON from response
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON array found in AI response")

        task_defs = json.loads(json_match.group())

        employee_name = _extract_employee_name(objective) or "New Employee"

        # Create tasks in DB
        created_tasks = []
        for i, task_def in enumerate(task_defs):
            tool_input = _build_tool_inputs(
                {"tool_name": task_def.get("tool_name", "")},
                employee_name,
                workflow_id
            )
            task = create_task(
                db,
                workflow_id=workflow_id,
                name=task_def.get("name", f"Task {i+1}"),
                description=task_def.get("description", ""),
                assigned_agent=task_def.get("assigned_agent", "executor"),
                tool_name=task_def.get("tool_name", ""),
                tool_input=tool_input,
                requires_approval=task_def.get("requires_approval", False),
                order_index=i,
            )
            created_tasks.append(task)

        # Set dependencies
        for i, task_def in enumerate(task_defs):
            for dep_idx in task_def.get("depends_on", []):
                if isinstance(dep_idx, int) and 0 <= dep_idx < len(created_tasks) and dep_idx != i:
                    add_task_dependency(db, created_tasks[i].id, created_tasks[dep_idx].id)

        log_event(
            db, workflow_id, "planning_completed_ai_mode", "info",
            output_data={"task_count": len(created_tasks), "employee_name": employee_name}
        )

        return created_tasks

    except Exception as e:
        log_event(
            db, workflow_id, "ai_planning_failed", "warning",
            error_message=str(e),
            output_data={"fallback": "demo_mode"}
        )
        return plan_with_demo(db, workflow_id, objective)


def run_planner(
    db: Session,
    workflow_id: str,
    objective: str,
    execution_mode: str = "demo",
    simulate_failure: bool = False,
) -> List[Dict[str, Any]]:
    """Main entry point for the Planner Agent."""
    log_event(
        db, workflow_id,
        "planner_agent_started",
        "info",
        agent_name="planner",
        input_data={"objective": objective, "mode": execution_mode},
    )

    if execution_mode == "ai":
        tasks = plan_with_ai(db, workflow_id, objective)
    else:
        tasks = plan_with_demo(db, workflow_id, objective, simulate_failure)

    log_event(
        db, workflow_id,
        "planner_agent_completed",
        "success",
        agent_name="planner",
        output_data={"tasks_generated": len(tasks)},
    )

    return tasks
