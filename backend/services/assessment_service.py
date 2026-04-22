from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from db.mongo import get_db
from services.model_service import ModelService
from services.plan_service import PlanService
from services.result_service import ResultService
from services.trigger_service import TriggerService


class AssessmentService:
    def __init__(self) -> None:
        self.model_service = ModelService()
        self.result_service = ResultService()
        self.plan_service = PlanService()
        self.trigger_service = TriggerService()

    @staticmethod
    def _build_answers(payload: dict[str, Any]) -> dict[str, Any]:
        return {
            key: value
            for key, value in payload.items()
            if key not in {"userId", "sessionId"}
        }

    def submit_assessment(self, payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()

        addiction_result = self.model_service.predict_addiction_score(payload)
        dependence_result = self.model_service.predict_dependence_risk(payload)
        answers = self._build_answers(payload)
        trigger_analysis = self.trigger_service.analyze(answers)
        enriched_payload = {
            **payload,
            **trigger_analysis,
        }

        assessment_doc = {
            "userId": ObjectId(str(payload["userId"]).strip()),
            "sessionId": ObjectId(str(payload["sessionId"]).strip()),
            "submittedAt": datetime.now(UTC),
            "answers": answers,
            "triggerAnalysis": trigger_analysis,
            "addictionResult": {
                **addiction_result,
                **trigger_analysis,
            },
            "dependenceResult": {
                **dependence_result,
            },
        }

        inserted = db.assessments.insert_one(assessment_doc)
        assessment_id = str(inserted.inserted_id)

        addiction_result_id = self.result_service.save_addiction_result(
            enriched_payload,
            addiction_result,
            assessment_id=assessment_id,
        )
        dependence_result_id = self.result_service.save_dependence_result(
            payload,
            dependence_result,
            assessment_id=assessment_id,
        )

        db.assessments.update_one(
            {"_id": inserted.inserted_id},
            {
                "$set": {
                    "addictionResult.resultId": addiction_result_id,
                    "dependenceResult.resultId": dependence_result_id,
                }
            },
        )

        plan = self.plan_service.create_plan(
            user_id=str(payload["userId"]).strip(),
            assessment_id=assessment_id,
            session_id=str(payload["sessionId"]).strip(),
            answers=answers,
            latest_result={**addiction_result, **trigger_analysis},
        )

        return {
            "assessmentId": assessment_id,
            "addictionResult": {
                **addiction_result,
                "resultId": addiction_result_id,
                **trigger_analysis,
            },
            "dependenceResult": {
                **dependence_result,
                "resultId": dependence_result_id,
            },
            "plan": plan,
        }
