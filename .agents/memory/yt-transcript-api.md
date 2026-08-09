---
name: youtube-transcript-api v1.x breaking change
description: The youtube-transcript-api library changed its API in v1.x — get_transcript is gone
---

## Breaking change in v1.x (installed: 1.2.4)

Old API (v0.x):
```python
YouTubeTranscriptApi.get_transcript(video_id)  # classmethod
```

New API (v1.x):
```python
api = YouTubeTranscriptApi()  # instantiate first
segments = api.fetch(video_id, languages=["en", "en-US"])
# Returns FetchedTranscript; iterate over FetchedTranscriptSnippet objects
# Each snippet has: .text, .start, .duration (accessible as .__dict__ too)
```

## Language fallback pattern
```python
try:
    segments = _yta.fetch(video_id, languages=["en", "en-US", "en-GB"])
except NoTranscriptFound:
    transcript_list = _yta.list(video_id)
    transcript = next(iter(transcript_list))
    segments = transcript.fetch()
```

**Why:** The library was updated in v1.x to use instance methods. The `requirements.txt` uses `youtube-transcript-api` without a version pin, which installs the latest. The fix lives in `backend/services/transcript_service.py`.
