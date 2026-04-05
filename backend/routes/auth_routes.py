from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.auth_service import AuthService
from utils.validators import require_fields

auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()

REGISTER_REQUIRED = ["email", "password", "preferredName"]
LOGIN_REQUIRED = ["email", "password"]


@auth_bp.post("/auth/register")
def register():
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, REGISTER_REQUIRED)
    if missing:
        return jsonify({"error": "Missing required fields", "missing_fields": missing}), 400

    try:
        result = auth_service.register_user(payload)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 409
    except Exception as exc:
        return jsonify({"error": f"Registration failed: {exc}"}), 500


@auth_bp.post("/auth/login")
def login():
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = require_fields(payload, LOGIN_REQUIRED)
    if missing:
        return jsonify({"error": "Missing required fields", "missing_fields": missing}), 400

    try:
        result = auth_service.login_user(payload)
        return jsonify(result), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 401
    except Exception as exc:
        return jsonify({"error": f"Login failed: {exc}"}), 500


@auth_bp.get("/auth/user/<user_id>")
def get_user(user_id: str):
    try:
        user = auth_service.get_user(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch user failed: {exc}"}), 500


@auth_bp.patch("/auth/user/<user_id>")
def update_user(user_id: str):
    payload = request.get_json(silent=True)

    if payload is None:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    try:
        updated = auth_service.update_user(user_id, payload)
        return jsonify(updated), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Update user failed: {exc}"}), 500


@auth_bp.delete("/auth/user/<user_id>")
def delete_user(user_id: str):
    try:
        auth_service.soft_delete_user(user_id)
        return jsonify({"message": "User deleted successfully"}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Delete user failed: {exc}"}), 500