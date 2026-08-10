# AI YouTube Learning Assistant — Project Build Script

**Purpose of this document:** A complete specification to hand to a Replit AI agent so it can design, build, and deploy the application end-to-end (frontend, backend, RAG pipeline, and deployment) without further clarification. Everything the agent needs — features, architecture, data flow, schema, API contracts, prompts, and deployment steps — is defined below.

---

## 1. Project Summary

**Product name (working title):** LearnTube — AI YouTube Learning Assistant

**One-line pitch:** Paste any YouTube video link and instantly chat with its content — ask questions, get an AI-generated summary, jump to the exact timestamp an answer came from, and generate a quiz to test your understanding.

**Core problem it solves:** Long educational YouTube videos (lectures, tutorials, podcasts) are hard to search, skim, or revisit. This tool turns any video's transcript into a searchable, question-answerable knowledge base using Retrieval-Augmented Generation (RAG), so learners can extract exactly the information they need without rewatching the whole video.

**Target user:** Students and self-learners who use YouTube as a primary learning source (matches the AI/ML internship "learning assistant" theme).

---

## 2. Core Features (MVP → Full Scope)

### Phase 1 — MVP (must-have)
1. **Paste a YouTube URL** → app fetches the video's transcript and metadata (title, channel, thumbnail, duration).
2. **Automatic transcript chunking + embedding** into a vector store (this is the RAG "indexing" step).
3. **Chat interface**: user asks a question about the video; the system retrieves the most relevant transcript chunks and generates a grounded answer using an LLM.
4. **Timestamp citations**: every answer references the specific moment(s) in the video it came from (e.g., "at 4:32"), and clicking a citation seeks the embedded YouTube player to that timestamp.
5. **Auto-generated summary**: a short paragraph summary + 5–8 bullet key points, generated once per video and cached.

### Phase 2 — Core value-adds
6. **Chapter/topic breakdown**: segment the video into auto-detected topics with timestamps (a mini table of contents).
7. **Quiz generation**: generate 5–10 multiple-choice or short-answer questions from the video content, with answer checking.
8. **Flashcard generation**: extract key terms/definitions as flashcards (front/back), exportable.
9. **Video library**: save every processed video to a personal library (recent videos, searchable by title).

### Phase 3 — Stretch goals
10. **Multi-video "course" mode**: group multiple related videos (e.g., a full playlist) into one knowledge base and ask cross-video questions.
11. **Note-taking**: let the user highlight an AI answer or transcript excerpt and save it as a personal note tied to that video/timestamp.
12. **Difficulty-adaptive explanations**: a toggle ("Explain like I'm new to this" vs. "Give me the technical depth") that changes the system prompt's verbosity/level.
13. **Export**: export summary/notes/flashcards as Markdown or PDF.

> Build strictly in this order. Do not start Phase 2 features until Phase 1 is fully working end-to-end (paste link → chat → cited answer). Do not start Phase 3 unless Phase 1 and 2 are stable.

---

## 3. Tech Stack (recommended, Replit-friendly)

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **Python + FastAPI** | Best ecosystem for LLM/NLP/RAG libraries; async support; auto-generated OpenAPI docs for testing endpoints. |
| Frontend framework | **React (Vite) + Tailwind CSS** | Fast dev loop on Replit, component-based, easy to style a clean chat UI. |
| LLM provider | **Google Gemini API** (`gemini-2.0-flash` for chat/summary/quiz generation; a cheaper/faster Gemini model may be used for lightweight tasks) | Single provider, no abstraction layer needed — call the google-genai SDK directly from `llm_service.py`. |
| Embeddings | **`sentence-transformers/all-MiniLM-L6-v2`** (local, free, runs inside the Repl) | Google provides a public embeddings endpoint, so embeddings are handled by a local open-source model — no extra API key or cost, and fast enough for transcript-scale retrieval. |
| Fine-tuning | **HuggingFace `transformers` + `datasets`** (local fine-tuning of a small open-source model — see Section 6) | Used for a specific NLP subtask (see below), separate from the Gemini-powered RAG chat. |
| Vector store | **ChromaDB** (local, file-based, runs directly inside the Repl — no external service needed) | Zero external setup, persists to disk, perfect for a single-deployment Replit app. |
| Relational DB (metadata, users, library, quiz results) | **SQLite** via SQLAlchemy (upgradeable to Postgres later if needed) | Simple, file-based, no external DB service required for MVP. |
| Transcript fetching | **`youtube-transcript-api`** (Python package) | Fetches auto-generated or manual captions directly by video ID, no API key required. |
| Video metadata | **YouTube oEmbed endpoint** (`https://www.youtube.com/oembed?url=...`) for title/thumbnail — no API key needed. Only use the official YouTube Data API v3 if richer metadata is required later (needs an API key). |
| Auth (Phase 2+) | **Simple session-based auth** (e.g., `fastapi-users` or a minimal JWT setup) — not required for MVP if the library is scoped per-browser-session. |
| Deployment | **Replit Deployments (Autoscale)** | Single Repl hosts both FastAPI backend (serving API + built React static files) or two Repls (frontend/backend) connected via env var URLs — see Section 9. |

---

## 4. High-Level Architecture

```
┌─────────────────────┐
│   React Frontend     │  (chat UI, video player, summary/quiz views)
│  - VideoInput         │
│  - VideoPlayer (embed)│
│  - ChatPanel          │
│  - SummaryPanel       │
│  - QuizPanel          │
│  - LibrarySidebar     │
└──────────┬───────────┘
           │ REST calls (JSON)
           ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                  │
│                                                │
│  /api/videos/process   → ingestion pipeline   │
│  /api/videos/{id}/chat → RAG Q&A              │
│  /api/videos/{id}/summary                     │
│  /api/videos/{id}/quiz                        │
│  /api/videos/{id}/flashcards                  │
│  /api/library          → list saved videos    │
│                                                │
│  Services:                                    │
│   - transcript_service.py (fetch + clean)     │
│   - chunking_service.py   (split + timestamp) │
│   - embedding_service.py  (vectorize chunks)  │
│   - vectorstore_service.py(Chroma add/query)  │
│   - llm_service.py        (RAG prompt + call) │
│   - summary_service.py                        │
│   - quiz_service.py                            │
└──────────┬──────────────────┬────────────────┘
           │                  │
           ▼                  ▼
   ┌───────────────┐   ┌──────────────┐
   │  ChromaDB      │   │  SQLite DB    │
   │ (vector store, │   │ (videos,      │
   │ per-video      │   │ chunks meta,  │
   │ collections)   │   │ chat history, │
   │                │   │ quiz results) │
   └───────────────┘   └──────────────┘
```

---

## 5. RAG Pipeline — Step by Step (this is the heart of the app)

### 5.1 Ingestion (runs once per new video)
1. Extract the 11-character YouTube video ID from the pasted URL (handle `youtube.com/watch?v=`, `youtu.be/`, and `youtube.com/embed/` formats).
2. Check SQLite: if this video ID was already processed, skip straight to "ready" (don't re-embed).
3. Fetch metadata via oEmbed (title, thumbnail, author).
4. Fetch transcript via `youtube-transcript-api`. **This must handle and gracefully report the case where a video has no captions available** (return a clear error to the frontend rather than crashing).
5. **Chunk the transcript**: the raw transcript is a list of `{text, start, duration}` segments. Merge consecutive segments into chunks of roughly 500–800 characters (not by segment count) while **preserving the start timestamp of the first segment in each chunk**. This timestamp is what powers citations later.
6. **Embed each chunk** using the embedding model, and store in a Chroma collection named after the video ID, with metadata `{video_id, start_time, chunk_index}` attached to each vector.
7. Mark the video as `status: ready` in SQLite.
8. Kick off summary generation in the background (don't block the user from starting to chat while the summary is generating).

### 5.2 Query (runs on every chat message)
1. Embed the user's question using the same embedding model.
2. Query the video's Chroma collection for the top-k (k=5) most similar chunks.
3. Build a RAG prompt (see Section 8) that includes the retrieved chunks **with their timestamps** and the user's question.
4. Call the LLM. Require the model to only answer from the provided context and to cite the timestamp(s) it used.
5. Parse the response for timestamp references and return them as structured citation objects the frontend can turn into clickable seek-buttons, alongside the natural-language answer.
6. Store the Q&A turn in the chat history table (for context in follow-up questions — pass the last 3–5 turns back into the prompt for conversational continuity).

### 5.3 Summary generation
- Take the **full transcript** (or, if too long for the context window, take evenly-spaced representative chunks) and generate: a 3–5 sentence overview, 5–8 bullet key points, and a chapter list with approximate timestamps (ask the LLM to infer topic shifts).

### 5.4 Quiz generation
- Take the summary + key points (not the raw transcript, to save tokens) and generate 5–10 questions in a strict JSON schema (see Section 7.4) so the frontend can render them reliably.

---

## 6. Fine-Tuning Component

The RAG chat, summary, and quiz generation all run on the **Google Gemini API** (no fine-tuning available or needed there — RAG grounding already solves the accuracy problem for those tasks). Fine-tuning is instead used for a **specific, self-contained NLP subtask** where a small custom model adds real value and is genuinely trainable within a Replit environment, rather than fine-tuning being bolted on artificially.

**Recommended subtask: Question-type / intent classifier for the chat input.**

- **Purpose:** before a user's chat message is sent into the RAG pipeline, classify it into an intent category — e.g., `factual_question`, `summary_request`, `definition_request`, `opinion_request`, `off_topic`. This routes the message to the right handling logic (e.g., `summary_request` can short-circuit straight to the cached summary instead of doing a full retrieval call; `off_topic` can trigger a polite redirect instead of forcing the LLM to hallucinate a grounded answer for something the video doesn't cover).
- **Base model:** a small pretrained encoder such as `distilbert-base-uncased` (fast to fine-tune, small enough to run on CPU, well within Replit's resource limits).
- **Dataset:** construct a labeled dataset of a few hundred to a few thousand example questions per intent category. Bootstrap this by (a) writing a seed set of examples by hand for each category, and (b) using the Google Gemini API offline (a one-time script, not part of the running app) to generate additional paraphrased examples per category, which are then reviewed and saved as the training set (`data/intent_dataset.csv` with columns `text,label`).
- **Training:** use HuggingFace `Trainer` with a standard train/validation split, few epochs (3–5), and track accuracy/F1 per class. Save the fine-tuned model to `models/intent_classifier/`.
- **Integration:** load the fine-tuned model once at backend startup; run every incoming chat message through it before the RAG pipeline; log the predicted intent alongside the chat message in the database (useful for later analysis of what users actually ask).
- **Where this fits in the build order:** this is a **Phase 2 addition**, built and trained *after* the Phase 1 MVP (Section 2) is working, since the MVP RAG loop must exist first to have a realistic pool of real chat questions to (optionally) fold back into the training set.

---

## 7. Data Model (SQLite via SQLAlchemy)

```
Video
  id (PK, the YouTube video ID, string)
  url
  title
  channel_name
  thumbnail_url
  duration_seconds
  status            # "processing" | "ready" | "failed"
  error_message      # nullable
  created_at

ChatMessage
  id (PK, autoincrement)
  video_id (FK -> Video.id)
  role               # "user" | "assistant"
  content
  citations_json      # nullable, list of {start_time, chunk_text}
  created_at

Summary
  id (PK)
  video_id (FK, unique)
  overview
  key_points_json      # list of strings
  chapters_json        # list of {title, start_time}
  created_at

Quiz
  id (PK)
  video_id (FK)
  questions_json        # list of {question, options[], correct_index, explanation}
  created_at

Flashcard
  id (PK)
  video_id (FK)
  front
  back
```

---

## 8. Prompt Templates (use these as a starting point; the agent may refine wording but must keep the structural constraints)

### 7.1 System prompt for RAG chat
```
You are an AI learning assistant helping a user understand a specific YouTube video.
You must answer ONLY using the transcript excerpts provided below. If the answer is not
contained in the excerpts, say you don't have enough information from this video to answer,
and do not use outside knowledge.

For every claim in your answer, cite the timestamp of the excerpt it came from using the
format [MM:SS]. If multiple excerpts support the answer, cite all of them.

Keep answers concise and educational. If the user asks a follow-up question, use the
conversation history for context, but still ground your answer in the transcript excerpts.
```

### 7.2 RAG user turn template
```
Transcript excerpts:
[03:12] "...excerpt text..."
[07:45] "...excerpt text..."
[12:30] "...excerpt text..."

Conversation so far:
{last 3-5 turns, if any}

User question: {question}
```

### 7.3 Summary prompt
```
Summarize the following video transcript for a student. Return:
1. A 3-5 sentence overview.
2. 5-8 key bullet points.
3. A chapter breakdown: infer natural topic shifts in the transcript and list each with
   its approximate starting timestamp and a short title.

Transcript:
{transcript or representative chunks}
```

### 7.4 Quiz generation prompt (must request strict JSON)
```
Based on the following summary and key points, generate 5-10 quiz questions to test
understanding of the video. Return ONLY valid JSON matching this schema, no other text:

[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct_index": 0,
    "explanation": "string"
  }
]

Summary: {overview}
Key points: {key_points}
```

> Implementation note for the agent: when parsing LLM JSON output, wrap the parse in a try/except and, on failure, retry once with an explicit "your last response was not valid JSON, return only the JSON array" follow-up message before surfacing an error to the user.

---

## 9. API Contract (FastAPI endpoints)

| Method | Endpoint | Body / Params | Response |
|---|---|---|---|
| POST | `/api/videos/process` | `{ "url": "https://youtube.com/watch?v=..." }` | `{ video_id, status }` — kicks off ingestion (can be sync for MVP, async/background task for polish) |
| GET | `/api/videos/{video_id}` | — | Video metadata + status |
| POST | `/api/videos/{video_id}/chat` | `{ "message": "string" }` | `{ answer, citations: [{start_time, text}] }` |
| GET | `/api/videos/{video_id}/chat/history` | — | List of past chat messages |
| GET | `/api/videos/{video_id}/summary` | — | `{ overview, key_points, chapters }` (generates on first call if not cached) |
| GET | `/api/videos/{video_id}/quiz` | — | List of quiz question objects (generates on first call if not cached) |
| GET | `/api/videos/{video_id}/flashcards` | — | List of flashcard objects |
| GET | `/api/library` | — | List of all previously processed videos (id, title, thumbnail, created_at) |

All endpoints should return clear HTTP error codes and JSON error bodies (`{ "error": "message" }`) — especially for: invalid YouTube URL, video has no available transcript, and LLM/API failures.

---

## 10. Frontend Structure (React)

```
src/
  components/
    VideoInput.jsx        # URL paste box + "Process" button + loading state
    VideoPlayer.jsx        # embedded YouTube iframe with a seekTo(seconds) method
    ChatPanel.jsx           # message list + input box, renders citation chips
    CitationChip.jsx        # small clickable [MM:SS] badge -> seeks player
    SummaryPanel.jsx         # overview + key points + chapter list (clickable timestamps)
    QuizPanel.jsx             # renders quiz questions, tracks score
    FlashcardPanel.jsx        # flip-card UI
    LibrarySidebar.jsx        # list of past videos, click to reopen
  pages/
    Home.jsx                 # VideoInput + LibrarySidebar (landing state)
    VideoWorkspace.jsx        # main 2-column layout: VideoPlayer+tabs (Chat/Summary/Quiz/Flashcards) on one side
  api/
    client.js                # fetch wrappers for all backend endpoints
  App.jsx
```

**Layout for the main workspace view:** left column = embedded YouTube player (sticky/pinned while scrolling); right column = tabbed panel switching between Chat, Summary, Quiz, and Flashcards. Clicking any timestamp anywhere in the UI (citation chip, chapter list, etc.) calls the player's `seekTo()`.

**Design direction:** clean, focused "study tool" aesthetic — not flashy. Calm neutral background, one clear accent color, generous whitespace, readable typography (this matters more than visual flair for a learning tool). Loading states matter a lot here since transcript fetching + embedding + first LLM call can take 10-30 seconds — show clear progress messaging ("Fetching transcript...", "Indexing content...", "Ready!").

---

## 11. Environment Variables / Secrets (set in Replit Secrets, never hardcoded)

```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash      # used for chat / summary / quiz generation
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
INTENT_MODEL_PATH=./models/intent_classifier   # path to the fine-tuned classifier (Section 6)
DATABASE_URL=sqlite:///./app.db
CHROMA_PERSIST_DIR=./chroma_db
```

---

## 12. Build Order / Milestones (give this to the agent as the execution plan)

1. **Scaffold** the FastAPI backend and React frontend as two services in one Repl (or a monorepo with a `/backend` and `/frontend` folder); confirm they can talk to each other locally.
2. **Backend: ingestion pipeline** — implement `/api/videos/process` end-to-end: URL parsing → transcript fetch → chunking → embedding → Chroma storage → SQLite record. Test with a real YouTube URL via the FastAPI `/docs` page before touching the frontend.
3. **Backend: RAG chat** — implement `/api/videos/{id}/chat` using the pipeline in Section 5.2. Test via `/docs`.
4. **Frontend: MVP loop** — build `VideoInput`, `VideoPlayer`, and `ChatPanel` only. Wire them to the two endpoints above. At this point the MVP (Phase 1) is functionally complete: paste a link, ask questions, get cited answers, click a citation to seek the video.
5. **Backend + Frontend: Summary** — implement and wire up the summary endpoint/panel.
6. **Backend + Frontend: Quiz + Flashcards** — implement and wire these up.
7. **Library** — implement `/api/library` and the sidebar.
8. **Fine-tuning component** — build the intent classifier as described in Section 6: assemble the dataset, fine-tune with HuggingFace `Trainer`, save the model, then wire it into the chat endpoint so every incoming message is classified before being passed to the RAG pipeline.
9. **Polish pass** — loading states, error states (no-transcript videos, invalid URLs), empty states, mobile responsiveness.
10. **Deploy** using Replit Deployments (Autoscale). Confirm secrets are set in the deployed environment, run a full smoke test (process a new video end-to-end on the live URL).
11. Only after Phase 1–2 are deployed and stable: consider Phase 3 stretch goals (multi-video mode, notes, difficulty toggle, export).

---

## 13. Explicit Non-Goals for This Project (tell the agent not to build these)

- No user authentication system required for MVP — a browser-session-scoped or fully public library is fine unless the internship explicitly requires accounts.
- No support for uploading video files directly — YouTube URL only.
- No real-time/streaming transcript for live videos — recorded videos with existing captions only.
- Fine-tuning is scoped to **the intent classifier only** (Section 6) — do not attempt to fine-tune Gemini itself (not available via the public API used here); keep the fine-tuning component small and self-contained so it doesn't block the core RAG features.

---

## 14. How to Hand This to the Replit Agent

Paste this entire document into the Replit Agent's initial prompt, followed by an instruction such as:

> "Build this application exactly as specified in the document above, following the Build Order in Section 11 step by step. After each numbered step, pause and show me the working result before moving to the next step. Ask me before making any architectural decision not covered in this spec."
