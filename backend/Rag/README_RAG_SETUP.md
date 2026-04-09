# UrgeEase RAG Setup Guide

This README explains how to run the UrgeEase Retrieval-Augmented Generation (RAG) chatbot locally with Gemini, how the vector store works, and how to test the chatbot before connecting it to the Flask backend.

## Overview

The RAG flow does four main things:

1. Loads `.txt` recovery/support documents from `backend/Rag/data`
2. Builds or loads a FAISS vector store in `backend/Rag/vectorstore`
3. Retrieves relevant document chunks for a user message
4. Sends the prompt plus retrieved context to Gemini for the final response

The code already supports a fake LLM for offline testing, but Gemini should be the active LLM for the real chatbot.

## Main Files

- `backend/Rag/rag_chain.py`
  - Core RAG pipeline
  - Crisis detection
  - Prompt building
  - Vector store build/load logic
  - Gemini and fake LLM functions
- `backend/Rag/data/`
  - Text files used as the knowledge base
- `backend/Rag/vectorstore/`
  - Saved FAISS index files
- `backend/tests/test_gemini_chat.py`
  - Simple terminal chat script for testing Gemini + RAG
- `backend/services/llm_service.py`
  - Should create and reuse one RAG chain for backend chat requests

## Requirements

Activate your virtual environment first.

### Windows PowerShell

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

Install the required packages:

```bash
pip install -U google-genai python-dotenv langchain langchain-community langchain-text-splitters faiss-cpu
```

If your project already has a `requirements.txt`, you can also run:

```bash
pip install -r requirements.txt
```

## Gemini API Key

Create a `.env` file in the `backend` folder:

```text
backend/.env
```

Add:

```text
GEMINI_API_KEY=your_actual_key_here
```

### Important

Putting the key in `.env` is not enough by itself. Any standalone script must also load that `.env` file with `load_dotenv(...)`.

Example:

```python
from dotenv import load_dotenv
import os

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(base_dir, ".env"))
```

## How the Vector Store Works

The vector store is built from `.txt` files inside `backend/Rag/data`.

When `UrgeEaseRAGChain` is created:

- it hashes the `.txt` corpus
- if the corpus has not changed, it loads the existing FAISS index
- if the corpus changed, it rebuilds the FAISS index

This means you do **not** need to rebuild the vector store on every chat request.

## Recommended Backend Behavior

The backend should create the RAG chain once and reuse it.

Good pattern:

- app starts
- `LLMService` creates one `UrgeEaseRAGChain`
- each chat request reuses that same chain

Avoid creating a new `UrgeEaseRAGChain` on every request.

## Make Gemini the Active LLM

Keep `fake_llm()` in `rag_chain.py` for offline testing, but use Gemini by default.

### In `rag_chain.py`

Add a Gemini function like this:

```python
from google import genai
import os

def gemini_llm(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = getattr(response, "text", None)
    if not text:
        raise RuntimeError("Gemini returned an empty response.")

    return text
```

Then make Gemini the default in `UrgeEaseRAGChain.__init__`:

```python
self.llm_fn = llm_fn or gemini_llm
```

This keeps `fake_llm()` available, while making Gemini the active chatbot model.

## Testing Without Starting Flask

You do **not** need to start the backend to test the RAG chain.

You can run the terminal test script directly.

### Run the test script

From the `backend` folder:

```bash
python tests/test_gemini_chat.py
```

### What it should do

- print the detected data folder
- show how many `.txt` files were found
- initialize the RAG chain
- let you type messages in the terminal
- show Gemini responses and retrieved sources

## Example Terminal Test Script Behavior

Expected output:

```text
Data dir: ...\backend\Rag\data
Index dir: ...\backend\Rag\vectorstore
Found 15 txt files
Initializing UrgeEase RAG with Gemini...
Ready. Type 'exit' to quit.

You: hello
Assistant:
...
```

## Common Errors and Fixes

### 1. `ModuleNotFoundError: No module named 'Rag'`

Cause:
- running the script from the wrong folder

Fix:
- run from `backend`
- or add the backend folder to `sys.path`

Recommended:

```bash
cd backend
python tests/test_gemini_chat.py
```

### 2. `GEMINI_API_KEY is not set`

Cause:
- key missing from `.env`
- or script did not call `load_dotenv(...)`

Fix:
- add `GEMINI_API_KEY` to `backend/.env`
- load `.env` explicitly in the script

### 3. FAISS `IndexError: list index out of range`

Cause:
- no `.txt` files were loaded into the vector store
- usually a wrong `data_dir`

Fix:
- verify the script points to `backend/Rag/data`
- confirm `.txt` files exist there

### 4. Gemini response takes a long time

Cause:
- network latency
- larger prompt from RAG context

Fix:
- this may be normal
- test Gemini alone with a very small prompt if needed
- reduce retrieval `k` or prompt size if latency becomes a problem

## Backend Integration

Your Flask route flow is:

- `app.py` registers `chat_bp`
- `chat_routes.py` calls `ChatService`
- `ChatService` calls `get_llm_service().generate_reply(...)`

So the correct place to connect the backend to RAG is inside:

- `backend/services/llm_service.py`

That service should:

1. create one `UrgeEaseRAGChain`
2. use Gemini as the active LLM
3. expose a `generate_reply(question, chat_history)` method
4. reuse the same chain instance for all requests

## Suggested `llm_service.py` Pattern

```python
from __future__ import annotations

import os
from functools import lru_cache

from Rag.rag_chain import RAGConfig, HashEmbeddings, UrgeEaseRAGChain, gemini_llm


class LLMService:
    def __init__(self) -> None:
        here = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(here)

        data_dir = os.path.join(backend_dir, "Rag", "data")
        index_dir = os.path.join(backend_dir, "Rag", "vectorstore")

        cfg = RAGConfig(data_dir=data_dir, index_dir=index_dir, k=4)

        self.chain = UrgeEaseRAGChain(
            cfg=cfg,
            embeddings=HashEmbeddings(),
            llm_fn=gemini_llm,
        )

    def generate_reply(self, question: str, chat_history: list[dict[str, str]] | None = None) -> dict:
        return self.chain.invoke(question=question, chat_history=chat_history)


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    return LLMService()
```

## Notes

- `HashEmbeddings` are fine for local testing and deterministic behavior
- retrieval quality can be improved later by replacing test embeddings with a real embedding model
- crisis detection is handled before normal generation and should remain enabled

## Quick Start Summary

1. Activate the backend virtual environment
2. Install packages
3. Add `GEMINI_API_KEY` to `backend/.env`
4. Load `.env` in standalone scripts
5. Make Gemini the default LLM in `rag_chain.py`
6. Run:

```bash
python tests/test_gemini_chat.py
```

7. After standalone testing works, connect `llm_service.py` to the backend route

## Status Goal

When everything is wired correctly:

- terminal testing works with Gemini
- backend chat route uses the same RAG chain
- vector store is reused instead of rebuilt every request
- chatbot responses use retrieved UrgeEase support documents plus Gemini generation
