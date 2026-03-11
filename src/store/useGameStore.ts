import { create } from "zustand";
import { ENCOUNTER_CONFIG, SPECIAL_EVENT_CONFIG } from "../gameData";
import { getStoryById } from "../stories";
import type { StoryEffect, StoryNode, StoryType } from "../types/story";

const METRIC_MIN = 0;
const METRIC_MAX = 100;
const FAVOR_PRE_EVENT_CAP = 80;

const clamp = (value: number, min = METRIC_MIN, max = METRIC_MAX): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

export type PlayerState = {
  fame: number;
  sincerity: number;
  scheme: number;
  selfControl: boolean;
  finalSacrifice: boolean;
  money: number;
  currentJobId: string | null;
};

export type PlayerProfile = {
  name: string;
  avatar: string;
  portrait: string;
  label: string;
};

export type CompanyState = {
  isBoss: boolean;
  companyName: string;
  hiredStaffIds: string[];
};

export type CharacterId =
  | "shen_mo"
  | "lu_xingran"
  | "liu_mengyao"
  | "su_tangtang"
  | "gu_chengyan"
  | "lin_yu"
  | "zhou_yan"
  | "jiang_muci"
  | "ji_mingxuan";

export type PsychologyStage = "guarded" | "warming" | "dependent" | "obsessive" | "fractured";

export type CharacterPsychology = {
  favor: number;
  paranoia: number;
  possessiveness: number;
  insecurity: number;
  trust: number;
  keyEventTriggered: boolean;
  favorLocked: boolean;
  stage: PsychologyStage;
  completedEvents: string[];
};

export type CharacterUpdate = Partial<
  Pick<CharacterPsychology, "favor" | "paranoia" | "possessiveness" | "insecurity" | "trust" | "keyEventTriggered">
>;

const deriveStage = (
  metrics: Pick<CharacterPsychology, "favor" | "paranoia" | "possessiveness" | "insecurity" | "trust">,
): PsychologyStage => {
  const { favor, paranoia, possessiveness, insecurity, trust } = metrics;
  if ((paranoia >= 75 || possessiveness >= 80) && favor >= 60) return "obsessive";
  if (insecurity >= 70 && trust <= 30) return "fractured";
  if (favor >= 70 && trust >= 60 && insecurity <= 45) return "dependent";
  if (favor >= 40 || trust >= 40) return "warming";
  return "guarded";
};

const normalizePsychology = (raw: CharacterPsychology): CharacterPsychology => {
  const favorCap = raw.keyEventTriggered ? METRIC_MAX : FAVOR_PRE_EVENT_CAP;
  const favor = clamp(raw.favor, METRIC_MIN, favorCap);
  const paranoia = clamp(raw.paranoia);
  const possessiveness = clamp(raw.possessiveness);
  const insecurity = clamp(raw.insecurity);
  const trust = clamp(raw.trust);
  const favorLocked = !raw.keyEventTriggered && favor >= FAVOR_PRE_EVENT_CAP;

  return {
    favor,
    paranoia,
    possessiveness,
    insecurity,
    trust,
    keyEventTriggered: raw.keyEventTriggered,
    favorLocked,
    stage: deriveStage({ favor, paranoia, possessiveness, insecurity, trust }),
    completedEvents: raw.completedEvents ?? [],
  };
};

const makeCharacter = (
  seed: Pick<CharacterPsychology, "favor" | "paranoia" | "possessiveness" | "insecurity" | "trust">,
): CharacterPsychology =>
  normalizePsychology({
    ...seed,
    keyEventTriggered: false,
    favorLocked: false,
    stage: "guarded",
    completedEvents: [],
  });

const stageToRelation: Record<PsychologyStage, "陌生" | "熟悉" | "暧昧" | "心动"> = {
  guarded: "陌生",
  warming: "熟悉",
  dependent: "暧昧",
  obsessive: "心动",
  fractured: "陌生",
};

export type EncounterStatus = "locked" | "unlocked" | "missed";

const normalizeRelation = (value: string): "陌生" | "熟悉" | "暧昧" | "心动" | null => {
  if (value === "陌生") return "陌生";
  if (value === "熟悉") return "熟悉";
  if (value === "暧昧") return "暧昧";
  if (value === "心动") return "心动";
  return null;
};

const charKeyMap: Record<string, CharacterId> = {
  shenmo: "shen_mo",
  luxingran: "lu_xingran",
  liumengyao: "liu_mengyao",
  sutangtang: "su_tangtang",
  guchengyan: "gu_chengyan",
  linyu: "lin_yu",
  zhouyan: "zhou_yan",
  jiangmuci: "jiang_muci",
  jimingxuan: "ji_mingxuan",
};

const inferCharacterIdFromStoryId = (storyId: string): CharacterId | null => {
  const key = storyId.split("_")[0]?.toLowerCase();
  return charKeyMap[key] ?? null;
};

const DAYS_PER_MONTH = 30;
const LEGACY_WEEKS_PER_MONTH = 4;
const DAYS_PER_LEGACY_WEEK = Math.ceil(DAYS_PER_MONTH / LEGACY_WEEKS_PER_MONTH);
const getLegacyWeekFromDay = (day: number): number =>
  Math.min(LEGACY_WEEKS_PER_MONTH, Math.max(1, Math.ceil(day / DAYS_PER_LEGACY_WEEK)));

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  shen_mo: "沈默",
  lu_xingran: "陆星燃",
  liu_mengyao: "柳梦瑶",
  su_tangtang: "苏糖糖",
  gu_chengyan: "顾承宴",
  lin_yu: "林屿",
  zhou_yan: "周焰",
  jiang_muci: "江暮辞",
  ji_mingxuan: "季明轩",
};

const initialPlayerState: PlayerState = {
  fame: 0,
  sincerity: 0,
  scheme: 0,
  selfControl: false,
  finalSacrifice: false,
  money: 0,
  currentJobId: null,
};

const initialPlayerProfile: PlayerProfile = {
  name: "你",
  avatar: "",
  portrait: "",
  label: "平平无奇",
};

const initialCompanyState: CompanyState = {
  isBoss: false,
  companyName: "",
  hiredStaffIds: [],
};

const initialCharacterState: Record<CharacterId, CharacterPsychology> = {
  shen_mo: makeCharacter({ favor: 0, paranoia: 30, possessiveness: 25, insecurity: 40, trust: 35 }),
  lu_xingran: makeCharacter({ favor: 0, paranoia: 22, possessiveness: 35, insecurity: 33, trust: 42 }),
  liu_mengyao: makeCharacter({ favor: 0, paranoia: 48, possessiveness: 41, insecurity: 52, trust: 24 }),
  su_tangtang: makeCharacter({ favor: 0, paranoia: 16, possessiveness: 20, insecurity: 26, trust: 46 }),
  gu_chengyan: makeCharacter({ favor: 0, paranoia: 52, possessiveness: 50, insecurity: 47, trust: 22 }),
  lin_yu: makeCharacter({ favor: 0, paranoia: 36, possessiveness: 34, insecurity: 42, trust: 31 }),
  zhou_yan: makeCharacter({ favor: 0, paranoia: 40, possessiveness: 44, insecurity: 39, trust: 28 }),
  jiang_muci: makeCharacter({ favor: 0, paranoia: 18, possessiveness: 30, insecurity: 28, trust: 62 }),
  ji_mingxuan: makeCharacter({ favor: 0, paranoia: 66, possessiveness: 26, insecurity: 46, trust: 27 }),
};

type GameStore = {
  player: PlayerState;
  playerProfile: PlayerProfile;
  companyState: CompanyState;
  characters: Record<CharacterId, CharacterPsychology>;
  characterUnlocks: Record<CharacterId, boolean>;
  characterStatuses: Record<CharacterId, EncounterStatus>;
  hasChattedThisWeek: Record<CharacterId, boolean>;
  activeStory: StoryNode | null;
  storyType: StoryType;
  activeSpecialEventId: string | null;
  activeEncounter: string | null;
  time: { year: number; month: number; week: number } | null;
  currentLocation: string;
  updatePlayer: (patch: Partial<PlayerState>) => void;
  updateCompanyState: (patch: Partial<CompanyState>) => void;
  acceptJob: (jobId: string) => void;
  clearCurrentJob: () => void;
  updatePlayerProfile: (patch: Partial<PlayerProfile>) => void;
  updateCharacter: (characterId: CharacterId, patch: CharacterUpdate) => void;
  triggerCharacterKeyEvent: (characterId: CharacterId) => void;
  unlockCharacter: (characterId: CharacterId) => void;
  applyEffect: (characterId: CharacterId, effect?: StoryEffect) => void;
  setActiveStory: (story: StoryNode, type: Exclude<StoryType, null>, specialEventId?: string | null) => void;
  clearActiveStory: () => void;
  markCharacterEventCompleted: (characterId: CharacterId, eventId: string) => void;
  checkSpecialEvents: () => void;
  checkDailyEncounters: () => void;
  checkEncounterMisses: () => void;
  markChattedThisWeek: (characterId: CharacterId) => void;
  resetWeeklyChatFlags: () => void;
  syncEncounterContext: (payload: { year: number; month?: number; week: number; location: string }) => void;
  onTimeAdvanced: () => void;
  resetGameStore: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  player: initialPlayerState,
  playerProfile: initialPlayerProfile,
  companyState: initialCompanyState,
  characters: initialCharacterState,
  characterUnlocks: {
    shen_mo: false,
    lu_xingran: false,
    liu_mengyao: false,
    su_tangtang: false,
    gu_chengyan: false,
    lin_yu: false,
    zhou_yan: false,
    jiang_muci: false,
    ji_mingxuan: false,
  },
  characterStatuses: {
    shen_mo: "locked",
    lu_xingran: "locked",
    liu_mengyao: "locked",
    su_tangtang: "locked",
    gu_chengyan: "locked",
    lin_yu: "locked",
    zhou_yan: "locked",
    jiang_muci: "locked",
    ji_mingxuan: "locked",
  },
  hasChattedThisWeek: {
    shen_mo: false,
    lu_xingran: false,
    liu_mengyao: false,
    su_tangtang: false,
    gu_chengyan: false,
    lin_yu: false,
    zhou_yan: false,
    jiang_muci: false,
    ji_mingxuan: false,
  },
  activeStory: null,
  storyType: null,
  activeSpecialEventId: null,
  activeEncounter: null,
  time: null,
  currentLocation: "",

  updatePlayer: (patch) => {
    set((state) => ({ player: { ...state.player, ...patch } }));
  },

  updateCompanyState: (patch) => {
    set((state) => ({ companyState: { ...state.companyState, ...patch } }));
  },

  acceptJob: (jobId) => {
    set((state) => ({ player: { ...state.player, currentJobId: jobId } }));
  },

  clearCurrentJob: () => {
    set((state) => ({ player: { ...state.player, currentJobId: null } }));
  },

  updatePlayerProfile: (patch) => {
    set((state) => ({ playerProfile: { ...state.playerProfile, ...patch } }));
  },

  updateCharacter: (characterId, patch) => {
    set((state) => {
      const current = state.characters[characterId];
      if (!current) return state;
      const merged: CharacterPsychology = {
        ...current,
        ...patch,
        keyEventTriggered: patch.keyEventTriggered ?? current.keyEventTriggered,
      };
      return {
        characters: {
          ...state.characters,
          [characterId]: normalizePsychology(merged),
        },
      };
    });
    get().checkSpecialEvents();
  },

  triggerCharacterKeyEvent: (characterId) => {
    set((state) => {
      const current = state.characters[characterId];
      if (!current) return state;
      return {
        characters: {
          ...state.characters,
          [characterId]: normalizePsychology({ ...current, keyEventTriggered: true }),
        },
      };
    });
    get().checkSpecialEvents();
  },

  unlockCharacter: (characterId) => {
    set((state) => ({
      characterUnlocks: {
        ...state.characterUnlocks,
        [characterId]: true,
      },
      characterStatuses: {
        ...state.characterStatuses,
        [characterId]: "unlocked",
      },
    }));
  },

  applyEffect: (characterId, effect) => {
    if (!effect) return;
    set((state) => {
      const current = state.characters[characterId];
      if (!current) return state;
      const merged = normalizePsychology({
        ...current,
        favor: current.favor + (effect.favor ?? 0),
      });
      return {
        characters: {
          ...state.characters,
          [characterId]: merged,
        },
        player: {
          ...state.player,
          fame: state.player.fame + (effect.popularity ?? 0),
          money: state.player.money + (effect.money ?? 0),
        },
      };
    });
    get().checkSpecialEvents();
  },

  setActiveStory: (story, type, specialEventId = null) => {
    set({
      activeStory: story,
      storyType: type,
      activeSpecialEventId: specialEventId,
      activeEncounter: type === "encounter" ? story.id : null,
    });
  },

  clearActiveStory: () => {
    set({
      activeStory: null,
      storyType: null,
      activeSpecialEventId: null,
      activeEncounter: null,
    });
  },

  markCharacterEventCompleted: (characterId, eventId) => {
    set((state) => {
      const current = state.characters[characterId];
      if (!current || current.completedEvents.includes(eventId)) return state;
      return {
        characters: {
          ...state.characters,
          [characterId]: {
            ...current,
            completedEvents: [...current.completedEvents, eventId],
          },
        },
      };
    });
  },

  checkSpecialEvents: () => {
    const state = get();
    if (state.activeStory) return;
    for (const config of SPECIAL_EVENT_CONFIG) {
      const charId = config.charId as CharacterId;
      const char = state.characters[charId];
      if (!char) continue;
      if (char.completedEvents.includes(config.id)) continue;
      const relationStage = normalizeRelation(stageToRelation[char.stage]);
      const requiredStage = normalizeRelation(config.stageRequired);
      if (requiredStage && relationStage !== requiredStage) continue;
      if (config.requiredPrevEvent && !char.completedEvents.includes(config.requiredPrevEvent)) continue;
      if (config.favorMin !== undefined && char.favor < config.favorMin) continue;
      if (config.favorMax !== undefined && char.favor > config.favorMax) continue;
      const story = getStoryById(config.storyId);
      if (!story) continue;
      set({
        activeStory: story,
        storyType: "special",
        activeSpecialEventId: config.id,
      });
      return;
    }
  },

  checkEncounterMisses: () => {
    const state = get();
    if (!state.time) return;

    const currentWeekOfYear = (state.time.month - 1) * LEGACY_WEEKS_PER_MONTH + getLegacyWeekFromDay(state.time.week);

    set((prev) => {
      const nextStatuses = { ...prev.characterStatuses };
      let changed = false;
      for (const config of ENCOUNTER_CONFIG) {
        const charId = config.charId as CharacterId;
        if (!config.isMissable) continue;
        if (nextStatuses[charId] !== "locked") continue;
        if (prev.characterUnlocks[charId]) continue;

        const windowEnded =
          state.time.year > config.timeRange.yearEnd ||
          (state.time.year === config.timeRange.yearEnd && currentWeekOfYear > config.timeRange.weekEnd);

        if (windowEnded) {
          nextStatuses[charId] = "missed";
          changed = true;
        }
      }
      return changed ? { characterStatuses: nextStatuses } : prev;
    });
  },

  checkDailyEncounters: () => {
    const currentDay = get().time?.week;
    const currentLegacyWeek = currentDay ? getLegacyWeekFromDay(currentDay) : undefined;
    console.log("🔍 [邂逅检查] 当前状态:", {
      year: get().time?.year,
      day: currentDay,
      legacyWeek: currentLegacyWeek,
      location: get().currentLocation,
      activeEncounter: get().activeEncounter,
    });

    const state = get();
    if (state.activeStory) return;
    if (!state.time || !state.currentLocation) return;
    get().checkEncounterMisses();
    const freshState = get();
    const currentWeekOfYear = (freshState.time!.month - 1) * LEGACY_WEEKS_PER_MONTH + getLegacyWeekFromDay(freshState.time!.week);

    for (const config of ENCOUNTER_CONFIG) {
      const charId = config.charId as CharacterId;
      if (freshState.characters[charId]?.completedEvents.includes(config.storyId)) continue;
      if (freshState.characterUnlocks[charId]) continue;
      if (freshState.characterStatuses[charId] === "missed") continue;

      if (config.requiredUnlockedCharacters?.length) {
        const allUnlocked = config.requiredUnlockedCharacters.every((id) => {
          const requiredId = id as CharacterId;
          return !!freshState.characterUnlocks[requiredId];
        });
        if (!allUnlocked) continue;
      }

      if (config.requiredCharacterFavor) {
        let favorPassed = true;
        for (const [id, minFavor] of Object.entries(config.requiredCharacterFavor)) {
          const requiredId = id as CharacterId;
          const currentFavor = freshState.characters[requiredId]?.favor ?? 0;
          if (currentFavor < minFavor) {
            favorPassed = false;
            break;
          }
        }
        if (!favorPassed) continue;
      }

      const matchedJob = !!config.requiredJobId && freshState.player.currentJobId === config.requiredJobId;
      if (config.requiredJobId && !matchedJob) continue;
      if (freshState.time.year < config.timeRange.yearStart || freshState.time.year > config.timeRange.yearEnd) continue;
      if (currentWeekOfYear < config.timeRange.weekStart || currentWeekOfYear > config.timeRange.weekEnd) continue;
      if (!matchedJob) {
        const allowedLocations = config.location.split("/").map((x) => x.trim()).filter(Boolean);
        if (!allowedLocations.includes(freshState.currentLocation)) continue;
      }
      if ((config.requiredFame ?? 0) > freshState.player.fame) continue;

      const story = getStoryById(config.storyId);
      if (!story) continue;

      set({
        activeStory: story,
        storyType: "encounter",
        activeEncounter: config.id,
        activeSpecialEventId: null,
      });
      return;
    }
  },

  markChattedThisWeek: (characterId) => {
    set((state) => ({
      hasChattedThisWeek: {
        ...state.hasChattedThisWeek,
        [characterId]: true,
      },
    }));
  },

  resetWeeklyChatFlags: () => {
    set({
      hasChattedThisWeek: {
        shen_mo: false,
        lu_xingran: false,
        liu_mengyao: false,
        su_tangtang: false,
        gu_chengyan: false,
        lin_yu: false,
        zhou_yan: false,
        jiang_muci: false,
        ji_mingxuan: false,
      },
    });
  },

  syncEncounterContext: ({ year, month, week, location }) => {
    set({
      time: { year, month: month ?? get().time?.month ?? 1, week },
      currentLocation: location,
    });
  },

  onTimeAdvanced: () => {
    get().checkEncounterMisses();
    get().checkDailyEncounters();
    get().checkSpecialEvents();
  },

  resetGameStore: () => {
    set({
      player: initialPlayerState,
      playerProfile: initialPlayerProfile,
      companyState: initialCompanyState,
      characters: initialCharacterState,
      characterUnlocks: {
        shen_mo: false,
        lu_xingran: false,
        liu_mengyao: false,
        su_tangtang: false,
        gu_chengyan: false,
        lin_yu: false,
        zhou_yan: false,
        jiang_muci: false,
        ji_mingxuan: false,
      },
      characterStatuses: {
        shen_mo: "locked",
        lu_xingran: "locked",
        liu_mengyao: "locked",
        su_tangtang: "locked",
        gu_chengyan: "locked",
        lin_yu: "locked",
        zhou_yan: "locked",
        jiang_muci: "locked",
        ji_mingxuan: "locked",
      },
      hasChattedThisWeek: {
        shen_mo: false,
        lu_xingran: false,
        liu_mengyao: false,
        su_tangtang: false,
        gu_chengyan: false,
        lin_yu: false,
        zhou_yan: false,
        jiang_muci: false,
        ji_mingxuan: false,
      },
      activeStory: null,
      storyType: null,
      activeSpecialEventId: null,
      activeEncounter: null,
      time: null,
      currentLocation: "",
    });
  },
}));

export const getCharacterIdFromStoryId = (storyId: string): CharacterId | null => inferCharacterIdFromStoryId(storyId);
