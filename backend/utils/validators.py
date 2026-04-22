from __future__ import annotations


# Returns any required fields missing from the payload.
def require_fields(payload: dict, required_fields: list[str]) -> list[str]:
    return [field for field in required_fields if field not in payload]

# Converts a value into a boolean.
def to_bool(value) -> bool:
    return bool(value)
