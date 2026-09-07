import pytest
from datetime import datetime, timedelta
import networkx as nx

from app.engine.simulation import (
    calculate_skill_multiplier,
    calculate_handoff_penalty,
    calculate_adjusted_duration,
    run_what_if_simulation,
    TaskNode,
    DependencyEdge,
)


def test_skill_multiplier_resolution():
    """Verify S_multiplier: Expert (0.8), Standard (1.0), Novice/Mismatch (1.5-2.0) + confidence flag."""
    # Expert (level 3, manual)
    mult_3, is_inferred_3 = calculate_skill_multiplier(proficiency_level=3, source="manual")
    assert mult_3 == 0.8
    assert is_inferred_3 is False

    # Standard (level 2, inferred)
    mult_2, is_inferred_2 = calculate_skill_multiplier(proficiency_level=2, source="inferred")
    assert mult_2 == 1.0
    assert is_inferred_2 is True

    # Novice (level 1, inferred)
    mult_1, is_inferred_1 = calculate_skill_multiplier(proficiency_level=1, source="inferred")
    assert mult_1 == 1.5
    assert is_inferred_1 is True

    # No match / Unset
    mult_none, is_inferred_none = calculate_skill_multiplier(proficiency_level=None, source="none")
    assert mult_none == 1.5
    assert is_inferred_none is True


def test_handoff_penalty_calculation():
    """Verify H_handoff: 10% of estimated hours (min 1 hr) for IN_PROGRESS; 0 for TODO."""
    # IN_PROGRESS with 20h estimate -> 10% is 2.0h
    assert calculate_handoff_penalty(status="IN_PROGRESS", estimated_hours=20.0) == 2.0

    # IN_PROGRESS with 5h estimate -> 10% is 0.5h -> floored at 1.0h minimum
    assert calculate_handoff_penalty(status="IN_PROGRESS", estimated_hours=5.0) == 1.0

    # TODO task -> 0 handoff cost
    assert calculate_handoff_penalty(status="TODO", estimated_hours=20.0) == 0.0

    # DONE task -> 0
    assert calculate_handoff_penalty(status="DONE", estimated_hours=20.0) == 0.0


def test_adjusted_duration_calculation():
    """Verify E_new = (E_remaining * S_multiplier) + H_handoff."""
    # Remaining 10h, Standard match (1.0), IN_PROGRESS with 15h estimate (1.5h handoff)
    # E_new = (10.0 * 1.0) + 1.5 = 11.5
    dur = calculate_adjusted_duration(
        hours_remaining=10.0,
        estimated_hours=15.0,
        status="IN_PROGRESS",
        s_multiplier=1.0,
    )
    assert pytest.approx(dur, 0.001) == 11.5

    # Remaining 10h, Expert match (0.8), TODO (0.0h handoff)
    # E_new = (10.0 * 0.8) + 0.0 = 8.0
    dur_expert = calculate_adjusted_duration(
        hours_remaining=10.0,
        estimated_hours=15.0,
        status="TODO",
        s_multiplier=0.8,
    )
    assert pytest.approx(dur_expert, 0.001) == 8.0


def test_dag_simulation_and_deadline_risk():
    """Verify NetworkX forward traversal detects downstream deadline breach (delay_risk = True)."""
    now = datetime.now()

    # Create 2 dependent tasks: Task 1 blocks Task 2
    # Task 1: 8h remaining, due in 2 days
    # Task 2: 16h remaining, due in 3 days (tight deadline)
    tasks = {
        "t1": TaskNode(
            task_id="t1",
            title="Backend API",
            assigned_to="user-a",
            estimated_hours=8.0,
            hours_remaining=8.0,
            status="IN_PROGRESS",
            due_date=now + timedelta(days=2),
            required_skill_id="skill-py",
        ),
        "t2": TaskNode(
            task_id="t2",
            title="Frontend Integration",
            assigned_to="user-b",
            estimated_hours=16.0,
            hours_remaining=16.0,
            status="TODO",
            due_date=now + timedelta(days=3),
            required_skill_id="skill-react",
        ),
    }

    dependencies = [
        DependencyEdge(blocking_task_id="t1", dependent_task_id="t2", confidence="explicit"),
    ]

    # Member B has novice skill for t1 (multiplier 1.5) + handoff penalty on IN_PROGRESS (1.0h)
    # E_new for t1 becomes (8.0 * 1.5) + 1.0 = 13.0 hrs
    # This pushes Task 2 past its due date (3 days = 24 hrs work cap)
    sim_result = run_what_if_simulation(
        task_id="t1",
        current_assignee_id="user-a",
        proposed_assignee_id="user-b",
        proposed_assignee_skill_level=1,
        proposed_assignee_skill_source="inferred",
        tasks=tasks,
        dependencies=dependencies,
        reference_time=now,
    )

    assert sim_result["action"] == "SIMULATE_REASSIGNMENT"
    assert sim_result["s_multiplier"] == 1.5
    assert sim_result["h_handoff"] == 1.0
    assert sim_result["e_new"] == 13.0
    assert sim_result["delay_risk"] is True
    assert "t2" in sim_result["delayed_task_ids"]


def test_inferred_edge_tagging_in_traversal():
    """Verify traversal crossing an 'inferred' dependency is tagged as low-confidence."""
    now = datetime.now()

    tasks = {
        "t1": TaskNode(
            task_id="t1",
            title="Core Service",
            assigned_to="user-a",
            estimated_hours=4.0,
            hours_remaining=4.0,
            status="TODO",
            due_date=now + timedelta(days=5),
            required_skill_id="skill-py",
        ),
        "t2": TaskNode(
            task_id="t2",
            title="Worker",
            assigned_to="user-b",
            estimated_hours=4.0,
            hours_remaining=4.0,
            status="TODO",
            due_date=now + timedelta(days=6),
            required_skill_id="skill-py",
        ),
    }

    # Dependency is INFERRED (e.g. mined from commit message)
    dependencies = [
        DependencyEdge(blocking_task_id="t1", dependent_task_id="t2", confidence="inferred"),
    ]

    sim_result = run_what_if_simulation(
        task_id="t1",
        current_assignee_id="user-a",
        proposed_assignee_id="user-b",
        proposed_assignee_skill_level=3,
        proposed_assignee_skill_source="manual",
        tasks=tasks,
        dependencies=dependencies,
        reference_time=now,
    )

    assert sim_result["has_inferred_dependency_crossings"] is True
    assert "t2" in sim_result["inferred_edge_downstream_tasks"]
