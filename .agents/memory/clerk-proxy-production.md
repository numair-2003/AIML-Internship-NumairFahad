---
name: Clerk proxy production domain fix
description: Why the production app showed a blank page and how the Clerk proxy trusted_host is determined
---

# Clerk Proxy — Production Domain Bug

## The Rule
The FastAPI Clerk proxy (`/api/__clerk`) must send `Clerk-Proxy-Url: https://<PRODUCTION_DOMAIN>/api/__clerk` to Clerk FAPI. Using the dev domain causes a 400 from Clerk FAPI, Clerk never initialises, and the entire React app renders blank.

**Why:** `publishableKeyFromHost` + `<Show when="signed-in/signed-out">` render nothing during Clerk's loading state. If Clerk never finishes loading (400 from FAPI), the page stays permanently blank.

## How to apply
In `backend/main.py`, `trusted_host` is resolved in this priority order:
1. `CLERK_PROXY_HOST` env var (explicitly set by operator — set this as a production env var to `ai-you-tube-assistant.replit.app`)
2. `REPLIT_DOMAINS` (runtime-injected by Replit autoscale; first domain in the comma-separated list is the production hostname)
3. `REPLIT_DEV_DOMAIN` (fallback — only valid in dev; using this in production sends the wrong domain to Clerk FAPI)

## Diagnosis signals
- Production app is a blank white/light-gray page
- JS bundle loads (200 OK) with correct `pk_live_` Clerk key
- Deployment logs show `/api/__clerk/v1/client HTTP/1.1" 400 Bad Request`
- `curl https://<prod>/api/__clerk/v1/client` → 400

## Fix applied
- `backend/main.py` reads `REPLIT_DOMAINS` and prefers it over `REPLIT_DEV_DOMAIN`
- `CLERK_PROXY_HOST=ai-you-tube-assistant.replit.app` set as production env var
- CORS `_allowed_origins` also extended to include `REPLIT_DOMAINS` entries
