import { useState, useEffect, useRef } from "react";
import { Loader2, FileText, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { api, Summary } from "@/api/client";
import { CitationChip } from "./CitationChip";

interface SummaryPanelProps {
  videoId: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function SummaryPanel({ videoId }: SummaryPanelProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setElapsed(0);

    // Tick elapsed seconds so user sees progress
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    api
      .getSummary(videoId)
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        setLoading(false);
        if (timerRef.current) clearInterval(timerRef.current);
      });
  };

  useEffect(() => {
    fetchSummary();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Generating AI summary…
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {elapsed < 5
              ? "Reading transcript…"
              : elapsed < 20
              ? "Analysing content…"
              : elapsed < 40
              ? "Writing summary…"
              : "Almost there…"}
            {elapsed > 0 && (
              <span className="ml-1 tabular-nums text-slate-300">
                ({elapsed}s)
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Couldn't generate summary
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="overflow-y-auto h-full px-5 py-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Summary
        </h3>
      </div>

      {/* Overview */}
      <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/10">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {summary.overview}
        </p>
      </div>

      {/* Key points */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Key Points
        </h4>
        <ul className="space-y-2">
          {summary.key_points.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chapters */}
      {summary.chapters && summary.chapters.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Chapters
          </h4>
          <div className="space-y-1">
            {summary.chapters.map((ch, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <CitationChip
                  timestamp={formatTime(ch.start_time)}
                  seconds={ch.start_time}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {ch.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
