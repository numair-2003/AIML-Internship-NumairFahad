---
name: Backend working directory for production
description: FastAPI backend must chdir to its own directory so relative paths work in both dev and prod
---

## The problem
Development run: `cd /home/runner/workspace/backend && python main.py` → cwd = `backend/`
Production run: `python /abs/path/backend/main.py` → cwd = workspace root

All relative paths (`./app.db`, `./chroma_db`, `./models/...`) resolve from cwd, so they broke in production.

## The fix (in `backend/main.py`)
```python
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(_BACKEND_DIR)
sys.path.insert(0, _BACKEND_DIR)
```

This runs at import time before anything else, guaranteeing the correct cwd regardless of how Python was invoked.

**Why:** The artifact's production run is `["python", "/abs/path/backend/main.py"]` (no shell wrapper, so `cd && python` isn't possible). Making the script chdir itself is the most robust fix.
