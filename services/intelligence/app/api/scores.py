import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models.schema import User, WorkloadScore, WorkEvent, Task, Project
from app.worker.stream_consumer import recalculate_user_score

router = APIRouter(prefix="/api/scores", tags=["Scores"])


@router.get("/summary")
def get_all_users_scores(db: Session = Depends(get_db)):
    """Get latest workload status for all engineers."""
    users = db.query(User).all()
    summary = []

    for user in users:
        latest_score = (
            db.query(WorkloadScore)
            .filter(WorkloadScore.user_id == user.id)
            .order_by(desc(WorkloadScore.computed_at))
            .first()
        )
        summary.append({
            "user_id": str(user.id),
            "name": user.name,
            "role": user.role,
            "github_username": user.github_username,
            "daily_capacity": user.daily_capacity,
            "w_total": latest_score.w_total if latest_score else None,
            "is_overloaded": (latest_score.w_total > 1.0) if latest_score else False,
            "formula_version": latest_score.formula_version if latest_score else None,
            "last_computed_at": latest_score.computed_at.isoformat() if latest_score else None,
        })

    return summary


@router.get("/{user_id}")
def get_user_score(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get detailed workload breakdown and recent work events for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    latest_score = (
        db.query(WorkloadScore)
        .filter(WorkloadScore.user_id == user_id)
        .order_by(desc(WorkloadScore.computed_at))
        .first()
    )

    recent_events = (
        db.query(WorkEvent)
        .filter(WorkEvent.user_id == user_id)
        .order_by(desc(WorkEvent.created_at))
        .limit(10)
        .all()
    )

    assigned_tasks = (
        db.query(Task)
        .filter(Task.assigned_to == user_id, Task.status.in_(["TODO", "IN_PROGRESS"]))
        .all()
    )

    return {
        "user_id": str(user.id),
        "name": user.name,
        "role": user.role,
        "daily_capacity": user.daily_capacity,
        "latest_score": {
            "w_total": latest_score.w_total if latest_score else None,
            "is_overloaded": (latest_score.w_total > 1.0) if latest_score else False,
            "formula_version": latest_score.formula_version if latest_score else None,
            "computed_at": latest_score.computed_at.isoformat() if latest_score else None,
        },
        "tasks_count": len(assigned_tasks),
        "recent_work_events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "weight_hours": e.event_weight_hours,
                "diff_size_bucket": e.diff_size_bucket,
                "context_identifier": e.context_identifier,
                "external_reference": e.external_reference,
                "created_at": e.created_at.isoformat(),
            }
            for e in recent_events
        ],
    }


@router.post("/recalculate/{user_id}")
def trigger_recalculate(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Manually trigger a W_total recalculation for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    r = get_redis_client()
    result = recalculate_user_score(db, r, user)
    return {
        "status": "recalculated",
        "user_id": str(user.id),
        "breakdown": result,
    }
