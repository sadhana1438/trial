import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schema import User, Task, TaskDependency, UserSkill, WorkEvent, WorkloadScore
from app.engine.simulation import (
    run_what_if_simulation,
    TaskNode,
    DependencyEdge,
)
from app.engine.workload import (
    calculate_w_total,
    calculate_t_assigned,
    calculate_h_tracked,
)
from app.engine.fragmentation import calculate_fragmentation_score
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


class ReassignmentRequest(BaseModel):
    action: str = "SIMULATE_REASSIGNMENT"
    task_id: str
    current_assignee: str
    proposed_assignee: str


def get_user_current_workload(db: Session, user: User, excluded_task_id: Optional[str] = None, added_task: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Helper to calculate user's W_total under simulated task state."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Tasks
    tasks_query = db.query(Task).filter(Task.assigned_to == user.id, Task.status.in_(["TODO", "IN_PROGRESS"]))
    if excluded_task_id:
        tasks_query = tasks_query.filter(Task.id != uuid.UUID(excluded_task_id))

    task_list = [
        {"hours_remaining": t.hours_remaining, "due_date": t.due_date}
        for t in tasks_query.all()
    ]
    if added_task:
        task_list.append(added_task)

    t_assigned = calculate_t_assigned(task_list, reference_date=now)

    # 2. Hidden work & meetings
    today_events = db.query(WorkEvent).filter(WorkEvent.user_id == user.id, WorkEvent.created_at >= today_start).all()
    pr_buckets = [e.diff_size_bucket for e in today_events if e.event_type == "GITHUB_PR_REVIEW" and e.diff_size_bucket]
    slack_count = sum(1 for e in today_events if e.event_type == "SLACK_SUPPORT")
    comment_count = sum(1 for e in today_events if e.event_type == "GITHUB_COMMENT")
    m_meetings = sum(e.event_weight_hours for e in today_events if e.event_type == "CALENDAR_MEETING")
    h_tracked = calculate_h_tracked(pr_buckets, slack_count, comment_count)

    # 3. Fragmentation
    four_hrs_ago = now - timedelta(hours=4)
    recent_events = db.query(WorkEvent).filter(WorkEvent.user_id == user.id, WorkEvent.created_at >= four_hrs_ago).order_by(WorkEvent.created_at.asc()).all()
    event_dicts = [{"context_identifier": e.context_identifier, "created_at": e.created_at} for e in recent_events]
    f_frag = calculate_fragmentation_score(event_dicts, reference_time=now)

    return calculate_w_total(
        t_assigned=t_assigned,
        h_tracked=h_tracked,
        capacity=user.daily_capacity,
        meetings=m_meetings,
        f_fragmentation=f_frag,
    )


@router.post("/reassign")
def simulate_task_reassignment(
    req: ReassignmentRequest,
    db: Session = Depends(get_db),
):
    """
    Simulate reassigning a task from Member A to Member B.
    Master Spec Section 6:
    1. Clone state
    2. Calculate skill delta
    3. Adjust duration (with handoff penalty if IN_PROGRESS)
    4. Traverse DAG
    5. Check deadlines
    6. Recalculate workloads
    7. Return comparison JSON
    """
    try:
        task_uuid = uuid.UUID(req.task_id)
        current_assignee_uuid = uuid.UUID(req.current_assignee)
        proposed_assignee_uuid = uuid.UUID(req.proposed_assignee)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID provided")

    task = db.query(Task).filter(Task.id == task_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {req.task_id} not found")

    user_a = db.query(User).filter(User.id == current_assignee_uuid).first()
    user_b = db.query(User).filter(User.id == proposed_assignee_uuid).first()
    if not user_a or not user_b:
        raise HTTPException(status_code=404, detail="One or both users not found")

    # Fetch proposed assignee's skill
    user_b_skill = None
    if task.required_skill_id:
        user_b_skill = (
            db.query(UserSkill)
            .filter(UserSkill.user_id == user_b.id, UserSkill.skill_id == task.required_skill_id)
            .first()
        )

    proficiency_level = user_b_skill.proficiency_level if user_b_skill else None
    skill_source = user_b_skill.source if user_b_skill else "none"

    # Fetch all tasks in this project
    project_tasks = db.query(Task).filter(Task.project_id == task.project_id).all()
    tasks_dict: Dict[str, TaskNode] = {
        str(t.id): TaskNode(
            task_id=str(t.id),
            title=t.title,
            assigned_to=str(t.assigned_to) if t.assigned_to else None,
            estimated_hours=t.estimated_hours,
            hours_remaining=t.hours_remaining,
            status=t.status,
            due_date=t.due_date,
            required_skill_id=str(t.required_skill_id) if t.required_skill_id else None,
        )
        for t in project_tasks
    }

    # Fetch all project task dependencies
    task_ids = [t.id for t in project_tasks]
    deps = db.query(TaskDependency).filter(
        TaskDependency.blocking_task_id.in_(task_ids),
        TaskDependency.dependent_task_id.in_(task_ids),
    ).all()

    dependencies = [
        DependencyEdge(
            blocking_task_id=str(d.blocking_task_id),
            dependent_task_id=str(d.dependent_task_id),
            confidence=d.confidence,
        )
        for d in deps
    ]

    # Run DAG Simulation
    sim_result = run_what_if_simulation(
        task_id=str(task.id),
        current_assignee_id=str(user_a.id),
        proposed_assignee_id=str(user_b.id),
        proposed_assignee_skill_level=proficiency_level,
        proposed_assignee_skill_source=skill_source,
        tasks=tasks_dict,
        dependencies=dependencies,
    )

    # Workload Recalculation for Member A (Before vs After)
    member_a_before = get_user_current_workload(db, user_a)
    member_a_after = get_user_current_workload(db, user_a, excluded_task_id=str(task.id))

    # Workload Recalculation for Member B (Before vs After)
    member_b_before = get_user_current_workload(db, user_b)
    added_task_b = {
        "hours_remaining": sim_result["e_new"],
        "due_date": task.due_date,
    }
    member_b_after = get_user_current_workload(db, user_b, added_task=added_task_b)

    # Low-confidence warnings
    warnings = []
    if sim_result["is_inferred_skill"]:
        warnings.append(f"Simulation relies on inferred skill data for {user_b.name}.")
    if sim_result["has_inferred_dependency_crossings"]:
        warnings.append("Simulation crossed one or more inferred dependency edges; downstream schedule risk is estimated.")

    return {
        "status": "success",
        "action": req.action,
        "task": {
            "id": str(task.id),
            "external_id": task.external_id,
            "title": task.title,
            "status": task.status,
            "original_hours_remaining": task.hours_remaining,
            "new_hours_remaining": sim_result["e_new"],
            "duration_delta_hours": sim_result["duration_delta_hours"],
        },
        "simulation_factors": {
            "s_multiplier": sim_result["s_multiplier"],
            "is_inferred_skill": sim_result["is_inferred_skill"],
            "h_handoff": sim_result["h_handoff"],
            "delay_risk": sim_result["delay_risk"],
            "delayed_task_ids": sim_result["delayed_task_ids"],
            "has_inferred_dependency_crossings": sim_result["has_inferred_dependency_crossings"],
        },
        "member_a": {
            "id": str(user_a.id),
            "name": user_a.name,
            "workload_before": member_a_before["w_total"],
            "workload_after": member_a_after["w_total"],
            "is_overloaded_before": member_a_before["is_overloaded"],
            "is_overloaded_after": member_a_after["is_overloaded"],
        },
        "member_b": {
            "id": str(user_b.id),
            "name": user_b.name,
            "workload_before": member_b_before["w_total"],
            "workload_after": member_b_after["w_total"],
            "is_overloaded_before": member_b_before["is_overloaded"],
            "is_overloaded_after": member_b_after["is_overloaded"],
        },
        "warnings": warnings,
    }
