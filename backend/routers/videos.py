"""
Video router — all /api/videos/* endpoints.
Step 3: RAG chat is fully wired.
Steps 5-6: Summary, Quiz, Flashcards generated on-demand and cached.
"""

import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Video, ChatMessage, Summary, Quiz, Flashcard
from services.ingestion_service import process_video
from services.summary_service import generate_and_store_summary
from services.vectorstore_service import query_chunks
from services.llm_service import rag_chat, generate_quiz, generate_flashcards

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
        from services.transcript_service import fetch_transcript
        video_id = result["video_id"]
        # Check if summary already exists
        existing = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not existing:
            try:
                segments = fetch_transcript(video_id)
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
    """
    RAG chat endpoint.
    1. Classify intent (factual / summary / definition / opinion / off_topic).
    2. For summary_request → short-circuit to cached summary.
    3. Otherwise: retrieve top-5 chunks → call Claude → parse citations → store.
    """
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
            _store_message(db, video_id, "user", req.message, None)
            _store_message(db, video_id, "assistant", answer, [])
            return {"answer": answer, "citations": [], "intent": intent}

    # Handle off-topic
    if intent == "off_topic":
        answer = (
            "I can only answer questions about the content of this specific video. "
            "Your question appears to be unrelated to the video. "
            "Try asking something about the topics covered in the video!"
        )
        _store_message(db, video_id, "user", req.message, None)
        _store_message(db, video_id, "assistant", answer, [])
        return {"answer": answer, "citations": [], "intent": intent}

    # Get conversation history (last 5 turns)
    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.video_id == video_id)
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
            status_code=500,
            detail="No content chunks found for this video. Try reprocessing the video.",
        )

    # Call LLM
    try:
        result = rag_chat(
            question=req.message,
            retrieved_chunks=chunks,
            conversation_history=conversation_history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    # Persist both turns
    _store_message(db, video_id, "user", req.message, None)
    _store_message(db, video_id, "assistant", result["answer"], result["citations"])

    return {
        "answer": result["answer"],
        "citations": result["citations"],
        "intent": intent,
    }


def _store_message(db: Session, video_id: str, role: str, content: str, citations):
    msg = ChatMessage(
        video_id=video_id,
        role=role,
        content=content,
        citations_json=json.dumps(citations) if citations is not None else None,
    )
    db.add(msg)
    db.commit()


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
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


@router.delete("/{video_id}/chat/history")
async def clear_chat_history(video_id: str, db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.video_id == video_id).delete()
    db.commit()
    return {"ok": True}


# ── Summary ──────────────────────────────────────────────────────────────────

@router.get("/{video_id}/summary")
async def get_summary(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    summary = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary:
        # Try to generate on-demand
        from services.transcript_service import fetch_transcript
        try:
            segments = fetch_transcript(video_id)
            chunk_dicts = [{"text": s["text"], "start_time": s["start"]} for s in segments]
            await asyncio.get_event_loop().run_in_executor(
                None, generate_and_store_summary, video_id, chunk_dicts
            )
            summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail="Summary is still generating — try again in a few seconds.",
            )

    if not summary:
        raise HTTPException(status_code=404, detail="Summary not yet available.")

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
        # Generate on demand using summary
        summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not summary:
            raise HTTPException(
                status_code=404,
                detail="Summary not yet available. Please wait for it to generate first.",
            )
        try:
            questions = await asyncio.get_event_loop().run_in_executor(
                None,
                generate_quiz,
                summary.overview,
                json.loads(summary.key_points_json),
            )
            quiz = Quiz(video_id=video_id, questions_json=json.dumps(questions))
            db.add(quiz)
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

    return json.loads(quiz.questions_json)


# ── Flashcards ───────────────────────────────────────────────────────────────

@router.get("/{video_id}/flashcards")
async def get_flashcards(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    cards = db.query(Flashcard).filter(Flashcard.video_id == video_id).all()
    if not cards:
        # Generate on demand using summary
        summary = db.query(Summary).filter(Summary.video_id == video_id).first()
        if not summary:
            raise HTTPException(
                status_code=404,
                detail="Summary not yet available. Please wait for it to generate first.",
            )
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
            raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")

    return [{"id": c.id, "front": c.front, "back": c.back} for c in cards]
