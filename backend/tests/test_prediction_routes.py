from __future__ import annotations

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import uuid

import pytest

from app import create_app
from db.mongo import get_db

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def cleanup_user(email: str):
    db = get_db()
    db.users.delete_many({"email": email})


def setup_user_and_session(client):
    email = f"pred_{uuid.uuid4().hex[:8]}@example.com"

    register_response = client.post("/api/auth/register", json={
        "email": email,
        "password": "UrgeEase123",
        "preferredName": "Cody",
    })
    assert register_response.status_code == 201
    user_id = register_response.get_json()["userId"]

    session_response = client.post("/api/sessions", json={
        "userId": user_id,
        "mode": "chat",
        "title": "Prediction Test",
    })
    assert session_response.status_code == 201
    session_id = session_response.get_json()["sessionId"]

    return user_id, session_id, email


def test_predict_addiction_score(client):
    user_id, session_id, email = setup_user_and_session(client)

    payload = {
        "userId": user_id,
        "sessionId": session_id,
        "Age": 21,
        "Gender": "Female",
        "Avg_Daily_Usage_Hours": 5,
        "Affects_Academic_Performance": 4,
        "Sleep_Hours_Per_Night": 6,
        "Mental_Health_Score": 5,
        "Relationship_Status": "Single",
        "Conflicts_Over_Social_Media": 3,
        "topTriggers": ["late night use", "boredom"],
        "recommendations": ["set a bedtime cutoff", "replace scrolling with reading"]
    }

    response = client.post("/api/predict/addiction-score", json=payload)
    data = response.get_json()

    assert response.status_code == 200
    assert "addiction_score" in data
    assert "risk_level" in data
    assert "resultId" in data
    assert data["model"] == "social_media_addiction_rf"

    cleanup_user(email)


def test_predict_addiction_score_missing_fields(client):
    response = client.post("/api/predict/addiction-score", json={
        "Age": 21
    })
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"


def test_predict_dependence_risk(client):
    user_id, session_id, email = setup_user_and_session(client)

    payload = {
        "userId": user_id,
        "sessionId": session_id,
        "Age": 22,
        "Gender": "Female",
        "Relationship_Status": "Single",
        "Occupation_Status": "Student",
        "Mindless_Use": 4,
        "Distraction_When_Busy": 4,
        "Restless_Without_SM": 3,
        "Distractibility_Score": 4,
        "Worry_Score": 3,
        "Concentration_Difficulty": 4,
        "Social_Comparison": 3,
        "Validation_Seeking": 4,
        "Depression_Frequency": 2,
        "Interest_Fluctuation": 3,
        "Sleep_Issues": 4,
        "Daily_Usage_Hours": 4.5,
        "Platform_Count": 3
    }

    response = client.post("/api/predict/dependence-risk", json=payload)
    data = response.get_json()

    assert response.status_code == 200
    assert "predicted_class" in data
    assert "risk_level" in data
    assert "resultId" in data
    assert data["model"] == "social_media_users_rf"

    cleanup_user(email)


def test_predict_dependence_risk_missing_fields(client):
    response = client.post("/api/predict/dependence-risk", json={
        "Age": 22
    })
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"