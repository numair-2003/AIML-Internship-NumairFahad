"""
LLM service — Google Gemini API calls live here (google-genai SDK).
Used by: RAG chat (Step 3), summary (Step 5), quiz & flashcards (Step 6).
"""

from typing import Optional
from google import genai
from google.genai import types
import json
import re
from config import settings
from services.chunking_service import format_timestamp

# Lazy singleton client
_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# ── System prompts ────────────────────────────────────────────────────────────

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

FLASHCARD_SYSTEM_PROMPT = """\
You are an expert educational flashcard creator. Generate clear, concise flashcards.\
"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _strip_fences(text: str) -> str:
    """Remove markdown code fences if present."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_citations(answer_text: str) -> list[dict]:
    """Extract [MM:SS] timestamp citations. Returns [{timestamp_str, start_seconds}]."""
    pattern = r"\[(\d{1,2}):(\d{2})\]"
    citations = []
    seen: set[str] = set()
    for match in re.finditer(pattern, answer_text):
        minutes, seconds = int(match.group(1)), int(match.group(2))
        ts = f"{minutes:02d}:{seconds:02d}"
        if ts not in seen:
            seen.add(ts)
            citations.append({"timestamp_str": ts, "start_seconds": minutes * 60 + seconds})
    return citations


def _make_config(
    system_instruction: str = "",
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> types.GenerateContentConfig:
    """Build a GenerateContentConfig."""
    kwargs: dict = {"max_output_tokens": max_tokens}
    if system_instruction:
        kwargs["system_instruction"] = system_instruction
    if json_mode:
        kwargs["response_mime_type"] = "application/json"
    return types.GenerateContentConfig(**kwargs)


# ── Public API ────────────────────────────────────────────────────────────────

def rag_chat(
    question: str,
    retrieved_chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> dict:
    """
    Run a RAG Q&A turn using Gemini.

    Args:
        question: The user's question.
        retrieved_chunks: [{text, start_time, ...}, ...] from vector store.
        conversation_history: Last 3-5 {role, content} turns (role: user/assistant).

    Returns:
        {answer: str, citations: [{timestamp_str, start_seconds, text}, ...]}
    """
    client = _get_client()

    # Build transcript context block
    excerpts_lines = [
        f'[{format_timestamp(chunk["start_time"])}] "{chunk["text"]}"'
        for chunk in retrieved_chunks
    ]
    excerpts_block = "\n".join(excerpts_lines)

    user_content = (
        f"Transcript excerpts:\n{excerpts_block}"
        f"\nUser question: {question}"
    )

    config = _make_config(system_instruction=RAG_SYSTEM_PROMPT, max_tokens=1024)

    # Convert history to Gemini Content objects (role: "user"/"model")
    if conversation_history:
        history = [
            types.Content(
                role="model" if turn["role"] == "assistant" else "user",
                parts=[types.Part(text=turn["content"])],
            )
            for turn in conversation_history[-5:]
        ]
        chat = client.chats.create(
            model=settings.gemini_model,
            config=config,
            history=history,
        )
        response = chat.send_message(user_content)
    else:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_content,
            config=config,
        )

    answer = response.text
    raw_citations = _parse_citations(answer)

    # Enrich citations with nearest chunk text
    enriched = []
    for cit in raw_citations:
        best_chunk: Optional[dict] = min(
            retrieved_chunks,
            key=lambda c: abs(c["start_time"] - cit["start_seconds"]),
            default=None,
        )
        enriched.append({
            "timestamp_str": cit["timestamp_str"],
            "start_seconds": cit["start_seconds"],
            "text": best_chunk["text"][:200] if best_chunk else "",
        })

    return {"answer": answer, "citations": enriched}


def generate_summary(transcript_text: str) -> dict:
    """
    Generate overview, key points, and chapters from transcript text.
    Uses Gemini JSON mode for guaranteed valid JSON output.

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

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=_make_config(system_instruction=SUMMARY_SYSTEM_PROMPT, max_tokens=2048, json_mode=True),
    )

    try:
        data = json.loads(_strip_fences(response.text))
    except json.JSONDecodeError:
        data = {}

    return {
        "overview": data.get("overview", ""),
        "key_points": data.get("key_points", []),
        "chapters": data.get("chapters", []),
    }


def generate_quiz(overview: str, key_points: list[str]) -> list[dict]:
    """
    Generate 5-10 multiple-choice questions from the summary.
    Uses Gemini JSON mode for guaranteed valid JSON output.

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

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=_make_config(system_instruction=QUIZ_SYSTEM_PROMPT, max_tokens=3000, json_mode=True),
    )

    try:
        return json.loads(_strip_fences(response.text))
    except json.JSONDecodeError:
        return []


def generate_flashcards(overview: str, key_points: list[str]) -> list[dict]:
    """
    Generate 8-12 flashcards (front: term/concept, back: definition/explanation).
    Uses Gemini JSON mode for guaranteed valid JSON output.

    Returns list of {front, back}.
    """
    client = _get_client()

    key_points_text = "\n".join(f"- {p}" for p in key_points)

    prompt = f"""\
Based on the following video summary and key points, generate 8-12 flashcards to help
a student memorize and review the key concepts. Return ONLY valid JSON matching this
schema, no other text:

[
  {{
    "front": "Term or question on the front of the card",
    "back": "Definition, explanation, or answer on the back of the card"
  }}
]

Summary: {overview}
Key points:
{key_points_text}
"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=_make_config(system_instruction=FLASHCARD_SYSTEM_PROMPT, max_tokens=2000, json_mode=True),
    )

    try:
        return json.loads(_strip_fences(response.text))
    except json.JSONDecodeError:
        return []
