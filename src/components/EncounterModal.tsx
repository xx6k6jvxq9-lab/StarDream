import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHARACTER_PROFILE_IMAGES, CHARACTER_PROFILES, SPECIAL_EVENT_CONFIG } from "../gameData";
import { generateEncounterCustomInputResult } from "../services/gemini";
import { type CharacterId, CHARACTER_NAMES, getCharacterIdFromStoryId, useGameStore } from "../store/useGameStore";
import type { StoryEffect, StoryLine, StoryNode, StoryOption } from "../types/story";
import { useViewportMode } from "./GameViewport";

type EncounterModalProps = {
  story: StoryNode;
  onClose?: (payload?: { favorDelta?: number; favorTargetId?: CharacterId; dailyChatFavorDelta?: number }) => void;
};

type ModalStep = "scene" | "options" | "custom" | "result";

const relationByPsychStage: Record<string, string> = {
  guarded: "陌生",
  warming: "熟悉",
  dependent: "暧昧",
  obsessive: "心动",
  fractured: "陌生",
};

const relationAliases: Record<string, string[]> = {
  陌生: ["陌生", "防备"],
  熟悉: ["熟悉", "信任"],
  暧昧: ["暧昧", "依赖"],
  心动: ["心动", "执着"],
};

function isCustomInputOption(option: StoryOption): boolean {
  if (option.isCustomInput) return true;
  return /自定义/.test(option.text || "");
}

function splitParagraphs(text: string): string[] {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return [];
  const chunks = normalized
    .split("\n")
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return chunks.length ? chunks : [normalized];
}

function stripFavorHint(text: string): string {
  return text
    .replace(/[，,\s]*好感度?\s*[+\-−]?\s*\d+\s*(（[^）]*）)?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getActualFavorDelta(
  option: StoryOption,
  optionIndex: number,
  stage: string,
  riskTable?: Record<string, number[]>,
): number {
  if (riskTable?.[stage]) return riskTable[stage][optionIndex] ?? 0;
  for (const alias of relationAliases[stage] ?? []) {
    if (riskTable?.[alias]) return riskTable[alias][optionIndex] ?? 0;
  }
  return option.effect?.favor ?? 0;
}

function renderSpeakerBlock(line: StoryLine, playerName: string, isMobileLandscape = false) {
  const speaker = line.speaker || "旁白";
  const paragraphs = splitParagraphs(line.text);
  const isPlayer = speaker === playerName || speaker === "你" || speaker === "玩家";
  const alignClass = isPlayer ? "justify-end" : "justify-start";
  const bubbleClass = isPlayer
    ? "border-[#d4b996]/35 bg-[rgba(233,219,201,0.14)] text-zinc-100 backdrop-blur-lg"
    : "border-[#b89a73]/28 bg-[rgba(24,20,18,0.45)] text-zinc-100 backdrop-blur-md";
  const bubbleSizeClass = isMobileLandscape
    ? "max-w-[97%] rounded-[20px] px-4 py-3.5"
    : "max-w-[86%] rounded-2xl px-4 py-3";

  return (
    <div className={`flex ${alignClass}`}>
      <div className={`border shadow-[0_12px_28px_rgba(0,0,0,0.28)] ${bubbleSizeClass} ${bubbleClass}`}>
        <div className={`${isMobileLandscape ? "text-[13px]" : "text-xs"} font-bold tracking-[0.14em] ${isPlayer ? "text-[#eadcc8]" : "text-[#ccb08d]"}`}>{speaker}</div>
        <div className="mt-2 space-y-2">
          {paragraphs.map((paragraph, idx) => (
            <p
              key={`${speaker}-${idx}`}
              className={`${isMobileLandscape ? "text-[15px]" : "text-sm"} ${isPlayer ? "text-zinc-100" : "text-zinc-200"}`}
              style={{ lineHeight: isMobileLandscape ? 1.78 : 1.7, lineBreak: "strict", wordBreak: "break-word", textAlign: "justify" }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EncounterModal({ story, onClose }: EncounterModalProps) {
  const { isMobileLandscape } = useViewportMode();
  const {
    playerProfile,
    storyType,
    activeSpecialEventId,
    characters,
    unlockCharacter,
    applyEffect,
    updateCharacter,
    markCharacterEventCompleted,
    clearCurrentJob,
    clearActiveStory,
  } = useGameStore();

  const [step, setStep] = useState<ModalStep>("scene");
  const [showInputField, setShowInputField] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [pendingEffect, setPendingEffect] = useState<StoryEffect | undefined>();
  const [resultLines, setResultLines] = useState<StoryLine[]>([]);
  const [favorFloat, setFavorFloat] = useState<number | null>(null);
  const [dailyChatFavorDelta, setDailyChatFavorDelta] = useState(0);
  const autoCloseTimerRef = useRef<number | null>(null);
  const dailyChatFavorDeltaRef = useRef(0);

  const charIdFromStory = useMemo(() => getCharacterIdFromStoryId(story.id), [story.id]);
  const charId = charIdFromStory ?? "liu_mengyao";
  const charName = CHARACTER_NAMES[charId] ?? "角色";
  const charPortrait = CHARACTER_PROFILE_IMAGES[charId] ?? CHARACTER_PROFILE_IMAGES.liu_mengyao;
  const modalTitle = story.id === "liumengyao_encounter" ? "柳梦瑶·初遇" : charName;

  const currentCharacter = characters[charId];
  const relationStage = currentCharacter ? relationByPsychStage[currentCharacter.stage] : "陌生";
  const specialConfig = useMemo(
    () => SPECIAL_EVENT_CONFIG.find((cfg) => cfg.id === activeSpecialEventId) ?? null,
    [activeSpecialEventId],
  );

  const staticOptions = story.options.filter((opt) => !isCustomInputOption(opt));
  const customOptionIndex = story.options.findIndex((opt) => isCustomInputOption(opt));
  const customOption = customOptionIndex >= 0 ? story.options[customOptionIndex] : undefined;
  const isDailyChatStory = story.id.endsWith("_daily_chat");
  const allowCustomAi = storyType === "special" && customOptionIndex === 3;
  const fallbackStoryLines = useMemo<StoryLine[]>(
    () =>
      story.lines.length > 0
        ? story.lines
        : splitParagraphs(story.scene).map((text) => ({ speaker: "旁白", text })),
    [story.lines, story.scene],
  );

  useEffect(() => {
    if (autoCloseTimerRef.current) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setStep("scene");
    setShowInputField(false);
    setCustomInput("");
    setCustomLoading(false);
    setPendingEffect(undefined);
    setResultLines([]);
    setFavorFloat(null);
    setDailyChatFavorDelta(0);
    dailyChatFavorDeltaRef.current = 0;
  }, [story.id]);

  useEffect(
    () => () => {
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current);
      }
    },
    [],
  );

  const closeModal = (favorDelta?: number) => {
    clearCurrentJob();
    clearActiveStory();
    onClose?.({
      dailyChatFavorDelta: dailyChatFavorDeltaRef.current,
      favorDelta,
      favorTargetId: charIdFromStory ?? undefined,
    });
  };

  const commitEffectAndClose = (effect?: StoryEffect) => {
    const delta = effect?.favor ?? 0;
    if (charIdFromStory) {
      unlockCharacter(charIdFromStory);
      if (effect) applyEffect(charIdFromStory, effect);
      if (storyType === "encounter") {
        markCharacterEventCompleted(charIdFromStory, story.id);
      }
      if (storyType === "special" && activeSpecialEventId) {
        markCharacterEventCompleted(charIdFromStory, activeSpecialEventId);
      }
    }
    closeModal(delta);
  };

  const handleSelectOption = (option: StoryOption, optionIndex: number) => {
    if (isCustomInputOption(option)) {
      setShowInputField(true);
      setStep("custom");
      return;
    }

    const favor = getActualFavorDelta(option, optionIndex, relationStage, specialConfig?.riskTable);
    const mergedEffect: StoryEffect | undefined = option.effect
      ? { ...option.effect, favor }
      : favor !== 0
        ? { favor }
        : undefined;
    setPendingEffect(mergedEffect);
    const stageFollowUp = option.stageFollowUp?.[relationStage as "陌生" | "熟悉" | "暧昧" | "心动"];
    const resolvedFollowUp = Array.isArray(stageFollowUp)
      ? { lines: stageFollowUp }
      : (stageFollowUp ?? option.followUp);
    const lines: StoryLine[] = [
      {
        speaker: playerProfile.name || "玩家",
        text: option.text,
      },
      ...(resolvedFollowUp?.lines ?? [
        {
          speaker: charName,
          text: "我记住你的选择了。",
        },
      ]),
    ];
    setResultLines(lines);
    setStep("result");
  };

  const handleDailyChatOption = (option: StoryOption) => {
    const delta = option.effect?.favor ?? 0;
    const stageFollowUp = option.stageFollowUp?.[relationStage as "陌生" | "熟悉" | "暧昧" | "心动"];
    const resolvedFollowUp = Array.isArray(stageFollowUp)
      ? { lines: stageFollowUp }
      : (stageFollowUp ?? option.followUp);
    if (charIdFromStory) {
      const currentFavor = characters[charIdFromStory]?.favor ?? 0;
      updateCharacter(charIdFromStory, { favor: currentFavor + delta });
    }
    setPendingEffect(undefined);
    setDailyChatFavorDelta(delta);
    dailyChatFavorDeltaRef.current = delta;
    setResultLines([
      { speaker: playerProfile.name || "玩家", text: option.text },
      ...(resolvedFollowUp?.lines ?? [{ speaker: charName, text: "我记住了。" }]),
    ]);
    setFavorFloat(delta);
    setStep("result");
    autoCloseTimerRef.current = window.setTimeout(() => {
      setFavorFloat(null);
      commitEffectAndClose(undefined);
    }, 1300);
  };

  const handleCustomSubmit = async () => {
    if (!customOption || !customInput.trim() || customLoading) return;
    setCustomLoading(true);
    try {
      const playerText = customInput.trim();
      const profile = CHARACTER_PROFILES[charId];
      const aiResult = await generateEncounterCustomInputResult({
        characterName: charName,
        bio: profile?.bio ?? "",
        surface: profile?.surface ?? "",
        reversal: profile?.reversal ?? "",
        tags: profile?.tags ?? [],
        coreQuotes: profile?.coreQuotes ?? [],
        favor: currentCharacter?.favor ?? 0,
        relationStage,
        psychStage: currentCharacter?.stage ?? "guarded",
        userInput: playerText,
        scene: `${modalTitle}\n${story.scene}`,
        allowAi: allowCustomAi,
      });

      const mergedEffect: StoryEffect = {
        ...(customOption.effect ?? {}),
        favor: (customOption.effect?.favor ?? 0) + aiResult.favorDelta,
      };

      setPendingEffect(mergedEffect);
      setResultLines([
        { speaker: playerProfile.name || "玩家", text: playerText },
        { speaker: charName, text: aiResult.reply },
      ]);
      if (aiResult.favorDelta !== 0) {
        setFavorFloat(aiResult.favorDelta);
      }
      setShowInputField(false);
      setStep("result");
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current);
      }
      autoCloseTimerRef.current = window.setTimeout(() => setFavorFloat(null), 1300);
    } finally {
      setCustomLoading(false);
    }
  };

  const sceneParagraphs = splitParagraphs(storyType === "special" ? stripFavorHint(story.scene) : story.scene);
  const activePortrait = charPortrait;
  const borderTone = "border-[#b89a73]/24";
  const panelTone = "bg-[rgba(28,22,19,0.68)]";
  const textMain = "text-zinc-100";
  const textSubtle = "text-zinc-300";
  const btnPrimary = "w-full rounded-xl border border-[#c8a578]/45 bg-[linear-gradient(180deg,rgba(176,136,91,0.38)_0%,rgba(112,78,45,0.44)_100%)] px-4 py-3 text-sm font-semibold text-[#f2e6d8] shadow-[0_10px_22px_rgba(0,0,0,0.3)] transition backdrop-blur-md hover:bg-[linear-gradient(180deg,rgba(186,146,101,0.44)_0%,rgba(123,87,53,0.52)_100%)]";
  const btnSecondary = "w-full rounded-xl border border-[#b89a73]/28 bg-[rgba(40,31,26,0.58)] px-4 py-3 text-sm font-semibold text-zinc-200 shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition backdrop-blur-md hover:bg-[rgba(52,40,34,0.66)]";
  const btnGhost = "w-full rounded-xl border border-[#a88d6b]/22 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-zinc-300 transition backdrop-blur-md hover:bg-[rgba(255,255,255,0.08)]";
  const modalShellClass = isMobileLandscape
    ? "relative flex h-[calc(100dvh-8px)] w-[calc(100vw-8px)] overflow-hidden rounded-[18px] border border-[#c2a27b]/18 bg-[linear-gradient(155deg,rgba(27,21,18,0.985)_0%,rgba(34,26,22,0.95)_46%,rgba(18,14,12,0.99)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    : "relative flex h-[86vh] w-full max-w-[1280px] overflow-hidden rounded-3xl border border-[#c2a27b]/28 bg-[linear-gradient(155deg,rgba(27,21,18,0.96)_0%,rgba(34,26,22,0.9)_46%,rgba(18,14,12,0.94)_100%)] shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl";
  const portraitPanelClass = isMobileLandscape
    ? "relative w-[35%] min-w-[240px] max-w-[430px] shrink-0 bg-[rgba(10,8,7,0.52)]"
    : "relative w-[38%] min-w-[260px] bg-[rgba(10,8,7,0.38)]";
  const contentPaddingClass = isMobileLandscape ? "min-h-0 flex-1 overflow-hidden px-5 py-4" : "flex-1 overflow-auto p-6";
  const contentScrollerClass = isMobileLandscape ? "flex h-full min-h-0 flex-col" : "space-y-0";
  const actionButtonClass = isMobileLandscape ? "px-3.5 py-3 text-[14px]" : "";
  const contentTextClass = isMobileLandscape ? "text-[16px]" : "text-sm";
  const modalTree = (
    <div className="fixed inset-0 z-[140] bg-[radial-gradient(circle_at_18%_16%,rgba(96,62,35,0.22),transparent_44%),radial-gradient(circle_at_82%_84%,rgba(120,74,44,0.18),transparent_42%),linear-gradient(165deg,rgba(10,9,8,0.82)_0%,rgba(18,15,13,0.9)_62%,rgba(14,12,11,0.92)_100%)] backdrop-blur-sm">
      <div className={`flex h-full w-full items-center justify-center ${isMobileLandscape ? "p-1" : "p-4"}`}>
        <motion.div
          key={`${story.id}-${step}`}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={modalShellClass}
        >
          <div className={portraitPanelClass}>
            <img
              src={activePortrait}
              alt={charName}
              className={`h-full w-full ${isMobileLandscape ? "object-contain object-center bg-[rgba(8,6,5,0.6)]" : "object-cover"}`}
            />
            <AnimatePresence>
              {favorFloat !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.92 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: -26 }}
                  transition={{ duration: 0.45 }}
                  className={`absolute left-1/2 top-8 -translate-x-1/2 rounded-full border px-3 py-1 text-sm font-bold shadow-sm ${
                    favorFloat >= 0
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-rose-200 bg-rose-50 text-rose-600"
                  }`}
                >
                  {favorFloat >= 0 ? `+${favorFloat}` : favorFloat}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className={`shrink-0 border-b backdrop-blur-md ${isMobileLandscape ? "px-4 py-3" : "px-6 py-4"} ${borderTone} ${panelTone}`}>
              <h3 className={`flex items-center gap-2 text-lg font-bold ${textMain}`}>
                <Sparkles className="h-5 w-5 text-[#c7a071]" />
                {modalTitle}
              </h3>
            </div>

            <div className={contentPaddingClass}>
              <div className={contentScrollerClass}>
                {step === "scene" && (
                  <div className={`flex min-h-0 flex-1 flex-col rounded-2xl border backdrop-blur-md ${isMobileLandscape ? "px-4 py-3.5" : "px-5 py-4"} ${borderTone} bg-[rgba(229,218,202,0.12)]`}>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#cab192]">SCENE</div>
                    <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {sceneParagraphs.map((paragraph, idx) => (
                        <p key={`scene-${idx}`} className={`${contentTextClass} text-zinc-100`} style={{ lineHeight: 1.78, lineBreak: "strict", wordBreak: "break-word", textAlign: "justify" }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {step === "options" && (
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-2">
                    <div className="space-y-3">
                    {fallbackStoryLines.map((line, idx) => (
                      <div key={`line-${idx}`}>
                        {renderSpeakerBlock(
                          storyType === "special" ? { ...line, text: stripFavorHint(line.text) } : line,
                          playerProfile.name || "玩家",
                          isMobileLandscape,
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                )}

                {step === "result" && (
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="space-y-3">
                    {resultLines.map((line, idx) => (
                      <div key={`result-${idx}`}>
                        {renderSpeakerBlock(
                          storyType === "special" ? { ...line, text: stripFavorHint(line.text) } : line,
                          playerProfile.name || "玩家",
                          isMobileLandscape,
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                )}

                {step === "custom" && (
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="space-y-3">
                    {fallbackStoryLines.map((line, idx) => (
                      <div key={`custom-line-${idx}`}>
                        {renderSpeakerBlock(
                          storyType === "special" ? { ...line, text: stripFavorHint(line.text) } : line,
                          playerProfile.name || "玩家",
                          isMobileLandscape,
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`shrink-0 border-t backdrop-blur-md ${isMobileLandscape ? "p-4" : "p-5"} ${borderTone} ${panelTone}`}>
              {step === "scene" && (
                <button
                  onClick={() => setStep("options")}
                  className={`${btnPrimary} ${actionButtonClass}`}
                >
                  进入对话
                </button>
              )}

              {step === "options" && (
                <div className={`space-y-2 ${isMobileLandscape ? "max-h-[36dvh] overflow-y-auto pr-1" : ""}`}>
                  <div className={isMobileLandscape ? "grid grid-cols-2 gap-2.5" : "space-y-2"}>
                    {isDailyChatStory
                      ? staticOptions.map((option, idx) => (
                          <motion.button
                            key={`${option.text}-${idx}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDailyChatOption(option)}
                            className={`${btnSecondary} ${actionButtonClass} ${isMobileLandscape ? "inline-flex min-h-[48px] w-full items-center justify-center" : ""}`}
                          >
                            {option.text}
                          </motion.button>
                        ))
                      : staticOptions.map((option, idx) => (
                          <motion.button
                            key={`${option.text}-${idx}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              handleSelectOption(option, idx);
                              const favor = getActualFavorDelta(option, idx, relationStage, specialConfig?.riskTable);
                              if (favor !== 0) {
                                setFavorFloat(favor);
                                if (autoCloseTimerRef.current) {
                                  window.clearTimeout(autoCloseTimerRef.current);
                                }
                                autoCloseTimerRef.current = window.setTimeout(() => setFavorFloat(null), 1300);
                              }
                            }}
                            className={`${btnSecondary} ${actionButtonClass} ${isMobileLandscape ? "inline-flex min-h-[48px] w-full items-center justify-center" : ""}`}
                          >
                            {option.text}
                          </motion.button>
                        ))}
                  </div>
                  {!isDailyChatStory && staticOptions.length === 0 && !customOption && (
                    <button
                      onClick={() => setStep("result")}
                      className={`${btnSecondary} ${actionButtonClass}`}
                    >
                      结束对话
                    </button>
                  )}
                  {customOption && !isDailyChatStory && (
                    <button
                      onClick={() => {
                        setShowInputField(true);
                        setStep("custom");
                      }}
                      className={`${btnSecondary} ${actionButtonClass}`}
                    >
                      {customOption.text || "自定义行动"}
                    </button>
                  )}
                  <button
                    onClick={() => setStep("scene")}
                    className={`${btnGhost} ${actionButtonClass}`}
                  >
                    返回上一页
                  </button>
                </div>
              )}

              {step === "custom" && (
                <div className="space-y-2">
                  <div className={`rounded-xl border px-3 py-2 text-xs backdrop-blur-md ${borderTone} ${textSubtle} bg-[rgba(229,218,202,0.1)]`}>
                    {allowCustomAi ? "输入你的自定义动作，AI 会严格按角色人设、当前好感度与剧情阶段回复。" : "输入你的自定义动作，将使用本地预设回复并结算好感度。"}
                  </div>
                  <div className={`space-y-2 rounded-2xl border p-3 backdrop-blur-md ${borderTone} bg-[rgba(229,218,202,0.1)]`}>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="例如：我轻轻抱住她，说‘有我在，你不用一个人扛。’"
                      className="w-full rounded-xl border border-[#b89a73]/26 bg-[rgba(255,248,240,0.92)] px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c7a071]/30 disabled:text-black disabled:opacity-100"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowInputField(false);
                          setStep("options");
                        }}
                        className="rounded-lg border border-[#b89a73]/30 bg-[rgba(40,31,26,0.56)] px-3 py-2 text-sm font-medium text-zinc-200"
                      >
                        返回选项
                      </button>
                      <button
                        onClick={handleCustomSubmit}
                        disabled={customLoading || !customInput.trim()}
                        className="rounded-lg border border-[#c8a578]/45 bg-[linear-gradient(180deg,rgba(176,136,91,0.36)_0%,rgba(112,78,45,0.42)_100%)] px-3 py-2 text-sm font-medium text-[#f1e5d7] shadow-[0_8px_16px_rgba(0,0,0,0.28)] disabled:opacity-50"
                      >
                        {customLoading ? "发送中..." : "发送"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === "result" && (
                isDailyChatStory ? (
                  <div className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold backdrop-blur-md ${borderTone} ${textSubtle} bg-[rgba(229,218,202,0.1)]`}>
                    对话已记录，正在返回…
                  </div>
                ) : (
                  <button
                    onClick={() => commitEffectAndClose(pendingEffect)}
                    className={`${btnPrimary} ${actionButtonClass}`}
                  >
                    完成剧情
                  </button>
                )
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (isMobileLandscape && typeof document !== "undefined") {
    return createPortal(modalTree, document.body);
  }

  return modalTree;
}





