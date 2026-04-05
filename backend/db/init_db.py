from __future__ import annotations

from db.mongo import get_db


def create_collections() -> None:
    db = get_db()
    existing = db.list_collection_names()

    if "users" not in existing:
        db.create_collection("users")
    db.users.create_index("email", unique=True)

    if "sessions" not in existing:
        db.create_collection("sessions")
    db.sessions.create_index([("userId", 1), ("createdAt", -1)])

    if "messages" not in existing:
        db.create_collection("messages")
    db.messages.create_index([("sessionId", 1), ("createdAt", 1)])
    db.messages.create_index([("userId", 1), ("createdAt", -1)])

    if "results" not in existing:
        db.create_collection("results")
    db.results.create_index([("userId", 1), ("generatedAt", -1)])
    db.results.create_index([("sessionId", 1), ("generatedAt", -1)])

    if "trigger_logs" not in existing:
        db.create_collection("trigger_logs")
    db.trigger_logs.create_index([("userId", 1), ("createdAt", -1)])
    db.trigger_logs.create_index([("sessionId", 1), ("createdAt", -1)])

    if "crisis_resources" not in existing:
        db.create_collection("crisis_resources")
    db.crisis_resources.create_index([("country", 1), ("sortOrder", 1)])


if __name__ == "__main__":
    create_collections()
    print("MongoDB collections and indexes created.")