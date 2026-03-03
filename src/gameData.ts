import shenMoImage from './assets/characters/shen_mo.png';
import liuMengyaoImage from './assets/characters/liu_mengyao.png';
import suTangtangImage from './assets/characters/su_tangtang.png';
import guChengyanImage from './assets/characters/gu_chengyan.png';
import linYuImage from './assets/characters/lin_yu.png';
import jiMingxuanImage from './assets/characters/ji_mingxuan.png';
import luXingranImage from './assets/characters/lu_xingran.png';
import zhouYanImage from './assets/characters/zhou_yan.png';
import jiangMuciImage from './assets/characters/jiang_muci.png';

export type Stats = {
  appearance: number;
  acting: number;
  singing: number;
  dancing: number;
  charm: number;
  popularity: number;
};

export type FacilityId = 'gym' | 'studio' | 'classroom';

export type SocialUser = {
  id: string;
  name: string;
  avatar: string;
  title: string; // e.g., "Actor", "Director", "Gossip Account"
  isVerified: boolean;
  followers: number;
  personality?: string;
  stats?: Partial<Stats>;
};

export type SocialPost = {
  id: string;
  authorId: string; // 'player' or SocialUser.id
  content: string;
  image?: string;
  likes: number;
  comments: string[];
  timestamp: GameTime;
  type: 'text' | 'image' | 'news';
};

export type Message = {
  id: string;
  senderId: string; // 'player' or SocialUser.id
  content: string;
  timestamp: GameTime;
};

export type Conversation = {
  userId: string; // The NPC's ID
  messages: Message[];
};

export type Company = {
  id: string;
  name: string;
  desc: string;
  bonus: Partial<Stats> & { money?: number; maxStamina?: number };
  perk: string;
  commission: number; // 0 to 1
  minStats?: Partial<Stats>;
  minPopularity?: number;
  contractDuration: number; // in weeks
  penalty: number; // base penalty for breaking contract
};

export const COMPANIES: Company[] = [
  {
    id: 'star_shine',
    name: '星耀娱乐',
    desc: '业内老牌公司，资源均衡，对新人比较友好。',
    bonus: { money: 2000, popularity: 50 },
    perk: '每周体力恢复 +5',
    commission: 0.4,
    contractDuration: 48,
    penalty: 50000
  },
  {
    id: 'galaxy_media',
    name: '银河传媒',
    desc: '财大气粗的资本巨头，只看重商业价值。',
    bonus: { money: 10000, charm: 10 },
    perk: '通告金钱收益 +20%',
    commission: 0.6,
    minPopularity: 500,
    contractDuration: 96,
    penalty: 200000
  },
  {
    id: 'muse_studio',
    name: '缪斯工作室',
    desc: '追求艺术极致的小众公司，在业内口碑极佳。',
    bonus: { acting: 20, singing: 10, dancing: 10 },
    perk: '所有技能练习效果 +10%',
    commission: 0.3,
    minStats: { acting: 100 },
    contractDuration: 48,
    penalty: 80000
  },
  {
    id: 'independent',
    name: '个人练习生',
    desc: '没有公司依靠，一切都要靠自己打拼。',
    bonus: { maxStamina: 20, money: 1000 },
    perk: '自由度高，不受公司抽成 (通告人气 +20%)',
    commission: 0,
    contractDuration: 0,
    penalty: 0
  },
  {
    id: 'idol_factory',
    name: '偶像工厂',
    desc: '专门打造流量爱豆，训练强度极大，但成名快。',
    bonus: { dancing: 30, appearance: 20 },
    perk: '颜值和舞蹈练习效果 +20%',
    commission: 0.7,
    minStats: { appearance: 50 },
    contractDuration: 144,
    penalty: 500000
  },
  {
    id: 'legend_records',
    name: '传奇唱片',
    desc: '音乐界的泰山北斗，只签约有实力的唱将。',
    bonus: { singing: 50, popularity: 100 },
    perk: '唱功练习效果 +30%',
    commission: 0.4,
    minStats: { singing: 150 },
    contractDuration: 72,
    penalty: 150000
  }
];

export type Player = {
  name: string;
  companyId: string;
  contractEnd?: GameTime;
  stamina: number;
  maxStamina: number;
  money: number;
  stats: Stats;
  reputation: number; // -100 to 100, 0 is neutral
  inventory: string[];
  equippedClothing: string | null;
  avatar?: string;
  facilities: Record<FacilityId, number>;
  completedQuests: string[];
  jobsCompleted: number;
  social: {
    followers: number;
    following: string[]; // List of SocialUser.id
    posts: SocialPost[];
    conversations: Conversation[];
    relationships: Record<string, number>;
  };
};

export const SOCIAL_USERS: SocialUser[] = [
  { 
    id: 'senior_chen', 
    name: '陈星宇', 
    avatar: 'Jack', 
    title: '当红影帝', 
    isVerified: true, 
    followers: 5000000, 
    personality: '高冷且专业，惜字如金，偶尔分享片场感悟',
    stats: { acting: 180, charm: 150, popularity: 5000, appearance: 140 }
  },
  { 
    id: 'rival_su', 
    name: '苏娜', 
    avatar: 'Jocelyn', 
    title: '新人偶像', 
    isVerified: true, 
    followers: 800000, 
    personality: '元气满满，喜欢分享练习生活，经常回复粉丝',
    stats: { acting: 60, singing: 80, dancing: 90, charm: 120, popularity: 800, appearance: 130 }
  },
  { 
    id: 'director_wang', 
    name: '王导', 
    avatar: 'Kingston', 
    title: '知名导演', 
    isVerified: true, 
    followers: 200000, 
    personality: '严肃认真，对艺术有执念，偶尔吐槽行业乱象' 
  },
  { 
    id: 'gossip_king', 
    name: '圈内扒皮王', 
    avatar: 'Felix', 
    title: '娱乐博主', 
    isVerified: false, 
    followers: 3000000, 
    personality: '毒舌犀利，喜欢用各种缩写爆料，看热闹不嫌事大' 
  },
  { 
    id: 'fashion_daily', 
    name: '时尚芭莎', 
    avatar: 'Sophia', 
    title: '时尚媒体', 
    isVerified: true, 
    followers: 1500000, 
    personality: '专业优雅，分享最新时尚趋势和高端大片' 
  },
  {
    id: 'idol_kris',
    name: 'Kris',
    avatar: 'Alexander',
    title: '顶流爱豆',
    isVerified: true,
    followers: 8000000,
    personality: '酷帅狂霸拽，舞台王者',
    stats: { singing: 160, dancing: 170, charm: 180, popularity: 8000, appearance: 160 }
  },
  {
    id: 'actress_lin',
    name: '林婉儿',
    avatar: 'Valentina',
    title: '国民闺女',
    isVerified: true,
    followers: 3000000,
    personality: '温柔甜美，演技派小花',
    stats: { acting: 140, charm: 130, popularity: 3000, appearance: 120 }
  }
];

export const MOCK_POSTS: SocialPost[] = [
  {
    id: 'post_chen_1',
    authorId: 'senior_chen',
    content: '新戏杀青，感谢大家的努力。🎬',
    likes: 120000,
    comments: ['哥哥辛苦了！', '期待新作品！', '太帅了！'],
    timestamp: { year: 1, month: 1, week: 1 },
    type: 'text'
  },
  {
    id: 'post_su_1',
    authorId: 'rival_su',
    content: '今天的练习也很充实，加油！💪',
    likes: 5000,
    comments: ['娜娜加油！', '最棒的！'],
    timestamp: { year: 1, month: 1, week: 1 },
    type: 'text'
  },
  {
    id: 'post_gossip_1',
    authorId: 'gossip_king',
    content: '【独家】某L姓小鲜肉片场耍大牌，气走导演？吃瓜👉',
    likes: 50000,
    comments: ['谁啊谁啊？', 'L姓？林？李？', '现在的流量真是...'],
    timestamp: { year: 1, month: 1, week: 1 },
    type: 'news'
  }
];

export type GameTime = {
  year: number;
  month: number;
  week: number;
};

export type LocationId = 'home' | 'company' | 'city' | 'jobs' | 'schedule' | 'wardrobe' | 'trophy' | 'quests' | 'social';

export type IndustryEvent = {
  title: string;
  scenario: string;
  choices: {
    text: string;
    impact: string;
    rewards: Partial<Stats> & { money?: number; popularity?: number; reputation?: number };
  }[];
};

export type ActionEffect = Partial<Stats> & { stamina?: number; maxStamina?: number; money?: number; reputation?: number };

export type Action = {
  id: string;
  name: string;
  desc: string;
  cost: { stamina: number; money: number };
  effect: ActionEffect;
  time: number;
};

export type Job = {
  id: string;
  name: string;
  desc: string;
  req: Partial<Stats>;
  cost: { stamina: number; money?: number };
  reward: { money: number; popularity: number };
  time: number;
};

export type Level = {
  name: string;
  minPopularity: number;
  minTotalStats: number;
};

export type Deadline = {
  year: number;
  month: number;
  week: number;
  title: string;
  desc: string;
  condition: (player: Player, completedAchievements: string[]) => boolean;
  failLines: StoryLine[];
};

export type Ending = {
  id: string;
  title: string;
  desc: string;
  condition: (player: Player, completedAchievements: string[]) => boolean;
  lines: StoryLine[];
};

export type QuestId = string;

export type Quest = {
  id: QuestId;
  title: string;
  desc: string;
  type: 'short' | 'long';
  condition: (player: Player, time: GameTime) => boolean;
  reward: {
    money?: number;
    stats?: Partial<Stats>;
    items?: string[];
  };
};

export type Background = {
  id: string;
  name: string;
  desc: string;
  bonus: Partial<Stats> & { money?: number; maxStamina?: number };
};

export const BACKGROUNDS: Background[] = [
  {
    id: 'rich_kid',
    name: '富二代',
    desc: '家境优渥，不缺钱花，但可能被认为是用钱砸出来的资源。',
    bonus: { money: 50000, charm: 10, popularity: 5 }
  },
  {
    id: 'talent_show',
    name: '选秀回锅肉',
    desc: '参加过多次选秀，有一定的粉丝基础和舞台经验。',
    bonus: { popularity: 50, dancing: 10, singing: 10, money: 2000 }
  },
  {
    id: 'drama_student',
    name: '科班出身',
    desc: '戏剧学院毕业，受过系统的表演训练。',
    bonus: { acting: 20, appearance: 5, money: 1000 }
  },
  {
    id: 'street_performer',
    name: '街头艺人',
    desc: '在街头摸爬滚打，拥有极强的现场感染力。',
    bonus: { singing: 15, charm: 15, money: 500 }
  },
  {
    id: 'ordinary_student',
    name: '普通学生',
    desc: '怀揣梦想的普通人，一切都要从零开始。',
    bonus: { money: 5000, maxStamina: 20 } // More stamina to work hard
  }
];

export type StartingBonus = {
  id: string;
  name: string;
  desc: string;
  bonus: Partial<Stats> & { money?: number; maxStamina?: number };
};

export const STARTING_BONUSES: StartingBonus[] = [
  {
    id: 'visual_center',
    name: '天生神颜',
    desc: '老天爷赏饭吃，站在那里就是风景。',
    bonus: { appearance: 20, charm: 10 }
  },
  {
    id: 'dance_machine',
    name: '舞蹈机器',
    desc: '拥有惊人的肢体协调性和节奏感。',
    bonus: { dancing: 25 }
  },
  {
    id: 'vocal_powerhouse',
    name: '天籁之音',
    desc: '拥有被天使吻过的嗓音。',
    bonus: { singing: 25 }
  },
  {
    id: 'method_actor',
    name: '体验派天才',
    desc: '极具共情能力，演什么像什么。',
    bonus: { acting: 25 }
  },
  {
    id: 'social_butterfly',
    name: '社交达人',
    desc: '长袖善舞，在圈内拥有良好的人缘。',
    bonus: { charm: 20, popularity: 20 }
  }
];

export const LEVELS: Level[] = [
  { name: '新人练习生', minPopularity: 0, minTotalStats: 0 },
  { name: '潜力新星', minPopularity: 50, minTotalStats: 100 },
  { name: '出道偶像', minPopularity: 200, minTotalStats: 250 },
  { name: '人气艺人', minPopularity: 500, minTotalStats: 500 },
  { name: '当红炸子鸡', minPopularity: 1000, minTotalStats: 800 },
  { name: '一线大咖', minPopularity: 2500, minTotalStats: 1200 },
  { name: '超级巨星', minPopularity: 5000, minTotalStats: 1800 },
  { name: '传奇影帝/后', minPopularity: 10000, minTotalStats: 2500 },
];

export const getPlayerLevel = (player: Player): string => {
  const totalStats = Object.values(player.stats).reduce((a, b) => a + b, 0);
  const popularity = player.stats.popularity;
  
  let currentLevel = LEVELS[0].name;
  for (const level of LEVELS) {
    if (popularity >= level.minPopularity && totalStats >= level.minTotalStats) {
      currentLevel = level.name;
    } else {
      break;
    }
  }
  return currentLevel;
};

export type Emotion = 'normal' | 'happy' | 'angry' | 'sad' | 'surprised';

export type NPC = {
  id: string;
  name: string;
  title: string;
  color: string;
  avatarSeed: string;
};

export const NPCS: Record<string, NPC> = {
  manager_lin: { id: 'manager_lin', name: '林姐', title: '金牌经纪人', color: 'text-blue-600', avatarSeed: 'Aneka' },
  senior_chen: { id: 'senior_chen', name: '陈星宇', title: '当红影帝', color: 'text-amber-600', avatarSeed: 'Jack' },
  rival_su: { id: 'rival_su', name: '苏娜', title: '傲娇新人', color: 'text-rose-600', avatarSeed: 'Jocelyn' },
  director_wang: { id: 'director_wang', name: '王导', title: '知名导演', color: 'text-emerald-600', avatarSeed: 'Kingston' },
  idol_kris: { id: 'idol_kris', name: 'Kris', title: '顶流爱豆', color: 'text-purple-600', avatarSeed: 'Alexander' },
  actress_lin: { id: 'actress_lin', name: '林婉儿', title: '国民闺女', color: 'text-pink-600', avatarSeed: 'Valentina' },
};

export type CharacterProfile = {
  bio: string;
  surface: string;
  reversal: string;
  coreQuotes: string[];
  tags: string[];
};

export const CHARACTER_PROFILES: Record<string, CharacterProfile> = {
  shen_mo: {
    
    bio: '伪佛系外表下极度清醒的影帝，克制温和，却在情感上有强烈占有与不安。',
    surface: '29岁，三金影帝，出道即巅峰，却在事业最盛时选择“半隐退”，只接小众剧本，不综艺、不炒作、不营业。干净利落的短发，发尾带着点自然卷，常穿洗得柔软的素色棉麻衬衫，袖口永远挽到小臂，露出腕间一块不起眼的旧手表（是他扶持的第一个新人导演送的）。待人温和却有距离感，采访时笑意浅浅，眼尾弯起却不抵达眼底，指尖总无意识摩挲手表表冠，被问起名利时只淡声答“够用就好”，活成圈内人人称羡的“佛系标杆”，却没人见过他独处时眼底的冷意。',
    reversal: '看似对一切都无所谓，实则是圈内最清醒的“操盘手”——暗中对接新人导演，筛选优质剧本，用手里握着的半个娱乐圈黑料，不动声色打压恶意营销的资本，从不用来谋利，只守护纯粹的创作和在意的人。他对你的温和从不是偶然，是你进入娱乐圈后第一次遭遇全网黑、连公司都想放弃你时，你仍公开为被恶意网暴的新人同事发声，那份纯粹撞进了他早已看透世事的眼底。他刻意靠近，想把你护在羽翼下，却又怕自己的“算计”弄脏你，只能假装漫不经心。\n私下里他极度缺乏安全感，占有欲刻进骨子里：手机屏保是你未公开的路透图，解锁密码是你的生日，相册里存满你的照片和视频；你和别人说话时他会不动声色地吃醋，过后假装偶遇，笑着问你“刚才在和谁聊天呀”，眼神里藏着不易察觉的敌意。',
    coreQuotes: [
      '“我不是佛系，是懒得应付那些烂人烂事，没必要弄脏自己。”',
      '“这个圈子脏不脏我不在意，我习惯了。但你不该被逼着学会这些。”',
    ],
    tags: ['清醒', '伪佛系', '占有欲', '操盘手', '隐忍'],
  },
  liu_mengyao: {
    bio: '狠辣金牌经纪人，冷硬外壳下是极致护短与创伤驱动的责任感。',
    surface: '31岁，金牌经纪人，手握顶流资源，却也是圈内争议最大的经纪人——黑料缠身，被传“打压艺人”“买水军撕资源”“背后捅刀同行”。永远是一身剪裁利落的黑色西装，妆容冷艳，红唇衬得肤色愈发白皙，眉峰锋利，眼神锐利如刀，说话一针见血，没有多余的废话，只要是她认定的资源，就算不择手段也要拿到手，谈判时坐姿挺拔，指尖会轻轻敲击桌面，气场强大到让人不敢直视。',
    reversal: '她的“狠辣”全是被逼出来的——当年带的第一个艺人被资本逼迫潜规则，不肯妥协就被恶意打压，最后抑郁自杀，她抱着艺人冰冷的身体在停尸间哭了一整夜，发誓再也不会让自己的艺人受委屈。那些黑料，一半是同行泼的脏水，一半是她故意放出去的“保护色”，只有足够“狠”，才能护得住身边的人。你进入娱乐圈后被她看中，她力排众议签下你，私下里会默默照顾你，却嘴硬不说。',
    coreQuotes: [
      '“想动我的艺人，先问问我手里的东西答应不答应，你有胆子，就试试。”',
      '“别怕，有我在，天塌不下来，我不会让任何人欺负你。”',
    ],
    tags: ['狠辣', '护短', '冷艳', '经纪人', '责任感'],
  },
  su_tangtang: {
    bio: '甜妹外壳下的隐忍猎手，为寻找姐姐真相而进入圈内，真心依赖你。',
    surface: '23岁，选秀出道的甜妹歌手，说话自带软乎乎的嗲音，尾音轻轻上扬，脸上总挂着甜甜的笑容，苹果肌饱满，笑起来会露出两颗小小的虎牙。舞台上擅长唱可爱风歌曲，会比心、wink，偶尔忘词会吐吐舌头，一副慌乱又可爱的样子，是粉丝眼里的“甜度天花板”。看似没心没肺，一点小事就会红眼眶，对谁都掏心掏肺，别人稍微对她好一点，就会真诚地道谢，一副很好拿捏的软萌模样。',
    reversal: '她是为了寻找失踪的姐姐才进入娱乐圈——姐姐曾是圈内小有名气的歌手，拒绝潜规则后被恶意打压、网暴，最后离奇失踪。她刻意伪装成软萌甜妹，降低所有人的戒心，暗中调查姐姐失踪的真相，收集资本作恶的证据。你是她在圈内唯一愿意信任的人，她表面爱哭，真正的脆弱只在深夜与姐姐的旧物前流露。',
    coreQuotes: [
      '“谢谢大家喜欢甜甜的糖糖～糖糖会一直给大家唱好听的歌哦～”',
      '“我不是傻，我只是还没动手。等真相出来，一个都别想跑。”',
      '“还好有你，不然我真的撑不下去了，你不要丢下我好不好？”',
    ],
    tags: ['甜妹', '隐忍', '复仇', '伪装', '依赖'],
  },
  gu_chengyan: {
    bio: '温和假面下的白切黑巨鳄，利益至上，却被你的纯粹撬动。',
    surface: '33岁，顾氏集团CEO，横跨地产、金融、文娱的商业巨鳄，永远穿着高定西装，领口系着平整的领带，腕间的百达翡丽低调奢华，气质温和，待人谦和，说话语速平缓，永远带着恰到好处的笑意，哪怕被人刁难，也能从容应对，从不发脾气。公益缠身，经常出席慈善活动，给贫困山区捐学校、捐物资，是外界眼中“有责任、有担当”的企业家。',
    reversal: '骨子里是极度冷漠的“利益至上”者，公益与温和只是包装。你爆火后引起他的注意，他想拉拢你以打击对手、拓展文娱，却又被你的纯粹打动，陷入利用与保护的拉扯：既想掌控局面，又开始失控地在意你。',
    coreQuotes: [
      '“我很欣赏你的才华，愿意给你最好的资源，前提是，你要站在我这边，帮我做一件事。”',
      '“这本来是一场交易，可我现在最怕的，是你真的站到我对面。”',
    ],
    tags: ['白切黑', '利益至上', '掌控', '温和假面', '巨鳄'],
  },
  lin_yu: {
    bio: '温柔偏执的青梅医生，细致体贴到近乎占有。',
    surface: '27岁，三甲医院外科骨干，长相帅气，眉眼温和，戴着一副细框眼镜，气质干净，永远穿着熨烫平整的白大褂，身上带着淡淡的消毒水味道。对待患者耐心细致，会温柔地讲解病情，是医院里的“万人迷”。对你始终保持着青梅竹马的温柔，会记得你所有的喜好，随叫随到，语气温柔得能滴出水来。',
    reversal: '温柔背后带着隐秘的偏执与守护欲，习惯把你的需求放在第一位，宁愿自己受委屈也要让你安心。',
    coreQuotes: [
      '“最近拍戏累，睡眠肯定不好，把这个吃了，能睡个好觉，别硬扛着。”',
      '“我不是想控制你，我只是比任何人都清楚，你离开我会受伤。”',
    ],
    tags: ['青梅', '温柔', '偏执', '医生', '守护'],
  },
  jiang_muci: {
    bio: '糙汉外表、纯情内里的专属保镖，迟钝却把守护刻进骨子里。',
    surface: '27岁，你的专属保镖，身形魁梧结实，肩背宽阔如松，常年穿洗得发白的黑色工装服，袖口卷到小臂，露出布满老茧和浅疤的双手。短发剪得利落，轮廓深邃硬朗，眉眼锋利却不狰狞，自带帅气粗粝感。说话声音粗哑低沉，不擅长表达，大多时候只会说“好”“不行”“小心”，步伐沉稳，自带生人勿近的糙汉气场。',
    reversal: '他虽长着一张凌厉的糙汉脸，内里却是个迟钝又纯情的呆子，不懂人情世故，却把“保护你”刻进了骨子里。你怕黑他就默默跟着，你受伤他手忙脚乱，嘴笨却永远把你放在第一位。',
    coreQuotes: [
      '“对、对不起，我没看好你……都怪我。”',
      '“我、我以后一定更小心，不会再让你受伤了。”',
      '“你……你别嫌我笨就行。”',
    ],
    tags: ['忠犬', '糙汉', '纯情', '保镖', '迟钝'],
  },
  ji_mingxuan: {
    bio: '毒舌孤僻的鬼才编剧，刻薄外衣下是隐秘的执念与心动。',
    surface: '28岁，鬼才编剧，戴着黑框眼镜，镜片后的眼神锐利，性格孤僻，不喜欢社交，常年待在工作室里写剧本。毒舌刻薄，对剧本要求极致苛刻，不管是演员还是导演，只要达不到他的要求都会被骂得狗血淋头。尤其对你，更是毒舌加倍。',
    reversal: '他被你身上的细节深深吸引，暗地里为你写了无数量身剧本。那些毒舌的指责其实是想让你变得更好，也是想把你留在身边更久；他在背后默默调整戏份、避开圈内的坑。',
    coreQuotes: [
      '“就这水平，也配演我写的剧本？连基本的情绪都抓不住，赶紧滚去练，别浪费我的时间！”',
      '“别走……我只是……只是想让你把角色演好，不是故意要骂你的。”',
    ],
    tags: ['毒舌', '才子', '执念', '孤僻', '暗恋'],
  },
  lu_xingran: {
    bio: '阳光顶流的完美假面下是极度不安与病娇占有，执拗地把你当成唯一救赎。',
    surface: '22岁，顶流男团C位，粉丝破亿，台上是活力四射的舞台王者，wave卡点精准，笑起来有浅浅的梨涡，眼尾微微上挑，自带撩感，会主动弯腰和粉丝击掌，对工作人员轻声说“谢谢”，被称为“内娱活人天花板”。镜头前永远元气满满，眼里的光像淬了星光，全网都夸他“干净纯粹，没被圈子污染”，连路透图里，都是笑着帮工作人员搬东西的样子。',
    reversal: '私下里极度缺乏安全感，占有欲刻进骨子里，手机屏保是你未公开的路透图，解锁密码是你的生日，相册里存满你的照片和视频，连你发过的朋友圈截图都按日期分类存好。你们相识于你进入娱乐圈后的一场拼盘演出，他在后台看到你认真练歌的样子，瞬间被吸引，把你当成唯一的救赎，偏执地想把你牢牢抓在手里。他会偷偷跟着你，看着你和别人说话时，指尖会无意识攥紧衣角，指节泛白，过后会假装偶遇，笑着问你“刚才在和谁聊天呀”，眼神里藏着不易察觉的敌意。你随口提过的东西，他会悄悄买来放在你身边，却说是“粉丝送的，用不上”；你和异性多说两句话，他会委屈巴巴地黏着你，眼底泛红，却不敢发脾气，只敢小声问“姐，你是不是不喜欢我了”。',
    coreQuotes: [
      '“姐，你今天和他说话了哦，说了好久呢。”',
      '“以后别理他好不好？我只有你了，别丢下我。”',
    ],
    tags: ['顶流', '阳光', '病娇', '占有欲', '偏执'],
  },
  zhou_yan: {
    bio: '桀骜不驯的电竞天才，拽酷外壳下敏感脆弱，用别扭的方式偷偷守护你。',
    surface: '21岁，KPL四届冠军中单，游戏ID“野火”，直播时桀骜不驯，骚话连篇，操作犀利，每一次五杀都会对着镜头挑眉，语气拽拽的：“就这？还敢来跟我叫板？”面对粉丝的追捧从不谦虚，甚至会怼黑粉“菜就别逼逼”，一副“老子天下第一”的刺头模样。染着一头张扬的浅棕色头发，耳上戴着银色耳钉，穿oversize的潮牌，走路时抬头挺胸，自带拽酷气场，是电竞圈出了名的“天才选手”，也是无数电竞少女的梦中情人。',
    reversal: '看似张扬，实则内心敏感脆弱，从小被父母否定，觉得他打游戏是不务正业，每次他拿到冠军，想和父母分享时，得到的都是“玩物丧志”的指责。只有在游戏里，他才能找到成就感，才能证明自己不是“废物”，他的“拽”是保护自己的外壳，害怕被人看不起，害怕付出真心被伤害。你们相识于你进入娱乐圈后的一次跨界合作（拍摄电竞主题短片），你在片场看他训练时，随口说了一句“你打得很棒”，这句话被他记了三年。他喜欢你，却从不敢直白表达，只会用别扭的方式关心你——偷偷给你打游戏账号充钱，看到你段位提升，会偷偷开心好久；你被网暴时，他会用小号帮你怼人，怼完又会怕被你发现，赶紧删掉记录；你生病时，他笨拙地买一堆药，却嘴硬说是“顺手买的，没人吃浪费”，递药时眼神躲闪，耳尖红得快要滴血，连说话都变得结巴。',
    coreQuotes: [
      '“就这操作？也敢来跟我叫板？纯属找虐！”',
      '“喂，别死撑着，赶紧吃药，耽误我带你打游戏，我可不想带一个病秧子。”',
      '“我……我才不是担心你，别多想。”',
      '“全世界不认我都行，只要你别觉得我没用。”',
    ],
    tags: ['电竞', '嘴硬', '天才', '敏感', '守护'],
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

export type Check = {
  stat: keyof Stats;
  difficulty: number;
  rivalId?: string; // If provided, difficulty is added to rival's stat
  successLine: number;
  failLine: number;
  successEffect?: ActionEffect;
  failEffect?: ActionEffect;
  successEventId?: string; // Event ID to add to completedEvents on success
};

export type StoryChoice = {
  text: string;
  effect?: ActionEffect;
  nextLine?: number;
  check?: Check;
};

export type StoryLine = {
  speaker?: string;
  text: string;
  emotion?: Emotion;
  choices?: StoryChoice[];
};

export type StoryEvent = {
  id: string;
  title: string;
  isTriggered: (time: GameTime, player: Player, completedEvents: string[]) => boolean;
  lines: StoryLine[];
};

export type Achievement = {
  id: string;
  name: string;
  desc: string;
  reward: ActionEffect;
  condition: (player: Player, completedEvents: string[]) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'achieve_intro',
    name: '初出茅庐',
    desc: '完成新手剧情，正式踏入娱乐圈。',
    reward: { money: 1000, maxStamina: 10 },
    condition: (player, completedEvents) => completedEvents.includes('intro')
  },
  {
    id: 'achieve_famous',
    name: '小有名气',
    desc: '人气达到 100，开始拥有自己的粉丝群。',
    reward: { charm: 10, appearance: 5 },
    condition: (player) => player.stats.popularity >= 100
  },
  {
    id: 'achieve_rookie',
    name: '最佳新人',
    desc: '获得一次重要试镜机会并成功。',
    reward: { acting: 20, popularity: 50 },
    condition: (player, completedEvents) => completedEvents.includes('director_audition')
  },
  {
    id: 'achieve_superstar',
    name: '巨星之路',
    desc: '各项能力达到顶尖水平（所有属性≥100，人气≥500）。',
    reward: { money: 100000, maxStamina: 50 },
    condition: (player) => 
      player.stats.popularity >= 500 &&
      player.stats.acting >= 100 &&
      player.stats.singing >= 100 &&
      player.stats.dancing >= 100 &&
      player.stats.appearance >= 100 &&
      player.stats.charm >= 100
  },
  {
    id: 'achieve_millionaire',
    name: '百万富翁',
    desc: '个人资产达到 100,000，实现财务自由。',
    reward: { popularity: 20, charm: 10 },
    condition: (player) => player.money >= 100000
  },
  {
    id: 'achieve_acting_master',
    name: '演技大赏',
    desc: '演技达到 150，能够驾驭任何复杂的角色。',
    reward: { popularity: 50, charm: 20 },
    condition: (player) => player.stats.acting >= 150
  },
  {
    id: 'achieve_singing_master',
    name: '天籁之音',
    desc: '唱功达到 150，每一首歌都能直击灵魂。',
    reward: { popularity: 50, charm: 20 },
    condition: (player) => player.stats.singing >= 150
  },
  {
    id: 'achieve_dancing_master',
    name: '舞动全城',
    desc: '舞蹈达到 150，舞台就是你的领地。',
    reward: { popularity: 50, charm: 20 },
    condition: (player) => player.stats.dancing >= 150
  },
  {
    id: 'achieve_visual_king',
    name: '神颜降世',
    desc: '颜值达到 150，统一全人类审美。',
    reward: { popularity: 50, charm: 30 },
    condition: (player) => player.stats.appearance >= 150
  },
  {
    id: 'achieve_collector',
    name: '时尚弄潮儿',
    desc: '拥有衣橱中所有的服装。',
    reward: { appearance: 10, charm: 10 },
    condition: (player) => player.inventory.length >= 4
  },
  {
    id: 'achieve_rival_win',
    name: '竞争胜利',
    desc: '在一次重要的竞争中战胜对手。',
    reward: { popularity: 100, charm: 20 },
    condition: (player, completedEvents) => completedEvents.includes('rival_audition_win') || completedEvents.includes('award_win')
  }
];

export type RandomEvent = {
  id: string;
  title: string;
  locations: LocationId[];
  probability: number;
  condition?: (player: Player) => boolean;
  getLines: (player: Player) => StoryLine[];
};

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'random_senior',
    title: '偶遇前辈',
    locations: ['company'],
    probability: 0.15,
    getLines: (player) => [
      { speaker: undefined, text: '你在公司走廊里遇到了当红影帝陈星宇。' },
      { speaker: 'senior_chen', text: '最近训练辛苦吗？', emotion: 'happy' },
      { speaker: 'player', text: '前辈好！还在努力中。', emotion: 'happy' },
      { speaker: 'senior_chen', text: '加油，我看好你。', emotion: 'happy' },
      { speaker: undefined, text: '陈星宇随口指点了几句，你感觉受益匪浅。', choices: [
        { text: '谢谢前辈！', effect: { acting: 5, charm: 2 } }
      ]}
    ]
  },
  {
    id: 'random_paparazzi',
    title: '狗仔偷拍',
    locations: ['city'],
    probability: 0.1,
    condition: (player) => player.stats.popularity > 20,
    getLines: (player) => {
      if (player.stats.charm > 30) {
        return [
          { speaker: undefined, text: '你在街上散步时被狗仔偷拍了。' },
          { speaker: undefined, text: '由于你私服品味极佳，照片在网上引起了热议，网友纷纷夸赞你的神仙颜值！' },
          { speaker: undefined, text: '你的魅力和人气上升了。', choices: [
            { text: '（暗自窃喜）', effect: { popularity: 10, charm: 5 } }
          ]}
        ];
      } else {
        return [
          { speaker: undefined, text: '你在街上散步时被狗仔偷拍了。' },
          { speaker: undefined, text: '照片里你显得有些疲惫，不修边幅的样子让一些粉丝感到失望。' },
          { speaker: undefined, text: '你的人气下降了。', choices: [
            { text: '（下次出门要注意形象了）', effect: { popularity: -5 } }
          ]}
        ];
      }
    }
  },
  {
    id: 'random_charity',
    title: '慈善晚宴',
    locations: ['city', 'company'],
    probability: 0.05,
    condition: (player) => player.money >= 5000,
    getLines: (player) => [
      { speaker: 'manager_lin', text: '今晚有个慈善晚宴，很多业界大佬都会去，你要不要捐点钱露个脸？', emotion: 'happy' },
      { speaker: undefined, text: '参加慈善晚宴需要捐款 5000 金钱。', choices: [
        { text: '参加（消耗 5000 金钱）', effect: { money: -5000, popularity: 30, charm: 10 } },
        { text: '婉拒', effect: {} }
      ]}
    ]
  },
  {
    id: 'random_fan',
    title: '狂热粉丝',
    locations: ['city'],
    probability: 0.1,
    condition: (player) => player.stats.popularity > 50,
    getLines: (player) => [
      { speaker: undefined, text: '你在街上被一名狂热粉丝认出来了！' },
      { speaker: undefined, text: '粉丝激动地向你索要签名和合影。', choices: [
        { text: '热情回应', effect: { popularity: 5, stamina: -5 } },
        { text: '礼貌拒绝并离开', effect: { popularity: -2 } }
      ]}
    ]
  },
  {
    id: 'random_rivalry',
    title: '练习室较量',
    locations: ['company'],
    probability: 0.12,
    getLines: (player) => [
      { speaker: undefined, text: '你在练习室挥汗如雨时，苏娜走了进来。' },
      { speaker: 'rival_su', text: '练得挺勤快嘛。敢不敢比试一下？', emotion: 'angry' },
      { speaker: undefined, text: '苏娜向你发起了舞蹈挑战。', choices: [
        { 
          text: '接受挑战', 
          check: {
            stat: 'dancing',
            difficulty: 0,
            rivalId: 'rival_su',
            successLine: 3,
            failLine: 4,
            successEffect: { dancing: 10, popularity: 10, stamina: -10 },
            failEffect: { dancing: 5, stamina: -10 }
          }
        },
        { text: '委婉拒绝', effect: { charm: 2 } }
      ]},
      { speaker: 'rival_su', text: '哼，看来你还有两把刷子。', emotion: 'surprised' }, // Line 3 (Success)
      { speaker: 'rival_su', text: '就这？还需要多练练啊。', emotion: 'happy' } // Line 4 (Fail)
    ]
  },
  {
    id: 'random_lost_item',
    title: '失物招领',
    locations: ['city'],
    probability: 0.08,
    getLines: (player) => [
      { speaker: undefined, text: '你在街角捡到了一个精致的钱包。' },
      { speaker: undefined, text: '里面有一张名片，似乎是某位知名制片人的。', choices: [
        { text: '联系失主归还', effect: { charm: 10, popularity: 5 } },
        { text: '交给警察', effect: { charm: 5 } },
        { text: '私吞（获得 2000 金钱）', effect: { money: 2000, charm: -10 } }
      ]}
    ]
  },
  {
    id: 'random_fashion_show',
    title: '时装周偶遇',
    locations: ['city'],
    probability: 0.05,
    condition: (player) => player.stats.popularity > 200,
    getLines: (player) => [
      { speaker: undefined, text: '你受邀参加了一场时尚秀，在红毯上遇到了顶流爱豆 Kris。' },
      { speaker: 'idol_kris', text: '哟，这不是最近挺火的新人吗？穿得挺别致啊。', emotion: 'normal' },
      { speaker: undefined, text: 'Kris 的眼神中带着一丝挑剔，周围的闪光灯疯狂闪烁。', choices: [
        { 
          text: '自信展示穿搭', 
          check: {
            stat: 'appearance',
            difficulty: 0,
            rivalId: 'idol_kris',
            successLine: 3,
            failLine: 4,
            successEffect: { popularity: 50, charm: 20 },
            failEffect: { popularity: -10 }
          }
        },
        { text: '低调路过', effect: { charm: 5 } }
      ]},
      { speaker: undefined, text: '你的自信和气场完全压住了 Kris，成为了全场焦点！' }, // Line 3
      { speaker: undefined, text: '在 Kris 耀眼的造型面前，你显得有些黯淡无光。' } // Line 4
    ]
  }
];

export const STORY_EVENTS: StoryEvent[] = [
  {
    id: 'intro',
    title: '初入星途',
    isTriggered: (time, player, completedEvents) => !completedEvents.includes('intro'),
    lines: [
      { speaker: undefined, text: '你推开了星耀娱乐公司的大门，这里是你梦想起航的地方。' },
      { speaker: 'manager_lin', text: '你就是新来的练习生吧？我是你的经纪人林姐。', emotion: 'normal' },
      { speaker: 'manager_lin', text: '在这个圈子里，光有梦想是不够的，你必须付出比别人多十倍的努力。', emotion: 'angry' },
      { speaker: 'player', text: '林姐好！我会努力的！', emotion: 'happy' },
      { speaker: 'manager_lin', text: '很好，先去熟悉一下公司的环境吧。记得多去上课提升自己，不要让我失望。', emotion: 'happy' }
    ]
  },
  {
    id: 'first_month_assessment',
    title: '首次考核',
    isTriggered: (time, player, completedEvents) => time.month >= 2 && !completedEvents.includes('first_month_assessment'),
    lines: [
      { speaker: 'manager_lin', text: '一个月过去了，让我看看你的长进。', emotion: 'normal' },
      { speaker: undefined, text: '林姐仔细翻阅了你的训练记录。' },
      { speaker: 'manager_lin', text: '娱乐圈竞争激烈，你觉得自己最大的优势是什么？', emotion: 'surprised', choices: [
        { text: '我的颜值无人能挡', effect: { appearance: 10, charm: 5 } },
        { text: '我有一颗热爱表演的心', effect: { acting: 15 } },
        { text: '我愿意付出汗水', effect: { maxStamina: 20, stamina: 20 } }
      ]},
      { speaker: 'manager_lin', text: '记住你的选择，在这个圈子里，把自己的长处发挥到极致才能站稳脚跟。', emotion: 'happy' }
    ]
  },
  {
    id: 'meet_rival',
    title: '狭路相逢',
    isTriggered: (time, player, completedEvents) => player.stats.popularity >= 10 && !completedEvents.includes('meet_rival'),
    lines: [
      { speaker: undefined, text: '在通告大厅，你遇到了同公司的另一位新人。' },
      { speaker: 'rival_su', text: '哟，这不是那个到处接零活的新人吗？', emotion: 'angry' },
      { speaker: 'player', text: '你好，我是...', emotion: 'surprised' },
      { speaker: 'rival_su', text: '我没兴趣知道你的名字。我叫苏娜，未来的超级巨星。你最好别挡我的道。', emotion: 'angry' },
      { speaker: undefined, text: '苏娜踩着高跟鞋骄傲地离开了。', choices: [
        { text: '（不理会她，专注自己）', effect: { charm: 5 } },
        { text: '（暗暗发誓要超过她）', effect: { acting: 5, singing: 5, dancing: 5 } }
      ]}
    ]
  },
  {
    id: 'rival_audition',
    title: '宿敌之战',
    isTriggered: (time, player, completedEvents) => player.stats.popularity >= 100 && !completedEvents.includes('rival_audition'),
    lines: [
      { speaker: 'manager_lin', text: '这次的广告代言很重要，公司决定在你和苏娜之间选一个人。', emotion: 'normal' },
      { speaker: 'rival_su', text: '呵，这种机会当然是属于我的。你还是趁早放弃吧。', emotion: 'angry' },
      { speaker: undefined, text: '面对苏娜的挑衅，你决定：', choices: [
        { 
          text: '用实力说话（比拼魅力）', 
          check: {
            stat: 'charm',
            difficulty: 0,
            rivalId: 'rival_su',
            successLine: 3,
            failLine: 4,
            successEffect: { popularity: 50, money: 5000, charm: 10 },
            failEffect: { popularity: -10, charm: 2 },
            successEventId: 'rival_audition_win'
          }
        },
        { text: '避其锋芒，寻找其他机会', effect: { charm: 5 } }
      ]},
      { speaker: 'manager_lin', text: '表现不错！厂商对你很满意，这个代言是你的了。', emotion: 'happy' }, // Line 3
      { speaker: 'manager_lin', text: '这次苏娜的表现确实更胜一筹，下次继续努力吧。', emotion: 'sad' } // Line 4
    ]
  },
  {
    id: 'senior_guidance',
    title: '影帝的指点',
    isTriggered: (time, player, completedEvents) => player.stats.acting >= 40 && !completedEvents.includes('senior_guidance'),
    lines: [
      { speaker: undefined, text: '你在公司练习室里苦练演技，突然听到身后传来掌声。' },
      { speaker: 'senior_chen', text: '这段戏的情感爆发力不错，但收尾稍微有点急躁了。', emotion: 'normal' },
      { speaker: 'player', text: '陈、陈星宇前辈？！您怎么会在这里？', emotion: 'surprised' },
      { speaker: 'senior_chen', text: '刚好路过。演戏就像呼吸，要有节奏。来，我教你一个小技巧...', emotion: 'happy' },
      { speaker: undefined, text: '陈星宇耐心地指导了你半个小时，你感觉受益匪浅。', choices: [
        { text: '谢谢前辈！', effect: { acting: 20, popularity: 10 } }
      ]}
    ]
  },
  {
    id: 'director_audition',
    title: '大导的试镜',
    isTriggered: (time, player, completedEvents) => player.stats.acting >= 80 && player.stats.popularity >= 50 && !completedEvents.includes('director_audition'),
    lines: [
      { speaker: 'manager_lin', text: '有个好消息！王导的新戏在找配角，我给你争取到了一个试镜机会。', emotion: 'happy' },
      { speaker: 'player', text: '王导？那个拿过无数大奖的王导？', emotion: 'surprised' },
      { speaker: 'manager_lin', text: '没错，好好准备，别搞砸了。', emotion: 'normal' },
      { speaker: undefined, text: '试镜现场，王导面无表情地看着你。' },
      { speaker: 'director_wang', text: '开始吧，让我看看你的可塑性。', emotion: 'normal' },
      { speaker: undefined, text: '你深吸一口气，开始表演...', choices: [
        { text: '（展现极具爆发力的悲情戏）', effect: { acting: 15, popularity: 30 } },
        { text: '（展现细腻内敛的内心戏）', effect: { charm: 15, popularity: 30 } }
      ]},
      { speaker: 'director_wang', text: '有点意思...回去等通知吧。', emotion: 'happy' }
    ]
  },
  {
    id: 'audition_result_call',
    title: '王导的邀约',
    isTriggered: (time, player, completedEvents) => completedEvents.includes('director_audition') && !completedEvents.includes('audition_result_call'),
    lines: [
      { speaker: 'manager_lin', text: '快接电话！是王导亲自打来的！', emotion: 'surprised' },
      { speaker: 'player', text: '喂，王导您好。', emotion: 'normal' },
      { speaker: 'director_wang', text: '小家伙，你的试镜表现很有灵气。我决定把这个角色交给你。', emotion: 'happy' },
      { speaker: 'director_wang', text: '不过在进组前，我想听听你对这个角色的表演构思。你打算如何诠释他/她？', emotion: 'normal', choices: [
        { text: '追求极致的真实，与角色共情', effect: { acting: 10, charm: 5 } },
        { text: '追求完美的镜头感，精准控制细节', effect: { acting: 8, appearance: 8 } },
        { text: '赋予角色独特的怪癖，让人过目不忘', effect: { acting: 5, popularity: 15 } }
      ]},
      { speaker: 'director_wang', text: '很有想法。希望在片场看到你的表现，下周准时进组。', emotion: 'happy' },
      { speaker: undefined, text: '你成功获得了王导新戏的角色，演艺生涯迈出了坚实的一步！' }
    ]
  },
  {
    id: 'movie_filming',
    title: '进组拍摄',
    isTriggered: (time, player, completedEvents) => completedEvents.includes('audition_result_call') && player.stats.acting >= 100 && !completedEvents.includes('movie_filming'),
    lines: [
      { speaker: 'manager_lin', text: '今天是你进组的第一天，王导对演员要求很严格，你一定要打起十二分精神。', emotion: 'normal' },
      { speaker: 'player', text: '放心吧林姐，我已经把剧本背得滚瓜烂熟了。', emotion: 'happy' },
      { speaker: undefined, text: '片场，第一场戏就是你的重头戏。' },
      { speaker: 'director_wang', text: '各部门准备！Action！', emotion: 'angry' },
      { speaker: undefined, text: '面对镜头，你决定采用哪种表演方式？', choices: [
        { text: '（体验派：完全沉浸在角色中，真情流露）', effect: { acting: 20, charm: 10, stamina: -20 } },
        { text: '（表现派：精准控制每一个表情和动作）', effect: { acting: 15, appearance: 15, stamina: -10 } }
      ]},
      { speaker: 'director_wang', text: '卡！这条过了！表现得不错。', emotion: 'happy' },
      { speaker: 'senior_chen', text: '后生可畏啊，刚才那段戏很有感染力。', emotion: 'happy' },
      { speaker: undefined, text: '电影杀青后，你的知名度大增！', choices: [
        { text: '（继续努力）', effect: { popularity: 100, money: 20000 } }
      ]}
    ]
  },
  {
    id: 'award_ceremony',
    title: '金像奖之夜',
    isTriggered: (time, player, completedEvents) => player.stats.popularity >= 1000 && !completedEvents.includes('award_ceremony'),
    lines: [
      { speaker: undefined, text: '今晚是金像奖颁奖典礼，你作为最佳新人奖的提名者出席。' },
      { speaker: 'manager_lin', text: '别紧张，能提名就是肯定。不过...你的竞争对手可是那个林婉儿。', emotion: 'normal' },
      { speaker: 'actress_lin', text: '（微笑着向你点头）今晚一起加油哦。', emotion: 'happy' },
      { speaker: undefined, text: '主持人：获得本届最佳新人奖的是...', choices: [
        { 
          text: '（屏住呼吸，等待结果）', 
          check: {
            stat: 'acting',
            difficulty: 0,
            rivalId: 'actress_lin',
            successLine: 4,
            failLine: 5,
            successEffect: { popularity: 500, charm: 50, money: 10000 },
            failEffect: { popularity: 50, charm: 10 }
          }
        }
      ]},
      { speaker: undefined, text: '“恭喜——' + '${player.name}' + '！”全场掌声雷动，你激动地走上领奖台。' }, // Line 4
      { speaker: undefined, text: '“恭喜——林婉儿！”虽然有些失落，但你还是大度地为她鼓掌。' } // Line 5
    ]
  }
];

export const LOCATIONS: { id: LocationId; name: string; icon: string }[] = [
  { id: 'home', name: '我的小屋', icon: 'Home' },
  { id: 'company', name: '经纪公司', icon: 'Building2' },
  { id: 'city', name: '星光大道', icon: 'Map' },
  { id: 'jobs', name: '通告大厅', icon: 'Briefcase' },
  { id: 'schedule', name: '行程安排', icon: 'ListTodo' },
  { id: 'wardrobe', name: '衣橱', icon: 'Shirt' },
  { id: 'trophy', name: '荣誉', icon: 'Trophy' },
  { id: 'quests', name: '任务', icon: 'ClipboardList' },
  { id: 'social', name: '社交', icon: 'Smartphone' },
];

export const ACTIONS: Record<string, Action[]> = {
  home: [
    { id: 'rest', name: '休息', desc: '恢复大量体力', cost: { stamina: 0, money: 0 }, effect: { stamina: 40 }, time: 1 },
    { id: 'read', name: '研读剧本', desc: '提升演技', cost: { stamina: 15, money: 0 }, effect: { acting: 2, charm: 1 }, time: 1 },
    { id: 'sing', name: '练习声乐', desc: '提升唱功', cost: { stamina: 15, money: 0 }, effect: { singing: 2, charm: 1 }, time: 1 },
    { id: 'dance', name: '练习舞蹈', desc: '提升舞蹈', cost: { stamina: 15, money: 0 }, effect: { dancing: 2, charm: 1 }, time: 1 },
  ],
  company: [
    { id: 'class_act', name: '高级表演课', desc: '大幅提升演技', cost: { stamina: 20, money: 500 }, effect: { acting: 5 }, time: 1 },
    { id: 'class_sing', name: '高级声乐课', desc: '大幅提升唱功', cost: { stamina: 20, money: 500 }, effect: { singing: 5 }, time: 1 },
    { id: 'class_dance', name: '高级舞蹈课', desc: '大幅提升舞蹈', cost: { stamina: 20, money: 500 }, effect: { dancing: 5 }, time: 1 },
    { id: 'manager', name: '拜访经纪人', desc: '可能获得通告机会或提升魅力', cost: { stamina: 10, money: 0 }, effect: { charm: 2 }, time: 1 },
  ],
  city: [
    { id: 'salon', name: '高级沙龙', desc: '提升颜值', cost: { stamina: 10, money: 1000 }, effect: { appearance: 5 }, time: 1 },
    { id: 'shopping', name: '购买私服', desc: '提升魅力', cost: { stamina: 10, money: 1500 }, effect: { charm: 6 }, time: 1 },
    { id: 'busking', name: '街头表演', desc: '赚取少量金钱和人气', cost: { stamina: 25, money: 0 }, effect: { popularity: 2, money: 200, singing: 1 }, time: 1 },
    { id: 'park', name: '公园散步', desc: '放松心情，恢复少量体力', cost: { stamina: 0, money: 0 }, effect: { stamina: 15 }, time: 1 },
  ]
};

export const JOBS: Job[] = [
  {
    id: 'extra',
    name: '跑龙套',
    desc: '在古装剧中扮演路人甲。',
    req: { acting: 10 },
    cost: { stamina: 30 },
    reward: { money: 800, popularity: 2 },
    time: 1
  },
  {
    id: 'commercial_local',
    name: '地方台广告',
    desc: '拍摄本地小吃广告。',
    req: { appearance: 30, charm: 20 },
    cost: { stamina: 30 },
    reward: { money: 3000, popularity: 10 },
    time: 1
  },
  {
    id: 'idol_stage',
    name: '偶像打歌舞台',
    desc: '作为伴舞参与节目录制。',
    req: { dancing: 40, appearance: 20 },
    cost: { stamina: 40 },
    reward: { money: 2000, popularity: 15 },
    time: 1
  },
  {
    id: 'movie_support',
    name: '电影配角',
    desc: '在院线电影中饰演有台词的配角。',
    req: { acting: 60, popularity: 50 },
    cost: { stamina: 50 },
    reward: { money: 10000, popularity: 50 },
    time: 2
  },
  {
    id: 'album_single',
    name: '发行个人单曲',
    desc: '制作并发行第一首个人单曲。',
    req: { singing: 80, charm: 50 },
    cost: { stamina: 60, money: 5000 },
    reward: { money: 20000, popularity: 100 },
    time: 2
  },
  {
    id: 'movie_lead',
    name: '院线电影主角',
    desc: '担纲大制作电影的男女主角。',
    req: { acting: 120, appearance: 80, popularity: 200 },
    cost: { stamina: 80 },
    reward: { money: 100000, popularity: 300 },
    time: 4
  }
];

export type Clothing = {
  id: string;
  name: string;
  desc: string;
  cost: number;
  bonus: Partial<Stats>;
};

export const CLOTHING_ITEMS: Clothing[] = [
  { id: 'casual_chic', name: '休闲私服', desc: '简约而不失格调的日常穿搭。', cost: 1000, bonus: { charm: 5, appearance: 5 } },
  { id: 'idol_stage', name: '打歌服', desc: '闪耀的舞台服装，吸引眼球。', cost: 3000, bonus: { dancing: 10, charm: 10 } },
  { id: 'elegant_suit', name: '高定礼服', desc: '出席重要场合的必备战袍。', cost: 8000, bonus: { appearance: 20, charm: 20 } },
  { id: 'vintage_dress', name: '复古洋装', desc: '散发着古典气质的精美洋装。', cost: 5000, bonus: { acting: 10, charm: 15 } },
];

export const DEADLINES: Deadline[] = [
  {
    year: 1, month: 12, week: 4,
    title: '年度考核：新人期',
    desc: '作为练习生的一年即将结束，公司将评估你的潜力。要求：人气 > 50，且至少获得 1 个成就。',
    condition: (player, achievements) => player.stats.popularity >= 50 && achievements.length >= 1,
    failLines: [
      { speaker: 'manager_lin', text: '很遗憾，公司认为你这一年的进步未达预期。', emotion: 'sad' },
      { speaker: 'manager_lin', text: '我们决定终止与你的合同。希望你在其他领域能有更好的发展。', emotion: 'normal' },
      { speaker: undefined, text: '你的演艺生涯在第一年画上了句号。' }
    ]
  },
  {
    year: 2, month: 12, week: 4,
    title: '年度考核：成长期',
    desc: '出道后的第二年，市场竞争激烈。要求：人气 > 500，且总属性和 > 400。',
    condition: (player) => {
      const totalStats = Object.values(player.stats).reduce((a, b) => a + b, 0);
      return player.stats.popularity >= 500 && totalStats >= 400;
    },
    failLines: [
      { speaker: 'manager_lin', text: '虽然你已经出道，但目前的商业价值还不足以支撑公司继续投入。', emotion: 'sad' },
      { speaker: 'manager_lin', text: '我们需要暂时停止你的所有通告，进行无限期休整。', emotion: 'normal' },
      { speaker: undefined, text: '你逐渐淡出了大众视野，演艺生涯就此中断。' }
    ]
  }
];

export const ENDINGS: Ending[] = [
  {
    id: 'legend',
    title: '传奇巨星',
    desc: '你成为了娱乐圈不可逾越的巅峰。',
    condition: (player, achievements) => player.stats.popularity >= 10000 && achievements.length >= 10,
    lines: [
      { speaker: undefined, text: '三年时间转瞬即逝。如今的你，站在金像奖的领奖台上。' },
      { speaker: 'player', text: '感谢一直支持我的每一个人。这个奖杯属于我们。', emotion: 'happy' },
      { speaker: undefined, text: '你不仅赢得了名声，更赢得了尊重。你成为了时代的符号。' }
    ]
  },
  {
    id: 'business_tycoon',
    title: '商业大亨',
    desc: '你不仅是艺人，更是掌控资本的商业巨鳄。',
    condition: (player) => player.money >= 500000,
    lines: [
      { speaker: undefined, text: '三年期满，你没有续约，而是收购了星耀娱乐的大部分股份。' },
      { speaker: 'manager_lin', text: '老板好！以后请多关照。', emotion: 'surprised' },
      { speaker: 'player', text: '林姐，以后我们就是合伙人了。', emotion: 'happy' },
      { speaker: undefined, text: '你用精明的头脑征服了娱乐圈的资本市场，成为了真正的幕后操盘手。' }
    ]
  },
  {
    id: 'legendary_singer',
    title: '歌坛神话',
    desc: '你的歌声传遍了世界的每一个角落。',
    condition: (player) => player.stats.popularity >= 4000 && player.stats.singing >= 200,
    lines: [
      { speaker: undefined, text: '你的全球巡回演唱会场场爆满，一票难求。' },
      { speaker: undefined, text: '粉丝们挥舞着荧光棒，汇聚成一片星海。' },
      { speaker: 'player', text: '这首歌，送给每一个有梦想的人。', emotion: 'happy' },
      { speaker: undefined, text: '你被誉为百年一遇的天籁之音，名字被载入音乐史册。' }
    ]
  },
  {
    id: 'top_tier',
    title: '一线大咖',
    desc: '你是当之无愧的流量与实力并存的艺人。',
    condition: (player) => player.stats.popularity >= 5000,
    lines: [
      { speaker: undefined, text: '三年结束了，你已经稳居一线艺人的行列。' },
      { speaker: 'manager_lin', text: '现在的你，已经是公司的摇钱树了，哈哈。', emotion: 'happy' },
      { speaker: undefined, text: '虽然还未达到传奇的高度，但你的名字已经家喻户晓。' }
    ]
  },
  {
    id: 'variety_star',
    title: '综艺天王',
    desc: '你是各大综艺节目的收视保障，给无数人带来了欢笑。',
    condition: (player) => player.stats.popularity >= 3000 && player.stats.charm >= 150,
    lines: [
      { speaker: undefined, text: '只要有你出现的综艺节目，收视率绝对第一。' },
      { speaker: undefined, text: '你的幽默感和高情商让你成为了国民开心果。' },
      { speaker: 'player', text: '能让大家开心，就是我最大的成就。', emotion: 'happy' },
      { speaker: undefined, text: '你走出了一条独特的演艺道路，成为了综艺界的无冕之王。' }
    ]
  },
  {
    id: 'ordinary',
    title: '平凡艺人',
    desc: '你在娱乐圈占有一席之地，但仍需努力。',
    condition: (player) => player.stats.popularity >= 1000,
    lines: [
      { speaker: undefined, text: '三年过去了，你成为了一名合格的职业艺人。' },
      { speaker: 'player', text: '虽然没有大红大紫，但能做自己喜欢的事，已经很幸福了。', emotion: 'normal' },
      { speaker: undefined, text: '你过着充实而平凡的艺人生活。' }
    ]
  },
  {
    id: 'forgotten',
    title: '昙花一现',
    desc: '你曾有过光芒，但很快被淹没在新人潮中。',
    condition: () => true, // Default ending
    lines: [
      { speaker: undefined, text: '三年的合同到期了。' },
      { speaker: 'manager_lin', text: '娱乐圈就是这样残酷，新人辈出，而你没能留住观众。', emotion: 'sad' },
      { speaker: undefined, text: '你决定转行，开始一段全新的人生。' }
    ]
  }
];

export const QUESTS: Quest[] = [
  {
    id: 'q_training_start',
    title: '初露锋芒',
    desc: '在第一年前 3 个月内，将任意一项基础属性提升至 30。',
    type: 'short',
    condition: (player, time) => time.year === 1 && time.month <= 3 && (player.stats.acting >= 30 || player.stats.singing >= 30 || player.stats.dancing >= 30 || player.stats.appearance >= 30),
    reward: { money: 1000, stats: { charm: 5 } }
  },
  {
    id: 'q_first_job',
    title: '第一份工作',
    desc: '完成至少 3 次通告工作。',
    type: 'short',
    condition: (player) => player.jobsCompleted >= 3,
    reward: { money: 2000 }
  },
  {
    id: 'q_social_influencer',
    title: '社交达人',
    desc: '魅力达到 50，且人气达到 100。',
    type: 'short',
    condition: (player) => player.stats.charm >= 50 && player.stats.popularity >= 100,
    reward: { money: 3000, stats: { popularity: 20 } }
  },
  {
    id: 'q_rich_trainee',
    title: '勤俭持家',
    desc: '账户余额超过 10000 金钱。',
    type: 'long',
    condition: (player) => player.money >= 10000,
    reward: { stats: { charm: 10, popularity: 20 } }
  },
  {
    id: 'q_charity_angel',
    title: '慈善天使',
    desc: '账户余额超过 50000 金钱，心怀大爱。',
    type: 'long',
    condition: (player) => player.money >= 50000,
    reward: { stats: { charm: 30, popularity: 50 } }
  },
  {
    id: 'q_all_rounder',
    title: '全能艺人',
    desc: '演技、唱功、舞蹈均达到 100。',
    type: 'long',
    condition: (player) => player.stats.acting >= 100 && player.stats.singing >= 100 && player.stats.dancing >= 100,
    reward: { money: 20000, stats: { popularity: 100 } }
  },
  {
    id: 'q_variety_star',
    title: '综艺新星',
    desc: '颜值和魅力均达到 80。',
    type: 'long',
    condition: (player) => player.stats.appearance >= 80 && player.stats.charm >= 80,
    reward: { money: 5000, stats: { popularity: 30 } }
  }
];

export const getStatName = (key: string) => {
  const names: Record<string, string> = {
    appearance: '颜值',
    acting: '演技',
    singing: '唱功',
    dancing: '舞蹈',
    charm: '魅力',
    popularity: '人气',
    reputation: '声望',
    stamina: '体力',
    maxStamina: '体力上限',
    money: '金钱'
  };
  return names[key] || key;
};

export type FacilityLevel = {
  level: number;
  cost: { money: number; time: number };
  bonus: number;
  bonusDesc: string;
};

export type Facility = {
  id: FacilityId;
  name: string;
  desc: string;
  levels: FacilityLevel[];
};

export const FACILITIES: Record<FacilityId, Facility> = {
  gym: {
    id: 'gym',
    name: '健身房',
    desc: '提升体力上限。',
    levels: [
      { level: 1, cost: { money: 5000, time: 2 }, bonus: 20, bonusDesc: '体力上限 +20' },
      { level: 2, cost: { money: 15000, time: 4 }, bonus: 50, bonusDesc: '体力上限 +50' },
      { level: 3, cost: { money: 50000, time: 8 }, bonus: 100, bonusDesc: '体力上限 +100' },
    ]
  },
  studio: {
    id: 'studio',
    name: '录音棚',
    desc: '提升唱功训练效果。',
    levels: [
      { level: 1, cost: { money: 8000, time: 2 }, bonus: 0.2, bonusDesc: '唱功训练效果 +20%' },
      { level: 2, cost: { money: 20000, time: 4 }, bonus: 0.5, bonusDesc: '唱功训练效果 +50%' },
      { level: 3, cost: { money: 60000, time: 8 }, bonus: 1.0, bonusDesc: '唱功训练效果 +100%' },
    ]
  },
  classroom: {
    id: 'classroom',
    name: '表演教室',
    desc: '提升演技训练效果。',
    levels: [
      { level: 1, cost: { money: 8000, time: 2 }, bonus: 0.2, bonusDesc: '演技训练效果 +20%' },
      { level: 2, cost: { money: 20000, time: 4 }, bonus: 0.5, bonusDesc: '演技训练效果 +50%' },
      { level: 3, cost: { money: 60000, time: 8 }, bonus: 1.0, bonusDesc: '演技训练效果 +100%' },
    ]
  }
};
