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
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

---

## Step 2 — Initialize the Database

From the **backend folder**, run:

```bash
python db/init_db.py
```
