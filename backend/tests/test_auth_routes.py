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


@pytest.fixture
def db():
    return get_db()


def cleanup_user(email: str):
    db = get_db()
    db.users.delete_many({"email": email})


def test_register_valid_user(client):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    cleanup_user(email)

    payload = {
        "email": email,
        "password": "UrgeEase123",
        "preferredName": "Cody",
    }

    response = client.post("/api/auth/register", json=payload)
    data = response.get_json()

    assert response.status_code == 201
    assert data["email"] == email
    assert data["preferredName"] == "Cody"
    assert data["emailVerified"] is False
    assert "userId" in data

    cleanup_user(email)


def test_register_missing_email(client):
    payload = {
        "password": "UrgeEase123",
        "preferredName": "Cody",
    }

    response = client.post("/api/auth/register", json=payload)
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "email" in data["missing_fields"]


def test_register_missing_password(client):
    payload = {
        "email": "cody@example.com",
        "preferredName": "Cody",
    }

    response = client.post("/api/auth/register", json=payload)
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "password" in data["missing_fields"]


def test_register_missing_preferred_name(client):
    payload = {
        "email": "cody@example.com",
        "password": "UrgeEase123",
    }

    response = client.post("/api/auth/register", json=payload)
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"
    assert "preferredName" in data["missing_fields"]


def test_register_duplicate_email(client):
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    cleanup_user(email)

    payload = {
        "email": email,
        "password": "UrgeEase123",
        "preferredName": "Cody",
    }

    first_response = client.post("/api/auth/register", json=payload)
    second_response = client.post("/api/auth/register", json=payload)

    second_data = second_response.get_json()

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_data["error"] == "User already exists"

    cleanup_user(email)


def test_register_empty_json_body(client):
    response = client.post("/api/auth/register", json={})
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required fields"


def test_register_no_body(client):
    response = client.post("/api/auth/register")
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing or invalid JSON body"