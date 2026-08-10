"""
Summary service — generates and caches video summaries in SQLite.
Called as a background task after ingestion completes.
"""

import json
from sqlalchemy.orm import Session
from database import Summary, SessionLocal
from services.llm_service import generate_summary


def _build_full_transcript_text(chunks_data: list[dict]) -> str:
    """
    Reconstruct a readable transcript from stored chunks for summarisation.
    Chunks come from the vectorstore or transcript segments.
    """
    lines = []
    for chunk in chunks_data:
        from services.chunking_service import format_timestamp
        ts = format_timestamp(chunk.get("start_time", 0))
        lines.append(f"[{ts}] {chunk['text']}")
    return "\n".join(lines)


def generate_and_store_summary(video_id: str, transcript_segments: list[dict]) -> None:
    """
    Background task: generate summary + cache in SQLite.
    Uses its own DB session (runs outside the request lifecycle).
    """
    db: Session = SessionLocal()
    try:
        # Skip if already generated
        existing = db.query(Summary).filter(Summary.video_id == video_id).first()
        if existing:
            return

        # Build transcript text (may be large; llm_service truncates at 40k chars)
        transcript_text = _build_full_transcript_text(transcript_segments)

        # Generate via Gemini
        result = generate_summary(transcript_text)

        summary = Summary(
            video_id=video_id,
            overview=result["overview"],
            key_points_json=json.dumps(result["key_points"]),
            chapters_json=json.dumps(result["chapters"]),
        )
        db.add(summary)
        db.commit()

    except Exception as e:
        print(f"[summary_service] Failed to generate summary for {video_id}: {e}")
    finally:
        db.close()
