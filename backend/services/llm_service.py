from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from google import genai

from Rag.rag_chain import HashEmbeddings, RAGConfig, UrgeEaseRAGChain


class LLMService:
    def __init__(self) -> None:
        # read gemini config from env
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing GEMINI_API_KEY in .env")

        self.client = genai.Client(api_key=api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        # point rag at local data and index folders
        base_dir = Path(__file__).resolve().parents[1]
        data_dir = base_dir / "Rag" / "data"
        index_dir = base_dir / "Rag" / "vectorstore"

        cfg = RAGConfig(
            data_dir=str(data_dir),
            index_dir=str(index_dir),
            k=4,
            use_mmr=True,
        )

        # use gemini for generation
        self.chain = UrgeEaseRAGChain(
            cfg=cfg,
            embeddings=HashEmbeddings(),
            llm_fn=self._generate_from_prompt,
        )

    def _extract_text(self, response: Any) -> str:
        # use direct text if the sdk gives it
        text = getattr(response, "text", None)
        if text and text.strip():
            return text.strip()

        # fallback to candidate parts
        chunks: list[str] = []
        candidates = getattr(response, "candidates", []) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", []) or []
            for part in parts:
                part_text = getattr(part, "text", None)
                if part_text:
                    chunks.append(part_text)

        joined = "\n".join(chunks).strip()
        if joined:
            return joined

        raise RuntimeError("Gemini returned an empty response")

    def _generate_from_prompt(self, prompt: str) -> str:
        # send the final prompt to gemini
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        return self._extract_text(response)

    def generate_reply(
        self,
        question: str,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> dict[str, Any]:
        # run rag + generation
        return self.chain.invoke(question, chat_history=chat_history or [])


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    # reuse one service instance
    return LLMService()
