"""
Fetches YouTube transcripts and video metadata.
"""
import re
import httpx
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound


def extract_video_id(url: str) -> str | None:
    """Extract the 11-character video ID from various YouTube URL formats."""
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def fetch_metadata(video_id: str) -> dict:
    """Fetch title, thumbnail, and channel via YouTube oEmbed (no API key required)."""
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = client.get(url)  # type: ignore[attr-defined]
        # httpx sync call wrapped in async context is fine here
        resp = httpx.get(url, timeout=10)
        if resp.status_code != 200:
            return {"title": f"Video {video_id}", "channel_name": "Unknown", "thumbnail_url": ""}
        data = resp.json()
        return {
            "title": data.get("title", f"Video {video_id}"),
            "channel_name": data.get("author_name", "Unknown"),
            "thumbnail_url": data.get("thumbnail_url", ""),
        }


def fetch_transcript(video_id: str) -> list[dict]:
    """
    Fetch transcript as list of {text, start, duration} dicts.
    Raises ValueError with a user-friendly message if unavailable.
    """
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return transcript_list
    except TranscriptsDisabled:
        raise ValueError("This video has captions disabled and cannot be processed.")
    except NoTranscriptFound:
        raise ValueError(
            "No transcript was found for this video. "
            "Try a video that has auto-generated or manual captions enabled."
        )
    except Exception as e:
        raise ValueError(f"Could not fetch transcript: {str(e)}")
