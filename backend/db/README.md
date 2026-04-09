# Database Setup (MongoDB)

This project uses **MongoDB Atlas** as the primary database for storing users, sessions, messages, and prediction results.

---

## Overview

The database is automatically initialized using a Python script:
init_db.py

This script creates:

- Collections:
  - `users`
  - `sessions`
  - `messages`
  - `results`
  - `trigger_logs`
  - `crisis_resources`

- Indexes for:
  - faster queries
  - efficient lookups
  - improved performance

---

## Prerequisites

Before running the database setup, ensure:

- You have a **MongoDB Atlas cluster**
- You have a valid **connection string (MONGO_URI)**
- Your IP address is allowed in MongoDB Network Access

---

## Step 1 — Configure Environment Variables

Create a `.env` file in the **backend folder**:
backend/.env

Add your MongoDB connection string:
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=UrgeEase
FLASK_ENV=development

Example:
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=UrgeEase
FLASK_ENV=development

---

## Step 2 — Initialize the Database

From the **backend folder**, run:

```bash
python init_db.py
```

## Notes

- `init_db.py` creates collections and indexes only
- it does not insert users, sessions, messages, or prediction results
- application data is created through the API routes

## Results Storage

Prediction results in `results` are linked by:

- `userId`
- `sessionId`
- `generatedAt`

Current backend behavior requires valid `userId` and `sessionId` values when saving prediction results so that history retrieval and chat context loading work correctly.
