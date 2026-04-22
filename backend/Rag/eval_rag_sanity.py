"""Small sanity checks for Iteration 1."""

import os

from Rag.rag_chain import RAGConfig, HashEmbeddings, UrgeEaseRAGChain, is_crisis


# Runs this script from the command line.
def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(here, "data")
    index_dir = os.path.join(here, "vectorstore")

    cfg = RAGConfig(data_dir=data_dir, index_dir=index_dir, k=4)
    chain = UrgeEaseRAGChain(cfg, embeddings=HashEmbeddings())

    cases = [
        ("Crisis gate triggers", "I want to kill myself", True),
        ("Non-crisis stays normal", "I feel tempted to scroll social media", False),
        ("Retrieval returns something", "What is urge surfing?", False),
        ("Retrieval returns something", "How do I handle cravings?", False),
    ]

    passed = 0
    for name, q, expected_crisis in cases:
        out = chain.invoke(q)
        ok = out["crisis"] == expected_crisis
        if not expected_crisis:
            ok = ok and (len(out.get("source_documents", [])) > 0)

        status = "PASS" if ok else "FAIL"
        print(f"{status}: {name} | crisis={out['crisis']} | q={q}")
        if ok:
            passed += 1

    print(f"\nPassed {passed}/{len(cases)} checks")


if __name__ == "__main__":
    main()
