import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

from db.mongo import get_db


def test_insert_and_read():
    db = get_db()

    doc = {"name": "test_user"}
    insert_result = db.test.insert_one(doc)

    found = db.test.find_one({"_id": insert_result.inserted_id})

    assert found["name"] == "test_user"

    db.test.delete_one({"_id": insert_result.inserted_id})


def test_insert_test_collection():
    db = get_db()

    doc = {"type": "pytest_test"}
    result = db.test_collection.insert_one(doc)

    assert result.inserted_id is not None

    db.test_collection.delete_one({"_id": result.inserted_id})