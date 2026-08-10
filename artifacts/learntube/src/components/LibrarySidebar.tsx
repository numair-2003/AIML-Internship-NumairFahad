import { useState, useEffect } from "react";
import { BookOpen, Clock, Loader2, Youtube, ChevronRight } from "lucide-react";
import { api, LibraryVideo } from "@/api/client";

interface LibrarySidebarProps {
  currentVideoId?: string;
  onSelectVideo: (videoId: string) => void;
  refreshTrigger?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LibrarySidebar({ currentVideoId, onSelectVideo, refreshTrigger }: LibrarySidebarProps) {
  const [videos, setVideos] = useState<LibraryVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getLibrary()
      .then(setVideos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshTrigger]); // Re-fetch when a new video is processed

  return (
    <aside className="flex flex-col h-full bg-slate-900 dark:bg-slate-950 text-white w-64 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">LearnTube</div>
            <div className="text-xs text-slate-400">AI Study Assistant</div>
          </div>
        </div>
      </div>

      {/* Library heading */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Clock className="h-3.5 w-3.5" />
          Recent Videos
        </div>
      </div>

      {/* Video list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        ) : videos.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <Youtube className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              No videos yet. Paste a YouTube URL to get started.
            </p>
          </div>
        ) : (
          videos.map((v) => {
            const isActive = v.id === currentVideoId;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVideo(v.id)}
                className={`w-full text-left flex gap-3 p-2.5 rounded-lg transition-all group ${
                  isActive
                    ? "bg-primary/20 border border-primary/30"
                    : "hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-16 h-10 rounded overflow-hidden bg-slate-700">
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-4 w-4 text-slate-500" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">
                    {v.title ?? v.id}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {v.channel_name ?? ""}{v.channel_name ? " · " : ""}
                    {timeAgo(v.created_at)}
                  </p>
                </div>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 self-center" />
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
