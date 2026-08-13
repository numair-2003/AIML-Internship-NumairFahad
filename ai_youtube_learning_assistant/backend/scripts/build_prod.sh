#!/bin/bash
# Production build script for the LearnTube API server.
# Called by artifact.toml [services.production.build].
#
# We intentionally do NOT create a virtualenv here.
# The build system removes build-time-only directories during cleanup
# ("Removed N files") before snapshotting the Repl layer. Any .venv we
# create would be wiped, leaving the production run command pointing at a
# non-existent interpreter. Instead we use the workspace-managed
# .pythonlibs Python, which is part of the committed workspace and is
# always included in the Repl layer.
set -e

BACKEND=/home/runner/workspace/ai_youtube_learning_assistant/backend
PYTHON=/home/runner/workspace/.pythonlibs/bin/python

echo "=== [1/2] Pre-downloading ChromaDB ONNX model into workspace ==="
# embedding_service.py patches ONNXMiniLM_L6_V2.DOWNLOAD_PATH to a path
# inside the workspace so the model is baked into the Repl layer.
# Calling ef(['warmup']) actually triggers the download/extraction.
"$PYTHON" -c "
import sys
sys.path.insert(0, '$BACKEND')
from services.embedding_service import get_embedding_function
ef = get_embedding_function()
ef(['warmup'])
print('ONNX model is ready.')
"

echo "=== [2/2] Startup smoke test ==="
# Start the API server on port 9999 (port 8080 is taken by the dev workflow)
# and verify /api/healthz returns 200 before the image is packaged.
# If this fails, the build fails here with the full server log visible.
cd "$BACKEND"
PORT=9999 "$PYTHON" main.py >/tmp/api_smoke.log 2>&1 &
SMOKE_PID=$!

echo "Waiting 30 s for the server to start..."
sleep 30

SMOKE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:9999/api/healthz 2>/dev/null || echo "000")

echo "--- server log ---"
cat /tmp/api_smoke.log || true
echo "------------------"

kill "$SMOKE_PID" 2>/dev/null || true
wait "$SMOKE_PID" 2>/dev/null || true

echo "Smoke test HTTP status: $SMOKE_CODE"
if [ "$SMOKE_CODE" != "200" ]; then
  echo "SMOKE TEST FAILED — server did not return 200 on /api/healthz"
  exit 1
fi
echo "Smoke test passed."
