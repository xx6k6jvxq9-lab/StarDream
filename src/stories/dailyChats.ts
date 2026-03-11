import { WEEKLY_CHAT_DATA, type WeeklyChatCharacterId } from "../data/chatData";
import type { StoryLine, StoryNode, StoryOption } from "../types/story";

export type DailyChatGroup = {
  scene: string;
  lines: StoryLine[];
};

type CharacterId =
  | "shen_mo"
  | "lu_xingran"
  | "liu_mengyao"
  | "su_tangtang"
  | "gu_chengyan"
  | "lin_yu"
  | "zhou_yan"
  | "jiang_muci"
  | "ji_mingxuan";

type RelationStage = "陌生" | "熟悉" | "暧昧" | "心动";

const storyPrefixMap: Record<CharacterId, string> = {
  shen_mo: "shenmo",
  lu_xingran: "luxingran",
  liu_mengyao: "liumengyao",
  su_tangtang: "sutangtang",
  gu_chengyan: "guchengyan",
  lin_yu: "linyu",
  zhou_yan: "zhouyan",
  jiang_muci: "jiangmuci",
  ji_mingxuan: "jimingxuan",
};

const nameMap: Record<CharacterId, string> = {
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

const stagePrefixByCharacter: Record<CharacterId, Record<RelationStage, string>> = {
  shen_mo: { 陌生: "沈默目光沉静：", 熟悉: "沈默语气放缓：", 暧昧: "沈默轻声靠近：", 心动: "沈默几乎贴着你耳侧：" },
  lu_xingran: { 陌生: "陆星燃扬眉：", 熟悉: "陆星燃笑着凑近：", 暧昧: "陆星燃眼底发亮：", 心动: "陆星燃压低声音：" },
  liu_mengyao: { 陌生: "柳梦瑶冷声道：", 熟悉: "柳梦瑶看你一眼：", 暧昧: "柳梦瑶指尖轻敲桌面：", 心动: "柳梦瑶语气更低：" },
  su_tangtang: { 陌生: "苏糖糖小声说：", 熟悉: "苏糖糖弯眼一笑：", 暧昧: "苏糖糖贴近你耳侧：", 心动: "苏糖糖红着眼看你：" },
  gu_chengyan: { 陌生: "顾承宴从容开口：", 熟悉: "顾承宴语调温和：", 暧昧: "顾承宴目光停在你身上：", 心动: "顾承宴声音更轻：" },
  lin_yu: { 陌生: "林屿平静地说：", 熟悉: "林屿把语速放慢：", 暧昧: "林屿眼神柔下来：", 心动: "林屿近乎叹息：" },
  zhou_yan: { 陌生: "周焰直截了当：", 熟悉: "周焰点了点头：", 暧昧: "周焰盯着你说：", 心动: "周焰声音压得很低：" },
  jiang_muci: { 陌生: "江暮辞简短回应：", 熟悉: "江暮辞目光停了一秒：", 暧昧: "江暮辞靠近半步：", 心动: "江暮辞几乎把你护住：" },
  ji_mingxuan: { 陌生: "季明轩冷静评价：", 熟悉: "季明轩语气松动：", 暧昧: "季明轩看着你说：", 心动: "季明轩低声补了一句：" },
};

const relationStages: RelationStage[] = ["陌生", "熟悉", "暧昧", "心动"];

const buildStageFollowUp = (characterId: CharacterId, baseReply: string): StoryOption["stageFollowUp"] =>
  relationStages.reduce(
    (acc, stage) => {
      acc[stage] = [{ speaker: nameMap[characterId], text: `${stagePrefixByCharacter[characterId][stage]}${baseReply}` }];
      return acc;
    },
    {} as StoryOption["stageFollowUp"],
  );

export const dailyChats: Record<CharacterId, DailyChatGroup[]> = {
  shen_mo: [
    { scene: "深夜收工后，你们在片场边缘的灯下停步。", lines: [{ speaker: "沈默", text: "今天状态不错，别被夸两句就飘。" }] },
    { scene: "保姆车旁，风有点凉。", lines: [{ speaker: "沈默", text: "外套拉好，明天还有硬仗。" }] },
    { scene: "你发去一句晚安。", lines: [{ speaker: "沈默", text: "收到。明早六点，别迟到。" }] },
  ],
  lu_xingran: [
    { scene: "练习室休息间隙，他给你发来语音。", lines: [{ speaker: "陆星燃", text: "我刚练完，等会儿要不要一起复盘舞台？" }] },
    { scene: "演出后台，他探头看你。", lines: [{ speaker: "陆星燃", text: "你今天有点累，记得补水。" }] },
    { scene: "夜里，他秒回了你的消息。", lines: [{ speaker: "陆星燃", text: "我在，你说。" }] },
  ],
  liu_mengyao: [
    { scene: "会议结束后，她把资料丢到你面前。", lines: [{ speaker: "柳梦瑶", text: "先吃饭，再看合同。身体垮了什么都白搭。" }] },
    { scene: "她在行程表上给你圈了一段时间。", lines: [{ speaker: "柳梦瑶", text: "这两小时是你的休息，不接受反驳。" }] },
    { scene: "她发来一条简讯。", lines: [{ speaker: "柳梦瑶", text: "今天热搜我压下去了，别分心，专心拍戏。" }] },
  ],
  su_tangtang: [
    { scene: "她给你发来一张可爱贴纸。", lines: [{ speaker: "苏糖糖", text: "今天也要加油呀，我给你留了甜点。" }] },
    { scene: "录音棚门口，她小声叫住你。", lines: [{ speaker: "苏糖糖", text: "我写了段旋律，想先给你听。" }] },
    { scene: "深夜，她消息里只有一句。", lines: [{ speaker: "苏糖糖", text: "你在就好。" }] },
  ],
  gu_chengyan: [
    { scene: "商务场合散场后，他亲自送你上车。", lines: [{ speaker: "顾承宴", text: "你今天表现得很稳，值得更大的舞台。" }] },
    { scene: "他让助理转来一份项目书。", lines: [{ speaker: "顾承宴", text: "有兴趣就看，不急着现在答复。" }] },
    { scene: "夜色下，他语气很轻。", lines: [{ speaker: "顾承宴", text: "别把自己逼得太紧，我会看着安排。" }] },
  ],
  lin_yu: [
    { scene: "医院走廊安静，他把热饮递给你。", lines: [{ speaker: "林屿", text: "先暖一暖，再说别的。" }] },
    { scene: "他看完你的体检报告，微皱眉。", lines: [{ speaker: "林屿", text: "睡眠要补，别硬撑。" }] },
    { scene: "夜班前，他给你留了便签。", lines: [{ speaker: "林屿", text: "我在急诊，结束后给我报平安。" }] },
  ],
  zhou_yan: [
    { scene: "训练赛后，他甩来一句。", lines: [{ speaker: "周焰", text: "你反应快了，继续。" }] },
    { scene: "直播间休息，他压低声音。", lines: [{ speaker: "周焰", text: "别看弹幕，先看我给你的复盘。" }] },
    { scene: "他发来一个游戏邀请。", lines: [{ speaker: "周焰", text: "来一把，输的人请奶茶。" }] },
  ],
  jiang_muci: [
    { scene: "电梯口，他站在你前方半步。", lines: [{ speaker: "江暮辞", text: "我先出去看一眼，你再走。" }] },
    { scene: "收工路上，他把伞往你这边偏。", lines: [{ speaker: "江暮辞", text: "别淋到。" }] },
    { scene: "他发来极简消息。", lines: [{ speaker: "江暮辞", text: "到家回我。" }] },
  ],
  ji_mingxuan: [
    { scene: "工作室灯还亮着，他敲着键盘。", lines: [{ speaker: "季明轩", text: "你这段情绪可以再收半分，明天试试。" }] },
    { scene: "他把新改的台词发给你。", lines: [{ speaker: "季明轩", text: "别背死，先理解动机。" }] },
    { scene: "凌晨，他居然主动发来消息。", lines: [{ speaker: "季明轩", text: "今晚的镜头，你处理得比我预想好。" }] },
  ],
};

export function buildDailyChatStory(characterId: CharacterId): StoryNode {
  const groups = WEEKLY_CHAT_DATA[characterId as WeeklyChatCharacterId];
  if (groups?.length) {
    const pick = groups[Math.floor(Math.random() * groups.length)];
    return {
      id: `${storyPrefixMap[characterId]}_daily_chat`,
      scene: pick.scene,
      lines: [{ speaker: nameMap[characterId], text: pick.opener }],
      options: pick.options.map((option) => ({
        text: option.text,
        effect: { favor: option.affection },
        followUp: {
          lines: [{ speaker: nameMap[characterId], text: option.reply }],
        },
        stageFollowUp: buildStageFollowUp(characterId, option.reply),
      })),
    };
  }

  const chats = dailyChats[characterId];
  const pick = chats[Math.floor(Math.random() * chats.length)] ?? {
    scene: "你们进行了一段简短闲聊。",
    lines: [{ speaker: nameMap[characterId], text: "今天也辛苦了。" }],
  };

  return {
    id: `${storyPrefixMap[characterId]}_daily_chat`,
    scene: pick.scene,
    lines: pick.lines,
    options: [{ text: "结束聊天", effect: { favor: 2 } }],
  };
}
