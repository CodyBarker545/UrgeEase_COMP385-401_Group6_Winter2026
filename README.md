============================================================
URGE EASE
AI-Powered Behavioral Recovery Support Application
============================================================

UrgeEase is an AI-powered support application designed to help users manage behavioral addictions such as excessive pornography and social media use.

The system consists of:

1) Python RAG Backend (LangChain + FAISS)
2) Next.js Frontend (React + Node.js)

------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------

Before installing, make sure you have:

- Python 3.11 or 3.12 (recommended)
- Node.js 18 or higher
- npm
- Git

Check your versions using:

    python --version
    node --version
    npm --version


------------------------------------------------------------
INSTALLATION INSTRUCTIONS
------------------------------------------------------------

========================
1) BACKEND SETUP (Python)
========================

Step 1: Navigate to backend folder

    cd backend

Step 2: Create virtual environment

    python -m venv .venv

    if you have multiple python versions installed:
        py -3.11 -m venv .venv

Step 3: Activate virtual environment

    On Windows:
        .\.venv\Scripts\Activate.ps1

    On Mac/Linux:
        source .venv/bin/activate

Step 4: Install required Python packages

    pip install -r requirements.txt

Step 5 (Optional): Run unit tests

    python -m pytest

------------------------------------------------------------

========================
2) FRONTEND SETUP (Next.js)
========================

Step 1: Navigate to frontend folder

    cd frontend

Step 2: Install Node dependencies

    npm install

Step 3: Start development server

    npm run dev

The frontend will be available at:

    http://localhost:3000

------------------------------------------------------------
ENVIRONMENT VARIABLES
------------------------------------------------------------

If using Gemini API, create a .env file in the appropriate folder.

Example:

    GEMINI_API_KEY=your_api_key_here
    

IMPORTANT:
Do NOT commit .env files to GitHub.

------------------------------------------------------------
RUNNING THE RAG BACKEND (DEMO)
------------------------------------------------------------

From the backend folder:

    python -m Rag.demo_rag

This runs a small demo using:
    backend/Rag/data/  (includes multiple .txt demo files)
    example files: rag_data.txt, coping_strategies.txt, trigger_tracking.txt, sleep_and_routine.txt
and builds the FAISS index under:
    backend/Rag/vectorstore/

vectorstore/ is generated when the demo runs and is ignored by git.

------------------------------------------------------------
DEVELOPMENT NOTES
------------------------------------------------------------

- Backend uses FAISS for local vector storage.
- HashEmbeddings is used for offline testing.
- Crisis detection blocks self-harm responses.
- Frontend built with Next.js 14.

------------------------------------------------------------
SECURITY NOTICE
------------------------------------------------------------

UrgeEase is NOT a licensed medical or mental health tool.

If a user expresses suicidal intent, the system provides crisis resources instead of advice.

------------------------------------------------------------
AUTHORS
------------------------------------------------------------

UrgeEase Capstone Project Group 6
Software Engineering Technology – Artificial Intelligence
Centennial College
