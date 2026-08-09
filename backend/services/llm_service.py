"""
LLM service — all Anthropic Claude calls live here.
Used by: RAG chat (Step 3), summary (Step 5), quiz (Step 6).
"""

from typing import Optional
import anthropic
import json
import re
from config import settings
from services.chunking_service import format_timestamp

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


# ── System prompts (from spec Section 8) ────────────────────────────────────

RAG_SYSTEM_PROMPT = """\
You are an AI learning assistant helping a user understand a specific YouTube video.
You must answer ONLY using the transcript excerpts provided below. If the answer is not
contained in the excerpts, say you don't have enough information from this video to answer,
and do not use outside knowledge.

For every claim in your answer, cite the timestamp of the excerpt it came from using the
format [MM:SS]. If multiple excerpts support the answer, cite all of them.

Keep answers concise and educational. If the user asks a follow-up question, use the
conversation history for context, but still ground your answer in the transcript excerpts.\
"""

SUMMARY_SYSTEM_PROMPT = """\
You are an expert educational content summarizer. Summarize the following video transcript
clearly and concisely for a student.\
"""

QUIZ_SYSTEM_PROMPT = """\
You are an expert quiz generator for educational content. Generate clear, fair quiz questions.\
"""


def _parse_citations(answer_text: str) -> list[dict]:
    """
    Extract [MM:SS] timestamp citations from the LLM's answer text.
    Returns list of {timestamp_str, start_seconds}.
    """
    pattern = r"\[(\d{1,2}):(\d{2})\]"
    citations = []
    seen = set()
    for match in re.finditer(pattern, answer_text):
        minutes = int(match.group(1))
        seconds = int(match.group(2))
        ts = f"{minutes:02d}:{seconds:02d}"
        if ts not in seen:
            seen.add(ts)
            citations.append(
                {
                    "timestamp_str": ts,
                    "start_seconds": minutes * 60 + seconds,
                }
            )
    return citations


def rag_chat(
    question: str,
    retrieved_chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> dict:
    """
    Run a RAG Q&A turn.

    Args:
        question: The user's question.
        retrieved_chunks: [{text, start_time, ...}, ...] from vector store.
        conversation_history: Last 3-5 {role, content} turns.

    Returns:
        {answer: str, citations: [{timestamp_str, start_seconds, text}, ...]}
    """
    client = _get_client()

    # Build the transcript context block
    excerpts_lines = []
    for chunk in retrieved_chunks:
        ts = format_timestamp(chunk["start_time"])
        excerpts_lines.append(f'[{ts}] "{chunk["text"]}"')
    excerpts_block = "\n".join(excerpts_lines)

    # Build conversation history block
    history_block = ""
    if conversation_history:
        recent = conversation_history[-5:]
        lines = []
        for turn in recent:
            role_label = "User" if turn["role"] == "user" else "Assistant"
            lines.append(f"{role_label}: {turn['content']}")
        history_block = "\nConversation so far:\n" + "\n".join(lines) + "\n"

    user_content = (
        f"Transcript excerpts:\n{excerpts_block}"
        f"{history_block}"
        f"\nUser question: {question}"
    )

    messages = [{"role": "user", "content": user_content}]

    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        system=RAG_SYSTEM_PROMPT,
        messages=messages,
    )

    answer = response.content[0].text
    raw_citations = _parse_citations(answer)

    # Enrich citations with chunk text where timestamps roughly match
    enriched = []
    for cit in raw_citations:
        # Find the chunk whose start_time is closest to the citation seconds
        best_chunk = None
        best_diff = float("inf")
        for chunk in retrieved_chunks:
            diff = abs(chunk["start_time"] - cit["start_seconds"])
            if diff < best_diff:
                best_diff = diff
                best_chunk = chunk
        enriched.append(
            {
                "timestamp_str": cit["timestamp_str"],
                "start_seconds": cit["start_seconds"],
                "text": best_chunk["text"][:200] if best_chunk else "",
            }
        )

    return {"answer": answer, "citations": enriched}


def generate_summary(transcript_text: str) -> dict:
    """
    Generate overview, key points, and chapter breakdown from transcript text.

    Returns {overview: str, key_points: [str], chapters: [{title, start_time}]}
    """
    client = _get_client()

    prompt = f"""\
Summarize the following video transcript for a student. Return ONLY valid JSON with this structure:

{{
  "overview": "3-5 sentence overview of the video",
  "key_points": ["point 1", "point 2", ..., "point N"],
  "chapters": [
    {{"title": "Chapter Title", "start_time": 0.0}},
    ...
  ]
}}

Rules:
- overview: 3-5 sentences
- key_points: 5-8 bullet strings
- chapters: infer natural topic shifts, include approximate start_time in seconds
- Return ONLY the JSON object, no other text

Transcript:
{transcript_text[:40000]}
"""

    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=2048,
        system=SUMMARY_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()

    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Retry with explicit correction prompt
        retry_response = client.messages.create(
            model=settings.claude_model,
            max_tokens=2048,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": raw},
                {
                    "role": "user",
                    "content": "Your last response was not valid JSON. Return ONLY the JSON object, no other text.",
                },
            ],
        )
        raw2 = retry_response.content[0].text.strip()
        raw2 = re.sub(r"^```(?:json)?\s*", "", raw2)
        raw2 = re.sub(r"\s*```$", "", raw2)
        data = json.loads(raw2)

    return {
        "overview": data.get("overview", ""),
        "key_points": data.get("key_points", []),
        "chapters": data.get("chapters", []),
    }


def generate_quiz(overview: str, key_points: list[str]) -> list[dict]:
    """
    Generate 5-10 multiple-choice questions from the summary.

    Returns list of {question, options, correct_index, explanation}.
    """
    client = _get_client()

    key_points_text = "\n".join(f"- {p}" for p in key_points)

    prompt = f"""\
Based on the following summary and key points, generate 5-10 quiz questions to test
understanding of the video. Return ONLY valid JSON matching this schema, no other text:

[
  {{
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct_index": 0,
    "explanation": "string"
  }}
]

Summary: {overview}
Key points:
{key_points_text}
"""

    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=3000,
        system=QUIZ_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        questions = json.loads(raw)
    except json.JSONDecodeError:
        retry_response = client.messages.create(
            model=settings.claude_model,
            max_tokens=3000,
            system=QUIZ_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": raw},
                {
                    "role": "user",
                    "content": "Your last response was not valid JSON. Return ONLY the JSON array, no other text.",
                },
            ],
        )
        raw2 = retry_response.content[0].text.strip()
        raw2 = re.sub(r"^```(?:json)?\s*", "", raw2)
        raw2 = re.sub(r"\s*```$", "", raw2)
        questions = json.loads(raw2)

    return questions
