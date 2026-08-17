# 🎓 LearnTube — AI YouTube Learning Assistant

> **AIML Internship Capstone Project | Numair Fahad | August 2026**

LearnTube transforms any YouTube video into a complete, interactive learning experience powered by Google Gemini and Retrieval-Augmented Generation (RAG). It is available as a **live web app** and a **native mobile app** (iOS and Android).

🌐 **Live App:** [ai-you-tube-assistant.replit.app](https://ai-you-tube-assistant.replit.app)
📄 **Project Report:** [`LearnTube_Project_Report.pdf`](../LearnTube_Project_Report.pdf)

---

## 🚀 Features

| Feature | Description |
|--------|-------------|
| 🧠 **RAG Chat** | Ask questions about any video; answers are grounded in transcript chunks with `[MM:SS]` timestamp citations |
| 📝 **AI Summary** | Auto-generated overview, key points, and inferred chapters (Gemini Flash) |
| ❓ **Quiz Generator** | 5–10 multiple-choice questions with explanations |
| 🃏 **Flashcards** | 8–12 flip cards for spaced-repetition study |
| 🔐 **Authentication** | Clerk-managed auth (Google OAuth + email/password + forgot password) |
| 📚 **Video Library** | Per-user persistent library to revisit learning sessions |
| 📱 **Mobile App** | Native Expo / React Native companion app for iOS & Android — full feature parity |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Web Frontend: React 18 + Vite (Tailwind CSS v4, shadcn/ui) │
│  Mobile Frontend: Expo 53 / React Native 0.79               │
│  Authentication: Clerk (JWT + Google OAuth) — web & mobile  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (HTTPS)
┌──────────────────────────▼──────────────────────────────────┐
│  FastAPI Backend (Python 3.13)                               │
│  ├── Transcript Fetcher (youtube-transcript-api + yt-dlp)    │
│  ├── Chunker → Embedder (sentence-transformers)              │
│  ├── ChromaDB Vector Store                                   │
│  ├── Intent Classifier (sklearn TF-IDF + LR, ~85% accuracy) │
│  └── LLM Orchestrator → Google Gemini Flash (gemini-flash-lite-latest)             │
│  SQLite + SQLAlchemy (user library, video metadata)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

**Backend**
- Python 3.13, FastAPI, Uvicorn
- `google-genai` SDK (Gemini Flash — `gemini-flash-lite-latest`)
- ChromaDB (vector store), sentence-transformers (all-MiniLM-L6-v2)
- SQLite + SQLAlchemy ORM
- youtube-transcript-api, scikit-learn, PyJWT, slowapi

**Web Frontend**
- React 18, Vite 6, TypeScript
- Tailwind CSS v4, shadcn/ui, Radix UI
- Framer Motion, TanStack Query, Wouter
- Clerk (`@clerk/react`) for authentication

**Mobile App**
- Expo 53, React Native 0.79, TypeScript
- Expo Router, Expo Go (scan QR to run on device)
- Clerk (`@clerk/expo`) for native authentication

---

## 📁 Project Structure

```
ai_youtube_learning_assistant/   ← this folder (monorepo root symlink)
├── backend/                     ← FastAPI API server
│   ├── main.py                  # Entry point (uvicorn)
│   ├── config.py                # Environment config
│   ├── database.py              # SQLAlchemy setup
│   ├── rate_limiter.py          # slowapi rate limiter
│   ├── requirements.txt         # Python dependencies
│   ├── routers/
│   │   ├── videos.py            # Ingestion & learning endpoints
│   │   └── library.py           # User library CRUD
│   └── services/
│       ├── llm_service.py        # Gemini calls (RAG, summary, quiz, flashcards)
│       ├── transcript_service.py # YouTube transcript fetching
│       ├── chunking_service.py   # Semantic chunking with timestamps
│       ├── vectorstore_service.py # ChromaDB operations + ONNX embeddings
│       ├── ingestion_service.py  # Full pipeline orchestrator
│       ├── summary_service.py    # Summary persistence
│       ├── intent_service.py     # Query intent classification
│       └── clerk_auth.py         # JWT verification (PyJWT + JWKS)
├── artifacts/learntube/         ← React/Vite web frontend
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   └── VideoWorkspace.tsx
│       └── components/
│           ├── ChatPanel.tsx
│           ├── SummaryPanel.tsx
│           ├── QuizPanel.tsx
│           └── FlashcardPanel.tsx
├── artifacts/learntube-mobile/  ← Expo / React Native mobile app
│   └── src/
│       ├── app/                 # Expo Router screens
│       └── components/
├── LearnTube_Project_Report.pdf ← Full project report
└── scripts/
    └── generate_report.py       # Regenerates the PDF report
```

---

## 🚦 Setup & Running

### Prerequisites
- Python 3.13+, Node.js 20+, pnpm

### Backend
```bash
cd backend
pip install -r requirements.txt
# Set environment variables:
# GEMINI_API_KEY=your_key
# CLERK_SECRET_KEY=your_clerk_secret_key
# SESSION_SECRET=any_random_string
python main.py
```

### Web Frontend
```bash
cd artifacts/learntube
pnpm install
# Set .env:
# VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
pnpm dev
```

### Mobile App
```bash
cd artifacts/learntube-mobile
pnpm install
# Set environment variables:
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
# EXPO_PUBLIC_API_BASE_URL=https://your-backend-url
pnpm dev
# Scan the QR code with Expo Go (iOS/Android)
```

---

## 🤖 RAG Pipeline

1. **Fetch** — `youtube-transcript-api` (with Webshare proxy) + `yt-dlp` fallback fetch timestamped captions reliably from cloud IPs
2. **Chunk** — Transcript split into ~200-word semantic chunks, each tagged with a start timestamp
3. **Embed** — `all-MiniLM-L6-v2` generates a dense vector per chunk (local ONNX, no API cost)
4. **Store** — Vectors stored in ChromaDB with chunk text and timestamp metadata
5. **Retrieve** — User question → top-5 cosine-similar chunks via ChromaDB similarity search
6. **Generate** — Chunks injected into Gemini Flash prompt → grounded answer with `[MM:SS]` citations

---

## 📊 Results

- ✅ Full RAG pipeline with timestamp citations
- ✅ AI summary, quiz, and flashcard generation via Gemini JSON mode
- ✅ Intent classifier with ~85% accuracy (scikit-learn TF-IDF + Logistic Regression)
- ✅ Clerk authentication — Google OAuth + email/password + forgot-password (web & mobile)
- ✅ Per-user video library with full CRUD
- ✅ Production-quality animated UI (Tailwind CSS v4, Framer Motion, shadcn/ui)
- ✅ Native mobile app — Expo 53 / React Native 0.79 for iOS & Android
- ✅ Live deployment at [ai-you-tube-assistant.replit.app](https://ai-you-tube-assistant.replit.app)

---

## 🔧 Recent Fixes & Improvements (August 2026)

| Fix | Detail |
|-----|--------|
| **Repo restructure** | All project files (`artifacts/`, `backend/`, `chroma_db/`) moved inside `ai_youtube_learning_assistant/`. `pnpm-workspace.yaml` and all `artifact.toml` / `tsconfig.json` paths updated accordingly. |
| **Clerk session drop (production)** | Clerk proxy now works with any valid `CLERK_SECRET_KEY`; uses `REPLIT_DOMAINS` (not `REPLIT_DEV_DOMAIN`) for `Clerk-Proxy-Url` header. |
| **Infinite spinner on `/app`** | `AppPage` shows a branded loading spinner while Clerk initialises; only redirects once `isLoaded=true`. |
| **OAuth redirect** | `forceRedirectUrl` on `<SignIn>`/`<SignUp>` ensures post-OAuth lands on `/app` unconditionally. |
| **Production startup** | `run_server.sh` resolves Python at runtime via `readlink -f`; falls back to Nix-store glob. `reload=False` on uvicorn prevents file-watcher startup hang. |
| **Summary stuck loading** | `GET /api/videos/{id}/summary` now builds the summary directly from stored ChromaDB chunks instead of re-fetching the transcript from YouTube. Eliminates the 60-second timeout and error. |
| **Quiz & Flashcards** | Same fix as summary — both endpoints auto-generate from ChromaDB chunks on first request. |
| **Chat 500 error** | Returns HTTP 404 with a clear message when ChromaDB has no transcript data, instead of a generic 500. |
| **YouTube transcript via yt-dlp** | Transcript service now uses yt-dlp (without cookies) as the primary cloud-safe fallback — reliably fetches subtitles from most IPs. Set `YOUTUBE_PROXY_URL` (Webshare rotating residential) or `YOUTUBE_COOKIES` (browser export) for extra reliability. |
| **Transcript lazy proxy init** | `_get_yta()` factory now rebuilds the `YouTubeTranscriptApi` instance when env vars change — picks up `YOUTUBE_PROXY_URL` set after server start. `WebshareProxyConfig` auto-detected from Webshare-format proxy URLs. |
| **yt-dlp subtitle download** | yt-dlp writes subtitle files to disk (json3 format) via its native download mechanism — no URL re-fetch race condition. |
| **Vite proxy for /api** | Added `server.proxy` to `vite.config.ts` — `/api/*` requests now correctly reach the FastAPI backend in development. |
| **Gemini model updated** | Migrated from `gemini-2.0-flash` (deprecated/removed) to `gemini-flash-lite-latest`. All summary, quiz, flashcard, and RAG chat generation confirmed working. |
| **FastAPI lifespan handler** | Replaced deprecated `@app.on_event("startup")` with `lifespan=` context manager — no more deprecation warnings in logs. |
| **Background summary uses ChromaDB** | `process_video` background summary task now reads already-stored chunks from ChromaDB instead of re-fetching from YouTube — faster and works without a proxy. |
| **ONNX model path (production fix)** | `vectorstore_service.py` patches `ONNXMiniLM_L6_V2.DOWNLOAD_PATH` at import time, directing the 90 MB embedding model into `backend/.chroma_onnx/` (included in the container image) instead of `~/.cache/` (wiped on deploy). |
| **yt-dlp added** | Added `yt-dlp>=2026.7.4` to `pyproject.toml` for cloud-safe transcript fallback (works without cookies). |

---

*Built as the capstone project of the AIML Internship Program at Zynvex Solutions, August 2026.*
