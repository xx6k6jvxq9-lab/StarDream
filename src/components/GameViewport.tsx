import { Smartphone } from "lucide-react";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 900;
const MOBILE_UI_SCALE_KEY = "star_dream_mobile_ui_scale";
const EDGE_FILL_BLEND = 0.12;

const MOBILE_UI_SCALE_PRESETS = {
  small: 1,
  standard: 1,
  large: 0.94,
} as const;

type MobileUiScale = keyof typeof MOBILE_UI_SCALE_PRESETS;

type ViewportContextValue = {
  isMobileLike: boolean;
  isMobileLandscape: boolean;
  viewportWidth: number;
  viewportHeight: number;
  designWidth: number;
  designHeight: number;
  scale: number;
  uiScale: MobileUiScale;
  setUiScale: (value: MobileUiScale) => void;
};

const ViewportContext = createContext<ViewportContextValue>({
  isMobileLike: false,
  isMobileLandscape: false,
  viewportWidth: DESIGN_WIDTH,
  viewportHeight: DESIGN_HEIGHT,
  designWidth: DESIGN_WIDTH,
  designHeight: DESIGN_HEIGHT,
  scale: 1,
  uiScale: "standard",
  setUiScale: () => undefined,
});

const getViewportSize = () => {
  if (typeof window === "undefined") {
    return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
  }

  const vv = window.visualViewport;
  const width = Math.max(1, Math.round(vv?.width ?? window.innerWidth));
  const height = Math.max(1, Math.round(vv?.height ?? window.innerHeight));
  return { width, height };
};

const detectMobileLike = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|MIUI/i.test(ua) || coarsePointer;
};

export default function GameViewport({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState(getViewportSize());
  const [isMobileLike, setIsMobileLike] = useState(detectMobileLike());
  const [uiScale, setUiScale] = useState<MobileUiScale>(() => {
    if (typeof window === "undefined") return "small";
    if (!import.meta.env.DEV) return "small";
    const saved = window.localStorage.getItem(MOBILE_UI_SCALE_KEY);
    return saved === "small" || saved === "standard" || saved === "large" ? saved : "small";
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewport(getViewportSize());
      setIsMobileLike(detectMobileLike());
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!import.meta.env.DEV) return;
    window.localStorage.setItem(MOBILE_UI_SCALE_KEY, uiScale);
  }, [uiScale]);

  const isPortrait = viewport.height > viewport.width;
  const isMobileLandscape = isMobileLike && !isPortrait;
  const presetFactor = MOBILE_UI_SCALE_PRESETS[uiScale];
  const availableWidth = Math.max(1, viewport.width);
  const availableHeight = Math.max(1, viewport.height);
  const containScale = Math.min(
    availableWidth / (DESIGN_WIDTH * presetFactor),
    availableHeight / (DESIGN_HEIGHT * presetFactor),
  );
  const coverScale = Math.max(
    availableWidth / (DESIGN_WIDTH * presetFactor),
    availableHeight / (DESIGN_HEIGHT * presetFactor),
  );
  const scale = isMobileLandscape
    ? containScale + (coverScale - containScale) * EDGE_FILL_BLEND
    : 1;
  const stageWidth = Math.round(DESIGN_WIDTH * scale * presetFactor);
  const stageHeight = Math.round(DESIGN_HEIGHT * scale * presetFactor);

  const contextValue = useMemo<ViewportContextValue>(
    () => ({
      isMobileLike,
      isMobileLandscape,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      designWidth: DESIGN_WIDTH,
      designHeight: DESIGN_HEIGHT,
      scale,
      uiScale,
      setUiScale,
    }),
    [isMobileLike, isMobileLandscape, viewport.width, viewport.height, scale, uiScale],
  );

  if (!isMobileLike) {
    return <ViewportContext.Provider value={contextValue}>{children}</ViewportContext.Provider>;
  }

  if (isPortrait) {
    return (
      <ViewportContext.Provider value={contextValue}>
        <div className="fixed inset-0 z-[260] flex flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
          <div className="mb-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <Smartphone className="h-10 w-10 rotate-90 text-zinc-200" />
          </div>
          <div className="text-xl font-black tracking-wide">请横屏体验</div>
          <p className="mt-2 text-sm text-zinc-400">将手机旋转为横屏后自动进入游戏</p>
        </div>
      </ViewportContext.Provider>
    );
  }

  return (
    <ViewportContext.Provider value={contextValue}>
      <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.28),transparent_28%),linear-gradient(180deg,#efeff1_0%,#e7e7ea_100%)]">
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <div className="relative shrink-0 overflow-hidden" style={{ width: stageWidth, height: stageHeight }}>
            <div
              className="absolute left-0 top-0"
              style={{
                width: DESIGN_WIDTH,
                height: DESIGN_HEIGHT,
                transform: `scale(${scale * presetFactor})`,
                transformOrigin: "top left",
              }}
            >
              <div className="game-stage-scaled h-full w-full overflow-hidden">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </ViewportContext.Provider>
  );
}

export function useViewportMode() {
  return useContext(ViewportContext);
}
