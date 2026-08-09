import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function ScaffoldCheck() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    fetch('/api/healthz')
      .then((r) => r.json())
      .then((d) => setApiStatus(d.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setApiStatus('error'));
  }, []);

  const statusColor =
    apiStatus === 'ok'
      ? 'text-green-400'
      : apiStatus === 'error'
        ? 'text-red-400'
        : 'text-yellow-400';

  const statusText =
    apiStatus === 'ok'
      ? '✓ Python FastAPI backend reachable'
      : apiStatus === 'error'
        ? '✗ Backend not yet reachable'
        : '… Checking backend…';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-8 p-8">
      {/* Logo / wordmark */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-9 h-9 text-primary-foreground"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">LearnTube</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          AI YouTube Learning Assistant — chat with any video's content, get
          summaries, quizzes, and flashcards powered by RAG.
        </p>
      </div>

      {/* Scaffold status card */}
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-sm space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Step 1 — Scaffold Status
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>React + Vite frontend running</span>
          </div>
          <div className={`flex items-center gap-2 ${statusColor}`}>
            <span>{apiStatus === 'checking' ? '…' : apiStatus === 'ok' ? '✓' : '✗'}</span>
            <span>{statusText}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>○</span>
            <span>Full UI coming in Step 4 (Frontend: MVP loop)</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Build order: Scaffold → Ingestion → RAG Chat → Frontend MVP → Summary →
        Quiz/Flashcards → Library → Fine-tuning → Deploy
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScaffoldCheck />
    </QueryClientProvider>
  );
}
