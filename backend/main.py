import os
import sys

# Ensure working directory is always the backend folder so that relative paths
# (SQLite ./app.db, ChromaDB ./chroma_db, ./models/...) resolve correctly
# regardless of whether Python is invoked with `cd backend && python main.py`
# (development) or `python /abs/path/backend/main.py` (production).
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(_BACKEND_DIR)
sys.path.insert(0, _BACKEND_DIR)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import httpx
import uvicorn

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter

from database import init_db
from routers import videos, library

app = FastAPI(
    title="LearnTube API",
    description="AI YouTube Learning Assistant — RAG-powered Q&A, summaries, quizzes, and flashcards",
    version="1.0.0",
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Build an explicit allowlist from the runtime domain so that the wildcard +
# credentials combination (spec-invalid and a security misconfiguration) is
# never used.  REPLIT_DEV_DOMAIN is set by the Replit platform; additional
# origins can be supplied via the ALLOWED_ORIGINS env var (comma-separated).
_replit_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
_replit_expo_domain = os.environ.get("REPLIT_EXPO_DEV_DOMAIN", "")
# REPLIT_DOMAINS is the production domain list (comma-separated), injected by
# the Replit platform at runtime in autoscale deployments.
_replit_prod_domains = [
    d.strip()
    for d in os.environ.get("REPLIT_DOMAINS", "").split(",")
    if d.strip()
]
_extra_origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

_allowed_origins: list[str] = []
if _replit_domain:
    _allowed_origins.append(f"https://{_replit_domain}")
# Expo web preview runs on a separate subdomain — must be whitelisted explicitly.
if _replit_expo_domain:
    _allowed_origins.append(f"https://{_replit_expo_domain}")
# Production domains (e.g. myapp.replit.app) must also be in the allowlist so
# that same-site production requests with credentials are accepted.
for _prod_domain in _replit_prod_domains:
    _prod_origin = f"https://{_prod_domain}"
    if _prod_origin not in _allowed_origins:
        _allowed_origins.append(_prod_origin)
_allowed_origins.extend(_extra_origins)

# Fall back to localhost for purely local development (no Replit env).
if not _allowed_origins:
    _allowed_origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Routers
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(library.router, prefix="/api/library", tags=["library"])


@app.get("/api/healthz")
async def health():
    return {"status": "ok", "service": "LearnTube API"}


# ─── Clerk Frontend API proxy (production only) ──────────────────────────────
CLERK_FAPI = "https://frontend-api.clerk.dev"
CLERK_PROXY_PATH = "/api/__clerk"

# Headers that are safe to forward verbatim from the client to Clerk FAPI.
# We whitelist rather than blacklist so that unexpected custom headers added
# by an attacker are silently dropped.
_CLERK_FORWARD_HEADERS = {
    "content-type",
    "accept",
    "accept-language",
    "accept-encoding",
    "authorization",
    "cookie",
    "user-agent",
    "cache-control",
    "pragma",
    "origin",
    "referer",
}


@app.api_route(
    "/api/__clerk/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
)
async def clerk_proxy(path: str, request: Request):
    """
    Proxy Clerk Frontend API requests through this domain.
    Only active in production (CLERK_SECRET_KEY starts with sk_live_).
    In development Clerk hits FAPI directly — this returns 404.
    """
    secret_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not secret_key or not secret_key.startswith("sk_live"):
        return JSONResponse(status_code=404, content={"detail": "Clerk proxy inactive in development"})

    # Build target URL
    target_url = f"{CLERK_FAPI}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    # ── Determine the canonical proxy URL from a *trusted* source ────────────
    # We never trust any caller-supplied header (x-forwarded-host,
    # x-forwarded-proto, Host, …) to construct the Clerk-Proxy-Url security
    # header — all of these can be forged by the end client.
    #
    # Trusted sources (server-side / platform-controlled environment variables
    # only):
    #   1. CLERK_PROXY_HOST — bare hostname explicitly set at deploy time
    #      (e.g. "myapp.replit.app").  Strip any accidental scheme prefix.
    #   2. REPLIT_DEV_DOMAIN — bare hostname injected by the Replit platform.
    #
    # Scheme: always "https".  The proxy is only active in production
    # (sk_live_ key), which is always served over TLS.
    #
    # If neither env var is present we fail closed rather than falling back to
    # any request header — an unconfigured deployment should not silently proxy.
    _raw_clerk_host = os.environ.get("CLERK_PROXY_HOST", "").strip()
    # Normalise: strip scheme if the operator included it by mistake.
    for _scheme in ("https://", "http://"):
        if _raw_clerk_host.startswith(_scheme):
            _raw_clerk_host = _raw_clerk_host[len(_scheme):]
            break

    # Prefer (in order):
    #   1. CLERK_PROXY_HOST — explicitly operator-configured hostname
    #   2. REPLIT_DOMAINS   — production hostname injected by Replit autoscale
    #   3. REPLIT_DEV_DOMAIN — dev hostname (fallback, only valid during dev)
    _prod_hostname = _replit_prod_domains[0] if _replit_prod_domains else ""
    trusted_host = _raw_clerk_host or _prod_hostname or _replit_domain
    if not trusted_host:
        return JSONResponse(
            status_code=500,
            content={"detail": "Clerk proxy is not configured (set CLERK_PROXY_HOST or REPLIT_DEV_DOMAIN)"},
        )

    proxy_url = f"https://{trusted_host}{CLERK_PROXY_PATH}"

    # ── Forward only whitelisted client headers to Clerk FAPI ────────────────
    # Forwarding all client headers verbatim would let an attacker inject
    # arbitrary headers (e.g. Clerk-Secret-Key, Clerk-Proxy-Url) into the
    # upstream request.
    fwd_headers: dict[str, str] = {
        k: v
        for k, v in request.headers.items()
        if k.lower() in _CLERK_FORWARD_HEADERS
    }

    # Inject trusted security headers (overwrite any client-supplied value).
    fwd_headers["Clerk-Proxy-Url"] = proxy_url
    fwd_headers["Clerk-Secret-Key"] = secret_key

    # Preserve the real client IP for Clerk's fraud-detection logic.
    xff = request.headers.get("x-forwarded-for", "")
    client_ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "")
    if client_ip:
        fwd_headers["X-Forwarded-For"] = client_ip

    body = await request.body()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            headers=fwd_headers,
            content=body,
        )

    # Strip hop-by-hop from response headers
    resp_headers = {
        k: v for k, v in resp.headers.items()
        if k.lower() not in {"transfer-encoding", "connection", "keep-alive"}
    }

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=resp_headers,
    )


@app.on_event("startup")
async def startup():
    init_db()
    from services.intent_service import load_model
    load_model()
    print("LearnTube API started — database initialised.")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
