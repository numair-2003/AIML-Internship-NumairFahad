#!/usr/bin/env python3
"""
Train the intent classifier.

Reads data/intent_dataset.csv, trains a TF-IDF + LogisticRegression pipeline,
evaluates on a held-out validation set, and saves the model to
models/intent_classifier/classifier.pkl.

Usage (from backend/):
    python scripts/train_intent_classifier.py
"""

import os
import sys
import csv
import pickle
import random

# Ensure we run from the backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
os.chdir(backend_dir)

try:
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import classification_report, accuracy_score
    from sklearn.model_selection import train_test_split
except ImportError:
    print("scikit-learn not installed. Run: pip install scikit-learn")
    sys.exit(1)

DATA_PATH = "data/intent_dataset.csv"
MODEL_DIR = "models/intent_classifier"
MODEL_PATH = os.path.join(MODEL_DIR, "classifier.pkl")


def load_dataset(path):
    texts, labels = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(row["text"].strip())
            labels.append(row["label"].strip())
    return texts, labels


def train():
    print("Loading dataset...")
    texts, labels = load_dataset(DATA_PATH)
    print(f"  {len(texts)} examples, {len(set(labels))} classes: {sorted(set(labels))}")

    X_train, X_val, y_train, y_val = train_test_split(
        texts, labels, test_size=0.15, random_state=42, stratify=labels
    )
    print(f"  Train: {len(X_train)}, Val: {len(X_val)}")

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=10000,
            sublinear_tf=True,
            analyzer="word",
            token_pattern=r"(?u)\b\w+\b",
        )),
        ("clf", LogisticRegression(
            C=5.0,
            max_iter=500,
            class_weight="balanced",
            random_state=42,
        )),
    ])

    print("Training...")
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_val)
    acc = accuracy_score(y_val, preds)
    print(f"\nValidation accuracy: {acc:.3f}")
    print("\nClassification report:")
    print(classification_report(y_val, preds))

    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
