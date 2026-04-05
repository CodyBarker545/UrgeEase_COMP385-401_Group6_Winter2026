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


def register_test_user(client, email: str, password: str = "UrgeEase123", preferred_name: str = "Cody"):
    payload = {
        "email": email,
        "password": password,
        "preferredName": preferred_name,
    }
    return client.post("/api/auth/register", json=payload)


def test_login_valid_user(client):
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    password = "UrgeEase123"

    cleanup_user(email)
    register_response = register_test_user(client, email, password)
    assert register_response.status_code == 201

    response = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    data = response.get_json()

    assert response.status_code == 200
    assert data["email"] == email
    assert data["preferredName"] == "Cody"
    assert "userId" in data

    cleanup_user(email)


def test_login_invalid_password(client):
    email = f"badpw_{uuid.uuid4().hex[:8]}@example.com"
    password = "UrgeEase123"

    cleanup_user(email)
    register_response = register_test_user(client, email, password)
    assert register_response.status_code == 201

    response = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword123",
    })
    data = response.get_json()

    assert response.status_code == 401
    assert data["error"] == "Invalid credentials"

    cleanup_user(email)


def test_login_nonexistent_user(client):
    email = f"missing_{uuid.uuid4().hex[:8]}@example.com"

    cleanup_user(email)

    response = client.post("/api/auth/login", json={
        "email": email,
        "password": "UrgeEase123",
    })
    data = response.get_json()

    assert response.status_code == 401
    assert data["error"] == "Invalid credentials"


def test_login_missing_email(client):
    response = client.post("/api/auth/login", json={
        "password": "UrgeEase123",
    })
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "email" in data["missing_fields"]


def test_login_missing_password(client):
    response = client.post("/api/auth/login", json={
        "email": "cody@example.com",
    })
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "password" in data["missing_fields"]


def test_login_no_body(client):
    response = client.post("/api/auth/login")
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing or invalid JSON body"