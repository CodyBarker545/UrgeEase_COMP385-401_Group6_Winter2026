# Services Folder

This folder contains the backend business logic for UrgeEase.

The route files call these services to perform application work such as authentication, session persistence, model inference, assessment submission, recovery plan creation, result analytics, trigger analysis, and chat generation.

## Files

### `model_service.py`

Loads the trained Random Forest models and performs inference.

Responsibilities:

- load `.joblib` model files
- convert request payloads into model-ready inputs
- predict addiction score
- predict dependence risk
- map predictions to user-facing labels
- return probability data where available

### `auth_service.py`

Handles user account operations.

Responsibilities:

- register a new user
- hash and verify passwords
- validate login credentials
- update profile data
- soft delete accounts
- fetch user details

### `session_service.py`

Handles session records.

Responsibilities:

- create sessions
- fetch sessions for a user
- fetch one session
- mark a session completed
- archive sessions

### `message_service.py`

Handles message persistence.

Responsibilities:

- add messages to a session
- fetch all messages in a session
- delete messages
- keep session message counts in sync

This service stores both user and assistant chat turns in the `messages` collection.

### `result_service.py`

Handles storing, retrieving, and analyzing model outputs.

Responsibilities:

- save addiction score results
- save dependence risk results
- tag results by `resultType`
- fetch all results for a user
- fetch the latest addiction result for dashboard and chat use
- fetch a result by ID
- build analytics across previous results

Current behavior:

- validates `userId`, `sessionId`, and `resultId`
- stores outputs with linked `userId`, `sessionId`, and `assessmentId`
- supports result history for dashboards, trends, and chat context
- summarizes score trends, dependence trends, recurring triggers, and improvement status

### `assessment_service.py`

Handles the full assessment submission workflow.

Responsibilities:

- validate and normalize assessment data passed from the route layer
- run both Random Forest models
- store the raw questionnaire in `assessments`
- save both model outputs through `ResultService`
- analyze top triggers through `TriggerService`
- link result records back to the assessment using `assessmentId`
- create a new recovery plan through `PlanService`

This service is the main backend entry point for assessment submissions from the frontend.

### `trigger_service.py`

Analyzes assessment answers to identify likely struggle areas.

Responsibilities:

- score possible triggers from assessment inputs
- return top triggers with short explanations
- provide recommendation text for results, plans, analytics, and chat context

### `plan_service.py`

Handles recovery plan generation and updates.

Responsibilities:

- choose the primary focus area from the most recent assessment
- use trigger analysis when available
- create a new active plan with summary, goals, and actions
- archive older active plans for the same user
- fetch the current active plan
- update action completion state

Current plan focus areas include:

- `distractibility`
- `sleep`
- `validation`
- `mindless_use`

### `llm_service.py`

Handles shared access to the RAG chain.

Responsibilities:

- use local chatbot mode by default
- keep Gemini available as an optional future provider
- build or reuse the FAISS-backed RAG chain
- send prompts to the active chat provider
- return retrieved-answer output to the chat service

This service caches one chain instance so the backend does not rebuild the RAG pipeline on every request.

### `chat_service.py`

Handles the recovery assistant chat workflow.

Responsibilities:

- load recent session message history
- load the latest and previous saved results for the user
- build a short progress summary for prompt context
- load the user's active recovery plan
- guide responses toward the highest-risk assessment area and pending plan actions
- call the local RAG pipeline by default
- keep replies brief, natural, and practical
- save both the user message and the assistant reply

This service powers the application's main session-based support conversation.
