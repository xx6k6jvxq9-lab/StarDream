import { GoogleGenAI } from "@google/genai";

export type AIProvider = "gemini" | "openai" | "deepseek";

const readEnv = (key: string): string => {
  const env = import.meta.env as Record<string, string | undefined>;
  return String(env[key] ?? "").trim();
};

const normalizeChatCompletionsUrl = (baseUrl: string, fallbackBase: string): string => {
  const normalized = (baseUrl || fallbackBase).replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(normalized)) return normalized;
  if (/\/v\d+$/i.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
};

const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = readEnv("VITE_GEMINI_API_KEY");
  const model = readEnv("VITE_GEMINI_MODEL") || "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return (response.text || "").trim();
};

const callOpenAIStyle = async (provider: "openai" | "deepseek", prompt: string): Promise<string> => {
  const isOpenAI = provider === "openai";
  const apiKey = isOpenAI ? readEnv("VITE_OPENAI_API_KEY") : readEnv("VITE_DEEPSEEK_API_KEY");
  const model = isOpenAI
    ? readEnv("VITE_OPENAI_MODEL") || "gpt-4o-mini"
    : readEnv("VITE_DEEPSEEK_MODEL") || "deepseek-chat";
  const baseUrl = isOpenAI
    ? readEnv("VITE_OPENAI_BASE_URL")
    : readEnv("VITE_DEEPSEEK_BASE_URL");
  const fallbackBase = isOpenAI ? "https://api.openai.com" : "https://api.deepseek.com";
  const url = normalizeChatCompletionsUrl(baseUrl, fallbackBase);

  if (!apiKey) {
    throw new Error(
      isOpenAI ? "Missing VITE_OPENAI_API_KEY" : "Missing VITE_DEEPSEEK_API_KEY",
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${provider} API error: ${res.status} ${errorText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (data.choices?.[0]?.message?.content || "").trim();
};

export const fetchAIResponse = async (
  provider: AIProvider,
  prompt: string,
): Promise<string> => {
  if (provider === "gemini") {
    return callGemini(prompt);
  }
  if (provider === "openai") {
    return callOpenAIStyle("openai", prompt);
  }
  return callOpenAIStyle("deepseek", prompt);
};

export const getAiResponse = async (prompt: string): Promise<string> => {
  const raw = readEnv("VITE_ACTIVE_AI_PROVIDER").toLowerCase();
  const provider: AIProvider =
    raw === "openai" || raw === "deepseek" || raw === "gemini" ? raw : "gemini";
  return fetchAIResponse(provider, prompt);
};

