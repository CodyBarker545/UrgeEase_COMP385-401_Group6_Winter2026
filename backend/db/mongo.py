from __future__ import annotations

import os
from functools import lru_cache

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

load_dotenv()


# Returns the shared MongoDB client.
@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI is not set in the environment")
    timeout_ms = int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000"))
    return MongoClient(
        mongo_uri,
        tlsCAFile=certifi.where(),
        connectTimeoutMS=timeout_ms,
        socketTimeoutMS=timeout_ms,
        serverSelectionTimeoutMS=timeout_ms,
    )


# Returns the MongoDB database for the app.
def get_db() -> Database:
    db_name = os.getenv("MONGO_DB_NAME", "UrgeEase")
    return get_client()[db_name]


# Checks if MongoDB is reachable.
def ping_db() -> bool:
    try:
        get_client().admin.command("ping")
        return True
    except Exception:
        return False
