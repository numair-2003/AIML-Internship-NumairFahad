# 🎓 LearnTube — AI YouTube Learning Assistant

> **AIML Internship Project | Numair Fahad | 2025**

LearnTube transforms any YouTube video into a complete, interactive learning experience powered by Google Gemini and Retrieval-Augmented Generation (RAG).

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

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  React + Vite Frontend  (Tailwind CSS v4, shadcn/ui) │
│  Authentication: Clerk (JWT + Google OAuth)           │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (HTTPS)
┌──────────────────────▼──────────────────────────────┐
│  FastAPI Backend (Python 3.13)                       │
│  ├── Transcript Fetcher (youtube-transcript-api)     │
│  ├── Chunker → Embedder (sentence-transformers)      │
│  ├── ChromaDB Vector Store                           │
│  ├── Intent Classifier (sklearn TF-IDF + LR)         │
│  └── LLM Orchestrator → Google Gemini 2.0 Flash     │
│  SQLite + SQLAlchemy (user library, metadata)         │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

**Backend**
- Python 3.13, FastAPI, Uvicorn
- `google-genai` SDK (Gemini 2.0 Flash)
- ChromaDB (vector store), sentence-transformers (all-MiniLM-L6-v2)
- SQLite + SQLAlchemy ORM
- youtube-transcript-api, scikit-learn, PyJWT

**Frontend**
- React 18, Vite 6, TypeScript
- Tailwind CSS v4, shadcn/ui, Radix UI
- Framer Motion, TanStack Query, Wouter
- Clerk (`@clerk/react`) for authentication

---

## 📁 Project Structure

```
ai_youtube_learning_assistant/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # SQLAlchemy setup
│   ├── requirements.txt     # Python dependencies
│   ├── routers/
│   │   ├── videos.py        # Video ingestion & learning endpoints
│   │   └── library.py       # User library CRUD
│   └── services/
│       ├── llm_service.py        # Gemini LLM calls (RAG, summary, quiz, flashcards)
│       ├── transcript_service.py # YouTube transcript fetching
│       ├── chunking_service.py   # Text chunking with timestamps
│       ├── embedding_service.py  # sentence-transformers embeddings
│       ├── vectorstore_service.py# ChromaDB operations
│       ├── ingestion_service.py  # Full pipeline orchestrator
│       ├── summary_service.py    # Summary persistence
│       ├── intent_service.py     # Query intent classification
│       └── clerk_auth.py         # JWT verification (PyJWT + JWKS)
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root + Clerk provider + routing
│   │   ├── pages/
│   │   │   ├── HomePage.tsx     # Public landing page
│   │   │   └── VideoWorkspace.tsx # Main learning workspace
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx    # RAG chat interface
│   │   │   ├── SummaryPanel.tsx # Summary display
│   │   │   ├── QuizPanel.tsx    # Interactive quiz
│   │   │   └── FlashcardPanel.tsx # Flip card flashcards
│   │   └── api/
│   │       └── client.ts        # API call functions
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── README.md
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
# CLERK_SECRET_KEY=your_clerk_key
python main.py
```

### Frontend
```bash
cd frontend
pnpm install
# Set .env:
# VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
pnpm dev
```

---

## 🤖 RAG Pipeline

1. **Fetch** — youtube-transcript-api pulls timestamped captions
2. **Chunk** — Transcript split into ~200-word semantic chunks
3. **Embed** — all-MiniLM-L6-v2 generates dense vectors per chunk
4. **Store** — Vectors stored in ChromaDB with metadata
5. **Retrieve** — User question → top-5 cosine-similar chunks
6. **Generate** — Chunks injected into Gemini prompt → grounded answer with `[MM:SS]` citations

---

## 📊 Results

- ✅ Full RAG pipeline with timestamp citations
- ✅ AI summary, quiz, and flashcard generation via Gemini JSON mode
- ✅ Intent classifier with ~85% accuracy
- ✅ Clerk authentication (Google OAuth + email/password)
- ✅ Per-user video library
- ✅ Production-quality animated UI

---

*Built as part of the AIML Internship Program, 2025.*
