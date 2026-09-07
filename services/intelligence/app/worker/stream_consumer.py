import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
import redis

from app.core.config import STREAM_KEY, CONSUMER_GROUP, ALERTS_CHANNEL, FORMULA_VERSION
from app.core.database import SessionLocal
from app.core.redis_client import get_redis_client
from app.models.schema import User, Task, WorkEvent, WorkloadScore
from app.engine.workload import (
    calculate_w_total,
    calculate_t_assigned,
    calculate_h_tracked,
    PR_REVIEW_DIFF_WEIGHTS,
)
from app.engine.fragmentation import calculate_fragmentation_score

logger = logging.getLogger("equiflow.worker")
logging.basicConfig(level=logging.INFO)


def init_consumer_group(r: redis.Redis):
    """Ensure the consumer group exists on the Redis stream."""
    try:
        r.xgroup_create(STREAM_KEY, CONSUMER_GROUP, id="0", mkstream=True)
        logger.info(f"[STREAM CONSUMER] Created group {CONSUMER_GROUP} on stream {STREAM_KEY}")
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            logger.debug(f"[STREAM CONSUMER] Group {CONSUMER_GROUP} already exists.")
        else:
            raise e


def resolve_user(db: Session, user_identifier: str) -> Optional[User]:
    """Resolve a user by github_username or slack_id."""
    user = (
        db.query(User)
        .filter((User.github_username == user_identifier) | (User.slack_id == user_identifier))
        .first()
    )
    return user


def recalculate_user_score(db: Session, r: redis.Redis, user: User) -> dict:
    """Recalculate W_total for a user based on latest tasks and events, and record workload_score."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. T_assigned from open tasks
    open_tasks = (
        db.query(Task)
        .filter(Task.assigned_to == user.id, Task.status.in_(["TODO", "IN_PROGRESS"]))
        .all()
    )
    task_dicts = [
        {"hours_remaining": t.hours_remaining, "due_date": t.due_date}
        for t in open_tasks
    ]
    t_assigned = calculate_t_assigned(task_dicts, reference_date=now)

    # 2. H_tracked & M_meetings from today's work events
    today_events = (
        db.query(WorkEvent)
        .filter(WorkEvent.user_id == user.id, WorkEvent.created_at >= today_start)
        .all()
    )
    pr_buckets = [e.diff_size_bucket for e in today_events if e.event_type == "GITHUB_PR_REVIEW" and e.diff_size_bucket]
    slack_count = sum(1 for e in today_events if e.event_type == "SLACK_SUPPORT")
    comment_count = sum(1 for e in today_events if e.event_type == "GITHUB_COMMENT")
    m_meetings = sum(e.event_weight_hours for e in today_events if e.event_type == "CALENDAR_MEETING")

    h_tracked = calculate_h_tracked(pr_buckets, slack_count, comment_count)

    # 3. F_fragmentation from sliding 4-hour window
    four_hrs_ago = now - timedelta(hours=4)
    recent_events = (
        db.query(WorkEvent)
        .filter(WorkEvent.user_id == user.id, WorkEvent.created_at >= four_hrs_ago)
        .order_by(WorkEvent.created_at.asc())
        .all()
    )
    event_dicts = [
        {"context_identifier": e.context_identifier, "created_at": e.created_at}
        for e in recent_events
    ]
    f_frag = calculate_fragmentation_score(event_dicts, reference_time=now)

    # 4. Compute W_total
    w_result = calculate_w_total(
        t_assigned=t_assigned,
        h_tracked=h_tracked,
        capacity=user.daily_capacity,
        meetings=m_meetings,
        f_fragmentation=f_frag,
    )

    # 5. Persist WorkloadScore
    score_entry = WorkloadScore(
        user_id=user.id,
        w_total=w_result["w_total"],
        formula_version=FORMULA_VERSION,
        computed_at=now,
    )
    db.add(score_entry)
    db.commit()

    # 6. Check Overload Threshold and Publish to Pub/Sub
    if w_result["is_overloaded"]:
        alert_payload = {
            "type": "OVERLOAD_ALERT",
            "user_id": str(user.id),
            "user_name": user.name,
            "w_total": w_result["w_total"],
            "formula_version": FORMULA_VERSION,
            "breakdown": w_result,
            "timestamp": now.isoformat(),
        }
        r.publish(ALERTS_CHANNEL, json.dumps(alert_payload))
        logger.warning(f"[OVERLOAD ALERT] User {user.name} overloaded: W_total={w_result['w_total']}")

    return w_result


def process_event_message(db: Session, r: redis.Redis, message_data: str) -> bool:
    """Parse and process a single message from the stream."""
    try:
        data = json.loads(message_data)
    except Exception as e:
        logger.error(f"[WORKER] Failed to deserialize message data: {e}")
        return False

    user_identifier = data.get("user_identifier")
    event_type = data.get("event_type")
    payload = data.get("payload", {})

    user = resolve_user(db, user_identifier)
    if not user:
        logger.warning(f"[WORKER] User identifier '{user_identifier}' not found in database. Skipping.")
        return True

    # Determine event weight
    diff_bucket = payload.get("diff_size_bucket")
    if event_type == "GITHUB_PR_REVIEW":
        weight = PR_REVIEW_DIFF_WEIGHTS.get(diff_bucket, 0.75)
    elif event_type == "SLACK_SUPPORT":
        weight = 0.25
    elif event_type == "GITHUB_COMMENT":
        weight = 0.15
    elif event_type == "CALENDAR_MEETING":
        weight = float(payload.get("meeting_hours", 1.0))
    else:
        weight = 0.50

    work_event = WorkEvent(
        user_id=user.id,
        event_type=event_type,
        event_weight_hours=weight,
        diff_size_bucket=diff_bucket,
        context_identifier=payload.get("context_identifier"),
        external_reference=payload.get("external_reference"),
        created_at=datetime.utcnow(),
    )
    db.add(work_event)
    db.commit()

    # Recalculate W_total score
    recalculate_user_score(db, r, user)
    return True


def run_stream_consumer(worker_name: str = "worker-1", max_messages: int = 0):
    """
    Main loop consuming from Redis Stream and processing events.
    If max_messages > 0, stops after processing that many messages (for testing/graceful batches).
    """
    r = get_redis_client()
    init_consumer_group(r)
    logger.info(f"[WORKER {worker_name}] Listening for events on {STREAM_KEY}...")

    processed = 0
    while True:
        try:
            # Read from group
            entries = r.xreadgroup(
                CONSUMER_GROUP,
                worker_name,
                {STREAM_KEY: ">"},
                count=10,
                block=2000,
            )

            if not entries:
                if max_messages > 0 and processed >= max_messages:
                    break
                continue

            with SessionLocal() as db:
                for stream, messages in entries:
                    for msg_id, fields in messages:
                        raw_data = fields.get("data")
                        if raw_data:
                            success = process_event_message(db, r, raw_data)
                            if success:
                                r.xack(STREAM_KEY, CONSUMER_GROUP, msg_id)
                                processed += 1
                                logger.info(f"[WORKER {worker_name}] Processed & ACKed message {msg_id}")

            if max_messages > 0 and processed >= max_messages:
                break

        except redis.exceptions.ConnectionError as e:
            logger.error(f"[WORKER ERROR] Redis connection failed: {e}")
            break
        except Exception as e:
            logger.error(f"[WORKER ERROR] Unexpected error: {e}", exc_info=True)


if __name__ == "__main__":
    run_stream_consumer()
