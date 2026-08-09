import { useState, useEffect } from "react";
import { Loader2, FileText, AlertCircle, Clock } from "lucide-react";
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

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSummary(null);

    api
      .getSummary(videoId)
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Generating summary…
          </p>
          <p className="text-xs text-slate-400 mt-1">
            This may take a moment for longer videos
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
              .getSummary(videoId)
              .then(setSummary)
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
