from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.session_service import SessionService
from utils.validators import require_fields

session_bp = Blueprint("session", __name__)
session_service = SessionService()

CREATE_SESSION_REQUIRED = ["userId", "mode"]


@session_bp.post("/sessions")
def create_session():
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, CREATE_SESSION_REQUIRED)
    if missing:
        return jsonify({"error": "Missing required fields", "missing_fields": missing}), 400

    try:
        result = session_service.create_session(payload)
        return jsonify(result), 201
    except Exception as exc:
        return jsonify({"error": f"Create session failed: {exc}"}), 500


@session_bp.get("/sessions/user/<user_id>")
def get_user_sessions(user_id: str):
    try:
        sessions = session_service.get_user_sessions(user_id)
        return jsonify({"sessions": sessions}), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch sessions failed: {exc}"}), 500


@session_bp.get("/sessions/detail/<session_id>")
def get_session_detail(session_id: str):
    try:
        session = session_service.get_session_detail(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        return jsonify(session), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch session failed: {exc}"}), 500


@session_bp.patch("/sessions/<session_id>/complete")
def complete_session(session_id: str):
    try:
        session_service.complete_session(session_id)
        return jsonify({"message": "Session completed successfully"}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Complete session failed: {exc}"}), 500


@session_bp.patch("/sessions/<session_id>/archive")
def archive_session(session_id: str):
    try:
        session_service.archive_session(session_id)
        return jsonify({"message": "Session archived successfully"}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Archive session failed: {exc}"}), 500