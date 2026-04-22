from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.assessment_service import AssessmentService
from utils.validators import require_fields

assessment_bp = Blueprint("assessment", __name__)
assessment_service = AssessmentService()

ASSESSMENT_REQUIRED_FIELDS = [
    "userId",
    "sessionId",
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
    "Avg_Daily_Usage_Hours",
    "Affects_Academic_Performance",
    "Sleep_Hours_Per_Night",
    "Mental_Health_Score",
    "Conflicts_Over_Social_Media",
]


# Handles assessment submission and returns the results.
@assessment_bp.post("/assessments")
def submit_assessment():
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, ASSESSMENT_REQUIRED_FIELDS)
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing_fields": missing,
        }), 400

    try:
        result = assessment_service.submit_assessment(payload)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Assessment submission failed: {exc}"}), 500
