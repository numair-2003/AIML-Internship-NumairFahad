---
name: Intent classifier for chat routing
description: sklearn TF-IDF + LogisticRegression intent classifier for routing chat messages
---

## What it does
Classifies incoming chat messages into one of 5 intents before RAG processing:
- `summary_request` — "What's this video about?" → short-circuits to cached summary
- `definition_request` — "What does X mean?" → RAG with definition framing
- `factual_question` — "What did the speaker say about X?" → normal RAG
- `opinion_request` — "Is this a good approach?" → RAG with opinion framing
- `off_topic` — unrelated questions → polite redirect without LLM call

## Model
- **Algorithm**: sklearn `Pipeline(TfidfVectorizer(ngram_range=(1,3)) + LogisticRegression(C=5))`
- **Accuracy**: 85% on held-out validation set (170 examples, 5 classes)
- **Saved to**: `backend/models/intent_classifier/classifier.pkl`
- **Training script**: `backend/scripts/train_intent_classifier.py`
- **Dataset**: `backend/data/intent_dataset.csv` (~170 hand-labeled examples)
- **Fallback**: keyword regex heuristics in `services/intent_service.py` when model not found

## Training
```bash
cd backend && python scripts/train_intent_classifier.py
```

**Why:** PyTorch/DistilBERT couldn't be installed on Replit. sklearn TF-IDF + LR is competitive for 5-class intent with ~170 examples and reliably installable.
