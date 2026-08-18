const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;
const ANONYMOUS_ID_KEY = "learntube-anonymous-id";

function getAnonymousId(): string {
  const stored = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (stored) return stored;

  const id = crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
  return id;
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "X-Anonymous-Id": getAnonymousId(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface VideoMeta {
  id: string;
  url: string;
  title: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  status: "processing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
}

export interface ProcessResult {
  video_id: string;
  status: string;
  title: string | null;
  chunks_indexed: number;
}

export interface Citation {
  timestamp_str: string;
  start_seconds: number;
  text: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  intent: string;
}

export interface Summary {
  overview: string;
  key_points: string[];
  chapters: Array<{ title: string; start_time: number }>;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
}

export interface LibraryVideo {
  id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  created_at: string;
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  processVideo: (url: string) =>
    req<ProcessResult>("POST", "/videos/process", { url }),

  getVideo: (id: string) => req<VideoMeta>("GET", `/videos/${id}`),

  chat: (videoId: string, message: string) =>
    req<ChatResponse>("POST", `/videos/${videoId}/chat`, { message }),

  getChatHistory: (videoId: string) =>
    req<ChatMessage[]>("GET", `/videos/${videoId}/chat/history`),

  clearChatHistory: (videoId: string) =>
    req<{ ok: boolean }>("DELETE", `/videos/${videoId}/chat/history`),

  getSummary: (videoId: string) =>
    req<Summary>("GET", `/videos/${videoId}/summary`),

  getQuiz: (videoId: string) =>
    req<QuizQuestion[]>("GET", `/videos/${videoId}/quiz`),

  getFlashcards: (videoId: string) =>
    req<Flashcard[]>("GET", `/videos/${videoId}/flashcards`),

  getLibrary: () => req<LibraryVideo[]>("GET", "/library"),
};
