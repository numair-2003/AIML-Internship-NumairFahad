"""
Ingestion pipeline — orchestrates URL parsing → transcript → chunking →
vector store → SQLite record, returning {video_id, status}.
"""

from typing import Optional
from sqlalchemy.orm import Session
from database import Video
from services.transcript_service import extract_video_id, fetch_metadata, fetch_transcript
from services.chunking_service import chunk_transcript
from services.vectorstore_service import add_chunks, delete_collection


async def process_video(url: str, db: Session) -> dict:
    """
    Full ingestion pipeline.

    Returns {"video_id": str, "status": "ready"} on success.
    Raises ValueError for user-facing errors (bad URL, no transcript, etc.).
    """

    # ── 1. Extract video ID ──────────────────────────────────────────────────
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(
            "Could not extract a YouTube video ID from that URL. "
            "Please use a youtube.com/watch?v=… or youtu.be/… link."
        )

    # ── 2. Skip if already processed ────────────────────────────────────────
    existing = db.query(Video).filter(Video.id == video_id).first()
    if existing and existing.status == "ready":
        return {
            "video_id": video_id,
            "status": "ready",
            "title": existing.title,
            "already_processed": True,
        }

    # ── 3. Upsert video record as "processing" ───────────────────────────────
    if existing:
        video = existing
        video.url = url
        video.status = "processing"
        video.error_message = None
        # If we're reprocessing, clear the old vector collection
        delete_collection(video_id)
    else:
        video = Video(id=video_id, url=url, status="processing")
        db.add(video)
    db.commit()
    db.refresh(video)

    try:
        # ── 4. Fetch metadata via oEmbed (title, channel, thumbnail) ─────────
        metadata = await fetch_metadata(video_id)
        video.title = metadata["title"]
        video.channel_name = metadata["channel_name"]
        video.thumbnail_url = metadata["thumbnail_url"]
        db.commit()

        # ── 5. Fetch transcript ──────────────────────────────────────────────
        # This raises ValueError with a user-friendly message if unavailable.
        transcript_segments = fetch_transcript(video_id)

        # ── 6. Chunk transcript ──────────────────────────────────────────────
        chunks = chunk_transcript(transcript_segments)
        if not chunks:
            raise ValueError(
                "The transcript was fetched but could not be split into chunks. "
                "The video may have an extremely short or empty transcript."
            )

        # ── 7. Embed + store in ChromaDB ─────────────────────────────────────
        add_chunks(video_id, chunks)

        # ── 8. Mark ready ────────────────────────────────────────────────────
        video.status = "ready"
        db.commit()

        return {
            "video_id": video_id,
            "status": "ready",
            "title": video.title,
            "chunks_indexed": len(chunks),
        }

    except ValueError as e:
        # Re-raise user-facing errors after marking the video as failed
        video.status = "failed"
        video.error_message = str(e)
        db.commit()
        raise

    except Exception as e:
        video.status = "failed"
        video.error_message = str(e)
        db.commit()
        raise RuntimeError(f"Ingestion failed: {e}") from e
