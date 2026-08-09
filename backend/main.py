import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from database import init_db
from routers import videos, library

app = FastAPI(
    title="LearnTube API",
    description="AI YouTube Learning Assistant — RAG-powered Q&A, summaries, quizzes, and flashcards",
    version="1.0.0",
)

# CORS — allow all origins in development; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(library.router, prefix="/api/library", tags=["library"])


@app.get("/api/healthz")
async def health():
    return {"status": "ok", "service": "LearnTube API"}


@app.on_event("startup")
async def startup():
    init_db()
    print("LearnTube API started — database initialised.")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
