import pytest
from datetime import datetime, timedelta
from app.engine.fragmentation import calculate_fragmentation_score


def test_fragmentation_base_score_no_switches():
    """Verify base score of 1.0 when no or 1 context switches occur."""
    now = datetime.now()
    events = [
        {"context_identifier": "repo:org/backend", "created_at": now - timedelta(minutes=60)},
        {"context_identifier": "repo:org/backend", "created_at": now - timedelta(minutes=30)},
    ]
    score = calculate_fragmentation_score(events, reference_time=now)
    assert score == 1.0


def test_fragmentation_first_two_switches_free():
    """Verify Master Spec 3.1 fix: No penalty for the first 2 switches in a 4-hour window."""
    now = datetime.now()
    events = [
        {"context_identifier": "repo:org/backend", "created_at": now - timedelta(minutes=180)},
        {"context_identifier": "repo:org/frontend", "created_at": now - timedelta(minutes=120)}, # Switch 1
        {"context_identifier": "repo:org/backend", "created_at": now - timedelta(minutes=60)},  # Switch 2
    ]
    score = calculate_fragmentation_score(events, reference_time=now)
    assert score == 1.0


def test_fragmentation_penalty_scaling():
    """Verify each switch beyond 2 adds +0.05 penalty."""
    now = datetime.now()
    events = [
        {"context_identifier": "repo:org/backend", "created_at": now - timedelta(minutes=180)},
        {"context_identifier": "repo:org/frontend", "created_at": now - timedelta(minutes=150)}, # Switch 1
        {"context_identifier": "slack:support", "created_at": now - timedelta(minutes=120)},    # Switch 2
        {"context_identifier": "repo:org/backend", "created_at": now - timedelta(minutes=90)},  # Switch 3 -> +0.05
        {"context_identifier": "slack:support", "created_at": now - timedelta(minutes=30)},    # Switch 4 -> +0.05
    ]
    score = calculate_fragmentation_score(events, reference_time=now)
    # Total switches = 4. Switches beyond 2 = 2. Penalty = 2 * 0.05 = 0.10. Score = 1.10
    assert pytest.approx(score, 0.001) == 1.10


def test_fragmentation_penalty_cap_at_1_5x():
    """Verify multiplier is strictly capped at 1.5x maximum."""
    now = datetime.now()
    # Create 15 switches in 4 hours
    events = []
    for i in range(15):
        ctx = f"repo:org/service_{i % 3}"
        events.append({"context_identifier": ctx, "created_at": now - timedelta(minutes=200 - i * 10)})

    score = calculate_fragmentation_score(events, reference_time=now)
    assert score == 1.50


def test_fragmentation_ignores_events_outside_4hr_window():
    """Verify events older than 4 hours are pruned from the calculation."""
    now = datetime.now()
    events = [
        {"context_identifier": "repo:org/a", "created_at": now - timedelta(hours=5)},
        {"context_identifier": "repo:org/b", "created_at": now - timedelta(hours=4, minutes=30)},
        {"context_identifier": "repo:org/c", "created_at": now - timedelta(hours=4, minutes=10)},
        # Events inside 4hr window:
        {"context_identifier": "repo:org/a", "created_at": now - timedelta(hours=2)},
        {"context_identifier": "repo:org/a", "created_at": now - timedelta(hours=1)},
    ]
    score = calculate_fragmentation_score(events, reference_time=now)
    # Inside the 4-hr window there are only repo:org/a events (0 switches) -> Score 1.0
    assert score == 1.0
