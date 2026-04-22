from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.message_service import MessageService
from utils.validators import require_fields

message_bp = Blueprint("message", __name__)
message_service = MessageService()

CREATE_MESSAGE_REQUIRED = ["userId", "role", "content"]


# Adds a message to a session.
@message_bp.post("/sessions/<session_id>/messages")
def add_message(session_id: str):
    # store one message
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, CREATE_MESSAGE_REQUIRED)
    if missing:
        return (
            jsonify({"error": "Missing required fields", "missing_fields": missing}),
            400,
        )

    try:
        result = message_service.add_message(session_id, payload)
        return jsonify(result), 201
    except Exception as exc:
        return jsonify({"error": f"Add message failed: {exc}"}), 500


# Gets all messages for a session.
@message_bp.get("/sessions/<session_id>/messages")
def get_session_messages(session_id: str):
    # fetch session messages
    try:
        messages = message_service.get_session_messages(session_id)
        return jsonify({"messages": messages}), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch messages failed: {exc}"}), 500


# Deletes a message by id.
@message_bp.delete("/messages/<message_id>")
def delete_message(message_id: str):
    # delete one message
    try:
        message_service.delete_message(message_id)
        return jsonify({"message": "Message deleted successfully"}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Delete message failed: {exc}"}), 500
