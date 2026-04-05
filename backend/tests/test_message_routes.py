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
    email = f"msg_{uuid.uuid4().hex[:8]}@example.com"

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
        "title": "Message Test",
    })
    assert session_response.status_code == 201
    session_id = session_response.get_json()["sessionId"]

    return user_id, session_id, email


def test_add_message(client):
    user_id, session_id, email = setup_user_and_session(client)

    response = client.post(f"/api/sessions/{session_id}/messages", json={
        "userId": user_id,
        "role": "user",
        "content": "I spend too much time scrolling before bed."
    })
    data = response.get_json()

    assert response.status_code == 201
    assert "messageId" in data
    assert data["message"] == "Message stored successfully"

    cleanup_user(email)


def test_add_message_missing_fields(client):
    user_id, session_id, email = setup_user_and_session(client)

    response = client.post(f"/api/sessions/{session_id}/messages", json={
        "userId": user_id,
        "role": "user"
    })
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "content" in data["missing_fields"]

    cleanup_user(email)


def test_get_session_messages(client):
    user_id, session_id, email = setup_user_and_session(client)

    add_response = client.post(f"/api/sessions/{session_id}/messages", json={
        "userId": user_id,
        "role": "user",
        "content": "Late-night scrolling is affecting my sleep."
    })
    assert add_response.status_code == 201

    response = client.get(f"/api/sessions/{session_id}/messages")
    data = response.get_json()

    assert response.status_code == 200
    assert "messages" in data
    assert isinstance(data["messages"], list)
    assert len(data["messages"]) >= 1
    assert data["messages"][0]["content"] == "Late-night scrolling is affecting my sleep."

    cleanup_user(email)


def test_delete_message(client):
    user_id, session_id, email = setup_user_and_session(client)

    add_response = client.post(f"/api/sessions/{session_id}/messages", json={
        "userId": user_id,
        "role": "user",
        "content": "This message will be deleted."
    })
    message_id = add_response.get_json()["messageId"]

    response = client.delete(f"/api/messages/{message_id}")
    data = response.get_json()

    assert response.status_code == 200
    assert data["message"] == "Message deleted successfully"

    cleanup_user(email)