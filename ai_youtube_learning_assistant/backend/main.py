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

from database import init_db
from routers import videos, library

app = FastAPI(
    title="LearnTube API",
    description="AI YouTube Learning Assistant — RAG-powered Q&A, summaries, quizzes, and flashcards",
    version="1.0.0",
)

# CORS — allow all origins in development; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    # Determine proxy URL from headers
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host_raw = request.headers.get("x-forwarded-host", "")
    effective_host = forwarded_host_raw.split(",")[0].strip() or request.headers.get("host", "")
    proxy_url = f"{forwarded_proto}://{effective_host}{CLERK_PROXY_PATH}"

    # Forward headers (strip hop-by-hop)
    hop_by_hop = {"host", "connection", "keep-alive", "transfer-encoding",
                  "upgrade", "proxy-authorization", "te", "trailers"}
    fwd_headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in hop_by_hop
    }
    fwd_headers["Clerk-Proxy-Url"] = proxy_url
    fwd_headers["Clerk-Secret-Key"] = secret_key

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
