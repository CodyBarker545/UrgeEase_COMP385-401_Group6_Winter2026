from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from bson import ObjectId

from db.mongo import get_db


class ResultService:
    @staticmethod
    def save_addiction_result(payload: dict[str, Any], result: dict[str, Any]) -> str:
        db = get_db()

        doc = {
            "userId": ObjectId(payload["userId"]) if payload.get("userId") else None,
            "sessionId": ObjectId(payload["sessionId"]) if payload.get("sessionId") else None,
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

        doc = {
            "userId": ObjectId(payload["userId"]) if payload.get("userId") else None,
            "sessionId": ObjectId(payload["sessionId"]) if payload.get("sessionId") else None,
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
            {"userId": ObjectId(user_id)}
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
            {"userId": ObjectId(user_id)},
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

        res = db.results.find_one({"_id": ObjectId(result_id)})
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