import { GoogleGenAI } from "@google/genai";
import type { Stats } from '../gameData';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateStory = async (
  playerName: string,
  jobName: string,
  jobDesc: string,
  stats: Record<string, number>,
  rivalName?: string
): Promise<string> => {
  const prompt = `
    你是一个文字冒险游戏的叙事者。
    主角"${playerName}"正在进行通告工作："${jobName}"。
    工作描述：${jobDesc}
    ${rivalName ? `竞争对手："${rivalName}"也在现场，与主角争夺表现机会。` : ''}
    
    主角当前属性：
    - 演技: ${stats.acting}
    - 唱功: ${stats.singing}
    - 舞蹈: ${stats.dancing}
    - 魅力: ${stats.charm}
    - 颜值: ${stats.appearance}
    - 人气: ${stats.popularity}

    请生成一段 150-200 字的沉浸式剧情，描述主角的工作经历。
    
    要求：
    1. **环境描写**：简要勾勒工作现场的氛围（如片场的嘈杂、舞台的灯光、录音棚的静谧）。
    2. **细节描写**：详细描述主角的表演细节（动作、神态、台词爆发、歌声感染力等）。
    3. **表现判定**：根据主角属性判定表现：
       - 属性极高：表现惊艳，震惊全场，导演/观众赞不绝口，成为焦点。
       - 属性达标：表现稳健，顺利完成任务，获得认可。
       - 属性勉强：表现生涩，虽然完成了任务但略显吃力，内心忐忑。
    ${rivalName ? `4. **对手互动**：描述主角与${rivalName}的暗中较劲或直接比拼，以及最终谁更胜一筹（根据属性判定）。` : ''}
    5. **代入感**：请使用第二人称"你"来称呼主角。语气生动有趣，富有画面感。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "剧情生成失败，请稍后再试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "剧情生成出现了一些问题，但这并不影响你的星途。";
  }
};

export const generateEventPerformance = async (
  playerName: string,
  eventTitle: string,
  contextText: string,
  choiceText: string,
  stats: Record<string, number>
): Promise<string> => {
  const prompt = `
    你是一个文字冒险游戏的叙事者。
    主角"${playerName}"在事件"${eventTitle}"中做出了选择："${choiceText}"。
    情境回顾：${contextText}
    
    主角属性参考：
    - 演技: ${stats.acting}
    - 魅力: ${stats.charm}
    - 颜值: ${stats.appearance}

    请生成一段 100-150 字的剧情反馈。
    
    要求：
    1. **行动描写**：生动描述主角做出该选择后的具体行动和神态。
    2. **外界反应**：描述周围人（NPC、观众、媒体）的即时反应（惊讶、赞赏、愤怒、感动等）。
    3. **结果暗示**：暗示这个选择带来的直接后果或氛围变化。
    4. **代入感**：请使用第二人称"你"。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "剧情生成失败。";
  } catch (error) {
    return "......";
  }
};

export const generateScriptReading = async (
  playerName: string,
  stats: Record<string, number>
): Promise<string> => {
  const prompt = `
    你是一个文字冒险游戏的叙事者。
    主角"${playerName}"正在研读剧本，磨练演技。
    当前演技：${stats.acting}。

    请生成一段 100-150 字的剧本研读体验。
    
    要求：
    1. **虚构剧本**：随机虚构一个剧本名字（如《...》）和题材（古装权谋、现代悬疑、科幻、爱情等）。
    2. **沉浸体验**：描述主角阅读时的心理活动，如何揣摩角色，或者被剧情深深打动。
    3. **能力体现**：
       - 演技低：感到晦涩难懂，或者难以共情，只能死记硬背。
       - 演技高：瞬间入戏，仿佛成为了剧中人，甚至流下眼泪或开怀大笑，对角色有独到理解。
    4. **代入感**：请使用第二人称"你"。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "你认真研读了剧本，感觉演技有所提升。";
  } catch (error) {
    return "你认真研读了剧本，感觉演技有所提升。";
  }
};

export const generateNPC = async (): Promise<{ name: string; title: string; avatar: string; personality: string }> => {
  const prompt = `
    请为一个娱乐圈模拟游戏生成一个新的 NPC 社交媒体用户。
    返回 JSON 格式，包含以下字段：
    - name: 姓名（2-4个字）
    - title: 身份头衔（如：练习生、资深经纪人、狗仔、时尚博主、二线演员等）
    - avatar: 一个英文名字（用于生成头像种子）
    - personality: 性格描述（10-20字，例如：毒舌犀利，喜欢爆料；或者：温柔努力，正能量满满）
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Generate NPC Error:", error);
    return { name: "路人甲", title: "练习生", avatar: "Random", personality: "平平无奇" };
  }
};

export const generateNPCPost = async (npc: { name: string; title: string; personality: string }, gameContext: string): Promise<string> => {
  const prompt = `
    你正在扮演一个社交媒体用户。
    你的信息：
    - 姓名：${npc.name}
    - 身份：${npc.title}
    - 性格：${npc.personality}
    
    当前游戏背景：${gameContext}
    
    请根据你的身份和性格，发布一条 30-60 字的社交动态（微博/朋友圈风格）。
    可以包含表情符号。
    如果是狗仔或博主，可以爆料或评价；如果是艺人，可以分享生活或宣传。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "今天天气不错。";
  } catch (error) {
    return "努力工作中！✨";
  }
};

export const generateNPCResponse = async (
  npc: { name: string; title: string; personality: string },
  playerMessage: string,
  context: string,
  isDM: boolean
): Promise<string> => {
  const prompt = `
    你正在扮演一个社交媒体用户。
    你的信息：
    - 姓名：${npc.name}
    - 身份：${npc.title}
    - 性格：${npc.personality}
    
    情境：${isDM ? '对方给你发了一条私信' : '对方在你的动态下发表了评论'}
    对方说：${playerMessage}
    
    当前游戏背景：${context}
    
    请根据你的身份和性格，回复对方。
    要求：
    1. 语气符合性格（如毒舌、温柔、专业等）。
    2. 长度在 20-50 字之间。
    3. 如果是私信，可以稍微私密或直接一些；如果是评论回复，可以更公开一些。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "收到。";
  } catch (error) {
    return "嗯。";
  }
};

export const generateJobEvaluation = async (
  jobName: string,
  stats: any,
  playerName: string
): Promise<{ evaluation: string; rating: string }> => {
  const prompt = `
    主角 ${playerName} 刚刚完成了一项工作：${jobName}。
    主角的当前属性：演技 ${stats.acting}, 颜值 ${stats.appearance}, 唱功 ${stats.singing}, 舞蹈 ${stats.dancing}, 魅力 ${stats.charm}。
    
    请生成一段媒体评价。
    要求：
    1. 语气像娱乐新闻或影评。
    2. 根据属性高低决定评价好坏（如果属性远高于工作要求，评价极好；如果勉强达到，评价一般）。
    3. 给出评价等级（S, A, B, C）。
    4. 评价长度在 40-80 字之间。
    
    请以 JSON 格式返回：
    {
      "evaluation": "评价内容...",
      "rating": "S/A/B/C"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"evaluation": "表现平平。", "rating": "B"}');
  } catch (error) {
    return { evaluation: "表现尚可，继续努力。", rating: "B" };
  }
};

export const generateIndustryEvent = async (
  playerName: string,
  stats: Record<string, number>,
  reputation: number,
  companyName: string
): Promise<{
  title: string;
  scenario: string;
  choices: {
    text: string;
    impact: string;
    rewards: Partial<Stats> & { money?: number; popularity?: number; reputation?: number };
  }[];
}> => {
  const prompt = `
    你是一个娱乐圈模拟游戏的剧本作家。
    主角"${playerName}"当前在"${companyName}"经纪公司。
    主角属性：演技 ${stats.acting}, 颜值 ${stats.appearance}, 人气 ${stats.popularity}, 声望 ${reputation}。

    请生成一个具有挑战性的"娱乐圈抉择"事件。
    要求：
    1. **事件背景**：描述一个主角面临的真实娱乐圈困境。
       - 可以是诱惑（如：潜规则、情色交易、不正当竞争、买热搜）。
       - 可以是正能量（如：坚持真我、提携后辈、拒绝假唱、公益活动）。
       - 也可以是职业危机（如：被造谣、合同纠纷、资源被抢）。
    2. **三个选项**：提供三个不同的应对方案。
       - 选项 A：通常是"走捷径"或"黑暗面"（高回报，但可能损失声望或有长期负面影响）。
       - 选项 B：通常是"坚持底线"或"正直面"（低回报或短期损失，但增加声望）。
       - 选项 C：通常是"圆滑处理"或"折中方案"。
    3. **奖励设定**：为每个选项设定合理的属性/金钱/人气/声望变化。
    4. **代入感**：使用第二人称"你"。

    请以 JSON 格式返回：
    {
      "title": "事件标题",
      "scenario": "事件具体描述（150-200字）",
      "choices": [
        {
          "text": "选项描述",
          "impact": "对后期走向的简短描述（如：走上黑红之路）",
          "rewards": { "money": 1000, "popularity": 50, "reputation": -20, "charm": 5 }
        },
        ... (共三个选项)
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Generate Industry Event Error:", error);
    return {
      title: "突发状况",
      scenario: "你在片场遇到了一些意想不到的事情...",
      choices: [
        { text: "静观其变", impact: "稳健处理", rewards: { reputation: 5 } },
        { text: "积极应对", impact: "展现专业", rewards: { popularity: 10 } },
        { text: "寻求帮助", impact: "人脉经营", rewards: { charm: 5 } }
      ]
    };
  }
};
