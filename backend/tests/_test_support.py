from __future__ import annotations

import os
import sys
import uuid
from typing import Any

from bson import ObjectId

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db.mongo import get_db


def create_user_and_session(
    client,
    *,
    prefix: str,
    session_title: str,
    preferred_name: str = "Cody",
) -> tuple[str, str, str]:
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "UrgeEase123",
            "preferredName": preferred_name,
        },
    )
    assert register_response.status_code == 201
    user_id = register_response.get_json()["userId"]

    session_response = client.post(
        "/api/sessions",
        json={
            "userId": user_id,
            "mode": "chat",
            "title": session_title,
        },
    )
    assert session_response.status_code == 201
    session_id = session_response.get_json()["sessionId"]

    return user_id, session_id, email


def cleanup_user_data(*, email: str | None = None, user_id: str | None = None) -> None:
    db = get_db()
    resolved_user_id = user_id

    if not resolved_user_id and email:
        user = db.users.find_one({"email": email})
        if user:
            resolved_user_id = str(user["_id"])

    object_user_id = ObjectId(resolved_user_id) if resolved_user_id else None

    if object_user_id:
        session_ids = [
            session["_id"]
            for session in db.sessions.find({"userId": object_user_id}, {"_id": 1})
        ]

        db.messages.delete_many({"userId": object_user_id})
        if session_ids:
            db.messages.delete_many({"sessionId": {"$in": session_ids}})

        db.plans.delete_many({"userId": object_user_id})
        db.results.delete_many({"userId": object_user_id})
        db.assessments.delete_many({"userId": object_user_id})
        db.sessions.delete_many({"userId": object_user_id})
        db.users.delete_many({"_id": object_user_id})

    if email:
        db.users.delete_many({"email": email})


def build_assessment_payload(
    user_id: str,
    session_id: str,
    overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "userId": user_id,
        "sessionId": session_id,
        "Age": "20",
        "Gender": "Male",
        "Relationship_Status": "Single",
        "Occupation_Status": "Student",
        "Mindless_Use": "4",
        "Distraction_When_Busy": "5",
        "Restless_Without_SM": "3",
        "Distractibility_Score": "5",
        "Worry_Score": "4",
        "Concentration_Difficulty": "4",
        "Social_Comparison": "4",
        "Validation_Seeking": "3",
        "Depression_Frequency": "3",
        "Interest_Fluctuation": "3",
        "Sleep_Issues": "2",
        "Daily_Usage_Hours": "3.5",
        "Platform_Count": "2",
        "Avg_Daily_Usage_Hours": "2.5",
        "Affects_Academic_Performance": "Yes",
        "Sleep_Hours_Per_Night": "6",
        "Mental_Health_Score": "4",
        "Conflicts_Over_Social_Media": "3",
    }

    if overrides:
        payload.update(overrides)

    return payload
