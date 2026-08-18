from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Video, UserVideo
from services.clerk_auth import require_auth

router = APIRouter()


@router.get("")
async def get_library(
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    """Return videos belonging to the current user or anonymous browser, newest first."""
    user_id: str = user["sub"]

    videos = (
        db.query(Video)
        .join(UserVideo, UserVideo.video_id == Video.id)
        .filter(UserVideo.user_id == user_id, Video.status == "ready")
        .order_by(UserVideo.created_at.desc())
        .all()
    )
    return [
        {
            "id": v.id,
            "title": v.title,
            "channel_name": v.channel_name,
            "thumbnail_url": v.thumbnail_url,
            "created_at": v.created_at,
        }
        for v in videos
    ]


@router.delete("/{video_id}")
async def remove_from_library(
    video_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    """Remove a video from the current user's library (deletes UserVideo row)."""
    user_id: str = user["sub"]

    row = (
        db.query(UserVideo)
        .filter(UserVideo.user_id == user_id, UserVideo.video_id == video_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Video not found in your library")

    db.delete(row)
    db.commit()
    return {"ok": True}
