import { GoogleGenAI } from "@google/genai";
import type { Stats } from "../gameData";
import {
  getRandomElement,
  INDUSTRY_EVENTS,
  JOB_EVALUATIONS,
  NPC_POSTS_LIBRARY,
  SCRIPT_READING_TEXTS,
  STATIC_NPCS,
} from "../gameData/staticLibrary";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type LlmProvider = "gemini" | "openai" | "openai_compatible" | "deepseek";
type AiFeature = "character_chat" | "encounter_custom_chat";
type CharacterChatDebugInfo = {
  feature: AiFeature;
  provider: LlmProvider;
  model: string;
  baseUrl: string;
  requestUrl: string;
  apiKeyMasked: string;
};
type CharacterChatResult = {
  ok: boolean;
  reply: string;
  error?: string;
  debug: CharacterChatDebugInfo;
};

const AI_ALLOWED_FEATURES = new Set<AiFeature>(["character_chat", "encounter_custom_chat"]);

const RELATION_STAGE_RULES = [
  {
    key: "stranger",
    label: "陌生 / 初识",
    min: 0,
    max: 9,
    allowedAddressing: "仅允许使用你、名字、较克制的称呼，不允许亲昵称呼。",
    tone: "礼貌、疏离、克制、观察感强，可以简短，不主动贴近。",
    allowCare: false,
    allowJealousy: false,
    allowAmbiguity: false,
    allowLoverTone: false,
    forbidden:
      "禁止宝宝、宝贝、亲爱的、乖、想你、离不开你、谁碰你我就、护着你一辈子、明显吃醋、占有欲、恋人式安抚、强承诺。",
  },
  {
    key: "familiar",
    label: "逐渐熟悉",
    min: 10,
    max: 29,
    allowedAddressing: "可偶尔直呼名字或较自然称呼，但仍不亲昵。",
    tone: "开始松动，能表现轻微关心和试探，但仍有边界感。",
    allowCare: true,
    allowJealousy: false,
    allowAmbiguity: false,
    allowLoverTone: false,
    forbidden: "禁止恋人式称呼、明显占有欲、强烈护短、露骨暧昧。",
  },
  {
    key: "close",
    label: "亲近",
    min: 30,
    max: 59,
    allowedAddressing: "可出现更自然的熟人称呼，允许温和关心。",
    tone: "熟悉、稳定，能表达偏心和照顾，但依旧不能像恋人。",
    allowCare: true,
    allowJealousy: true,
    allowAmbiguity: true,
    allowLoverTone: false,
    forbidden: "禁止直接恋人化表达、过火占有欲、过激承诺。",
  },
  {
    key: "ambiguous",
    label: "暧昧 / 强烈偏好",
    min: 60,
    max: 89,
    allowedAddressing: "允许更亲密的语气，但仍要符合角色个性。",
    tone: "偏爱、主动、带有暧昧与情绪重量。",
    allowCare: true,
    allowJealousy: true,
    allowAmbiguity: true,
    allowLoverTone: true,
    forbidden: "禁止无条件病态占有、极端威胁、脱离情境的恋爱誓言。",
  },
  {
    key: "bonded",
    label: "高亲密 / 深度绑定",
    min: 90,
    max: 999,
    allowedAddressing: "可使用明确亲密称呼，允许深层情感表达。",
    tone: "高亲密、高依赖、高情感浓度，但仍要符合角色设定。",
    allowCare: true,
    allowJealousy: true,
    allowAmbiguity: true,
    allowLoverTone: true,
    forbidden: "禁止脱离角色设定的一味油腻模板化情话。",
  },
] as const;

const LOW_STAGE_BANNED_PATTERNS = [
  /宝宝|宝贝|亲爱的|乖乖|老婆|老公|媳妇|爱你|想你|离不开你|非你不可/i,
  /谁碰你我就|我撕了谁|我弄死|我不会放过|别离开我|只能看我|只能属于我/i,
  /抱紧你|亲了亲|吻|睡我这|陪你一辈子|我养你|命都给你/i,
  /在呢[,，]\s*(宝宝|宝贝|亲爱的|乖)/i,
  /你只管.*我来处理/i,
  /有我在.*不用怕/i,
];

const MID_STAGE_BANNED_PATTERNS = [
  /宝宝|宝贝|亲爱的|老婆|老公|媳妇/i,
  /谁碰你我就|只能属于我|离不开你/i,
  /脏事我来处理|我替你收拾|谁也别碰你/i,
];

const readEnv = (key: string): string => {
  const env = import.meta.env as Record<string, string | undefined>;
  return String(env[key] ?? "").trim();
};

const getProvider = (): LlmProvider => {
  const raw = readEnv("VITE_LLM_PROVIDER").toLowerCase();
  if (raw === "openai" || raw === "openai_compatible" || raw === "deepseek") return raw;
  return "gemini";
};

const getGeminiApiKey = () => readEnv("VITE_GEMINI_API_KEY") || readEnv("VITE_LLM_API_KEY");
const getGeminiModel = () => readEnv("VITE_GEMINI_MODEL") || readEnv("VITE_LLM_MODEL") || "gemini-2.0-flash";

const getOpenAIApiKey = () => readEnv("VITE_OPENAI_API_KEY") || readEnv("VITE_LLM_API_KEY");
const getOpenAIModel = () => readEnv("VITE_OPENAI_MODEL") || readEnv("VITE_LLM_MODEL") || "gpt-4o-mini";
const getOpenAIBaseUrl = () => readEnv("VITE_OPENAI_BASE_URL") || readEnv("VITE_LLM_BASE_URL") || "https://api.openai.com";

const getDeepSeekApiKey = () => readEnv("VITE_DEEPSEEK_API_KEY") || readEnv("VITE_LLM_API_KEY");
const getDeepSeekModel = () => readEnv("VITE_DEEPSEEK_MODEL") || readEnv("VITE_LLM_MODEL") || "deepseek-chat";
const getDeepSeekBaseUrl = () => readEnv("VITE_DEEPSEEK_BASE_URL") || readEnv("VITE_LLM_BASE_URL") || "https://api.deepseek.com";

const stripMarkdownJsonFence = (text: string): string => {
  const cleaned = text.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : cleaned;
};

const buildOpenAIUrl = (baseUrl: string): string => {
  const normalized = (baseUrl || "https://api.openai.com").replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(normalized)) return normalized;
  if (/\/v\d+$/i.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
};

const maskSecret = (value: string): string => {
  if (!value) return "(empty)";
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-1)}`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const redactBaseUrl = (value: string): string => value || "(empty)";

const logAiFeature = (feature: AiFeature, message: string, payload?: unknown) => {
  const prefix = `[AI:${feature}]`;
  if (payload === undefined) {
    console.info(`${prefix} ${message}`);
    return;
  }
  console.info(`${prefix} ${message}`, payload);
};

const classifyRequestError = (error: unknown): string => {
  const text = error instanceof Error ? error.message : String(error || "未知错误");
  if (/Missing .*API key/i.test(text)) return "未配置 API Key";
  if (/Missing .*Base URL/i.test(text)) return "未配置 Base URL";
  if (/provider/i.test(text) && /invalid|unsupported|unknown/i.test(text)) return "provider 配置错误";
  if (/Failed to fetch/i.test(text)) return "网络错误或 CORS 拦截";
  if (/abort|timeout/i.test(text)) return "请求超时";
  if (/empty response/i.test(text)) return "空响应";
  if (/parse|json/i.test(text)) return "返回格式解析失败";
  if (/404/i.test(text)) return "请求路径错误";
  return text;
};

const assertFeatureAllowed = (feature: AiFeature) => {
  if (!AI_ALLOWED_FEATURES.has(feature)) {
    throw new Error(`AI feature not allowed: ${feature}`);
  }
};

const getFavorRelationStage = (favor: number) =>
  RELATION_STAGE_RULES.find((rule) => favor >= rule.min && favor <= rule.max) ?? RELATION_STAGE_RULES[0];

const buildPromptDebugPayload = (feature: AiFeature, debug: CharacterChatDebugInfo) => ({
  provider: debug.provider,
  model: debug.model,
  baseUrl: debug.baseUrl,
  requestUrl: debug.requestUrl,
  apiKeyMasked: debug.apiKeyMasked,
  feature,
});

const buildCharacterConstraintPrompt = (params: {
  characterName: string;
  bio: string;
  surface?: string;
  reversal?: string;
  tags: string[];
  coreQuotes: string[];
  favor: number;
  stage: string;
  psychStage?: string;
  sceneContext?: string;
  history?: Array<{ role: "player" | "character"; text: string }>;
  userInput: string;
  feature: AiFeature;
}) => {
  const relationRule = getFavorRelationStage(params.favor);
  const historyText = (params.history ?? [])
    .slice(-8)
    .map((m) => `${m.role === "player" ? "玩家" : params.characterName}：${m.text}`)
    .join("\n");

  const systemPrompt = `你正在扮演娱乐圈经营游戏中的固定角色「${params.characterName}」。
你必须严格遵守角色设定、当前好感度和关系阶段，绝不能越级亲密。

角色核心设定：
- 对外人设：${params.surface || params.bio || "暂无"}
- 深层设定：${params.reversal || "暂无"}
- 关键词：${params.tags.join("、") || "无"}
- 角色代表台词：
${params.coreQuotes.slice(0, 4).map((q, i) => `${i + 1}. ${q}`).join("\n") || "无"}

当前关系约束：
- 当前好感度：${params.favor}
- 当前关系阶段：${relationRule.label}
- 当前心理阶段：${params.psychStage || params.stage || "guarded"}
- 当前剧情关系标签：${params.stage}
- 允许称呼：${relationRule.allowedAddressing}
- 语气要求：${relationRule.tone}
- 是否允许主动关心：${relationRule.allowCare ? "允许，但要克制并符合角色" : "不允许主动贴近式关心"}
- 是否允许吃醋/占有欲：${relationRule.allowJealousy ? "允许轻微体现，但必须符合阶段" : "不允许"}
- 是否允许明显暧昧：${relationRule.allowAmbiguity ? "可轻微出现" : "不允许"}
- 是否允许恋人式表达：${relationRule.allowLoverTone ? "谨慎允许" : "绝对不允许"}
- 当前阶段禁止项：${relationRule.forbidden}

硬性规则：
1. 低好感度阶段绝不允许使用宝宝、宝贝、亲爱的等亲昵称呼。
2. 低好感度阶段绝不允许明显占有欲、护短过头、恋爱口吻、病娇威胁。
3. 好感度 0~9 时，只能是初识关系下的克制回应：礼貌、审慎、带观察感，可以简短，但不能像已经深度信任或恋爱。
4. 好感度 0~9 时，不允许“替你处理一切”“明显护短”“吃醋”“占有”“强承诺”“越界安抚”。
5. 你必须保留角色个人气质和说话习惯，但不能借“人设偏执/保护欲”之名越过当前阶段。
6. 回复必须保留角色差异，不能像通用恋爱模板。
7. 回复长度控制在 18-90 字。
8. 只输出角色回复本身，不要解释设定，不要加括号说明，不要旁白，不要额外添加舞台说明。

阶段校准示例：
- 若当前阶段是「陌生 / 初识」，允许：克制回应、简短询问、礼貌提醒、轻微试探。
- 若当前阶段是「陌生 / 初识」，禁止：亲昵称呼、恋人式哄劝、强保护宣言、占有欲、替玩家处理所有事的承诺。
- 即使角色天生强势、病娇、保护欲重，也只能以“克制压着情绪”的方式表达，不能直接说高亲密台词。`;

  const userPrompt = `当前场景：${params.sceneContext || "普通聊天"}

最近上下文：
${historyText || "（无历史对话）"}

玩家输入：
${params.userInput}

请基于上面的角色设定和关系阶段，给出一条绝不越级亲密、但符合该角色个性的回复。
优先保证：
1. 不越级
2. 符合角色
3. 符合当前剧情场景
4. 语言自然，不像模板。`;

  return { systemPrompt, userPrompt, relationRule };
};

const buildStageSafeFallbackReply = (params: {
  characterName: string;
  surface?: string;
  reversal?: string;
  tags: string[];
  favor: number;
  userInput: string;
}) => {
  const stage = getFavorRelationStage(params.favor);
  const persona = [params.surface, params.reversal, params.tags.join("、")].filter(Boolean).join("、");
  if (stage.key === "stranger") {
    if (/辛苦|累|难受|不舒服|生病/.test(params.userInput)) {
      if (/医生|理性|清冷|克制/.test(persona)) {
        return `${params.characterName}抬眼看了你片刻，语气克制：“先把身体顾好，别逞强。”`;
      }
      if (/强势|经纪|掌控|冷厉/.test(persona)) {
        return `${params.characterName}没有多问，只淡淡补了一句：“不舒服就先去休息，别硬撑。”`;
      }
      return `${params.characterName}停顿了一下，语气依旧克制：“先把自己照顾好，别硬撑。”`;
    }
    if (/医生|理性|清冷|克制/.test(persona)) {
      return `${params.characterName}神色平静，声音压得很稳：“我在听。你先把情况说清楚。”`;
    }
    if (/强势|经纪|掌控|冷厉/.test(persona)) {
      return `${params.characterName}目光停在你身上片刻，语气利落却克制：“我知道了，你先把来龙去脉说明白。”`;
    }
    if (/忠犬|保镖|笨拙|守护/.test(persona)) {
      return `${params.characterName}像是想靠近，又生生停住，只低声道：“你说，我听着。”`;
    }
    return `${params.characterName}看了你一眼，语气平静而克制：“我听到了，你先把话说清楚。”`;
  }
  if (stage.key === "familiar") {
    return `${params.characterName}神色稍缓，仍旧保持分寸：“我在听。你要是真需要帮忙，可以直接说。”`;
  }
  if (/克制|冷/.test(persona)) {
    return `${params.characterName}语气低了些，却没有失控：“这件事我会记着，你先别急。”`;
  }
  return `${params.characterName}没有立刻靠近，只是把语气放轻了些：“我知道了，先按现在的情况来。”`;
};

const exceedsRelationStage = (text: string, favor: number) => {
  const normalized = (text || "").trim();
  if (!normalized) return true;
  if (favor <= 9) return LOW_STAGE_BANNED_PATTERNS.some((pattern) => pattern.test(normalized));
  if (favor <= 29) return MID_STAGE_BANNED_PATTERNS.some((pattern) => pattern.test(normalized));
  return false;
};

const getProviderDebugInfo = (feature: AiFeature): CharacterChatDebugInfo => {
  assertFeatureAllowed(feature);
  const provider = getProvider();
  if (provider === "gemini") {
    const apiKey = getGeminiApiKey();
    return {
      feature,
      provider,
      model: getGeminiModel(),
      baseUrl: "https://generativelanguage.googleapis.com",
      requestUrl: "https://generativelanguage.googleapis.com (SDK)",
      apiKeyMasked: maskSecret(apiKey),
    };
  }

  if (provider === "deepseek") {
    const baseUrl = getDeepSeekBaseUrl();
    return {
      feature,
      provider,
      model: getDeepSeekModel(),
      baseUrl: redactBaseUrl(baseUrl),
      requestUrl: buildOpenAIUrl(baseUrl),
      apiKeyMasked: maskSecret(getDeepSeekApiKey()),
    };
  }

  const baseUrl = getOpenAIBaseUrl();
  return {
    feature,
    provider,
    model: getOpenAIModel(),
    baseUrl: redactBaseUrl(baseUrl),
    requestUrl: buildOpenAIUrl(baseUrl),
    apiKeyMasked: maskSecret(getOpenAIApiKey()),
  };
};

const callGemini = async (messages: ChatMessage[], asJson = false): Promise<string> => {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  if (!apiKey) {
    throw new Error("Missing Gemini API key in VITE_GEMINI_API_KEY or VITE_LLM_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = messages
    .map((m) => {
      if (m.role === "system") return `[系统]\n${m.content}`;
      if (m.role === "assistant") return `[助手]\n${m.content}`;
      return `[用户]\n${m.content}`;
    })
    .join("\n\n");

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: asJson ? { responseMimeType: "application/json" } : undefined,
  });

  return (response.text || "").trim();
};

const callOpenAICompatible = async (
  messages: ChatMessage[],
  asJson = false,
  mode: "openai" | "deepseek" = "openai",
): Promise<string> => {
  const isDeepSeek = mode === "deepseek";
  const apiKey = isDeepSeek ? getDeepSeekApiKey() : getOpenAIApiKey();
  const model = isDeepSeek ? getDeepSeekModel() : getOpenAIModel();
  const url = buildOpenAIUrl(isDeepSeek ? getDeepSeekBaseUrl() : getOpenAIBaseUrl());

  if (!apiKey) {
    throw new Error(
      isDeepSeek
        ? "Missing DeepSeek API key in VITE_DEEPSEEK_API_KEY or VITE_LLM_API_KEY"
        : "Missing OpenAI-compatible API key in VITE_OPENAI_API_KEY or VITE_LLM_API_KEY",
    );
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
  };

  if (asJson) body.response_format = { type: "json_object" };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${isDeepSeek ? "DeepSeek" : "OpenAI-compatible"} API error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (data.choices?.[0]?.message?.content || "").trim();
};

const callProvider = async (messages: ChatMessage[], asJson = false, feature: AiFeature = "character_chat"): Promise<string> => {
  assertFeatureAllowed(feature);
  const provider = getProvider();
  if (provider === "gemini") return callGemini(messages, asJson);
  if (provider === "deepseek") return callOpenAICompatible(messages, asJson, "deepseek");
  return callOpenAICompatible(messages, asJson, "openai");
};

export const generateText = async (systemPrompt: string, userPrompt: string, feature: AiFeature = "character_chat"): Promise<string> => {
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  return callProvider(messages, false, feature);
};

const generateJson = async <T>(systemPrompt: string, userPrompt: string, fallback: T, feature: AiFeature = "character_chat"): Promise<T> => {
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: `${systemPrompt}\n请仅输出 JSON。` },
      { role: "user", content: userPrompt },
    ];
    const raw = await callProvider(messages, true, feature);
    return JSON.parse(stripMarkdownJsonFence(raw)) as T;
  } catch {
    return fallback;
  }
};

// 核心保留：角色自由对话继续调用 AI
export async function generateCharacterChatReply(params: {
  characterName: string;
  bio: string;
  surface?: string;
  reversal?: string;
  tags: string[];
  coreQuotes: string[];
  favor?: number;
  relationStage?: string;
  psychStage?: string;
  sceneContext?: string;
  userInput: string;
  history?: Array<{ role: "player" | "character"; text: string }>;
}): Promise<CharacterChatResult> {
  const { characterName, bio, surface, reversal, tags, coreQuotes, userInput, history = [], favor = 0, relationStage = "陌生", psychStage = "guarded", sceneContext = "角色闲聊" } = params;
  const feature: AiFeature = "character_chat";
  const debug = getProviderDebugInfo(feature);
  const { systemPrompt, userPrompt, relationRule } = buildCharacterConstraintPrompt({
    characterName,
    bio,
    surface,
    reversal,
    tags,
    coreQuotes,
    favor,
    stage: relationStage,
    psychStage,
    sceneContext,
    history,
    userInput,
    feature,
  });

  try {
    logAiFeature(feature, "角色闲聊入口已触发", {
      ...buildPromptDebugPayload(feature, debug),
      favor,
      relationStage: relationRule.label,
      psychStage,
    });
    const text = await generateText(systemPrompt, userPrompt, feature);
    let safeText = (text || "").trim();
    if (!safeText) {
      throw new Error("empty response");
    }
    if (exceedsRelationStage(safeText, favor)) {
      logAiFeature(feature, "检测到越级亲密内容，已回退到安全回复", {
        favor,
        relationStage: relationRule.label,
        rawReply: safeText,
      });
      safeText = buildStageSafeFallbackReply({
        characterName,
        surface,
        reversal,
        tags,
        favor,
        userInput,
      });
    }
    logAiFeature(feature, "角色闲聊请求成功", { requestUrl: debug.requestUrl });
    return { ok: true, reply: safeText, debug };
  } catch (error) {
    const friendly = classifyRequestError(error);
    logAiFeature(feature, "角色闲聊请求失败", {
      ...buildPromptDebugPayload(feature, debug),
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      reply: "",
      error: friendly,
      debug,
    };
  }
}

function estimateFavorDeltaByText(text: string): number {
  const normalized = text.toLowerCase();
  const positiveHints = ["谢谢", "在意", "关心", "保护", "相信", "喜欢", "温柔", "愿意", "陪", "放心"];
  const negativeHints = ["滚", "烦", "别管", "离开", "讨厌", "冷静点", "越界", "不合适", "警告"];
  let score = 0;
  for (const w of positiveHints) if (normalized.includes(w)) score += 1;
  for (const w of negativeHints) if (normalized.includes(w)) score -= 1;
  return Math.max(-3, Math.min(3, score));
}

// 核心保留：剧情自定义输入继续调用 AI
export async function generateEncounterCustomInputResult(params: {
  characterName: string;
  bio: string;
  surface?: string;
  reversal?: string;
  tags: string[];
  coreQuotes: string[];
  favor?: number;
  relationStage?: string;
  psychStage?: string;
  userInput: string;
  scene?: string;
  allowAi?: boolean;
}): Promise<{ reply: string; favorDelta: number }> {
  const fallbackReply = `${params.characterName}沉默了片刻，轻声说：“我记住了。”`;
  const fallbackDelta = estimateFavorDeltaByText(params.userInput);
  if (!params.allowAi) {
    return { reply: fallbackReply, favorDelta: fallbackDelta };
  }

  const feature: AiFeature = "encounter_custom_chat";
  const debug = getProviderDebugInfo(feature);
  const favor = params.favor ?? 0;
  const relationStage = params.relationStage ?? "陌生";
  const psychStage = params.psychStage ?? "guarded";
  const { systemPrompt, userPrompt, relationRule } = buildCharacterConstraintPrompt({
    characterName: params.characterName,
    bio: params.bio,
    surface: params.surface,
    reversal: params.reversal,
    tags: params.tags,
    coreQuotes: params.coreQuotes,
    favor,
    stage: relationStage,
    psychStage,
    sceneContext: params.scene || "特殊剧情自定义闲聊",
    history: [],
    userInput: params.userInput,
    feature,
  });

  try {
    logAiFeature(feature, "特殊剧情自定义闲聊入口已触发", {
      ...buildPromptDebugPayload(feature, debug),
      favor,
      relationStage: relationRule.label,
      psychStage,
    });
    let reply = (await generateText(systemPrompt, userPrompt, feature)).trim();
    if (!reply) throw new Error("empty response");
    if (exceedsRelationStage(reply, favor)) {
      logAiFeature(feature, "检测到越级亲密内容，已回退到安全回复", {
        favor,
        relationStage: relationRule.label,
        rawReply: reply,
      });
      reply = buildStageSafeFallbackReply({
        characterName: params.characterName,
        surface: params.surface,
        reversal: params.reversal,
        tags: params.tags,
        favor,
        userInput: params.userInput,
      });
    }
    return { reply, favorDelta: fallbackDelta };
  } catch (error) {
    logAiFeature(feature, "特殊剧情自定义闲聊请求失败，已使用本地回退", {
      ...buildPromptDebugPayload(feature, debug),
      error: error instanceof Error ? error.message : String(error),
    });
    return { reply: fallbackReply, favorDelta: fallbackDelta };
  }
}

// 静态化：通告剧情
export const generateStory = async (
  playerName: string,
  jobName: string,
  jobDesc: string,
  stats: Record<string, number>,
  rivalName?: string,
): Promise<string> => {
  const acting = Number(stats.acting ?? 0);
  const charm = Number(stats.charm ?? 0);
  const popularity = Number(stats.popularity ?? 0);

  const performanceLine =
    acting >= 180 || (acting >= 130 && charm >= 120)
      ? "你在镜头前的情绪控制非常稳定，导演连连点头。"
      : acting >= 90
        ? "你逐渐找到角色节奏，几处情绪爆发得到了现场认可。"
        : "你仍有些生涩，但每一条都在修正细节，状态肉眼可见地变好。";

  const rivalLine = rivalName
    ? `同组的${rivalName}也在加码表现，空气里悄悄多了竞争意味。`
    : "片场节奏紧凑，你把注意力全部压回到角色本身。";

  const heatLine =
    popularity >= 1000
      ? "收工后相关片段迅速发酵，你的名字持续出现在讨论区。"
      : "收工后，工作人员对你的评价明显提升，后续机会也在靠近。";

  return `${playerName}接下了通告《${jobName}》。${jobDesc}${performanceLine}${rivalLine}${heatLine}`;
};

// 静态化：事件反馈
export const generateEventPerformance = async (
  playerName: string,
  eventTitle: string,
  contextText: string,
  choiceText: string,
  stats: Record<string, number>,
): Promise<string> => {
  const score = Number(stats.acting ?? 0) + Number(stats.charm ?? 0) + Number(stats.appearance ?? 0);
  const resultLine =
    score >= 240
      ? "你的处理方式干净利落，周围人的态度明显转向认可。"
      : score >= 140
        ? "局面虽有波动，但你稳住了节奏，结果不算坏。"
        : "这次处理略显仓促，短期内可能带来更多争议。";

  const context = contextText ? `情境：${contextText}。` : "";
  return `${playerName}在「${eventTitle}」中选择了「${choiceText}」。${context}${resultLine}`;
};

// 静态化：剧本研读
export const generateScriptReading = async (playerName: string, stats: Record<string, number>): Promise<string> => {
  const acting = Number(stats.acting ?? 0);
  const pool =
    acting <= 50
      ? SCRIPT_READING_TEXTS.beginner
      : acting <= 150
        ? SCRIPT_READING_TEXTS.intermediate
        : SCRIPT_READING_TEXTS.advanced;

  const text = getRandomElement(pool);
  return text.replaceAll("你", playerName).replaceAll("你的", `${playerName}的`);
};

// 静态化：NPC生成
export const generateNPC = async (): Promise<{ name: string; title: string; avatar: string; personality: string }> => {
  return getRandomElement(STATIC_NPCS);
};

// 静态化：NPC发帖
export const generateNPCPost = async (
  npc: { name: string; title: string; personality: string },
  gameContext: string,
): Promise<string> => {
  const base = getRandomElement(NPC_POSTS_LIBRARY);
  return gameContext ? `${base}（${npc.name}：${gameContext.slice(0, 24)}...）` : base;
};

// 静态化：NPC回复
export const generateNPCResponse = async (
  npc: { name: string; title: string; personality: string },
  playerMessage: string,
  context: string,
  isDM: boolean,
): Promise<string> => {
  const base = getRandomElement(NPC_POSTS_LIBRARY);
  const channel = isDM ? "私信" : "评论";
  const msg = playerMessage ? `你刚说“${playerMessage.slice(0, 18)}${playerMessage.length > 18 ? "..." : ""}”` : "";
  const ctx = context ? `（${context.slice(0, 18)}${context.length > 18 ? "..." : ""}）` : "";
  return `${channel}回复｜${npc.name}：${base}${msg ? ` ${msg}` : ""}${ctx}`;
};

// 静态化：通告评价
export const generateJobEvaluation = async (
  jobName: string,
  stats: Record<string, number>,
  playerName: string,
): Promise<{ evaluation: string; rating: string }> => {
  const acting = Number(stats.acting ?? 0);
  const appearance = Number(stats.appearance ?? 0);
  const singing = Number(stats.singing ?? 0);
  const dancing = Number(stats.dancing ?? 0);
  const charm = Number(stats.charm ?? 0);
  const popularity = Number(stats.popularity ?? 0);

  const totalScore =
    acting * 0.28 +
    appearance * 0.16 +
    singing * 0.16 +
    dancing * 0.16 +
    charm * 0.16 +
    popularity * 0.08;

  const rating = totalScore >= 220 ? "S" : totalScore >= 160 ? "A" : totalScore >= 100 ? "B" : "C";
  const evaluation = getRandomElement(JOB_EVALUATIONS[rating as keyof typeof JOB_EVALUATIONS]);

  return {
    evaluation: `${playerName}在「${jobName}」中的表现：${evaluation}`,
    rating,
  };
};

// 静态化：行业事件
export const generateIndustryEvent = async (
  playerName: string,
  stats: Record<string, number>,
  reputation: number,
  companyName: string,
  options?: {
    excludeIds?: string[];
    excludeThemes?: string[];
  },
): Promise<{
  id?: string;
  title: string;
  scenario: string;
  level?: "低波动" | "中波动" | "高关注";
  sentiment?: "正向" | "中性" | "敏感";
  waveType?: "舆情观察" | "媒体风向" | "品牌合作" | "圈内协作" | "路人热度";
  sourceTag?: string;
  theme?: string;
  choices: {
    text: string;
    impact: string;
    rewards: Partial<Stats> & { money?: number; popularity?: number; reputation?: number };
  }[];
}> => {
  const inferTheme = (title: string, scenario: string): string => {
    const text = `${title}${scenario}`;
    if (/品牌|代言|联名|商务|合作/.test(text)) return "品牌";
    if (/热搜|舆情|误读|争议|质疑|爆料/.test(text)) return "舆情";
    if (/媒体|访谈|记者|报道|剪辑|预告/.test(text)) return "媒体";
    if (/团队|剧组|片场|协作|合同|经纪/.test(text)) return "团队";
    if (/路人|讨论|口碑|社媒|评论/.test(text)) return "路人";
    return "行业";
  };

  const inferMeta = (event: (typeof INDUSTRY_EVENTS)[number]) => {
    const waveTypeMap: Record<string, "舆情观察" | "媒体风向" | "品牌合作" | "圈内协作" | "路人热度"> = {
      品牌: "品牌合作",
      舆情: "舆情观察",
      媒体: "媒体风向",
      团队: "圈内协作",
      路人: "路人热度",
      行业: "舆情观察",
    };
    return {
      level: event.reqFame >= 75 ? ("高关注" as const) : event.reqFame >= 45 ? ("中波动" as const) : ("低波动" as const),
      sentiment: /争议|质疑|爆料|误读|冲突|危机|翻车/.test(event.title + event.scenario)
        ? ("敏感" as const)
        : /回暖|修复|改善|正向|认可|加分/.test(event.title + event.scenario)
          ? ("正向" as const)
          : ("中性" as const),
      waveType: waveTypeMap[inferTheme(event.title, event.scenario)],
      sourceTag: ["行业观察", "媒体监测", "舆情简报", "商务情报"][Math.floor(Math.random() * 4)],
      theme: inferTheme(event.title, event.scenario),
    };
  };

  const buildRelatedEvents = (event: (typeof INDUSTRY_EVENTS)[number]) => {
    const theme = inferTheme(event.title, event.scenario);
    const rewardHints = event.choices
      .flatMap((choice) =>
        Object.entries(choice.rewards ?? {})
          .filter(([, value]) => Number(value) !== 0)
          .slice(0, 1)
          .map(([key, value]) => {
            const label =
              key === "money"
                ? "商务收益"
                : key === "popularity"
                  ? "讨论热度"
                  : key === "reputation"
                    ? "行业口碑"
                    : key === "charm"
                      ? "公众观感"
                      : key === "acting"
                        ? "专业评价"
                        : key === "singing"
                          ? "表演反馈"
                          : key === "dancing"
                            ? "舞台讨论"
                            : key;
            return `${label}${Number(value) > 0 ? "有望走高" : "可能承压"}`;
          }),
      )
      .slice(0, 2);

    const themeEvents: Record<string, string[]> = {
      品牌: ["商务群聊开始重新评估排期窗口", "品牌公关正在同步合作风险等级", "外部商务邀约进入观望或加速阶段"],
      舆情: ["热搜词条情绪出现细微偏移", "营销号二次解读正在扩散", "粉圈与路人讨论热区开始分层"],
      媒体: ["媒体选题会将你列入观察名单", "采访邀约与版面倾向出现波动", "预告片物料的剪辑导向被重新讨论"],
      团队: ["经纪团队正在重新校准对外口径", "剧组内部开始讨论后续协作节奏", "执行层对风险和资源分配展开复盘"],
      路人: ["路人讨论点从单一话题转向整体观感", "社交平台自来水发言开始累积", "评论区情绪从围观向站队过渡"],
      行业: ["业内观察名单里你的权重轻微变化", "周边合作方开始重新评估动作节奏", "监测系统提示该话题仍在低频发酵"],
    };

    return [
      ...themeEvents[theme].slice(0, 2),
      ...rewardHints,
    ].slice(0, 3);
  };

  const buildIntegratedScenario = (
    event: (typeof INDUSTRY_EVENTS)[number],
    playerLabel: string,
    companyLabel: string,
  ) => {
    const base = `${event.scenario}（${playerLabel}｜${companyLabel}）`;
    const related = buildRelatedEvents(event);
    if (!related.length) return base;
    return `${base}\n\n当前风向补充：\n${related.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
  };

  const excludeIdSet = new Set(options?.excludeIds ?? []);
  const excludeThemeSet = new Set(options?.excludeThemes ?? []);

  const strictCandidates = INDUSTRY_EVENTS.filter((event) => {
    if (reputation < event.reqFame) return false;
    if (excludeIdSet.has(event.id)) return false;
    const theme = inferTheme(event.title, event.scenario);
    if (excludeThemeSet.has(theme)) return false;
    return true;
  });
  const looseCandidates = INDUSTRY_EVENTS.filter((event) => reputation >= event.reqFame);
  const candidates = strictCandidates.length > 0 ? strictCandidates : looseCandidates;
  const picked =
    candidates.length > 0
      ? getRandomElement(candidates)
      : {
          id: "event_fallback",
          title: "行业小波动",
          reqFame: 0,
          scenario: "今天圈内风向有些微妙，但并未引发实质冲突。",
          choices: [
            { text: "保持低调观察", impact: "稳步推进", rewards: { reputation: 3 } },
            { text: "主动发声回应", impact: "获得少量关注", rewards: { popularity: 5 } },
            { text: "与团队内部沟通", impact: "执行效率提升", rewards: { charm: 2 } },
          ],
        };

  const meta = inferMeta(picked);

  return {
    id: picked.id,
    title: picked.title,
    scenario: buildIntegratedScenario(picked, playerName, companyName),
    ...meta,
    choices: picked.choices.map((choice) => ({
      text: choice.text,
      impact: choice.impact,
      rewards: { ...choice.rewards },
    })),
  };
};
