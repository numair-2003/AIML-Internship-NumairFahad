"""
Embedding service using ChromaDB's built-in ONNX-based all-MiniLM-L6-v2.
Same model as sentence-transformers/all-MiniLM-L6-v2, no PyTorch required.
"""
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

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
