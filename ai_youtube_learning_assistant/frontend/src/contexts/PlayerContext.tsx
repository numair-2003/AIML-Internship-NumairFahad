import { createContext, useContext, useRef, useCallback } from "react";

interface PlayerContextValue {
  seekTo: (seconds: number) => void;
  registerSeek: (fn: (seconds: number) => void) => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  seekTo: () => {},
  registerSeek: () => {},
});

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const seekFnRef = useRef<((seconds: number) => void) | null>(null);

  const registerSeek = useCallback((fn: (seconds: number) => void) => {
    seekFnRef.current = fn;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    seekFnRef.current?.(seconds);
  }, []);

  return (
    <PlayerContext.Provider value={{ seekTo, registerSeek }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
