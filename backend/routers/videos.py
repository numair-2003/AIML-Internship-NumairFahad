import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Video, ChatMessage, Summary, Quiz, Flashcard
from services.ingestion_service import process_video
from services.summary_service import generate_and_store_summary

router = APIRouter()


class ProcessRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    message: str


# ── Ingestion ────────────────────────────────────────────────────────────────

@router.post("/process")
async def process_video_endpoint(
    req: ProcessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Kick off ingestion pipeline for a YouTube URL.
    URL parsing → transcript → chunking → ChromaDB embedding → SQLite record.
    Summary generation is triggered as a background task after indexing.
    """
    try:
        result = await process_video(req.url, db)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Kick off background summary if the video was freshly processed
    if result.get("status") == "ready" and result.get("chunks_indexed"):
        from services.transcript_service import fetch_transcript, extract_video_id
        video_id = result["video_id"]
        try:
            # We need the raw segments for the summary builder; re-fetch is cheap
            # since the transcript API caches in-process
            segments = fetch_transcript(video_id)
            # Convert segments to chunk-like format for summary_service
            chunk_dicts = [
                {"text": s["text"], "start_time": s["start"]}
                for s in segments
            ]
            background_tasks.add_task(
                generate_and_store_summary, video_id, chunk_dicts
            )
        except Exception:
            pass  # Summary failure must not block the user from chatting

    return result


# ── Video metadata ───────────────────────────────────────────────────────────

@router.get("/{video_id}")
async def get_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return {
        "id": video.id,
        "url": video.url,
        "title": video.title,
        "channel_name": video.channel_name,
        "thumbnail_url": video.thumbnail_url,
        "duration_seconds": video.duration_seconds,
        "status": video.status,
        "error_message": video.error_message,
        "created_at": video.created_at,
    }


# ── Chat ─────────────────────────────────────────────────────────────────────

@router.post("/{video_id}/chat")
async def chat(video_id: str, req: ChatRequest, db: Session = Depends(get_db)):
    """RAG chat endpoint — full implementation in Step 3."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status != "ready":
        raise HTTPException(
            status_code=409,
            detail=f"Video is not ready for chat (status: {video.status})",
        )
    return {"answer": "RAG chat coming in Step 3", "citations": []}


@router.get("/{video_id}/chat/history")
async def chat_history(video_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.video_id == video_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "citations": json.loads(m.citations_json) if m.citations_json else [],
            "created_at": m.created_at,
        }
        for m in messages
    ]


# ── Summary ──────────────────────────────────────────────────────────────────

@router.get("/{video_id}/summary")
async def get_summary(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    summary = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary:
        raise HTTPException(
            status_code=404,
            detail="Summary not yet generated — check back shortly or it may still be processing.",
        )
    return {
        "overview": summary.overview,
        "key_points": json.loads(summary.key_points_json),
        "chapters": json.loads(summary.chapters_json),
    }


# ── Quiz ─────────────────────────────────────────────────────────────────────

@router.get("/{video_id}/quiz")
async def get_quiz(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    quiz = db.query(Quiz).filter(Quiz.video_id == video_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not yet generated")
    return json.loads(quiz.questions_json)


# ── Flashcards ───────────────────────────────────────────────────────────────

@router.get("/{video_id}/flashcards")
async def get_flashcards(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    cards = db.query(Flashcard).filter(Flashcard.video_id == video_id).all()
    return [{"id": c.id, "front": c.front, "back": c.back} for c in cards]
