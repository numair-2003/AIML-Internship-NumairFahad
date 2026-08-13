#!/bin/bash
# Production build script for the LearnTube API server.
# Called by artifact.toml [services.production.build].
set -e

BACKEND=/home/runner/workspace/ai_youtube_learning_assistant/backend
VENV=/home/runner/workspace/.venv
PYTHON=$VENV/bin/python
PIP=$VENV/bin/pip

echo "=== [1/4] Creating virtualenv ==="
python -m venv "$VENV"

echo "=== [2/4] Installing Python dependencies ==="
"$PIP" install --prefer-binary -r "$BACKEND/requirements.txt"

echo "=== [3/4] Pre-downloading ChromaDB ONNX model into workspace ==="
# embedding_service.py patches ONNXMiniLM_L6_V2.DOWNLOAD_PATH to a path
# inside the workspace so the model is baked into the container image.
# Calling ef(['warmup']) here actually triggers the download/extraction.
"$PYTHON" -c "
import sys
sys.path.insert(0, '$BACKEND')
from services.embedding_service import get_embedding_function
ef = get_embedding_function()
ef(['warmup'])
print('ONNX model is ready.')
"

echo "=== [4/4] Startup smoke test ==="
# Start the API server on a spare port (9999) and verify /api/healthz → 200.
# Port 8080 is already taken by the dev workflow so we use 9999 here.
# If the server fails to start or returns non-200 the build fails immediately,
# showing the exact error in the build log before the container is packaged.
cd "$BACKEND"
PORT=9999 "$PYTHON" main.py >/tmp/api_smoke.log 2>&1 &
SMOKE_PID=$!

echo "Waiting 30 s for the server to start..."
sleep 30

SMOKE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:9999/api/healthz 2>/dev/null || echo "000")

# Always print the server log so failures are visible in the build output
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
