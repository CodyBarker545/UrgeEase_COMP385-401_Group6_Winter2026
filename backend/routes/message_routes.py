from __future__ import annotations

from flask import Blueprint, jsonify, request
from services.llm_service import get_llm_service
from services.message_service import MessageService
from utils.validators import require_fields

message_bp = Blueprint("message", __name__)

message_service = MessageService()

CREATE_MESSAGE_REQUIRED = ["userId", "role", "content"]
ASSISTANT_REPLY_REQUIRED = ["userId", "content"]


@message_bp.post("/sessions/<session_id>/messages")
def add_message(session_id: str):
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, CREATE_MESSAGE_REQUIRED)
    if missing:
        return jsonify(
            {"error": "Missing required fields", "missing_fields": missing}
        ), 400

    try:
        result = message_service.add_message(session_id, payload)
        return jsonify(result), 201
    except Exception as exc:
        return jsonify({"error": f"Add message failed: {exc}"}), 500


@message_bp.post("/sessions/<session_id>/assistant-reply")
def generate_assistant_reply(session_id: str):
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, ASSISTANT_REPLY_REQUIRED)
    if missing:
        return jsonify(
            {"error": "Missing required fields", "missing_fields": missing}
        ), 400

    try:
        user_payload = {
            "userId": payload["userId"],
            "role": "user",
            "content": payload["content"],
            "audio": payload.get("audio"),
        }
        user_result = message_service.add_message(session_id, user_payload)

        messages = message_service.get_session_messages(session_id)
        chat_history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in messages[:-1]
            if msg["role"] in {"user", "assistant"}
        ]

        rag_result = get_llm_service().generate_reply(
            question=payload["content"],
            chat_history=chat_history,
        )

        assistant_payload = {
            "userId": payload["userId"],
            "role": "assistant",
            "content": rag_result["result"],
        }
        assistant_result = message_service.add_message(session_id, assistant_payload)

        sources = sorted(
            {
                doc.metadata.get("source", "unknown")
                for doc in rag_result.get("source_documents", [])
            }
        )

        return jsonify(
            {
                "userMessageId": user_result["messageId"],
                "assistantMessageId": assistant_result["messageId"],
                "assistant": {
                    "role": "assistant",
                    "content": rag_result["result"],
                },
                "crisis": rag_result["crisis"],
                "sources": sources,
            }
        ), 200

    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": f"Assistant reply failed: {exc}"}), 500


@message_bp.get("/sessions/<session_id>/messages")
def get_session_messages(session_id: str):
    try:
        messages = message_service.get_session_messages(session_id)
        return jsonify({"messages": messages}), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch messages failed: {exc}"}), 500


@message_bp.delete("/messages/<message_id>")
def delete_message(message_id: str):
    try:
        message_service.delete_message(message_id)
        return jsonify({"message": "Message deleted successfully"}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Delete message failed: {exc}"}), 500