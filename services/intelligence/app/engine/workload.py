from datetime import datetime
from typing import List, Dict, Any, Optional

PR_REVIEW_DIFF_WEIGHTS = {
    "XS": 0.25,
    "S": 0.50,
    "M": 0.75,
    "L": 1.25,
    "XL": 2.00,
}

SLACK_THREAD_WEIGHT = 0.25
PR_COMMENT_WEIGHT = 0.15
DEFAULT_TASK_HOURS_FALLBACK = 4.0


def calculate_h_tracked(
    pr_review_buckets: List[str],
    slack_threads: int = 0,
    pr_comments: int = 0,
) -> float:
    """
    Spec Section 3.1:
    H_tracked = (PR_reviews_weighted) + (Slack_threads * 0.25) + (PR_comments * 0.15)
    """
    pr_weighted = sum(PR_REVIEW_DIFF_WEIGHTS.get(b, 0.50) for b in pr_review_buckets)
    slack_weighted = slack_threads * SLACK_THREAD_WEIGHT
    comments_weighted = pr_comments * PR_COMMENT_WEIGHT
    return pr_weighted + slack_weighted + comments_weighted


def calculate_business_days(start_date: datetime, end_date: datetime) -> int:
    """Calculate the number of business days between start_date and end_date."""
    if end_date <= start_date:
        return 0

    cur = start_date
    business_days = 0
    while cur < end_date:
        # Monday is 0 and Sunday is 6
        if cur.weekday() < 5:
            business_days += 1
        cur = cur.replace(day=cur.day + 1) if cur.day < 28 else (cur + (datetime(cur.year, cur.month, 28) - cur)) # safe forward step
    return max(business_days, 1)


def calculate_t_assigned(
    tasks: List[Dict[str, Any]],
    reference_date: Optional[datetime] = None,
) -> float:
    """
    Spec Section 3.1:
    T_assigned: hours due today, prorated across days remaining until due date:
    task_contribution = hours_remaining / max(business_days_until_due, 1)
    Fallback: 4 hours remaining if unestimated.
    """
    if reference_date is None:
        reference_date = datetime.now()

    total_daily_hours = 0.0

    for task in tasks:
        hours = task.get("hours_remaining")
        if hours is None:
            hours = DEFAULT_TASK_HOURS_FALLBACK

        due_date = task.get("due_date")
        if due_date is None:
            days_remaining = 5  # default fallback
        else:
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00")).replace(tzinfo=None)
            elif hasattr(due_date, "tzinfo") and due_date.tzinfo is not None:
                due_date = due_date.replace(tzinfo=None)

            ref = reference_date.replace(tzinfo=None) if reference_date.tzinfo else reference_date
            delta_days = (due_date.date() - ref.date()).days
            days_remaining = max(delta_days, 1)

        contribution = float(hours) / max(days_remaining, 1)
        total_daily_hours += contribution

    return total_daily_hours


def calculate_w_total(
    t_assigned: float,
    h_tracked: float,
    capacity: float = 8.0,
    meetings: float = 0.0,
    f_fragmentation: float = 1.0,
) -> Dict[str, Any]:
    """
    Spec Section 3.1:
    W_total = ( (T_assigned + H_tracked) / max(C_capacity - M_meetings, 0.5) ) * F_fragmentation
    If W_total > 1.0, the user is overloaded.
    """
    raw_capacity_left = capacity - meetings
    effective_denominator = max(raw_capacity_left, 0.5)
    is_capacity_saturated = raw_capacity_left < 0.5

    work_numerator = t_assigned + h_tracked
    ratio = work_numerator / effective_denominator
    w_total = ratio * f_fragmentation

    return {
        "w_total": round(w_total, 4),
        "is_overloaded": w_total > 1.0,
        "is_capacity_saturated": is_capacity_saturated,
        "t_assigned": round(t_assigned, 4),
        "h_tracked": round(h_tracked, 4),
        "effective_capacity": round(effective_denominator, 4),
        "f_fragmentation": round(f_fragmentation, 4),
    }
