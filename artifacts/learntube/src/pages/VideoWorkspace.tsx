import { useState, useEffect } from "react";
import { Loader2, AlertCircle, MessageSquare, FileText, HelpCircle, Layers, ArrowLeft } from "lucide-react";
import { api, VideoMeta } from "@/api/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ChatPanel } from "@/components/ChatPanel";
import { SummaryPanel } from "@/components/SummaryPanel";
import { QuizPanel } from "@/components/QuizPanel";
import { FlashcardPanel } from "@/components/FlashcardPanel";
import { PlayerProvider } from "@/contexts/PlayerContext";

type Tab = "chat" | "summary" | "quiz" | "flashcards";

interface VideoWorkspaceProps {
  videoId: string;
  onBack: () => void;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "summary", label: "Summary", icon: <FileText className="h-4 w-4" /> },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "flashcards", label: "Flashcards", icon: <Layers className="h-4 w-4" /> },
];

export function VideoWorkspace({ videoId, onBack }: VideoWorkspaceProps) {
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getVideo(videoId)
      .then(setVideo)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{error ?? "Video not found"}</p>
        <button onClick={onBack} className="text-xs text-primary underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <PlayerProvider>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Back button bar */}
        <div className="shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            New video
          </button>
        </div>

        {/* Main layout — 2-column on lg+, stacked on mobile */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Top/Left: Video player */}
          <div className="lg:w-1/2 shrink-0 flex flex-col overflow-y-auto p-4 gap-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <VideoPlayer
              videoId={videoId}
              title={video.title}
              channelName={video.channel_name}
            />

            {/* Status badge */}
            {video.status === "processing" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Indexing video content…
              </div>
            )}
          </div>

          {/* Bottom/Right: Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50 min-h-0 lg:min-h-auto" style={{ minHeight: "400px" }}>
            {/* Tab bar */}
            <div className="shrink-0 flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all -mb-px ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "chat" && <ChatPanel videoId={videoId} />}
              {activeTab === "summary" && <SummaryPanel videoId={videoId} />}
              {activeTab === "quiz" && <QuizPanel videoId={videoId} />}
              {activeTab === "flashcards" && <FlashcardPanel videoId={videoId} />}
            </div>
          </div>
        </div>
      </div>
    </PlayerProvider>
  );
}
