from datetime import datetime, timedelta
from typing import List, Dict, Any


def calculate_fragmentation_score(
    events: List[Dict[str, Any]],
    reference_time: datetime | None = None,
) -> float:
    """
    Calculate Cognitive Load Penalty (F_fragmentation) in a sliding 4-hour window.
    Spec Section 3.1:
    - Base 1.0.
    - No penalty for the first 2 distinct project/repo switches in a sliding 4-hour window.
    - Each additional switch beyond 2 adds +0.05.
    - Capped at a 1.5x multiplier total.
    """
    if reference_time is None:
        reference_time = datetime.now()

    window_start = reference_time - timedelta(hours=4)

    # Filter events within the 4-hour sliding window with non-empty context
    valid_events = []
    for evt in events:
        created_at = evt.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00")).replace(tzinfo=None)
        elif hasattr(created_at, "tzinfo") and created_at.tzinfo is not None:
            created_at = created_at.replace(tzinfo=None)

        if created_at and created_at >= window_start:
            ctx = evt.get("context_identifier")
            if ctx:
                valid_events.append((created_at, ctx))

    if len(valid_events) < 2:
        return 1.0

    # Sort chronologically
    valid_events.sort(key=lambda x: x[0])

    # Count context transitions (switches between different repos/projects/channels)
    switches = 0
    prev_context = valid_events[0][1]

    for _, current_context in valid_events[1:]:
        if current_context != prev_context:
            switches += 1
            prev_context = current_context

    if switches <= 2:
        return 1.0

    penalty = (switches - 2) * 0.05
    multiplier = 1.0 + penalty
    return min(multiplier, 1.5)
