export type PhaseTask = {
  id: number;
  title: string;
  desc: string;
  req: Record<string, number>;
  reward: {
    money?: number;
    popularity?: number;
    appearance?: number;
    acting?: number;
    singing?: number;
    dancing?: number;
    charm?: number;
    favor_liu?: number;
    items?: string[];
    unlocked?: string;
    status?: string;
    special?: string;
    end_game_flag?: string;
  };
  dialogue: string;
  domain:
    | "职场生存"
    | "崭露头角"
    | "星光璀璨"
    | "传奇之路"
    | "合伙人时代"
    | "国际化"
    | "商业帝国"
    | "幕后推手"
    | "电竞跨界"
    | "商业巅峰"
    | "全能艺人"
    | "时代符号";
};

export const PHASE_TASKS: PhaseTask[] = [
  { id: 1, title: "初出茅庐", desc: "完成首次礼仪培训。", req: { charm: 20 }, reward: { money: 2000, favor_liu: 2 }, dialogue: "这是第一课，学会怎么看人说话，别像个木头。", domain: "职场生存" },
  { id: 2, title: "跑龙套的尊严", desc: "在剧组积累演技基础。", req: { acting: 30 }, reward: { money: 3000, favor_liu: 2 }, dialogue: "别抱怨戏份少，大明星也是从背景板演起的。", domain: "职场生存" },
  { id: 3, title: "第一份工资", desc: "通过通告赚取首个10万。", req: { money: 100000 }, reward: { popularity: 100, favor_liu: 3 }, dialogue: "呵，看来你还有点商业价值，不是只会花钱的废物。", domain: "职场生存" },
  { id: 4, title: "镜头感", desc: "拍摄第一组写真。", req: { appearance: 50 }, reward: { charm: 10, favor_liu: 2 }, dialogue: "把你的胆怯收起来，镜头在吃人，你得比它更狠。", domain: "职场生存" },
  { id: 5, title: "转正考核", desc: "在柳梦瑶眼中证明潜质。", req: { favor_liu: 20, acting: 60 }, reward: { money: 10000, unlocked: "official_contract" }, dialogue: "勉强合格。你的合同，我签了。", domain: "职场生存" },

  { id: 6, title: "初次触电", desc: "接下一部网剧的女配角。", req: { acting: 80 }, reward: { money: 20000, popularity: 300 }, dialogue: "这是机会，要是搞砸了，以后别来找我。", domain: "崭露头角" },
  { id: 7, title: "粉丝基础", desc: "人气达到1000。", req: { popularity: 1000 }, reward: { money: 5000, favor_liu: 5 }, dialogue: "终于有了点动静，但这还远远不够。", domain: "崭露头角" },
  { id: 8, title: "风格确立", desc: "在歌舞领域获得初步认可。", req: { singing: 100 }, reward: { charm: 20, favor_liu: 3 }, dialogue: "定位很重要，别什么都想要，最后什么都得不到。", domain: "崭露头角" },
  { id: 9, title: "媒体宠儿", desc: "参加一次大型红毯。", req: { charm: 120 }, reward: { popularity: 800, appearance: 10 }, dialogue: "今晚的红毯，我要你成为所有媒体的焦点。", domain: "崭露头角" },
  { id: 10, title: "突破瓶颈", desc: "拿下第一部戏的女主角。", req: { acting: 150 }, reward: { money: 100000, favor_liu: 10 }, dialogue: "从现在起，你才真正算是在这个圈子里站稳了。", domain: "崭露头角" },

  { id: 11, title: "国民热度", desc: "人气达到5000。", req: { popularity: 5000 }, reward: { money: 50000, favor_liu: 5 }, dialogue: "你的名字现在随处可见，适应这种被注视的感觉了吗？", domain: "星光璀璨" },
  { id: 12, title: "奖项提名", desc: "获得年度新人奖提名。", req: { acting: 200 }, reward: { popularity: 2000, favor_liu: 8 }, dialogue: "提名只是开始，我要的是你手里那个奖杯。", domain: "星光璀璨" },
  { id: 13, title: "顶奢代言", desc: "累积财富达到500万。", req: { money: 5000000 }, reward: { charm: 50, favor_liu: 10 }, dialogue: "品牌方指名要你，干得不错。", domain: "星光璀璨" },
  { id: 14, title: "跨界女王", desc: "影视与歌坛领域全开花。", req: { acting: 250, singing: 250 }, reward: { popularity: 5000, money: 200000 }, dialogue: "贪心？在娱乐圈，贪心是好事。", domain: "星光璀璨" },
  { id: 15, title: "封后前夜", desc: "人气突破一万。", req: { popularity: 10000 }, reward: { money: 500000, favor_liu: 15 }, dialogue: "这部戏拍完，你就是无可争议的顶流。", domain: "星光璀璨" },

  { id: 16, title: "行业标杆", desc: "演技与魅力达到极致。", req: { acting: 400, charm: 400 }, reward: { popularity: 10000 }, dialogue: "我已经没什么能教你的了，你现在就是规则。", domain: "传奇之路" },
  { id: 17, title: "金像影后", desc: "夺得最高荣誉奖项。", req: { awards: 1 }, reward: { money: 1000000, favor_liu: 50 }, dialogue: "祝贺你。看来我当初签你，是我做过最正确的决定。", domain: "传奇之路" },
  { id: 18, title: "资本掌控者", desc: "累积财富达到5000万。", req: { money: 50000000 }, reward: { status: "partner", favor_liu: 20 }, dialogue: "你可以不听我的了，你现在拥有了选择权。", domain: "传奇之路" },

  { id: 19, title: "平起平坐", desc: "与柳梦瑶共同决策公司事务。", req: { favor_liu: 150 }, reward: { money: 5000000 }, dialogue: "现在的星耀，你有一半的话语权。", domain: "合伙人时代" },
  { id: 20, title: "传奇合伙人", desc: "开启终极商业版图。", req: { popularity: 30000 }, reward: { end_game_flag: "true" }, dialogue: "从经纪人到合伙人，这漫长的路，没你真不行。", domain: "合伙人时代" },

  { id: 21, title: "海外试水", desc: "国际知名度开启。", req: { international: 50, popularity: 15000 }, reward: { money: 2000000 }, dialogue: "别以为国内红了就能征服世界，去听听别人的掌声。", domain: "国际化" },
  { id: 22, title: "语言突破", desc: "双项属性突破450。", req: { charm: 450, acting: 450 }, reward: { favor_liu: 10 }, dialogue: "英语说得不错，至少比我的塑料发音强。", domain: "国际化" },
  { id: 23, title: "国际电影节", desc: "入围国际A类电影节。", req: { awards: 2, acting: 500 }, reward: { popularity: 20000 }, dialogue: "红毯那头是全世界，别给我丢人。", domain: "国际化" },
  { id: 24, title: "全球偶像", desc: "海外人气爆发。", req: { international: 200, popularity: 50000 }, reward: { money: 10000000, favor_liu: 30 }, dialogue: "现在，你是真正的国际巨星了。", domain: "国际化" },

  { id: 25, title: "时尚ICON", desc: "全属性突破600。", req: { appearance: 600, charm: 600 }, reward: { money: 5000000 }, dialogue: "衣服穿在你身上，比模特还贵。", domain: "商业帝国" },
  { id: 26, title: "投资达人", desc: "财富突破一亿。", req: { money: 100000000, acting: 600 }, reward: { favor_liu: 20 }, dialogue: "眼光不错，比那些只会烧钱的制片人强。", domain: "商业帝国" },
  { id: 27, title: "商业帝国", desc: "财富突破五亿。", req: { money: 500000000 }, reward: { status: "tycoon" }, dialogue: "现在是你给我发工资了，老板。", domain: "商业帝国" },

  { id: 28, title: "金牌制作人", desc: "制作能力初现。", req: { produce: 100, acting: 700 }, reward: { money: 8000000 }, dialogue: "站在幕后，比站在台前更有成就感吧？", domain: "幕后推手" },
  { id: 29, title: "慈善大使", desc: "人气突破十万。", req: { charity: 200, popularity: 100000 }, reward: { favor_liu: 40 }, dialogue: "终于学会用名气做点正事了。", domain: "幕后推手" },
  { id: 30, title: "教母传奇", desc: "好感度达到巅峰。", req: { favor_liu: 200, social: 500 }, reward: { special: "legend_ending" }, dialogue: "看着她们，就像看到当年的你。这条路，我们走对了。", domain: "幕后推手" },

  { id: 31, title: "网吧霸主", desc: "电竞潜力发掘。", req: { esports: 50, popularity: 2000 }, reward: { money: 1000 }, dialogue: "手速不错，但电竞圈比娱乐圈还残酷，想清楚了？", domain: "电竞跨界" },
  { id: 32, title: "职业选手", desc: "电竞技术达标。", req: { esports: 200 }, reward: { money: 5000, favor_liu: 5 }, dialogue: "别以为打游戏就能轻松，每天训练16小时，你撑得住吗？", domain: "电竞跨界" },
  { id: 33, title: "首发登场", desc: "人气突破一万。", req: { esports: 400, popularity: 10000 }, reward: { money: 50000 }, dialogue: "全场高呼你的ID时，感觉比走红毯还爽吧？", domain: "电竞跨界" },
  { id: 34, title: "世界冠军", desc: "获得三项大奖。", req: { esports: 800, awards: 3 }, reward: { money: 1000000, favor_liu: 30 }, dialogue: "金色的雨落下那一刻，你是所有玩家的信仰。", domain: "电竞跨界" },
  { id: 35, title: "电竞教父", desc: "财富突破两亿。", req: { esports: 1000, money: 200000000 }, reward: { status: "esports_god" }, dialogue: "从选手到老板，你的传奇还在继续。", domain: "电竞跨界" },
  { id: 36, title: "跨界电竞", desc: "人气突破八万。", req: { esports: 600, variety: 500, popularity: 80000 }, reward: { favor_liu: 15 }, dialogue: "那些说明星只会作秀的喷子，现在闭嘴了。", domain: "电竞跨界" },

  { id: 37, title: "小试牛刀", desc: "商业头脑初现。", req: { money: 500000, business: 50 }, reward: { money: 10000 }, dialogue: "开店？我还以为你会买包，有点意外。", domain: "商业巅峰" },
  { id: 38, title: "连锁品牌", desc: "财富突破两千万。", req: { business: 200, money: 20000000 }, reward: { money: 50000 }, dialogue: "你现在是名副其实的老板了，记得按时交税。", domain: "商业巅峰" },
  { id: 39, title: "科技新贵", desc: "商业与创新双达标。", req: { business: 400, innovation: 300 }, reward: { money: 1000000, favor_liu: 10 }, dialogue: "硅谷那帮人现在也得叫你一声天使投资人。", domain: "商业巅峰" },
  { id: 40, title: "地产大亨", desc: "财富突破五亿。", req: { money: 500000000, business: 600 }, reward: { status: "landlord" }, dialogue: "买房比买包保值，这个道理你总算懂了。", domain: "商业巅峰" },
  { id: 41, title: "收购经纪公司", desc: "好感度突破300。", req: { money: 100000000, favor_liu: 300 }, reward: { status: "owner" }, dialogue: "……我现在该叫你老板了？呵，做得不错。", domain: "商业巅峰" },
  { id: 42, title: "跨国企业", desc: "商业突破900。", req: { business: 900, international: 500, money: 1000000000 }, reward: { money: 50000000 }, dialogue: "你的商业版图，已经大到我都看不懂了。", domain: "商业巅峰" },
  { id: 43, title: "行业峰会主讲人", desc: "魅力突破800。", req: { business: 1000, charm: 800 }, reward: { popularity: 10000 }, dialogue: "那些老头子在台下认真记笔记的样子，真有趣。", domain: "商业巅峰" },
  { id: 44, title: "商界传奇", desc: "获得五项大奖。", req: { business: 1500, awards: 5 }, reward: { special: "business_legend" }, dialogue: "从艺人到企业家，你证明了美貌和智慧可以并存。", domain: "商业巅峰" },

  { id: 45, title: "灵魂歌者", desc: "唱歌突破500。", req: { singing: 500, popularity: 50000 }, reward: { money: 100000 }, dialogue: "你的歌声终于配得上你的脸了。", domain: "全能艺人" },
  { id: 46, title: "演唱会女王", desc: "人气突破十五万。", req: { singing: 700, charm: 700, popularity: 150000 }, reward: { favor_liu: 25 }, dialogue: "全场大合唱的时候，我差点哭了……别告诉别人。", domain: "全能艺人" },
  { id: 47, title: "综艺梗王", desc: "综艺感突破600。", req: { variety: 600, social: 500 }, reward: { popularity: 5000 }, dialogue: "你比那些专业主持人还会接梗，考虑转行吗？", domain: "全能艺人" },
  { id: 48, title: "制作人新星", desc: "制作能力突破400。", req: { produce: 400, acting: 500 }, reward: { money: 200000 }, dialogue: "当制片人比当演员累吧？但成就感也是双倍的。", domain: "全能艺人" },
  { id: 49, title: "影视双栖", desc: "演技突破900。", req: { awards: 4, acting: 900 }, reward: { popularity: 10000, favor_liu: 20 }, dialogue: "电影电视都认你，这个圈子里没几个人能做到。", domain: "全能艺人" },
  { id: 50, title: "全能艺人", desc: "全领域属性突破500。", req: { singing: 600, acting: 800, variety: 600, produce: 500 }, reward: { status: "all_star" }, dialogue: "你现在已经不是明星了，是艺术家。", domain: "全能艺人" },

  { id: 51, title: "封面女王", desc: "颜值突破900。", req: { appearance: 900, popularity: 200000 }, reward: { money: 500000 }, dialogue: "杂志社现在要求你上封面才肯印刷。", domain: "时代符号" },
  { id: 52, title: "高定缪斯", desc: "国际知名度突破700。", req: { charm: 1000, international: 700 }, reward: { favor_liu: 15 }, dialogue: "设计师说你就是他心中的女神。", domain: "时代符号" },
  { id: 53, title: "公益先锋", desc: "慈善值突破500。", req: { charity: 500, social: 700 }, reward: { popularity: 20000 }, dialogue: "你的基金会帮助了那么多人，我也该捐点钱了。", domain: "时代符号" },
  { id: 54, title: "联合国大使", desc: "全属性接近巅峰。", req: { charity: 800, international: 900, charm: 950 }, reward: { status: "global_ambassador", favor_liu: 30 }, dialogue: "在联合国演讲时，全世界都在听你说话。", domain: "时代符号" },
  { id: 55, title: "意见领袖", desc: "人气突破五十万。", req: { popularity: 500000, social: 1000 }, reward: { money: 1000000 }, dialogue: "你随便发个表情包，都能上热搜。", domain: "时代符号" },
  { id: 56, title: "作家新星", desc: "财富突破一亿。", req: { acting: 800, charm: 800, money: 100000000 }, reward: { money: 5000000 }, dialogue: "你的故事确实值得被写下来，还挺感人的。", domain: "时代符号" },
  { id: 57, title: "导演处女作", desc: "制作能力突破800。", req: { acting: 1000, produce: 800, awards: 3 }, reward: { popularity: 30000 }, dialogue: "从台前到幕后，你又要拿新人奖了。", domain: "时代符号" },
  { id: 58, title: "综艺制作人", desc: "人气突破三十万。", req: { variety: 1000, produce: 1000, popularity: 300000 }, reward: { money: 10000000 }, dialogue: "现在电视台求着你做节目。", domain: "时代符号" },
  { id: 59, title: "时尚品牌主理人", desc: "财富突破十亿。", req: { appearance: 1000, business: 1200, money: 1000000000 }, reward: { status: "fashion_mogul" }, dialogue: "你的设计比那些大牌还难抢。", domain: "时代符号" },
  { id: 60, title: "传奇终章", desc: "达成全好感与全结局条件。", req: { favor_liu: 500 }, reward: { end_game_flag: "true" }, dialogue: "从第一天带你到现在，我见证了历史。谢谢你。", domain: "时代符号" },
];

