import { usePlayer } from "@/contexts/PlayerContext";
import { Clock } from "lucide-react";

interface CitationChipProps {
  timestamp: string;
  seconds: number;
  excerpt?: string;
}

export function CitationChip({ timestamp, seconds, excerpt }: CitationChipProps) {
  const { seekTo } = usePlayer();

  return (
    <button
      onClick={() => seekTo(seconds)}
      title={excerpt ?? `Seek to ${timestamp}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60 transition-colors cursor-pointer border border-blue-200 dark:border-blue-700"
    >
      <Clock className="h-3 w-3" />
      {timestamp}
    </button>
  );
}
