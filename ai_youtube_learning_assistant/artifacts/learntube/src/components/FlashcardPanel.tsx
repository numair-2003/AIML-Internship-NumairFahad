import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, RotateCcw, Layers } from "lucide-react";
import { api, Flashcard } from "@/api/client";

interface FlashcardPanelProps {
  videoId: string;
}

export function FlashcardPanel({ videoId }: FlashcardPanelProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentIdx(0);
    setFlipped(false);
    setKnown(new Set());
    api
      .getFlashcards(videoId)
      .then(setCards)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [videoId]);

  function next() {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((i) => Math.min(i + 1, cards.length - 1)), 150);
  }

  function prev() {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((i) => Math.max(i - 1, 0)), 150);
  }

  function toggleKnown() {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  }

  function reset() {
    setCurrentIdx(0);
    setFlipped(false);
    setKnown(new Set());
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Generating flashcards…
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Extracting key concepts from the video
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            api
              .getFlashcards(videoId)
              .then(setCards)
              .catch((e) => setError(e.message))
              .finally(() => setLoading(false));
          }}
          className="text-xs text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6 text-center">
        <Layers className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500">No flashcards yet</p>
      </div>
    );
  }

  const card = cards[currentIdx];
  const isKnown = known.has(currentIdx);

  return (
    <div className="flex flex-col h-full px-5 py-5 gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Flashcards
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{currentIdx + 1} / {cards.length}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ {known.size} known
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-full max-w-md cursor-pointer select-none"
          style={{ perspective: "1000px" }}
          onClick={() => setFlipped((f) => !f)}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "220px",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Concept
              </div>
              <p className="text-center text-lg font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                {card.front}
              </p>
              <p className="mt-6 text-xs text-slate-400">Click to reveal answer</p>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-primary/5 dark:bg-primary/10 rounded-2xl border-2 border-primary/30 shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                Answer
              </div>
              <p className="text-center text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {card.back}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>

        <button
          onClick={toggleKnown}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
            isKnown
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-slate-200 dark:border-slate-600 text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
          }`}
        >
          {isKnown ? "✓ I know this" : "Mark as known"}
        </button>

        <button
          onClick={next}
          disabled={currentIdx === cards.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset deck
      </button>
    </div>
  );
}
