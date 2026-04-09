from __future__ import annotations

import os
import sys

import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from db.mongo import get_db
from tests._test_support import build_assessment_payload, cleanup_user_data, create_user_and_session


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def test_submit_assessment_returns_results_and_plan(client):
    user_id, session_id, email = create_user_and_session(
        client,
        prefix="assessment",
        session_title="Assessment Route Test",
    )

    response = client.post(
        "/api/assessments",
        json=build_assessment_payload(user_id, session_id),
    )
    data = response.get_json()

    assert response.status_code == 201
    assert "assessmentId" in data
    assert "addictionResult" in data
    assert "dependenceResult" in data
    assert "resultId" in data["addictionResult"]
    assert "resultId" in data["dependenceResult"]
    assert data["plan"]["userId"] == user_id
    assert data["plan"]["assessmentId"] == data["assessmentId"]

    db = get_db()
    saved_assessment = db.assessments.find_one({"_id": db.assessments.find_one(sort=[("_id", -1)])["_id"]})
    assert saved_assessment is not None

    cleanup_user_data(email=email, user_id=user_id)


def test_submit_assessment_missing_fields(client):
    response = client.post(
        "/api/assessments",
        json={"userId": "abc"},
    )
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "sessionId" in data["missing_fields"]
    assert "Age" in data["missing_fields"]
