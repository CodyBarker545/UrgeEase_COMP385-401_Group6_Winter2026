from __future__ import annotations


def require_fields(payload: dict, required_fields: list[str]) -> list[str]:
    return [field for field in required_fields if field not in payload]

def to_bool(value) -> bool:
    return bool(value)