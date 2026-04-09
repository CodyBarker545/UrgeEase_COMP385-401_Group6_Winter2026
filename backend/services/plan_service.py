from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId

from db.mongo import get_db


class PlanService:
    def __init__(self) -> None:
        self.db = get_db()

    @staticmethod
    def _to_object_id(raw_id: str, field_name: str) -> ObjectId:
        normalized = str(raw_id).strip()
        if not normalized:
            raise ValueError(f"{field_name} is required")
        return ObjectId(normalized)

    @staticmethod
    def _to_int(raw_value: Any) -> int | None:
        try:
            return int(float(raw_value))
        except (TypeError, ValueError):
            return None

    def _determine_focus_area(self, answers: dict[str, Any]) -> tuple[str, str]:
        scores = {
            "distractibility": max(
                self._to_int(answers.get("Distraction_When_Busy")) or 0,
                self._to_int(answers.get("Distractibility_Score")) or 0,
                self._to_int(answers.get("Concentration_Difficulty")) or 0,
            ),
            "sleep": max(
                self._to_int(answers.get("Sleep_Issues")) or 0,
                10 - (self._to_int(answers.get("Sleep_Hours_Per_Night")) or 8),
            ),
            "validation": max(
                self._to_int(answers.get("Validation_Seeking")) or 0,
                self._to_int(answers.get("Social_Comparison")) or 0,
            ),
            "mindless_use": max(
                self._to_int(answers.get("Mindless_Use")) or 0,
                self._to_int(answers.get("Restless_Without_SM")) or 0,
            ),
        }

        focus_area = max(scores, key=scores.get)
        summary_map = {
            "distractibility": "Your assessment suggests distraction during daily tasks is a key area to work on.",
            "sleep": "Your assessment suggests night-time use and sleep disruption need attention.",
            "validation": "Your assessment suggests social comparison and validation seeking are important triggers.",
            "mindless_use": "Your assessment suggests automatic and restless social media use is a main pattern.",
        }
        return focus_area, summary_map[focus_area]

    @staticmethod
    def _build_actions(focus_area: str) -> list[dict[str, Any]]:
        templates = {
            "distractibility": [
                ("Track distraction triggers", "Write down the time, task, and urge each time social media interrupts your focus."),
                ("Use one phone-free focus block", "Complete one 20-minute work or study block with your phone out of reach."),
                ("Add a delay rule", "When you feel the urge to check an app, wait 10 minutes before opening it."),
            ],
            "sleep": [
                ("Protect the last 30 minutes", "Avoid social media for the final 30 minutes before bed."),
                ("Move the phone away from bed", "Charge your phone away from your sleeping area tonight."),
                ("Replace scrolling", "Use one wind-down activity such as reading, stretching, or music before sleep."),
            ],
            "validation": [
                ("Notice comparison moments", "Track when comparison or validation seeking shows up during the day."),
                ("Reduce exposure", "Mute or avoid one account that reliably triggers comparison."),
                ("Use a reset action", "When comparison starts, step away and do one grounding activity for 2 minutes."),
            ],
            "mindless_use": [
                ("Log automatic opens", "Notice each time you open social media without a clear reason."),
                ("Create one interruption", "Before opening an app, drink water or stand up first."),
                ("Limit one high-risk period", "Choose one part of the day and keep social media off during that window."),
            ],
        }

        actions: list[dict[str, Any]] = []
        for index, (title, description) in enumerate(templates[focus_area], start=1):
            actions.append(
                {
                    "id": f"action_{index}",
                    "title": title,
                    "description": description,
                    "frequency": "daily",
                    "completed": False,
                }
            )
        return actions

    def create_plan(
        self,
        *,
        user_id: str,
        assessment_id: str,
        session_id: str,
        answers: dict[str, Any],
        latest_result: dict[str, Any],
    ) -> dict[str, Any]:
        user_object_id = self._to_object_id(user_id, "userId")
        assessment_object_id = self._to_object_id(assessment_id, "assessmentId")
        session_object_id = self._to_object_id(session_id, "sessionId")

        self.db.plans.update_many(
            {"userId": user_object_id, "status": "active"},
            {"$set": {"status": "archived", "archivedAt": datetime.now(UTC)}},
        )

        focus_area, summary = self._determine_focus_area(answers)
        now = datetime.now(UTC)
        risk_level = latest_result.get("risk_level") or latest_result.get("riskLevel") or "Unknown"

        plan_doc = {
            "userId": user_object_id,
            "assessmentId": assessment_object_id,
            "sessionId": session_object_id,
            "createdAt": now,
            "reviewDate": now + timedelta(days=7),
            "status": "active",
            "focusArea": focus_area,
            "riskLevel": risk_level,
            "summary": summary,
            "goals": [
                "Reduce the impact of your highest-risk trigger pattern.",
                "Practice one repeatable coping step each day this week.",
            ],
            "actions": self._build_actions(focus_area),
        }

        inserted = self.db.plans.insert_one(plan_doc)
        return self.get_plan_by_id(str(inserted.inserted_id))

    def get_active_plan(self, user_id: str) -> dict[str, Any] | None:
        plan = self.db.plans.find_one(
            {"userId": self._to_object_id(user_id, "userId"), "status": "active"},
            sort=[("createdAt", -1)],
        )
        if not plan:
            return None
        return self._serialize_plan(plan)

    def get_plan_by_id(self, plan_id: str) -> dict[str, Any] | None:
        plan = self.db.plans.find_one({"_id": self._to_object_id(plan_id, "planId")})
        if not plan:
            return None
        return self._serialize_plan(plan)

    def update_action_status(self, plan_id: str, action_id: str, completed: bool) -> dict[str, Any]:
        plan_object_id = self._to_object_id(plan_id, "planId")
        result = self.db.plans.update_one(
            {"_id": plan_object_id, "actions.id": action_id},
            {"$set": {"actions.$.completed": bool(completed)}},
        )
        if result.matched_count == 0:
            raise ValueError("Plan or action not found")
        updated = self.get_plan_by_id(plan_id)
        if not updated:
            raise ValueError("Plan not found")
        return updated

    @staticmethod
    def _serialize_plan(plan: dict[str, Any]) -> dict[str, Any]:
        return {
            "planId": str(plan["_id"]),
            "userId": str(plan["userId"]) if plan.get("userId") else None,
            "assessmentId": str(plan["assessmentId"]) if plan.get("assessmentId") else None,
            "sessionId": str(plan["sessionId"]) if plan.get("sessionId") else None,
            "createdAt": plan["createdAt"].isoformat() if plan.get("createdAt") else None,
            "reviewDate": plan["reviewDate"].isoformat() if plan.get("reviewDate") else None,
            "status": plan.get("status"),
            "focusArea": plan.get("focusArea"),
            "riskLevel": plan.get("riskLevel"),
            "summary": plan.get("summary"),
            "goals": plan.get("goals", []),
            "actions": plan.get("actions", []),
        }
