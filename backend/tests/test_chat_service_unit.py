from __future__ import annotations

import os
import sys
import time

import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.chat_service import ChatService


def test_generate_response_discusses_active_plan(monkeypatch):
    service = ChatService()

    active_plan = {
        "planId": "plan-1",
        "focusArea": "sleep",
        "summary": "Your assessment suggests night-time use and sleep disruption need attention.",
        "actions": [
            {
                "id": "action_1",
                "title": "Protect the last 30 minutes",
                "description": "Avoid social media for the final 30 minutes before bed.",
                "completed": False,
            },
            {
                "id": "action_2",
                "title": "Move the phone away from bed",
                "description": "Charge your phone away from your sleeping area tonight.",
                "completed": False,
            },
        ],
    }

    monkeypatch.setattr(service, "_get_results_for_chat_context", lambda session_id, user_id: ([], user_id))
    monkeypatch.setattr(service, "_build_chat_history", lambda session_id: [])
    monkeypatch.setattr(service.plan_service, "get_active_plan", lambda user_id: active_plan)

    result = service.generate_initial_or_followup_response(
        session_id="session-1",
        user_id="user-1",
        user_message="what does my plan say",
    )

    assert result["fallbackUsed"] is False
    assert result["sources"] == ["active-plan"]
    assert result["activePlan"] == active_plan
    assert "Protect the last 30 minutes" in result["assistantResponse"]
    assert "Avoid social media for the final 30 minutes before bed" in result["assistantResponse"]


def test_generate_response_discusses_baseline_assessment(monkeypatch):
    service = ChatService()
    latest_result = {
        "resultId": "r1",
        "generatedAt": "2026-04-09T12:00:00+00:00",
        "addictionScore": 7,
        "riskLevel": "High",
        "topTriggers": ["sleep", "mindless_use"],
    }

    monkeypatch.setattr(service, "_get_results_for_chat_context", lambda session_id, user_id: ([latest_result], user_id))
    monkeypatch.setattr(service, "_build_chat_history", lambda session_id: [])
    monkeypatch.setattr(service.plan_service, "get_active_plan", lambda user_id: None)

    result = service.generate_initial_or_followup_response(
        session_id="session-1",
        user_id="user-1",
        user_message="what do my assessment results mean",
    )

    assert result["sources"] == ["assessment-results"]
    assert "addiction score of 7" in result["assistantResponse"]
    assert "High risk level" in result["assistantResponse"]
    assert "baseline result" in result["assistantResponse"]
    assert "sleep" in result["assistantResponse"]


def test_generate_response_discusses_worsening_assessment(monkeypatch):
    service = ChatService()
    latest_result = {
        "resultId": "r2",
        "generatedAt": "2026-04-16T12:00:00+00:00",
        "addictionScore": 8,
        "riskLevel": "High",
        "topTriggers": ["validation"],
    }
    previous_result = {
        "resultId": "r1",
        "generatedAt": "2026-04-09T12:00:00+00:00",
        "addictionScore": 4,
        "riskLevel": "Low",
        "topTriggers": ["sleep"],
    }

    monkeypatch.setattr(
        service,
        "_get_results_for_chat_context",
        lambda session_id, user_id: ([latest_result, previous_result], user_id),
    )
    monkeypatch.setattr(service, "_build_chat_history", lambda session_id: [])
    monkeypatch.setattr(service.plan_service, "get_active_plan", lambda user_id: None)

    result = service.generate_initial_or_followup_response(
        session_id="session-1",
        user_id="user-1",
        user_message="is my assessment getting worse",
    )

    assert result["sources"] == ["assessment-results"]
    assert "looks worse" in result["assistantResponse"]
    assert "validation" in result["assistantResponse"]


def test_generate_response_uses_active_plan_in_fallback(monkeypatch):
    service = ChatService()

    monkeypatch.setattr(
        service,
        "_get_results_for_chat_context",
        lambda session_id, user_id: (
            [
                {
                    "resultId": "r1",
                    "generatedAt": "2026-04-09T12:00:00+00:00",
                    "addictionScore": 7,
                    "predictedClass": 2,
                    "riskLevel": "High",
                    "topTriggers": ["distractibility"],
                    "recommendations": ["phone-free focus block"],
                }
            ],
            user_id,
        ),
    )
    monkeypatch.setattr(service, "_build_chat_history", lambda session_id: [])
    monkeypatch.setattr(
        service.plan_service,
        "get_active_plan",
        lambda user_id: {
            "planId": "plan-1",
            "focusArea": "distractibility",
            "summary": "Focus on reducing distractions during study sessions.",
            "actions": [
                {"id": "action_1", "title": "Use one phone-free focus block", "completed": False},
                {"id": "action_2", "title": "Track distraction triggers", "completed": True},
            ],
        },
    )

    class FailingLLM:
        def generate_reply(self, question, chat_history=None):
            raise RuntimeError("Gemini overloaded")

    monkeypatch.setattr("services.chat_service.get_llm_service", lambda: FailingLLM())

    result = service.generate_initial_or_followup_response(
        session_id="session-1",
        user_id="user-1",
        user_message="I keep checking apps while studying",
    )

    assert result["fallbackUsed"] is True
    assert result["activePlan"]["focusArea"] == "distractibility"
    assert "Use one phone-free focus block" in result["assistantResponse"]
    assert result["sources"] == ["demo-fallback"]


def test_save_chat_turn_persists_both_user_and_assistant_messages(monkeypatch):
    service = ChatService()
    captured: list[tuple[str, dict[str, str]]] = []

    def fake_add_message(session_id, payload):
        captured.append((session_id, payload))
        return {"messageId": f"msg-{len(captured)}"}

    monkeypatch.setattr(service.message_service, "add_message", fake_add_message)

    result = service.save_chat_turn(
        session_id="session-1",
        user_id="507f1f77bcf86cd799439011",
        user_message="Help me stay off my phone tonight",
        assistant_message="Try a 30-minute phone-free wind-down before bed.",
    )

    assert result["userMessageId"] == "msg-1"
    assert result["assistantMessageId"] == "msg-2"
    assert len(captured) == 2
    assert captured[0][1]["role"] == "user"
    assert captured[1][1]["role"] == "assistant"


def test_generate_response_falls_back_when_llm_times_out(monkeypatch):
    service = ChatService()

    monkeypatch.setenv("CHAT_LLM_TIMEOUT_SECONDS", "0.01")
    monkeypatch.setattr(
        service,
        "_get_results_for_chat_context",
        lambda session_id, user_id: ([], user_id),
    )
    monkeypatch.setattr(service, "_build_chat_history", lambda session_id: [])
    monkeypatch.setattr(service.plan_service, "get_active_plan", lambda user_id: None)

    class SlowLLM:
        def generate_reply(self, question, chat_history=None):
            time.sleep(1)
            return {"result": "too late", "crisis": False, "source_documents": []}

    monkeypatch.setattr("services.chat_service.get_llm_service", lambda: SlowLLM())

    started = time.perf_counter()
    result = service.generate_initial_or_followup_response(
        session_id="session-1",
        user_id="user-1",
        user_message="hello",
    )
    elapsed = time.perf_counter() - started

    assert elapsed < 0.5
    assert result["fallbackUsed"] is True
    assert result["sources"] == ["demo-fallback"]
    assert "timed out" in result["fallbackReason"]


def test_polish_assistant_response_removes_section_headings_and_sources():
    raw = (
        "1) Supportive response\n"
        "It makes sense that late-night scrolling feels hard to stop.\n\n"
        "2) Practical next steps\n"
        "- Put the phone across the room for 10 minutes.\n"
        "- Try one slow breathing minute before checking again.\n\n"
        "3) Sources used\n"
        "sleep_and_routine/sleep.txt"
    )

    polished = ChatService._polish_assistant_response(raw)

    assert "Supportive response" not in polished
    assert "Practical next steps" not in polished
    assert "Sources used" not in polished
    assert "sleep_and_routine" not in polished
    assert "Put the phone across the room" in polished


def test_polish_assistant_response_caps_long_replies():
    raw = (
        "First sentence. Second sentence. Third sentence. Fourth sentence. "
        "Fifth sentence that should be removed."
    )

    polished = ChatService._polish_assistant_response(raw)

    assert "Fifth sentence" not in polished
    assert polished.endswith("Fourth sentence.")


def test_llm_service_defaults_to_local_without_gemini_key(monkeypatch):
    from services import llm_service

    llm_service.get_llm_service.cache_clear()
    monkeypatch.delenv("CHAT_LLM_PROVIDER", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    captured: dict[str, object] = {}

    class FakeRAGChain:
        def __init__(self, cfg, embeddings, llm_fn):
            captured["llm_fn"] = llm_fn

        def invoke(self, question, chat_history=None):
            return {"result": "local response", "crisis": False, "source_documents": []}

    monkeypatch.setattr(llm_service, "UrgeEaseRAGChain", FakeRAGChain)

    service = llm_service.LLMService()

    assert service.provider == "local"
    assert service.client is None
    assert captured["llm_fn"] is llm_service.local_chat_llm

    llm_service.get_llm_service.cache_clear()
