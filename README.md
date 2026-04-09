# UrgeEase

UrgeEase is a full-stack recovery support app for behavioral addictions. It combines:

- a Next.js frontend for authentication, chat, assessments, results, history, and plans
- a Flask backend for API routes, MongoDB persistence, ML inference, and RAG-based chat
- two Random Forest models for assessment scoring
- a retrieval-augmented chat assistant with Gemini and a demo fallback

## Current Product Flow

1. A user registers or signs in from the frontend.
2. The frontend creates or resumes a session.
3. The user can chat with the assistant, and both user and assistant messages are stored in MongoDB.
4. The user can complete the assessment at `/app/assessment`.
5. The backend runs both Random Forest models, stores the raw answers in `assessments`, stores model outputs in `results`, and creates a recovery plan in `plans`.
6. The latest results and active plan are used to guide future chat responses.

## Stack

### Frontend

- Next.js 14
- React
- TypeScript

### Backend

- Flask
- PyMongo / MongoDB Atlas
- LangChain + FAISS
- Google Gemini
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

- Python 3.11 or 3.12
- Node.js 18+
- npm
- MongoDB Atlas connection string
- Gemini API key for live RAG responses

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
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Initialize MongoDB collections and indexes:

From `backend`:

```powershell
python db\init_db.py
```

From `backend\db`:

```powershell
python init_db.py
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

If this variable is not set, the frontend defaults to `http://localhost:5000`.

## Main User Features

### Authentication

- Sign up and sign in through the Flask API
- User records are stored in MongoDB

### Sessions and Chat

- Sessions are created per user
- Chat messages are stored in the `messages` collection
- Assistant replies are also stored, so past advice can be reviewed later
- Chat uses:
  - recent message history
  - latest saved assessment results
  - previous result history for trend summaries
  - the user's active recovery plan
- If Gemini is unavailable, the backend returns a shorter demo fallback response instead of failing the chat

### Assessment Flow

The frontend submits the full questionnaire to:

```text
POST /api/assessments
```

The backend then:

1. validates the request
2. runs the addiction-score Random Forest model
3. runs the dependence-risk Random Forest model
4. stores raw questionnaire answers in `assessments`
5. stores model outputs in `results`
6. links each result back to the assessment with `assessmentId`
7. creates a new active recovery plan in `plans`

### Results and History

- Results are stored separately from assessments
- This keeps raw answers and derived model outputs cleanly separated
- The app can compare recent results over time and use them in chat context

### Recovery Plans

After each assessment, the backend creates an active plan based on the latest answers.

The plan includes:

- a focus area such as `distractibility`, `sleep`, `validation`, or `mindless_use`
- a short summary
- two goals
- three practical actions

When a new plan is created, older active plans for that user are archived.

## MongoDB Collections

`users`
- account records

`sessions`
- chat or voice session metadata

`messages`
- stored user and assistant conversation turns

`results`
- model outputs only
- linked to `userId`, `sessionId`, and `assessmentId`

`assessments`
- full submitted questionnaire answers
- linked result summaries and result IDs

`plans`
- active or archived user recovery plans created from assessments

`trigger_logs`
- optional trigger-tracking records

`crisis_resources`
- crisis support resources used by the app

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
- `GET /api/results/<result_id>`

### Plans

- `GET /api/plans/user/<user_id>/active`
- `PATCH /api/plans/<plan_id>/actions/<action_id>`

## RAG and Gemini

The backend RAG flow:

- loads support documents from `backend/Rag/data`
- builds or reuses a FAISS vector store in `backend/Rag/vectorstore`
- retrieves relevant support content
- sends the final prompt to Gemini

The live chat path uses Gemini through `backend/services/llm_service.py`.

If Gemini is overloaded or unavailable:

- the backend catches the error
- the app returns a supportive demo fallback response
- chat can continue instead of showing a raw model failure

## Testing Notes

Type-check the frontend:

```powershell
cd frontend
npx tsc --noEmit --pretty false
```

Run backend tests if present:

```powershell
cd backend
python -m pytest
```

## Important Notes

- `results` stores derived model outputs, not the full questionnaire
- `assessments` stores the full raw answers
- `plans` are generated from the most recent assessment
- chat persists both the user message and the assistant response
- chat can discuss prior results and the user's current active plan

## Security Notice

UrgeEase is not a licensed medical or mental health service.

If a user expresses self-harm or suicide intent, the system should return crisis-oriented support instead of normal coaching.
