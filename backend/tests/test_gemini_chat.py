from __future__ import annotations
from dotenv import load_dotenv

import os
import sys

load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from Rag.rag_chain import RAGConfig, HashEmbeddings, UrgeEaseRAGChain, gemini_llm


def main() -> None:
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(tests_dir, ".."))

    data_dir = os.path.join(backend_dir, "Rag", "data")
    index_dir = os.path.join(backend_dir, "Rag", "vectorstore")

    print("Data dir:", data_dir)
    print("Index dir:", index_dir)

    if not os.path.exists(data_dir):
        raise RuntimeError(f"Data directory does not exist: {data_dir}")

    txt_files = []
    for root, _, files in os.walk(data_dir):
        for filename in files:
            if filename.lower().endswith(".txt"):
                txt_files.append(os.path.join(root, filename))

    print(f"Found {len(txt_files)} txt files")
    for path in txt_files:
        print(" -", path)

    if not txt_files:
        raise RuntimeError(
            f"No .txt files found in data directory: {data_dir}"
        )

    cfg = RAGConfig(
        data_dir=data_dir,
        index_dir=index_dir,
        k=4,
    )

    print("Initializing UrgeEase RAG with Gemini...")
    chain = UrgeEaseRAGChain(
        cfg=cfg,
        embeddings=HashEmbeddings(),
        llm_fn=gemini_llm,
    )
    print("Ready. Type 'exit' to quit.\n")

    chat_history: list[dict[str, str]] = []

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() in {"exit", "quit"}:
            print("Exiting chat.")
            break

        if not user_input:
            continue

        out = chain.invoke(
            question=user_input,
            chat_history=chat_history,
        )

        assistant_text = out["result"]

        print("\nAssistant:\n")
        print(assistant_text)

        sources = sorted(
            {
                d.metadata.get("source", "unknown")
                for d in out.get("source_documents", [])
            }
        )
        if sources:
            print("\nSources:", ", ".join(sources))

        if out.get("crisis"):
            print("\n[Crisis mode triggered]")

        chat_history.append({"role": "user", "content": user_input})
        chat_history.append({"role": "assistant", "content": assistant_text})
        print("\n" + "-" * 60 + "\n")


if __name__ == "__main__":
    main()