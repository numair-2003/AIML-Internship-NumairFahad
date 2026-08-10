import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";

interface VideoPlayerProps {
  videoId: string;
  title?: string | null;
  channelName?: string | null;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function VideoPlayer({ videoId, title, channelName }: VideoPlayerProps) {
  const { registerSeek } = usePlayer();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let destroyed = false;

    function initPlayer() {
      if (destroyed) return;
      if (!window.YT || !window.YT.Player) {
        window.onYouTubeIframeAPIReady = initPlayer;
        return;
      }
      playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (!destroyed) setReady(true);
          },
        },
      });
    }

    // Load YouTube API if not already loaded
    if (!document.getElementById("yt-api-script")) {
      const script = document.createElement("script");
      script.id = "yt-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      destroyed = true;
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    registerSeek((seconds: number) => {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(seconds, true);
        playerRef.current.playVideo?.();
      }
    });
  }, [registerSeek]);

  return (
    <div className="flex flex-col gap-2">
      {/* 16:9 player container */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
        <div
          ref={containerRef}
          id={`yt-player-${videoId}`}
          className="absolute inset-0 w-full h-full"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading player…</span>
            </div>
          </div>
        )}
      </div>
      {/* Video info */}
      {title && (
        <div className="px-1">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
            {title}
          </h2>
          {channelName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{channelName}</p>
          )}
        </div>
      )}
    </div>
  );
}
