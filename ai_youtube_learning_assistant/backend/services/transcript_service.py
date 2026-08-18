"""
Fetches YouTube transcripts and video metadata.

YouTube blocks direct transcript requests from cloud provider IPs (Replit,
AWS, GCP, etc.).  Two environment variables enable transcript fetching from
cloud:

  YOUTUBE_URL  — HTTP/HTTPS proxy URL, e.g. "http://user:pass@host:port".
                 This is the canonical proxy secret name. If it is not set,
                 the legacy YOUTUBE_PROXY_URL alias is used.

  WEBSHARE_PROXY_USER / WEBSHARE_PROXY_PASS  — explicit Webshare credentials
                       for WebshareProxyConfig (rotating residential proxies).
                       Takes priority over YOUTUBE_URL for yt-api.

  YOUTUBE_COOKIES    — Contents of a Netscape-format cookies.txt file exported
                       from your browser while logged into YouTube.
                        Written to a runtime-only Netscape cookies.txt file and
                        passed to both transcript clients.
                       Export with: browser extension "Get cookies.txt LOCALLY".

yt-dlp is tried WITHOUT cookies as well (it often works from cloud IPs).
"""
import os
import re
import tempfile
import hashlib
import http.cookiejar
import httpx
import requests
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    RequestBlocked,
    IpBlocked,
)

# ── Public Invidious instances to try as a fallback ───────────────────────────
_INVIDIOUS_INSTANCES = [
    "https://invidious.io.lol",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://inv.in.projectsegfau.lt",
]


# ── Lazy YouTubeTranscriptApi factory ─────────────────────────────────────────
# Built fresh on first call so it always picks up the current env vars
# (important if secrets are set after the module was first imported).
_yta_cache: "YouTubeTranscriptApi | None" = None
_yta_proxy_key: str = ""   # tracks which proxy/cookie config was used


def _get_proxy_url() -> str:
    """Return the canonical proxy secret, with the legacy alias as fallback."""
    return (
        os.environ.get("YOUTUBE_URL", "").strip()
        or os.environ.get("YOUTUBE_PROXY_URL", "").strip()
    )


def _write_runtime_cookie_file(cookies_str: str) -> str | None:
    """Write secret cookie contents to a private, temporary Netscape file."""
    if not cookies_str:
        return None

    fd, path = tempfile.mkstemp(
        prefix="learntube-youtube-cookies-",
        suffix=".txt",
        dir="/tmp",
        text=True,
    )
    os.chmod(path, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as cookie_file:
        cookie_file.write(cookies_str)
    return path


def _cookie_session(cookie_file: str | None) -> requests.Session | None:
    """Load a Netscape cookie file into the youtube-transcript-api session."""
    if not cookie_file:
        return None

    session = requests.Session()
    jar = http.cookiejar.MozillaCookieJar(cookie_file)
    jar.load(ignore_discard=True, ignore_expires=True)
    session.cookies = jar
    return session


def _get_yta(
    cookie_file: str | None = None,
    cookies_fingerprint: str = "",
) -> YouTubeTranscriptApi:
    """
    Return a (possibly cached) YouTubeTranscriptApi instance configured with
    the best available proxy strategy based on current environment variables.

    Priority:
      1. WebshareProxyConfig (WEBSHARE_PROXY_USER + WEBSHARE_PROXY_PASS)
       2. WebshareProxyConfig (credentials extracted from YOUTUBE_URL or
          legacy YOUTUBE_PROXY_URL when
         the URL matches the Webshare p.webshare.io host pattern OR the proxy
         username matches the rotating-credential pattern)
       3. GenericProxyConfig  (the selected proxy URL as a generic proxy)
      4. No proxy (direct — will be blocked by YouTube from cloud IPs)
    """
    global _yta_cache, _yta_proxy_key

    ws_user = os.environ.get("WEBSHARE_PROXY_USER", "").strip()
    ws_pass = os.environ.get("WEBSHARE_PROXY_PASS", "").strip()
    proxy_url = _get_proxy_url()

    # Cache key — rebuild the instance only when config changes
    cache_key = f"{ws_user}|{ws_pass}|{proxy_url}|{cookies_fingerprint}"
    if _yta_cache is not None and _yta_proxy_key == cache_key:
        return _yta_cache

    from youtube_transcript_api.proxies import GenericProxyConfig, WebshareProxyConfig

    cfg = None

    # 1. Explicit Webshare credentials env vars
    if ws_user and ws_pass:
        cfg = WebshareProxyConfig(proxy_username=ws_user, proxy_password=ws_pass)

    # 2. Extract Webshare credentials from the selected proxy URL
    elif proxy_url:
        m = re.match(r"https?://([^:]+):([^@]+)@(.+)", proxy_url)
        if m:
            u, p, host = m.group(1), m.group(2), m.group(3)
            # If host is p.webshare.io or credentials look like Webshare ones
            if "webshare.io" in host or re.match(r"^[a-z]{8}$", u):
                cfg = WebshareProxyConfig(proxy_username=u, proxy_password=p)
            else:
                cfg = GenericProxyConfig(http_url=proxy_url, https_url=proxy_url)
        else:
            cfg = GenericProxyConfig(http_url=proxy_url, https_url=proxy_url)

    # 4. No proxy
    http_client = _cookie_session(cookie_file)
    if cfg is not None:
        _yta_cache = YouTubeTranscriptApi(
            proxy_config=cfg,
            http_client=http_client,
        )
    else:
        _yta_cache = YouTubeTranscriptApi(http_client=http_client)

    _yta_proxy_key = cache_key
    return _yta_cache


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
                timeout=5, follow_redirects=True,
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


async def _fetch_via_ytdlp(
    video_id: str,
    cookies_str: str = "",
    cookie_file: str | None = None,
    proxy_url: str | None = None,
) -> list[dict]:
    """
    yt-dlp fallback — works without cookies from most cloud IPs.
    Uses yt-dlp's native subtitle download (writes json3 to /tmp) so we never
    have to re-fetch URLs ourselves. If YOUTUBE_COOKIES is provided, its
    runtime cookie file is passed as ``cookiefile``. The selected proxy is
    passed as ``proxy``.
    """
    try:
        import yt_dlp  # installed as optional dependency
    except ImportError:
        raise ValueError("ytdlp_not_installed")

    import asyncio
    import concurrent.futures
    import glob
    import json as _json

    def _run_ytdlp() -> list[dict]:
        owned_cookie_file = None
        outdir = f"/tmp/yt_sub_{video_id}"
        os.makedirs(outdir, exist_ok=True)

        try:
            effective_cookie_file = cookie_file
            if cookies_str and not effective_cookie_file:
                owned_cookie_file = _write_runtime_cookie_file(cookies_str)
                effective_cookie_file = owned_cookie_file
            effective_proxy_url = (
                _get_proxy_url() if proxy_url is None else proxy_url.strip()
            )
            ydl_opts: dict = {
                "writesubtitles": True,
                "writeautomaticsub": True,
                "subtitleslangs": ["en", "en-orig", "en-US"],
                "subtitlesformat": "json3",
                "skip_download": True,
                "outtmpl": f"{outdir}/%(id)s",
                "quiet": True,
                "no_warnings": True,
            }

            if effective_cookie_file:
                ydl_opts["cookiefile"] = effective_cookie_file
            if effective_proxy_url:
                ydl_opts["proxy"] = effective_proxy_url

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

            # Find the downloaded json3 file(s)
            files = sorted(glob.glob(f"{outdir}/*.json3"))
            if not files:
                raise ValueError("yt-dlp produced no subtitle files")

            # Parse the json3 subtitle format:
            # {events: [{segs: [{utf8}], tStartMs, dDurationMs}]}
            # Prefer .en.json3, else take the first file
            chosen = next((f for f in files if ".en." in f), files[0])
            with open(chosen, "r", encoding="utf-8") as fh:
                data = _json.load(fh)

            segments = []
            for event in data.get("events", []):
                t_start = event.get("tStartMs", 0) / 1000
                t_dur = event.get("dDurationMs", 0) / 1000
                parts = event.get("segs", [])
                text = "".join(p.get("utf8", "") for p in parts).strip()
                text = re.sub(r"\n", " ", text).strip()
                if text and text not in ("♪", "♪♪♪", "[Music]"):
                    segments.append({
                        "text": text,
                        "start": t_start,
                        "duration": max(t_dur, 0.1),
                    })
            return segments

        finally:
            if owned_cookie_file and os.path.exists(owned_cookie_file):
                os.unlink(owned_cookie_file)
            # Clean up downloaded subtitle files
            import shutil
            shutil.rmtree(outdir, ignore_errors=True)

    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        return await loop.run_in_executor(pool, _run_ytdlp)


async def fetch_transcript(video_id: str) -> list[dict]:
    """Fetch a transcript using one runtime-only cookie file for all clients."""
    cookies_str = os.environ.get("YOUTUBE_COOKIES", "").strip()
    cookie_file = _write_runtime_cookie_file(cookies_str)
    cookies_fingerprint = (
        hashlib.sha256(cookies_str.encode("utf-8")).hexdigest()
        if cookies_str
        else ""
    )
    try:
        return await _fetch_transcript_with_config(
            video_id,
            cookie_file=cookie_file,
            proxy_url=_get_proxy_url(),
            cookies_fingerprint=cookies_fingerprint,
        )
    finally:
        if cookie_file and os.path.exists(cookie_file):
            os.unlink(cookie_file)


async def _fetch_transcript_with_config(
    video_id: str,
    cookie_file: str | None,
    proxy_url: str,
    cookies_fingerprint: str,
) -> list[dict]:
    """
    Fetch transcript as [{text, start, duration}].

    Attempt order:
      1. youtube-transcript-api  (fast; uses WebshareProxyConfig if credentials
                                  are available; blocked without proxy from cloud)
      2. yt-dlp (no cookies)     (reliable from most IPs; yt-dlp is smarter
                                  about bypassing bot detection)
      3. yt-dlp (with cookies)   (extra reliability when YOUTUBE_COOKIES is set)
      4. Invidious API            (usually blocked from Replit too; last resort)

    On permanent failure raises ValueError with a user-friendly message.
    """
    def _to_dicts(fetched) -> list[dict]:
        return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]

    ip_blocked = False
    transcripts_disabled = False
    try:
        yta = _get_yta(
            cookie_file=cookie_file,
            cookies_fingerprint=cookies_fingerprint,
        )
    except (OSError, http.cookiejar.LoadError):
        # A malformed export should not prevent the no-cookie/proxy fallbacks.
        yta = _get_yta()

    # ── 1. youtube-transcript-api (fast; uses proxy if configured) ────────────
    # Catches all exceptions broadly so any proxy/network failure falls through
    # to yt-dlp rather than surfacing a confusing RetryError to the user.
    try:
        segs = yta.fetch(video_id, languages=["en", "en-US", "en-GB", "en-CA", "en-AU"])
        return _to_dicts(segs)
    except TranscriptsDisabled:
        transcripts_disabled = True
    except (RequestBlocked, IpBlocked):
        ip_blocked = True
    except NoTranscriptFound:
        pass
    except Exception:
        # RetryError, ConnectionError, proxy auth failures, etc. — fall through
        ip_blocked = True  # treat as blocked; yt-dlp may still succeed

    if transcripts_disabled:
        raise ValueError(
            "This video has captions disabled — try a video with auto-generated "
            "or manual captions."
        )

    if not ip_blocked:
        # Try listing all available transcripts and picking any one
        try:
            tlist = yta.list(video_id)
            transcript = next(iter(tlist))
            return _to_dicts(transcript.fetch())
        except TranscriptsDisabled:
            raise ValueError(
                "This video has captions disabled — try a video with auto-generated "
                "or manual captions."
            )
        except StopIteration:
            raise ValueError("No transcript found for this video.")
        except (RequestBlocked, IpBlocked):
            ip_blocked = True
        except Exception:
            ip_blocked = True

    # ── 2. yt-dlp WITHOUT cookies (works reliably from cloud IPs) ────────────
    # yt-dlp uses its own request stack which bypasses youtube-transcript-api's
    # proxy restrictions and handles YouTube's anti-bot measures better.
    try:
        segs = await _fetch_via_ytdlp(
            video_id,
            cookie_file=None,
            proxy_url=proxy_url,
        )
        if segs:
            return segs
    except ValueError as e:
        if str(e) not in ("ytdlp_not_installed",):
            pass  # fall through to next
    except Exception:
        pass

    # ── 3. yt-dlp WITH cookies (if YOUTUBE_COOKIES is set) ───────────────────
    if cookie_file:
        try:
            segs = await _fetch_via_ytdlp(
                video_id,
                cookie_file=cookie_file,
                proxy_url=proxy_url,
            )
            if segs:
                return segs
        except Exception:
            pass

    # ── 4. Invidious fallback ─────────────────────────────────────────────────
    try:
        return await _fetch_via_invidious(video_id)
    except Exception:
        pass

    # ── All methods failed ────────────────────────────────────────────────────
    if ip_blocked:
        raise ValueError(
            "Could not fetch the transcript — YouTube is blocking requests from "
            "this server's IP (common for cloud providers). "
            "yt-dlp was tried but also failed. "
            "For guaranteed transcript fetching, set YOUTUBE_COOKIES "
            "(export cookies.txt from your browser while logged into YouTube using "
            "the 'Get cookies.txt LOCALLY' extension) as a Replit secret."
        )
    raise ValueError(
        "Could not fetch a transcript for this video. "
        "The video may not have captions, or it may be private/unavailable."
    )
