from __future__ import annotations

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.result_service import ResultService


def test_infer_result_type_supports_legacy_result_documents():
    assert ResultService._infer_result_type(
        {
            "modelName": "social_media_addiction_rf",
            "addictionScore": 7,
        }
    ) == "addiction"
    assert ResultService._infer_result_type(
        {
            "modelName": "social_media_users_rf",
            "predictedClass": 2,
        }
    ) == "dependence"
    assert ResultService._infer_result_type({"modelName": "unknown"}) == "unknown"


def test_user_analytics_reports_baseline_when_only_one_assessment(monkeypatch):
    addiction_results = [
        {
            "resultId": "result-1",
            "assessmentId": "assessment-1",
            "generatedAt": "2026-04-20T10:00:00+00:00",
            "addictionScore": 7,
            "riskLevel": "High",
            "topTriggers": ["Distraction during work or study"],
            "recommendations": ["Use one 20-minute phone-free focus block."],
        }
    ]
    dependence_results = [
        {
            "resultId": "result-2",
            "assessmentId": "assessment-1",
            "generatedAt": "2026-04-20T10:00:01+00:00",
            "predictedClass": 2,
            "riskLevel": "High",
        }
    ]

    def fake_get_user_results(user_id, result_type=None):
        if result_type == "addiction":
            return addiction_results
        if result_type == "dependence":
            return dependence_results
        return addiction_results + dependence_results

    monkeypatch.setattr(ResultService, "get_user_results", staticmethod(fake_get_user_results))

    analytics = ResultService.get_user_analytics("user-1")

    assert analytics["assessmentCount"] == 1
    assert analytics["trend"] == "unknown"
    assert analytics["scoreChange"] is None
    assert analytics["latest"]["dependenceRiskLevel"] == "High"
    assert "baseline assessment" in analytics["summary"]


def test_user_analytics_classifies_improvement_and_recurring_triggers(monkeypatch):
    addiction_results = [
        {
            "resultId": "result-2",
            "assessmentId": "assessment-2",
            "generatedAt": "2026-04-21T10:00:00+00:00",
            "addictionScore": 5,
            "riskLevel": "Moderate",
            "topTriggers": ["Distraction during work or study", "Night-time use and sleep disruption"],
            "recommendations": ["Use one phone-free focus block."],
        },
        {
            "resultId": "result-1",
            "assessmentId": "assessment-1",
            "generatedAt": "2026-04-20T10:00:00+00:00",
            "addictionScore": 8,
            "riskLevel": "High",
            "topTriggers": ["Distraction during work or study"],
            "recommendations": ["Use one phone-free focus block."],
        },
    ]
    dependence_results = [
        {
            "resultId": "result-4",
            "assessmentId": "assessment-2",
            "generatedAt": "2026-04-21T10:00:01+00:00",
            "predictedClass": 1,
            "riskLevel": "Moderate",
        },
        {
            "resultId": "result-3",
            "assessmentId": "assessment-1",
            "generatedAt": "2026-04-20T10:00:01+00:00",
            "predictedClass": 2,
            "riskLevel": "High",
        },
    ]

    def fake_get_user_results(user_id, result_type=None):
        if result_type == "addiction":
            return addiction_results
        if result_type == "dependence":
            return dependence_results
        return addiction_results + dependence_results

    monkeypatch.setattr(ResultService, "get_user_results", staticmethod(fake_get_user_results))

    analytics = ResultService.get_user_analytics("user-1")

    assert analytics["assessmentCount"] == 2
    assert analytics["trend"] == "improved"
    assert analytics["scoreChange"] == -3
    assert analytics["latest"]["assessmentId"] == "assessment-2"
    assert analytics["previous"]["assessmentId"] == "assessment-1"
    assert analytics["recurringTriggers"][0] == {
        "trigger": "Distraction during work or study",
        "count": 2,
    }
