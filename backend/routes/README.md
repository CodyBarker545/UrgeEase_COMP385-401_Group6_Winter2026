# Routes Folder

This folder contains the Flask route files for the UrgeEase backend API.

Each file defines a set of related endpoints and keeps the HTTP layer separate from the business logic in the `services` folder.

## Files

### `auth_routes.py`

Handles user authentication and account-related actions.

Endpoints include:

- user registration
- user login
- fetching user details
- updating user profile fields
- soft deleting a user

This file is responsible for requests related to user identity and account management.

---

### `session_routes.py`

Handles conversation session management.

Endpoints include:

- creating a new session
- fetching all sessions for a user
- fetching one session’s details
- marking a session as completed
- archiving a session

This file is responsible for session lifecycle management.

---

### `message_routes.py`

Handles messages stored inside a session.

Endpoints include:

- adding a message to a session
- fetching all messages from a session
- deleting a message

This file manages conversation content between the user and the assistant.

---

### `result_routes.py`

Handles retrieval of saved model outputs.

Endpoints include:

- fetching all saved results for a user
- fetching the latest result for a user
- fetching one specific result by ID

Notes:

- invalid `userId` and `resultId` values now return `400`
- user history is returned newest first
- results are expected to be linked to a saved `userId`

This file supports dashboard/history-style features.

---

### `prediction_routes.py`

Handles model inference endpoints.

Endpoints include:

- predicting addiction score using the social media addiction model
- predicting dependence risk using the behavioral dependence model

Notes:

- both prediction endpoints now require `userId` and `sessionId`
- prediction results are saved only when both IDs are valid
- this ensures saved results can later be retrieved through `/api/results/user/<user_id>`

This file validates request data, calls the ML model service, and saves the prediction result through the result service.

---

### `chat_routes.py`

Handles the recovery assistant chat endpoint for an existing session.

Endpoints include:

- generating an initial assistant response after assessment
- generating follow-up chat responses inside a session

Notes:

- the route is `POST /api/sessions/<session_id>/chat`
- the request body must contain the user `userId`
- the session ID comes from the route parameter, not the request body

This file coordinates chat generation and message persistence for session-based recovery conversations.
