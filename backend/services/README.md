# Services Folder

This folder contains the backend business logic for the UrgeEase application.

The service files are called by the Flask route files and handle the actual work of the application, such as prediction, database storage, session management, and authentication.

## Files

### `model_service.py`

Loads the trained Random Forest models and performs inference.

Responsibilities:

- load `.joblib` models
- convert request payloads into DataFrames
- generate addiction score predictions
- generate dependence risk predictions
- map predictions to user-friendly labels
- return probability distributions where available

This file contains ML inference logic only.

---

### `auth_service.py`

Handles user account operations.

Responsibilities:

- register a new user
- hash passwords
- validate login credentials
- update user profile data
- soft delete user accounts
- fetch user details

This file contains user account and authentication logic.

---

### `session_service.py`

Handles session storage and updates.

Responsibilities:

- create sessions
- fetch a user’s sessions
- fetch one session’s details
- mark sessions as completed
- archive sessions

This file manages chat or voice session metadata.

---

### `message_service.py`

Handles storing and retrieving conversation messages.

Responsibilities:

- add messages to a session
- fetch all messages in a session
- delete messages
- update session message counts

This file manages the actual conversation records.

---

### `result_service.py`

Handles storing and retrieving prediction results.

Responsibilities:

- save addiction score results
- save dependence risk results
- fetch all results for a user
- fetch latest result
- fetch a result by ID

Current behavior:

- validates `userId`, `sessionId`, and `resultId` before querying or saving
- saves prediction results with linked user and session references
- supports user history lookup for dashboard views and chat context

This file manages persistence of model outputs for dashboards, history, and tracking.

---

### `chat_service.py`

Handles the session-based recovery assistant flow.

Responsibilities:

- load recent session message history
- load latest and previous assessment results for the user
- build assessment context for RAG generation
- save both user and assistant chat messages
- fall back to the session owner when resolving chat result context
This file manages recovery-assistant response generation and persistence for chat sessions.
