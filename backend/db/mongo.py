from __future__ import annotations

import os
from functools import lru_cache

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
    return MongoClient(mongo_uri)


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
