from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.pipeline import Pipeline


class ModelService:
    # Sets up the service with the helpers it needs.
    def __init__(self) -> None:
        base_dir = Path(__file__).resolve().parents[1]
        models_dir = base_dir / "ml_model" / "models"

        self.addiction_model_path = models_dir / "social_media_addiction_rf.joblib"
        self.users_model_path = models_dir / "social_media_users_rf.joblib"

        if not self.addiction_model_path.exists():
            raise FileNotFoundError(f"Missing addiction model: {self.addiction_model_path}")
        if not self.users_model_path.exists():
            raise FileNotFoundError(f"Missing users model: {self.users_model_path}")

        self.addiction_model: Pipeline = joblib.load(self.addiction_model_path)
        self.users_model: Pipeline = joblib.load(self.users_model_path)

    # Converts a score into a risk label.
    @staticmethod
    def score_to_risk_label(score: int) -> str:
        if 2 <= score <= 4:
            return "Low"
        if 5 <= score <= 6:
            return "Moderate"
        if 7 <= score <= 9:
            return "High"
        return "Unknown"

    # Converts a model class into a dependence label.
    @staticmethod
    def dependence_class_to_label(pred_class: int) -> str:
        mapping = {
            0: "Low",
            1: "Moderate",
            2: "High",
        }
        return mapping.get(pred_class, "Unknown")

    # Converts model probabilities into a dictionary.
    @staticmethod
    def _to_probability_dict(classes: Any, probabilities: Any) -> dict[str, float]:
        return {
            str(cls): float(prob)
            for cls, prob in zip(classes, probabilities)
        }

    # Predicts the addiction score from the request data.
    def predict_addiction_score(self, payload: dict[str, Any]) -> dict[str, Any]:
        df = pd.DataFrame([payload])

        prediction = int(self.addiction_model.predict(df)[0])

        result: dict[str, Any] = {
            "model": "social_media_addiction_rf",
            "addiction_score": prediction,
            "risk_level": self.score_to_risk_label(prediction),
        }

        if hasattr(self.addiction_model, "predict_proba"):
            probs = self.addiction_model.predict_proba(df)[0]
            result["probabilities"] = self._to_probability_dict(
                self.addiction_model.classes_,
                probs,
            )

        return result

    # Predicts the dependence risk from the request data.
    def predict_dependence_risk(self, payload: dict[str, Any]) -> dict[str, Any]:
        df = pd.DataFrame([payload])

        prediction = int(self.users_model.predict(df)[0])

        result: dict[str, Any] = {
            "model": "social_media_users_rf",
            "predicted_class": prediction,
            "risk_level": self.dependence_class_to_label(prediction),
        }

        if hasattr(self.users_model, "predict_proba"):
            probs = self.users_model.predict_proba(df)[0]
            result["probabilities"] = self._to_probability_dict(
                self.users_model.classes_,
                probs,
            )

        return result
