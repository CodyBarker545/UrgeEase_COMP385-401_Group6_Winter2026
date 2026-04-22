# UrgeEase

UrgeEase is a full-stack recovery-support app focused on social media wellbeing. It combines:

- a Next.js frontend for auth, chat, assessments, plans, history, and results
- a Flask backend for API routes, MongoDB persistence, ML inference, local RAG chat, and analytics
- two Random Forest models for addiction-score and dependence-risk assessment
- a local retrieval-augmented chatbot by default, with optional Gemini support left in the code for future hosted expansion

## Current Product Flow

1. A user signs in or registers from the frontend.
2. The frontend creates or resumes a chat session.
3. The user can use text chat, and both user and assistant messages are stored in MongoDB.
4. The user completes the assessment at `/app/assessment`.
5. The backend runs both Random Forest models, stores the raw answers, stores model outputs, analyzes top triggers, and creates a recovery plan.
6. Latest results, result history, trigger summaries, and the active plan guide future chat responses.
7. The results dashboard can show score history, dependence history, recurring triggers, and improvement direction over time.

Voice support is currently labeled as coming soon in the frontend. Text chat is the supported demo path.

## Stack

### Frontend

- Next.js 14
- React
- TypeScript

### Backend

- Flask
- PyMongo / MongoDB Atlas
- LangChain + FAISS
- local RAG response generation by default
- optional Google Gemini provider for future hosted mode
- joblib-loaded Random Forest models

## Repository Layout

```text
UrgeEase/
  frontend/          Next.js app
  backend/           Flask API, ML, RAG, MongoDB services
  backend/db/        Mongo setup script and DB docs
  backend/routes/    Flask blueprints
  backend/services/  Business logic
  backend/Rag/       Retrieval data, vector store, and setup docs
```

## Prerequisites

- Python 3.11 or newer
- Node.js 18+
- npm
- MongoDB Atlas connection string
- Gemini API key only if enabling the optional hosted LLM provider

## Backend Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```text
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=UrgeEase
FLASK_ENV=development

# Optional future hosted LLM mode:
# CHAT_LLM_PROVIDER=gemini
# GEMINI_API_KEY=your_actual_key_here
# GEMINI_MODEL=gemini-2.5-flash
```

Initialize MongoDB collections and indexes from `backend`:

```powershell
python db\init_db.py
```

Start the backend:

```powershell
python app.py
```

Backend default URL:

```text
http://localhost:5000
```

## Frontend Setup

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:3000
```

Optional frontend environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

If `npm run dev` says `next` is not recognized, run `npm install` inside `frontend` first.

## Main User Features

### Authentication

- Sign up and sign in through the Flask API.
- User records are stored in MongoDB.
- The current project is demo-oriented and does not yet include production JWT/session middleware.

### Sessions and Chat

- Sessions are created per user.
- Chat messages are stored in the `messages` collection.
- Assistant replies are also stored, so past advice can be reviewed later.
- Chat uses recent message history, latest assessment results, result history, top triggers, and the active recovery plan.
- The default chatbot is local and brief, so the demo can run without Gemini.
- Gemini can be enabled later with `CHAT_LLM_PROVIDER=gemini` and `GEMINI_API_KEY`.

### Assessment Flow

The frontend submits the full questionnaire to:

```text
POST /api/assessments
```

The backend then:

1. validates the request
2. runs the addiction-score Random Forest model
3. runs the dependence-risk Random Forest model
4. analyzes top triggers
5. stores raw questionnaire answers in `assessments`
6. stores model outputs in `results`
7. links each result back to the assessment with `assessmentId`
8. creates a new active recovery plan in `plans`

### Results and Analytics

- Results are stored separately from assessments.
- Addiction and dependence outputs are tagged by `resultType`.
- The latest addiction result powers the main dashboard and chat context.
- Analytics summarize score trends, dependence trends, recurring triggers, and whether the user appears to be improving.

### Recovery Plans

After each assessment, the backend creates an active plan based on the latest answers and trigger analysis.

Plans include:

- a focus area such as `distractibility`, `sleep`, `validation`, or `mindless_use`
- a short summary
- goals
- practical actions
- trigger-aware recommendations

When a new plan is created, older active plans for that user are archived.

## Key API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Sessions

- `POST /api/sessions`
- `GET /api/sessions/user/<user_id>`
- `GET /api/sessions/<session_id>`

### Chat

- `POST /api/sessions/<session_id>/chat`

### Assessments

- `POST /api/assessments`

### Results

- `GET /api/results/user/<user_id>`
- `GET /api/results/user/<user_id>/latest`
- `GET /api/results/user/<user_id>/analytics`
- `GET /api/results/<result_id>`

### Plans

- `GET /api/plans/user/<user_id>/active`
- `PATCH /api/plans/<plan_id>/actions/<action_id>`

## RAG and Local Chat

The backend RAG flow:

- loads support documents from `backend/Rag/data`
- builds or reuses a FAISS vector store in `backend/Rag/vectorstore`
- expands and routes user queries toward likely support categories
- retrieves relevant support content
- generates a short local response by default

Gemini support remains in the code for future hosted expansion. To try it later, set `CHAT_LLM_PROVIDER=gemini`, set `GEMINI_API_KEY`, and restart the backend.

## Testing

Type-check the frontend:

```powershell
cd frontend
npx tsc --noEmit --pretty false
```

Run backend tests:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests -p no:cacheprovider
```

## Important Notes

- `results` stores derived model outputs, not the full questionnaire.
- `assessments` stores the full raw answers.
- `plans` are generated from the most recent assessment.
- chat persists both the user message and the assistant response.
- local chat is intentionally short and practical for demo use.
- UrgeEase is not a licensed medical or mental health service.

If a user expresses self-harm or suicide intent, the system should return crisis-oriented support instead of normal coaching.
