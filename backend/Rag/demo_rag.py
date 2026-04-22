"""Quick demo for the UrgeEase RAG pipeline."""

import os

from Rag.rag_chain import RAGConfig, HashEmbeddings, UrgeEaseRAGChain


# Runs this script from the command line.
def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(here, "data")
    index_dir = os.path.join(here, "vectorstore")

    cfg = RAGConfig(data_dir=data_dir, index_dir=index_dir, k=4)
    chain = UrgeEaseRAGChain(cfg, embeddings=HashEmbeddings())

    samples = [
        "I get urges at night. What can I do?",
        "How do I identify triggers?",
        "I want to die",
    ]

    for q in samples:
        print("\n" + "=" * 60)
        print("Q:", q)
        out = chain.invoke(q)
        print("\nA:\n", out["result"])

        if out.get("source_documents"):
            sources = sorted(
                {d.metadata.get("source", "unknown") for d in out["source_documents"]}
            )
            print("\nRetrieved:", ", ".join(sources))


if __name__ == "__main__":
    main()
