# Routes Folder

This folder contains the Flask blueprints for the UrgeEase backend API.

Routes handle request validation, route parameters, JSON bodies, HTTP response formatting, and delegation to service-layer business logic.

## Files

### `auth_routes.py`

Handles user account and authentication endpoints.

Main responsibilities:

- register a user
- log in a user
- fetch user details
- update profile fields
- soft delete a user

### `session_routes.py`

Handles session lifecycle endpoints.

Main responsibilities:

- create a session
- fetch sessions for a user
- fetch one session
- mark a session as completed
- archive a session

### `message_routes.py`

Handles stored session messages.

Main responsibilities:

- add a message to a session
- fetch all messages in a session
- delete a message

### `result_routes.py`

Handles retrieval of saved model outputs and analytics.

Main responsibilities:

- fetch all saved results for a user
- fetch the latest addiction result for a user
- fetch result analytics for a user
- fetch one result by ID

Notes:

- results are returned newest first
- invalid `userId` and `resultId` values return `400`
- results are expected to be linked to a valid `userId`
- analytics include trend direction, score history, dependence history, and recurring triggers

### `prediction_routes.py`

Handles the lower-level model inference endpoints.

Main responsibilities:

- predict addiction score
- predict dependence risk

Notes:

- these routes still exist
- they require valid `userId` and `sessionId` when saving outputs
- the main frontend assessment flow now uses `POST /api/assessments` instead of calling both prediction routes directly

### `assessment_routes.py`

Handles the full assessment submission flow.

Main route:

- `POST /api/assessments`

This route:

- validates the complete questionnaire payload
- calls `AssessmentService`
- runs both Random Forest models
- analyzes top triggers
- stores raw answers in `assessments`
- stores model outputs in `results`
- creates a recovery plan in `plans`

### `plan_routes.py`

Handles recovery plan endpoints.

Main routes:

- `GET /api/plans/user/<user_id>/active`
- `PATCH /api/plans/<plan_id>/actions/<action_id>`

This route group supports:

- fetching the user's current active plan
- marking individual plan actions complete or incomplete

### `chat_routes.py`

Handles session-based recovery assistant chat.

Main route:

- `POST /api/sessions/<session_id>/chat`

Current behavior:

- accepts the session ID from the URL
- accepts the user `userId` in the body
- builds chat context from recent messages, saved results, result history, top triggers, and the active plan
- generates a short assistant response through the local RAG pipeline by default
- saves both the user message and the assistant message in MongoDB
