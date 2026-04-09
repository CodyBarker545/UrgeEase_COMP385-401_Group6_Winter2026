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


def test_get_user_results_and_latest_and_by_id(client):
    user_id, session_id, email = create_user_and_session(
        client,
        prefix="results",
        session_title="Results Route Test",
    )

    assessment_response = client.post(
        "/api/assessments",
        json=build_assessment_payload(user_id, session_id),
    )
    assessment_data = assessment_response.get_json()
    addiction_result_id = assessment_data["addictionResult"]["resultId"]

    all_response = client.get(f"/api/results/user/{user_id}")
    all_data = all_response.get_json()

    latest_response = client.get(f"/api/results/latest/{user_id}")
    latest_data = latest_response.get_json()

    by_id_response = client.get(f"/api/results/{addiction_result_id}")
    by_id_data = by_id_response.get_json()

    assert all_response.status_code == 200
    assert len(all_data["results"]) >= 2

    assert latest_response.status_code == 200
    assert latest_data["userId"] == user_id

    assert by_id_response.status_code == 200
    assert by_id_data["resultId"] == addiction_result_id
    assert by_id_data["assessmentId"] == assessment_data["assessmentId"]

    cleanup_user_data(email=email, user_id=user_id)


def test_get_latest_result_invalid_user_id(client):
    response = client.get("/api/results/latest/not-an-object-id")
    data = response.get_json()

    assert response.status_code == 404
    assert data["error"] == "No results found"
