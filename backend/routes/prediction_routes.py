from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.model_service import ModelService
from services.result_service import ResultService
from utils.validators import require_fields

prediction_bp = Blueprint("prediction", __name__)
model_service = ModelService()
result_service = ResultService()

ADDICTION_REQUIRED_FIELDS = [
    "Age",
    "Gender",
    "Avg_Daily_Usage_Hours",
    "Affects_Academic_Performance",
    "Sleep_Hours_Per_Night",
    "Mental_Health_Score",
    "Relationship_Status",
    "Conflicts_Over_Social_Media",
]

USERS_REQUIRED_FIELDS = [
    "Age",
    "Gender",
    "Relationship_Status",
    "Occupation_Status",
    "Mindless_Use",
    "Distraction_When_Busy",
    "Restless_Without_SM",
    "Distractibility_Score",
    "Worry_Score",
    "Concentration_Difficulty",
    "Social_Comparison",
    "Validation_Seeking",
    "Depression_Frequency",
    "Interest_Fluctuation",
    "Sleep_Issues",
    "Daily_Usage_Hours",
    "Platform_Count",
]


@prediction_bp.post("/predict/addiction-score")
def predict_addiction_score():
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, ADDICTION_REQUIRED_FIELDS)
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing_fields": missing,
        }), 400

    try:
        result = model_service.predict_addiction_score(payload)
        result_id = result_service.save_addiction_result(payload, result)
        return jsonify({**result, "resultId": result_id}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@prediction_bp.post("/predict/dependence-risk")
def predict_dependence_risk():
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, USERS_REQUIRED_FIELDS)
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing_fields": missing,
        }), 400

    try:
        result = model_service.predict_dependence_risk(payload)
        result_id = result_service.save_dependence_result(payload, result)
        return jsonify({**result, "resultId": result_id}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500