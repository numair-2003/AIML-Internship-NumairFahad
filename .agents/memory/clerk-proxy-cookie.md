---
name: Clerk proxy cookie — VITE_CLERK_PROXY_URL must be set or auto-detected
description: Critical: without the proxy URL in the frontend, session cookies are scoped to frontend-api.clerk.dev and browsers block them cross-site, causing instant sign-out on every page load.
---

## The rule
`VITE_CLERK_PROXY_URL` is a Vite **build-time** env var. If it is not set
at build time, `import.meta.env.VITE_CLERK_PROXY_URL` is `undefined` and
`ClerkProvider proxyUrl={undefined}` — Clerk JS connects directly to FAPI
rather than through the backend proxy.

Without the proxy:
- Session cookies are set for `frontend-api.clerk.dev` (FAPI domain)
- Browsers block cross-site cookies on subsequent XHR requests
- Every `prepare_verification` / `prepare_first_factor` call gets 401
- After OAuth callback, Clerk JS at `/app` finds no session → blank page → redirect to `/`

**Why:** The backend proxy is only half of the equation. The **frontend**
must also route all Clerk requests through the proxy so cookies are
set (and sent) for the app's own domain.

## How to apply
In `App.tsx`, derive the proxy URL at runtime rather than relying on the
env var alone:

```typescript
const _isDevHost =
  window.location.hostname === "localhost" ||
  window.location.hostname.endsWith(".replit.dev") ||
  window.location.hostname.endsWith(".repl.co");

const clerkProxyUrl: string | undefined =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  (_isDevHost ? undefined : `${window.location.origin}/api/__clerk`);
```

- Dev preview (`*.replit.dev`): no proxy → Clerk hits FAPI directly (correct, dev key)
- Production (`*.replit.app`): proxy auto-constructed from origin → cookies stay on the app domain

**Symptom to watch for:** "You are signed out" during email OTP, or 401 on
`prepare_verification`/`prepare_first_factor` in deployment logs, or blank
`/app` that immediately redirects to `/`.
