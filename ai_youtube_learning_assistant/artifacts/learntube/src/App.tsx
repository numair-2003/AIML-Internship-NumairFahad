import { useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Menu, X, Play } from "lucide-react";
import { ProcessResult } from "@/api/client";
import { VideoInput } from "@/components/VideoInput";
import { LibrarySidebar } from "@/components/LibrarySidebar";
import { VideoWorkspace } from "@/pages/VideoWorkspace";
import { HomePage } from "@/pages/HomePage";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Workspace ────────────────────────────────────────────────────────────────
function AppPage() {
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
    <div className="flex h-screen bg-[#080d1a] overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
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

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* App header */}
          <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-700/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 text-white fill-white" />
                </div>
                <span className="font-bold text-sm tracking-tight">
                  <span className="text-indigo-400">Learn</span><span className="text-white">Tube</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
            </div>
          </header>

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

// ─── Home route ────────────────────────────────────────────────────────────────
function HomeRoute() {
  return <HomePage />;
}

// ─── Router ──────────────────────────────────────────────────────────────────
function AppWithRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/app" component={AppPage} />
        <Route path="/sign-in/*?" component={() => <Redirect to="/app" />} />
        <Route path="/sign-up/*?" component={() => <Redirect to="/app" />} />
      </Switch>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AppWithRoutes />
    </WouterRouter>
  );
}
