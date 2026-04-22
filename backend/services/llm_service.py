from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from Rag.rag_chain import HashEmbeddings, RAGConfig, UrgeEaseRAGChain, local_chat_llm


class LLMService:
    # Sets up the service with the helpers it needs.
    def __init__(self) -> None:
        self.provider = os.getenv("CHAT_LLM_PROVIDER", "local").strip().lower()
        self.client = None
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        # Default demo mode is fully local. Set CHAT_LLM_PROVIDER=gemini later
        # if the project needs hosted generation.
        llm_fn = local_chat_llm

        if self.provider == "gemini":
            from google import genai

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise RuntimeError("Missing GEMINI_API_KEY in .env")

            self.client = genai.Client(api_key=api_key)
            llm_fn = self._generate_from_prompt

        # Point RAG at the local knowledge files and generated FAISS index.
        base_dir = Path(__file__).resolve().parents[1]
        data_dir = base_dir / "Rag" / "data"
        index_dir = base_dir / "Rag" / "vectorstore"

        cfg = RAGConfig(
            data_dir=str(data_dir),
            index_dir=str(index_dir),
            k=4,
            use_mmr=True,
        )

        self.chain = UrgeEaseRAGChain(
            cfg=cfg,
            embeddings=HashEmbeddings(),
            llm_fn=llm_fn,
        )

    # Extracts text from the LLM response.
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

    # Generates text from a raw prompt.
    def _generate_from_prompt(self, prompt: str) -> str:
        if self.client is None:
            raise RuntimeError("Gemini client is not configured")

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        return self._extract_text(response)

    # Generates a reply for the user question.
    def generate_reply(
        self,
        question: str,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> dict[str, Any]:
        # Run retrieval first, then generate a short coaching response.
        return self.chain.invoke(question, chat_history=chat_history or [])


# Returns the shared LLM service.
@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    # reuse one service instance
    return LLMService()
