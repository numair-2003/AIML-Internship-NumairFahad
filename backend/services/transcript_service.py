"""
Fetches YouTube transcripts and video metadata.
"""
import re
import httpx
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
)


def extract_video_id(url: str) -> str | None:
    """Extract the 11-character video ID from various YouTube URL formats."""
    patterns = [
        r"(?:youtube\.com/watch\?.*?v=)([A-Za-z0-9_-]{11})",
        r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:youtube\.com/embed/)([A-Za-z0-9_-]{11})",
        r"(?:youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def fetch_metadata(video_id: str) -> dict:
    """Fetch title, thumbnail, and channel via YouTube oEmbed (no API key required)."""
    oembed_url = (
        f"https://www.youtube.com/oembed"
        f"?url=https://www.youtube.com/watch?v={video_id}&format=json"
    )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "title": data.get("title", f"Video {video_id}"),
                    "channel_name": data.get("author_name", "Unknown"),
                    "thumbnail_url": data.get(
                        "thumbnail_url",
                        f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    ),
                }
    except Exception:
        pass

    # Fallback
    return {
        "title": f"Video {video_id}",
        "channel_name": "Unknown",
        "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
    }


_yta = YouTubeTranscriptApi()


def fetch_transcript(video_id: str) -> list[dict]:
    """
    Fetch transcript as list of {text, start, duration} dicts.
    Tries English first, then falls back to any available language.
    Raises ValueError with a user-friendly message if unavailable.
    """
    def _to_dicts(fetched) -> list[dict]:
        return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]

    # Try English (and common variants) first
    try:
        segments = _yta.fetch(video_id, languages=["en", "en-US", "en-GB", "en-CA", "en-AU"])
        return _to_dicts(segments)
    except NoTranscriptFound:
        pass
    except TranscriptsDisabled:
        raise ValueError(
            "This video has captions disabled and cannot be processed. "
            "Try a video with auto-generated or manual captions enabled."
        )

    # Fall back to any available transcript
    try:
        transcript_list = _yta.list(video_id)
        transcript = next(iter(transcript_list))
        fetched = transcript.fetch()
        return _to_dicts(fetched)
    except TranscriptsDisabled:
        raise ValueError(
            "This video has captions disabled and cannot be processed. "
            "Try a video with auto-generated or manual captions enabled."
        )
    except NoTranscriptFound:
        raise ValueError(
            "No transcript was found for this video. "
            "Try a video that has auto-generated or manual captions available."
        )
    except Exception as e:
        err = str(e)
        if "no element found" in err.lower() or "404" in err or "unavailable" in err.lower():
            raise ValueError("Video not found or is private/unavailable.")
        raise ValueError(f"Could not fetch transcript: {err}")
