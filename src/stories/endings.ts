import type { EndingFavorMap, EndingFlags, EndingStatsSnapshot } from "../gameData";
import type { StoryNode } from "../types/story";

export type EndingType = "HE" | "BE" | "TE" | "Hidden" | "Harem";

export interface EndingConfig {
  id: string;
  characterId: string;
  type: EndingType;
  title: string;
  description: string;
  condition: (
    stats: EndingStatsSnapshot,
    favor: EndingFavorMap,
    flags: EndingFlags,
  ) => boolean;
}

const getNum = (
  source: Record<string, number | boolean | string | undefined>,
  ...keys: string[]
): number => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};

const hasChoice = (
  flags: EndingFlags,
  eventId: string,
  option: string,
): boolean => {
  const candidates = [
    eventId,
    `${eventId}_choice`,
    `${eventId}Choice`,
    `${eventId}_result`,
    `${eventId}Result`,
  ];
  return candidates.some((key) => String(flags[key] ?? "") === option);
};

const hasAnyChoice = (
  flags: EndingFlags,
  eventId: string,
  options: string[],
): boolean => options.some((opt) => hasChoice(flags, eventId, opt));

const isTrue = (
  flags: EndingFlags,
  ...keys: string[]
): boolean =>
  keys.some((key) => {
    const value = flags[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    return String(value ?? "").toLowerCase() === "true";
  });

const favorOf = (favor: EndingFavorMap, ...keys: string[]): number => {
  for (const key of keys) {
    const value = favor[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};

const coreCharacters = [
  "shen_mo",
  "lu_xingran",
  "liu_mengyao",
  "su_tangtang",
  "gu_chengyan",
  "lin_yu",
  "zhou_yan",
] as const;

export const ENDING_CONFIGS: EndingConfig[] = [
  {
    id: "shen_mo_he_guardian",
    characterId: "shen_mo",
    type: "HE",
    title: "清醒的守护者",
    description:
      "你和沈默并肩走在灯下。他终于不再假装佛系，而是坦率承认：愿意把清醒与锋芒都用来守护你。你们彼此独立，却始终同频。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "shen_mo", "shenmo") >= 90 &&
      getNum(stats, "sincerity", "真心值") >= 70 &&
      hasChoice(flags, "shenmo_event4", "A") &&
      hasChoice(flags, "shenmo_event3", "B") &&
      hasChoice(flags, "shenmo_event2", "B") &&
      hasAnyChoice(flags, "shenmo_event1", ["B", "C"]),
  },
  {
    id: "shen_mo_be_missed",
    characterId: "shen_mo",
    type: "BE",
    title: "擦肩而过",
    description:
      "你们都曾靠近，却在最关键的路口错开。沈默依旧温和、依旧周全，只是再也没有把那份真正的心意说出口。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "shen_mo", "shenmo") >= 70 && hasChoice(flags, "shenmo_event4", "C")) ||
      !isTrue(flags, "shenmo_event3_triggered", "shenmo_event3"),
  },
  {
    id: "shen_mo_te_partner",
    characterId: "shen_mo",
    type: "TE",
    title: "并肩的清醒者",
    description:
      "你们把情感放进更长的战线上：他守住创作底线，你冲向事业高点。没有告白式圆满，却是最稳固的并肩关系。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "shen_mo", "shenmo") >= 80 &&
      getNum(stats, "career", "事业值", "fame") >= 90 &&
      hasChoice(flags, "shenmo_event4", "B"),
  },
  {
    id: "shen_mo_hidden_rival",
    characterId: "shen_mo",
    type: "Hidden",
    title: "棋逢对手",
    description:
      "他看见你在博弈中同样清醒锋利，终于把你视作能并肩下棋的人。你们不再是守护与被守护，而是彼此最危险也最默契的同盟。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "shen_mo", "shenmo") >= 95 &&
      getNum(stats, "scheme", "心机") >= 70 &&
      isTrue(flags, "shenmo_hidden_clue", "shenmo_hidden_clue_found"),
  },
  {
    id: "lu_xingran_he_sunlight",
    characterId: "lu_xingran",
    type: "HE",
    title: "阳光下的病娇",
    description:
      "陆星燃终于学会把离不开你的恐惧说成我愿意和你一起变好。你牵着他的手，走出舞台最亮的位置，也走出他最黑的阴影。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "lu_xingran", "luxingran") >= 95 &&
      hasChoice(flags, "luxingran_event4", "A") &&
      hasChoice(flags, "luxingran_event3", "B") &&
      hasAnyChoice(flags, "luxingran_event2", ["A", "B"]) &&
      isTrue(flags, "luxingran_treated", "luxingran_psych_help"),
  },
  {
    id: "lu_xingran_be_broken",
    characterId: "lu_xingran",
    type: "BE",
    title: "破碎的阳光",
    description:
      "笑容还在，光却散了。他把所有不安都收回心底，最终只剩下不被回应的执念，在夜里一点点崩塌。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "lu_xingran", "luxingran") >= 70 && hasAnyChoice(flags, "luxingran_event4", ["B", "C"])) ||
      hasChoice(flags, "luxingran_event3", "C"),
  },
  {
    id: "lu_xingran_te_peak",
    characterId: "lu_xingran",
    type: "TE",
    title: "顶峰的陪伴",
    description:
      "你们没有立刻给出爱情答案，却在聚光灯最刺眼的地方互相托举。舞台是你们共同的战场，也是最默契的停靠点。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "lu_xingran", "luxingran") >= 85 &&
      getNum(stats, "career", "事业值", "fame") >= 80 &&
      hasChoice(flags, "luxingran_event4", "C"),
  },
  {
    id: "lu_xingran_hidden_accomplice",
    characterId: "lu_xingran",
    type: "Hidden",
    title: "共犯",
    description:
      "你没有纠正他的偏执，反而走进他的逻辑。你们像两枚互相咬合的齿轮，在失控边缘维持着危险而甜蜜的平衡。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "lu_xingran", "luxingran") >= 90 &&
      getNum(stats, "possessiveness", "占有欲值") >= 80 &&
      hasChoice(flags, "luxingran_event4", "A") &&
      !isTrue(flags, "luxingran_treated", "luxingran_psych_help"),
  },
  {
    id: "liu_mengyao_he_armor",
    characterId: "liu_mengyao",
    type: "HE",
    title: "彼此的铠甲（百合）",
    description:
      "她不再只做你的盾，你也成了她敢卸下锋芒的归处。黑夜里的风暴仍在，但你们学会并肩站在同一把伞下。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "liu_mengyao", "liumengyao") >= 95 &&
      hasChoice(flags, "liumengyao_event4", "A") &&
      hasChoice(flags, "liumengyao_event3", "C") &&
      hasChoice(flags, "liumengyao_event2", "A") &&
      hasChoice(flags, "liumengyao_event1", "B"),
  },
  {
    id: "liu_mengyao_be_lone",
    characterId: "liu_mengyao",
    type: "BE",
    title: "孤独的铠甲",
    description:
      "她仍然强大、仍然狠厉，却只剩一个人把伤口藏进西装袖口。你们都明白，最晚说出口的那句别怕，最终没有回音。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "liu_mengyao", "liumengyao") >= 70 && hasChoice(flags, "liumengyao_event4", "C")) ||
      hasChoice(flags, "liumengyao_event2", "C"),
  },
  {
    id: "liu_mengyao_te_partner",
    characterId: "liu_mengyao",
    type: "TE",
    title: "最佳拍档",
    description:
      "你们把情感压进工作默契里，一个在前台发光，一个在后台控场。不是爱意最盛的答案，却是最牢不可破的组合。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "liu_mengyao", "liumengyao") >= 85 &&
      getNum(stats, "career", "事业值", "fame") >= 90 &&
      hasChoice(flags, "liumengyao_event4", "B"),
  },
  {
    id: "liu_mengyao_hidden_daughter",
    characterId: "liu_mengyao",
    type: "Hidden",
    title: "她的女儿",
    description:
      "她在你身上看见了曾经想守住却没守住的人，也看见了被修复的自己。从此经纪人与艺人之外，多了一层更深的牵挂。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "liu_mengyao", "liumengyao") >= 90 &&
      getNum(stats, "sincerity", "真心值") >= 80 &&
      getNum(stats, "age", "玩家年龄") <= 25,
  },
  {
    id: "su_tangtang_he_revenge",
    characterId: "su_tangtang",
    type: "HE",
    title: "甜妹的复仇（百合）",
    description:
      "糖分外壳终于不必再伪装。她牵着你的手，把失去姐姐的痛和对你的依赖都化成向前的勇气，与你并肩收回被夺走的答案。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "su_tangtang", "sutangtang") >= 95 &&
      hasChoice(flags, "sutangtang_event4", "A") &&
      hasChoice(flags, "sutangtang_event3", "A") &&
      hasChoice(flags, "sutangtang_event2", "C") &&
      hasAnyChoice(flags, "sutangtang_event1", ["A", "B"]),
  },
  {
    id: "su_tangtang_be_mask",
    characterId: "su_tangtang",
    type: "BE",
    title: "永远的伪装",
    description:
      "她仍会在镜头前甜甜地笑，却把真正的脆弱锁在深夜。你没能走进那扇门，她也再没把别丢下我说给你听。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "su_tangtang", "sutangtang") >= 70 && hasChoice(flags, "sutangtang_event4", "C")) ||
      hasChoice(flags, "sutangtang_event3", "C"),
  },
  {
    id: "su_tangtang_te_success",
    characterId: "su_tangtang",
    type: "TE",
    title: "隐忍的成功",
    description:
      "你们选择先赢下现实，再谈心事。她把眼泪藏进旋律，你把锋芒藏进舞台，终在喧嚣里守住彼此的默契。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "su_tangtang", "sutangtang") >= 85 &&
      hasChoice(flags, "sutangtang_event4", "B"),
  },
  {
    id: "su_tangtang_hidden_hunter",
    characterId: "su_tangtang",
    type: "Hidden",
    title: "猎手与猎人",
    description:
      "她不再只做被保护的一方。你们在真相边缘互相试探、互相接住，最后谁也没退后，成了彼此唯一看得懂的人。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "su_tangtang", "sutangtang") >= 90 &&
      getNum(stats, "scheme", "心机") >= 60 &&
      isTrue(flags, "sutangtang_event4_player_led", "sutangtang_event4_lead_by_player"),
  },
  {
    id: "gu_chengyan_he_sincere",
    characterId: "gu_chengyan",
    type: "HE",
    title: "漫画里的真心",
    description:
      "他终于把交易放下，把在意说清。你让这位擅长算计的掌局者第一次承认：比赢更重要的，是不再失去你。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "gu_chengyan", "guchengyan") >= 95 &&
      hasChoice(flags, "guchengyan_event4", "A") &&
      hasChoice(flags, "guchengyan_event3", "A") &&
      hasChoice(flags, "guchengyan_event2", "A") &&
      hasChoice(flags, "guchengyan_event1", "B"),
  },
  {
    id: "gu_chengyan_be_tradeoff",
    characterId: "gu_chengyan",
    type: "BE",
    title: "交易的代价",
    description:
      "你们都擅长谈判，却在真心面前彼此试错。最后留下的只有一份体面的合同，和一场没来得及说破的告别。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "gu_chengyan", "guchengyan") >= 70 && hasChoice(flags, "guchengyan_event4", "C")) ||
      hasChoice(flags, "guchengyan_event2", "C"),
  },
  {
    id: "gu_chengyan_te_business",
    characterId: "gu_chengyan",
    type: "TE",
    title: "商业伙伴",
    description:
      "你们在同一张桌上并肩布局，彼此都知道再往前一步会是什么，却默契地把答案留给未来。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "gu_chengyan", "guchengyan") >= 85 &&
      getNum(stats, "career", "事业值", "fame") >= 95 &&
      hasChoice(flags, "guchengyan_event4", "B"),
  },
  {
    id: "gu_chengyan_hidden_empress",
    characterId: "gu_chengyan",
    type: "Hidden",
    title: "二次元新娘",
    description:
      "你在他最擅长的现实规则之外，给了他一个荒诞却认真的浪漫答案。顾承宴第一次甘愿输给喜欢这件事本身。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "gu_chengyan", "guchengyan") >= 90 &&
      isTrue(flags, "player_cos_hancock", "cos_hancock_done") &&
      getNum(flags as Record<string, number | boolean | string | undefined>, "comic_knowledge", "漫画理解度") >= 70,
  },
  {
    id: "lin_yu_he_guard",
    characterId: "lin_yu",
    type: "HE",
    title: "青梅的守护",
    description:
      "他学会把控制换成陪伴，你也不再把他的在意当作负担。旧伤还在，但你们终于站在同一侧，慢慢把日子过稳。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "lin_yu", "linyu") >= 95 &&
      hasChoice(flags, "linyu_event4", "A") &&
      hasChoice(flags, "linyu_event3", "A") &&
      hasChoice(flags, "linyu_event2", "A") &&
      hasChoice(flags, "linyu_event1", "A"),
  },
  {
    id: "lin_yu_be_isolation",
    characterId: "lin_yu",
    type: "BE",
    title: "偏执的孤独",
    description:
      "他依旧温柔，也依旧偏执。你们在一次次误解里走散，最后只剩他在医院长廊尽头，把别离开我说给空气听。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "lin_yu", "linyu") >= 70 && hasChoice(flags, "linyu_event4", "C")) || hasChoice(flags, "linyu_event3", "C"),
  },
  {
    id: "lin_yu_te_waiting",
    characterId: "lin_yu",
    type: "TE",
    title: "永远的等待",
    description:
      "你奔向更大的舞台，他留在原地做最稳定的灯。没有占有，没有誓言，却始终给彼此留着回家的门。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "lin_yu", "linyu") >= 85 &&
      getNum(stats, "career", "事业值", "fame") >= 90 &&
      hasChoice(flags, "linyu_event4", "B"),
  },
  {
    id: "lin_yu_hidden_symbiosis",
    characterId: "lin_yu",
    type: "Hidden",
    title: "共生",
    description:
      "你接住了他的全部，包括脆弱和偏执。他也学会把你放在自由里去爱，从怕失去走到敢并肩。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "lin_yu", "linyu") >= 90 &&
      getNum(stats, "sincerity", "真心值") >= 80 &&
      isTrue(flags, "accept_linyu_all", "linyu_full_accept"),
  },
  {
    id: "zhou_yan_he_soft",
    characterId: "zhou_yan",
    type: "HE",
    title: "嘴硬的温柔",
    description:
      "他还是会拽拽地说就这，却会在你掉线时第一时间回头。你们在赛场与聚光灯之间，把喜欢练成了默契。",
    condition: (_stats, favor, flags) =>
      favorOf(favor, "zhou_yan", "zhouyan") >= 95 &&
      hasChoice(flags, "zhouyan_event4", "A") &&
      hasChoice(flags, "zhouyan_event3", "B") &&
      hasChoice(flags, "zhouyan_event2", "C") &&
      hasChoice(flags, "zhouyan_event1", "B"),
  },
  {
    id: "zhou_yan_be_extinguished",
    characterId: "zhou_yan",
    type: "BE",
    title: "野火熄灭",
    description:
      "他把没事说得太久，久到连自己都信了。你们在一次次错频里退场，最后只剩下没发出去的邀请链接。",
    condition: (_stats, favor, flags) =>
      (favorOf(favor, "zhou_yan", "zhouyan") >= 70 && hasChoice(flags, "zhouyan_event4", "C")) || hasChoice(flags, "zhouyan_event3", "C"),
  },
  {
    id: "zhou_yan_te_dual",
    characterId: "zhou_yan",
    type: "TE",
    title: "双圈神话",
    description:
      "你们把感情先放在以后，把当下交给赛场与舞台。电竞和娱乐双线并进，彼此是最硬核的后盾。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "zhou_yan", "zhouyan") >= 85 &&
      (getNum(stats, "esports_investment", "投资电竞圈", "esports") >= 1 || isTrue(flags, "invested_esports", "esports_invested")) &&
      hasChoice(flags, "zhouyan_event4", "B"),
  },
  {
    id: "zhou_yan_hidden_game_life",
    characterId: "zhou_yan",
    type: "Hidden",
    title: "游戏人生",
    description:
      "你们在双排里把彼此打进最高段位，也把心事打成了日常。赢的是分，守住的是随时上线我都在。",
    condition: (stats, favor, flags) =>
      favorOf(favor, "zhou_yan", "zhouyan") >= 90 &&
      getNum(stats, "rank", "段位分", "rankScore") >= 100 &&
      getNum(flags as Record<string, number | boolean | string | undefined>, "duo_queue_count", "经常双排次数") >= 10,
  },
  {
    id: "all_routes_harem_star",
    characterId: "all",
    type: "Harem",
    title: "众星捧月",
    description:
      "你成为所有人的锚点，却不被任何人占有。每一段危险关系都被你稳住，每一份深情都被妥帖安放。不是后宫，而是你们共同活下来的答案。",
    condition: (stats, favor, flags) => {
      const allFavorPass = coreCharacters.every((id) => favorOf(favor, id) >= 90);
      if (!allFavorPass) return false;

      const noExclusive = !isTrue(flags, "exclusive_relationship", "locked_romance", "single_route_committed");
      if (!noExclusive) return false;

      const noBeCollapsed = !isTrue(
        flags,
        "shen_mo_be_triggered",
        "lu_xingran_be_triggered",
        "liu_mengyao_be_triggered",
        "su_tangtang_be_triggered",
        "gu_chengyan_be_triggered",
        "lin_yu_be_triggered",
        "zhou_yan_be_triggered",
      );
      if (!noBeCollapsed) return false;

      const luDanger = getNum(stats, "lu_xingran_possessiveness", "luxingran_possessiveness");
      const linDanger = getNum(stats, "lin_yu_paranoia", "linyu_paranoia");
      const guDanger = getNum(stats, "gu_chengyan_control", "guchengyan_control");
      const liuDirtyHands = getNum(flags as Record<string, number | boolean | string | undefined>, "liumengyao_dirty_hands_count", "liumengyao_dark_actions");

      return luDanger < 85 && linDanger < 85 && guDanger < 75 && liuDirtyHands <= 3;
    },
  },
];

const endingToStoryNode = (ending: EndingConfig): StoryNode => ({
  id: ending.id,
  scene: ending.title,
  lines: [{ speaker: "旁白", text: ending.description }],
  options: [{ text: "收下这个结局", followUp: { lines: [] } }],
});

export const endingStories: Record<string, StoryNode> = ENDING_CONFIGS.reduce(
  (acc, ending) => {
    acc[ending.id] = endingToStoryNode(ending);
    return acc;
  },
  {} as Record<string, StoryNode>,
);

// 兼容旧ID
endingStories.shen_mo_ending = endingStories.shen_mo_he_guardian;
endingStories.lu_xingran_ending = endingStories.lu_xingran_he_sunlight;
endingStories.liu_mengyao_ending = endingStories.liu_mengyao_he_armor;
endingStories.su_tangtang_ending = endingStories.su_tangtang_he_revenge;
endingStories.gu_chengyan_ending = endingStories.gu_chengyan_he_sincere;
endingStories.lin_yu_ending = endingStories.lin_yu_he_guard;
endingStories.zhou_yan_ending = endingStories.zhou_yan_he_soft;

