"""Transparent, deterministic explanations for academic risk predictions."""

import math
from numbers import Real


ALLOWED_RISK_LEVELS = {"Low", "Medium", "High"}
ALLOWED_TRENDS = {"Improving", "Stable", "Declining"}


def _validate_percentage(value: object, field_name: str) -> float:
    """Validate and normalize an academic percentage for explanation rules."""
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field_name} must be a number between 0 and 100.")

    numeric_value = float(value)
    if not math.isfinite(numeric_value) or not 0 <= numeric_value <= 100:
        raise ValueError(f"{field_name} must be between 0 and 100.")
    return numeric_value


def generate_risk_explanation(
    attendance_percentage: object,
    average_marks_percentage: object,
    assignment_completion_percentage: object,
    recent_performance_trend: object,
    risk_level: object,
) -> dict[str, object]:
    """Build a human-readable explanation from transparent academic rules.

    The returned factors are academic indicators requiring attention. They are
    not claims that any individual factor caused the model's prediction.
    """
    attendance = _validate_percentage(attendance_percentage, "attendance_percentage")
    average_marks = _validate_percentage(
        average_marks_percentage, "average_marks_percentage"
    )
    assignment_completion = _validate_percentage(
        assignment_completion_percentage,
        "assignment_completion_percentage",
    )

    if (
        not isinstance(recent_performance_trend, str)
        or recent_performance_trend not in ALLOWED_TRENDS
    ):
        allowed_values = ", ".join(sorted(ALLOWED_TRENDS))
        raise ValueError(
            f"recent_performance_trend must be one of: {allowed_values}."
        )
    if not isinstance(risk_level, str) or risk_level not in ALLOWED_RISK_LEVELS:
        allowed_values = ", ".join(sorted(ALLOWED_RISK_LEVELS))
        raise ValueError(f"risk_level must be one of: {allowed_values}.")

    risk_factors: list[dict[str, object]] = []

    # Each threshold is intentionally explicit so the explanation remains
    # easy to audit and consistent for the same academic input values.
    if attendance < 60:
        risk_factors.append(
            {
                "factor": "Attendance",
                "value": attendance_percentage,
                "message": "Attendance is critically low.",
            }
        )
    elif attendance < 75:
        risk_factors.append(
            {
                "factor": "Attendance",
                "value": attendance_percentage,
                "message": "Attendance is below the expected level.",
            }
        )

    if average_marks < 50:
        risk_factors.append(
            {
                "factor": "Average marks",
                "value": average_marks_percentage,
                "message": "Average marks are low and need attention.",
            }
        )
    elif average_marks < 70:
        risk_factors.append(
            {
                "factor": "Average marks",
                "value": average_marks_percentage,
                "message": "Average marks indicate moderate academic performance.",
            }
        )

    if assignment_completion < 50:
        risk_factors.append(
            {
                "factor": "Assignment completion",
                "value": assignment_completion_percentage,
                "message": "Assignment completion is low.",
            }
        )
    elif assignment_completion < 80:
        risk_factors.append(
            {
                "factor": "Assignment completion",
                "value": assignment_completion_percentage,
                "message": "Some assignments may need attention.",
            }
        )

    if recent_performance_trend == "Declining":
        risk_factors.append(
            {
                "factor": "Recent performance trend",
                "value": recent_performance_trend,
                "message": "Recent performance is declining.",
            }
        )

    if risk_factors:
        summary = "Several academic indicators require attention."
    else:
        summary = "No major warning indicators were detected in the academic data."

    return {
        "risk_level": risk_level,
        "summary": summary,
        "risk_factors": risk_factors,
    }
