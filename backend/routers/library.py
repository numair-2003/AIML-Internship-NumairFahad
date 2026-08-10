from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Video, UserVideo
from services.clerk_auth import require_auth

router = APIRouter()


@router.get("")
async def get_library(
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth),
):
    """Return all videos belonging to the authenticated user, newest first."""
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
