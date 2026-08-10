---
name: LearnTube Clerk Auth Setup
description: Clerk authentication integration details for LearnTube — provisioning, routing, proxy, backend JWT verification.
---

# LearnTube Clerk Auth

## Provisioning
- Clerk app provisioned via `setupClerkWhitelabelAuth()` — app_3HgLru2MfYwOQFv6h8H7rpyESmA
- Secrets auto-set: CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY

## Frontend (artifacts/learntube)
- `@clerk/react` + `@clerk/themes` installed
- `index.css` must have `@layer theme, base, clerk, components, utilities;` BEFORE `@import 'tailwindcss'`
- `vite.config.ts` uses `tailwindcss({ optimize: false })` — required for Clerk themes in prod
- Routes: `/` (public landing), `/app` (auth-protected workspace), `/sign-in/*?`, `/sign-up/*?`
- Home `/` shows landing page to signed-out users, redirects signed-in to `/app`
- `clerkPubKey` uses `publishableKeyFromHost` from `@clerk/react/internal` — never raw env var
- `clerkProxyUrl` is unconditional `import.meta.env.VITE_CLERK_PROXY_URL`
- Social login (Google etc.) enabled via Clerk Auth pane — not code

## Backend (Python FastAPI)
- Clerk proxy at `GET|POST|... /api/__clerk/{path:path}` in main.py
- Proxy is a no-op (returns 404) when CLERK_SECRET_KEY doesn't start with `sk_live_` (dev safety)
- JWT verification in `backend/services/clerk_auth.py` using PyJWT[crypto]
- PyJWT must be installed via `installLanguagePackages({ language: "python", packages: ["PyJWT[crypto]"] })` — pip install fails on NixOS due to PEP 668; uv is used under the hood
- Reads `__session` cookie OR `Authorization: Bearer` header for JWT

**Why:** Clerk's managed proxy requires the server to forward requests to frontend-api.clerk.dev with Clerk-Proxy-Url and Clerk-Secret-Key headers set. Python FastAPI needs PyJWT + cryptography for RSA JWKS verification.

**How to apply:** Always use `installLanguagePackages` for new Python packages, not `pip install` directly. The proxy inactive check (`not sk_live`) is intentional — dev instances hit FAPI directly.
