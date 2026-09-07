from typing import Optional, Tuple


def calculate_skill_multiplier(
    proficiency_level: Optional[int],
    source: str = "inferred",
) -> Tuple[float, bool]:
    """
    Spec Section 3.2:
    S_multiplier:
      - Expert Match: 0.8 (Level 3)
      - Standard Match: 1.0 (Level 2)
      - Novice / Skill Mismatch: 1.5 - 2.0 (Level 1 or unset)

    Returns:
      (multiplier: float, is_inferred: bool)
    """
    is_inferred = (source == "inferred" or source == "none" or proficiency_level is None)

    if proficiency_level == 3:
        return 0.8, is_inferred
    elif proficiency_level == 2:
        return 1.0, is_inferred
    elif proficiency_level == 1:
        return 1.5, is_inferred
    else:
        # Unset / mismatch
        return 1.5, True
