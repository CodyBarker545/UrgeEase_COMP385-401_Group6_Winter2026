from __future__ import annotations

import os
import sys
from datetime import UTC, datetime

from bson import ObjectId

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db.mongo import get_db
from services.plan_service import PlanService
from tests._test_support import cleanup_user_data


def test_create_plan_archives_previous_active_plan():
    db = get_db()
    email = "plan_service_test@example.com"
    cleanup_user_data(email=email)

    user_id = str(
        db.users.insert_one(
            {
                "email": email,
                "passwordHash": "hash",
                "preferredName": "Cody",
                "emailVerified": False,
                "createdAt": datetime.now(UTC),
            }
        ).inserted_id
    )
    session_id = str(
        db.sessions.insert_one(
            {
                "userId": ObjectId(user_id),
                "mode": "chat",
                "status": "active",
                "title": "Plan Service Test",
                "messageCount": 0,
                "startedAt": datetime.now(UTC),
                "endedAt": None,
                "createdAt": datetime.now(UTC),
                "localOnly": False,
                "syncedAt": None,
            }
        ).inserted_id
    )
    old_assessment_id = str(
        db.assessments.insert_one(
            {
                "userId": ObjectId(user_id),
                "sessionId": ObjectId(session_id),
                "submittedAt": datetime.now(UTC),
                "answers": {"Age": "20"},
            }
        ).inserted_id
    )

    db.plans.insert_one(
        {
            "userId": ObjectId(user_id),
            "assessmentId": ObjectId(old_assessment_id),
            "sessionId": ObjectId(session_id),
            "createdAt": datetime.now(UTC),
            "reviewDate": datetime.now(UTC),
            "status": "active",
            "focusArea": "mindless_use",
            "riskLevel": "Moderate",
            "summary": "Old plan",
            "goals": ["Goal"],
            "actions": [],
        }
    )

    new_assessment_id = str(
        db.assessments.insert_one(
            {
                "userId": ObjectId(user_id),
                "sessionId": ObjectId(session_id),
                "submittedAt": datetime.now(UTC),
                "answers": {"Age": "21"},
            }
        ).inserted_id
    )

    service = PlanService()
    plan = service.create_plan(
        user_id=user_id,
        assessment_id=new_assessment_id,
        session_id=session_id,
        answers={
            "Distraction_When_Busy": "5",
            "Distractibility_Score": "5",
            "Concentration_Difficulty": "4",
            "Sleep_Issues": "1",
            "Sleep_Hours_Per_Night": "7",
        },
        latest_result={"risk_level": "High"},
    )

    assert plan["status"] == "active"
    assert plan["focusArea"] == "distractibility"
    assert len(plan["actions"]) == 3

    archived_count = db.plans.count_documents({"userId": ObjectId(user_id), "status": "archived"})
    assert archived_count >= 1

    active_plan = service.get_active_plan(user_id)
    assert active_plan is not None
    assert active_plan["planId"] == plan["planId"]

    updated_plan = service.update_action_status(plan["planId"], "action_1", True)
    updated_action = next(action for action in updated_plan["actions"] if action["id"] == "action_1")
    assert updated_action["completed"] is True

    cleanup_user_data(email=email, user_id=user_id)
