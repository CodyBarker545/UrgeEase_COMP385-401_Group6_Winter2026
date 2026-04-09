# UrgeEase RAG Setup Guide

This document explains how the Retrieval-Augmented Generation flow is set up in the current backend.

UrgeEase uses RAG to ground recovery-support replies in local support documents, then sends the final prompt to Gemini. If Gemini is unavailable, the backend chat service falls back to a shorter demo response so the chat still works for demos and testing.

## Current RAG Flow

The live backend chat path is:

1. `chat_routes.py` receives `POST /api/sessions/<session_id>/chat`
2. `ChatService` loads:
   - recent messages
   - latest saved results
   - previous result history
   - the user's active recovery plan
3. `ChatService` builds a short, practical prompt
4. `LLMService` sends that prompt through `UrgeEaseRAGChain`
5. the RAG chain retrieves support content from local `.txt` files
6. Gemini generates the final response

## Main Files

`backend/Rag/rag_chain.py`
- core RAG pipeline
- vector-store build/load logic
- crisis handling and retrieval flow

`backend/Rag/data/`
- local support and coping documents used as the knowledge base

`backend/Rag/vectorstore/`
- persisted FAISS index files

`backend/services/llm_service.py`
- creates and caches the Gemini-backed RAG chain

`backend/services/chat_service.py`
- prepares assessment, plan, and message context before generation
- uses a demo fallback when Gemini fails

## Environment Variables

Create `backend/.env` with:

```text
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=UrgeEase
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## Installing Backend Dependencies

From `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## How the Vector Store Works

The vector store is built from `.txt` files inside:

```text
backend/Rag/data
```

When the RAG chain starts:

- it hashes the document corpus
- if the corpus has not changed, it reuses the existing FAISS index
- if the corpus changed, it rebuilds the index

This means the backend does not need to rebuild the vector store on every chat request.

## Backend Usage

The backend already uses the RAG chain through:

```text
backend/services/llm_service.py
```

`LLMService`:

- reads `GEMINI_API_KEY`
- builds a `UrgeEaseRAGChain`
- uses Gemini for generation
- caches the service instance with `lru_cache`

## Chat Behavior

The chat layer is intentionally constrained to stay practical.

Current chat prompting emphasizes:

- 2 to 4 sentence responses
- one or two concrete actions
- focus on the highest-risk assessment area
- preference for the next pending recovery-plan action
- short progress mentions only when useful

## Testing the RAG Chain

You can still test the backend chat stack locally after configuring `.env`.

From `backend`:

```powershell
python tests\test_gemini_chat.py
```

You can also run the full Flask backend:

```powershell
python app.py
```

Then test chat through:

```text
POST /api/sessions/<session_id>/chat
```

## Common Issues

### `Missing GEMINI_API_KEY in .env`

Cause:

- `backend/.env` is missing the key

Fix:

- add `GEMINI_API_KEY`
- restart the backend

### Slow or failing Gemini responses

Cause:

- provider latency
- temporary overload

Fix:

- retry the request
- the backend fallback path should still return a demo reply if Gemini fails

### `ModuleNotFoundError: No module named 'Rag'`

Cause:

- running a script from the wrong folder

Fix:

- run backend scripts from `backend`

## Summary

The current production-style flow is:

- local support documents in `backend/Rag/data`
- FAISS vector retrieval
- Gemini generation
- Flask chat route integration
- MongoDB-backed sessions, messages, results, assessments, and plans
- fallback chat support when Gemini is unavailable
