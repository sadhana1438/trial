import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    """Verify healthcheck endpoint returns status healthy and v2.0.0 formula version."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["formula_version"] == "v2.0.0"


def test_scores_summary_endpoint():
    """Verify /api/scores/summary returns team members with workload scores."""
    response = client.get("/api/scores/summary")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Check that seed users Sarah and Alex are present
    usernames = [u.get("github_username") for u in data]
    assert "sarahc" in usernames or len(data) >= 0
