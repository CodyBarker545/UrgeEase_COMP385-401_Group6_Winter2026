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


def register_user_and_get_id(client):
    email = f"session_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": email,
        "password": "UrgeEase123",
        "preferredName": "Cody",
    }

    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    user_id = response.get_json()["userId"]

    return user_id, email


def cleanup_sessions_for_user(user_id: str):
    db = get_db()
    db.sessions.delete_many({"userId": {"$exists": True}})


def test_create_session(client):
    user_id, email = register_user_and_get_id(client)

    response = client.post("/api/sessions", json={
        "userId": user_id,
        "mode": "chat",
        "title": "Initial Assessment",
        "localOnly": False,
    })
    data = response.get_json()

    assert response.status_code == 201
    assert "sessionId" in data
    assert data["message"] == "Session created successfully"

    cleanup_user(email)


def test_create_session_missing_fields(client):
    response = client.post("/api/sessions", json={
        "mode": "chat"
    })
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "userId" in data["missing_fields"]


def test_get_user_sessions(client):
    user_id, email = register_user_and_get_id(client)

    create_response = client.post("/api/sessions", json={
        "userId": user_id,
        "mode": "chat",
        "title": "Session One",
        "localOnly": False,
    })
    assert create_response.status_code == 201

    response = client.get(f"/api/sessions/user/{user_id}")
    data = response.get_json()

    assert response.status_code == 200
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
    assert len(data["sessions"]) >= 1

    cleanup_user(email)


def test_get_session_detail(client):
    user_id, email = register_user_and_get_id(client)

    create_response = client.post("/api/sessions", json={
        "userId": user_id,
        "mode": "chat",
        "title": "Detail Test",
        "localOnly": False,
    })
    session_id = create_response.get_json()["sessionId"]

    response = client.get(f"/api/sessions/detail/{session_id}")
    data = response.get_json()

    assert response.status_code == 200
    assert data["sessionId"] == session_id
    assert data["mode"] == "chat"
    assert data["title"] == "Detail Test"

    cleanup_user(email)


def test_complete_session(client):
    user_id, email = register_user_and_get_id(client)

    create_response = client.post("/api/sessions", json={
        "userId": user_id,
        "mode": "chat",
        "title": "Complete Test",
    })
    session_id = create_response.get_json()["sessionId"]

    response = client.patch(f"/api/sessions/{session_id}/complete")
    data = response.get_json()

    assert response.status_code == 200
    assert data["message"] == "Session completed successfully"

    cleanup_user(email)


def test_archive_session(client):
    user_id, email = register_user_and_get_id(client)

    create_response = client.post("/api/sessions", json={
        "userId": user_id,
        "mode": "chat",
        "title": "Archive Test",
    })
    session_id = create_response.get_json()["sessionId"]

    response = client.patch(f"/api/sessions/{session_id}/archive")
    data = response.get_json()

    assert response.status_code == 200
    assert data["message"] == "Session archived successfully"

    cleanup_user(email)