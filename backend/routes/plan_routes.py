from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.plan_service import PlanService

plan_bp = Blueprint("plan", __name__)
plan_service = PlanService()


@plan_bp.get("/plans/user/<user_id>/active")
def get_active_plan(user_id: str):
    try:
        plan = plan_service.get_active_plan(user_id)
        if not plan:
            return jsonify({"error": "No active plan found"}), 404
        return jsonify(plan), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Fetch active plan failed: {exc}"}), 500


@plan_bp.patch("/plans/<plan_id>/actions/<action_id>")
def update_action_status(plan_id: str, action_id: str):
    payload = request.get_json(silent=True)
    if payload is None or "completed" not in payload:
        return jsonify({"error": "Missing required field: completed"}), 400

    try:
        updated = plan_service.update_action_status(plan_id, action_id, bool(payload["completed"]))
        return jsonify(updated), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"error": f"Update plan action failed: {exc}"}), 500
