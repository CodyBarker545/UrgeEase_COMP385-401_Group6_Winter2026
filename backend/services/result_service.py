from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from db.mongo import get_db


class ResultService:
    @staticmethod
    def _normalize_id(raw_id: str, field_name: str) -> str:
        normalized = str(raw_id).strip()
        if not normalized:
            raise ValueError(f"{field_name} is required")
        return normalized

    @classmethod
    def _to_object_id(cls, raw_id: str, field_name: str) -> ObjectId:
        normalized = cls._normalize_id(raw_id, field_name)
        try:
            return ObjectId(normalized)
        except (InvalidId, TypeError) as exc:
            raise ValueError(f"Invalid {field_name}") from exc

    @classmethod
    def _build_user_query(cls, user_id: str) -> dict[str, Any]:
        normalized = cls._normalize_id(user_id, "userId")

        clauses: list[dict[str, Any]] = [{"userId": normalized}]

        try:
            clauses.insert(0, {"userId": cls._to_object_id(normalized, "userId")})
        except ValueError:
            pass

        return {"$or": clauses}

    @staticmethod
    def save_addiction_result(payload: dict[str, Any], result: dict[str, Any]) -> str:
        db = get_db()
        user_id = ResultService._to_object_id(payload.get("userId"), "userId")
        session_id = ResultService._to_object_id(payload.get("sessionId"), "sessionId")

        doc = {
            "userId": user_id,
            "sessionId": session_id,
            "generatedAt": datetime.now(UTC),
            "modelName": result["model"],
            "addictionScore": result["addiction_score"],
            "riskLevel": result["risk_level"],
            "probabilities": result.get("probabilities", {}),
            "topTriggers": payload.get("topTriggers", []),
            "recommendations": payload.get("recommendations", []),
        }

        inserted = db.results.insert_one(doc)
        return str(inserted.inserted_id)

    @staticmethod
    def save_dependence_result(payload: dict[str, Any], result: dict[str, Any]) -> str:
        db = get_db()
        user_id = ResultService._to_object_id(payload.get("userId"), "userId")
        session_id = ResultService._to_object_id(payload.get("sessionId"), "sessionId")

        doc = {
            "userId": user_id,
            "sessionId": session_id,
            "generatedAt": datetime.now(UTC),
            "modelName": result["model"],
            "predictedClass": result["predicted_class"],
            "riskLevel": result["risk_level"],
            "probabilities": result.get("probabilities", {}),
        }

        inserted = db.results.insert_one(doc)
        return str(inserted.inserted_id)

    @staticmethod
    def get_user_results(user_id: str) -> list[dict[str, Any]]:
        db = get_db()

        cursor = db.results.find(
            ResultService._build_user_query(user_id)
        ).sort("generatedAt", -1)

        results = []
        for res in cursor:
            results.append({
                "resultId": str(res["_id"]),
                "userId": str(res["userId"]) if res.get("userId") else None,
                "sessionId": str(res["sessionId"]) if res.get("sessionId") else None,
                "generatedAt": res["generatedAt"].isoformat() if res.get("generatedAt") else None,
                "modelName": res.get("modelName"),
                "addictionScore": res.get("addictionScore"),
                "predictedClass": res.get("predictedClass"),
                "riskLevel": res.get("riskLevel"),
                "probabilities": res.get("probabilities", {}),
                "topTriggers": res.get("topTriggers", []),
                "recommendations": res.get("recommendations", []),
            })

        return results

    @staticmethod
    def get_latest_result(user_id: str) -> dict[str, Any] | None:
        db = get_db()

        res = db.results.find_one(
            ResultService._build_user_query(user_id),
            sort=[("generatedAt", -1)]
        )

        if not res:
            return None

        return {
            "resultId": str(res["_id"]),
            "userId": str(res["userId"]) if res.get("userId") else None,
            "sessionId": str(res["sessionId"]) if res.get("sessionId") else None,
            "generatedAt": res["generatedAt"].isoformat() if res.get("generatedAt") else None,
            "modelName": res.get("modelName"),
            "addictionScore": res.get("addictionScore"),
            "predictedClass": res.get("predictedClass"),
            "riskLevel": res.get("riskLevel"),
            "probabilities": res.get("probabilities", {}),
            "topTriggers": res.get("topTriggers", []),
            "recommendations": res.get("recommendations", []),
        }

    @staticmethod
    def get_result_by_id(result_id: str) -> dict[str, Any] | None:
        db = get_db()

        res = db.results.find_one({"_id": ResultService._to_object_id(result_id, "resultId")})
        if not res:
            return None

        return {
            "resultId": str(res["_id"]),
            "userId": str(res["userId"]) if res.get("userId") else None,
            "sessionId": str(res["sessionId"]) if res.get("sessionId") else None,
            "generatedAt": res["generatedAt"].isoformat() if res.get("generatedAt") else None,
            "modelName": res.get("modelName"),
            "addictionScore": res.get("addictionScore"),
            "predictedClass": res.get("predictedClass"),
            "riskLevel": res.get("riskLevel"),
            "probabilities": res.get("probabilities", {}),
            "topTriggers": res.get("topTriggers", []),
            "recommendations": res.get("recommendations", []),
        }
