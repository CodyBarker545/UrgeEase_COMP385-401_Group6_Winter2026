from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from bson import ObjectId

from db.mongo import get_db


class MessageService:
    @staticmethod
    def add_message(session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()

        message_doc = {
            "sessionId": ObjectId(session_id),
            "userId": ObjectId(payload["userId"]),
            "role": payload["role"],
            "content": payload["content"],
            "createdAt": datetime.now(UTC),
            "audio": payload.get("audio"),
        }

        result = db.messages.insert_one(message_doc)

        db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$inc": {"messageCount": 1}}
        )

        return {
            "messageId": str(result.inserted_id),
            "message": "Message stored successfully",
        }

    @staticmethod
    def get_session_messages(session_id: str) -> list[dict[str, Any]]:
        db = get_db()

        cursor = db.messages.find(
            {"sessionId": ObjectId(session_id)}
        ).sort("createdAt", 1)

        messages = []
        for msg in cursor:
            messages.append({
                "messageId": str(msg["_id"]),
                "sessionId": str(msg["sessionId"]),
                "userId": str(msg["userId"]),
                "role": msg["role"],
                "content": msg["content"],
                "createdAt": msg["createdAt"].isoformat() if msg.get("createdAt") else None,
                "audio": msg.get("audio"),
            })

        return messages

    @staticmethod
    def delete_message(message_id: str) -> None:
        db = get_db()

        message = db.messages.find_one({"_id": ObjectId(message_id)})
        if not message:
            raise ValueError("Message not found")

        db.messages.delete_one({"_id": ObjectId(message_id)})

        db.sessions.update_one(
            {"_id": message["sessionId"]},
            {"$inc": {"messageCount": -1}}
        )