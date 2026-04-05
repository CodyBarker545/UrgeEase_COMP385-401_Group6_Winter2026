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

This file manages persistence of model outputs for dashboards, history, and tracking.
