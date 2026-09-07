import pytest
from datetime import datetime, timedelta
from app.engine.workload import (
    calculate_w_total,
    calculate_t_assigned,
    calculate_h_tracked,
    PR_REVIEW_DIFF_WEIGHTS,
)


def test_diff_size_weights_match_spec_3_1():
    """Verify PR review weights by diff size according to Master Spec Section 3.1."""
    assert PR_REVIEW_DIFF_WEIGHTS["XS"] == 0.25
    assert PR_REVIEW_DIFF_WEIGHTS["S"] == 0.50
    assert PR_REVIEW_DIFF_WEIGHTS["M"] == 0.75
    assert PR_REVIEW_DIFF_WEIGHTS["L"] == 1.25
    assert PR_REVIEW_DIFF_WEIGHTS["XL"] == 2.00


def test_calculate_h_tracked():
    """Verify H_tracked formula: (PR_reviews_weighted) + (Slack_threads * 0.25) + (PR_comments * 0.15)."""
    # 1 L review (1.25), 1 XS review (0.25) = 1.50
    # 4 Slack threads * 0.25 = 1.00
    # 2 PR comments * 0.15 = 0.30
    # Expected H_tracked = 2.80
    reviews = ["L", "XS"]
    slack_threads = 4
    pr_comments = 2

    h = calculate_h_tracked(pr_review_buckets=reviews, slack_threads=slack_threads, pr_comments=pr_comments)
    assert pytest.approx(h, 0.001) == 2.80


def test_t_assigned_daily_proration():
    """Verify T_assigned proration across remaining business days until due."""
    now = datetime.now()

    # Task A: 12 hours remaining, due in 3 business days -> 12 / 3 = 4.0 hrs/day
    # Task B: 4 hours remaining, due today (0 days) -> clamped to 1 day -> 4.0 hrs/day
    # Task C: unestimated (None) -> fallback 4.0 hrs, due in 2 days -> 4.0 / 2 = 2.0 hrs/day
    tasks = [
        {"hours_remaining": 12.0, "due_date": now + timedelta(days=3)},
        {"hours_remaining": 4.0, "due_date": now},
        {"hours_remaining": None, "due_date": now + timedelta(days=2)},
    ]

    t = calculate_t_assigned(tasks, reference_date=now)
    assert pytest.approx(t, 0.001) == (4.0 + 4.0 + 2.0)


def test_w_total_denominator_floor_protection():
    """Verify denominator (C_capacity - M_meetings) is floored at 0.5 minimum."""
    # Capacity = 8, Meetings = 8 -> 8 - 8 = 0 -> Floored to 0.5
    # T_assigned = 1.0, H_tracked = 0.0, F_frag = 1.0
    # W_total = (1.0 / 0.5) * 1.0 = 2.0
    w_saturated = calculate_w_total(t_assigned=1.0, h_tracked=0.0, capacity=8.0, meetings=8.0, f_fragmentation=1.0)
    assert pytest.approx(w_saturated["w_total"], 0.001) == 2.0
    assert w_saturated["is_capacity_saturated"] is True

    # Capacity = 8, Meetings = 10 (overbooked) -> floored to 0.5
    w_overbooked = calculate_w_total(t_assigned=1.0, h_tracked=0.0, capacity=8.0, meetings=10.0, f_fragmentation=1.0)
    assert pytest.approx(w_overbooked["w_total"], 0.001) == 2.0
    assert w_overbooked["is_capacity_saturated"] is True


def test_w_total_overload_flag():
    """Verify overload condition: W_total > 1.0 flags user as overloaded."""
    # Light workload: (2.0 + 1.0) / (8.0 - 2.0) = 3.0 / 6.0 = 0.50 -> Not overloaded
    w_normal = calculate_w_total(t_assigned=2.0, h_tracked=1.0, capacity=8.0, meetings=2.0, f_fragmentation=1.0)
    assert pytest.approx(w_normal["w_total"], 0.001) == 0.50
    assert w_normal["is_overloaded"] is False

    # Heavy workload: (5.0 + 2.0) / (8.0 - 1.0) = 7.0 / 7.0 = 1.0 -> Threshold
    w_threshold = calculate_w_total(t_assigned=5.0, h_tracked=2.0, capacity=8.0, meetings=1.0, f_fragmentation=1.0)
    assert pytest.approx(w_threshold["w_total"], 0.001) == 1.0
    assert w_threshold["is_overloaded"] is False

    # Overloaded: (6.0 + 2.0) / (8.0 - 1.0) = 8.0 / 7.0 = 1.1428 -> Overloaded
    w_over = calculate_w_total(t_assigned=6.0, h_tracked=2.0, capacity=8.0, meetings=1.0, f_fragmentation=1.0)
    assert w_over["w_total"] > 1.0
    assert w_over["is_overloaded"] is True
