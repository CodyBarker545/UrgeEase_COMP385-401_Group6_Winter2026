from __future__ import annotations

import os
import sys

import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.chat_service import ChatService


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
