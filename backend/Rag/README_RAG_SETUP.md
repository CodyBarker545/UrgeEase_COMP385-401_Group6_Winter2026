# UrgeEase RAG Setup Guide

This document explains how the Retrieval-Augmented Generation flow is set up in the current backend.

UrgeEase uses RAG to ground recovery-support replies in local support documents. The current demo path generates short local responses by default, so chat can run without an external LLM. Gemini support remains in the code as an optional future hosted provider.

## Current RAG Flow

The live backend chat path is:

1. `chat_routes.py` receives `POST /api/sessions/<session_id>/chat`.
2. `ChatService` loads recent messages, latest results, previous result history, top triggers, and the active recovery plan.
3. `ChatService` builds a short, practical prompt.
4. `LLMService` sends that prompt through `UrgeEaseRAGChain`.
5. The RAG chain expands the query, routes it toward likely support categories, and retrieves local support content.
6. The local chat generator builds a short response from the retrieved context.

## Main Files

`backend/Rag/rag_chain.py`
- core RAG pipeline
- vector-store build/load logic
- crisis handling, query expansion, category routing, retrieval, and local response generation

`backend/Rag/data/`
- local support and coping documents used as the knowledge base

`backend/Rag/vectorstore/`
- persisted FAISS index files

`backend/services/llm_service.py`
- creates and caches the RAG chain
- defaults to local mode
- can opt into Gemini later with environment variables

`backend/services/chat_service.py`
- prepares assessment, plan, trigger, and message context before generation
- keeps replies short and stores both user and assistant turns

## Environment Variables

Create `backend/.env` with:

```text
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=UrgeEase

# Optional future hosted LLM mode:
# CHAT_LLM_PROVIDER=gemini
# GEMINI_API_KEY=your_actual_key_here
# GEMINI_MODEL=gemini-2.5-flash
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

## Chat Behavior

The chat layer is intentionally constrained to stay practical.

Current chat behavior emphasizes:

- 2 to 4 sentence responses
- one or two concrete actions
- focus on the highest-risk assessment or trigger area
- preference for the next pending recovery-plan action
- short progress mentions only when useful

## Testing

Run backend tests from `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -p no:cacheprovider
```

You can also run the full Flask backend:

```powershell
python app.py
```

Then test chat through:

```text
POST /api/sessions/<session_id>/chat
```

## Optional Gemini Mode

Gemini is not required for the current demo. To try the hosted provider later:

1. Set `CHAT_LLM_PROVIDER=gemini`.
2. Set `GEMINI_API_KEY`.
3. Optionally set `GEMINI_MODEL`.
4. Restart the backend.

If Gemini is slow or unavailable, switch back to the default local mode for the demo.

## Common Issues

### `ModuleNotFoundError: No module named 'Rag'`

Cause:

- running a script from the wrong folder

Fix:

- run backend scripts from `backend`

### Chat feels too generic

Cause:

- local support documents may not cover the user's concern well enough

Fix:

- add focused `.txt` support notes to `backend/Rag/data`
- restart the backend so the vector store can rebuild if the corpus changed

## Summary

The current flow is:

- local support documents in `backend/Rag/data`
- FAISS vector retrieval
- local response generation by default
- optional Gemini generation for future hosted expansion
- Flask chat route integration
- MongoDB-backed sessions, messages, results, assessments, and plans
