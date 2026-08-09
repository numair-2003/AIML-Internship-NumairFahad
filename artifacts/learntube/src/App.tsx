import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ProcessResult } from "@/api/client";
import { VideoInput } from "@/components/VideoInput";
import { LibrarySidebar } from "@/components/LibrarySidebar";
import { VideoWorkspace } from "@/pages/VideoWorkspace";

export default function App() {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleProcessed(videoId: string, _result: ProcessResult) {
    setCurrentVideoId(videoId);
    setSidebarRefresh((n) => n + 1);
    setSidebarOpen(false);
  }

  function handleSelectVideo(videoId: string) {
    setCurrentVideoId(videoId);
    setSidebarOpen(false);
  }

  function handleBack() {
    setCurrentVideoId(null);
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on md+, slide-in on mobile */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-30
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:flex md:shrink-0
        `}
      >
        <LibrarySidebar
          currentVideoId={currentVideoId ?? undefined}
          onSelectVideo={handleSelectVideo}
          refreshTrigger={sidebarRefresh}
        />
      </div>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-300 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold text-white">LearnTube</span>
        </div>

        {currentVideoId ? (
          <VideoWorkspace
            key={currentVideoId}
            videoId={currentVideoId}
            onBack={handleBack}
          />
        ) : (
          <VideoInput onProcessed={handleProcessed} />
        )}
      </main>
    </div>
  );
}
