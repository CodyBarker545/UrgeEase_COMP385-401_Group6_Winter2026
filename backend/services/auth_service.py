from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from bson import ObjectId
from werkzeug.security import check_password_hash, generate_password_hash

from db.mongo import get_db


class AuthService:
    @staticmethod
    def register_user(payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()

        email = payload["email"].strip().lower()
        existing = db.users.find_one({"email": email, "deletedAt": None})

        if existing:
            raise ValueError("User already exists")

        user_doc = {
            "email": email,
            "passwordHash": generate_password_hash(payload["password"]),
            "preferredName": payload["preferredName"].strip(),
            "emailVerified": False,
            "createdAt": datetime.now(UTC),
            "lastLoginAt": None,
            "syncConsent": False,
            "deletedAt": None,
        }

        result = db.users.insert_one(user_doc)

        return {
            "userId": str(result.inserted_id),
            "email": user_doc["email"],
            "preferredName": user_doc["preferredName"],
            "emailVerified": user_doc["emailVerified"],
        }

    @staticmethod
    def login_user(payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()

        email = payload["email"].strip().lower()
        user = db.users.find_one({"email": email, "deletedAt": None})

        if not user:
            raise ValueError("Invalid credentials")

        if not check_password_hash(user["passwordHash"], payload["password"]):
            raise ValueError("Invalid credentials")

        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"lastLoginAt": datetime.now(UTC)}}
        )

        return {
            "userId": str(user["_id"]),
            "email": user["email"],
            "preferredName": user["preferredName"],
            "emailVerified": user["emailVerified"],
        }

    @staticmethod
    def get_user(user_id: str) -> dict[str, Any] | None:
        db = get_db()

        user = db.users.find_one(
            {"_id": ObjectId(user_id), "deletedAt": None},
            {"passwordHash": 0}
        )

        if not user:
            return None

        return {
            "userId": str(user["_id"]),
            "email": user["email"],
            "preferredName": user["preferredName"],
            "emailVerified": user["emailVerified"],
            "createdAt": user["createdAt"].isoformat() if user.get("createdAt") else None,
            "lastLoginAt": user["lastLoginAt"].isoformat() if user.get("lastLoginAt") else None,
            "syncConsent": user.get("syncConsent", False),
        }

    @staticmethod
    def update_user(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        db = get_db()

        allowed_updates = {}
        if "preferredName" in payload:
            allowed_updates["preferredName"] = payload["preferredName"].strip()
        if "syncConsent" in payload:
            allowed_updates["syncConsent"] = bool(payload["syncConsent"])
        if "emailVerified" in payload:
            allowed_updates["emailVerified"] = bool(payload["emailVerified"])

        if not allowed_updates:
            raise ValueError("No valid fields provided for update")

        db.users.update_one(
            {"_id": ObjectId(user_id), "deletedAt": None},
            {"$set": allowed_updates}
        )

        updated_user = AuthService.get_user(user_id)
        if not updated_user:
            raise ValueError("User not found")

        return updated_user

    @staticmethod
    def soft_delete_user(user_id: str) -> None:
        db = get_db()

        result = db.users.update_one(
            {"_id": ObjectId(user_id), "deletedAt": None},
            {"$set": {"deletedAt": datetime.now(UTC)}}
        )

        if result.matched_count == 0:
            raise ValueError("User not found")