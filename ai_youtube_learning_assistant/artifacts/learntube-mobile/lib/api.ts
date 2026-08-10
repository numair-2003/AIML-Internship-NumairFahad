/**
 * API client for the LearnTube FastAPI backend.
 * All routes are authenticated via a Clerk Bearer token.
 */

// A function that returns the current Clerk session token
let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  _tokenGetter = getter;
}

function getBaseUrl(): string {
  // EXPO_PUBLIC_API_BASE_URL: full URL of the Replit project's main domain,
  // e.g. https://abc.pike.replit.dev — where /api is routed to FastAPI.
  // Falls back to EXPO_PUBLIC_DOMAIN for backward compat during dev.
  const apiBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (process.env.EXPO_PUBLIC_DOMAIN
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
      : '');
  return apiBase.replace(/\/$/, '');
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = _tokenGetter ? await _tokenGetter() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${getBaseUrl()}/api/videos${path}`, { ...options, headers });
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await authFetch(path, options);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Video {
  id: string;
  url: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  duration_seconds: number;
  /** 'failed' matches the backend persisted value; 'error' was incorrect. */
  status: 'processing' | 'ready' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface LibraryVideo {
  id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  created_at: string;
}

export interface Citation {
  chunk_index?: number;
  start_time?: number;
  text?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Summary {
  overview: string;
  key_points: string[];
  chapters: { title: string; start_time: number; summary?: string }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // 0-based index of correct option
  explanation?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const api = {
  processVideo: (url: string) =>
    request<{ video_id: string; status: string; title?: string }>('/process', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  getVideo: (id: string) => request<Video>(`/${id}`),

  chat: (videoId: string, message: string) =>
    request<{ answer: string; citations: Citation[]; intent: string }>(
      `/${videoId}/chat`,
      { method: 'POST', body: JSON.stringify({ message }) },
    ),

  getChatHistory: (videoId: string) =>
    request<ChatMessage[]>(`/${videoId}/chat/history`),

  clearChatHistory: (videoId: string) =>
    request<{ ok: boolean }>(`/${videoId}/chat/history`, { method: 'DELETE' }),

  getSummary: (videoId: string) => request<Summary>(`/${videoId}/summary`),

  getQuiz: (videoId: string) => request<QuizQuestion[]>(`/${videoId}/quiz`),

  getFlashcards: (videoId: string) => request<Flashcard[]>(`/${videoId}/flashcards`),
};

// Library lives at a separate /api/library path (different from /api/videos)
async function libraryRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = _tokenGetter ? await _tokenGetter() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${getBaseUrl()}/api/library${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const body = await res.json(); detail = body.detail ?? detail; } catch { /* ignore */ }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export const libraryApi = {
  getLibrary: () => libraryRequest<LibraryVideo[]>(''),
  deleteVideo: (videoId: string) =>
    libraryRequest<{ ok: boolean }>(`/${videoId}`, { method: 'DELETE' }),
};
