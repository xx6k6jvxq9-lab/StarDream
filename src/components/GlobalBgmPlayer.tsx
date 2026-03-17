import { Pause, Play, SkipBack, SkipForward, Music2 } from "lucide-react";
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBgmPlayer } from "../store/useBgmPlayer";

const BGM_FILE_LOADERS = import.meta.glob("../assets/bgm/*.{mp3,wav,ogg,m4a,aac,flac}", {
  import: "default",
}) as Record<string, () => Promise<string>>;

const TRACKS = Object.entries(BGM_FILE_LOADERS)
  .map(([path, loader]) => {
    const filename = path.split("/").pop() || "track";
    const name = filename.replace(/\.[^/.]+$/, "");
    return { id: filename, name, loader };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));

const MIRROR_TRACK_KEYWORDS = ["镜头"];
const DEFAULT_TRACK_INDEX = (() => {
  const exact = TRACKS.findIndex((track) => MIRROR_TRACK_KEYWORDS.includes(track.name));
  if (exact >= 0) return exact;
  const fuzzy = TRACKS.findIndex((track) => MIRROR_TRACK_KEYWORDS.some((keyword) => track.name.includes(keyword)));
  return fuzzy >= 0 ? fuzzy : 0;
})();

const BALL_SIZE = 52;
const DEFAULT_OFFSET_X = 28;
const DEFAULT_OFFSET_Y = 84;
const DRAG_THRESHOLD = 6;
const DRAG_THRESHOLD_TOUCH = 12;

const detectMobileLike = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|MIUI/i.test(ua);
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return uaMobile || coarse;
};

const hasAnyTextNode = (text: string): boolean => {
  const nodes = Array.from(document.querySelectorAll("body *"));
  return nodes.some((node) => (node as HTMLElement).innerText?.trim() === text);
};

const detectLoginLikeScreen = (): boolean => {
  if (typeof document === "undefined") return false;
  return (
    hasAnyTextNode("开启旅程") ||
    hasAnyTextNode("建立角色档案") ||
    hasAnyTextNode("开启演艺生涯") ||
    hasAnyTextNode("选择出身与天赋")
  );
};

const clampPosition = (x: number, y: number) => {
  const vv = window.visualViewport;
  const viewportWidth = vv?.width ?? window.innerWidth;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const maxX = Math.max(8, viewportWidth - BALL_SIZE - 8);
  const maxY = Math.max(8, viewportHeight - BALL_SIZE - 8);
  return {
    x: Math.max(8, Math.min(x, maxX)),
    y: Math.max(8, Math.min(y, maxY)),
  };
};

const samePosition = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x === b.x && a.y === b.y;

export default function GlobalBgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const loadedTrackSrcRef = useRef<Record<string, string>>({});
  const hasRetriedAutoplayRef = useRef(false);
  const dragMeta = useRef({
    dragging: false,
    pointerType: "mouse",
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });
  const initializedRef = useRef(false);
  const autoplayBlockedRef = useRef(false);

  const isPlaying = useBgmPlayer((s) => s.isPlaying);
  const isPanelOpen = useBgmPlayer((s) => s.isPanelOpen);
  const currentIndex = useBgmPlayer((s) => s.currentIndex);
  const desktopPosition = useBgmPlayer((s) => s.desktopPosition);
  const mobilePosition = useBgmPlayer((s) => s.mobilePosition);
  const setPlaying = useBgmPlayer((s) => s.setPlaying);
  const togglePlaying = useBgmPlayer((s) => s.togglePlaying);
  const togglePanel = useBgmPlayer((s) => s.togglePanel);
  const setCurrentIndex = useBgmPlayer((s) => s.setCurrentIndex);
  const setPosition = useBgmPlayer((s) => s.setPosition);
  const next = useBgmPlayer((s) => s.next);
  const prev = useBgmPlayer((s) => s.prev);

  const [mounted, setMounted] = useState(false);
  const [isLoginTheme, setIsLoginTheme] = useState(false);
  const [isMobileLike, setIsMobileLike] = useState(false);

  const tracks = TRACKS;
  const safeIndex = Math.min(currentIndex, Math.max(0, tracks.length - 1));
  const currentTrack = tracks[safeIndex] ?? null;
  const mode = isMobileLike ? "mobile" : "desktop";
  const position = isMobileLike ? mobilePosition : desktopPosition;

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.7;
    audio.loop = true;
    audioRef.current = audio;
    return audio;
  }, []);

  const resolveTrackSrc = useCallback(async (trackId: string) => {
    if (loadedTrackSrcRef.current[trackId]) return loadedTrackSrcRef.current[trackId];
    const track = TRACKS.find((item) => item.id === trackId);
    if (!track) return "";
    const src = await track.loader();
    loadedTrackSrcRef.current[trackId] = src;
    return src;
  }, []);

  const syncCurrentTrack = useCallback(async () => {
    if (!currentTrack) return null;
    const audio = ensureAudio();
    const src = await resolveTrackSrc(currentTrack.id);
    if (!src) return null;
    if (loadedTrackIdRef.current !== currentTrack.id) {
      audio.src = src;
      loadedTrackIdRef.current = currentTrack.id;
      audio.currentTime = 0;
    }
    audio.loop = true;
    return audio;
  }, [currentTrack, ensureAudio, resolveTrackSrc]);

  const tryPlayCurrent = useCallback(async () => {
    if (!currentTrack) return;
    const audio = await syncCurrentTrack();
    if (!audio) return;
    void audio.play().then(() => {
      autoplayBlockedRef.current = false;
    }).catch(() => {
      autoplayBlockedRef.current = true;
    });
  }, [currentTrack, syncCurrentTrack]);

  useEffect(() => {
    setMounted(true);
    setIsMobileLike(detectMobileLike());
  }, []);

  useEffect(() => {
    if (!mounted || initializedRef.current) return;
    initializedRef.current = true;
    if (tracks.length > 0) {
      setCurrentIndex(DEFAULT_TRACK_INDEX);
      setPlaying(true);
    }
  }, [mounted, setCurrentIndex, setPlaying, tracks.length]);

  useEffect(() => {
    if (!mounted) return;
    const vv = window.visualViewport;
    const viewportWidth = vv?.width ?? window.innerWidth;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const hasSavedPosition = position.x > 0 && position.y > 0;
    const defaultPosition = clampPosition(
      viewportWidth - BALL_SIZE - DEFAULT_OFFSET_X,
      viewportHeight - BALL_SIZE - DEFAULT_OFFSET_Y,
    );

    if (!hasSavedPosition) {
      setPosition(mode, defaultPosition);
    } else {
      const clampedCurrent = clampPosition(position.x, position.y);
      const movedFar =
        Math.abs(clampedCurrent.x - position.x) > viewportWidth * 0.25 ||
        Math.abs(clampedCurrent.y - position.y) > viewportHeight * 0.25;
      const nextPosition = movedFar ? defaultPosition : clampedCurrent;
      if (!samePosition(nextPosition, position)) {
        setPosition(mode, nextPosition);
      }
    }

    const onResize = () => {
      setIsMobileLike(detectMobileLike());
      const nextViewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const nextViewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const nextDefault = clampPosition(
        nextViewportWidth - BALL_SIZE - DEFAULT_OFFSET_X,
        nextViewportHeight - BALL_SIZE - DEFAULT_OFFSET_Y,
      );
      const clamped = clampPosition(position.x, position.y);
      const nextMode = detectMobileLike() ? "mobile" : "desktop";
      const shouldReset =
        Math.abs(nextViewportWidth - viewportWidth) > 160 ||
        Math.abs(nextViewportHeight - viewportHeight) > 160;
      const nextPosition = shouldReset ? nextDefault : clamped;
      if (!samePosition(nextPosition, position)) {
        setPosition(nextMode, nextPosition);
      }
    };

    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [desktopPosition.x, desktopPosition.y, mobilePosition.x, mobilePosition.y, mode, mounted, position.x, position.y, setPosition]);

  useEffect(() => {
    const syncTheme = () => setIsLoginTheme(detectLoginLikeScreen());
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const audio = ensureAudio();
    const handleEnded = () => {
      audio.currentTime = 0;
      if (isPlaying) {
        void audio.play().catch(() => {
          autoplayBlockedRef.current = true;
        });
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [ensureAudio, isPlaying]);

  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;

    const syncAudioState = async () => {
      const audio = await syncCurrentTrack();
      if (!audio || cancelled) return;
      if (isPlaying) {
        await tryPlayCurrent();
      } else {
        audio.pause();
      }
    };

    void syncAudioState();

    return () => {
      cancelled = true;
    };
  }, [currentTrack, isPlaying, syncCurrentTrack, tryPlayCurrent]);

  useEffect(() => {
    if (!isPlaying || !autoplayBlockedRef.current || hasRetriedAutoplayRef.current) return;

    const resumeOnFirstInteract = () => {
      hasRetriedAutoplayRef.current = true;
      window.removeEventListener("pointerdown", resumeOnFirstInteract);
      window.removeEventListener("keydown", resumeOnFirstInteract);
      if (audioRef.current && !audioRef.current.paused) return;
      void tryPlayCurrent();
    };

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", resumeOnFirstInteract, opts);
    window.addEventListener("keydown", resumeOnFirstInteract, opts);

    return () => {
      window.removeEventListener("pointerdown", resumeOnFirstInteract);
      window.removeEventListener("keydown", resumeOnFirstInteract);
    };
  }, [isPlaying, tryPlayCurrent]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden && isPlaying && audioRef.current) {
        void tryPlayCurrent();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isPlaying, tryPlayCurrent]);

  const panelStyle = useMemo(
    () =>
      isLoginTheme
        ? {
            shell:
              "border-[#8a7a6b]/45 bg-[linear-gradient(160deg,rgba(20,17,15,0.72)_0%,rgba(35,28,24,0.62)_100%)] text-zinc-100 shadow-[0_22px_52px_-24px_rgba(0,0,0,0.82)] backdrop-blur-2xl",
            title: "text-[#f3ece2]",
            select:
              "border-[#9a8875]/50 bg-[rgba(28,23,20,0.72)] text-[#f3ece2] focus:border-[#bca48b]/70 focus:ring-2 focus:ring-[#bca48b]/25",
            btnControl:
              "border-[#8f7b67]/45 bg-[rgba(255,255,255,0.08)] text-[#ede1d2] hover:bg-[rgba(255,255,255,0.14)]",
            ball: "border-[#9c8873]/55 bg-[rgba(28,23,20,0.65)] text-[#f3ece2] shadow-[0_14px_30px_-16px_rgba(0,0,0,0.85)]",
            optionBg: "#241d19",
            optionText: "#f3ece2",
          }
        : {
            shell:
              "border-white/65 bg-[linear-gradient(160deg,rgba(255,255,255,0.58)_0%,rgba(255,255,255,0.42)_100%)] text-zinc-900 shadow-[0_18px_40px_-24px_rgba(24,24,27,0.35)] backdrop-blur-2xl",
            title: "text-zinc-900",
            select:
              "border-white/75 bg-[rgba(255,255,255,0.62)] text-zinc-800 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-300/35",
            btnControl: "border-zinc-300 bg-zinc-900/92 text-white hover:bg-zinc-800",
            ball: "border-white/75 bg-[rgba(255,255,255,0.62)] text-zinc-900 shadow-[0_14px_30px_-16px_rgba(24,24,27,0.35)]",
            optionBg: "#ffffff",
            optionText: "#111827",
          },
    [isLoginTheme],
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragMeta.current.dragging = true;
    dragMeta.current.pointerType = e.pointerType;
    dragMeta.current.startClientX = e.clientX;
    dragMeta.current.startClientY = e.clientY;
    dragMeta.current.startX = position.x;
    dragMeta.current.startY = position.y;
    dragMeta.current.moved = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragMeta.current.dragging) return;
    const dx = e.clientX - dragMeta.current.startClientX;
    const dy = e.clientY - dragMeta.current.startClientY;
    const threshold = dragMeta.current.pointerType === "touch" ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      dragMeta.current.moved = true;
    }
    const nextPos = clampPosition(dragMeta.current.startX + dx, dragMeta.current.startY + dy);
    setPosition(mode, nextPos);
  };

  const handlePointerUp = () => {
    if (!dragMeta.current.dragging) return;
    const moved = dragMeta.current.moved;
    dragMeta.current.dragging = false;
    if (!moved) togglePanel();
  };

  const handlePlayToggle = async () => {
    if (tracks.length === 0) return;
    if (!isPlaying) {
      await syncCurrentTrack();
    }
    togglePlaying();
  };

  const handleTrackChange = async (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    if (!isPlaying) return;
    const nextTrack = tracks[nextIndex];
    if (!nextTrack) return;
    const audio = ensureAudio();
    const src = await resolveTrackSrc(nextTrack.id);
    if (!src) return;
    audio.src = src;
    audio.currentTime = 0;
    loadedTrackIdRef.current = nextTrack.id;
    void audio.play().catch(() => {
      autoplayBlockedRef.current = true;
    });
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes bgm-icon-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="fixed z-[180] select-none" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex h-[52px] w-[52px] touch-none select-none items-center justify-center rounded-full border transition-all ${panelStyle.ball} ${isPlaying ? "scale-[1.02]" : ""}`}
          style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
          aria-label="全局音乐播放器"
        >
          <Music2
            className="h-5 w-5"
            style={isPlaying ? { animation: "bgm-icon-spin 7.5s linear infinite" } : undefined}
          />
        </button>
      </div>

      {isPanelOpen && (
        <div
          className={`fixed z-[179] w-[280px] rounded-2xl border p-3 ${panelStyle.shell}`}
          style={{
            left: `${Math.max(12, Math.min(position.x - 228, (window.visualViewport?.width ?? window.innerWidth) - 292))}px`,
            top: `${Math.max(12, Math.min(position.y - 172, (window.visualViewport?.height ?? window.innerHeight) - 196))}px`,
          }}
        >
          <div className="mb-2">
            <div className={`truncate text-xl font-bold ${panelStyle.title}`}>{currentTrack?.name ?? "暂无歌曲"}</div>
          </div>

          <div className="mb-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => prev(tracks.length)}
              disabled={tracks.length === 0}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${panelStyle.btnControl} disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label="上一首"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                void handlePlayToggle();
              }}
              disabled={tracks.length === 0}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${panelStyle.btnControl} disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => next(tracks.length)}
              disabled={tracks.length === 0}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${panelStyle.btnControl} disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label="下一首"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <select
            value={safeIndex}
            onChange={(e) => {
              void handleTrackChange(Number(e.target.value));
            }}
            className={`w-full rounded-lg border px-2 py-2 text-xs font-medium outline-none transition ${panelStyle.select}`}
          >
            {tracks.length === 0 ? (
              <option value={0} style={{ backgroundColor: panelStyle.optionBg, color: panelStyle.optionText }}>
                src/assets/bgm/ 目录暂无音乐
              </option>
            ) : (
              tracks.map((track, index) => (
                <option
                  key={track.id}
                  value={index}
                  style={{ backgroundColor: panelStyle.optionBg, color: panelStyle.optionText }}
                >
                  {track.name}
                </option>
              ))
            )}
          </select>
        </div>
      )}
    </>
  );
}
