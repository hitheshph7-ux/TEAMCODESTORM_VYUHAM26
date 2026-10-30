"""
Test: Health endpoint and database connectivity
"""
import pytest


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["application"] == "VYUHAM"
    assert data["database"] == "healthy"


def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["application"] == "VYUHAM"
    assert "version" in data


def test_db_connection(db):
    from sqlalchemy import text
    result = db.execute(text("SELECT 1")).fetchone()
    assert result[0] == 1
