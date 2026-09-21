"""Reusable prediction service for the trained academic risk model."""

from pathlib import Path
from numbers import Real
import math

import joblib
import pandas as pd


ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "risk_model.joblib"
PREPROCESSING_PATH = ML_DIR / "preprocessing.joblib"
ALLOWED_TRENDS = {"Improving", "Stable", "Declining"}

# Load persisted artifacts once when the service module is imported. This avoids
# disk access for every prediction while keeping training out of this module.
_model = joblib.load(MODEL_PATH)
_preprocessing_bundle = joblib.load(PREPROCESSING_PATH)
_preprocessor = _preprocessing_bundle["preprocessor"]
_feature_columns = _preprocessing_bundle["feature_columns"]


def _validate_percentage(value: object, field_name: str) -> float:
    """Return a finite percentage value or raise a clear validation error."""
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field_name} must be a number between 0 and 100.")

    numeric_value = float(value)
    if not math.isfinite(numeric_value) or not 0 <= numeric_value <= 100:
        raise ValueError(f"{field_name} must be between 0 and 100.")
    return numeric_value


def predict_student_risk(
    attendance_percentage: object,
    average_marks_percentage: object,
    assignment_completion_percentage: object,
    recent_performance_trend: object,
) -> dict[str, float | str]:
    """Predict a student's risk level using the saved model and preprocessor.

    Raises:
        ValueError: If a percentage is outside 0-100, non-numeric, or the trend
            is not one of the categories seen during model training.
    """
    validated_trend = recent_performance_trend
    if not isinstance(validated_trend, str) or validated_trend not in ALLOWED_TRENDS:
        allowed_values = ", ".join(sorted(ALLOWED_TRENDS))
        raise ValueError(
            f"recent_performance_trend must be one of: {allowed_values}."
        )

    input_row = pd.DataFrame(
        [
            {
                "attendance_percentage": _validate_percentage(
                    attendance_percentage, "attendance_percentage"
                ),
                "average_marks_percentage": _validate_percentage(
                    average_marks_percentage, "average_marks_percentage"
                ),
                "assignment_completion_percentage": _validate_percentage(
                    assignment_completion_percentage,
                    "assignment_completion_percentage",
                ),
                "recent_performance_trend": validated_trend,
            }
        ]
    )

    # Select the same columns saved during training before applying the fitted
    # encoder, ensuring future API requests use the identical feature contract.
    transformed_input = _preprocessor.transform(input_row[_feature_columns])
    predicted_risk = str(_model.predict(transformed_input)[0])

    result: dict[str, float | str] = {"risk_level": predicted_risk}
    if hasattr(_model, "predict_proba"):
        probabilities = _model.predict_proba(transformed_input)[0]
        predicted_class_index = list(_model.classes_).index(predicted_risk)
        result["confidence"] = float(probabilities[predicted_class_index])

    return result
