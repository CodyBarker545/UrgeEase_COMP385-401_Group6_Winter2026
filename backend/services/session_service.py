from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from bson import ObjectId

from db.mongo import get_db


class SessionService:
    # Creates a new chat or voice session.
    @staticmethod
    def create_session(payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()

        session_doc = {
            "userId": ObjectId(payload["userId"]),
            "mode": payload["mode"],
            "status": "active",
            "title": payload.get("title", "New Session"),
            "messageCount": 0,
            "startedAt": datetime.now(UTC),
            "endedAt": None,
            "createdAt": datetime.now(UTC),
            "localOnly": bool(payload.get("localOnly", False)),
            "syncedAt": None,
        }

        result = db.sessions.insert_one(session_doc)

        return {
            "sessionId": str(result.inserted_id),
            "message": "Session created successfully",
        }

    # Gets all sessions for a user.
    @staticmethod
    def get_user_sessions(user_id: str) -> list[dict[str, Any]]:
        db = get_db()

        cursor = db.sessions.find(
            {"userId": ObjectId(user_id)},
        ).sort("createdAt", -1)

        sessions = []
        for session in cursor:
            sessions.append({
                "sessionId": str(session["_id"]),
                "userId": str(session["userId"]),
                "mode": session["mode"],
                "status": session["status"],
                "title": session.get("title", ""),
                "messageCount": session.get("messageCount", 0),
                "startedAt": session["startedAt"].isoformat() if session.get("startedAt") else None,
                "endedAt": session["endedAt"].isoformat() if session.get("endedAt") else None,
                "createdAt": session["createdAt"].isoformat() if session.get("createdAt") else None,
            })

        return sessions

    # Gets details for one session.
    @staticmethod
    def get_session_detail(session_id: str) -> dict[str, Any] | None:
        db = get_db()

        session = db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            return None

        return {
            "sessionId": str(session["_id"]),
            "userId": str(session["userId"]),
            "mode": session["mode"],
            "status": session["status"],
            "title": session.get("title", ""),
            "messageCount": session.get("messageCount", 0),
            "startedAt": session["startedAt"].isoformat() if session.get("startedAt") else None,
            "endedAt": session["endedAt"].isoformat() if session.get("endedAt") else None,
            "createdAt": session["createdAt"].isoformat() if session.get("createdAt") else None,
            "localOnly": session.get("localOnly", False),
        }

    # Marks a session as completed.
    @staticmethod
    def complete_session(session_id: str) -> None:
        db = get_db()

        result = db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": "completed",
                    "endedAt": datetime.now(UTC),
                }
            }
        )

        if result.matched_count == 0:
            raise ValueError("Session not found")

    # Archives a session.
    @staticmethod
    def archive_session(session_id: str) -> None:
        db = get_db()

        result = db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": "archived"}}
        )

        if result.matched_count == 0:
            raise ValueError("Session not found")
