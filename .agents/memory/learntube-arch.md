---
name: LearnTube Architecture
description: Core architecture decisions for LearnTube — stack, LLM provider, auth, key constraints.
---

# LearnTube Architecture

## Stack
- **Frontend**: React + Vite at `/` (artifact: learntube). Wouter routing, TanStack Query, Framer Motion, Tailwind v4, Shadcn UI.
- **Backend**: Python FastAPI at `/api` (artifact: api-server), port from $PORT env var, run cmd `cd /home/runner/workspace/backend && python main.py`.
- **DB**: SQLite (`./app.db`) via SQLAlchemy + ChromaDB (`./chroma_db`) for vectors.
- **Auth**: Clerk (Replit-managed). Frontend: `@clerk/react` + `@clerk/themes`. Backend: PyJWT via JWKS verification (`backend/services/clerk_auth.py`).

## LLM Provider: Google Gemini
- Package: `google-genai` (NOT `google-generativeai` — deprecated). Import: `from google import genai`.
- Client: `genai.Client(api_key=settings.gemini_api_key)`.
- All LLM calls in `backend/services/llm_service.py`. Config env vars: `GEMINI_API_KEY`, `GEMINI_MODEL` (default: `gemini-2.0-flash`).
- Uses `response_mime_type="application/json"` (JSON mode) for summary, quiz, flashcard generation — no retry needed.
- Chat history: convert `"assistant"` → `"model"` role when building `types.Content` history objects.

**Why switched from Anthropic:** User requested migration from Claude to Gemini (their own API key).

## Key constraints
- Python packages must be installed via `installLanguagePackages` (uv), NOT `pip install` — NixOS blocks pip.
- `backend/main.py` does `os.chdir(backend_dir)` at startup so all relative paths (SQLite, ChromaDB, models) work in both dev and production.
- Vite config uses `tailwindcss({ optimize: false })` — required for Clerk themes CSS in prod builds.
- `index.css` must declare `@layer theme, base, clerk, components, utilities;` BEFORE `@import 'tailwindcss'`.
