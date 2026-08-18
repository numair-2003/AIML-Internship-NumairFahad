---
name: Anonymous web access
description: LearnTube's web app is public while preserving per-browser library and chat separation.
---

The web client does not require sign-in or sign-up. It persists a random browser-local ID and sends it as `X-Anonymous-Id` on API requests. The backend accepts that identity when no valid Clerk session is present, while continuing to honor Clerk JWTs for existing or mobile clients.

**Why:** The product requirement is frictionless web use without losing the existing per-user ownership and chat-history behavior.

**How to apply:** Keep anonymous identity support in any new API route that uses the existing user dependency, and do not reintroduce a web Clerk provider or auth redirect gate unless the product requirement changes.