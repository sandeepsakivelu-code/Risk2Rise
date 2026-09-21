"""Transparent, deterministic recommendations for academic interventions."""

import math
from numbers import Real


ALLOWED_RISK_LEVELS = {"Low", "Medium", "High"}
ALLOWED_TRENDS = {"Improving", "Stable", "Declining"}


def _validate_percentage(value: object, field_name: str) -> float:
    """Validate and normalize an academic percentage."""
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field_name} must be a number between 0 and 100.")

    numeric_value = float(value)
    if not math.isfinite(numeric_value) or not 0 <= numeric_value <= 100:
        raise ValueError(f"{field_name} must be between 0 and 100.")
    return numeric_value


def _validate_choice(value: object, allowed_values: set[str], field_name: str) -> str:
    """Validate a categorical recommendation input."""
    if not isinstance(value, str) or value not in allowed_values:
        allowed = ", ".join(sorted(allowed_values))
        raise ValueError(f"{field_name} must be one of: {allowed}.")
    return value


def generate_recommendations(
    attendance_percentage: object,
    average_marks_percentage: object,
    assignment_completion_percentage: object,
    recent_performance_trend: object,
    risk_level: object,
) -> dict[str, object]:
    """Generate deterministic academic intervention recommendations.

    Recommendations describe areas for support and suggested actions. They do
    not claim that any individual factor caused the model's risk prediction.
    """
    attendance = _validate_percentage(attendance_percentage, "attendance_percentage")
    average_marks = _validate_percentage(
        average_marks_percentage, "average_marks_percentage"
    )
    assignment_completion = _validate_percentage(
        assignment_completion_percentage,
        "assignment_completion_percentage",
    )
    trend = _validate_choice(
        recent_performance_trend,
        ALLOWED_TRENDS,
        "recent_performance_trend",
    )
    validated_risk_level = _validate_choice(
        risk_level,
        ALLOWED_RISK_LEVELS,
        "risk_level",
    )

    recommendations: list[dict[str, str]] = []
    supportive = validated_risk_level == "Low"

    if attendance < 60:
        recommendations.append(
            {
                "category": "Attendance",
                "priority": "High",
                "title": "Strengthen class attendance" if supportive else "Improve class attendance",
                "action": (
                    "Continue attending upcoming classes regularly and avoid unnecessary absences."
                    if supportive
                    else "Attend upcoming classes regularly and avoid unnecessary absences."
                ),
            }
        )
    elif attendance < 75:
        recommendations.append(
            {
                "category": "Attendance",
                "priority": "Medium",
                "title": "Maintain regular attendance",
                "action": "Keep attending classes regularly and reduce unnecessary absences.",
            }
        )

    if average_marks < 50:
        recommendations.append(
            {
                "category": "Academic Performance",
                "priority": "High",
                "title": "Build confidence in weak subjects" if supportive else "Focus on weak subjects",
                "action": (
                    "Keep working through challenging subjects and connect with a faculty mentor for support."
                    if supportive
                    else "Focus on weak subjects and meet with a faculty member or mentor."
                ),
            }
        )
    elif average_marks < 70:
        recommendations.append(
            {
                "category": "Academic Performance",
                "priority": "Medium",
                "title": "Review difficult topics",
                "action": "Review difficult topics and practice regularly.",
            }
        )

    if assignment_completion < 50:
        recommendations.append(
            {
                "category": "Assignments",
                "priority": "High",
                "title": "Complete pending assignments",
                "action": "Complete pending assignments and create a submission schedule.",
            }
        )
    elif assignment_completion < 80:
        recommendations.append(
            {
                "category": "Assignments",
                "priority": "Medium",
                "title": "Keep assignments on schedule",
                "action": "Complete pending assignments on time.",
            }
        )

    if trend == "Declining":
        recommendations.append(
            {
                "category": "Performance Trend",
                "priority": "High",
                "title": "Review recent progress" if supportive else "Address the recent performance trend",
                "action": (
                    "Continue monitoring recent progress and connect with a faculty mentor if support would help."
                    if supportive
                    else "Meet with a faculty member or mentor and review recent academic difficulties."
                ),
            }
        )
    elif trend == "Stable":
        recommendations.append(
            {
                "category": "Performance Trend",
                "priority": "Medium",
                "title": "Maintain consistent study habits",
                "action": "Maintain consistent study habits and monitor progress.",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "category": "General",
                "priority": "Low",
                "title": "Maintain current performance",
                "action": "Continue consistent attendance, study habits, and assignment completion.",
            }
        )

    return {
        "risk_level": validated_risk_level,
        "recommendations": recommendations,
    }
