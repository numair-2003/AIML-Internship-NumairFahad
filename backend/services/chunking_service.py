"""
Merges raw transcript segments into ~500-800 char chunks,
preserving the start timestamp of the first segment in each chunk.
"""

TARGET_MIN = 500
TARGET_MAX = 800


def chunk_transcript(segments: list[dict]) -> list[dict]:
    """
    Input:  list of {text: str, start: float, duration: float}
    Output: list of {text: str, start_time: float, chunk_index: int}
    """
    chunks = []
    current_text = ""
    current_start = None
    chunk_index = 0

    for seg in segments:
        text = seg["text"].strip()
        if not text:
            continue

        if current_start is None:
            current_start = seg["start"]

        # Add a space between segments
        candidate = (current_text + " " + text).strip() if current_text else text

        if len(candidate) >= TARGET_MAX and current_text:
            # Flush current chunk before adding this segment
            chunks.append(
                {
                    "text": current_text.strip(),
                    "start_time": current_start,
                    "chunk_index": chunk_index,
                }
            )
            chunk_index += 1
            current_text = text
            current_start = seg["start"]
        else:
            current_text = candidate

        # Flush at natural break if we've exceeded TARGET_MIN
        if len(current_text) >= TARGET_MIN:
            # Only flush if this segment ends a sentence (heuristic)
            if current_text[-1] in ".!?":
                chunks.append(
                    {
                        "text": current_text.strip(),
                        "start_time": current_start,
                        "chunk_index": chunk_index,
                    }
                )
                chunk_index += 1
                current_text = ""
                current_start = None

    # Flush any remaining text
    if current_text.strip() and current_start is not None:
        chunks.append(
            {
                "text": current_text.strip(),
                "start_time": current_start,
                "chunk_index": chunk_index,
            }
        )

    return chunks


def format_timestamp(seconds: float) -> str:
    """Convert float seconds to MM:SS string."""
    total = int(seconds)
    minutes = total // 60
    secs = total % 60
    return f"{minutes:02d}:{secs:02d}"
