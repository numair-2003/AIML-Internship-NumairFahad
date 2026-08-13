"""
Fetches YouTube transcripts and video metadata.

YouTube blocks direct API calls from cloud provider IPs (Replit, AWS, GCP, etc.).
Two environment variables enable transcript fetching to work from cloud:

  YOUTUBE_PROXY_URL  — HTTP/HTTPS proxy URL, e.g. "http://user:pass@host:port"
                       youtube-transcript-api routes through this proxy.
                       Webshare.io free tier (10 proxies) works well.

  YOUTUBE_COOKIES    — Contents of a Netscape-format cookies.txt file exported
                       from your browser while logged into YouTube.
                       Used by yt-dlp as a fallback when the primary fails.
                       Export with: browser extension "Get cookies.txt LOCALLY".

If neither is set the app still works — it will return a clear error explaining
the cloud IP block rather than a cryptic "Not Found".
"""
import os
import re
import tempfile
import httpx
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    RequestBlocked,
    IpBlocked,
)

# ── Configure YouTubeTranscriptApi ────────────────────────────────────────────
_proxy_url = os.environ.get("YOUTUBE_PROXY_URL", "").strip()
if _proxy_url:
    from youtube_transcript_api.proxies import GenericProxyConfig
    _yta = YouTubeTranscriptApi(
        proxy_config=GenericProxyConfig(
            http_url=_proxy_url,
            https_url=_proxy_url,
        )
    )
else:
    _yta = YouTubeTranscriptApi()

# ── Public Invidious instances to try as a fallback ───────────────────────────
# NOTE: these are tried but may be unreachable from Replit cloud IPs.
_INVIDIOUS_INSTANCES = [
    "https://invidious.io.lol",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://inv.in.projectsegfau.lt",
]


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
    return {
        "title": f"Video {video_id}",
        "channel_name": "Unknown",
        "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
    }


# ── VTT parser (Invidious returns WebVTT format) ─────────────────────────────

def _vtt_time_to_seconds(t: str) -> float:
    parts = t.strip().replace(",", ".").split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return 0.0


def _parse_vtt(vtt_text: str) -> list[dict]:
    """Parse WebVTT → [{text, start, duration}], deduplicating consecutive identical lines."""
    segments, last_text = [], ""
    lines = vtt_text.splitlines()
    i = 0
    while i < len(lines):
        m = re.match(
            r"(\d+:\d+(?::\d+)?[.,]\d+)\s+-->\s+(\d+:\d+(?::\d+)?[.,]\d+)",
            lines[i].strip(),
        )
        if m:
            start = _vtt_time_to_seconds(m.group(1))
            end = _vtt_time_to_seconds(m.group(2))
            duration = max(end - start, 0.1)
            i += 1
            parts = []
            while i < len(lines) and lines[i].strip():
                clean = re.sub(r"<[^>]+>", "", lines[i]).strip()
                if clean:
                    parts.append(clean)
                i += 1
            if parts:
                text = " ".join(parts)
                if text != last_text:
                    segments.append({"text": text, "start": start, "duration": duration})
                    last_text = text
        else:
            i += 1
    return segments


async def _fetch_via_invidious(video_id: str) -> list[dict]:
    """Try public Invidious instances. Often blocked from Replit cloud — best-effort."""
    for instance in _INVIDIOUS_INSTANCES:
        try:
            async with httpx.AsyncClient(
                timeout=15, follow_redirects=True,
                headers={"Accept": "application/json"},
            ) as client:
                r = await client.get(f"{instance}/api/v1/captions/{video_id}")
                if r.status_code != 200 or "json" not in r.headers.get("content-type", ""):
                    continue
                data = r.json()
                captions = data.get("captions", [])
                if not captions:
                    continue
                chosen = next(
                    (c for c in captions if c.get("languageCode", "").startswith("en")),
                    captions[0],
                )
                cap_url = chosen.get("url", "")
                if cap_url.startswith("/"):
                    cap_url = f"{instance}{cap_url}"
                r2 = await client.get(cap_url)
                if r2.status_code != 200:
                    continue
                segs = _parse_vtt(r2.text)
                if segs:
                    return segs
        except Exception:
            continue
    raise ValueError("invidious_exhausted")


async def _fetch_via_ytdlp(video_id: str) -> list[dict]:
    """
    yt-dlp fallback — requires YOUTUBE_COOKIES env var to bypass bot detection.
    Raises ValueError("ytdlp_no_cookies") if cookies are not configured.
    """
    cookies_str = os.environ.get("YOUTUBE_COOKIES", "").strip()
    if not cookies_str:
        raise ValueError("ytdlp_no_cookies")

    try:
        import yt_dlp  # installed as optional dependency
    except ImportError:
        raise ValueError("ytdlp_not_installed")

    import asyncio, concurrent.futures

    def _run_ytdlp() -> list[dict]:
        cookie_file = None
        try:
            # Write cookies to a temp file
            tf = tempfile.NamedTemporaryFile(
                suffix=".txt", delete=False, mode="w"
            )
            tf.write(cookies_str)
            tf.close()
            cookie_file = tf.name

            ydl_opts = {
                "skip_download": True,
                "writesubtitles": False,
                "writeautomaticsub": False,
                "quiet": True,
                "no_warnings": True,
                "outtmpl": f"/tmp/yt_{video_id}",
                "cookiefile": cookie_file,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(
                    f"https://www.youtube.com/watch?v={video_id}",
                    download=False,
                )
            manual = info.get("subtitles", {})
            auto = info.get("automatic_captions", {})
            subs = (
                manual.get("en")
                or auto.get("en")
                or auto.get("en-orig")
                or next(iter(manual.values()), None)
                or next(iter(auto.values()), None)
            )
            if not subs:
                raise ValueError("No subtitles found via yt-dlp")

            # Download the json3 format subtitle
            json3 = next((f for f in subs if f.get("ext") == "json3"), subs[0])
            sub_url = json3.get("url", "")
            if not sub_url:
                raise ValueError("No subtitle URL found")

            import httpx as _httpx
            r = _httpx.get(sub_url, timeout=20)
            if r.status_code != 200:
                raise ValueError(f"Subtitle download failed: HTTP {r.status_code}")

            # Parse json3 format: {events: [{segs: [{utf8}], tStartMs, dDurationMs}]}
            data = r.json()
            segments = []
            for event in data.get("events", []):
                t_start = event.get("tStartMs", 0) / 1000
                t_dur = event.get("dDurationMs", 0) / 1000
                parts = event.get("segs", [])
                text = "".join(p.get("utf8", "") for p in parts).strip()
                text = re.sub(r"\n", " ", text).strip()
                if text and text != "♪":
                    segments.append({
                        "text": text,
                        "start": t_start,
                        "duration": max(t_dur, 0.1),
                    })
            return segments
        finally:
            if cookie_file and os.path.exists(cookie_file):
                os.unlink(cookie_file)

    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        return await loop.run_in_executor(pool, _run_ytdlp)


async def fetch_transcript(video_id: str) -> list[dict]:
    """
    Fetch transcript as [{text, start, duration}].

    Attempt order:
      1. youtube-transcript-api  (fast; blocked from cloud IPs without proxy)
      2. Invidious API            (different infra; often also blocked)
      3. yt-dlp + cookies         (reliable if YOUTUBE_COOKIES is set)

    On permanent failure raises ValueError with a user-friendly message that
    explains what the operator needs to configure.
    """
    def _to_dicts(fetched) -> list[dict]:
        return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]

    ip_blocked = False

    # ── 1. youtube-transcript-api ─────────────────────────────────────────────
    try:
        segs = _yta.fetch(video_id, languages=["en", "en-US", "en-GB", "en-CA", "en-AU"])
        return _to_dicts(segs)
    except (RequestBlocked, IpBlocked):
        ip_blocked = True
    except TranscriptsDisabled:
        raise ValueError(
            "This video has captions disabled — try a video with auto-generated "
            "or manual captions."
        )
    except NoTranscriptFound:
        pass

    if not ip_blocked:
        try:
            tlist = _yta.list(video_id)
            transcript = next(iter(tlist))
            return _to_dicts(transcript.fetch())
        except (RequestBlocked, IpBlocked):
            ip_blocked = True
        except TranscriptsDisabled:
            raise ValueError(
                "This video has captions disabled — try a video with auto-generated "
                "or manual captions."
            )
        except StopIteration:
            raise ValueError("No transcript found for this video.")
        except Exception:
            pass

    # ── 2. Invidious fallback ─────────────────────────────────────────────────
    try:
        return await _fetch_via_invidious(video_id)
    except ValueError:
        pass  # Fall through to yt-dlp
    except Exception:
        pass

    # ── 3. yt-dlp + cookies fallback ─────────────────────────────────────────
    try:
        return await _fetch_via_ytdlp(video_id)
    except ValueError as e:
        err_key = str(e)
        if err_key in ("ytdlp_no_cookies", "ytdlp_not_installed"):
            pass  # Fall through to the final error
        else:
            raise ValueError(f"Transcript unavailable: {err_key}")
    except Exception as e:
        raise ValueError(f"Transcript fetch failed: {e}")

    # ── All methods failed ────────────────────────────────────────────────────
    if ip_blocked:
        raise ValueError(
            "YouTube is blocking transcript requests from this server's IP address "
            "(a common restriction for cloud providers). "
            "To fix this, set one of these environment variables in your Replit project:\n"
            "• YOUTUBE_PROXY_URL — an HTTP/HTTPS proxy URL (e.g. from Webshare.io free tier)\n"
            "• YOUTUBE_COOKIES  — contents of a cookies.txt file exported from your browser "
            "while logged into YouTube (use the 'Get cookies.txt LOCALLY' browser extension)"
        )
    raise ValueError(
        "Could not fetch a transcript for this video. "
        "The video may not have captions, or it may be private/unavailable."
    )
