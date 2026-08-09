---
name: LearnTube architecture
description: Key architectural decisions for the LearnTube AI YouTube Learning Assistant
---

## Stack
- **Backend**: FastAPI (Python 3.13) at `/api` path, port 8080, in `backend/`
- **Frontend**: React + Vite + Tailwind at `/` path, in `artifacts/learntube/`
- **Vector store**: ChromaDB with `DefaultEmbeddingFunction` (ONNX, all-MiniLM-L6-v2) — NO PyTorch/sentence-transformers
- **Relational DB**: SQLite via SQLAlchemy, `SQLITE_DB_PATH=./app.db` (relative to backend dir)
- **LLM**: Anthropic Claude via `ANTHROPIC_API_KEY` secret, model in `CLAUDE_MODEL` env var
- **Intent classifier**: sklearn TF-IDF + LogisticRegression, saved to `backend/models/intent_classifier/classifier.pkl`

## Why no PyTorch/sentence-transformers
PyTorch could not be resolved by the Replit package manager. ChromaDB's built-in `DefaultEmbeddingFunction` uses the same `all-MiniLM-L6-v2` model via ONNX runtime — no PyTorch needed.

## Path routing (Replit monorepo)
- Frontend `BASE_URL` = `/` → API calls go to `/api/...` → Replit proxy routes to API server
- API server `previewPath = "/api"`, listens on port 8080

## Key env vars (set as Replit non-secret env vars)
- `CLAUDE_MODEL=claude-sonnet-4-6`
- `SQLITE_DB_PATH=./app.db`
- `CHROMA_PERSIST_DIR=./chroma_db`
- `INTENT_MODEL_PATH=./models/intent_classifier`
- `ANTHROPIC_API_KEY` — set as Replit Secret

**Why:** All relative paths resolve from `backend/` because `main.py` does `os.chdir(os.path.dirname(os.path.abspath(__file__)))` at startup.
