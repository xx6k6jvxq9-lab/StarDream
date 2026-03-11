import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BgmTrack = {
  id: string;
  name: string;
  src: string;
};

type BgmPlayerState = {
  isPlaying: boolean;
  isPanelOpen: boolean;
  currentIndex: number;
  desktopPosition: { x: number; y: number };
  mobilePosition: { x: number; y: number };
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setCurrentIndex: (index: number) => void;
  setPosition: (mode: "desktop" | "mobile", pos: { x: number; y: number }) => void;
  next: (tracksLength: number) => void;
  prev: (tracksLength: number) => void;
};

export const BGM_STORAGE_KEY = "stardream_global_bgm_player";

export const useBgmPlayer = create<BgmPlayerState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isPanelOpen: false,
      currentIndex: 0,
      desktopPosition: { x: 0, y: 0 },
      mobilePosition: { x: 0, y: 0 },
      setPlaying: (playing) => set({ isPlaying: playing }),
      togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPanelOpen: (open) => set({ isPanelOpen: open }),
      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      setCurrentIndex: (index) => set({ currentIndex: Math.max(0, index) }),
      setPosition: (mode, pos) =>
        set(mode === "mobile" ? { mobilePosition: pos } : { desktopPosition: pos }),
      next: (tracksLength) => {
        if (tracksLength <= 0) return;
        set((state) => ({ currentIndex: (state.currentIndex + 1) % tracksLength }));
      },
      prev: (tracksLength) => {
        if (tracksLength <= 0) return;
        set((state) => ({ currentIndex: (state.currentIndex - 1 + tracksLength) % tracksLength }));
      },
    }),
    {
      name: BGM_STORAGE_KEY,
      partialize: (state) => ({
        isPlaying: state.isPlaying,
        isPanelOpen: state.isPanelOpen,
        currentIndex: state.currentIndex,
        desktopPosition: state.desktopPosition,
        mobilePosition: state.mobilePosition,
      }),
    },
  ),
);
