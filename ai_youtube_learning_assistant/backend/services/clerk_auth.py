"""
Clerk JWT verification for FastAPI.
Verifies Clerk session tokens using Clerk's JWKS endpoint.
"""

from __future__ import annotations

import json
import os
import logging
import re
from typing import Optional

import httpx
import jwt
from jwt.algorithms import RSAAlgorithm
from fastapi import Request

logger = logging.getLogger(__name__)

CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"
ANONYMOUS_ID_HEADER = "X-Anonymous-Id"
ANONYMOUS_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")

# Simple in-process JWKS cache (refreshed on import or on cache miss)
_jwks_cache: Optional[dict] = None


async def _fetch_jwks() -> dict:
    global _jwks_cache
    secret_key = os.environ.get("CLERK_SECRET_KEY", "")
    if not secret_key:
        return {"keys": []}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                CLERK_JWKS_URL,
                headers={"Authorization": f"Bearer {secret_key}"},
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
            return _jwks_cache
    except Exception as exc:
        logger.warning("Failed to fetch Clerk JWKS: %s", exc)
        return {"keys": []}


async def verify_session_token(token: str) -> Optional[dict]:
    """Return decoded JWT claims, or None if verification fails."""
    global _jwks_cache

    jwks = _jwks_cache or await _fetch_jwks()

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
                return payload

        # kid not found — JWKS may be stale, refresh once
        _jwks_cache = None
        jwks = await _fetch_jwks()
        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
                return payload

        return None
    except jwt.ExpiredSignatureError:
        logger.debug("Clerk session token expired")
        return None
    except Exception as exc:
        logger.debug("Clerk token verification failed: %s", exc)
        return None


async def get_current_user(request: Request) -> Optional[dict]:
    """Extract and verify the Clerk session token from the __session cookie."""
    token = request.cookies.get("__session")
    if not token:
        # Also accept Bearer token in Authorization header (for flexibility)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        return None

    return await verify_session_token(token)


async def require_auth(request: Request) -> dict:
    """Return a Clerk user or an anonymous browser identity.

    Clerk sessions remain supported for existing clients, while the web app
    can use the product without sign-in by sending a browser-local ID.
    """
    claims = await get_current_user(request)
    if claims:
        return claims

    anonymous_id = request.headers.get(ANONYMOUS_ID_HEADER, "").strip()
    if ANONYMOUS_ID_PATTERN.fullmatch(anonymous_id):
        return {"sub": f"anonymous:{anonymous_id}"}

    return {"sub": "anonymous:default"}
