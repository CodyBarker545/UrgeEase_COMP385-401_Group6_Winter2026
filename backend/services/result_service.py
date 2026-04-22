from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from db.mongo import get_db


class ResultService:
    RISK_RANK = {
        "low": 1,
        "moderate": 2,
        "medium": 2,
        "high": 3,
    }

    # Cleans and checks an id string.
    @staticmethod
    def _normalize_id(raw_id: str, field_name: str) -> str:
        normalized = str(raw_id).strip()
        if not normalized:
            raise ValueError(f"{field_name} is required")
        return normalized

    # Converts a string id into a MongoDB ObjectId.
    @classmethod
    def _to_object_id(cls, raw_id: str, field_name: str) -> ObjectId:
        normalized = cls._normalize_id(raw_id, field_name)
        try:
            return ObjectId(normalized)
        except (InvalidId, TypeError) as exc:
            raise ValueError(f"Invalid {field_name}") from exc

    # Builds a database query for a user id.
    @classmethod
    def _build_user_query(cls, user_id: str) -> dict[str, Any]:
        normalized = cls._normalize_id(user_id, "userId")

        # Older test/demo data may store userId as either ObjectId or string.
        clauses: list[dict[str, Any]] = [{"userId": normalized}]

        try:
            clauses.insert(0, {"userId": cls._to_object_id(normalized, "userId")})
        except ValueError:
            pass

        return {"$or": clauses}

    # Figures out what type of result a record contains.
    @staticmethod
    def _infer_result_type(result: dict[str, Any]) -> str:
        result_type = result.get("resultType")
        if result_type:
            return str(result_type)

        # Backfill support for results saved before resultType existed.
        if "addictionScore" in result or result.get("modelName") == "social_media_addiction_rf":
            return "addiction"
        if "predictedClass" in result or result.get("modelName") == "social_media_users_rf":
            return "dependence"
        return "unknown"

    # Converts a result document into API output.
    @staticmethod
    def _serialize_result(result: dict[str, Any]) -> dict[str, Any]:
        return {
            "resultId": str(result["_id"]),
            "userId": str(result["userId"]) if result.get("userId") else None,
            "sessionId": str(result["sessionId"]) if result.get("sessionId") else None,
            "assessmentId": str(result["assessmentId"]) if result.get("assessmentId") else None,
            "generatedAt": result["generatedAt"].isoformat() if result.get("generatedAt") else None,
            "resultType": ResultService._infer_result_type(result),
            "modelName": result.get("modelName"),
            "addictionScore": result.get("addictionScore"),
            "predictedClass": result.get("predictedClass"),
            "riskLevel": result.get("riskLevel"),
            "probabilities": result.get("probabilities", {}),
            "topTriggers": result.get("topTriggers", []),
            "recommendations": result.get("recommendations", []),
        }

    # Builds a query for user results by type.
    @classmethod
    def _build_result_type_query(cls, user_id: str, result_type: str | None = None) -> dict[str, Any]:
        query = cls._build_user_query(user_id)
        if result_type == "addiction":
            query["$and"] = [
                {
                    "$or": [
                        {"resultType": "addiction"},
                        {"addictionScore": {"$exists": True}},
                        {"modelName": "social_media_addiction_rf"},
                    ]
                }
            ]
        elif result_type == "dependence":
            query["$and"] = [
                {
                    "$or": [
                        {"resultType": "dependence"},
                        {"predictedClass": {"$exists": True}},
                        {"modelName": "social_media_users_rf"},
                    ]
                }
            ]
        return query

    # Converts risk text into a sortable rank.
    @classmethod
    def _risk_rank(cls, risk_level: Any) -> int | None:
        if risk_level is None:
            return None
        return cls.RISK_RANK.get(str(risk_level).strip().lower())

    # Describes how a number changed between results.
    @staticmethod
    def _classify_numeric_change(latest: int | float | None, previous: int | float | None) -> str:
        if latest is None or previous is None:
            return "unknown"
        if latest < previous:
            return "improved"
        if latest > previous:
            return "worsened"
        return "unchanged"

    # Describes how risk changed between results.
    @classmethod
    def _classify_risk_change(cls, latest: Any, previous: Any) -> str:
        return cls._classify_numeric_change(cls._risk_rank(latest), cls._risk_rank(previous))

    # Saves the addiction prediction result.
    @staticmethod
    def save_addiction_result(
        payload: dict[str, Any],
        result: dict[str, Any],
        assessment_id: str | None = None,
    ) -> str:
        db = get_db()
        user_id = ResultService._to_object_id(payload.get("userId"), "userId")
        session_id = ResultService._to_object_id(payload.get("sessionId"), "sessionId")

        doc = {
            "userId": user_id,
            "sessionId": session_id,
            "generatedAt": datetime.now(UTC),
            "resultType": "addiction",
            "modelName": result["model"],
            "addictionScore": result["addiction_score"],
            "riskLevel": result["risk_level"],
            "probabilities": result.get("probabilities", {}),
            "topTriggers": payload.get("topTriggers", []),
            "recommendations": payload.get("recommendations", []),
        }

        if assessment_id:
            doc["assessmentId"] = ResultService._to_object_id(assessment_id, "assessmentId")

        inserted = db.results.insert_one(doc)
        return str(inserted.inserted_id)

    # Saves the dependence prediction result.
    @staticmethod
    def save_dependence_result(
        payload: dict[str, Any],
        result: dict[str, Any],
        assessment_id: str | None = None,
    ) -> str:
        db = get_db()
        user_id = ResultService._to_object_id(payload.get("userId"), "userId")
        session_id = ResultService._to_object_id(payload.get("sessionId"), "sessionId")

        doc = {
            "userId": user_id,
            "sessionId": session_id,
            "generatedAt": datetime.now(UTC),
            "resultType": "dependence",
            "modelName": result["model"],
            "predictedClass": result["predicted_class"],
            "riskLevel": result["risk_level"],
            "probabilities": result.get("probabilities", {}),
        }

        if assessment_id:
            doc["assessmentId"] = ResultService._to_object_id(assessment_id, "assessmentId")

        inserted = db.results.insert_one(doc)
        return str(inserted.inserted_id)

    # Gets saved results for a user.
    @staticmethod
    def get_user_results(user_id: str, result_type: str | None = None) -> list[dict[str, Any]]:
        db = get_db()

        cursor = db.results.find(
            ResultService._build_result_type_query(user_id, result_type)
        ).sort("generatedAt", -1)

        results = []
        for res in cursor:
            results.append(ResultService._serialize_result(res))

        return results

    # Gets the most recent result for a user.
    @staticmethod
    def get_latest_result(user_id: str) -> dict[str, Any] | None:
        db = get_db()

        # The frontend expects the latest addiction result because it contains triggers.
        res = db.results.find_one(
            ResultService._build_result_type_query(user_id, "addiction"),
            sort=[("generatedAt", -1)]
        )

        if not res:
            return None

        return ResultService._serialize_result(res)

    # Gets one result by id.
    @staticmethod
    def get_result_by_id(result_id: str) -> dict[str, Any] | None:
        db = get_db()

        res = db.results.find_one({"_id": ResultService._to_object_id(result_id, "resultId")})
        if not res:
            return None

        return ResultService._serialize_result(res)

    # Gets result analytics for a user.
    @staticmethod
    def get_user_analytics(user_id: str) -> dict[str, Any]:
        addiction_results = list(reversed(ResultService.get_user_results(user_id, result_type="addiction")))
        dependence_results = ResultService.get_user_results(user_id, result_type="dependence")

        # Addiction and dependence results are saved separately, so match them by assessment.
        dependence_by_assessment = {
            result.get("assessmentId"): result
            for result in dependence_results
            if result.get("assessmentId")
        }

        timeline: list[dict[str, Any]] = []
        for index, addiction in enumerate(addiction_results, start=1):
            dependence = dependence_by_assessment.get(addiction.get("assessmentId"))
            timeline.append(
                {
                    "assessmentNumber": index,
                    "assessmentId": addiction.get("assessmentId"),
                    "resultId": addiction.get("resultId"),
                    "generatedAt": addiction.get("generatedAt"),
                    "addictionScore": addiction.get("addictionScore"),
                    "addictionRiskLevel": addiction.get("riskLevel"),
                    "dependenceClass": dependence.get("predictedClass") if dependence else None,
                    "dependenceRiskLevel": dependence.get("riskLevel") if dependence else None,
                    "topTriggers": addiction.get("topTriggers", []),
                    "recommendations": addiction.get("recommendations", []),
                }
            )

        latest = timeline[-1] if timeline else None
        previous = timeline[-2] if len(timeline) > 1 else None
        score_change = (
            (latest.get("addictionScore") - previous.get("addictionScore"))
            if latest and previous and latest.get("addictionScore") is not None and previous.get("addictionScore") is not None
            else None
        )
        risk_change = (
            ResultService._classify_risk_change(latest.get("addictionRiskLevel"), previous.get("addictionRiskLevel"))
            if latest and previous
            else "unknown"
        )
        score_trend = (
            ResultService._classify_numeric_change(latest.get("addictionScore"), previous.get("addictionScore"))
            if latest and previous
            else "unknown"
        )

        # Risk level is easier to explain to users, but score breaks ties.
        trend = risk_change if risk_change != "unchanged" else score_trend
        if trend == "unknown":
            trend = score_trend

        trigger_counts: dict[str, int] = {}
        for item in timeline:
            for trigger in item.get("topTriggers", []):
                trigger_counts[trigger] = trigger_counts.get(trigger, 0) + 1

        recurring_triggers = [
            {"trigger": trigger, "count": count}
            for trigger, count in sorted(trigger_counts.items(), key=lambda item: (-item[1], item[0]))
        ]

        summary = "Complete more assessments to see progress over time."
        if latest and previous:
            if trend == "improved":
                summary = "Your latest assessment suggests improvement compared with your previous assessment."
            elif trend == "worsened":
                summary = "Your latest assessment suggests higher current risk than your previous assessment."
            elif trend == "unchanged":
                summary = "Your latest assessment looks broadly stable compared with your previous assessment."
        elif latest:
            summary = "This is your baseline assessment. Future assessments will show whether risk is improving, worsening, or stable."

        return {
            "assessmentCount": len(timeline),
            "latest": latest,
            "previous": previous,
            "scoreChange": score_change,
            "trend": trend,
            "summary": summary,
            "recurringTriggers": recurring_triggers,
            "timeline": timeline,
        }
