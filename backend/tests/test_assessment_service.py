from __future__ import annotations

import os
import sys

import pytest
from bson import ObjectId

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db.mongo import get_db
from services.assessment_service import AssessmentService
from tests._test_support import build_assessment_payload, cleanup_user_data


def test_submit_assessment_saves_assessment_and_returns_plan(monkeypatch):
    db = get_db()
    email = "assessment_service_test@example.com"
    cleanup_user_data(email=email)

    user_id = str(
        db.users.insert_one(
            {
                "email": email,
                "passwordHash": "hash",
                "preferredName": "Cody",
                "emailVerified": False,
                "createdAt": __import__("datetime").datetime.now(__import__("datetime").UTC),
            }
        ).inserted_id
    )
    session_id = str(
        db.sessions.insert_one(
            {
                "userId": ObjectId(user_id),
                "mode": "chat",
                "status": "active",
                "title": "Assessment Service Test",
                "messageCount": 0,
                "startedAt": __import__("datetime").datetime.now(__import__("datetime").UTC),
                "endedAt": None,
                "createdAt": __import__("datetime").datetime.now(__import__("datetime").UTC),
                "localOnly": False,
                "syncedAt": None,
            }
        ).inserted_id
    )

    service = AssessmentService()

    monkeypatch.setattr(
        service.model_service,
        "predict_addiction_score",
        lambda payload: {
            "model": "social_media_addiction_rf",
            "addiction_score": 7,
            "risk_level": "High",
            "probabilities": {"high": 0.8},
        },
    )
    monkeypatch.setattr(
        service.model_service,
        "predict_dependence_risk",
        lambda payload: {
            "model": "social_media_users_rf",
            "predicted_class": 2,
            "risk_level": "High",
            "probabilities": {"2": 0.75},
        },
    )

    payload = build_assessment_payload(user_id, session_id)
    result = service.submit_assessment(payload)

    assert "assessmentId" in result
    assert result["addictionResult"]["resultId"]
    assert result["addictionResult"]["topTriggers"]
    assert result["addictionResult"]["recommendations"]
    assert result["dependenceResult"]["resultId"]
    assert result["plan"]["assessmentId"] == result["assessmentId"]
    assert result["plan"]["topTriggers"]

    saved_assessment = db.assessments.find_one({"_id": ObjectId(result["assessmentId"])})
    assert saved_assessment is not None
    assert saved_assessment["answers"]["Age"] == "20"
    assert saved_assessment["triggerAnalysis"]["topTriggers"]
    assert saved_assessment["addictionResult"]["resultId"] == result["addictionResult"]["resultId"]

    cleanup_user_data(email=email, user_id=user_id)
