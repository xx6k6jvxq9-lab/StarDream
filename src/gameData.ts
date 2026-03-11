import shenMoImage from "./assets/characters/shen_mo.png";
import liuMengyaoImage from "./assets/characters/liu_mengyao.png";
import suTangtangImage from "./assets/characters/su_tangtang.png";
import guChengyanImage from "./assets/characters/gu_chengyan.png";
import linYuImage from "./assets/characters/lin_yu.png";
import jiMingxuanImage from "./assets/characters/ji_mingxuan.png";
import luXingranImage from "./assets/characters/lu_xingran.png";
import zhouYanImage from "./assets/characters/zhou_yan.png";
import jiangMuciImage from "./assets/characters/jiang_muci.png";
import { PHASE_TASKS, type PhaseTask } from "./data/tasks";

export type Stats = {
  appearance: number;
  acting: number;
  singing: number;
  dancing: number;
  charm: number;
  popularity: number;
  mood: number;
};

export type FacilityId = "gym" | "studio" | "classroom" | "rehearsal" | "pr_center" | "media_dept";
export type GameTime = { year: number; month: number; week: number };
export type LocationId =
  | "home"
  | "company"
  | "city"
  | "jobs"
  | "schedule"
  | "wardrobe"
  | "trophy"
  | "quests"
  | "social"
  | "contacts";

export type ActionEffect = Partial<Stats> & { stamina?: number; maxStamina?: number; money?: number; reputation?: number };
export type Action = { id: string; name: string; desc: string; cost: { stamina: number; money: number }; effect: ActionEffect; time: number };
export type Job = {
  id: string;
  name: string;
  desc: string;
  type?: string;
  description?: string;
  roleName?: string;
  req: Partial<Stats>;
  requirements?: Partial<Stats>;
  cost: { stamina: number; money?: number };
  reward: { money: number; popularity: number; stats?: Partial<Stats> };
  time: number;
  tags?: string[];
  ipGroup?: string;
  sequelTo?: string;
  category?: "影视" | "综艺" | "广告" | "音乐";
};

export type SocialUser = {
  id: string;
  name: string;
  avatar: string;
  title: string;
  isVerified: boolean;
  followers: number;
  personality?: string;
  stats?: Partial<Stats>;
};
export type SocialPost = { id: string; authorId: string; content: string; image?: string; likes: number; comments: string[]; timestamp: GameTime; type: "text" | "image" | "news" };
export type Message = { id: string; senderId: string; content: string; timestamp: GameTime };
export type Conversation = { userId: string; messages: Message[] };

export type Company = {
  id: string;
  name: string;
  desc: string;
  bonus: Partial<Stats> & { money?: number; maxStamina?: number };
  perk: string;
  commission: number;
  minStats?: Partial<Stats>;
  minPopularity?: number;
  contractDuration: number;
  penalty: number;
};

export type Player = {
  name: string;
  companyId: string;
  contractEnd?: GameTime;
  stamina: number;
  maxStamina: number;
  money: number;
  stats: Stats;
  reputation: number;
  inventory: string[];
  equippedClothing: string | null;
  avatar?: string;
  facilities: Record<FacilityId, number>;
  completedQuests: string[];
  jobsCompleted: number;
  acceptedJobIds: string[];
  submittedPhaseTasks: string[];
  completedTaskDomains: Record<string, number>;
  honors: string[];
  social: {
    followers: number;
    following: string[];
    posts: SocialPost[];
    conversations: Conversation[];
    relationships: Record<string, number>;
  };
};

export type Emotion = "normal" | "happy" | "angry" | "sad" | "surprised";
export type Check = { stat: keyof Stats; difficulty: number; rivalId?: string; successLine: number; failLine: number; successEffect?: ActionEffect; failEffect?: ActionEffect; successEventId?: string };
export type StoryChoice = { text: string; effect?: ActionEffect; nextLine?: number; check?: Check };
export type StoryLine = { speaker?: string; text: string; emotion?: Emotion; choices?: StoryChoice[] };
export type StoryEvent = { id: string; title: string; isTriggered: (time: GameTime, player: Player, completedEvents: string[]) => boolean; lines: StoryLine[] };
export type RandomEvent = { id: string; title: string; probability: number; locations: LocationId[]; condition?: (player: Player) => boolean; getLines: (player: Player) => StoryLine[] };
export type Achievement = { id: string; name: string; desc: string; reward: ActionEffect; condition: (player: Player, completedEvents: string[]) => boolean };
export type Clothing = { id: string; name: string; desc: string; cost: number; bonus: Partial<Stats>; styleTag?: "古风" | "现代" | "甜美" | "酷飒" | "优雅" | "运动" | "街头" | "舞台" | "通勤"; stats?: Partial<Stats> };
export type LocationBuff = {
  id: string;
  name: string;
  desc: string;
  buff: {
    actingRate?: number;
    favorRate?: number;
    popularityRate?: number;
    charmRate?: number;
    reputationRate?: number;
    staminaRecover?: number;
    moneyRate?: number;
  };
};
export type Deadline = { year: number; month: number; week: number; title: string; desc: string; condition: (player: Player, completedAchievements: string[]) => boolean; failLines: StoryLine[] };
export type Ending = { id: string; title: string; desc: string; condition: (player: Player, completedAchievements: string[]) => boolean; lines: StoryLine[] };
export type QuestId = string;
export type Quest = { id: QuestId; title: string; desc: string; type: "short" | "long"; condition: (player: Player, time: GameTime) => boolean; reward: { money?: number; stats?: Partial<Stats>; items?: string[] } };
export type Background = { id: string; name: string; desc: string; bonus: Partial<Stats> & { money?: number; maxStamina?: number } };
export type StartingBonus = { id: string; name: string; desc: string; bonus: Partial<Stats> & { money?: number; maxStamina?: number } };
export type NPC = { id: string; name: string; title: string; color: string; avatarSeed: string };
export type CharacterProfile = { bio: string; surface: string; reversal: string; coreQuotes: string[]; tags: string[]; image?: string };
export type FacilityLevel = { level: number; cost: { money: number; time: number }; bonus: number; bonusDesc: string };
export type Facility = { id: FacilityId; name: string; desc: string; levels: FacilityLevel[] };
export type IndustryEvent = {
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
};
export type EncounterConfig = {
  id: string;
  charId: string;
  location: string;
  timeRange: { yearStart: number; yearEnd: number; weekStart: number; weekEnd: number };
  requiredJobId?: string;
  requiredFame?: number;
  isMissable?: boolean;
  requiredUnlockedCharacters?: string[];
  requiredCharacterFavor?: Record<string, number>;
  storyId: string;
};
export type SpecialEventConfig = { id: string; charId: string; stageRequired: string; favorMin?: number; favorMax?: number; requiredPrevEvent?: string; riskTable?: Record<string, number[]>; storyId: string };
export type EndingFlags = Record<string, string | number | boolean | undefined>;
export type EndingFavorMap = Record<string, number | undefined>;
export type EndingStatsSnapshot = Partial<Stats> & Record<string, string | number | boolean | undefined>;

export { PHASE_TASKS };
export type { PhaseTask };

export const COMPANIES: Company[] = [
  { id: "star_shine", name: "星耀娱乐", desc: "业内老牌公司，资源均衡，对新人较友好。", bonus: { money: 2000, popularity: 50 }, perk: "每周体力恢复 +5", commission: 0.4, contractDuration: 48, penalty: 50000 },
  { id: "galaxy_media", name: "银河传媒", desc: "资本实力强，商业机会多。", bonus: { money: 10000, charm: 10 }, perk: "通告金钱收益 +20%", commission: 0.6, minPopularity: 500, contractDuration: 96, penalty: 200000 },
  { id: "muse_studio", name: "缪斯工作室", desc: "偏艺术路线，重口碑。", bonus: { acting: 20, singing: 10, dancing: 10 }, perk: "技能训练效果 +10%", commission: 0.3, minStats: { acting: 100 }, contractDuration: 48, penalty: 80000 },
  { id: "aurora_ent", name: "极光文娱", desc: "综艺与直播双线发力，擅长制造话题与短期爆点。", bonus: { popularity: 120, charm: 8 }, perk: "综艺类通告人气收益 +15%", commission: 0.45, minPopularity: 280, contractDuration: 60, penalty: 120000 },
  { id: "tianqiong_film", name: "天穹影业", desc: "影剧项目储备深，重视长期培养与角色深度。", bonus: { acting: 15, money: 6000 }, perk: "影视类通告演技额外 +2", commission: 0.35, minStats: { acting: 80, charm: 60 }, contractDuration: 72, penalty: 150000 },
  { id: "independent", name: "个人工作室", desc: "自由度高，但需要自己承担风险。", bonus: { maxStamina: 20, money: 1000 }, perk: "无抽成，通告人气 +20%", commission: 0, contractDuration: 0, penalty: 0 },
];

export const BACKGROUNDS: Background[] = [
  { id: "rich_kid", name: "富家出身", desc: "资源不缺，开局更稳。", bonus: { money: 50000, charm: 10, popularity: 5 } },
  { id: "talent_show", name: "选秀回锅", desc: "拥有基础粉丝。", bonus: { popularity: 50, dancing: 10, singing: 10, money: 2000 } },
  { id: "drama_student", name: "科班毕业", desc: "演技起点更高。", bonus: { acting: 15, charm: 5 } },
  { id: "internet_creator", name: "短视频达人", desc: "镜头感与社媒适应快。", bonus: { appearance: 10, charm: 10, popularity: 30 } },
  { id: "ordinary_student", name: "普通学生", desc: "从零开始。", bonus: { money: 2000, maxStamina: 20 } },
  { id: "street_busker", name: "街头驻唱", desc: "舞台不大，但练出了现场控场力。", bonus: { singing: 12, charm: 8, popularity: 20 } },
  { id: "variety_intern", name: "综艺实习生", desc: "见过大场面，临场反应更快。", bonus: { charm: 10, popularity: 25, acting: 6 } },
  { id: "dance_club", name: "舞社主力", desc: "长期排练，动作完成度更高。", bonus: { dancing: 15, maxStamina: 10 } },
  { id: "radio_host", name: "校园主持", desc: "声音和表达稳定，台词更顺。", bonus: { singing: 8, acting: 10, charm: 3 } },
  { id: "model_parttime", name: "平面模特", desc: "上镜经验丰富，镜头感天然在线。", bonus: { appearance: 14, charm: 8 } },
  { id: "script_reader", name: "剧本爱好者", desc: "看本量大，理解角色更快。", bonus: { acting: 14, singing: 4, money: 1000 } },
  { id: "athlete_transfer", name: "体校转行", desc: "身体素质优秀，恢复更快。", bonus: { dancing: 10, maxStamina: 25, charm: 4 } },
  { id: "small_town_star", name: "小镇明星", desc: "在本地早有名气，粉丝盘稳定。", bonus: { popularity: 40, charm: 7, money: 3000 } },
  { id: "coser_creator", name: "COS创作者", desc: "人设塑造能力强，风格辨识度高。", bonus: { appearance: 9, acting: 10, popularity: 20 } },
  { id: "music_family", name: "音乐世家", desc: "从小受训，音准与节奏更扎实。", bonus: { singing: 16, charm: 2, money: 1500 } },
];

export const STARTING_BONUSES: StartingBonus[] = [
  { id: "gift_face", name: "天生神颜", desc: "上镜优势明显。", bonus: { appearance: 20, charm: 10 } },
  { id: "gift_actor", name: "戏感天成", desc: "角色理解力更强。", bonus: { acting: 20 } },
  { id: "gift_voice", name: "嗓音条件", desc: "声线稳定。", bonus: { singing: 20 } },
  { id: "gift_body", name: "舞台体能", desc: "体力更好。", bonus: { dancing: 15, maxStamina: 10 } },
  { id: "gift_lucky", name: "财运加成", desc: "开局更富裕。", bonus: { money: 10000 } },
  { id: "gift_camera", name: "镜头直觉", desc: "更快找到镜头与角度。", bonus: { appearance: 10, acting: 8 } },
  { id: "gift_rhythm", name: "节奏本能", desc: "节拍感优秀，舞台更稳。", bonus: { dancing: 10, singing: 8 } },
  { id: "gift_empathy", name: "共情天赋", desc: "情绪表达更有感染力。", bonus: { acting: 12, charm: 8 } },
  { id: "gift_social", name: "社交磁场", desc: "更容易建立人际信任。", bonus: { charm: 12, popularity: 15 } },
  { id: "gift_focus", name: "高专注力", desc: "训练效率更高，不易分心。", bonus: { acting: 8, singing: 8, dancing: 8 } },
  { id: "gift_endurance", name: "超长续航", desc: "长时间工作状态更稳定。", bonus: { maxStamina: 20, charm: 2 } },
  { id: "gift_brand", name: "商业嗅觉", desc: "更懂品牌表达与镜头需求。", bonus: { charm: 8, money: 5000 } },
  { id: "gift_story", name: "叙事体质", desc: "更容易被观众记住。", bonus: { popularity: 25, acting: 6 } },
  { id: "gift_discipline", name: "自律怪物", desc: "训练执行力拉满。", bonus: { dancing: 10, maxStamina: 10, charm: 2 } },
  { id: "gift_stage_aura", name: "舞台气场", desc: "站上舞台自带焦点。", bonus: { charm: 10, popularity: 20, appearance: 6 } },
];

export const getPlayerLevel = (player: Player): string => {
  const total = player.stats.appearance + player.stats.acting + player.stats.singing + player.stats.dancing + player.stats.charm;
  if (player.stats.popularity >= 8000 && total >= 700) return "顶流巨星";
  if (player.stats.popularity >= 2000 && total >= 480) return "炙手可热";
  if (player.stats.popularity >= 500 && total >= 320) return "小有名气";
  if (player.stats.popularity >= 100 && total >= 180) return "初露锋芒";
  return "潜力新星";
};

export const NPCS: Record<string, NPC> = {
  manager_lin: { id: "manager_lin", name: "林姐", title: "经纪主管", color: "text-blue-600", avatarSeed: "Aneka" },
  senior_chen: { id: "senior_chen", name: "陈星宇", title: "当红影帝", color: "text-amber-600", avatarSeed: "Jack" },
  rival_su: { id: "rival_su", name: "苏娜", title: "新人偶像", color: "text-rose-600", avatarSeed: "Jocelyn" },
  director_wang: { id: "director_wang", name: "王导", title: "知名导演", color: "text-emerald-600", avatarSeed: "Kingston" },
  idol_kris: { id: "idol_kris", name: "Kris", title: "顶流偶像", color: "text-purple-600", avatarSeed: "Alexander" },
  actress_lin: { id: "actress_lin", name: "林婉儿", title: "国民小花", color: "text-pink-600", avatarSeed: "Valentina" },
};

export const CHARACTER_PROFILES: Record<string, CharacterProfile> = {
  shen_mo: {
    bio: "伪佛系的清醒影帝",
    surface: `29岁，三金影帝，出道即巅峰，却在事业最盛时选择“半隐退”，只接小众剧本，不综艺、不炒作、不营业。干净利落的短发，发尾带着点自然卷，常穿洗得柔软的素色棉麻衬衫，袖口永远挽到小臂，露出腕间一块不起眼的旧手表（是他扶持的第一个新人导演送的）。待人温和却有距离感，采访时笑意浅浅，眼尾弯起却不抵达眼底，指尖总无意识摩挲手表表冠，被问起名利时只淡声答“够用就好”，活成圈内人人称羡的“佛系标杆”，却没人见过他独处时眼底的冷意。`,
    reversal: `看似对一切都无所谓，实则是圈内最清醒的“操盘手”——暗中对接新人导演，筛选优质剧本，用手里握着的半个娱乐圈黑料，不动声色打压恶意营销的资本，从不用来谋利，只守护纯粹的创作和在意的人。他对你的温和从不是偶然，是你进入娱乐圈后，第一次遭遇全网黑、连公司都想放弃你时，你仍公开为被恶意网暴的新人同事发声，那份纯粹撞进了他早已看透世事的眼底。他刻意靠近，想把你护在羽翼下，却又怕自己的“算计”弄脏你，只能假装漫不经心：递水时会先擦干净瓶身，走在你身边永远靠外侧，被你察觉关心时，会轻咳一声转移话题，耳尖却悄悄泛红。`,
    coreQuotes: [
      "（指尖转着钢笔，笑意渐渐淡去，眼神沉下来，却藏着不易察觉的认真）“我不是佛系，是懒得应付那些烂人烂事，没必要弄脏自己。”",
      "（身体微微前倾，声音压得极低，气息拂过你的耳畔，带着一丝无措的紧张）“但你不一样，我不想让你受半分委屈，哪怕要我亲手弄脏自己，也没关系。”",
    ],
    tags: ["影帝", "清醒", "克制", "操盘手", "守护"],
    image: shenMoImage,
  },
  lu_xingran: {
    bio: "阳光假面下的病娇顶流",
    surface: `22岁，顶流男团C位，粉丝破亿，台上是活力四射的舞台王者，wave卡点精准，笑起来有浅浅的梨涡，眼尾微微上挑，自带撩感，会主动弯腰和粉丝击掌，对工作人员轻声说“谢谢”，被称为“内娱活人天花板”。镜头前永远元气满满，眼里的光像淬了星光，全网都夸他“干净纯粹，没被圈子污染”，连路透图里，都是笑着帮工作人员搬东西的样子。`,
    reversal: `私下里极度缺乏安全感，占有欲刻进骨子里，手机屏保是你未公开的路透图，解锁密码是你的生日，相册里存满你的照片和视频，连你发过的朋友圈截图都按日期分类存好。你们相识于你进入娱乐圈后的一场拼盘演出，他在后台看到你认真练歌的样子，瞬间被吸引，把你当成唯一的救赎，偏执地想把你牢牢抓在手里。他会偷偷跟着你，看着你和别人说话时，指尖会无意识攥紧衣角，指节泛白，过后会假装偶遇，笑着问你“刚才在和谁聊天呀”，眼神里藏着不易察觉的敌意。你随口提过的东西，他会悄悄买来放在你身边，却说是“粉丝送的，用不上”；你和异性多说两句话，他会委屈巴巴地黏着你，眼底泛红，却不敢发脾气，只敢小声问“姐，你是不是不喜欢我了”。`,
    coreQuotes: [
      "（笑着揉你的头发，指尖轻轻蹭过你的发顶，语气依旧阳光，眼底却藏着偏执的暗流）“姐，你今天和他说话了哦，说了好久呢。”",
      "（顿了顿，指尖轻轻捏住你的下巴，力道很轻，却带着不容挣脱的执着，声音软下来，带着委屈）“以后别理他好不好？我只有你了，别丢下我。”",
    ],
    tags: ["顶流", "病娇", "占有欲", "偏执", "救赎依赖"],
    image: luXingranImage,
  },
  liu_mengyao: {
    bio: "黑料缠身的狠辣经纪人",
    surface: `31岁，金牌经纪人，手握顶流资源，却也是圈内争议最大的经纪人——黑料缠身，被传“打压艺人”“买水军撕资源”“背后捅刀同行”，圈内人见了她，要么点头哈腰，要么避之不及。永远是一身剪裁利落的黑色西装，妆容冷艳，红唇衬得肤色愈发白皙，眉峰锋利，眼神锐利如刀，说话一针见血，没有多余的废话，只要是她认定的资源，就算不择手段也要拿到手，谈判时坐姿挺拔，指尖会轻轻敲击桌面，气场强大到让人不敢直视。`,
    reversal: `她的“狠辣”全是被逼出来的——当年带的第一个艺人，是个和你一样纯粹的小姑娘，被资本逼迫潜规则，不肯妥协就被恶意打压，最后抑郁自杀，她抱着艺人冰冷的身体，在停尸间哭了一整夜，发誓再也不会让自己的艺人受委屈。那些黑料，一半是同行泼的脏水，一半是她故意放出去的“保护色”，只有足够“狠”，才能在这个圈子里站稳脚跟，护得住身边的人。你进入娱乐圈后，凭借一份试镜片段被她看中，她力排众议签下你，成了你的经纪人，对你极致护短。私下里会偷偷给你煮红糖水，怕你嫌甜，会提前尝一口调整甜度；你熬夜拍戏时，她会默默守在片场，怀里揣着暖宝宝，等你休息时，悄悄放在你手里，嘴上却骂“别冻着，耽误拍戏进度”；她的包里永远装着创可贴，知道你拍戏容易磕伤，却从不说“特意给你带的”，只在你受伤时，皱着眉帮你处理，指尖动作轻柔得不像平时的她。`,
    coreQuotes: [
      "（对着想潜规则你的资本，眼神冰冷，语气狠戾，指尖敲击桌面，每一下都像敲在人心上）“想动我的艺人，先问问我手里的东西答应不答应，你有胆子，就试试。”",
      "（转身看向你，眼神瞬间柔和下来，伸手轻轻擦掉你脸上的泪痕，指尖带着微凉的温度，声音压得很低，带着心疼）“别怕，有我在，天塌不下来，我不会让任何人欺负你。”",
    ],
    tags: ["经纪人", "狠辣", "护短", "强势", "保护欲"],
    image: liuMengyaoImage,
  },
  su_tangtang: {
    bio: "甜妹外壳的隐忍猎手",
    surface: `23岁，选秀出道的甜妹歌手，说话自带软乎乎的嗲音，尾音轻轻上扬，脸上总挂着甜甜的笑容，苹果肌饱满，笑起来会露出两颗小小的虎牙。舞台上擅长唱可爱风歌曲，会比心、wink，偶尔忘词会吐吐舌头，一副慌乱又可爱的样子，是粉丝眼里的“甜度天花板”。看似没心没肺，一点小事就会红眼眶，对谁都掏心掏肺，别人稍微对她好一点，就会真诚地道谢，一副很好拿捏的软萌模样。`,
    reversal: `她是为了寻找失踪的姐姐才进入娱乐圈——姐姐曾是圈内小有名气的歌手，嗓音清澈，却因拒绝资本潜规则，被恶意打压、网暴，最后离奇失踪，连尸骨都没找到。她刻意伪装成软萌甜妹，降低所有人的戒心，暗中调查姐姐失踪的真相，收集资本作恶的证据，手机里存着姐姐的歌曲，每次夜深人静时，都会戴着耳机反复听，眼底的脆弱藏都藏不住。你们相识于选秀训练营，她是你在圈内唯一愿意信任的人，她见你被其他练习生刁难时出手相助，从此对你产生真心依赖。她的眼泪大多是装的，只有在看到姐姐的旧发夹、旧唱片时，才会真正红眼眶，悄悄抹眼泪，不敢让别人看到。她会偷偷把你说过的话记在小本本上，会在你不开心时，笨拙地给你讲笑话，哪怕自己都觉得不好笑。`,
    coreQuotes: [
      "（对着镜头比心，笑容甜得发腻，眼底却藏着一丝不易察觉的疏离）“谢谢大家喜欢甜甜的糖糖～糖糖会一直给大家唱好听的歌哦～”",
      "（私下里，攥着姐姐的旧发夹，指尖泛白，声音压得很低，带着抑制不住的哽咽）“我不是真的傻，那些虚情假意我都懂，等我找到真相，那些伤害过姐姐的人，我一个都不会放过。”",
      "（转头看向你，眼眶泛红，却挤出甜甜的笑容，轻轻拽住你的衣角，声音软乎乎的）“还好有你，不然我真的撑不下去了，予墨姐，你不要丢下我好不好？”",
    ],
    tags: ["甜妹", "隐忍", "调查", "依赖", "执念"],
    image: suTangtangImage,
  },
  gu_chengyan: {
    bio: "温和假面的白切黑巨鳄",
    surface: `33岁，顾氏集团CEO，横跨地产、金融、文娱的商业巨鳄，永远穿着高定西装，领口系着平整的领带，腕间的百达翡丽低调奢华，气质温和，待人谦和，说话语速平缓，永远带着恰到好处的笑意，哪怕被人刁难，也能从容应对，从不发脾气。公益缠身，经常出席慈善活动，给贫困山区捐学校、捐物资，是外界眼中“有责任、有担当”的企业家，连媒体都称赞他“温文尔雅，格局宏大”。`,
    reversal: `骨子里是极度冷漠的“利益至上”者，商业谈判时手段狠辣，从不留余地，那些公益和温和，都是他用来包装自己、拉拢人脉的工具。他习惯了算计一切，连感情都被他当成博弈的筹码，你进入娱乐圈后，凭借一部小成本作品爆火，引起了他的注意——你是他对手公司力捧的艺人，拉拢你，就能打击对手，甚至能借着你的热度，拓展文娱板块的业务。你们相识于一场商业晚宴，他主动向你递出橄榄枝，可相处中，却慢慢被你的纯粹打动——你会为了一句粉丝的鼓励认真练歌，会为了帮素不相识的工作人员解围得罪人，那些他早已丢失的纯粹，在你身上体现得淋漓尽致。他开始失控，一边想利用你达成目的，一边又忍不住护着你，看到你被网暴时，会下意识地让人压下黑料，过后又会懊恼自己的“不理智”；给你资源时，会假装是“商业合作”，却偷偷给你避开所有有潜规则风险的项目，陷入自我拉扯的困局。`,
    coreQuotes: [
      "（端起咖啡，指尖轻轻摩挲杯壁，笑意温和，语气带着商人的试探）“我很欣赏你的才华，愿意给你最好的资源，前提是，你要站在我这边，帮我做一件事。”",
      "（看着你犹豫的眼神，眼底闪过一丝慌乱，语气瞬间软下来，褪去所有算计，带着一丝无措）“对不起，我……我不是故意要利用你，我只是……控制不住想靠近你，不想失去你。”",
    ],
    tags: ["总裁", "白切黑", "利益至上", "失控", "拉扯"],
    image: guChengyanImage,
  },
  lin_yu: {
    bio: "温柔偏执的青梅医生",
    surface: `27岁，三甲医院外科骨干，长相帅气，眉眼温和，戴着一副细框眼镜，气质干净，永远穿着熨烫平整的白大褂，身上带着淡淡的消毒水味道，却不刺鼻。对待患者耐心细致，会温柔地讲解病情，哪怕被患者误解，也从不发脾气，是医院里的“万人迷”，护士和患者都喜欢他。对你始终保持着青梅竹马的温柔，会记得你所有的喜好——不吃香菜，怕黑，生理期会痛经，会在你需要时随叫随到，给你送药、送吃的，语气温柔得能滴出水来。`,
    reversal: `他的温柔里藏着极致的偏执，这份偏执源于小时候的意外——你差点被人拐走，他为了救你，被拐子推倒在地，摔断了腿，留下了永久性的疤痕，从此再也不能剧烈运动。从那以后，他就产生了“只有我能保护你”的执念，觉得只有待在他身边，你才是安全的。他偷偷给你准备“安神药”（其实是维生素），美其名曰“帮你改善睡眠”，看着你乖乖吃下，眼底会闪过一丝满足；会趁你不注意，偷偷删掉你手机里的异性联系方式，过后又会假装无辜，说“可能是手机卡了，不小心删掉的”；你和别人出去时，他会悄悄跟在你身后，保持不远不近的距离，看到你安全，才会放心离开。他怕你离开他，怕你不再需要他，只能用这种极端的方式，把你留在身边，哪怕你会觉得他偏执，他也舍不得放手。`,
    coreQuotes: [
      "（把药递给你，指尖轻轻碰了碰你的手背，语气温柔得不像话）“最近拍戏累，睡眠肯定不好，把这个吃了，能睡个好觉，别硬扛着。”",
      "（看着你乖乖吃下，眼底闪过一丝满足，伸手轻轻揉了揉你的头发，声音轻轻的，带着一丝卑微的祈求）“别离开我好不好？没有我，你会受伤害的，我只有你了。”",
    ],
    tags: ["医生", "青梅", "偏执", "守护", "占有"],
    image: linYuImage,
  },
  zhou_yan: {
    bio: "桀骜不驯的嘴硬电竞天才",
    surface: `21岁，KPL四届冠军中单，游戏ID“野火”，直播时桀骜不驯，骚话连篇，操作犀利，每一次五杀都会对着镜头挑眉，语气拽拽的：“就这？还敢来跟我叫板？”面对粉丝的追捧从不谦虚，甚至会怼黑粉“菜就别逼逼”，一副“老子天下第一”的刺头模样。染着一头张扬的浅棕色头发，耳上戴着银色耳钉，穿oversize的潮牌，走路时抬头挺胸，自带拽酷气场，是电竞圈出了名的“天才选手”，也是无数电竞少女的梦中情人。`,
    reversal: `看似张扬，实则内心敏感脆弱，从小被父母否定，觉得他打游戏是不务正业，每次他拿到冠军，想和父母分享时，得到的都是“玩物丧志”的指责。只有在游戏里，他才能找到成就感，才能证明自己不是“废物”，他的“拽”是保护自己的外壳，害怕被人看不起，害怕付出真心被伤害。你们相识于你进入娱乐圈后的一次跨界合作（拍摄电竞主题短片），你在片场看他训练时，随口说了一句“你打得很棒”，这句话被他记了三年。他喜欢你，却从不敢直白表达，只会用别扭的方式关心你——偷偷给你打游戏账号充钱，看到你段位提升，会偷偷开心好久；你被网暴时，他会用小号帮你怼人，怼完又会怕被你发现，赶紧删掉记录；你生病时，他笨拙地买一堆药，却嘴硬说是“顺手买的，没人吃浪费”，递药时眼神躲闪，耳尖红得快要滴血，连说话都变得结巴。`,
    coreQuotes: [
      "（直播时，对着镜头挑眉，语气拽拽的，操作行云流水）“就这操作？也敢来跟我叫板？纯属找虐！”",
      "（私下里，把药塞到你手里，眼神躲闪，不敢看你，语气别扭，却藏着一丝关心）“喂，别死撑着，赶紧吃药，耽误我带你打游戏，我可不想带一个病秧子。”",
      "（顿了顿，声音变小，耳尖泛红，几乎要听不见）“我……我才不是担心你，别多想。”",
    ],
    tags: ["电竞", "嘴硬", "天才", "敏感", "别扭关心"],
    image: zhouYanImage,
  },
  jiang_muci: {
    bio: "帅糙呆系忠犬保镖",
    surface: `27岁，你的专属保镖，身形魁梧结实，肩背宽阔如松，常年穿洗得发白的黑色工装服，袖口卷到小臂，露出布满老茧和浅疤的双手（是早年做安保、练格斗留下的）。短发剪得利落，发梢带着点随性的弧度，轮廓深邃硬朗，眉眼锋利却不狰狞，自带帅气粗粝感，是那种一眼看过去就不好惹的帅。说话声音粗哑低沉，自带磁性，不擅长表达，大多时候只会说“好”“不行”“小心”，走路步伐沉稳，自带生人勿近的糙汉气场。看起来大大咧咧，甚至有点粗犷，连递东西都显得笨拙，经常不小心碰掉你的小物件，却会立刻手足无措地捡起来，耳根泛红，反差感拉满。`,
    reversal: `他虽长着一张帅气凌厉的糙汉脸，内里却是个实打实的呆子，迟钝又纯情，不懂人情世故，却把“保护你”刻进了骨子里。你进入娱乐圈后，柳梦瑶为了你的安全，特意筛选了经验丰富的他做你的专属保镖，你们从此相识。他没什么文化，不会说好听的情话，却会用最笨拙的方式记住你所有的喜好：你怕黑，他就默默跟在你身后，高大的身影映在灯光下，哪怕你嫌他烦，也不离开，只敢用粗哑的声音小声说“我守着你”；你拍戏磕伤，他慌得手忙脚乱，翻遍口袋找不到创可贴，急得满头大汗，最后笨拙地用自己干净的袖口给你擦伤口，眼神里满是慌张和自责。他对感情极度迟钝，你对他笑一下，他能偷偷开心一整天，耳根红透，却不知道自己早已动心；别人调侃他对你不一样，他会涨红着脸反驳“我只是在执行任务”，转身却忍不住偷偷嘴角上扬，帅气的脸上藏不住纯情。他的“呆”不是傻，是纯粹的执着，认定了要护着你，就会拼尽全力，哪怕自己受委屈，也从不会让你受半分伤害。`,
    coreQuotes: [
      "（你拍戏磕伤，他慌得手足无措，指尖微微发抖，笨拙地用袖口给你擦伤口，粗哑的声音里满是紧张和自责）“对、对不起，我没看好你……都怪我。”",
      "（你笑着安慰他，他愣了愣，耳根瞬间涨红，帅气的脸上泛起红晕，挠了挠头，语气笨拙却坚定）“我、我以后一定更小心，不会再让你受伤了。”",
      "（顿了顿，又补充一句，声音小得像蚊子叫）“你……你别嫌我笨就行。”",
    ],
    tags: ["保镖", "忠犬", "糙汉", "纯情", "守护"],
    image: jiangMuciImage,
  },
  ji_mingxuan: {
    bio: "毒舌编剧的破镜执念",
    surface: `28岁，鬼才编剧，戴着黑框眼镜，镜片后的眼神锐利，性格孤僻，不喜欢社交，常年待在工作室里写剧本。毒舌刻薄，对剧本要求极致苛刻，不管是演员还是导演，只要达不到他的要求，都会被他骂得狗血淋头，说话毫不留情。尤其对你，更是毒舌加倍——“你这演技烂得像木头，连基本的情绪都演不出来”“连台词都念不明白，还好意思当演员”，每次你拍戏NG，他都会皱着眉，语气刻薄地指责你，仿佛你做什么都是错的，从来不会给你留一点情面。`,
    reversal: `他性格孤僻，不喜欢社交，常年待在工作室里写剧本，毒舌刻薄的性子让圈内人又爱又怕。你进入娱乐圈后，凭借出色的试镜表现，拿下了他笔下某部剧本的女主角，你们从此相识。他被你身上的特质深深吸引——说话前会下意识咬嘴唇，难过时会拼命吃东西，这些细节都被他悄悄写进剧本里。他的抽屉里，藏着无数个为你量身写的剧本废稿，每一页都藏着他不敢言说的心动，却从来不敢让你知道，怕这份隐秘的心意会影响你拍戏，也怕被你拒绝。那些毒舌的指责，其实是想让你变得更好，是想让你更贴合他笔下的角色，更是想让你多陪他一会儿，哪怕是以被你讨厌的方式。他看似对你百般挑剔，实则在背后默默为你修改台词、调整戏份，帮你避开圈内的坑。`,
    coreQuotes: [
      "（看着你NG的片段，皱着眉，语气刻薄，眼神里却藏着一丝不易察觉的着急）“就这水平，也配演我写的剧本？连基本的情绪都抓不住，赶紧滚去练，别浪费我的时间！”",
      "（你转身要走，他却下意识地伸手拉住你，指尖微微颤抖，语气瞬间软下来，眼底泛红，带着一丝无措的慌乱）“别走……我只是……只是想让你把角色演好，不是故意要骂你的。”",
    ],
    tags: ["编剧", "毒舌", "执念", "口是心非", "守护"],
    image: jiMingxuanImage,
  },
};

export const CHARACTER_PROFILE_IMAGES: Record<string, string> = {
  shen_mo: shenMoImage,
  liu_mengyao: liuMengyaoImage,
  su_tangtang: suTangtangImage,
  gu_chengyan: guChengyanImage,
  lin_yu: linYuImage,
  ji_mingxuan: jiMingxuanImage,
  lu_xingran: luXingranImage,
  zhou_yan: zhouYanImage,
  jiang_muci: jiangMuciImage,
};

export const SOCIAL_USERS: SocialUser[] = [
  { id: "senior_chen", name: "陈星宇", avatar: "Jack", title: "当红影帝", isVerified: true, followers: 5000000, personality: "高冷专业", stats: { acting: 180, charm: 150, popularity: 5000, appearance: 140 } },
  { id: "rival_su", name: "苏娜", avatar: "Jocelyn", title: "新人偶像", isVerified: true, followers: 800000, personality: "元气甜妹", stats: { acting: 60, singing: 80, dancing: 90, charm: 120, popularity: 800, appearance: 130 } },
];

export const MOCK_POSTS: SocialPost[] = [
  { id: "post_chen_1", authorId: "senior_chen", content: "新戏杀青，感谢大家支持。", likes: 120000, comments: ["辛苦了！", "期待新作！"], timestamp: { year: 1, month: 1, week: 1 }, type: "text" },
  { id: "post_su_1", authorId: "rival_su", content: "今天练习很充实。", likes: 5000, comments: ["加油！"], timestamp: { year: 1, month: 1, week: 1 }, type: "text" },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "achieve_intro",
    name: "初出茅庐",
    desc: "完成新手剧情，正式踏入娱乐圈。",
    reward: { money: 1000, maxStamina: 10 },
    condition: (_player, completedEvents) => completedEvents.includes("intro"),
  },
  {
    id: "ach_first_job",
    name: "初次登场",
    desc: "完成第一份通告。",
    reward: { popularity: 5, charm: 2 },
    condition: (player) => player.jobsCompleted >= 1,
  },
  {
    id: "achieve_famous",
    name: "小有名气",
    desc: "人气达到 100，开始拥有自己的粉丝群。",
    reward: { charm: 10, appearance: 5 },
    condition: (player) => player.stats.popularity >= 100,
  },
  {
    id: "achieve_rookie",
    name: "最佳新人",
    desc: "获得一次重要试镜机会并成功。",
    reward: { acting: 20, popularity: 50 },
    condition: (_player, completedEvents) => completedEvents.includes("director_audition"),
  },
  {
    id: "achieve_millionaire",
    name: "百万富翁",
    desc: "个人资产达到 100,000，实现财务自由第一步。",
    reward: { popularity: 20, charm: 10 },
    condition: (player) => player.money >= 100000,
  },
  {
    id: "achieve_acting_master",
    name: "演技大赏",
    desc: "演技达到 150，足以驾驭复杂角色。",
    reward: { popularity: 50, charm: 20 },
    condition: (player) => player.stats.acting >= 150,
  },
  {
    id: "achieve_singing_master",
    name: "天籁之音",
    desc: "唱功达到 150，你的声音开始拥有辨识度。",
    reward: { popularity: 50, charm: 20 },
    condition: (player) => player.stats.singing >= 150,
  },
  {
    id: "achieve_dancing_master",
    name: "舞动全场",
    desc: "舞蹈达到 150，舞台表现力显著提升。",
    reward: { popularity: 50, charm: 20 },
    condition: (player) => player.stats.dancing >= 150,
  },
  {
    id: "achieve_visual_king",
    name: "神颜降临",
    desc: "颜值达到 150，镜头表现近乎无死角。",
    reward: { popularity: 50, charm: 30 },
    condition: (player) => player.stats.appearance >= 150,
  },
  {
    id: "achieve_collector",
    name: "时尚弄潮儿",
    desc: "拥有衣橱中的全部基础服装。",
    reward: { appearance: 10, charm: 10 },
    condition: (player) => player.inventory.length >= 4,
  },
  {
    id: "achieve_rival_win",
    name: "竞争胜利",
    desc: "在一次关键竞争中战胜对手。",
    reward: { popularity: 100, charm: 20 },
    condition: (_player, completedEvents) =>
      completedEvents.includes("rival_audition_win") || completedEvents.includes("award_win"),
  },
  {
    id: "achieve_superstar",
    name: "巨星之路",
    desc: "综合实力突破高位（全属性 100+，人气 500+）。",
    reward: { money: 100000, maxStamina: 50 },
    condition: (player) =>
      player.stats.popularity >= 500 &&
      player.stats.acting >= 100 &&
      player.stats.singing >= 100 &&
      player.stats.dancing >= 100 &&
      player.stats.appearance >= 100 &&
      player.stats.charm >= 100,
  },
];
export const RANDOM_EVENTS: RandomEvent[] = [];
export const STORY_EVENTS: StoryEvent[] = [];

export const LOCATIONS: { id: LocationId; name: string; icon: string }[] = [
  { id: "home", name: "我的小屋", icon: "Home" },
  { id: "company", name: "经纪公司", icon: "Building2" },
  { id: "city", name: "周边外出", icon: "Map" },
  { id: "jobs", name: "通告大厅", icon: "Briefcase" },
  { id: "schedule", name: "行程安排", icon: "ListTodo" },
  { id: "wardrobe", name: "衣橱", icon: "Shirt" },
  { id: "trophy", name: "荣誉", icon: "Trophy" },
  { id: "quests", name: "任务", icon: "ClipboardList" },
  { id: "social", name: "社交", icon: "Smartphone" },
  { id: "contacts", name: "手机/联系人", icon: "Smartphone" },
];

export const LOCATION_BUFF_LIBRARY: LocationBuff[] = [
  { id: "quiet_library", name: "静谧图书馆", desc: "木质书架连成拱廊，纸张的陈香在安静空气里缓慢漂浮，翻页声像潮汐一样轻微起落。你坐在角落灯下，能把台词里的每个停顿都听见。", buff: { actingRate: 0.2 } },
  { id: "midnight_izakaya", name: "深夜居酒屋", desc: "玻璃门上凝着水汽，雾气与暖灯把夜色熬成温软的琥珀色，杯沿轻碰与低声交谈混在一起。最适合在半醉半醒间碰见真心话。", buff: { favorRate: 0.15 } },
  { id: "cbd_rooftop", name: "CBD 顶层露台", desc: "风从高楼缝隙卷过，俯瞰整座城市的野心像霓虹一样铺开。每一盏灯都像一个未兑现的名字，而你站在天际线边缘练习发声。", buff: { popularityRate: 1 } },
  { id: "retro_film_house", name: "复古放映厅", desc: "幕布前尘埃在光柱里缓慢旋转，胶片机转动的细碎噪音像心跳。黑白影像把情绪拉得很长，适合拆解表演的呼吸与镜头距离。", buff: { actingRate: 0.12 } },
  { id: "dance_basement", name: "镜面地下练舞室", desc: "低频鼓点震得地板发烫，镜墙里每个动作都被放大，汗水沿着下颌砸在木地板上。你能看清自己每一次迟疑，也能修正每一次发力。", buff: { charmRate: 0.1, popularityRate: 0.1 } },
  { id: "recording_loft", name: "阁楼录音棚", desc: "吸音棉把喧嚣隔绝在门外，耳机里只剩呼吸与齿音。凌晨三点的高音区像薄冰，你在一次次重录中把情绪压进尾音。", buff: { reputationRate: 0.08, popularityRate: 0.05 } },
  { id: "old_hospital_corridor", name: "旧院走廊", desc: "消毒水味和夜班灯管的嗡鸣交叠，走廊尽头的自动门反复开合。这里的安静不是温柔，是让人直面脆弱与真实。", buff: { favorRate: 0.1, staminaRecover: 10 } },
  { id: "harbor_boardwalk", name: "港湾木栈道", desc: "潮风带着盐粒刮过脸颊，远处船灯在水面拖出细长反光。你在海风里背台词，声音被浪打碎又重组，反而更有层次。", buff: { actingRate: 0.1, charmRate: 0.08 } },
  { id: "brand_showroom", name: "品牌陈列馆", desc: "香氛与冷白灯把空间切成利落几何，镜面橱窗里每个站姿都像商业提案。你学会在三秒内把人设递到镜头面前。", buff: { moneyRate: 0.12, popularityRate: 0.08 } },
  { id: "night_radio_room", name: "深夜电台室", desc: "红灯亮起后只剩麦克风和你，窗外城市噪音像被棉布包住。你对着陌生人的故事练习情绪落点，声音开始有了抓人的温度。", buff: { reputationRate: 0.12 } },
  { id: "studio_backlot", name: "片场后场巷道", desc: "道具车与线缆把狭窄通道切得拥挤，工作人员跑动时带起热风和尘土。这里没有主角光环，只有真实的节奏与抗压。", buff: { actingRate: 0.08, staminaRecover: 5 } },
  { id: "fashion_archive", name: "时装档案室", desc: "奶油色布帘垂到地面，衣架编号像一部部未开拍的角色小传。你在面料与廓形里挑选气质，风格和人设开始彼此咬合。", buff: { charmRate: 0.18 } },
  { id: "esports_box", name: "电竞观赛包厢", desc: "屏幕蓝光把脸映成冷色，解说声和键盘敲击像连发鼓点。你学会在高压节奏里保持判断，临场反应被磨得更锋利。", buff: { popularityRate: 0.12, reputationRate: 0.05 } },
  { id: "charity_gallery", name: "公益影像展", desc: "照片墙前人群安静驻足，叙述文字像缓慢落下的雨。你在镜头外看到真实世界的重量，表达不再只是技巧，而是立场。", buff: { reputationRate: 0.2 } },
  { id: "sunrise_track", name: "晨雾跑道", desc: "天色未亮，呼吸在冷空气里化成白雾，鞋底与跑道摩擦出均匀节拍。体能被拉满后，你在镜头前的稳定度也随之上涨。", buff: { staminaRecover: 20, actingRate: 0.05 } },
];

export const ACTIONS: Record<string, Action[]> = {
  home: [
    { id: "rest", name: "休息", desc: "恢复大量体力", cost: { stamina: 0, money: 0 }, effect: { stamina: 40 }, time: 1 },
    { id: "hometown", name: "回老家", desc: "回家放松，恢复体力", cost: { stamina: 0, money: 0 }, effect: { stamina: 35, charm: 1 }, time: 1 },
    { id: "read", name: "研读剧本", desc: "提升演技", cost: { stamina: 15, money: 0 }, effect: { acting: 2, charm: 1 }, time: 1 },
    { id: "sing", name: "练习声乐", desc: "提升唱功", cost: { stamina: 15, money: 0 }, effect: { singing: 2, charm: 1 }, time: 1 },
    { id: "dance", name: "练习舞蹈", desc: "提升舞蹈", cost: { stamina: 15, money: 0 }, effect: { dancing: 2, charm: 1 }, time: 1 },
    { id: "social_media_run", name: "社交媒体营业", desc: "70%美照出圈，30%黑粉抬杠。", cost: { stamina: 10, money: 0 }, effect: {}, time: 1 },
    { id: "spa_glow", name: "沉浸式护肤 SPA", desc: "消耗金钱与体力，获得[容光焕发]：下一次通告收益 +15%。", cost: { stamina: 20, money: 3000 }, effect: {}, time: 1 },
    { id: "home_esports", name: "宅家打电竞", desc: "恢复状态，20%撞车职业选手触发隐藏提升。", cost: { stamina: 15, money: 0 }, effect: {}, time: 1 },
    { id: "fan_letter", name: "阅读粉丝手写信", desc: "每 3 日限 1 次，恢复心情并提升魅力。", cost: { stamina: 0, money: 0 }, effect: {}, time: 1 },
  ],
  company: [
    { id: "class_act", name: "高级表演课", desc: "大幅提升演技", cost: { stamina: 20, money: 500 }, effect: { acting: 5 }, time: 1 },
    { id: "class_sing", name: "高级声乐课", desc: "大幅提升唱功", cost: { stamina: 20, money: 500 }, effect: { singing: 5 }, time: 1 },
    { id: "class_dance", name: "高级舞蹈课", desc: "大幅提升舞蹈", cost: { stamina: 20, money: 500 }, effect: { dancing: 5 }, time: 1 },
    { id: "manager", name: "拜访经纪人", desc: "可能提升魅力与声望", cost: { stamina: 10, money: 0 }, effect: { charm: 2 }, time: 1 },
    { id: "camera_expression", name: "镜头表情管理", desc: "强化镜头感与魅力控制", cost: { stamina: 18, money: 800 }, effect: { charm: 4, acting: 2 }, time: 1 },
    { id: "public_speaking", name: "媒体发言训练", desc: "提升声望稳定度与临场表达", cost: { stamina: 16, money: 700 }, effect: { reputation: 4, charm: 2 }, time: 1 },
    { id: "variety_improv", name: "综艺即兴反应课", desc: "提升综艺感与人气增长速度", cost: { stamina: 20, money: 1000 }, effect: { popularity: 6, charm: 2 }, time: 1 },
    { id: "business_negotiation", name: "商务谈判模拟", desc: "训练报价与合作沟通能力", cost: { stamina: 12, money: 1200 }, effect: { money: 1200, reputation: 2 }, time: 1 },
    { id: "script_table_read", name: "剧本围读会", desc: "提升人物理解与台词节奏", cost: { stamina: 18, money: 600 }, effect: { acting: 4, singing: 1 }, time: 1 },
    { id: "brand_image_workshop", name: "品牌形象工作坊", desc: "强化商业形象与受众记忆点", cost: { stamina: 14, money: 900 }, effect: { appearance: 3, popularity: 4 }, time: 1 },
  ],
  city: [
    { id: "hospital_visit", name: "去医院复诊", desc: "恢复体力，提升声望", cost: { stamina: 0, money: 600 }, effect: { stamina: 25, reputation: 2 }, time: 1 },
    { id: "salon", name: "高级沙龙", desc: "提升颜值", cost: { stamina: 10, money: 1000 }, effect: { appearance: 5 }, time: 1 },
    { id: "shopping", name: "购买私服", desc: "提升魅力", cost: { stamina: 10, money: 1500 }, effect: { charm: 6 }, time: 1 },
    { id: "busking", name: "街头表演", desc: "赚取少量金钱和人气", cost: { stamina: 25, money: 0 }, effect: { popularity: 2, money: 200, singing: 1 }, time: 1 },
    { id: "park", name: "公园散步", desc: "放松心情，恢复少量体力", cost: { stamina: 0, money: 0 }, effect: { stamina: 15 }, time: 1 },
  ],
};

export const JOBS: Job[] = [
  {
    id: "summer_starlight_festival",
    name: "夏日星光盛典",
    type: "大型舞台综艺",
    desc: "海滨露天舞台与万人观众同频，直播镜头无死角追着你跑。只要在一首歌里稳住呼吸与台风，就能把名字钉进热搜。",
    description: "海滨露天舞台与万人观众同频，直播镜头无死角追着你跑。只要在一首歌里稳住呼吸与台风，就能把名字钉进热搜。",
    roleName: "开场主舞台嘉宾",
    req: { dancing: 35, charm: 25 },
    requirements: { dancing: 35, charm: 25 },
    cost: { stamina: 35 },
    reward: { money: 6000, popularity: 40 },
    time: 1,
    category: "综艺",
    tags: ["舞台", "直播", "热度战"],
  },
  {
    id: "starlight_trainee_s2",
    name: "星光练习生·第二季",
    type: "选秀综艺",
    desc: "封闭训练营里，每一次考核都带着淘汰名单。你要在唱跳和情绪管理之间找平衡，扛住镜头和舆论的双重审判。",
    description: "封闭训练营里，每一次考核都带着淘汰名单。你要在唱跳和情绪管理之间找平衡，扛住镜头和舆论的双重审判。",
    roleName: "A班挑战位",
    req: { singing: 60, dancing: 60 },
    requirements: { singing: 60, dancing: 60 },
    cost: { stamina: 45 },
    reward: { money: 12000, popularity: 80 },
    time: 1,
    category: "综艺",
    tags: ["选秀", "成团", "练习生"],
    ipGroup: "xingguang_trainee",
  },
  {
    id: "sheng_tang_jin_xiu_zhi",
    name: "盛唐·锦绣志",
    type: "古装剧",
    desc: "恢弘宫城与权谋线并行的大体量项目，你要在文戏里藏刀，在武戏里守住人物命运。每场对手戏都在决定你是不是下一个爆款脸。",
    description: "恢弘宫城与权谋线并行的大体量项目，你要在文戏里藏刀，在武戏里守住人物命运。每场对手戏都在决定你是不是下一个爆款脸。",
    roleName: "盛唐郡主",
    req: { acting: 120, popularity: 200 },
    requirements: { acting: 120, popularity: 200 },
    cost: { stamina: 80 },
    reward: { money: 100000, popularity: 300, stats: { acting: 10 } },
    time: 4,
    category: "影视",
    tags: ["古装", "权谋", "大IP"],
  },
  { id: "extra", name: "跑龙套", type: "剧组日结", desc: "在古装剧里做有镜头调度的背景演员，台词不多但机位密集，考验走位与现场反应。", description: "在古装剧里做有镜头调度的背景演员，台词不多但机位密集，考验走位与现场反应。", roleName: "集市路人甲", req: { acting: 10 }, requirements: { acting: 10 }, cost: { stamina: 30 }, reward: { money: 800, popularity: 2 }, time: 1, category: "影视", tags: ["新人", "入门"] },
  { id: "commercial_local", name: "地方台广告", type: "广告", desc: "预算不高但投放密集的地方品牌广告，要求亲和力稳定，镜头里要让观众迅速记住你。", description: "预算不高但投放密集的地方品牌广告，要求亲和力稳定，镜头里要让观众迅速记住你。", roleName: "城市代言面孔", req: { appearance: 30, charm: 20 }, requirements: { appearance: 30, charm: 20 }, cost: { stamina: 30 }, reward: { money: 3000, popularity: 10 }, time: 1, category: "广告", tags: ["民生品牌", "亲和"] },
  { id: "idol_stage", name: "偶像打歌舞台", type: "综艺舞台", desc: "节目录制节奏极快，彩排与正录间隔不足一小时，你要在高强度切换中保持台风和表情管理。", description: "节目录制节奏极快，彩排与正录间隔不足一小时，你要在高强度切换中保持台风和表情管理。", roleName: "合作舞台嘉宾", req: { dancing: 40, appearance: 20 }, requirements: { dancing: 40, appearance: 20 }, cost: { stamina: 40 }, reward: { money: 2000, popularity: 15 }, time: 1, category: "综艺", tags: ["舞台", "唱跳"] },
  { id: "movie_support", name: "电影配角", type: "院线电影", desc: "在主线冲突里承担关键转折，戏份不多却决定观众情绪走向。导演只给三次机会，稳定度就是你的门票。", description: "在主线冲突里承担关键转折，戏份不多却决定观众情绪走向。导演只给三次机会，稳定度就是你的门票。", roleName: "关键证人", req: { acting: 60, popularity: 50 }, requirements: { acting: 60, popularity: 50 }, cost: { stamina: 50 }, reward: { money: 10000, popularity: 50 }, time: 2, category: "影视", tags: ["院线", "口碑"] },
  { id: "album_single", name: "发行个人单曲", type: "音乐发行", desc: "从demo到录音棚终版要反复打磨气息和咬字，宣发期还要连轴跑电台与短视频平台，是声线与耐力的双重考核。", description: "从demo到录音棚终版要反复打磨气息和咬字，宣发期还要连轴跑电台与短视频平台，是声线与耐力的双重考核。", roleName: "主唱艺人", req: { singing: 80, charm: 50 }, requirements: { singing: 80, charm: 50 }, cost: { stamina: 60, money: 5000 }, reward: { money: 20000, popularity: 100, stats: { singing: 8 } }, time: 2, category: "音乐", tags: ["单曲", "宣发"] },
  { id: "campus_radio_live", name: "校园电台轻直播", type: "音乐直播", desc: "大学广播站的深夜点歌档，你需要在简陋设备下稳定气息与互动节奏，用真实状态抓住第一批听众。", description: "大学广播站的深夜点歌档，你需要在简陋设备下稳定气息与互动节奏，用真实状态抓住第一批听众。", roleName: "驻站新声", req: { singing: 25, charm: 20 }, requirements: { singing: 25, charm: 20 }, cost: { stamina: 20 }, reward: { money: 2600, popularity: 18, stats: { singing: 2 } }, time: 1, category: "音乐", tags: ["新人", "直播", "入门"] },
  { id: "street_busking_festival", name: "城市街角音乐节", type: "音乐活动", desc: "开放式街头小舞台，观众流动快、反馈直接。你要在三首歌内把气氛唱热，争取现场自发传播。", description: "开放式街头小舞台，观众流动快、反馈直接。你要在三首歌内把气氛唱热，争取现场自发传播。", roleName: "街头舞台新人", req: { singing: 35, charm: 25 }, requirements: { singing: 35, charm: 25 }, cost: { stamina: 28 }, reward: { money: 4200, popularity: 30, stats: { singing: 2, charm: 1 } }, time: 1, category: "音乐", tags: ["新人", "现场", "热度战"] },
  { id: "acoustic_demo_room", name: "木吉他Demo录制", type: "音乐录音", desc: "小型录音室一镜到底收声，几乎没有后期修音空间。你需要靠稳定咬字和情绪层次完成可发布Demo。", description: "小型录音室一镜到底收声，几乎没有后期修音空间。你需要靠稳定咬字和情绪层次完成可发布Demo。", roleName: "Demo主唱", req: { singing: 30, charm: 15 }, requirements: { singing: 30, charm: 15 }, cost: { stamina: 24 }, reward: { money: 3200, popularity: 22, stats: { singing: 3 } }, time: 1, category: "音乐", tags: ["新人", "录音", "成长"] },
  { id: "movie_lead", name: "院线电影主角", type: "院线电影", desc: "顶级班底与高压宣发并行，角色弧线从脆弱到决绝，任何一处失真都会被放大。你要扛起票房，也要扛住口碑。", description: "顶级班底与高压宣发并行，角色弧线从脆弱到决绝，任何一处失真都会被放大。你要扛起票房，也要扛住口碑。", roleName: "第一女主", req: { acting: 120, appearance: 80, popularity: 200 }, requirements: { acting: 120, appearance: 80, popularity: 200 }, cost: { stamina: 80 }, reward: { money: 100000, popularity: 300, stats: { acting: 10 } }, time: 4, category: "影视", tags: ["院线", "大制作"] },
  { id: "gucheng_brand", name: "顾氏集团品牌代言", type: "商业代言", desc: "覆盖商场大屏、城市地铁和电商首页的全链路投放，品牌方看重稳定人设与大众亲和。签下即是国民面孔争夺战。", description: "覆盖商场大屏、城市地铁和电商首页的全链路投放，品牌方看重稳定人设与大众亲和。签下即是国民面孔争夺战。", roleName: "集团年度代言人", req: { popularity: 1000 }, requirements: { popularity: 1000 }, cost: { stamina: 20 }, reward: { money: 50000, popularity: 500 }, time: 1, category: "广告", tags: ["商业", "集团代言"] },
  { id: "esports_fps", name: "巅峰之战", type: "电竞综艺", desc: "跨圈层电竞活动，直播间弹幕和现场尖叫同时压来。你既要守住节目效果，也要在竞技环节证明自己不是来蹭热度。", description: "跨圈层电竞活动，直播间弹幕和现场尖叫同时压来。你既要守住节目效果，也要在竞技环节证明自己不是来蹭热度。", roleName: "明星挑战者", req: { popularity: 500 }, requirements: { popularity: 500 }, cost: { stamina: 30 }, reward: { money: 20000, popularity: 200 }, time: 1, category: "综艺", tags: ["电竞", "跨界"] },
  { id: "daming_fengyun", name: "大明·风云录", type: "古装长剧", desc: "朝堂与江湖双线并行，角色从隐忍到翻盘的跨度极大，拍摄周期漫长且要求持续稳定输出。", description: "朝堂与江湖双线并行，角色从隐忍到翻盘的跨度极大，拍摄周期漫长且要求持续稳定输出。", roleName: "风云女主", req: { acting: 150, popularity: 800 }, requirements: { acting: 150, popularity: 800 }, cost: { stamina: 80 }, reward: { money: 80000, popularity: 500 }, time: 4, category: "影视", tags: ["古装", "权谋", "大IP"] },

  { id: "changhe_luori_web", name: "长河落日", type: "网剧", desc: "荒漠边城背景下的家国传奇，网播版以人物群像见长。你要在低预算但高口碑的节奏中立住角色灵魂。", description: "荒漠边城背景下的家国传奇，网播版以人物群像见长。你要在低预算但高口碑的节奏中立住角色灵魂。", roleName: "边城译者", req: { acting: 85, popularity: 120 }, requirements: { acting: 85, popularity: 120 }, cost: { stamina: 55 }, reward: { money: 18000, popularity: 120, stats: { acting: 5 } }, time: 2, category: "影视", tags: ["虐恋", "家国", "大IP"], ipGroup: "changhe_luori" },
  { id: "changhe_luori_movie", name: "长河落日·归墟", type: "院线电影", desc: "在网剧口碑基础上升级为院线巨制，视觉与情绪密度全面上调。你将面对更严苛的镜头和更直接的市场检验。", description: "在网剧口碑基础上升级为院线巨制，视觉与情绪密度全面上调。你将面对更严苛的镜头和更直接的市场检验。", roleName: "归墟线女主", req: { acting: 180, popularity: 900 }, requirements: { acting: 180, popularity: 900 }, cost: { stamina: 90 }, reward: { money: 180000, popularity: 650, stats: { acting: 12 } }, time: 4, category: "影视", tags: ["院线", "续作", "大IP"], ipGroup: "changhe_luori", sequelTo: "changhe_luori_web" },
  { id: "shine_trainee_s1", name: "闪耀吧！练习生", type: "选秀综艺", desc: "从主题曲评级到公演淘汰，镜头记录每一次崩溃与重启。你必须在高压剪辑里争取属于自己的叙事主线。", description: "从主题曲评级到公演淘汰，镜头记录每一次崩溃与重启。你必须在高压剪辑里争取属于自己的叙事主线。", roleName: "练习生选手", req: { singing: 45, dancing: 50, charm: 30 }, requirements: { singing: 45, dancing: 50, charm: 30 }, cost: { stamina: 50 }, reward: { money: 9000, popularity: 120 }, time: 2, category: "综艺", tags: ["成团", "生存赛", "大IP"], ipGroup: "shine_trainee" },
  { id: "star_dream_debut_log", name: "星梦成名录", type: "团综", desc: "成团后的第一档纪实团综，24小时镜头追踪真实关系与舞台筹备。任何一个细节都可能被放大成公众印象。", description: "成团后的第一档纪实团综，24小时镜头追踪真实关系与舞台筹备。任何一个细节都可能被放大成公众印象。", roleName: "成团中心位", req: { popularity: 500, charm: 100 }, requirements: { popularity: 500, charm: 100 }, cost: { stamina: 45 }, reward: { money: 26000, popularity: 260 }, time: 2, category: "综艺", tags: ["团综", "成团", "续作"], ipGroup: "shine_trainee", sequelTo: "shine_trainee_s1" },
  { id: "forbidden_deep_sea", name: "禁忌深海", type: "悬疑电影", desc: "你饰演患有失读症的天才调香师，在潮湿迷雾与气味线索里追查连环凶案。每个眼神都要同时呈现破碎与清醒。", description: "你饰演患有失读症的天才调香师，在潮湿迷雾与气味线索里追查连环凶案。每个眼神都要同时呈现破碎与清醒。", roleName: "调香师沈湫", req: { acting: 170, charm: 90 }, requirements: { acting: 170, charm: 90 }, cost: { stamina: 85 }, reward: { money: 160000, popularity: 520, stats: { acting: 14 } }, time: 4, category: "影视", tags: ["悬疑", "反派", "虐恋"] },
  { id: "butter_runaway", name: "奶油色私奔", type: "都市甜宠剧", desc: "你扮演毒舌却极度温柔的时尚杂志主编，在高压职场与暧昧关系里反复横跳。甜度要克制，锋利要优雅。", description: "你扮演毒舌却极度温柔的时尚杂志主编，在高压职场与暧昧关系里反复横跳。甜度要克制，锋利要优雅。", roleName: "主编许绵", req: { appearance: 120, charm: 140 }, requirements: { appearance: 120, charm: 140 }, cost: { stamina: 60 }, reward: { money: 88000, popularity: 360, stats: { charm: 10 } }, time: 3, category: "影视", tags: ["甜美", "都市", "高颜值"] },
  { id: "broken_white_feather", name: "折断的白羽", type: "剧情电影", desc: "坠落神坛的芭蕾舞者坐上轮椅后设计复仇局，每场独白都像刀锋。你要在脆弱与狠戾之间无缝切换。", description: "坠落神坛的芭蕾舞者坐上轮椅后设计复仇局，每场独白都像刀锋。你要在脆弱与狠戾之间无缝切换。", roleName: "舞者白翎", req: { acting: 190, dancing: 120 }, requirements: { acting: 190, dancing: 120 }, cost: { stamina: 95 }, reward: { money: 220000, popularity: 700, stats: { acting: 16 } }, time: 4, category: "影视", tags: ["美强惨", "演技考验", "冲奖"] },
  { id: "cyber_lover_0719", name: "赛博情人", type: "科幻电影", desc: "你是序列号0719的仿生人，爱上人类后决定自我格式化。机械冷感与情感崩塌要在同一场戏里同时成立。", description: "你是序列号0719的仿生人，爱上人类后决定自我格式化。机械冷感与情感崩塌要在同一场戏里同时成立。", roleName: "仿生人0719", req: { acting: 175, charm: 130 }, requirements: { acting: 175, charm: 130 }, cost: { stamina: 90 }, reward: { money: 210000, popularity: 650, stats: { charm: 9 } }, time: 4, category: "影视", tags: ["科幻", "极度虐恋", "大IP"] },
  { id: "ambition_notebook", name: "野心家手札", type: "职场剧", desc: "你饰演顶级公关操盘手，穿着奶油色西装在发布会与舆论场连环反杀。每句台词都要像公关声明一样精准。", description: "你饰演顶级公关操盘手，穿着奶油色西装在发布会与舆论场连环反杀。每句台词都要像公关声明一样精准。", roleName: "公关总监乔芷", req: { acting: 145, charm: 160 }, requirements: { acting: 145, charm: 160 }, cost: { stamina: 70 }, reward: { money: 120000, popularity: 420, stats: { charm: 12 } }, time: 3, category: "影视", tags: ["禁欲系", "心机", "职场"] },
  { id: "seashell_radio", name: "海螺电台", type: "治愈综艺", desc: "在海边小镇经营只在深夜开启的广播站，每一位来信者都带着遗憾。你要用声音与倾听把观众情绪慢慢托住。", description: "在海边小镇经营只在深夜开启的广播站，每一位来信者都带着遗憾。你要用声音与倾听把观众情绪慢慢托住。", roleName: "夜间主持人", req: { charm: 90, singing: 70 }, requirements: { charm: 90, singing: 70 }, cost: { stamina: 45 }, reward: { money: 56000, popularity: 260, stats: { charm: 6 } }, time: 2, category: "综艺", tags: ["慢生活", "治愈", "亲和力"] },
  { id: "light_against_current", name: "逆流而上的光", type: "励志剧", desc: "拒绝潜规则被雪藏三年后，你靠三十秒配角镜头重返聚光灯。故事贴近行业真实，表演必须有刺痛感与生命力。", description: "拒绝潜规则被雪藏三年后，你靠三十秒配角镜头重返聚光灯。故事贴近行业真实，表演必须有刺痛感与生命力。", roleName: "翻红艺人林祈", req: { acting: 140, popularity: 220 }, requirements: { acting: 140, popularity: 220 }, cost: { stamina: 75 }, reward: { money: 98000, popularity: 500, stats: { acting: 9, charm: 4 } }, time: 3, category: "影视", tags: ["娱乐圈本色", "逆袭", "全能"] },
  { id: "midnight_contract", name: "午夜合约", type: "悬疑网剧", desc: "你在匿名经纪合同里发现身份替换阴谋，需要在镜头前演出“被操控者”的裂缝感。节奏快、反转密，极考验稳定输出。", description: "你在匿名经纪合同里发现身份替换阴谋，需要在镜头前演出“被操控者”的裂缝感。节奏快、反转密，极考验稳定输出。", roleName: "合约艺人顾栀", req: { acting: 130, popularity: 180 }, requirements: { acting: 130, popularity: 180 }, cost: { stamina: 70 }, reward: { money: 76000, popularity: 330, stats: { acting: 8 } }, time: 3, category: "影视", tags: ["悬疑", "反转"] },
  { id: "mirror_queen_show", name: "镜面女王企划", type: "时尚综艺", desc: "每期围绕不同主题做造型叙事，你要在镜头前完成从妆容到台词的完整角色搭建，一次录制剪出三版人设。", description: "每期围绕不同主题做造型叙事，你要在镜头前完成从妆容到台词的完整角色搭建，一次录制剪出三版人设。", roleName: "常驻改造官", req: { appearance: 100, charm: 110 }, requirements: { appearance: 100, charm: 110 }, cost: { stamina: 50 }, reward: { money: 42000, popularity: 210, stats: { appearance: 7 } }, time: 2, category: "综艺", tags: ["时尚", "甜美", "酷飒"] },
  { id: "city_heartbeat_live", name: "城市心跳演唱会", type: "音乐LIVE", desc: "万人场连唱三十首作品，返场环节全程无垫音。你要把体能、音准和情绪密度同时拉满，才能撑起终场回声。", description: "万人场连唱三十首作品，返场环节全程无垫音。你要把体能、音准和情绪密度同时拉满，才能撑起终场回声。", roleName: "巡演主唱", req: { singing: 150, charm: 120, popularity: 500 }, requirements: { singing: 150, charm: 120, popularity: 500 }, cost: { stamina: 85 }, reward: { money: 200000, popularity: 520, stats: { singing: 12 } }, time: 3, category: "音乐", tags: ["LIVE", "唱功", "高压"] },
  { id: "hush_perfume_campaign", name: "沉默香调广告片", type: "品牌广告", desc: "黑白光影拍摄的高奢香水短片，几乎没有台词，情绪全靠呼吸、视线和停顿完成。镜头近到能看见眼睫颤动。", description: "黑白光影拍摄的高奢香水短片，几乎没有台词，情绪全靠呼吸、视线和停顿完成。镜头近到能看见眼睫颤动。", roleName: "香水线主面孔", req: { charm: 130, appearance: 110 }, requirements: { charm: 130, appearance: 110 }, cost: { stamina: 35 }, reward: { money: 140000, popularity: 260, stats: { charm: 8 } }, time: 1, category: "广告", tags: ["高奢", "现代", "质感"] },
  { id: "neon_chase_variety", name: "霓虹追击夜", type: "竞技综艺", desc: "深夜城市追击赛制，体能关卡与推理任务交错。你要在镜头和心率双重高压下保持表情管理与临场判断。", description: "深夜城市追击赛制，体能关卡与推理任务交错。你要在镜头和心率双重高压下保持表情管理与临场判断。", roleName: "常驻追击者", req: { dancing: 80, charm: 90, popularity: 260 }, requirements: { dancing: 80, charm: 90, popularity: 260 }, cost: { stamina: 70 }, reward: { money: 68000, popularity: 280, stats: { dancing: 5 } }, time: 2, category: "综艺", tags: ["竞技", "热血"] },
  { id: "falling_orbit_mv", name: "坠轨MV企划", type: "音乐影像", desc: "用一镜到底拍摄失重感叙事MV，动作与口型容错极低。你要在漂浮感走位里稳定输出情绪线，不给剪辑补救机会。", description: "用一镜到底拍摄失重感叙事MV，动作与口型容错极低。你要在漂浮感走位里稳定输出情绪线，不给剪辑补救机会。", roleName: "MV女主", req: { singing: 120, dancing: 90 }, requirements: { singing: 120, dancing: 90 }, cost: { stamina: 65 }, reward: { money: 92000, popularity: 300, stats: { singing: 6, dancing: 4 } }, time: 2, category: "音乐", tags: ["MV", "舞台", "现代"] },
  { id: "city_chronicle_docu", name: "城事纪年纪录特辑", type: "纪实节目", desc: "以城市改造与普通人命运为主线的纪实项目，你需要放下表演痕迹，用真实反应完成镜头内外的信任建立。", description: "以城市改造与普通人命运为主线的纪实项目，你需要放下表演痕迹，用真实反应完成镜头内外的信任建立。", roleName: "城市观察员", req: { charm: 95, popularity: 180 }, requirements: { charm: 95, popularity: 180 }, cost: { stamina: 40 }, reward: { money: 36000, popularity: 180, stats: { charm: 4 } }, time: 2, category: "综艺", tags: ["纪实", "口碑"] },
  { id: "velvet_court_drama", name: "天鹅绒法庭", type: "法政剧", desc: "你饰演年轻检察官，在情理与程序正义之间反复抉择。长台词密集，镜头多为中近景，容不得情绪虚浮。", description: "你饰演年轻检察官，在情理与程序正义之间反复抉择。长台词密集，镜头多为中近景，容不得情绪虚浮。", roleName: "检察官顾予", req: { acting: 165, charm: 95 }, requirements: { acting: 165, charm: 95 }, cost: { stamina: 75 }, reward: { money: 110000, popularity: 420, stats: { acting: 10 } }, time: 3, category: "影视", tags: ["法政", "反派", "台词流"] },
  { id: "rose_finance_talk", name: "玫瑰资本访谈", type: "商业访谈", desc: "顶层商业访谈节目，嘉宾句句有锋芒。你要在谈判式表达里输出观点，同时守住艺人形象的分寸感。", description: "顶层商业访谈节目，嘉宾句句有锋芒。你要在谈判式表达里输出观点，同时守住艺人形象的分寸感。", roleName: "青年嘉宾", req: { charm: 140, popularity: 450 }, requirements: { charm: 140, popularity: 450 }, cost: { stamina: 35 }, reward: { money: 50000, popularity: 210, stats: { charm: 7 } }, time: 1, category: "综艺", tags: ["访谈", "商业", "心机"] },
  { id: "northwind_legend", name: "北风未尽", type: "古风音乐剧", desc: "古风唱段与舞台走位一体化编排，现场乐队即兴衔接。你要在高强度连段里稳住咬字、气息和人物层次。", description: "古风唱段与舞台走位一体化编排，现场乐队即兴衔接。你要在高强度连段里稳住咬字、气息和人物层次。", roleName: "游侠歌者", req: { singing: 130, dancing: 110, charm: 100 }, requirements: { singing: 130, dancing: 110, charm: 100 }, cost: { stamina: 80 }, reward: { money: 130000, popularity: 430, stats: { singing: 10 } }, time: 3, category: "音乐", tags: ["古风", "舞台", "大IP"] },
  { id: "mint_city_brand", name: "薄荷城城市形象片", type: "城市广告", desc: "以城市文化节为核心的官方形象片拍摄，强调亲和力与可信度。你要在文旅叙事里把“明星感”降到刚刚好。", description: "以城市文化节为核心的官方形象片拍摄，强调亲和力与可信度。你要在文旅叙事里把“明星感”降到刚刚好。", roleName: "城市青年代言人", req: { charm: 85, popularity: 160 }, requirements: { charm: 85, popularity: 160 }, cost: { stamina: 28 }, reward: { money: 42000, popularity: 170, stats: { charm: 5 } }, time: 1, category: "广告", tags: ["城市宣传", "亲和", "现代"] },
  { id: "job_distant_star_childcare", name: "远星儿童关怀日", type: "公益探访", desc: "进入儿童关怀站点进行陪伴与记录，重点在真实互动和后续回访。", description: "进入儿童关怀站点进行陪伴与记录，重点在真实互动和后续回访。", roleName: "公益陪伴官", req: { charm: 110, popularity: 380 }, requirements: { charm: 110, popularity: 380 }, cost: { stamina: 35 }, reward: { money: 38000, popularity: 180, stats: { charm: 4 } }, time: 1, category: "综艺", tags: ["公益", "关怀", "纪实"] },
  { id: "job_nightlog_hotline_day", name: "夜航热线行动日", type: "公益热线", desc: "参与夜间公益热线接听与分流，考验沟通效率和情绪稳定。", description: "参与夜间公益热线接听与分流，考验沟通效率和情绪稳定。", roleName: "热线值守员", req: { charm: 120, acting: 90 }, requirements: { charm: 120, acting: 90 }, cost: { stamina: 32 }, reward: { money: 36000, popularity: 170, stats: { charm: 3 } }, time: 1, category: "综艺", tags: ["公益", "热线", "沟通"] },
  { id: "job_tide_sequence_river_week", name: "潮汐序章·护河周", type: "公益行动", desc: "联合多方开展河岸保护行动，强调过程透明和执行闭环。", description: "联合多方开展河岸保护行动，强调过程透明和执行闭环。", roleName: "行动发起人", req: { charm: 125, popularity: 420 }, requirements: { charm: 125, popularity: 420 }, cost: { stamina: 38 }, reward: { money: 42000, popularity: 210, stats: { charm: 4 } }, time: 2, category: "综艺", tags: ["公益", "环保", "联动"] },
  { id: "job_white_noise_forum", name: "白噪论坛公开场", type: "公益论坛", desc: "在公开论坛输出可落地方案，接受媒体与公众现场追问。", description: "在公开论坛输出可落地方案，接受媒体与公众现场追问。", roleName: "青年发言人", req: { charm: 135, acting: 100 }, requirements: { charm: 135, acting: 100 }, cost: { stamina: 30 }, reward: { money: 46000, popularity: 220, stats: { acting: 3 } }, time: 1, category: "综艺", tags: ["公益", "论坛", "表达"] },
  { id: "job_blue_flame_kindness_report", name: "蓝焰善意报告", type: "公益发布", desc: "发布年度公益执行报告，强调数据准确与流程可追溯。", description: "发布年度公益执行报告，强调数据准确与流程可追溯。", roleName: "报告主理人", req: { charm: 145, popularity: 500 }, requirements: { charm: 145, popularity: 500 }, cost: { stamina: 34 }, reward: { money: 52000, popularity: 250, stats: { charm: 5 } }, time: 1, category: "综艺", tags: ["公益", "发布", "公信力"] },
  { id: "job_era_echo_charity_cover", name: "时代回声公益封面", type: "公益特刊", desc: "拍摄公益主题封面并配套人物专访，强调长期影响力叙事。", description: "拍摄公益主题封面并配套人物专访，强调长期影响力叙事。", roleName: "封面人物", req: { charm: 155, popularity: 580 }, requirements: { charm: 155, popularity: 580 }, cost: { stamina: 28 }, reward: { money: 60000, popularity: 300, stats: { charm: 5 } }, time: 1, category: "广告", tags: ["公益", "封面", "口碑"] },
  { id: "job_warm_winter_visit", name: "暖冬计划探访", type: "公益探访", desc: "走访冬季帮扶点位，完成物资发放与现场需求回收。", description: "走访冬季帮扶点位，完成物资发放与现场需求回收。", roleName: "暖冬行动官", req: { charm: 165, popularity: 650 }, requirements: { charm: 165, popularity: 650 }, cost: { stamina: 40 }, reward: { money: 68000, popularity: 320, stats: { charm: 6 } }, time: 2, category: "综艺", tags: ["公益", "探访", "暖冬"] },
  { id: "job_river_guard_action", name: "河岸守护行动", type: "公益行动", desc: "执行河岸清理与科普直播，兼顾行动效率与公众沟通。", description: "执行河岸清理与科普直播，兼顾行动效率与公众沟通。", roleName: "守护行动队长", req: { charm: 175, acting: 120 }, requirements: { charm: 175, acting: 120 }, cost: { stamina: 42 }, reward: { money: 76000, popularity: 360, stats: { charm: 6 } }, time: 2, category: "综艺", tags: ["公益", "环保", "执行"] },
  { id: "job_morninglight_library_corner", name: "晨光图书角落地", type: "公益落地", desc: "完成图书角点位建设与公开信息上链，确保每笔资源可查。", description: "完成图书角点位建设与公开信息上链，确保每笔资源可查。", roleName: "项目执行主理", req: { charm: 185, popularity: 720 }, requirements: { charm: 185, popularity: 720 }, cost: { stamina: 36 }, reward: { money: 84000, popularity: 390, stats: { charm: 6 } }, time: 2, category: "综艺", tags: ["公益", "教育", "透明"] },
  { id: "job_city_hotmeal_nightshift", name: "城市热餐夜班", type: "公益服务", desc: "夜间热餐分发与秩序维护，重点是效率与安全并行。", description: "夜间热餐分发与秩序维护，重点是效率与安全并行。", roleName: "夜班协调员", req: { charm: 195, acting: 130 }, requirements: { charm: 195, acting: 130 }, cost: { stamina: 44 }, reward: { money: 92000, popularity: 420, stats: { acting: 3 } }, time: 2, category: "综艺", tags: ["公益", "服务", "夜班"] },
  { id: "job_child_dream_workshop_day", name: "童梦工坊陪伴日", type: "公益陪伴", desc: "开展儿童工作坊陪伴活动，注重隐私边界与长期跟进计划。", description: "开展儿童工作坊陪伴活动，注重隐私边界与长期跟进计划。", roleName: "陪伴计划官", req: { charm: 205, popularity: 820 }, requirements: { charm: 205, popularity: 820 }, cost: { stamina: 40 }, reward: { money: 102000, popularity: 470, stats: { charm: 7 } }, time: 2, category: "综艺", tags: ["公益", "儿童", "陪伴"] },
  { id: "job_blue_coast_cleanup", name: "蓝海净滩集结", type: "公益联动", desc: "跨城净滩行动，要求站点协同、节奏一致并公开复盘。", description: "跨城净滩行动，要求站点协同、节奏一致并公开复盘。", roleName: "联动总协调", req: { charm: 220, popularity: 950 }, requirements: { charm: 220, popularity: 950 }, cost: { stamina: 46 }, reward: { money: 118000, popularity: 540, stats: { charm: 8 } }, time: 2, category: "综艺", tags: ["公益", "联动", "环保"] },
  { id: "job_neighborhood_watch_linkvisit", name: "邻里守望联访", type: "公益走访", desc: "社区联访与需求采集并行，强调跟进节奏和执行闭环。", description: "社区联访与需求采集并行，强调跟进节奏和执行闭环。", roleName: "联访负责人", req: { charm: 230, acting: 150 }, requirements: { charm: 230, acting: 150 }, cost: { stamina: 42 }, reward: { money: 132000, popularity: 600, stats: { acting: 4 } }, time: 2, category: "综艺", tags: ["公益", "社区", "走访"] },
  { id: "job_rainnight_hotline_shift", name: "雨夜热线值守", type: "公益热线", desc: "高压夜间热线值守，要求快速判断与精准分流。", description: "高压夜间热线值守，要求快速判断与精准分流。", roleName: "夜线值守长", req: { charm: 245, popularity: 1080 }, requirements: { charm: 245, popularity: 1080 }, cost: { stamina: 44 }, reward: { money: 148000, popularity: 670, stats: { charm: 8 } }, time: 2, category: "综艺", tags: ["公益", "热线", "高压"] },
  { id: "job_starbridge_charity_run_finale", name: "星桥义跑收官", type: "公益活动", desc: "万人义跑收官场，需同步完成现场统筹、传播与数据归档。", description: "万人义跑收官场，需同步完成现场统筹、传播与数据归档。", roleName: "收官主理人", req: { charm: 260, popularity: 1220 }, requirements: { charm: 260, popularity: 1220 }, cost: { stamina: 48 }, reward: { money: 168000, popularity: 760, stats: { charm: 9 } }, time: 3, category: "综艺", tags: ["公益", "大型活动", "收官"] },
  { id: "job_kindness_annual_report", name: "善意年报发布", type: "公益发布", desc: "发布年度善意年报，确保数据、叙事与成果三线一致。", description: "发布年度善意年报，确保数据、叙事与成果三线一致。", roleName: "年报发布官", req: { charm: 275, popularity: 1380 }, requirements: { charm: 275, popularity: 1380 }, cost: { stamina: 40 }, reward: { money: 188000, popularity: 860, stats: { charm: 10 } }, time: 2, category: "综艺", tags: ["公益", "年报", "公信力"] },
  { id: "job_night_trial_linkup", name: "夜色审判联动赛", type: "电竞综艺", desc: "夜间高压联动赛，需在直播镜头下完成协同作战与稳定操作。", description: "夜间高压联动赛，需在直播镜头下完成协同作战与稳定操作。", roleName: "联动挑战者", req: { dancing: 120, charm: 110, popularity: 500 }, requirements: { dancing: 120, charm: 110, popularity: 500 }, cost: { stamina: 48 }, reward: { money: 82000, popularity: 300, stats: { dancing: 4 } }, time: 2, category: "综艺", tags: ["电竞", "联动", "竞技"] },
  { id: "job_white_day_flare_cup", name: "白昼焰火冠军杯", type: "电竞赛事", desc: "多轮淘汰赛制，容错低。你要在关键团战里稳定执行战术。", description: "多轮淘汰赛制，容错低。你要在关键团战里稳定执行战术。", roleName: "主力选手", req: { dancing: 135, popularity: 620 }, requirements: { dancing: 135, popularity: 620 }, cost: { stamina: 52 }, reward: { money: 98000, popularity: 360, stats: { dancing: 5 } }, time: 2, category: "综艺", tags: ["电竞", "淘汰赛", "高压"] },
  { id: "job_deepsea_echo_tactic_show", name: "深海回声战术秀", type: "电竞特辑", desc: "战术演示与实战混编，要求临场判断与转线配合同样稳定。", description: "战术演示与实战混编，要求临场判断与转线配合同样稳定。", roleName: "战术主讲位", req: { dancing: 145, charm: 120 }, requirements: { dancing: 145, charm: 120 }, cost: { stamina: 46 }, reward: { money: 108000, popularity: 390, stats: { dancing: 5 } }, time: 2, category: "综艺", tags: ["电竞", "战术", "复盘"] },
  { id: "job_distant_star_home_finale", name: "远星主场压轴战", type: "电竞舞台", desc: "主场观众压力与期待并存，要求你在终局局面稳住节奏。", description: "主场观众压力与期待并存，要求你在终局局面稳住节奏。", roleName: "主场核心位", req: { dancing: 155, popularity: 700 }, requirements: { dancing: 155, popularity: 700 }, cost: { stamina: 55 }, reward: { money: 122000, popularity: 430, stats: { dancing: 6 } }, time: 2, category: "综艺", tags: ["电竞", "主场", "压轴"] },
  { id: "job_streamlight_cross_circle", name: "流光电台跨圈赛", type: "跨界电竞", desc: "跨圈层同台对抗，既要保证竞技强度，也要维持舞台表达。", description: "跨圈层同台对抗，既要保证竞技强度，也要维持舞台表达。", roleName: "跨圈挑战位", req: { dancing: 165, charm: 130, popularity: 780 }, requirements: { dancing: 165, charm: 130, popularity: 780 }, cost: { stamina: 58 }, reward: { money: 136000, popularity: 480, stats: { dancing: 6, charm: 2 } }, time: 2, category: "综艺", tags: ["电竞", "跨界", "热度"] },
  { id: "job_era_echo_finals_night", name: "时代回声总决夜", type: "电竞总决", desc: "总决夜三局两胜，节奏极快。每一个资源刷新点都可能决定胜负。", description: "总决夜三局两胜，节奏极快。每一个资源刷新点都可能决定胜负。", roleName: "总决核心", req: { dancing: 180, popularity: 900 }, requirements: { dancing: 180, popularity: 900 }, cost: { stamina: 62 }, reward: { money: 158000, popularity: 560, stats: { dancing: 7 } }, time: 3, category: "综艺", tags: ["电竞", "总决", "强对抗"] },
  { id: "job_tower_seal_night", name: "封塔之夜踢馆赛", type: "电竞赛事", desc: "以拆塔节奏为核心的高压踢馆赛，要求快速转线与果断开团。", description: "以拆塔节奏为核心的高压踢馆赛，要求快速转线与果断开团。", roleName: "踢馆挑战者", req: { dancing: 190, charm: 140 }, requirements: { dancing: 190, charm: 140 }, cost: { stamina: 64 }, reward: { money: 172000, popularity: 610, stats: { dancing: 7 } }, time: 3, category: "综艺", tags: ["电竞", "踢馆", "节奏"] },
  { id: "job_limit_teamfight_starter", name: "极限团战首发夜", type: "电竞赛事", desc: "首发登场压力高，需在前十分钟建立有效优势并持续压制。", description: "首发登场压力高，需在前十分钟建立有效优势并持续压制。", roleName: "首发位", req: { dancing: 200, popularity: 980 }, requirements: { dancing: 200, popularity: 980 }, cost: { stamina: 66 }, reward: { money: 186000, popularity: 660, stats: { dancing: 8 } }, time: 3, category: "综艺", tags: ["电竞", "首发", "压制"] },
  { id: "job_canyon_storm_wildcard", name: "峡谷风暴外卡赛", type: "电竞赛事", desc: "外卡赛容错极低，资源控制和终盘执行必须同步到位。", description: "外卡赛容错极低，资源控制和终盘执行必须同步到位。", roleName: "外卡主力", req: { dancing: 210, charm: 150, popularity: 1080 }, requirements: { dancing: 210, charm: 150, popularity: 1080 }, cost: { stamina: 68 }, reward: { money: 202000, popularity: 720, stats: { dancing: 8 } }, time: 3, category: "综艺", tags: ["电竞", "外卡", "终盘"] },
  { id: "job_champion_night_talk", name: "冠军夜谈连麦", type: "电竞访谈", desc: "赛后连麦访谈，需在高关注度下输出专业复盘与清晰观点。", description: "赛后连麦访谈，需在高关注度下输出专业复盘与清晰观点。", roleName: "复盘嘉宾", req: { charm: 165, popularity: 1180 }, requirements: { charm: 165, popularity: 1180 }, cost: { stamina: 32 }, reward: { money: 128000, popularity: 500, stats: { charm: 4 } }, time: 1, category: "综艺", tags: ["电竞", "访谈", "复盘"] },
  { id: "job_omni_domination_elim", name: "全域争霸淘汰赛", type: "电竞赛事", desc: "淘汰赛段只看结果，要求先手开团、收割和转线效率统一。", description: "淘汰赛段只看结果，要求先手开团、收割和转线效率统一。", roleName: "淘汰赛主力", req: { dancing: 225, popularity: 1300 }, requirements: { dancing: 225, popularity: 1300 }, cost: { stamina: 70 }, reward: { money: 218000, popularity: 780, stats: { dancing: 9 } }, time: 3, category: "综艺", tags: ["电竞", "淘汰赛", "强度"] },
  { id: "job_snowline_breakout_top8", name: "雪线突围八强战", type: "电竞赛事", desc: "八强赛进入高压期，重点考验控图节奏与决策一致性。", description: "八强赛进入高压期，重点考验控图节奏与决策一致性。", roleName: "八强核心", req: { dancing: 240, charm: 170, popularity: 1450 }, requirements: { dancing: 240, charm: 170, popularity: 1450 }, cost: { stamina: 72 }, reward: { money: 236000, popularity: 850, stats: { dancing: 10 } }, time: 3, category: "综艺", tags: ["电竞", "八强", "控图"] },
  { id: "job_endgame_echo_semifinal", name: "终局回声半决赛", type: "电竞赛事", desc: "半决舞台曝光极高，必须在高压环境中连续保持高质量操作。", description: "半决舞台曝光极高，必须在高压环境中连续保持高质量操作。", roleName: "半决核心", req: { dancing: 255, popularity: 1600 }, requirements: { dancing: 255, popularity: 1600 }, cost: { stamina: 74 }, reward: { money: 255000, popularity: 920, stats: { dancing: 10 } }, time: 3, category: "综艺", tags: ["电竞", "半决", "高曝光"] },
  { id: "job_galaxy_cup_decider", name: "银河杯决胜局", type: "电竞赛事", desc: "决胜局单场定胜负，必须在资源刷新前完成站位布控。", description: "决胜局单场定胜负，必须在资源刷新前完成站位布控。", roleName: "决胜位", req: { dancing: 270, charm: 180, popularity: 1760 }, requirements: { dancing: 270, charm: 180, popularity: 1760 }, cost: { stamina: 76 }, reward: { money: 275000, popularity: 990, stats: { dancing: 11 } }, time: 3, category: "综艺", tags: ["电竞", "决胜", "资源战"] },
  { id: "job_throne_clash_grandfinal", name: "王座争夺总决赛", type: "电竞总决", desc: "总决赛全网直播，团队沟通、开团信号与终盘执行必须统一。", description: "总决赛全网直播，团队沟通、开团信号与终盘执行必须统一。", roleName: "总决主C", req: { dancing: 285, popularity: 1940 }, requirements: { dancing: 285, popularity: 1940 }, cost: { stamina: 80 }, reward: { money: 298000, popularity: 1080, stats: { dancing: 12 } }, time: 4, category: "综艺", tags: ["电竞", "总决", "封神"] },
  { id: "job_global_review_top1", name: "全网复盘第一名", type: "电竞特辑", desc: "高热复盘特辑，要求连续高光且具可复现性，稳定压制舆论争议。", description: "高热复盘特辑，要求连续高光且具可复现性，稳定压制舆论争议。", roleName: "复盘标杆位", req: { dancing: 300, charm: 190, popularity: 2100 }, requirements: { dancing: 300, charm: 190, popularity: 2100 }, cost: { stamina: 68 }, reward: { money: 320000, popularity: 1180, stats: { dancing: 12, charm: 3 } }, time: 3, category: "综艺", tags: ["电竞", "复盘", "口碑"] },
  { id: "job_distant_star_launch", name: "远星发布会主理", type: "商业发布", desc: "大型品牌发布会现场主理，要求控场稳定并准确传达品牌核心信息。", description: "大型品牌发布会现场主理，要求控场稳定并准确传达品牌核心信息。", roleName: "发布会主理人", req: { charm: 130, popularity: 420 }, requirements: { charm: 130, popularity: 420 }, cost: { stamina: 36 }, reward: { money: 76000, popularity: 240, stats: { charm: 5 } }, time: 1, category: "广告", tags: ["商业", "发布会", "控场"] },
  { id: "job_blue_flame_announcement", name: "蓝焰官宣企划", type: "品牌宣发", desc: "品牌官宣投放覆盖多平台，需要维持统一叙事并带动讨论升温。", description: "品牌官宣投放覆盖多平台，需要维持统一叙事并带动讨论升温。", roleName: "官宣主面孔", req: { charm: 140, popularity: 500 }, requirements: { charm: 140, popularity: 500 }, cost: { stamina: 30 }, reward: { money: 86000, popularity: 280, stats: { charm: 5 } }, time: 1, category: "广告", tags: ["商业", "官宣", "传播"] },
  { id: "job_tide_sequence_cocreate", name: "潮汐序章共创会", type: "商业共创", desc: "品牌与创作团队共创新企划，要求输出可落地并可复盘的方案。", description: "品牌与创作团队共创新企划，要求输出可落地并可复盘的方案。", roleName: "共创发起人", req: { charm: 150, popularity: 600 }, requirements: { charm: 150, popularity: 600 }, cost: { stamina: 34 }, reward: { money: 98000, popularity: 320, stats: { charm: 6 } }, time: 1, category: "广告", tags: ["商业", "共创", "策略"] },
  { id: "job_glow_mag_cover_sign", name: "璀璨刊封面签约", type: "时尚商业", desc: "顶刊封面与品牌签约同步进行，考验综合商务形象和执行力。", description: "顶刊封面与品牌签约同步进行，考验综合商务形象和执行力。", roleName: "封面签约主角", req: { appearance: 145, charm: 165, popularity: 780 }, requirements: { appearance: 145, charm: 165, popularity: 780 }, cost: { stamina: 35 }, reward: { money: 125000, popularity: 420, stats: { charm: 7 } }, time: 2, category: "广告", tags: ["商业", "时尚", "封面"] },
  { id: "job_bazaar_special_project", name: "时尚芭莎特企", type: "时尚特企", desc: "与顶刊联动的商业特企，需在内容质感和品牌转化间取得平衡。", description: "与顶刊联动的商业特企，需在内容质感和品牌转化间取得平衡。", roleName: "特企核心位", req: { appearance: 155, charm: 175, popularity: 900 }, requirements: { appearance: 155, charm: 175, popularity: 900 }, cost: { stamina: 38 }, reward: { money: 142000, popularity: 480, stats: { appearance: 5, charm: 4 } }, time: 2, category: "广告", tags: ["商业", "时尚", "高奢"] },
  { id: "job_cloudscreen_launch_host", name: "云幕发布会主场", type: "商业发布", desc: "超大屏发布会全程直播，要求全链路信息表达与节奏把控。", description: "超大屏发布会全程直播，要求全链路信息表达与节奏把控。", roleName: "主场主持位", req: { charm: 185, popularity: 1050 }, requirements: { charm: 185, popularity: 1050 }, cost: { stamina: 40 }, reward: { money: 160000, popularity: 530, stats: { charm: 7 } }, time: 2, category: "综艺", tags: ["商业", "发布会", "直播"] },
  { id: "job_star_tide_sponsor_night", name: "星潮夜冠名战", type: "品牌活动", desc: "冠名夜活动横跨演出与商业模块，重点考核现场转化与声量。", description: "冠名夜活动横跨演出与商业模块，重点考核现场转化与声量。", roleName: "冠名主理人", req: { charm: 195, popularity: 1180 }, requirements: { charm: 195, popularity: 1180 }, cost: { stamina: 42 }, reward: { money: 178000, popularity: 590, stats: { charm: 8 } }, time: 2, category: "广告", tags: ["商业", "冠名", "活动"] },
  { id: "job_obsidian_plan_collab", name: "黑曜计划联名", type: "品牌联名", desc: "高规格联名企划，要求统一视觉叙事并持续拉高复购意愿。", description: "高规格联名企划，要求统一视觉叙事并持续拉高复购意愿。", roleName: "联名核心位", req: { charm: 210, appearance: 170, popularity: 1320 }, requirements: { charm: 210, appearance: 170, popularity: 1320 }, cost: { stamina: 44 }, reward: { money: 198000, popularity: 650, stats: { charm: 8 } }, time: 2, category: "广告", tags: ["商业", "联名", "转化"] },
  { id: "job_farsea_weekly_interview", name: "远海周刊专访", type: "商业访谈", desc: "深度商业访谈，重点输出长期策略和品牌方法论。", description: "深度商业访谈，重点输出长期策略和品牌方法论。", roleName: "专访嘉宾", req: { charm: 220, popularity: 1460 }, requirements: { charm: 220, popularity: 1460 }, cost: { stamina: 30 }, reward: { money: 152000, popularity: 520, stats: { charm: 6 } }, time: 1, category: "综艺", tags: ["商业", "专访", "策略"] },
  { id: "job_golden_line_gala", name: "金线盛典席位", type: "商业盛典", desc: "年度商业盛典核心席位，现场表现将直接影响后续签约规模。", description: "年度商业盛典核心席位，现场表现将直接影响后续签约规模。", roleName: "盛典主嘉宾", req: { charm: 235, popularity: 1620 }, requirements: { charm: 235, popularity: 1620 }, cost: { stamina: 46 }, reward: { money: 228000, popularity: 760, stats: { charm: 9 } }, time: 2, category: "综艺", tags: ["商业", "盛典", "签约"] },
  { id: "job_rising_brand_cocreate", name: "新锐品牌共创", type: "品牌共创", desc: "与新锐品牌共创整季方案，要求创意和商业目标同时达成。", description: "与新锐品牌共创整季方案，要求创意和商业目标同时达成。", roleName: "共创总策", req: { charm: 250, appearance: 185, popularity: 1780 }, requirements: { charm: 250, appearance: 185, popularity: 1780 }, cost: { stamina: 48 }, reward: { money: 252000, popularity: 830, stats: { charm: 9, appearance: 3 } }, time: 2, category: "广告", tags: ["商业", "共创", "新锐"] },
  { id: "job_trend_summit_keynote", name: "潮流峰会压轴讲", type: "商业峰会", desc: "年度峰会压轴主题演讲，需输出可执行方法并带动行业声量。", description: "年度峰会压轴主题演讲，需输出可执行方法并带动行业声量。", roleName: "压轴主讲人", req: { charm: 270, popularity: 1950 }, requirements: { charm: 270, popularity: 1950 }, cost: { stamina: 36 }, reward: { money: 275000, popularity: 920, stats: { charm: 10 } }, time: 1, category: "综艺", tags: ["商业", "峰会", "压轴"] },
  { id: "job_tide_sound_night", name: "潮声夜返场", type: "音乐舞台", desc: "返场舞台考核情绪递进与副歌稳定度，需在高压下保持完整表达。", description: "返场舞台考核情绪递进与副歌稳定度，需在高压下保持完整表达。", roleName: "返场主唱", req: { singing: 95, charm: 80 }, requirements: { singing: 95, charm: 80 }, cost: { stamina: 42 }, reward: { money: 62000, popularity: 230, stats: { singing: 5 } }, time: 2, category: "音乐", tags: ["舞台", "返场", "热度"] },
  { id: "job_fogport_diary_ost", name: "雾港日记OST", type: "影视音乐", desc: "为影视项目录制OST，要求叙事感与情绪层次同步达标。", description: "为影视项目录制OST，要求叙事感与情绪层次同步达标。", roleName: "OST主唱", req: { singing: 105, charm: 90 }, requirements: { singing: 105, charm: 90 }, cost: { stamina: 44 }, reward: { money: 76000, popularity: 280, stats: { singing: 6 } }, time: 2, category: "音乐", tags: ["OST", "影视", "录音"] },
  { id: "job_white_day_echo_record", name: "白昼回声录制", type: "音乐录音", desc: "棚录任务密集，要求主旋律稳定与细节精修能力。", description: "棚录任务密集，要求主旋律稳定与细节精修能力。", roleName: "录音主唱", req: { singing: 115, charm: 95 }, requirements: { singing: 115, charm: 95 }, cost: { stamina: 40 }, reward: { money: 82000, popularity: 300, stats: { singing: 6 } }, time: 2, category: "音乐", tags: ["录音", "精修", "主旋律"] },
  { id: "job_flowfire_live_stage", name: "流火现场版", type: "音乐LIVE", desc: "现场噪声环境复杂，需保证气息、咬字与舞台稳定。", description: "现场噪声环境复杂，需保证气息、咬字与舞台稳定。", roleName: "Live主唱", req: { singing: 125, charm: 100, popularity: 420 }, requirements: { singing: 125, charm: 100, popularity: 420 }, cost: { stamina: 50 }, reward: { money: 96000, popularity: 360, stats: { singing: 7 } }, time: 2, category: "音乐", tags: ["LIVE", "现场", "高压"] },
  { id: "job_moonface_whisper_duet", name: "月面低语合唱", type: "双人合作", desc: "双人合唱段落需要频段互补与默契衔接，考验控制力。", description: "双人合唱段落需要频段互补与默契衔接，考验控制力。", roleName: "合唱位", req: { singing: 135, charm: 110 }, requirements: { singing: 135, charm: 110 }, cost: { stamina: 46 }, reward: { money: 102000, popularity: 390, stats: { singing: 7, charm: 2 } }, time: 2, category: "音乐", tags: ["合唱", "合作", "技巧"] },
  { id: "job_tide_plan_release", name: "潮汐计划发布", type: "音乐发行", desc: "新曲发布与宣发同步推进，要求作品质量与传播节奏并行。", description: "新曲发布与宣发同步推进，要求作品质量与传播节奏并行。", roleName: "发布主唱", req: { singing: 145, popularity: 560 }, requirements: { singing: 145, popularity: 560 }, cost: { stamina: 42 }, reward: { money: 116000, popularity: 430, stats: { singing: 8 } }, time: 2, category: "音乐", tags: ["发行", "宣发", "新曲"] },
  { id: "job_nightglow_stage_debut", name: "夜光舞台首秀", type: "音乐舞台", desc: "高关注首秀，重点在开场稳定与副歌爆发控制。", description: "高关注首秀，重点在开场稳定与副歌爆发控制。", roleName: "首秀主唱", req: { singing: 155, charm: 120, popularity: 700 }, requirements: { singing: 155, charm: 120, popularity: 700 }, cost: { stamina: 52 }, reward: { money: 132000, popularity: 500, stats: { singing: 8 } }, time: 2, category: "音乐", tags: ["舞台", "首秀", "爆发"] },
  { id: "job_farshore_recording_week", name: "远岸录音周", type: "录音企划", desc: "连续录音周任务，要求每轨质量一致并控制疲劳波动。", description: "连续录音周任务，要求每轨质量一致并控制疲劳波动。", roleName: "录音周主唱", req: { singing: 165, popularity: 820 }, requirements: { singing: 165, popularity: 820 }, cost: { stamina: 54 }, reward: { money: 148000, popularity: 560, stats: { singing: 9 } }, time: 3, category: "音乐", tags: ["录音", "连续作业", "稳定"] },
  { id: "job_blue_night_signal_premiere", name: "蓝夜信号首播", type: "音乐首播", desc: "首播窗口曝光集中，要求主副歌对比和情绪推进清晰。", description: "首播窗口曝光集中，要求主副歌对比和情绪推进清晰。", roleName: "首播主唱", req: { singing: 175, charm: 130, popularity: 960 }, requirements: { singing: 175, charm: 130, popularity: 960 }, cost: { stamina: 50 }, reward: { money: 162000, popularity: 620, stats: { singing: 9 } }, time: 2, category: "音乐", tags: ["首播", "曝光", "主打"] },
  { id: "job_outside_gravity_rerecord", name: "重力之外重录", type: "音乐重录", desc: "重录任务聚焦高频段质感，要求更细腻的音色控制。", description: "重录任务聚焦高频段质感，要求更细腻的音色控制。", roleName: "重录主唱", req: { singing: 190, popularity: 1120 }, requirements: { singing: 190, popularity: 1120 }, cost: { stamina: 48 }, reward: { money: 178000, popularity: 680, stats: { singing: 10 } }, time: 2, category: "音乐", tags: ["重录", "音色", "进阶"] },
  { id: "job_starscreen_tour_stop", name: "星幕巡演站", type: "巡演", desc: "巡演单站高强度演出，要求体能与音准全程在线。", description: "巡演单站高强度演出，要求体能与音准全程在线。", roleName: "巡演主唱", req: { singing: 205, charm: 145, popularity: 1300 }, requirements: { singing: 205, charm: 145, popularity: 1300 }, cost: { stamina: 62 }, reward: { money: 198000, popularity: 760, stats: { singing: 10 } }, time: 3, category: "音乐", tags: ["巡演", "高强度", "现场"] },
  { id: "job_countercurrent_title_track", name: "逆流主打曲", type: "主打发行", desc: "主打曲窗口竞争激烈，需以高完成度推动榜单冲刺。", description: "主打曲窗口竞争激烈，需以高完成度推动榜单冲刺。", roleName: "主打位", req: { singing: 220, popularity: 1480 }, requirements: { singing: 220, popularity: 1480 }, cost: { stamina: 52 }, reward: { money: 215000, popularity: 840, stats: { singing: 11 } }, time: 2, category: "音乐", tags: ["主打", "榜单", "冲刺"] },
  { id: "job_finale_overture_wrap", name: "终章序曲收录", type: "收官录制", desc: "收官录制要求整轨完整度与情绪收束能力同步达标。", description: "收官录制要求整轨完整度与情绪收束能力同步达标。", roleName: "收官主唱", req: { singing: 235, popularity: 1680 }, requirements: { singing: 235, popularity: 1680 }, cost: { stamina: 56 }, reward: { money: 236000, popularity: 920, stats: { singing: 11 } }, time: 2, category: "音乐", tags: ["收官", "录制", "完整度"] },
  { id: "job_obsidian_star_collab_music", name: "黑曜星联动曲", type: "跨界音乐", desc: "跨界联动单曲，要求风格融合且保持个人辨识度。", description: "跨界联动单曲，要求风格融合且保持个人辨识度。", roleName: "联动主唱", req: { singing: 250, charm: 160, popularity: 1860 }, requirements: { singing: 250, charm: 160, popularity: 1860 }, cost: { stamina: 58 }, reward: { money: 258000, popularity: 1010, stats: { singing: 12, charm: 3 } }, time: 3, category: "音乐", tags: ["跨界", "联动", "辨识度"] },
  { id: "job_endless_summer_finale", name: "无尽夏终演", type: "终演舞台", desc: "终演舞台曝光极高，要求后半程体能与声线稳定不塌。", description: "终演舞台曝光极高，要求后半程体能与声线稳定不塌。", roleName: "终演压轴", req: { singing: 265, popularity: 2050 }, requirements: { singing: 265, popularity: 2050 }, cost: { stamina: 66 }, reward: { money: 282000, popularity: 1120, stats: { singing: 12 } }, time: 3, category: "音乐", tags: ["终演", "压轴", "高曝光"] },
  { id: "job_lightyear_special_stage", name: "光年特别场", type: "特别舞台", desc: "特别场容错极低，需在高压镜头中完成冠军线级别输出。", description: "特别场容错极低，需在高压镜头中完成冠军线级别输出。", roleName: "特别场主唱", req: { singing: 280, charm: 175, popularity: 2250 }, requirements: { singing: 280, charm: 175, popularity: 2250 }, cost: { stamina: 64 }, reward: { money: 308000, popularity: 1230, stats: { singing: 13 } }, time: 3, category: "音乐", tags: ["特别场", "冠军线", "收官"] },
  { id: "job_distant_star_heels_training", name: "远星高跟特训", type: "舞台训练", desc: "高跟舞台走位专项训练，重点在重心控制与镜头稳定。", description: "高跟舞台走位专项训练，重点在重心控制与镜头稳定。", roleName: "特训主舞", req: { dancing: 120, charm: 95 }, requirements: { dancing: 120, charm: 95 }, cost: { stamina: 42 }, reward: { money: 68000, popularity: 240, stats: { dancing: 5 } }, time: 2, category: "综艺", tags: ["舞台", "特训", "卡点"] },
  { id: "job_tide_sequence_rework_stage", name: "潮汐序章改版舞台", type: "舞台改编", desc: "改版舞台重构动作段落，要求节奏控制与爆点统一。", description: "改版舞台重构动作段落，要求节奏控制与爆点统一。", roleName: "改编主舞", req: { dancing: 130, charm: 100 }, requirements: { dancing: 130, charm: 100 }, cost: { stamina: 45 }, reward: { money: 76000, popularity: 280, stats: { dancing: 5 } }, time: 2, category: "综艺", tags: ["舞台", "改版", "编排"] },
  { id: "job_nightlog_duet_dance", name: "夜航日志双人舞", type: "双人舞台", desc: "双人舞交接密集，需保持视线点、手位和节奏同步。", description: "双人舞交接密集，需保持视线点、手位和节奏同步。", roleName: "双人舞位", req: { dancing: 140, charm: 105 }, requirements: { dancing: 140, charm: 105 }, cost: { stamina: 46 }, reward: { money: 84000, popularity: 320, stats: { dancing: 6 } }, time: 2, category: "综艺", tags: ["舞台", "双人", "默契"] },
  { id: "job_blueflame_finale_stage", name: "蓝焰终场压轴", type: "压轴舞台", desc: "终场压轴段关注度极高，要求后半程动作稳定不塌。", description: "终场压轴段关注度极高，要求后半程动作稳定不塌。", roleName: "压轴主舞", req: { dancing: 150, charm: 115, popularity: 500 }, requirements: { dancing: 150, charm: 115, popularity: 500 }, cost: { stamina: 52 }, reward: { money: 98000, popularity: 370, stats: { dancing: 6 } }, time: 2, category: "综艺", tags: ["舞台", "压轴", "高压"] },
  { id: "job_era_echo_groupnight_stage", name: "时代回声群舞夜", type: "群舞舞台", desc: "群舞夜阵型切换频繁，要求层次与线条同步达标。", description: "群舞夜阵型切换频繁，要求层次与线条同步达标。", roleName: "群舞核心位", req: { dancing: 160, popularity: 620 }, requirements: { dancing: 160, popularity: 620 }, cost: { stamina: 54 }, reward: { money: 112000, popularity: 430, stats: { dancing: 7 } }, time: 2, category: "综艺", tags: ["舞台", "群舞", "阵型"] },
  { id: "job_national_concert_maindance", name: "国民演唱会主舞", type: "演唱会舞台", desc: "主舞位全程追踪，要求长段输出下仍保持高精度。", description: "主舞位全程追踪，要求长段输出下仍保持高精度。", roleName: "演唱会主舞", req: { dancing: 175, charm: 125, popularity: 760 }, requirements: { dancing: 175, charm: 125, popularity: 760 }, cost: { stamina: 60 }, reward: { money: 132000, popularity: 500, stats: { dancing: 8 } }, time: 3, category: "综艺", tags: ["舞台", "演唱会", "主舞"] },
  { id: "job_riftstage_debut", name: "裂空舞台首秀", type: "首秀舞台", desc: "首秀镜头一镜到底，开场八拍需零偏差命中机位。", description: "首秀镜头一镜到底，开场八拍需零偏差命中机位。", roleName: "首秀主舞", req: { dancing: 190, charm: 135, popularity: 900 }, requirements: { dancing: 190, charm: 135, popularity: 900 }, cost: { stamina: 62 }, reward: { money: 152000, popularity: 580, stats: { dancing: 8 } }, time: 3, category: "综艺", tags: ["舞台", "首秀", "机位"] },
  { id: "job_neon_fantasia_groupdance", name: "霓光狂想齐舞夜", type: "群舞舞台", desc: "高密度齐舞编排，要求全队卡点与队形线条统一。", description: "高密度齐舞编排，要求全队卡点与队形线条统一。", roleName: "齐舞领舞", req: { dancing: 205, popularity: 1060 }, requirements: { dancing: 205, popularity: 1060 }, cost: { stamina: 64 }, reward: { money: 172000, popularity: 650, stats: { dancing: 9 } }, time: 3, category: "综艺", tags: ["舞台", "齐舞", "高密度"] },
  { id: "job_burnplan_maindance", name: "燃场计划主舞位", type: "主舞企划", desc: "主舞企划要求强弱拍切换精准，爆发段稳定可复现。", description: "主舞企划要求强弱拍切换精准，爆发段稳定可复现。", roleName: "主舞核心", req: { dancing: 220, charm: 145, popularity: 1220 }, requirements: { dancing: 220, charm: 145, popularity: 1220 }, cost: { stamina: 66 }, reward: { money: 192000, popularity: 720, stats: { dancing: 9 } }, time: 3, category: "综艺", tags: ["舞台", "主舞", "爆发"] },
  { id: "job_tidenight_linkupdance", name: "潮夜回响联动舞", type: "联动舞台", desc: "跨舞种联动任务，要求风格统一且保留个人记忆点。", description: "跨舞种联动任务，要求风格统一且保留个人记忆点。", roleName: "联动主舞", req: { dancing: 235, popularity: 1380 }, requirements: { dancing: 235, popularity: 1380 }, cost: { stamina: 68 }, reward: { money: 214000, popularity: 800, stats: { dancing: 10 } }, time: 3, category: "综艺", tags: ["舞台", "联动", "跨舞种"] },
  { id: "job_storm_return_encore", name: "风暴返场加演", type: "返场加演", desc: "加演体能压力更高，需保证后半段动作不塌架。", description: "加演体能压力更高，需保证后半段动作不塌架。", roleName: "返场主舞", req: { dancing: 250, charm: 155, popularity: 1550 }, requirements: { dancing: 250, charm: 155, popularity: 1550 }, cost: { stamina: 70 }, reward: { money: 236000, popularity: 880, stats: { dancing: 10 } }, time: 3, category: "综艺", tags: ["舞台", "返场", "加演"] },
  { id: "job_mirror_zero_duet", name: "镜面失重双人舞", type: "双人舞台", desc: "双人高难编排，交接位和视线点必须全程精确。", description: "双人高难编排，交接位和视线点必须全程精确。", roleName: "双人主舞", req: { dancing: 265, popularity: 1720 }, requirements: { dancing: 265, popularity: 1720 }, cost: { stamina: 72 }, reward: { money: 258000, popularity: 960, stats: { dancing: 11 } }, time: 3, category: "综艺", tags: ["舞台", "双人", "高难"] },
  { id: "job_nightvoyage_heartbeat_rework", name: "夜航心跳改编场", type: "舞台改编", desc: "改编场重构节奏段落，要求动作线条与音乐爆点同步。", description: "改编场重构节奏段落，要求动作线条与音乐爆点同步。", roleName: "改编主舞", req: { dancing: 280, charm: 165, popularity: 1880 }, requirements: { dancing: 280, charm: 165, popularity: 1880 }, cost: { stamina: 74 }, reward: { money: 282000, popularity: 1040, stats: { dancing: 11 } }, time: 3, category: "综艺", tags: ["舞台", "改编", "爆点"] },
  { id: "job_finalwave_closing", name: "终章浪潮压轴场", type: "压轴舞台", desc: "终章压轴需保证尾段爆发与线条完整度双达标。", description: "终章压轴需保证尾段爆发与线条完整度双达标。", roleName: "终章压轴主舞", req: { dancing: 295, popularity: 2060 }, requirements: { dancing: 295, popularity: 2060 }, cost: { stamina: 76 }, reward: { money: 308000, popularity: 1130, stats: { dancing: 12 } }, time: 4, category: "综艺", tags: ["舞台", "压轴", "终章"] },
  { id: "job_national_dancenight_home", name: "国民舞夜主场", type: "舞台盛会", desc: "主场位高压直播，要求控场节奏优先于炫技堆叠。", description: "主场位高压直播，要求控场节奏优先于炫技堆叠。", roleName: "主场主舞", req: { dancing: 310, charm: 180, popularity: 2250 }, requirements: { dancing: 310, charm: 180, popularity: 2250 }, cost: { stamina: 78 }, reward: { money: 336000, popularity: 1220, stats: { dancing: 12, charm: 3 } }, time: 4, category: "综艺", tags: ["舞台", "主场", "盛会"] },
  { id: "job_peak_dancewar_finalnight", name: "巅峰舞战总夜", type: "舞台总决", desc: "总夜收官战，要求连续高完成度并稳定交付冠军线版本。", description: "总夜收官战，要求连续高完成度并稳定交付冠军线版本。", roleName: "总夜核心位", req: { dancing: 325, popularity: 2450 }, requirements: { dancing: 325, popularity: 2450 }, cost: { stamina: 80 }, reward: { money: 368000, popularity: 1320, stats: { dancing: 13 } }, time: 4, category: "综艺", tags: ["舞台", "总决", "收官"] },
];

export const CLOTHING_ITEMS: Clothing[] = [
  { id: "basic_suit", name: "经典西装", desc: "稳重正式", cost: 3000, bonus: { charm: 5 }, styleTag: "现代" },
  { id: "stage_dress", name: "舞台礼服", desc: "舞台辨识度更高", cost: 8000, bonus: { appearance: 8, charm: 6 }, styleTag: "舞台" },
  { id: "salt_cheese_knit_dress", name: "海盐芝士针织裙", desc: "奶油白与浅灰纱线叠织，镜头下有柔雾感。", cost: 6200, bonus: { appearance: 4, charm: 4 }, styleTag: "甜美" },
  { id: "moon_silk_robe", name: "月光丝绸睡袍", desc: "低饱和珠光面料，近景特写有天然柔焦。", cost: 5800, bonus: { charm: 5 }, styleTag: "优雅" },
  { id: "mist_mocha_blazer", name: "雾感摩卡西装", desc: "奶咖色挺阔廓形，禁欲又不失柔和。", cost: 7600, bonus: { charm: 6, acting: 2 }, styleTag: "现代" },
  { id: "buttercream_trench", name: "奶油风衣", desc: "中长款剪裁利落，走位时衣摆层次很好看。", cost: 8200, bonus: { appearance: 5, charm: 3 }, styleTag: "现代" },
  { id: "oat_milk_cardigan", name: "燕麦奶开衫", desc: "软糯针织带慵懒气质，适合日常营业。", cost: 3600, bonus: { charm: 4 }, styleTag: "甜美" },
  { id: "vanilla_pleated_set", name: "香草百褶套装", desc: "少女感轮廓但线条干净，镜头友好。", cost: 6900, bonus: { appearance: 6, dancing: 1 }, styleTag: "甜美" },
  { id: "fog_rose_blouse", name: "雾玫瑰雪纺衬衫", desc: "轻薄飘带在风里很有戏感。", cost: 4100, bonus: { charm: 4, acting: 1 }, styleTag: "优雅" },
  { id: "pearl_milk_skirt", name: "珍珠奶盖短裙", desc: "高腰线拉长比例，舞台近景显腿型。", cost: 4700, bonus: { appearance: 5, dancing: 1 }, styleTag: "甜美" },
  { id: "cream_wave_gown", name: "奶浪曳地长裙", desc: "大摆拖尾适合红毯定点，出片率极高。", cost: 15800, bonus: { appearance: 10, charm: 6 }, styleTag: "优雅" },
  { id: "ivory_bow_heels", name: "象牙蝴蝶结高跟", desc: "脚背线条修长，搭配礼服显得干净。", cost: 5200, bonus: { charm: 4 }, styleTag: "优雅" },
  { id: "cloud_sugar_sneaker", name: "云糖运动鞋", desc: "奶白配色轻盈，练舞时脚感稳定。", cost: 3300, bonus: { dancing: 3 }, styleTag: "运动" },
  { id: "matcha_line_jacket", name: "抹茶线条机能外套", desc: "层次口袋设计，街拍很上镜。", cost: 6400, bonus: { charm: 5, dancing: 1 }, styleTag: "街头" },
  { id: "graphite_crop_top", name: "石墨短款训练上衣", desc: "高弹面料贴合动作，排练友好。", cost: 2800, bonus: { dancing: 2, singing: 1 }, styleTag: "运动" },
  { id: "latte_wide_pants", name: "拿铁阔腿裤", desc: "垂坠感自然，适合通勤与综艺录制。", cost: 3900, bonus: { charm: 3, appearance: 2 }, styleTag: "现代" },
  { id: "frost_silver_chain", name: "霜银锁骨链", desc: "冷光反射利落，近景突出颈线。", cost: 2400, bonus: { charm: 3 }, styleTag: "酷飒" },
  { id: "night_mirror_earcuff", name: "夜镜耳骨夹", desc: "极简金属弧线，舞台灯下辨识度高。", cost: 2100, bonus: { charm: 2, appearance: 1 }, styleTag: "酷飒" },
  { id: "ink_lotus_hanfu", name: "墨荷轻纱汉服", desc: "暗纹叠纱，古装通告上镜加分。", cost: 9800, bonus: { acting: 4, appearance: 4 }, styleTag: "古风" },
  { id: "jade_veil_hanfu", name: "青玉云肩汉服", desc: "云肩层次精致，远近景都不吃亏。", cost: 11200, bonus: { acting: 5, charm: 4 }, styleTag: "古风" },
  { id: "red_plum_cheongsam", name: "绛梅改良旗袍", desc: "收腰线条利落，镜头里气场强。", cost: 8600, bonus: { charm: 6, acting: 2 }, styleTag: "优雅" },
  { id: "obsidian_leather_set", name: "曜黑机车套装", desc: "硬朗皮革与短靴组合，反派感拉满。", cost: 9300, bonus: { charm: 7, appearance: 3 }, styleTag: "酷飒" },
  { id: "ash_street_hoodie", name: "灰烬连帽卫衣", desc: "oversize轮廓带自然街头感。", cost: 3500, bonus: { charm: 3, dancing: 1 }, styleTag: "街头" },
  { id: "mooncake_denim", name: "月白水洗牛仔", desc: "复古洗水色稳重耐看，适合日常跟拍。", cost: 4200, bonus: { charm: 3, popularity: 1 }, styleTag: "街头" },
  { id: "sugar_edge_jumpsuit", name: "糖锋连体服", desc: "立体剪裁突出肢体线条，舞台动作利落。", cost: 7600, bonus: { dancing: 4, charm: 3 }, styleTag: "舞台" },
  { id: "halo_stage_boots", name: "光环舞台长靴", desc: "镜面鞋面吃光，定点时存在感极强。", cost: 6100, bonus: { dancing: 3, appearance: 2 }, styleTag: "舞台" },
  { id: "milky_way_corset", name: "银河束腰上衣", desc: "腰线干净锐利，适配高能舞台。", cost: 6900, bonus: { charm: 4, appearance: 3 }, styleTag: "舞台" },
  { id: "honey_mist_blazer", name: "蜜雾短西装", desc: "短款比例显腿长，商务综艺都能穿。", cost: 5400, bonus: { charm: 5 }, styleTag: "现代" },
  { id: "cream_code_shirt", name: "奶白廓形衬衫", desc: "极简廓形，叠穿层次干净。", cost: 3100, bonus: { charm: 3, acting: 1 }, styleTag: "现代" },
  { id: "peach_fuzz_knit", name: "桃绒圆领毛衣", desc: "柔和色阶让人显得更亲近。", cost: 2900, bonus: { charm: 3 }, styleTag: "甜美" },
  { id: "mint_ribbon_set", name: "薄荷缎带套裙", desc: "细缎带点缀不抢戏，镜头亲和。", cost: 4700, bonus: { appearance: 4, charm: 2 }, styleTag: "甜美" },
  { id: "lily_satin_dress", name: "百合缎面礼裙", desc: "柔光缎面适合近景表情戏。", cost: 8300, bonus: { appearance: 7, acting: 1 }, styleTag: "优雅" },
  { id: "ivory_cashmere_coat", name: "象牙羊绒大衣", desc: "挺阔落肩剪裁，秋冬拍摄很出片。", cost: 9800, bonus: { charm: 6, appearance: 2 }, styleTag: "优雅" },
  { id: "nude_cloud_scarf", name: "裸云羊毛围巾", desc: "低饱和配色，提升人物温柔感。", cost: 1800, bonus: { charm: 2 }, styleTag: "优雅" },
  { id: "neon_strike_set", name: "霓虹破晓套装", desc: "高对比拼色，适合竞技风节目。", cost: 7200, bonus: { dancing: 3, popularity: 2 }, styleTag: "酷飒" },
  { id: "black_swan_gloves", name: "黑天鹅长手套", desc: "舞台镜头延长手臂线条，气场倍增。", cost: 2600, bonus: { charm: 3, appearance: 1 }, styleTag: "舞台" },
  { id: "mist_gold_hairpin", name: "雾金簪", desc: "古风盘发点缀，细节很提气质。", cost: 2400, bonus: { acting: 2, charm: 2 }, styleTag: "古风" },
  { id: "river_moon_belt", name: "江月腰封", desc: "古装镜头里收腰利落，强化角色身份感。", cost: 3100, bonus: { acting: 2, appearance: 2 }, styleTag: "古风" },
  { id: "snow_ink_fan", name: "雪墨团扇", desc: "道具级配饰，古风海报出片率高。", cost: 2200, bonus: { acting: 2, charm: 1 }, styleTag: "古风" },
  { id: "cocoa_moto_boots", name: "可可机车靴", desc: "厚底稳重，动作戏更有发力感。", cost: 4300, bonus: { dancing: 2, charm: 2 }, styleTag: "酷飒" },
  { id: "graphite_ring_set", name: "石墨戒组", desc: "极简戒组可叠戴，镜头细节感强。", cost: 1700, bonus: { charm: 2 }, styleTag: "酷飒" },
  { id: "milk_tea_crossbag", name: "奶茶斜挎包", desc: "轻体量包型，日常街拍友好。", cost: 2600, bonus: { appearance: 2, charm: 1 }, styleTag: "现代" },
  { id: "iris_perfume_pin", name: "鸢尾香调胸针", desc: "冷香调金属胸针，商务场合稳重加分。", cost: 2300, bonus: { charm: 2, popularity: 1 }, styleTag: "现代" },
  { id: "silver_lace_dress", name: "银纱云缎礼服", desc: "层叠轻纱随步伐摆动，红毯镜头极具流动感。", cost: 16800, bonus: { appearance: 11, charm: 6 }, styleTag: "优雅" },
  { id: "starlit_mesh_top", name: "星尘网纱上衣", desc: "细闪网纱营造轻盈舞台感，适合灯光秀。", cost: 4900, bonus: { charm: 4, dancing: 2 }, styleTag: "舞台" },
  { id: "cotton_soda_set", name: "棉花汽水套装", desc: "清新配色强化邻家感，综艺路人缘加分。", cost: 4500, bonus: { charm: 4, popularity: 1 }, styleTag: "甜美" },
];

export const ITEMS = CLOTHING_ITEMS;
export const STYLE_MATCH_RATING_BONUS = 1;

export const getOutfitStyleBonus = (job: Job, clothing: Clothing | null): number => {
  if (!job || !clothing || !clothing.styleTag || !job.tags || job.tags.length === 0) return 0;
  return job.tags.includes(clothing.styleTag) ? STYLE_MATCH_RATING_BONUS : 0;
};

export const DEADLINES: Deadline[] = [{ year: 1, month: 12, week: 30, title: "年度考核", desc: "达到基础门槛", condition: (player) => player.stats.popularity >= 100 || player.money >= 20000, failLines: [{ speaker: "旁白", text: "你未通过年度考核。" }] }];
export const ENDINGS: Ending[] = [
  { id: "ending_star", title: "星光璀璨", desc: "你成为顶流。", condition: (player) => player.stats.popularity >= 20000, lines: [{ speaker: "旁白", text: "掌声如潮，你站在舞台中央。" }] },
  { id: "ending_plain", title: "平稳落幕", desc: "你仍在行业中前行。", condition: () => true, lines: [{ speaker: "旁白", text: "故事还在继续。" }] },
];
export const QUESTS: Quest[] = [{ id: "q_training_start", title: "初露锋芒", desc: "任一基础属性达到30", type: "short", condition: (player) => player.stats.acting >= 30 || player.stats.singing >= 30 || player.stats.dancing >= 30 || player.stats.appearance >= 30, reward: { money: 1000, stats: { charm: 5 } } }];

export const FACILITIES: Record<FacilityId, Facility> = {
  gym: { id: "gym", name: "健身房", desc: "提升体力上限", levels: [{ level: 1, cost: { money: 5000, time: 2 }, bonus: 20, bonusDesc: "体力上限 +20" }, { level: 2, cost: { money: 15000, time: 4 }, bonus: 50, bonusDesc: "体力上限 +50" }] },
  studio: { id: "studio", name: "录音棚", desc: "提升唱功训练效果", levels: [{ level: 1, cost: { money: 8000, time: 2 }, bonus: 0.2, bonusDesc: "唱功训练效果 +20%" }, { level: 2, cost: { money: 20000, time: 4 }, bonus: 0.5, bonusDesc: "唱功训练效果 +50%" }] },
  classroom: { id: "classroom", name: "表演教室", desc: "提升演技训练效果", levels: [{ level: 1, cost: { money: 8000, time: 2 }, bonus: 0.2, bonusDesc: "演技训练效果 +20%" }, { level: 2, cost: { money: 20000, time: 4 }, bonus: 0.5, bonusDesc: "演技训练效果 +50%" }] },
  rehearsal: { id: "rehearsal", name: "舞台排练厅", desc: "提升舞蹈训练效果", levels: [{ level: 1, cost: { money: 9000, time: 2 }, bonus: 0.2, bonusDesc: "舞蹈训练效果 +20%" }, { level: 2, cost: { money: 24000, time: 4 }, bonus: 0.5, bonusDesc: "舞蹈训练效果 +50%" }] },
  pr_center: { id: "pr_center", name: "公关策略中心", desc: "提升魅力训练效果", levels: [{ level: 1, cost: { money: 12000, time: 3 }, bonus: 0.15, bonusDesc: "魅力成长效果 +15%" }, { level: 2, cost: { money: 32000, time: 5 }, bonus: 0.35, bonusDesc: "魅力成长效果 +35%" }] },
  media_dept: { id: "media_dept", name: "媒体运营部", desc: "提升人气增长效率", levels: [{ level: 1, cost: { money: 15000, time: 3 }, bonus: 0.15, bonusDesc: "人气成长效果 +15%" }, { level: 2, cost: { money: 36000, time: 6 }, bonus: 0.4, bonusDesc: "人气成长效果 +40%" }] },
};

export const ENCOUNTER_CONFIG: EncounterConfig[] = [
  {
    id: "encounter_shenmo",
    charId: "shen_mo",
    location: "通告大厅",
    timeRange: { yearStart: 3, yearEnd: 3, weekStart: 1, weekEnd: 2 },
    requiredJobId: "sheng_tang_jin_xiu_zhi",
    requiredFame: 0,
    isMissable: true,
    storyId: "shenmo_encounter",
  },
  {
    id: "encounter_luxingran",
    charId: "lu_xingran",
    location: "通告大厅",
    timeRange: { yearStart: 1, yearEnd: 1, weekStart: 1, weekEnd: 3 },
    requiredJobId: "summer_starlight_festival",
    requiredFame: 0,
    isMissable: true,
    storyId: "luxingran_encounter",
  },
  {
    id: "encounter_liumengyao",
    charId: "liu_mengyao",
    location: "经纪公司",
    timeRange: { yearStart: 1, yearEnd: 1, weekStart: 1, weekEnd: 1 },
    requiredFame: 0,
    isMissable: true,
    storyId: "liumengyao_encounter",
  },
  {
    id: "encounter_sutangtang",
    charId: "su_tangtang",
    location: "通告大厅",
    timeRange: { yearStart: 2, yearEnd: 2, weekStart: 2, weekEnd: 4 },
    requiredJobId: "starlight_trainee_s2",
    requiredUnlockedCharacters: ["liu_mengyao"],
    requiredFame: 0,
    isMissable: true,
    storyId: "sutangtang_encounter",
  },
  {
    id: "encounter_guchengyan",
    charId: "gu_chengyan",
    location: "通告大厅",
    timeRange: { yearStart: 5, yearEnd: 7, weekStart: 1, weekEnd: 48 },
    requiredJobId: "gucheng_brand",
    requiredFame: 1000,
    isMissable: true,
    storyId: "guchengyan_encounter",
  },
  {
    id: "encounter_linyu",
    charId: "lin_yu",
    location: "回老家",
    timeRange: { yearStart: 1, yearEnd: 3, weekStart: 1, weekEnd: 4 },
    requiredFame: 0,
    isMissable: true,
    storyId: "linyu_encounter",
  },
  {
    id: "encounter_zhouyan",
    charId: "zhou_yan",
    location: "通告大厅",
    timeRange: { yearStart: 4, yearEnd: 4, weekStart: 2, weekEnd: 4 },
    requiredJobId: "esports_fps",
    requiredFame: 0,
    isMissable: true,
    storyId: "zhouyan_encounter",
  },
  {
    id: "encounter_jiangmuci",
    charId: "jiang_muci",
    location: "经纪公司/我的小屋/通告大厅/周边外出",
    timeRange: { yearStart: 1, yearEnd: 99, weekStart: 1, weekEnd: 48 },
    requiredUnlockedCharacters: ["su_tangtang"],
    requiredCharacterFavor: { su_tangtang: 51 },
    requiredFame: 0,
    isMissable: false,
    storyId: "jiangmuci_encounter",
  },
  {
    id: "encounter_jimingxuan",
    charId: "ji_mingxuan",
    location: "通告大厅",
    timeRange: { yearStart: 4, yearEnd: 4, weekStart: 6, weekEnd: 8 },
    requiredJobId: "daming_fengyun",
    requiredFame: 0,
    isMissable: true,
    storyId: "jimingxuan_encounter",
  },
];

export const SPECIAL_EVENT_CONFIG: SpecialEventConfig[] = [
  {
    id: "shenmo_event1",
    charId: "shen_mo",
    stageRequired: "",
    favorMin: 20,
    storyId: "shenmo_event1",
    riskTable: {
      陌生: [0, -1, -2, 1],
      熟悉: [1, 1, 0, 2],
      暧昧: [2, 2, 2, 3],
      心动: [3, 3, 4, 4],
    },
  },
  {
    id: "shenmo_event2",
    charId: "shen_mo",
    stageRequired: "",
    favorMin: 40,
    requiredPrevEvent: "shenmo_event1",
    storyId: "shenmo_event2",
    riskTable: {
      陌生: [-1, -2, -3, 0],
      熟悉: [1, 0, -1, 1],
      暧昧: [2, 2, 1, 2],
      心动: [3, 3, 4, 3],
    },
  },
  {
    id: "liumengyao_event1",
    charId: "liu_mengyao",
    stageRequired: "",
    favorMin: 30,
    storyId: "liumengyao_event1",
    riskTable: {
      陌生: [-1, -2, -3, -2],
      熟悉: [1, 0, -1, 1],
      暧昧: [2, 1, 1, 2],
      心动: [3, 3, 4, 3],
    },
  },
  {
    id: "liumengyao_event2",
    charId: "liu_mengyao",
    stageRequired: "",
    favorMin: 50,
    requiredPrevEvent: "liumengyao_event1",
    storyId: "liumengyao_event2",
    riskTable: {
      熟悉: [2, 1, 0, 1],
      暧昧: [3, 2, 2, 2],
      心动: [4, 3, 4, 4],
    },
  },
  {
    id: "liumengyao_event3",
    charId: "liu_mengyao",
    stageRequired: "",
    favorMin: 70,
    requiredPrevEvent: "liumengyao_event2",
    storyId: "liumengyao_event3",
    riskTable: {
      陌生: [1, 0, -2, -1],
      熟悉: [1, 1, 0, 1],
      暧昧: [2, 2, 1, 2],
      心动: [3, 3, 4, 4],
    },
  },
  {
    id: "liumengyao_event4",
    charId: "liu_mengyao",
    stageRequired: "",
    favorMin: 85,
    requiredPrevEvent: "liumengyao_event3",
    storyId: "liumengyao_event4",
    riskTable: {
      熟悉: [-1, -2, -3, -1],
      暧昧: [2, 1, 0, 1],
      心动: [4, 5, 4, 3],
    },
  },
];

export const getStatName = (key: string) =>
  (
    {
      appearance: "颜值",
      acting: "演技",
      singing: "唱功",
      dancing: "舞蹈",
      charm: "魅力",
      popularity: "人气",
      mood: "心情",
      reputation: "声望",
      stamina: "体力",
      maxStamina: "体力上限",
      money: "金钱",
      favor_liu: "柳梦瑶好感",
      fans: "粉丝",
      awards: "奖项",
      international: "国际知名度",
      produce: "制作力",
      charity: "公益值",
      social: "社交影响",
      esports: "电竞值",
      business: "商业值",
      innovation: "创新力",
      variety: "综艺感",
    } as Record<string, string>
  )[key] || key;
