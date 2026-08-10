"""
Intent classifier for incoming chat messages.

Uses a fine-tuned sklearn TF-IDF + LogisticRegression pipeline trained on
a labeled dataset of question intents. Falls back to keyword heuristics if
the trained model is not yet available.

Intents:
  summary_request   — user wants an overview / summary of the video
  definition_request — user wants a concept defined or explained
  factual_question  — user asks a factual question about video content
  opinion_request   — user asks for opinions, recommendations, or comparisons
  off_topic         — question unrelated to the video
"""

import os
import re
import pickle
import logging
from config import settings

logger = logging.getLogger(__name__)

_model = None
_model_loaded = False


def load_model() -> None:
    """Load the trained classifier from disk (called once at startup)."""
    global _model, _model_loaded
    model_path = os.path.join(settings.intent_model_path, "classifier.pkl")
    if os.path.exists(model_path):
        try:
            with open(model_path, "rb") as f:
                _model = pickle.load(f)
            logger.info("Intent classifier loaded from %s", model_path)
        except Exception as e:
            logger.warning("Failed to load intent classifier: %s — using heuristics", e)
    else:
        logger.info("No trained intent classifier found at %s — using heuristics", model_path)
    _model_loaded = True


def classify_intent(text: str) -> str:
    """
    Classify the intent of a user's chat message.

    Returns one of: summary_request, definition_request, factual_question,
                    opinion_request, off_topic
    """
    if not _model_loaded:
        load_model()

    if _model is not None:
        try:
            return _model.predict([text])[0]
        except Exception:
            pass  # fall through to heuristics

    return _heuristic_classify(text)


# ── Keyword heuristics (fast fallback) ───────────────────────────────────────

_SUMMARY_PATTERNS = re.compile(
    r"\b(summarize|summary|overview|recap|gist|main (point|idea|topic)|"
    r"what('s| is) (this|the) (video|talk|lecture) about|"
    r"tldr|tl;dr|brief(ly)?|outline)\b",
    re.IGNORECASE,
)

_DEFINITION_PATTERNS = re.compile(
    r"\b(what (does|is|are|do)|define|definition|meaning of|"
    r"explain (what|the concept|the term|the idea)|what('s| is) meant by|"
    r"what (does .+ mean|is .+ in)|concept of|term)\b",
    re.IGNORECASE,
)

_OPINION_PATTERNS = re.compile(
    r"\b(best|better|worst|recommend|opinion|think about|feel about|"
    r"agree|disagree|should i|pros and cons|advantage|disadvantage|"
    r"compare|versus|vs\.?|which (is|would))\b",
    re.IGNORECASE,
)

_OFF_TOPIC_SIGNALS = re.compile(
    r"\b(weather|joke|recipe|code|program|python|javascript|write me|"
    r"email|stock|crypto|bitcoin|politics|sports|movie|song|"
    r"2\s*\+\s*2|capital of|president|actor|actress)\b",
    re.IGNORECASE,
)


def _heuristic_classify(text: str) -> str:
    if _SUMMARY_PATTERNS.search(text):
        return "summary_request"
    if _DEFINITION_PATTERNS.search(text):
        return "definition_request"
    if _OPINION_PATTERNS.search(text):
        return "opinion_request"
    if _OFF_TOPIC_SIGNALS.search(text):
        return "off_topic"
    return "factual_question"
