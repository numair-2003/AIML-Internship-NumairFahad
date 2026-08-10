import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Trophy, RefreshCw } from "lucide-react";
import { api, QuizQuestion } from "@/api/client";

interface QuizPanelProps {
  videoId: string;
}

export function QuizPanel({ videoId }: QuizPanelProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [showScore, setShowScore] = useState(false);

  function loadQuiz() {
    setLoading(true);
    setError(null);
    setAnswers({});
    setRevealed({});
    setShowScore(false);
    api
      .getQuiz(videoId)
      .then(setQuestions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadQuiz();
  }, [videoId]);

  function selectAnswer(qIdx: number, optIdx: number) {
    if (revealed[qIdx]) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  }

  function checkAnswer(qIdx: number) {
    setRevealed((prev) => ({ ...prev, [qIdx]: true }));
  }

  function finishQuiz() {
    // Reveal all before showing score
    const allRevealed: Record<number, boolean> = {};
    questions.forEach((_, i) => (allRevealed[i] = true));
    setRevealed(allRevealed);
    setShowScore(true);
  }

  const score = questions.filter(
    (q, i) => revealed[i] && answers[i] === q.correct_index
  ).length;
  const totalAnswered = Object.keys(revealed).length;
  const allDone = totalAnswered === questions.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Generating quiz…
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Creating questions from the video content
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
          onClick={loadQuiz}
          className="text-xs text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (showScore && allDone) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-16 px-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className={`h-10 w-10 ${pct >= 70 ? "text-yellow-500" : "text-slate-400"}`} />
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {score}/{questions.length}
          </div>
          <div className="text-lg text-slate-500 dark:text-slate-400">
            {pct >= 90 ? "Excellent!" : pct >= 70 ? "Good job!" : pct >= 50 ? "Keep studying!" : "Keep practicing!"}
          </div>
        </div>
        <button
          onClick={() => {
            setAnswers({});
            setRevealed({});
            setShowScore(false);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-5 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Quiz — {questions.length} Questions
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {totalAnswered}/{questions.length} answered
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(totalAnswered / questions.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      {questions.map((q, qIdx) => {
        const chosen = answers[qIdx];
        const isRevealed = revealed[qIdx];
        const isCorrect = chosen === q.correct_index;

        return (
          <div
            key={qIdx}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
          >
            <div className="flex gap-3 mb-4">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {qIdx + 1}
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {q.question}
              </p>
            </div>

            <div className="space-y-2 ml-9">
              {q.options.map((opt, oIdx) => {
                let optClass = "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5";
                if (isRevealed) {
                  if (oIdx === q.correct_index) {
                    optClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300";
                  } else if (oIdx === chosen && oIdx !== q.correct_index) {
                    optClass = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300";
                  } else {
                    optClass = "border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 opacity-60";
                  }
                } else if (chosen === oIdx) {
                  optClass = "border-primary bg-primary/5 text-primary";
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => selectAnswer(qIdx, oIdx)}
                    disabled={isRevealed}
                    className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${optClass} disabled:cursor-default flex items-center gap-2.5`}
                  >
                    {isRevealed && oIdx === q.correct_index && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    {isRevealed && oIdx === chosen && oIdx !== q.correct_index && (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    {(!isRevealed || (oIdx !== q.correct_index && oIdx !== chosen)) && (
                      <span className="w-4 h-4 shrink-0 rounded-full border-2 border-current opacity-50 inline-flex" />
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Check / Explanation */}
            {!isRevealed ? (
              <button
                onClick={() => checkAnswer(qIdx)}
                disabled={chosen === undefined}
                className="mt-4 ml-9 text-xs px-4 py-1.5 rounded-lg bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Check answer
              </button>
            ) : (
              <div className={`mt-4 ml-9 p-3 rounded-lg text-xs ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}>
                <span className="font-semibold">{isCorrect ? "✓ Correct! " : "✗ Incorrect. "}</span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Finish button */}
      {!allDone && questions.length > 0 && (
        <button
          onClick={finishQuiz}
          className="w-full py-2.5 rounded-xl border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all"
        >
          Finish &amp; see score
        </button>
      )}
    </div>
  );
}
