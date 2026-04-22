# test_rag_chain_urgeease.py
import os
import re
import shutil
import uuid
from pathlib import Path

import pytest

from Rag.rag_chain import (
    RAGConfig,
    HashEmbeddings,
    UrgeEaseRAGChain,
    build_prompt,
    detect_query_categories,
    fake_llm,
    infer_category,
    is_crisis,
    limit_sentences,
    local_chat_llm,
)


@pytest.fixture()
def rag_scratch_dir():
    root = Path(__file__).resolve().parents[1] / ".rag-test-workspace"
    root.mkdir(exist_ok=True)
    path = root / uuid.uuid4().hex
    path.mkdir()
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


@pytest.fixture()
def tmp_rag_project(rag_scratch_dir: Path):
    """
    Creates a temporary data + index folder with one text file.
    """
    data_dir = rag_scratch_dir / "data"
    index_dir = rag_scratch_dir / "vectorstore"
    data_dir.mkdir()
    index_dir.mkdir()

    sample = (
        "UrgeEase Notes\n\n"
        "If the user has an urge, suggest urge surfing: wait 10 minutes and breathe.\n"
        "Also identify triggers: time, mood, environment.\n"
    )
    (data_dir / "guide.txt").write_text(sample, encoding="utf-8")

    return str(data_dir), str(index_dir)


def test_is_crisis_detection():
    assert is_crisis("I want to kill myself") is True
    assert is_crisis("I feel tempted to scroll social media") is False


def test_rag_retrieves_documents(tmp_rag_project):
    data_dir, index_dir = tmp_rag_project
    cfg = RAGConfig(data_dir=data_dir, index_dir=index_dir, k=2)

    chain = UrgeEaseRAGChain(cfg, embeddings=HashEmbeddings(), llm_fn=fake_llm)

    result = chain.invoke("What should I do when I feel an urge?")
    assert result["crisis"] is False
    assert "result" in result
    assert len(result["source_documents"]) > 0

    # Make sure retrieved chunk contains expected phrase
    joined = "\n".join([d.page_content.lower() for d in result["source_documents"]])
    assert "urge surfing" in joined or "wait 10 minutes" in joined


def test_crisis_short_circuits_rag(tmp_rag_project):
    data_dir, index_dir = tmp_rag_project
    cfg = RAGConfig(data_dir=data_dir, index_dir=index_dir)

    chain = UrgeEaseRAGChain(cfg, embeddings=HashEmbeddings(), llm_fn=fake_llm)

    result = chain.invoke("I want to end my life.")
    assert result["crisis"] is True
    assert result["source_documents"] == []
    assert "988" in result["result"] or "911" in result["result"]


def test_infer_category_from_source_path():
    assert infer_category("sleep_and_routine/phone_sleep.txt") == "sleep_and_routine"
    assert infer_category("habit_tracking/focus.txt") == "habit_tracking"
    assert infer_category("social_media_addiction_research/validation.txt") == "social_media_addiction_research"
    assert infer_category("misc/notes.txt") == "general"


def test_detect_query_categories_for_common_trigger_language():
    assert detect_query_categories("I scroll late at night and cannot sleep")[0] == "sleep_and_routine"
    assert detect_query_categories("I keep checking apps while studying")[0] == "habit_tracking"
    assert detect_query_categories("I compare myself and check likes for validation")[0] == "social_media_addiction_research"


def test_prompt_asks_for_natural_voice_chat_style():
    prompt = build_prompt(
        chat_history="",
        context="[SOURCE: guide.txt][CATEGORY: habit_replacement]\nDelay the urge.",
        query="I keep opening social media without thinking",
    )

    assert "no numbered sections" in prompt
    assert "text-to-speech" in prompt
    assert "Assistant behavior:" in prompt
    assert "normally 2 or 3 short sentences" in prompt
    assert "answer the user's immediate struggle first" in prompt
    assert "Sources used" not in prompt
    assert "cite sources by filename" not in prompt


def test_limit_sentences_caps_long_text():
    limited = limit_sentences("One. Two. Three. Four. Five.", max_sentences=3)
    assert limited == "One. Two. Three."


def test_local_chat_llm_stays_short_and_plain():
    prompt = build_prompt(
        chat_history="",
        context="[SOURCE: focus.txt][CATEGORY: habit_tracking]\nTrack automatic checking during study.",
        query="I keep checking apps while studying",
    )

    response = local_chat_llm(prompt)

    assert len(re.findall(r"[.!?]", response)) <= 4
    assert "\n" not in response
    assert "Sources used" not in response
    assert "focus.txt" not in response


def test_local_chat_llm_answers_identity_questions():
    prompt = build_prompt(
        chat_history="",
        context="[SOURCE: guide.txt][CATEGORY: general]\nUrgeEase supports recovery planning.",
        query="hello who are you",
    )

    response = local_chat_llm(prompt)

    assert "UrgeEase" in response
    assert "time, mood, place, or device" not in response


def test_local_chat_llm_uses_sleep_context():
    prompt = build_prompt(
        chat_history="",
        context="[SOURCE: sleep.txt][CATEGORY: sleep_and_routine]\nSleep plan: keep the phone away from bed and use a bedtime wind-down routine.",
        query="I have trouble sleeping at night",
    )

    response = local_chat_llm(prompt)

    assert "phone away from the bed" in response
    assert "time, mood, place, or device" not in response


def test_rag_routes_trigger_questions_to_relevant_categories(rag_scratch_dir: Path):
    data_dir = rag_scratch_dir / "data"
    index_dir = rag_scratch_dir / "vectorstore"
    (data_dir / "sleep_and_routine").mkdir(parents=True)
    (data_dir / "habit_tracking").mkdir(parents=True)
    (data_dir / "social_media_addiction_research").mkdir(parents=True)
    index_dir.mkdir()

    (data_dir / "sleep_and_routine" / "sleep.txt").write_text(
        "Sleep plan: keep the phone away from bed, use a bedtime wind-down routine, and protect night sleep.",
        encoding="utf-8",
    )
    (data_dir / "habit_tracking" / "focus.txt").write_text(
        "Focus plan: track automatic checking during study, log distraction triggers, and use phone-free work blocks.",
        encoding="utf-8",
    )
    (data_dir / "social_media_addiction_research" / "validation.txt").write_text(
        "Validation plan: notice social comparison, likes, self-worth checks, and reduce comparison triggers.",
        encoding="utf-8",
    )

    cfg = RAGConfig(data_dir=str(data_dir), index_dir=str(index_dir), k=2, use_mmr=False)
    chain = UrgeEaseRAGChain(cfg, embeddings=HashEmbeddings(), llm_fn=fake_llm)

    sleep_result = chain.invoke("I scroll late at night and cannot sleep")
    sleep_categories = {doc.metadata.get("category") for doc in sleep_result["source_documents"]}
    assert "sleep_and_routine" in sleep_categories

    focus_result = chain.invoke("I keep checking apps while studying")
    focus_categories = {doc.metadata.get("category") for doc in focus_result["source_documents"]}
    assert "habit_tracking" in focus_categories

    validation_result = chain.invoke("I compare myself and check likes for validation")
    validation_categories = {doc.metadata.get("category") for doc in validation_result["source_documents"]}
    assert "social_media_addiction_research" in validation_categories
