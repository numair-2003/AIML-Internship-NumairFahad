# 🎓 LearnTube — AI YouTube Learning Assistant

> **AIML Internship Capstone Project | Numair Fahad | August 2026**

LearnTube transforms any YouTube video into a complete, interactive learning experience powered by Google Gemini and Retrieval-Augmented Generation (RAG). Available as a **live web app** and a **native mobile app** (iOS & Android).

🌐 **Live App:** [ai-you-tube-assistant.replit.app](https://ai-you-tube-assistant.replit.app)
📄 **Project Report:** [`LearnTube_Project_Report.pdf`](../LearnTube_Project_Report.pdf)

---

## 🚀 Features

| Feature | Description |
|--------|-------------|
| 🧠 **RAG Chat** | Ask questions about any video; answers are grounded in transcript chunks with `[MM:SS]` timestamp citations |
| 📝 **AI Summary** | Auto-generated overview, key points, and inferred chapters |
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
│  ├── Transcript Fetcher (youtube-transcript-api)             │
│  ├── Chunker → Embedder (sentence-transformers)              │
│  ├── ChromaDB Vector Store                                   │
│  ├── Intent Classifier (sklearn TF-IDF + LR, ~85% accuracy) │
│  └── LLM Orchestrator → Google Gemini 2.0 Flash             │
│  SQLite + SQLAlchemy (user library, video metadata)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

**Backend**
- Python 3.13, FastAPI, Uvicorn
- `google-genai` SDK (Gemini 2.0 Flash)
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
│       ├── embedding_service.py  # sentence-transformers embeddings
│       ├── vectorstore_service.py# ChromaDB operations
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

1. **Fetch** — `youtube-transcript-api` pulls timestamped captions from any YouTube video
2. **Chunk** — Transcript split into ~200-word semantic chunks, each tagged with a start timestamp
3. **Embed** — `all-MiniLM-L6-v2` generates a dense vector per chunk (local, no API cost)
4. **Store** — Vectors stored in ChromaDB with chunk text and timestamp metadata
5. **Retrieve** — User question → top-5 cosine-similar chunks via ChromaDB similarity search
6. **Generate** — Chunks injected into Gemini 2.0 Flash prompt → grounded answer with `[MM:SS]` citations

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
| **Repo restructure** | All project files (`artifacts/`, `backend/`, `chroma_db/`) moved inside `ai_youtube_learning_assistant/`. `pnpm-workspace.yaml` and all `artifact.toml` / `tsconfig.json` paths updated accordingly. Nothing now lives at the repo root. |
| **Clerk session drop (production)** | Clerk proxy on the backend was blocked when using development keys (`sk_test_`). Removed the `sk_live` restriction — proxy now works with any valid `CLERK_SECRET_KEY`, so sessions persist correctly in production. |
| **Infinite spinner on `/app`** | `AppPage` now shows a branded loading spinner while Clerk initialises (instead of a white flash or immediate wrong redirect). Only redirects to `/` once `isLoaded=true` and user is confirmed signed-out. |
| **OAuth redirect always lands on `/app`** | Changed `fallbackRedirectUrl` → `forceRedirectUrl` on `<SignIn>` and `<SignUp>` components + `ClerkProvider`. Post-OAuth redirect is now unconditional. |
| **Dev preview host detection** | Added `127.0.0.1` and numeric-IP patterns to the dev-host list so the Clerk proxy is correctly skipped in the Replit workspace preview (which accesses the app via `127.0.0.1`). |
| **Verification email spam hint** | Sign-up and sign-in verification screens now show: *"Check your spam/junk folder if the code doesn't arrive within a minute"* and a friendlier resend button. |

---

*Built as the capstone project of the AIML Internship Program at Zynvex Solutions, August 2026.*
