import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.schema import User, Task

client = TestClient(app)


def test_reassignment_simulation_api_end_to_end():
    """Verify POST /api/simulation/reassign with seeded database records."""
    with SessionLocal() as db:
        sarah = db.query(User).filter(User.github_username == "sarahc").first()
        alex = db.query(User).filter(User.github_username == "alexr").first()
        task = db.query(Task).filter(Task.external_id == "EQ-101").first()

        if not sarah or not alex or not task:
            pytest.skip("Seed records (sarahc, alexr, EQ-101) not found in database.")

        payload = {
            "action": "SIMULATE_REASSIGNMENT",
            "task_id": str(task.id),
            "current_assignee": str(sarah.id),
            "proposed_assignee": str(alex.id),
        }

        response = client.post("/api/simulation/reassign", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["action"] == "SIMULATE_REASSIGNMENT"
        assert data["task"]["external_id"] == "EQ-101"

        # Alex has level 1 (inferred) in Python -> multiplier 1.5
        factors = data["simulation_factors"]
        assert factors["s_multiplier"] == 1.5
        assert factors["is_inferred_skill"] is True
        assert factors["h_handoff"] == 1.6  # 10% of 16.0h estimate

        # Verify before & after workloads
        member_a = data["member_a"]
        member_b = data["member_b"]
        assert member_a["id"] == str(sarah.id)
        assert member_b["id"] == str(alex.id)
        assert member_a["workload_after"] <= member_a["workload_before"]
        assert member_b["workload_after"] >= member_b["workload_before"]

        # Verify warnings contain low-confidence callout
        assert len(data["warnings"]) > 0
        assert any("inferred" in w.lower() for w in data["warnings"])
