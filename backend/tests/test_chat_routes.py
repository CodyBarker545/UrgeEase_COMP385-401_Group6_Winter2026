from __future__ import annotations

import os
import sys
import uuid

import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from db.mongo import get_db


@pytest.fixture
def client():
    # create test app
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def cleanup_user(email: str):
    # remove test user data
    db = get_db()
    db.users.delete_many({"email": email})


def setup_user_and_session(client):
    # create one user and one session
    email = f"chat_{uuid.uuid4().hex[:8]}@example.com"

    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "UrgeEase123",
            "preferredName": "Cody",
        },
    )
    assert register_response.status_code == 201
    user_id = register_response.get_json()["userId"]

    session_response = client.post(
        "/api/sessions",
        json={
            "userId": user_id,
            "mode": "chat",
            "title": "Chat Test",
        },
    )
    assert session_response.status_code == 201
    session_id = session_response.get_json()["sessionId"]

    return user_id, session_id, email


def test_chat_route_with_user_message(client, monkeypatch):
    user_id, session_id, email = setup_user_and_session(client)

    from routes import chat_routes

    # fake generation
    monkeypatch.setattr(
        chat_routes.chat_service,
        "generate_initial_or_followup_response",
        lambda session_id, user_id, user_message: {
            "assistantResponse": "You are not alone in this. Try a 10 minute delay and put your phone away.",
            "crisis": False,
            "sources": ["coping_strategies.txt"],
            "latestResult": None,
            "previousResultsCount": 0,
        },
    )

    # fake save step
    monkeypatch.setattr(
        chat_routes.chat_service,
        "save_chat_turn",
        lambda session_id, user_id, user_message, assistant_message: {
            "userMessageId": "user-msg-1",
            "assistantMessageId": "assistant-msg-1",
        },
    )

    response = client.post(
        f"/api/sessions/{session_id}/chat",
        json={
            "userId": user_id,
            "message": "I get urges late at night",
        },
    )
    data = response.get_json()

    assert response.status_code == 200
    assert data["assistantResponse"]
    assert data["crisis"] is False
    assert "coping_strategies.txt" in data["sources"]

    cleanup_user(email)


def test_chat_route_missing_user_id(client):
    response = client.post(
        "/api/sessions/fake-session/chat",
        json={
            "message": "help me",
        },
    )
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "userId" in data["missing_fields"]
