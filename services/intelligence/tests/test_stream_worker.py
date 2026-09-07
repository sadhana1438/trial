import json
import pytest
from app.core.database import SessionLocal
from app.core.redis_client import get_redis_client
from app.worker.stream_consumer import process_event_message, resolve_user
from app.models.schema import User, WorkEvent, WorkloadScore


def test_stream_worker_processes_github_pr_event():
    """Verify that the stream consumer worker processes an event and records work_events and workload_score."""
    with SessionLocal() as db:
        user = resolve_user(db, "sarahc")
        if not user:
            pytest.skip("User 'sarahc' not found in database. Ensure seeds are applied.")

        r = get_redis_client()

        event_payload = json.dumps({
            "event_id": "test-uuid-999",
            "event_type": "GITHUB_PR_REVIEW",
            "source": "github",
            "user_identifier": "sarahc",
            "payload": {
                "diff_size_bucket": "M",
                "files_changed": 8,
                "lines_changed": 250,
                "external_reference": "PR #999",
                "context_identifier": "repo:org/backend",
            },
            "timestamp": "2026-09-07T12:00:00Z",
        })

        success = process_event_message(db, r, event_payload)
        assert success is True

        # Verify work event was recorded
        latest_event = (
            db.query(WorkEvent)
            .filter(WorkEvent.user_id == user.id, WorkEvent.external_reference == "PR #999")
            .first()
        )
        assert latest_event is not None
        assert latest_event.event_type == "GITHUB_PR_REVIEW"
        assert latest_event.diff_size_bucket == "M"
        assert latest_event.event_weight_hours == 0.75

        # Verify score was calculated
        latest_score = (
            db.query(WorkloadScore)
            .filter(WorkloadScore.user_id == user.id)
            .order_by(WorkloadScore.computed_at.desc())
            .first()
        )
        assert latest_score is not None
        assert latest_score.formula_version == "v2.0.0"
        assert isinstance(latest_score.w_total, float)
