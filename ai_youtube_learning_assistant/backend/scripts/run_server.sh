#!/bin/sh
# Production entrypoint for the LearnTube API server.
#
# Why this script instead of pointing artifact.toml directly at
# .pythonlibs/bin/python:
#
#   .pythonlibs/bin/python is a symlink into the Nix store
#   (e.g. /nix/store/<hash>-python-wrapped-0.1.0/bin/.python-wrapped).
#   The production container's Nix layer may be cached from a build where
#   the python-wrapped package had a different content hash, making the
#   symlink silently broken.  When the run command resolves to a missing
#   file, the process exits in milliseconds, and the health-check probe
#   times out after ~4 minutes with no log output at all.
#
#   This script resolves Python at runtime, falls back gracefully, and sets
#   PYTHONPATH explicitly so packages are found regardless of which binary
#   we end up using.  All key steps are logged to stdout so they appear in
#   the deployment runtime logs, making future failures immediately visible.
set -e

BACKEND=/home/runner/workspace/ai_youtube_learning_assistant/backend
PYTHONLIBS=/home/runner/workspace/.pythonlibs
SITE_PKGS="$PYTHONLIBS/lib/python3.13/site-packages"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

log "LearnTube API: entrypoint starting"

# ── Resolve Python interpreter ────────────────────────────────────────────────
# Priority 1: follow the .pythonlibs symlink to the real binary.
_symlink_target=$(readlink -f "$PYTHONLIBS/bin/python" 2>/dev/null || true)
if [ -n "$_symlink_target" ] && [ -x "$_symlink_target" ]; then
    PYTHON="$_symlink_target"
    log "Python (resolved symlink): $PYTHON"
else
    # Priority 2: try common system paths from the Nix layer.
    for _candidate in \
        /nix/store/*/bin/python3.13 \
        /nix/store/*/bin/python3 \
        /usr/bin/python3 \
        /usr/bin/python
    do
        # shellcheck disable=SC2086
        set -- $_candidate   # expand glob
        if [ -x "$1" ]; then
            PYTHON="$1"
            log "Python (fallback): $PYTHON"
            break
        fi
    done
fi

if [ -z "${PYTHON:-}" ]; then
    log "ERROR: Cannot locate a Python interpreter — aborting."
    exit 1
fi

# ── Ensure .pythonlibs packages are on the path ───────────────────────────────
if [ -d "$SITE_PKGS" ]; then
    export PYTHONPATH="$SITE_PKGS${PYTHONPATH:+:$PYTHONPATH}"
    log "PYTHONPATH set to include $SITE_PKGS"
else
    log "WARNING: $SITE_PKGS not found — package imports may fail."
fi

# ── Quick sanity check ────────────────────────────────────────────────────────
log "Testing Python + critical imports..."
"$PYTHON" - <<'PYCHECK'
import sys
print(f"  Python {sys.version.split()[0]} at {sys.executable}")
import fastapi, uvicorn, chromadb, slowapi, sqlalchemy, sklearn
print("  Imports: fastapi uvicorn chromadb slowapi sqlalchemy sklearn — OK")
PYCHECK

log "All checks passed. Starting uvicorn on PORT=${PORT:-8080}..."

cd "$BACKEND"
exec "$PYTHON" main.py
