"""
Embedding service using ChromaDB's built-in ONNX-based all-MiniLM-L6-v2.
Same model as sentence-transformers/all-MiniLM-L6-v2, no PyTorch required.
"""
import os
from pathlib import Path

# Redirect ChromaDB's ONNX model cache into the workspace directory so it is
# baked into the Replit "Repl layer" container image at publish time.
# The default download path (~/.cache/chroma/) is outside the workspace and
# is NOT included in the production container — meaning every cold start would
# re-download the 90 MB model from S3, which can exceed the startup probe window.
from chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2 import ONNXMiniLM_L6_V2
_BACKEND_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
ONNXMiniLM_L6_V2.DOWNLOAD_PATH = _BACKEND_DIR / ".chroma_onnx" / "all-MiniLM-L6-v2"

import chromadb  # noqa: E402  (must come after the DOWNLOAD_PATH patch)
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction  # noqa: E402

# Singleton — load once at import time
_embedding_fn = None


def get_embedding_function():
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = DefaultEmbeddingFunction()
    return _embedding_fn


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Return a list of embedding vectors for the given texts."""
    fn = get_embedding_function()
    return fn(texts)


def embed_query(text: str) -> list[float]:
    """Return a single embedding vector for a query string."""
    return embed_texts([text])[0]
