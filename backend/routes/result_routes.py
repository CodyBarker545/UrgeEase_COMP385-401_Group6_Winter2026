from __future__ import annotations

from flask import Blueprint, jsonify

from services.result_service import ResultService

result_bp = Blueprint("result", __name__)
result_service = ResultService()


@result_bp.get("/results/user/<user_id>")
def get_user_results(user_id: str):
    try:
        results = result_service.get_user_results(user_id)
        return jsonify({"results": results}), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch results failed: {exc}"}), 500


@result_bp.get("/results/latest/<user_id>")
def get_latest_result(user_id: str):
    try:
        result = result_service.get_latest_result(user_id)
        if not result:
            return jsonify({"error": "No results found"}), 404
        return jsonify(result), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch latest result failed: {exc}"}), 500


@result_bp.get("/results/<result_id>")
def get_result_by_id(result_id: str):
    try:
        result = result_service.get_result_by_id(result_id)
        if not result:
            return jsonify({"error": "Result not found"}), 404
        return jsonify(result), 200
    except Exception as exc:
        return jsonify({"error": f"Fetch result failed: {exc}"}), 500