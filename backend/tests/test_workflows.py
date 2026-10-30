"""
Test: Workflow CRUD, creation, start, cancel
"""
import pytest


def test_create_workflow(client):
    resp = client.post("/api/workflows", json={
        "objective": "Test workflow: onboard a new employee named Test User.",
        "execution_mode": "demo"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["execution_mode"] == "demo"
    assert "id" in data
    return data["id"]


def test_list_workflows(client):
    # Create one first
    client.post("/api/workflows", json={
        "objective": "Test workflow for listing purposes only.",
        "execution_mode": "demo"
    })
    resp = client.get("/api/workflows")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_get_workflow(client):
    create_resp = client.post("/api/workflows", json={
        "objective": "Test workflow for get endpoint test.",
        "execution_mode": "demo"
    })
    wf_id = create_resp.json()["id"]
    resp = client.get(f"/api/workflows/{wf_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == wf_id


def test_get_workflow_not_found(client):
    resp = client.get("/api/workflows/nonexistent-id-12345")
    assert resp.status_code == 404


def test_workflow_status(client):
    create_resp = client.post("/api/workflows", json={
        "objective": "Test workflow for status endpoint.",
        "execution_mode": "demo"
    })
    wf_id = create_resp.json()["id"]
    resp = client.get(f"/api/workflows/{wf_id}/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["workflow_id"] == wf_id
    assert "total_tasks" in data
    assert "completed_tasks" in data


def test_cancel_workflow(client):
    create_resp = client.post("/api/workflows", json={
        "objective": "Test workflow for cancellation test.",
        "execution_mode": "demo"
    })
    wf_id = create_resp.json()["id"]
    resp = client.post(f"/api/workflows/{wf_id}/cancel")
    assert resp.status_code == 200

    # Verify cancelled
    get_resp = client.get(f"/api/workflows/{wf_id}")
    assert get_resp.json()["status"] == "cancelled"


def test_dashboard_stats(client):
    resp = client.get("/api/workflows/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_workflows" in data
    assert "pending_approvals" in data


def test_workflow_objective_too_short(client):
    resp = client.post("/api/workflows", json={
        "objective": "Short",
        "execution_mode": "demo"
    })
    assert resp.status_code == 422  # Validation error
