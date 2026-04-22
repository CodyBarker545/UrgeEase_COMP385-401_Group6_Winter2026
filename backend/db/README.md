# Database Setup (MongoDB)

UrgeEase uses MongoDB to store users, sessions, messages, assessment submissions, model outputs, recovery plans, trigger logs, and crisis resources.

## Overview

Database setup is handled by:

```text
backend/db/init_db.py
```

The script creates the main collections and indexes used by the application.

## Collections Created

- `users`
- `sessions`
- `messages`
- `results`
- `assessments`
- `plans`
- `trigger_logs`
- `crisis_resources`

## Prerequisites

Before running the setup script, make sure you have:

- a MongoDB connection string
- a target database name
- network access allowed for your machine if using MongoDB Atlas

## Environment Variables

Create `backend/.env` with:

```text
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=UrgeEase
FLASK_ENV=development

# Optional future hosted LLM mode:
# CHAT_LLM_PROVIDER=gemini
# GEMINI_API_KEY=your_actual_key_here
```

## Running the Setup Script

From `backend`:

```powershell
python db\init_db.py
```

From `backend\db`:

```powershell
python init_db.py
```

## What `init_db.py` Does

The script:

- connects to MongoDB
- creates missing collections
- creates the indexes the app expects

It does not create demo users, insert assessment data, insert chat messages, or insert result history. That application data is created through the API.

## Collection Responsibilities

### `users`

Stores account-level information such as email, password hash, profile data, and soft-delete status.

### `sessions`

Stores chat session metadata. Voice is currently a frontend placeholder for future work.

### `messages`

Stores both user and assistant messages for a session.

### `results`

Stores derived model outputs only.

Each result can include:

- `userId`
- `sessionId`
- `assessmentId`
- `resultType`
- `generatedAt`
- `modelName`
- `addictionScore`
- `predictedClass`
- `riskLevel`
- `probabilities`
- `topTriggers`
- `recommendations`

### `assessments`

Stores the raw questionnaire submission.

Each assessment includes:

- `userId`
- `sessionId`
- `submittedAt`
- `answers`
- `addictionResult`
- `dependenceResult`
- `topTriggers`

The embedded result summaries include linked `resultId` values after the result records are saved.

### `plans`

Stores recovery plans created from the latest assessment.

Each plan includes:

- `userId`
- `assessmentId`
- `sessionId`
- `createdAt`
- `reviewDate`
- `status`
- `focusArea`
- `riskLevel`
- `summary`
- `goals`
- `actions`

When a new plan is created for a user, older active plans are archived.

## Important Indexes

The app relies on these main index patterns:

- `results`: by `userId`, `sessionId`, and `assessmentId`
- `assessments`: by `userId` and `sessionId`
- `plans`: by `userId + status` and by `assessmentId`
- `messages`: by `sessionId` and `userId`
- `sessions`: by `userId`

For the exact create statements, see:

```text
backend/db/CreateCollectionIndexes.txt
```
