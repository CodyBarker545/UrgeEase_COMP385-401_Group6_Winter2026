# UrgeEase  
### AI-Powered Behavioral Recovery Support Application

UrgeEase is an **AI-powered support application** designed to help users manage behavioral addictions such as excessive **social media usage and pornography consumption**.

The system combines **machine learning risk prediction** with **AI-generated behavioral guidance**.

---

# System Architecture

UrgeEase consists of two main components:

1. **Python RAG Backend**
   - LangChain
   - FAISS vector database
   - Machine learning models for addiction risk prediction

2. **Next.js Frontend**
   - React
   - Node.js
   - User questionnaire and interface

---

# Prerequisites

Before installing the project, ensure the following are installed:

- **Python 3.11 or 3.12 (recommended)**
- **Node.js 18 or higher**
- **npm**
- **Git**

Check versions:

```bash
python --version
node --version
npm --version
```

---

# Installation Instructions

## Backend Setup (Python)

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

If you have multiple Python versions installed:

```bash
py -3.11 -m venv .venv
```

Activate the virtual environment.

### Windows

```bash
.\.venv\Scripts\Activate.ps1
```

### Mac / Linux

```bash
source .venv/bin/activate
```

Install required Python packages:

```bash
pip install -r requirements.txt
```

Run unit tests (optional):

```bash
python -m pytest
```

Initialize MongoDB collections and indexes:

```bash
python init_db.py
```

---

## Frontend Setup (Next.js)

Navigate to the frontend folder:

```bash
cd frontend
```

Install Node dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```
http://localhost:3000
```

---

# Environment Variables

Create a `.env` file in the `backend` folder for the backend API and MongoDB connection.

Example:

```
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=UrgeEase
FLASK_ENV=development
```

**Important:**  
Do **NOT** commit `.env` files to GitHub.

---

# Running the RAG Backend (Demo)

From the backend folder:

```bash
python -m Rag.demo_rag
```

This demo:

- loads example recovery documents
- builds a **FAISS vector index**
- performs retrieval-augmented generation queries

Example document sources:

```
backend/Rag/data/
```

Example files include:

- rag_data.txt  
- coping_strategies.txt  
- trigger_tracking.txt  
- sleep_and_routine.txt  

The FAISS index is generated in:

```
backend/Rag/vectorstore/
```

The `vectorstore/` folder is created automatically and is **ignored by git**.

---

# Machine Learning Models

UrgeEase includes **addiction risk prediction models** trained on two datasets.

### Dataset 1 — Social Media Addiction vs Relationships

Accuracy:

| Model | Accuracy |
|------|--------|
| Random Forest | **94.33%** |
| XGBoost | **94.33%** |

---

### Dataset 2 — Social Media Behavioral Survey

Weighted behavioral scoring was used to generate addiction risk labels.

| Model | Accuracy |
|------|--------|
| Random Forest | **85.42%** |
| XGBoost | **83.33%** |

Random Forest performed best on behavioral survey data.

---

# Development Notes

- Backend uses **FAISS** for local vector storage
- **HashEmbeddings** enable offline testing
- Crisis detection prevents unsafe responses
- Frontend built using **Next.js 14**
- Prediction result saves now require both `userId` and `sessionId`
- Result history endpoints query saved results by linked `userId`
- Chat responses use saved assessment history when a valid user/session pair is provided

---

# Backend API Flow

Typical backend flow for a full assessment and chat session:

1. Register or log in a user to get a `userId`
2. Create a session to get a `sessionId`
3. Submit both IDs when calling:
   - `POST /api/predict/addiction-score`
   - `POST /api/predict/dependence-risk`
4. Retrieve stored history with:
   - `GET /api/results/user/<userId>`
5. Continue the recovery chat with:
   - `POST /api/sessions/<sessionId>/chat`

Important request rule:

- `userId` must be the registered user ID
- `sessionId` must be the session created for that user
- The chat route uses the `sessionId` in the URL and the `userId` in the JSON body

Example chat request:

```json
{
  "userId": "<userId>",
  "message": "I keep checking social media when I get bored at night. What should I do instead?"
}
```

---

# Security Notice

UrgeEase is **NOT a licensed medical or mental health tool**.

If a user expresses suicidal intent, the system provides **crisis resources instead of advice**.

---

# Authors

**UrgeEase Capstone Project – Group 6**

Software Engineering Technology – Artificial Intelligence  
Centennial College
