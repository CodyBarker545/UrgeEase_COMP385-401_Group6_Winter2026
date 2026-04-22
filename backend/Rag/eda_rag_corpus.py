"""Quick stats on the RAG text corpus."""

import os

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Runs this script from the command line.
def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(here, "data")

    files = [f for f in os.listdir(data_dir) if f.lower().endswith(".txt")]
    files.sort()

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)

    total_chars = 0
    total_words = 0
    total_chunks = 0

    for fn in files:
        path = os.path.join(data_dir, fn)
        docs = TextLoader(path, encoding="utf-8", autodetect_encoding=True).load()
        text = "\n".join(d.page_content for d in docs)
        total_chars += len(text)
        total_words += len(text.split())

        chunks = splitter.split_documents(docs)
        total_chunks += len(chunks)

        print(f"{fn}: chars={len(text)} words={len(text.split())} chunks={len(chunks)}")

    print("\nTOTAL")
    print(
        f"files={len(files)} chars={total_chars} words={total_words} chunks={total_chunks}"
    )


if __name__ == "__main__":
    main()
