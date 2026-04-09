from __future__ import annotations

import os
import sys

import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from tests._test_support import build_assessment_payload, cleanup_user_data, create_user_and_session


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def test_get_active_plan_for_user(client):
    user_id, session_id, email = create_user_and_session(
        client,
        prefix="plan",
        session_title="Plan Route Test",
    )

    assessment_response = client.post(
        "/api/assessments",
        json=build_assessment_payload(user_id, session_id),
    )
    assert assessment_response.status_code == 201

    response = client.get(f"/api/plans/user/{user_id}/active")
    data = response.get_json()

    assert response.status_code == 200
    assert data["userId"] == user_id
    assert data["status"] == "active"
    assert len(data["actions"]) == 3

    cleanup_user_data(email=email, user_id=user_id)


def test_update_plan_action_status(client):
    user_id, session_id, email = create_user_and_session(
        client,
        prefix="planpatch",
        session_title="Plan Patch Test",
    )

    assessment_response = client.post(
        "/api/assessments",
        json=build_assessment_payload(user_id, session_id),
    )
    plan = assessment_response.get_json()["plan"]
    first_action = plan["actions"][0]

    response = client.patch(
        f"/api/plans/{plan['planId']}/actions/{first_action['id']}",
        json={"completed": True},
    )
    data = response.get_json()

    assert response.status_code == 200
    updated_action = next(action for action in data["actions"] if action["id"] == first_action["id"])
    assert updated_action["completed"] is True

    cleanup_user_data(email=email, user_id=user_id)


def test_update_plan_action_status_requires_completed(client):
    response = client.patch(
        "/api/plans/000000000000000000000000/actions/action_1",
        json={},
    )
    data = response.get_json()

    assert response.status_code == 400
    assert data["error"] == "Missing required field: completed"
