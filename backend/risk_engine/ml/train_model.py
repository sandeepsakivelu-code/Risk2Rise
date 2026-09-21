"""Train and persist the academic student-risk classification model."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BASE_DIR / "risk_engine" / "data" / "student_risk_training.csv"
MODEL_DIR = BASE_DIR / "risk_engine" / "ml"
MODEL_PATH = MODEL_DIR / "risk_model.joblib"
PREPROCESSING_PATH = MODEL_DIR / "preprocessing.joblib"

NUMERIC_FEATURES = [
    "attendance_percentage",
    "average_marks_percentage",
    "assignment_completion_percentage",
]
CATEGORICAL_FEATURES = ["recent_performance_trend"]
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = "risk_level"


def main() -> None:
    # Load only the synthetic training data and select the model contract fields.
    dataset = pd.read_csv(DATA_PATH)
    features = dataset[FEATURE_COLUMNS]
    target = dataset[TARGET_COLUMN]

    # One-hot encoding keeps trend values categorical and preserves the fitted
    # category order for future prediction requests.
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", "passthrough", NUMERIC_FEATURES),
            (
                "trend",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    train_features, test_features, train_target, test_target = train_test_split(
        features,
        target,
        test_size=0.20,
        random_state=42,
        stratify=target,
    )

    transformed_train_features = preprocessor.fit_transform(train_features)
    transformed_test_features = preprocessor.transform(test_features)

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(transformed_train_features, train_target)
    predictions = model.predict(transformed_test_features)

    # Report standard classification metrics so training can be checked quickly.
    print(f"Dataset rows: {len(dataset)}")
    print(f"Training rows: {len(train_features)}")
    print(f"Testing rows: {len(test_features)}")
    print(f"Accuracy: {accuracy_score(test_target, predictions):.4f}")
    print("\nClassification report:")
    print(classification_report(test_target, predictions, zero_division=0))
    print("Confusion matrix (rows=true, columns=predicted):")
    print(confusion_matrix(test_target, predictions, labels=model.classes_))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(
        {
            "preprocessor": preprocessor,
            "feature_columns": FEATURE_COLUMNS,
            "numeric_features": NUMERIC_FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "target_column": TARGET_COLUMN,
            "classes": list(model.classes_),
        },
        PREPROCESSING_PATH,
    )

    print(f"\nSaved model: {MODEL_PATH}")
    print(f"Saved preprocessing: {PREPROCESSING_PATH}")


if __name__ == "__main__":
    main()
