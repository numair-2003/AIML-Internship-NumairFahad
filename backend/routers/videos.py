from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Video, ChatMessage, Summary, Quiz, Flashcard
import json

router = APIRouter()


class ProcessRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    message: str


@router.post("/process")
async def process_video(req: ProcessRequest, db: Session = Depends(get_db)):
    """Kick off ingestion pipeline for a YouTube URL."""
    # Stub for Step 1 — full implementation in Step 2
    return {"video_id": "stub", "status": "processing", "message": "Ingestion pipeline coming in Step 2"}


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


@router.post("/{video_id}/chat")
async def chat(video_id: str, req: ChatRequest, db: Session = Depends(get_db)):
    """RAG chat endpoint — stub for Step 1."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
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


@router.get("/{video_id}/summary")
async def get_summary(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    summary = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not yet generated")
    return {
        "overview": summary.overview,
        "key_points": json.loads(summary.key_points_json),
        "chapters": json.loads(summary.chapters_json),
    }


@router.get("/{video_id}/quiz")
async def get_quiz(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    quiz = db.query(Quiz).filter(Quiz.video_id == video_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not yet generated")
    return json.loads(quiz.questions_json)


@router.get("/{video_id}/flashcards")
async def get_flashcards(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    cards = db.query(Flashcard).filter(Flashcard.video_id == video_id).all()
    return [{"id": c.id, "front": c.front, "back": c.back} for c in cards]
