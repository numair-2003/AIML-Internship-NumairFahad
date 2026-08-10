import { useState } from "react";
import { Youtube, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { api, ProcessResult } from "@/api/client";

interface VideoInputProps {
  onProcessed: (videoId: string, result: ProcessResult) => void;
}

const STEPS = [
  "Validating URL…",
  "Fetching transcript…",
  "Indexing content…",
  "Almost ready…",
];

export function VideoInput({ onProcessed }: VideoInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);
    setStepIdx(0);

    // Cycle through descriptive steps while waiting
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 3500);

    try {
      const result = await api.processVideo(trimmed);
      clearInterval(interval);
      onProcessed(result.video_id, result);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const EXAMPLES = [
    { label: "3Blue1Brown — Neural Networks", url: "https://youtu.be/aircAruvnKk" },
    { label: "Andrej Karpathy — Backprop", url: "https://youtu.be/VMj-3S1tku0" },
    { label: "MIT — Introduction to Deep Learning", url: "https://youtu.be/ErnWZxJovaM" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero */}
      <div className="text-center mb-10 max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
          LearnTube
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          Paste any YouTube video and instantly chat with its content —
          ask questions, get cited answers, and generate quizzes.
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
            <div className="flex items-center pl-3 text-slate-400">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none py-2 px-2"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Processing" : "Learn"}
            </button>
          </div>

          {/* Progress steps */}
          {loading && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <span className="animate-pulse">{STEPS[stepIdx]}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Example videos */}
        {!loading && (
          <div className="mt-6">
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-3 font-medium uppercase tracking-wider">
              Try an example
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.url}
                  onClick={() => setUrl(ex.url)}
                  className="text-left text-sm px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/40 transition-all"
                >
                  <span className="text-red-500 mr-2">▶</span>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
