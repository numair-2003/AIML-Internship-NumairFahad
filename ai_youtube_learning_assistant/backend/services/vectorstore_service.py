"""
ChromaDB vector store — one collection per video, keyed as `video_<id>`.
Uses ChromaDB's built-in DefaultEmbeddingFunction (all-MiniLM-L6-v2 via ONNX)
so no separate embedding step is needed.

IMPORTANT: embedding_service must be imported before chromadb / DefaultEmbeddingFunction
so the ONNX DOWNLOAD_PATH patch is applied first — this directs the 90 MB model
into the workspace directory (backend/.chroma_onnx/) which is included in the
production container image.  Without this, the model goes to ~/.cache/chroma/
which is NOT snapshotted, causing a slow cold-start download on every deploy.
"""

import os
from pathlib import Path
from typing import Optional

# ── Patch ONNX model download path BEFORE importing chromadb ─────────────────
# Must happen before any chromadb import that might trigger the embedding fn.
from chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2 import ONNXMiniLM_L6_V2
_BACKEND_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
ONNXMiniLM_L6_V2.DOWNLOAD_PATH = _BACKEND_DIR / ".chroma_onnx" / "all-MiniLM-L6-v2"

import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from config import settings

_client: Optional[chromadb.PersistentClient] = None
_embedding_fn: Optional[DefaultEmbeddingFunction] = None


def _get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return _client


def _get_embedding_fn() -> DefaultEmbeddingFunction:
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = DefaultEmbeddingFunction()
    return _embedding_fn


def collection_exists(video_id: str) -> bool:
    client = _get_client()
    try:
        client.get_collection(f"video_{video_id}")
        return True
    except Exception:
        return False


def get_or_create_collection(video_id: str):
    client = _get_client()
    return client.get_or_create_collection(
        name=f"video_{video_id}",
        embedding_function=_get_embedding_fn(),
        metadata={"video_id": video_id},
    )


def add_chunks(video_id: str, chunks: list[dict]) -> None:
    """
    Add transcript chunks to the video's Chroma collection.

    Each chunk: {text: str, start_time: float, chunk_index: int}
    """
    collection = get_or_create_collection(video_id)

    documents = [chunk["text"] for chunk in chunks]
    ids = [f"{video_id}_{chunk['chunk_index']}" for chunk in chunks]
    metadatas = [
        {
            "video_id": video_id,
            "start_time": float(chunk["start_time"]),
            "chunk_index": int(chunk["chunk_index"]),
        }
        for chunk in chunks
    ]

    collection.add(documents=documents, ids=ids, metadatas=metadatas)


def query_chunks(video_id: str, query_text: str, k: int = 5) -> list[dict]:
    """
    Retrieve the top-k most relevant chunks for a query string.

    Returns list of {text, start_time, chunk_index}.
    """
    collection = get_or_create_collection(video_id)
    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_texts=[query_text],
        n_results=min(k, count),
    )

    chunks = []
    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i]
            chunks.append(
                {
                    "text": doc,
                    "start_time": meta["start_time"],
                    "chunk_index": meta["chunk_index"],
                }
            )
    return chunks


def get_all_chunks(video_id: str) -> list[dict]:
    """Return all stored chunks for a video, sorted by start_time."""
    collection = get_or_create_collection(video_id)
    count = collection.count()
    if count == 0:
        return []
    results = collection.get(include=["documents", "metadatas"])
    chunks = []
    for doc, meta in zip(results["documents"], results["metadatas"]):
        chunks.append(
            {
                "text": doc,
                "start_time": float(meta.get("start_time", 0)),
                "chunk_index": int(meta.get("chunk_index", 0)),
            }
        )
    chunks.sort(key=lambda x: x["start_time"])
    return chunks


def delete_collection(video_id: str) -> None:
    """Remove the collection for a video (used when reprocessing)."""
    client = _get_client()
    try:
        client.delete_collection(f"video_{video_id}")
    except Exception:
        pass
