"""
Test: Agents – planner, executor, monitor, recovery
"""
import pytest
from app.services.workflow_service import (
    create_workflow, create_task, list_workflow_tasks, update_task_status,
)
from app.agents.planner import plan_with_demo
from app.agents.recovery import is_recoverable_error, attempt_recovery
from app.agents.monitor import evaluate_dependencies, get_workflow_completion_status
from app.tools.registry import registry


def test_planner_demo_mode_generates_tasks(db):
    wf = create_workflow(db, "Onboard a new employee named TestUser for demo agent test.")
    tasks = plan_with_demo(db, wf.id, wf.objective)
    assert len(tasks) > 0
    assert all(hasattr(t, 'name') for t in tasks)
    assert any(t.tool_name == 'create_employee' for t in tasks)


def test_planner_extracts_employee_name(db):
    wf = create_workflow(db, "Onboard new employee named Alice Smith into the system.")
    tasks = plan_with_demo(db, wf.id, wf.objective)
    # Check tool input contains the name
    import json
    for task in tasks:
        if task.tool_name == 'create_employee' and task.tool_input:
            data = json.loads(task.tool_input)
            assert 'Alice' in data.get('name', '')
            break


def test_tool_registry_blocks_unknown_tool(db):
    """registry.execute() must raise ValueError for unregistered tool names"""
    with pytest.raises(ValueError, match="not registered"):
        registry.execute("arbitrary_evil_function", db, {})


def test_tool_registry_lists_tools():
    tools = registry.list_tools()
    tool_names = [t['name'] for t in tools]
    assert 'create_employee' in tool_names
    assert 'prepare_email' in tool_names
    assert 'send_email' in tool_names
    assert 'assign_training' in tool_names


def test_send_email_requires_approval():
    tools = registry.list_tools()
    send_email = next(t for t in tools if t['name'] == 'send_email')
    assert send_email['requires_approval'] is True


def test_recoverable_error_detection():
    assert is_recoverable_error("Connection timeout occurred") is True
    assert is_recoverable_error("Training portal error") is True
    assert is_recoverable_error("validation error: missing field") is False
    assert is_recoverable_error("not registered") is False
    assert is_recoverable_error("approval not granted") is False
    assert is_recoverable_error("permission denied") is False


def test_dependency_evaluation_no_deps(db):
    wf = create_workflow(db, "Test dependency evaluation with no dependencies here.")
    task = create_task(db, wf.id, "Task A", tool_name="create_employee")
    # No dependencies – should be ready
    result = evaluate_dependencies(db, task)
    assert result is True


def test_workflow_completion_status_all_completed(db):
    wf = create_workflow(db, "Test completion status detection for workflow engine.")
    t1 = create_task(db, wf.id, "Task 1", tool_name="create_employee")
    t2 = create_task(db, wf.id, "Task 2", tool_name="prepare_email")
    update_task_status(db, t1.id, "completed")
    update_task_status(db, t2.id, "completed")
    status = get_workflow_completion_status(db, wf.id)
    assert status == "completed"


def test_recovery_max_retries_exceeded(db):
    wf = create_workflow(db, "Test recovery maximum retry exhaustion logic.")
    task = create_task(db, wf.id, "Failing Task", tool_name="assign_training")
    # Exhaust retries
    task.retry_count = 3
    task.max_retries = 3
    task.status = "failed"
    task.error_message = "Connection timeout"
    db.commit()

    result = attempt_recovery(db, task, wf.id)
    assert result["permanent_failure"] is True
    assert result["retried"] is False


def test_employee_tool_execution(db):
    from app.tools.employee_tools import create_employee
    result = create_employee(db, name="Test Employee Unit", department="Engineering")
    assert result["success"] is True
    assert result["name"] == "Test Employee Unit"
    assert "employee_id" in result


def test_prepare_email_tool(db):
    from app.tools.email_tools import prepare_email
    result = prepare_email(
        db,
        recipient="test@example.com",
        subject="Test Email",
        body="Hello world",
    )
    assert result["success"] is True
    assert result["status"] == "prepared"
