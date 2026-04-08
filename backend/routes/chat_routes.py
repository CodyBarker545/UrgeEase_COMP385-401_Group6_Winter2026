from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.chat_service import ChatService
from utils.validators import require_fields

chat_bp = Blueprint("chat", __name__)
chat_service = ChatService()

CHAT_REQUIRED_FIELDS = ["userId"]


@chat_bp.post("/sessions/<session_id>/chat")
def chat_with_assistant(session_id: str):
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, CHAT_REQUIRED_FIELDS)
    if missing:
        return jsonify(
            {"error": "Missing required fields", "missing_fields": missing}
        ), 400

    try:
        user_id = payload["userId"]
        user_message = payload.get("message")

        generated = chat_service.generate_initial_or_followup_response(
            session_id=session_id,
            user_id=user_id,
            user_message=user_message,
        )

        saved = chat_service.save_chat_turn(
            session_id=session_id,
            user_id=user_id,
            user_message=user_message,
            assistant_message=generated["assistantResponse"],
        )

        return jsonify(
            {
                **saved,
                **generated,
            }
        ), 200

    except Exception as exc:
        return jsonify({"error": f"Chat generation failed: {exc}"}), 500