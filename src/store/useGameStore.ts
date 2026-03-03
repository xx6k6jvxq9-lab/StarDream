import { create } from 'zustand';

const METRIC_MIN = 0;
const METRIC_MAX = 100;
const FAVOR_PRE_EVENT_CAP = 80;

const clamp = (value: number, min = METRIC_MIN, max = METRIC_MAX): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

export type PlayerState = {
  fame: number;
  sincerity: number;
  scheme: number;
  selfControl: boolean;
  finalSacrifice: boolean;
};

export type CharacterId =
  | 'shen_mo'
  | 'lu_xingran'
  | 'liu_mengyao'
  | 'su_tangtang'
  | 'gu_chengyan'
  | 'lin_yu'
  | 'zhou_yan'
  | 'jiang_muci'
  | 'ji_mingxuan';

export type PsychologyStage = 'guarded' | 'warming' | 'dependent' | 'obsessive' | 'fractured';

export type CharacterPsychology = {
  favor: number;
  paranoia: number;
  possessiveness: number;
  insecurity: number;
  trust: number;
  keyEventTriggered: boolean;
  favorLocked: boolean;
  stage: PsychologyStage;
};

export type CharacterUpdate = Partial<
  Pick<CharacterPsychology, 'favor' | 'paranoia' | 'possessiveness' | 'insecurity' | 'trust' | 'keyEventTriggered'>
>;

const deriveStage = (metrics: Pick<CharacterPsychology, 'favor' | 'paranoia' | 'possessiveness' | 'insecurity' | 'trust'>): PsychologyStage => {
  const { favor, paranoia, possessiveness, insecurity, trust } = metrics;

  if ((paranoia >= 75 || possessiveness >= 80) && favor >= 60) {
    return 'obsessive';
  }

  if (insecurity >= 70 && trust <= 30) {
    return 'fractured';
  }

  if (favor >= 70 && trust >= 60 && insecurity <= 45) {
    return 'dependent';
  }

  if (favor >= 40 || trust >= 40) {
    return 'warming';
  }

  return 'guarded';
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
  };
};

const makeCharacter = (seed: Pick<CharacterPsychology, 'favor' | 'paranoia' | 'possessiveness' | 'insecurity' | 'trust'>): CharacterPsychology => {
  return normalizePsychology({
    ...seed,
    keyEventTriggered: false,
    favorLocked: false,
    stage: 'guarded',
  });
};

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  shen_mo: '沈默',
  lu_xingran: '陆星燃',
  liu_mengyao: '柳梦瑶',
  su_tangtang: '苏糖糖',
  gu_chengyan: '顾承宴',
  lin_yu: '林屿',
  zhou_yan: '周焰',
  jiang_muci: '江暮辞',
  ji_mingxuan: '季明轩',
};

const initialPlayerState: PlayerState = {
  fame: 0,
  sincerity: 0,
  scheme: 0,
  selfControl: false,
  finalSacrifice: false,
};

const initialCharacterState: Record<CharacterId, CharacterPsychology> = {
  shen_mo: makeCharacter({ favor: 20, paranoia: 30, possessiveness: 25, insecurity: 40, trust: 35 }),
  lu_xingran: makeCharacter({ favor: 28, paranoia: 22, possessiveness: 35, insecurity: 33, trust: 42 }),
  liu_mengyao: makeCharacter({ favor: 18, paranoia: 48, possessiveness: 41, insecurity: 52, trust: 24 }),
  su_tangtang: makeCharacter({ favor: 34, paranoia: 16, possessiveness: 20, insecurity: 26, trust: 46 }),
  gu_chengyan: makeCharacter({ favor: 16, paranoia: 52, possessiveness: 50, insecurity: 47, trust: 22 }),
  lin_yu: makeCharacter({ favor: 24, paranoia: 36, possessiveness: 34, insecurity: 42, trust: 31 }),
  zhou_yan: makeCharacter({ favor: 22, paranoia: 40, possessiveness: 44, insecurity: 39, trust: 28 }),
  jiang_muci: makeCharacter({ favor: 26, paranoia: 18, possessiveness: 30, insecurity: 28, trust: 62 }),
  ji_mingxuan: makeCharacter({ favor: 19, paranoia: 66, possessiveness: 26, insecurity: 46, trust: 27 }),
};

type GameStore = {
  player: PlayerState;
  characters: Record<CharacterId, CharacterPsychology>;
  characterUnlocks: Record<CharacterId, boolean>;
  updatePlayer: (patch: Partial<PlayerState>) => void;
  updateCharacter: (characterId: CharacterId, patch: CharacterUpdate) => void;
  triggerCharacterKeyEvent: (characterId: CharacterId) => void;
  unlockCharacter: (characterId: CharacterId) => void;
  resetGameStore: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  player: initialPlayerState,
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

  updatePlayer: (patch) => {
    set((state) => ({
      player: {
        ...state.player,
        ...patch,
      },
    }));
  },

  updateCharacter: (characterId, patch) => {
    set((state) => {
      const current = state.characters[characterId];
      if (!current) {
        return state;
      }

      const merged: CharacterPsychology = {
        ...current,
        ...patch,
        keyEventTriggered: patch.keyEventTriggered ?? current.keyEventTriggered,
      };

      const normalized = normalizePsychology(merged);

      return {
        characters: {
          ...state.characters,
          [characterId]: normalized,
        },
      };
    });
  },

  triggerCharacterKeyEvent: (characterId) => {
    set((state) => {
      const current = state.characters[characterId];
      if (!current) {
        return state;
      }

      return {
        characters: {
          ...state.characters,
          [characterId]: normalizePsychology({
            ...current,
            keyEventTriggered: true,
          }),
        },
      };
    });
  },

  unlockCharacter: (characterId) => {
    set((state) => ({
      characterUnlocks: {
        ...state.characterUnlocks,
        [characterId]: true,
      },
    }));
  },

  resetGameStore: () => {
    set({
      player: initialPlayerState,
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
    });
  },
}));
