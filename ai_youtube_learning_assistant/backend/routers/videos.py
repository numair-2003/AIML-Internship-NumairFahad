"""
Video router — all /api/videos/* endpoints.
All routes require authentication via Clerk JWT (require_auth dependency).
User isolation is enforced via the UserVideo ownership table and per-user
chat message filtering.
"""

import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Video, ChatMessage, Summary, Quiz, Flashcard, UserVideo
from services.ingestion_service import process_video
from services.summary_service import generate_and_store_summary
from services.vectorstore_service import query_chunks, get_all_chunks, collection_exists
from services.llm_service import rag_chat, generate_quiz, generate_flashcards
from services.clerk_auth import require_auth
from rate_limiter import limiter

router = APIRouter()


class ProcessRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    message: str


def _get_user_video(db: Session, user_id: str, video_id: str) -> UserVideo:
    """Return the UserVideo ownership record, or raise 404."""
    uv = (
        db.query(UserVideo)
        .filter(UserVideo.user_id == user_id, UserVideo.video_id == video_id)
        .first()
    )
    if not uv:
        raise HTTPException(status_code=404, detail="Video not found")
    return uv


def _ensure_user_video(db: Session, user_id: str, video_id: str) -> None:
    """Create a UserVideo ownership record if one does not already exist."""
    existing = (
        db.query(UserVideo)
        .filter(UserVideo.user_id == user_id, UserVideo.video_id == video_id)
        .first()
    )
    if not existing:
        db.add(UserVideo(user_id=user_id, video_id=video_id))
        db.commit()


# ── Ingestion ────────────────────────────────────────────────────────────────

@router.post("/process")
@limiter.limit("10/minute")
async def process_video_endpoint(
    request: Request,
    req: ProcessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    """
    Kick off ingestion pipeline for a YouTube URL.
    URL parsing → transcript → chunking → ChromaDB embedding → SQLite record.
    Summary generation is triggered as a background task after indexing.
    """
    user_id: str = user["sub"]

    try:
        result = await process_video(req.url, db)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Register ownership so this user can access the video
    _ensure_user_video(db, user_id, result["video_id"])

    # Kick off background summary if the video was freshly processed.
    # Use the already-stored ChromaDB chunks — no need to re-fetch from YouTube.
    if result.get("status") == "ready" and result.get("chunks_indexed"):
        video_id = result["video_id"]
        existing_summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not existing_summary:
            chunk_dicts = get_all_chunks(video_id)
            if chunk_dicts:
                background_tasks.add_task(
                    generate_and_store_summary, video_id, chunk_dicts
                )

    return result


# ── Video metadata ───────────────────────────────────────────────────────────

@router.get("/{video_id}")
async def get_video(
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

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
@limiter.limit("30/minute")
async def chat(
    request: Request,
    video_id: str,
    req: ChatRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    """
    RAG chat endpoint.
    1. Classify intent (factual / summary / definition / opinion / off_topic).
    2. For summary_request → short-circuit to cached summary.
    3. Otherwise: retrieve top-5 chunks → call LLM → parse citations → store.
    """
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status != "ready":
        raise HTTPException(
            status_code=409,
            detail=f"Video is not ready for chat (status: {video.status})",
        )

    # Classify intent
    from services.intent_service import classify_intent
    intent = classify_intent(req.message)

    # Short-circuit summary requests
    if intent == "summary_request":
        summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if summary:
            answer = (
                f"Here's a summary of the video:\n\n"
                f"{summary.overview}\n\n"
                f"**Key Points:**\n"
                + "\n".join(f"• {p}" for p in json.loads(summary.key_points_json))
            )
            _store_message(db, user_id, video_id, "user", req.message, None)
            _store_message(db, user_id, video_id, "assistant", answer, [])
            return {"answer": answer, "citations": [], "intent": intent}

    # Handle off-topic
    if intent == "off_topic":
        answer = (
            "I can only answer questions about the content of this specific video. "
            "Your question appears to be unrelated to the video. "
            "Try asking something about the topics covered in the video!"
        )
        _store_message(db, user_id, video_id, "user", req.message, None)
        _store_message(db, user_id, video_id, "assistant", answer, [])
        return {"answer": answer, "citations": [], "intent": intent}

    # Get this user's conversation history for this video (last 5 turns)
    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.video_id == video_id, ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    conversation_history = [
        {"role": m.role, "content": m.content}
        for m in history_rows[-10:]  # last 5 pairs = 10 rows
    ]

    # Retrieve relevant chunks
    chunks = query_chunks(video_id, req.message, k=5)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="This video's transcript data is no longer available. Please re-add the video.",
        )

    # Call LLM
    try:
        result = rag_chat(
            question=req.message,
            retrieved_chunks=chunks,
            conversation_history=conversation_history,
        )
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
            raise HTTPException(
                status_code=429,
                detail="AI quota limit reached. Please wait a moment and try again.",
            )
        raise HTTPException(status_code=500, detail=f"AI error: {err[:200]}")

    # Persist both turns
    _store_message(db, user_id, video_id, "user", req.message, None)
    _store_message(db, user_id, video_id, "assistant", result["answer"], result["citations"])

    return {
        "answer": result["answer"],
        "citations": result["citations"],
        "intent": intent,
    }


def _store_message(db: Session, user_id: str, video_id: str, role: str, content: str, citations):
    msg = ChatMessage(
        user_id=user_id,
        video_id=video_id,
        role=role,
        content=content,
        citations_json=json.dumps(citations) if citations is not None else None,
    )
    db.add(msg)
    db.commit()


@router.get("/{video_id}/chat/history")
async def chat_history(
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.video_id == video_id, ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "citations": json.loads(m.citations_json) if m.citations_json else [],
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


@router.delete("/{video_id}/chat/history")
async def clear_chat_history(
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

    db.query(ChatMessage).filter(
        ChatMessage.video_id == video_id,
        ChatMessage.user_id == user_id,
    ).delete()
    db.commit()
    return {"ok": True}


# ── Summary ──────────────────────────────────────────────────────────────────

@router.get("/{video_id}/summary")
@limiter.limit("20/minute")
async def get_summary(
    request: Request,
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    summary = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary:
        # Build summary from the already-stored ChromaDB chunks (fast — no YouTube needed)
        if not collection_exists(video_id):
            raise HTTPException(
                status_code=404,
                detail="No transcript data found for this video. Please re-add the video.",
            )
        chunk_dicts = get_all_chunks(video_id)
        if not chunk_dicts:
            raise HTTPException(
                status_code=404,
                detail="No transcript data found for this video. Please re-add the video.",
            )
        try:
            await asyncio.get_event_loop().run_in_executor(
                None, generate_and_store_summary, video_id, chunk_dicts
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Summary generation failed: {exc}",
            )
        summary = db.query(Summary).filter(Summary.video_id == video_id).first()

    if not summary:
        raise HTTPException(status_code=503, detail="Summary generation failed. Please try again.")

    return {
        "overview": summary.overview,
        "key_points": json.loads(summary.key_points_json),
        "chapters": json.loads(summary.chapters_json),
    }


# ── Quiz ─────────────────────────────────────────────────────────────────────

@router.get("/{video_id}/quiz")
@limiter.limit("20/minute")
async def get_quiz(
    request: Request,
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    quiz = db.query(Quiz).filter(Quiz.video_id == video_id).first()
    if not quiz:
        # Ensure summary exists (auto-generate from ChromaDB chunks if needed)
        summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not summary:
            chunks = get_all_chunks(video_id)
            if not chunks:
                raise HTTPException(status_code=404, detail="No transcript data found. Please re-add the video.")
            await asyncio.get_event_loop().run_in_executor(
                None, generate_and_store_summary, video_id, chunks
            )
            summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not summary:
            raise HTTPException(status_code=503, detail="Summary generation failed. Please try again.")
        try:
            questions = await asyncio.get_event_loop().run_in_executor(
                None,
                generate_quiz,
                summary.overview,
                json.loads(summary.key_points_json),
            )
            if not questions:
                raise HTTPException(
                    status_code=503,
                    detail="Quiz generation returned no questions. Please try again.",
                )
            quiz = Quiz(video_id=video_id, questions_json=json.dumps(questions))
            db.add(quiz)
            db.commit()
        except HTTPException:
            raise
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
                raise HTTPException(status_code=429, detail="AI quota limit reached. Please wait and try again.")
            raise HTTPException(status_code=500, detail=f"Quiz generation failed: {err[:200]}")

    return json.loads(quiz.questions_json)


# ── Flashcards ───────────────────────────────────────────────────────────────

@router.get("/{video_id}/flashcards")
@limiter.limit("20/minute")
async def get_flashcards(
    request: Request,
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id: str = user["sub"]
    _get_user_video(db, user_id, video_id)  # raises 404 if not owned

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    cards = db.query(Flashcard).filter(Flashcard.video_id == video_id).all()
    if not cards:
        # Ensure summary exists (auto-generate from ChromaDB chunks if needed)
        summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not summary:
            chunks = get_all_chunks(video_id)
            if not chunks:
                raise HTTPException(status_code=404, detail="No transcript data found. Please re-add the video.")
            await asyncio.get_event_loop().run_in_executor(
                None, generate_and_store_summary, video_id, chunks
            )
            summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not summary:
            raise HTTPException(status_code=503, detail="Summary generation failed. Please try again.")
        try:
            flashcard_data = await asyncio.get_event_loop().run_in_executor(
                None,
                generate_flashcards,
                summary.overview,
                json.loads(summary.key_points_json),
            )
            for fc in flashcard_data:
                db.add(Flashcard(
                    video_id=video_id,
                    front=fc["front"],
                    back=fc["back"],
                ))
            db.commit()
            cards = db.query(Flashcard).filter(Flashcard.video_id == video_id).all()
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
                raise HTTPException(status_code=429, detail="AI quota limit reached. Please wait and try again.")
            raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {err[:200]}")

    return [{"id": c.id, "front": c.front, "back": c.back} for c in cards]
