# AI Document Authoring Platform

## Demo Video

[![Demo Video](https://img.youtube.com/vi/r7yLTuYm_J8/maxresdefault.jpg)](https://youtu.be/r7yLTuYm_J8?si=Q94fdXniZ34G_gFF)

## Overview

This repository now contains a working prototype for a full-stack AI-powered authoring workflow. The backend targets Python 3.13.4 with Flask, while the frontend relies on HTML + Tailwind (CDN) + vanilla JavaScript. Firestore will be integrated later; for now, in-memory repositories simulate persistence. Gemini remains the planned LLM provider (see `backend/utils/llm_helper.py` for integration notes).

## Repository Structure

- `backend/app.py`: Flask application factory, blueprint registration, health endpoint.
- `backend/models.py`: Dataclasses for users, documents, sessions, and LLM requests.
- `backend/repositories/`: In-memory data access layer (swap with Firestore later).
- `backend/services/`: Business logic orchestrating repositories + future LLM hooks.
- `backend/routes/`: Auth, document, and Gemini generation blueprints.
- `frontend/`: Static dashboard that calls the backend endpoints.
- `README.md`: Setup instructions and project overview.

## Prerequisites

- Python 3.13.4
- Node.js is _not_ required (static frontend).
- A Gemini API key and Firebase project credentials (store them in `.env` only).

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the following:

- `GEMINI_API_KEY` — use a freshly generated key; never commit it.
- `GEMINI_MODEL` — defaults to `gemini-pro`, but can be changed if needed.
- `FIREBASE_PROJECT_ID` — e.g., `oceanai-3ffc0`.
- `FIREBASE_PROJECT_NUMBER` — e.g., `785901331316`.
- `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` — from your Firebase service account.
- `LOCAL_SESSION_SECRET` — random string for signing local sessions.

## Backend Setup

1. **Create and activate a virtual environment**
   ```powershell
   cd ai-doc-platform/backend
   py -3.13 -m venv .venv
   .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```powershell
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   - Duplicate `.env.example` and rename to `.env`.
   - Populate the variables described above (`GEMINI_API_KEY`, Firebase project data, etc.).

4. **Run the Flask backend**
   ```powershell
   $env:FLASK_APP="app.py"
   $env:FLASK_ENV="development"
   flask run --host=127.0.0.1 --port=5000
   ```
   Available endpoints:
   - `GET /health` for status + collection counts.
   - `GET|POST /api/auth/users`
   - `GET|POST /api/auth/sessions`
   - `GET|POST /api/documents/`
   - `GET|POST /api/documents/<id>/versions`
   - `GET|POST /api/generation/requests`
   - `POST /api/generation/requests/<id>/complete`

   Each route currently persists data in memory and returns the dataclass `.to_dict()` payloads.

## Frontend Setup

1. **Serve the static files**
   - Option A: Open `frontend/index.html` directly in the browser.
   - Option B: Serve via a lightweight static server:
     ```powershell
     cd ai-doc-platform/frontend
     python -m http.server 4173
     ```

2. **Use the dashboard**
   - Open `index.html` once the backend is running.
   - Forms exist for creating users, sessions, documents, and Gemini requests; the lists refresh automatically using fetch calls to `http://127.0.0.1:5000`.
   - Tailwind loads from the CDN and custom accents live in `style.css`, so no Node tooling is required.

## Next Steps

- Swap the in-memory repositories with Firestore once credentials + security rules are ready.
- Expand the Gemini helper with retries, safety settings, and streaming support.
- Add authentication/authorization, validation schemas, and error handling middleware.
- Layer on automated tests, linting, and CI before production hardening.

