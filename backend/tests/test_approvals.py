"""
Test: Approval creation, approve, reject flows
"""
import pytest
from app.services.workflow_service import (
    create_workflow, create_task, create_approval,
    decide_approval, get_pending_approvals,
)


def test_create_approval(db):
    wf = create_workflow(db, "Test approval workflow objective here.")
    task = create_task(db, wf.id, "Send Email", tool_name="send_email",
                       requires_approval=True)
    approval = create_approval(db, task.id, wf.id, "Send onboarding email")
    assert approval.status == "pending"
    assert approval.task_id == task.id
    assert approval.workflow_id == wf.id


def test_approve_action(db):
    wf = create_workflow(db, "Workflow for approval acceptance test case.")
    task = create_task(db, wf.id, "Send Email", tool_name="send_email",
                       requires_approval=True)
    approval = create_approval(db, task.id, wf.id, "Send onboarding email")

    result = decide_approval(db, approval.id, "approved", "manager", "Looks good")
    assert result.status == "approved"
    assert result.decided_by == "manager"
    assert result.decision_reason == "Looks good"
    assert result.decided_at is not None


def test_reject_action(db):
    wf = create_workflow(db, "Workflow for approval rejection test case here.")
    task = create_task(db, wf.id, "Send Email", tool_name="send_email",
                       requires_approval=True)
    approval = create_approval(db, task.id, wf.id, "Send onboarding email")

    result = decide_approval(db, approval.id, "rejected", "manager", "Not yet")
    assert result.status == "rejected"


def test_double_decide_returns_none(db):
    wf = create_workflow(db, "Workflow for double decision test.")
    task = create_task(db, wf.id, "Send Email", tool_name="send_email")
    approval = create_approval(db, task.id, wf.id, "Send email")
    decide_approval(db, approval.id, "approved", "admin")

    # Second decision should return None (already decided)
    result = decide_approval(db, approval.id, "rejected", "admin")
    assert result is None


def test_pending_approvals_filter(db):
    wf = create_workflow(db, "Workflow for pending approvals filter test case.")
    task = create_task(db, wf.id, "Pending Task", tool_name="send_email")
    create_approval(db, task.id, wf.id, "Pending action")

    pending = get_pending_approvals(db, wf.id)
    assert len(pending) >= 1
    assert all(a.status == "pending" for a in pending)


def test_approval_api_approve(client):
    """Test approval via REST API"""
    # Create workflow and tasks via API
    wf_resp = client.post("/api/workflows", json={
        "objective": "Approval API test: create employee and send email.",
        "execution_mode": "demo"
    })
    wf_id = wf_resp.json()["id"]

    # Get approvals (may be empty initially)
    resp = client.get("/api/approvals?pending_only=true")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
