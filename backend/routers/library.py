from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Video

router = APIRouter()


@router.get("")
async def get_library(db: Session = Depends(get_db)):
    """Return all previously processed videos, newest first."""
    videos = (
        db.query(Video)
        .filter(Video.status == "ready")
        .order_by(Video.created_at.desc())
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
