# Threat Model

## Project Overview

LearnTube is an AI YouTube Learning Assistant built with FastAPI (Python) on the backend and a React/TypeScript frontend. It allows users to submit YouTube video URLs for processing, then chat with the transcript (RAG-powered Q&A), view summaries, take quizzes, and review flashcards. The backend uses SQLite (via SQLAlchemy/Drizzle), ChromaDB for vector embeddings, and the Google Gemini API for LLM features. Clerk is integrated as the authentication provider. The app is deployed publicly on Replit autoscale at `https://ai-you-tube-assistant.replit.app`.

## Assets

- **Chat history and generated content** — user conversations stored per video in SQLite; summaries, quizzes, and flashcards keyed by video ID. No user-level scoping currently exists.
- **Google Gemini API key** — grants access to AI generation features; quota exhaustion could disable the service.
- **Clerk secret key** — used to authenticate JWKS fetches and in the Clerk FAPI proxy; leak would allow impersonation of the backend toward Clerk.
- **ChromaDB vector store** — contains chunked transcript embeddings; tampering would corrupt RAG search results.
- **SQLite database** — stores all application state; accessible from server filesystem.

## Trust Boundaries

- **Public internet → FastAPI backend** — all HTTP requests from browsers or API clients. Currently no authentication is enforced at any endpoint; the backend trusts all callers.
- **Backend → Google Gemini API** — uses `GEMINI_API_KEY` for LLM calls. Key must stay server-side.
- **Backend → Clerk FAPI** — the `/api/__clerk/{path}` proxy forwards client requests to Clerk, injecting `Clerk-Secret-Key`. Caller-controlled headers influence the `Clerk-Proxy-Url` header sent upstream.
- **Backend → YouTube oEmbed / Transcript APIs** — fetches metadata and transcripts; video ID derived from user-supplied URL.

## Scan Anchors

- Production entry points: `backend/main.py` (FastAPI app), `backend/routers/videos.py`, `backend/routers/library.py`
- Highest-risk areas: auth dependency in `backend/services/clerk_auth.py` (implemented but unused), Clerk proxy in `backend/main.py:51-111`, AI call paths in `backend/services/llm_service.py`
- Public surface: every `/api/*` endpoint — no endpoint currently requires authentication
- Dev-only: `artifacts/mockup-sandbox/` — design mockup only, not production-reachable
- Auth implementation exists (`require_auth`, `get_current_user`) but is wired to zero routes

## Threat Categories

### Spoofing / Broken Authentication

Clerk JWT verification is fully implemented in `backend/services/clerk_auth.py` (`require_auth`, `get_current_user`), but the dependency is applied to **zero routes**. Every endpoint — video processing, chat, summary, quiz, flashcards, library, and chat-history deletion — is publicly accessible without any token. The service is deployed publicly, so any internet user can use all features as an unauthenticated attacker.

All API endpoints MUST use `Depends(require_auth)` before returning data or performing actions.

### Tampering / Data Integrity

Because there is no authentication or per-user ownership on any database record, any caller can delete any video's chat history (`DELETE /api/videos/{video_id}/chat/history`) or trigger reprocessing of any video (`POST /api/videos/process`). There is no user-to-resource binding in the data model.

### Information Disclosure

All videos, chat messages, summaries, quizzes, and flashcards are shared across all callers. There is no user isolation; any caller can read any other caller's chat history by guessing or enumerating video IDs (YouTube video IDs are public and predictable).

CORS is configured with `allow_origins=["*"]` and `allow_credentials=True`. Per the CORS spec, browsers reject wildcard origins when credentials are included, so cookies are not forwarded cross-origin. However, the misconfiguration is present in production code that carries a comment "tighten in production."

### Denial of Service

No rate limiting exists on any endpoint. The video processing endpoint (`POST /api/videos/process`) triggers a full ingestion pipeline (transcript fetch + ChromaDB embedding) and a background Gemini summary generation call. The chat endpoint triggers Gemini API calls. An unauthenticated attacker can issue unlimited requests, exhausting the Gemini API quota and degrading service for all users.

### Elevation of Privilege

The Clerk FAPI proxy (`/api/__clerk/{path:path}`) forwards the `x-forwarded-host` request header (a user-controlled value) into the `Clerk-Proxy-Url` header sent to Clerk's FAPI. An attacker can supply an arbitrary `x-forwarded-host` value to manipulate the proxy URL that Clerk records for the session, potentially interfering with Clerk's routing or session binding logic.
