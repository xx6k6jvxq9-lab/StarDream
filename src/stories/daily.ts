import type { StoryLine, StoryNode, StoryOption } from "../types/story";

export type DailyTrigger =
  | { type: "job"; jobId: string }
  | { type: "location"; locationId: string };

export interface DailyEventConfig {
  id: string;
  characterId: CoreCharacterId;
  title: string;
  scene: string;
  lines: StoryLine[];
  options: StoryOption[];
  trigger: DailyTrigger;
  triggerChance: number;
}

type CoreCharacterId =
  | "liu_mengyao"
  | "shen_mo"
  | "jiang_muci"
  | "su_tangtang"
  | "lu_xingran"
  | "gu_chengyan"
  | "lin_yu"
  | "zhou_yan"
  | "ji_mingxuan";

type LineTuple = [string, string];
type DailyTemplate = {
  title: string;
  scene: string;
  lines: LineTuple;
};

const CHARACTER_NAMES: Record<CoreCharacterId, string> = {
  liu_mengyao: "柳梦瑶",
  shen_mo: "沈默",
  jiang_muci: "江暮辞",
  su_tangtang: "苏糖糖",
  lu_xingran: "陆星燃",
  gu_chengyan: "顾承宴",
  lin_yu: "林屿",
  zhou_yan: "周焰",
  ji_mingxuan: "季明轩",
};

const JOB_TRIGGER_POOL = [
  "summer_starlight_festival",
  "starlight_trainee_s2",
  "sheng_tang_jin_xiu_zhi",
  "extra",
  "commercial_local",
  "idol_stage",
  "movie_support",
  "album_single",
  "movie_lead",
  "gucheng_brand",
];

const LOCATION_TRIGGER_POOL = ["home", "company", "city", "jobs", "social"];

const CHARACTER_ORDER: CoreCharacterId[] = [
  "liu_mengyao",
  "shen_mo",
  "jiang_muci",
  "su_tangtang",
  "lu_xingran",
  "gu_chengyan",
  "lin_yu",
  "zhou_yan",
  "ji_mingxuan",
];

const rotateList = (arr: string[], offset: number): string[] => {
  const n = arr.length;
  if (n === 0) return [];
  const shift = ((offset % n) + n) % n;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
};

const buildOptions = (name: string): StoryOption[] => [
  {
    text: "顺着他的情绪接话，把氛围稳住",
    effect: { favor: 1 },
    followUp: { lines: [{ speaker: "你", text: `我懂你的意思了，${name}，这次我会接得更稳。` }] },
  },
  {
    text: "主动拉近距离，让这场互动继续升温",
    effect: { favor: 2 },
    followUp: { lines: [{ speaker: "旁白", text: `你没有把这段气氛轻轻放过，而是顺势靠近${name}，原本克制的空气明显松了一寸。` }] },
  },
  {
    text: "把话先收住，避免情绪盖过正事",
    effect: { favor: 0 },
    followUp: { lines: [{ speaker: "你", text: "这段我先记着，等手头这波结束，我们再慢慢说。" }] },
  },
];

const makeLiuOptions = (
  a: { text: string; favor: number; reply: string },
  b: { text: string; favor: number; reply: string },
  c: { text: string; favor: number; reply: string },
): StoryOption[] => [
  {
    text: a.text,
    effect: { favor: a.favor },
    followUp: { lines: [{ speaker: "柳梦瑶", text: a.reply }] },
  },
  {
    text: b.text,
    effect: { favor: b.favor },
    followUp: { lines: [{ speaker: "柳梦瑶", text: b.reply }] },
  },
  {
    text: c.text,
    effect: { favor: c.favor },
    followUp: { lines: [{ speaker: "柳梦瑶", text: c.reply }] },
  },
];

const LIU_DAILY_EVENTS: DailyEventConfig[] = [
  {
    id: "daily_liu_job_1",
    characterId: "liu_mengyao",
    title: "《跑龙套》复盘夜",
    scene: "你刚从《跑龙套》收工，柳梦瑶在保姆车里盯着回放暂停在你的近景。",
    lines: [
      { speaker: "柳梦瑶", text: "这场你眼神散了半秒。观众不会给你第二次解释机会。" },
      { speaker: "柳梦瑶", text: "下次上镜前，先把情绪钉住。你不是来凑人数的。" },
    ],
    options: makeLiuOptions(
      { text: "我今晚就补练到过关", favor: 3, reply: "这态度还能看。明早六点，我亲自抽你台词。" },
      { text: "我觉得已经不差了", favor: -2, reply: "不差不等于能赢。你要是只求及格，我现在就撤资源。" },
      { text: "请你指出最致命的问题", favor: 2, reply: "好，至少你知道该问什么。记住，先稳呼吸再出眼神。" },
    ),
    trigger: { type: "job", jobId: "extra" },
    triggerChance: 0.58,
  },
  {
    id: "daily_liu_job_2",
    characterId: "liu_mengyao",
    title: "《地方台广告》风控",
    scene: "《地方台广告》拍摄间隙，品牌临时要你加一句夸张台词，柳梦瑶当场冷下脸。",
    lines: [
      { speaker: "柳梦瑶", text: "这句会毁你人设，我已经替你挡掉。" },
      { speaker: "柳梦瑶", text: "你记住，短钱可以赚，烂口碑不能碰。" },
    ],
    options: makeLiuOptions(
      { text: "听你的，这句我不说", favor: 2, reply: "很好。你终于学会把长期价值放前面。" },
      { text: "要不先拍一条备选？", favor: -1, reply: "你在给他们试探底线的机会。别心软。" },
      { text: "谢谢你替我扛压力", favor: 3, reply: "少废话，拿作品还我这份硬气。" },
    ),
    trigger: { type: "job", jobId: "commercial_local" },
    triggerChance: 0.52,
  },
  {
    id: "daily_liu_job_3",
    characterId: "liu_mengyao",
    title: "《偶像打歌舞台》抢机位",
    scene: "《偶像打歌舞台》彩排时机位临时改线，柳梦瑶把你拽回主镜头轨道。",
    lines: [
      { speaker: "柳梦瑶", text: "你站这条线，副机位会把你剪成背景板。" },
      { speaker: "柳梦瑶", text: "抬下巴，镜头爱赢家，不爱犹豫的人。" },
    ],
    options: makeLiuOptions(
      { text: "我去抢主位，不退", favor: 3, reply: "这才像我带出来的人。上去，把灯吃满。" },
      { text: "我怕和前辈撞位", favor: -2, reply: "怕就会输。你尊重前辈，不代表你要让掉舞台。" },
      { text: "你给我一个最稳方案", favor: 1, reply: "可以，第二段换轴时切中线，别提前抬手。" },
    ),
    trigger: { type: "job", jobId: "idol_stage" },
    triggerChance: 0.56,
  },
  {
    id: "daily_liu_job_4",
    characterId: "liu_mengyao",
    title: "《电影配角》临场加戏",
    scene: "《电影配角》夜戏现场导演突然加了一段即兴对峙，所有人都在等你的反应。",
    lines: [
      { speaker: "柳梦瑶", text: "机会来了，别躲。你接住这段就能多一个镜头记忆点。" },
      { speaker: "柳梦瑶", text: "咬字别飘，台词像刀一样直出去。" },
    ],
    options: makeLiuOptions(
      { text: "我接这段，直接来", favor: 3, reply: "好。记住今天，资源就是这样抢出来的。" },
      { text: "我想按原剧本走", favor: -1, reply: "稳妥有时等于平庸。你要想清楚自己要不要往上爬。" },
      { text: "给我三十秒整理情绪", favor: 2, reply: "可以。三十秒后进场，别让我等第二次。" },
    ),
    trigger: { type: "job", jobId: "movie_support" },
    triggerChance: 0.5,
  },
  {
    id: "daily_liu_loc_1",
    characterId: "liu_mengyao",
    title: "公司深夜校准",
    scene: "经纪公司只剩应急灯，柳梦瑶把你叫进会议室，把第二天通告排表推到你面前。",
    lines: [
      { speaker: "柳梦瑶", text: "我给你挡了两个烂局，换来一个能涨口碑的窗口。" },
      { speaker: "柳梦瑶", text: "别浪费。明天你要是迟到，我亲手把你从床上拖下来。" },
    ],
    options: makeLiuOptions(
      { text: "我会提前半小时到", favor: 2, reply: "很好。职业素养先过关，天赋才有意义。" },
      { text: "排程太满了，我想降一点", favor: -1, reply: "可以降，但你要拿结果和我换。" },
      { text: "你今天也早点休息", favor: 3, reply: "少管我。你把状态稳住，就是最好的回报。" },
    ),
    trigger: { type: "location", locationId: "company" },
    triggerChance: 0.48,
  },
  {
    id: "daily_liu_loc_2",
    characterId: "liu_mengyao",
    title: "小屋门口点名",
    scene: "你刚回小屋，柳梦瑶靠在门边，手里是你明天的行程卡和温水。",
    lines: [
      { speaker: "柳梦瑶", text: "先把水喝了。你嗓子哑成这样还想硬顶通告？" },
      { speaker: "柳梦瑶", text: "我凶你，是怕你把自己耗没了。" },
    ],
    options: makeLiuOptions(
      { text: "我听你的，今晚早睡", favor: 2, reply: "总算有一次像话。明早状态不好我照样骂你。" },
      { text: "我还能再练两小时", favor: -2, reply: "逞强不是努力。你再加练，我就直接停你明天行程。" },
      { text: "谢谢你一直盯着我", favor: 3, reply: "别煽情。拿成绩说话，别让我白盯。" },
    ),
    trigger: { type: "location", locationId: "home" },
    triggerChance: 0.46,
  },
  {
    id: "daily_liu_loc_3",
    characterId: "liu_mengyao",
    title: "通告大厅筛单",
    scene: "通告大厅里，柳梦瑶把一沓高价短平快项目扔到一边，只留下两份本子。",
    lines: [
      { speaker: "柳梦瑶", text: "这堆钱快，但会把你的脸用廉价。" },
      { speaker: "柳梦瑶", text: "你现在要的是代表作，不是流水线曝光。" },
    ],
    options: makeLiuOptions(
      { text: "那就只接这两份硬项目", favor: 3, reply: "对。你终于开始像个长期选手。" },
      { text: "高价那份我还是想试试", favor: -1, reply: "可以，但口碑掉了别哭着找我补救。" },
      { text: "你说的代表作标准是什么", favor: 2, reply: "能让人记住角色，不只是记住你的脸。" },
    ),
    trigger: { type: "location", locationId: "jobs" },
    triggerChance: 0.45,
  },
];

const SHEN_JOB: DailyTemplate[] = [
  { title: "片场递伞", scene: "雨后外景，沈默把伞倾向你这边。", lines: ["先别急着进机位，地面还滑。", "你稳住呼吸，情绪会自然落到位。"] },
  { title: "文本拆解", scene: "他在监视器后给你画台词重音。", lines: ["这句不要喊，轻一点反而更疼。", "表演不是用力，是把真心放进停顿里。"] },
  { title: "镜头校准", scene: "长镜头排练前，沈默叫停了一次走位。", lines: ["你多走半步就会出光区，镜头会丢掉眼神。", "再来一条，这次你会更好。"] },
  { title: "夜拍保温", scene: "凌晨四点的片场很安静。", lines: ["这杯水不烫，刚好能润嗓。", "别硬撑，状态崩了谁都救不了戏。"] },
  { title: "角色抽丝", scene: "他把剧本摊开，指尖停在人物转折页。", lines: ["你不是在演受害者，你是在演一个仍然选择向前的人。", "把脊背挺起来，角色就立住了。"] },
  { title: "采访避雷", scene: "宣传专访前，他把提纲多划了三处。", lines: ["这三个问题会带节奏，答案我给你写了备选。", "你只谈创作，别给任何人借题发挥。"] },
  { title: "情绪收束", scene: "收工后他陪你复盘最后一场哭戏。", lines: ["眼泪够了，最后那口气没收住。", "你已经很接近了，明天会更准。"] },
  { title: "临场救火", scene: "对手演员临时改词，场面一度失控。", lines: ["按你原节奏走，不要跟着他乱。", "我在镜头外看着，你只管演下去。"] },
  { title: "奖项夜话", scene: "颁奖礼后台嘈杂，他把你带到安静角落。", lines: ["奖不一定落你身上，但今晚你演得比很多人都真。", "别被掌声绑架，也别被嘘声定义。"] },
  { title: "清晨散场", scene: "通宵戏结束，天边刚亮。", lines: ["今天你扛住了最难的一场。", "回去睡一觉，醒来再看世界会轻一点。"] },
];

const SHEN_LOC: DailyTemplate[] = [
  { title: "小屋回信", scene: "你回到小屋，沈默发来一条简短语音。", lines: ["看到你平安到家就好。", "今晚别复盘了，先睡。"] },
  { title: "公司碰面", scene: "公司电梯口，你和沈默短暂并肩。", lines: ["今天会很忙，记得按时吃饭。", "你不用证明给所有人看，只要对得起自己。"] },
  { title: "城市散步", scene: "城市夜风里，你们沿着河堤慢走。", lines: ["有些路要慢慢走，快了会错过答案。", "你现在的节奏，已经比以前稳很多。"] },
  { title: "通告大厅提醒", scene: "通告大厅里，他替你挑掉两份急单。", lines: ["这两个本子只图消耗你，别接。", "你值得更有分量的舞台。"] },
  { title: "社交平台夜读", scene: "社交页面争论升温，他只回了你一句。", lines: ["别陷进去，舆论不是你的全部。", "明天见面，我们只聊戏。"] },
];

const JIANG_JOB: DailyTemplate[] = [
  { title: "车门前哨", scene: "收工后人群拥挤，江暮辞先一步挡在你前面。", lines: ["你跟紧我，别回头。", "我先开路，到了车边再停。"] },
  { title: "片场巡线", scene: "他把外景区绕了一圈才让你入场。", lines: ["灯架下面别站太久，不安全。", "你开工前我再检查一遍。"] },
  { title: "后台守位", scene: "演出后台混乱，他始终站在你侧后方。", lines: ["左边通道有人堵，我带你走右边。", "慢一点，不急。"] },
  { title: "临时换车", scene: "通告结束后他突然改了返程路线。", lines: ["原车被跟拍了，换这辆更稳。", "你先上车，我最后一个关门。"] },
  { title: "夜间回程", scene: "深夜路段空旷，他仍紧盯后视镜。", lines: ["后方那台车跟了三条街，我处理。", "你别怕，我在。"] },
  { title: "道具排查", scene: "武戏开拍前，他先替你检查护具。", lines: ["护腕太松，我给你再收一格。", "今天动作大，落地别硬顶。"] },
  { title: "酒店布控", scene: "外地通告入住前，他先上楼排查。", lines: ["你在大厅等我两分钟。", "房间确认干净了再上去。"] },
  { title: "人群分流", scene: "品牌活动散场，粉丝涌向出口。", lines: ["我先把通道腾开，你再走。", "手给我，别被挤散。"] },
  { title: "突发停电", scene: "摄影棚短暂停电，他第一时间护住你。", lines: ["站我后面，别乱动。", "灯亮前我不离开你一步。"] },
  { title: "清晨交接", scene: "通宵拍摄结束，他和下一班安保交接。", lines: ["她今天很累，路上别让人靠近。", "到家给我回个消息，我再下班。"] },
];

const JIANG_LOC: DailyTemplate[] = [
  { title: "小屋门前", scene: "你回到小屋，江暮辞确认楼道后才离开。", lines: ["门锁好了我再走。", "你进门前我不转身。"] },
  { title: "公司电梯", scene: "公司晚高峰，他把你护在电梯角落。", lines: ["这里人多，你站我前面。", "有事你喊我名字就行。"] },
  { title: "城市过街", scene: "路口车流很急，他抬手拦在你身前。", lines: ["等绿灯再走，别抢这一秒。", "我看着呢，不会让你有事。"] },
  { title: "通告大厅巡逻", scene: "通告大厅人来人往，他站在门侧观察。", lines: ["今天陌生面孔多，我盯着。", "你挑项目，我盯风险。"] },
  { title: "社交舆情", scene: "你刷到恶评时，他递来一瓶水。", lines: ["别看了，伤神。", "要不要我去查是谁在带节奏。"] },
];

const SU_JOB: DailyTemplate[] = [
  { title: "练习室贴纸", scene: "苏糖糖把新贴纸贴在你的歌词本角落。", lines: ["这样你翻到这一页就会想起我啦。", "今天我们一起把副歌练到最稳。"] },
  { title: "后台小零食", scene: "录制后台，她从包里摸出一袋软糖。", lines: ["这是你喜欢的口味，我偷偷留到现在。", "别空腹上台，会头晕的。"] },
  { title: "彩排扶拍", scene: "舞台彩排前，她拉着你对节拍。", lines: ["我给你打拍子，你别紧张。", "我们一起上场就不会怕了。"] },
  { title: "收音棚合声", scene: "深夜收音棚里，她把耳机分你一边。", lines: ["这个和声我想跟你叠在一起。", "你唱进来之后，整段都亮了。"] },
  { title: "妆发间等待", scene: "你延迟开拍，她趴在门口等你。", lines: ["我怕你一个人会紧张，就先来陪你。", "等会儿你看我一眼就好，我会给你打气。"] },
  { title: "补录返工", scene: "补录到凌晨，她声音有点哑。", lines: ["没关系，我们再来一遍就会更好。", "我想跟你一起把这首歌唱到最好。"] },
  { title: "宣传拍摄", scene: "摄影棚闪光灯很密，她悄悄挪到你身边。", lines: ["你靠我近一点，镜头会更好看。", "今天我们要做最亮眼的双人海报。"] },
  { title: "节目候场", scene: "候场区很冷，她把暖贴塞进你掌心。", lines: ["手别冻到，我刚捂热的。", "你等下上台一定超好看。"] },
  { title: "转场车厢", scene: "转场车里灯光昏暗，她靠着你肩膀。", lines: ["今天好累，但有你在我就不怕。", "你别偷偷难过，我会发现的。"] },
  { title: "返场安慰", scene: "直播口误后她第一时间跑来找你。", lines: ["没关系，这种失误谁都会有。", "你已经很厉害了，不许自责。"] },
];

const SU_LOC: DailyTemplate[] = [
  { title: "小屋晚安", scene: "深夜她给你发来语音，背景是轻轻的风声。", lines: ["你到家了吗？我等你回我再睡。", "晚安要第一个说给你听。"] },
  { title: "公司角落", scene: "公司茶水间，她把热可可推给你。", lines: ["今天你看起来有点累，先补糖。", "我会一直站在你这边的。"] },
  { title: "城市夜景", scene: "天桥上霓虹闪烁，她拉着你看远处大屏。", lines: ["总有一天我们会一起上那块屏幕。", "到时候你别忘了第一个抱我。"] },
  { title: "通告大厅", scene: "她在通告大厅小声问你要不要组队。", lines: ["我们一起接同一期节目好不好。", "你在我身边我会更安心。"] },
  { title: "社交私信", scene: "你刚发完动态，她秒回了一个哭哭贴图。", lines: ["谁敢说你不好我就去反驳。", "你别一个人扛，我会陪你。"] },
];

const LU_JOB: DailyTemplate[] = [
  { title: "候场抢拍", scene: "拼盘舞台候场区，陆星燃举着手机绕你一圈。", lines: ["别动，这个角度超绝，拍完我就删……才怪。", "你今天状态好到犯规。"] },
  { title: "排练并肩", scene: "镜面舞室里他强行把你拉到身侧机位。", lines: ["站我旁边，镜头就不会切丢你。", "这段我们一起卡点，别跟别人对。"] },
  { title: "返场堵门", scene: "返场结束他堵在化妆间门口等你。", lines: ["你刚刚跟谁聊那么久？", "算了，先喝水，嗓子别哑。"] },
  { title: "彩排贴耳", scene: "音响调试时他凑过来替你戴回耳返。", lines: ["别动，我给你调到最舒服的档位。", "你只要听我的拍点就行。"] },
  { title: "舞台联动", scene: "编舞老师改位后，他第一时间把你护到中心线。", lines: ["这线你站着最好看，别让。", "谁有意见让他来跟我说。"] },
  { title: "通宵回放", scene: "深夜他还在看你今天的舞台回放。", lines: ["这段你抬眼那一下我循环了二十次。", "明天我再给你拍更好的。"] },
  { title: "录制探班", scene: "你在别棚录制，他拎着饮料突然出现。", lines: ["路过，顺手买的。", "你别多想，我才不是特地来。"] },
  { title: "杀青留影", scene: "杀青板落下，他抢先站在你旁边。", lines: ["最后一张必须跟我拍。", "你不准把我裁掉。"] },
  { title: "音综对唱", scene: "对唱彩排前，他把歌词贴了你的备注。", lines: ["你这句我给你垫和声。", "出错了也别怕，我接得住。"] },
  { title: "庆功夜聊", scene: "庆功宴散场后，他还在车边等你。", lines: ["今天很棒，真的。", "以后每个重要夜晚我都想在。"] },
];

const LU_LOC: DailyTemplate[] = [
  { title: "小屋连线", scene: "你回到小屋，他立刻打来视频。", lines: ["你在家就好，我刚刚一直等你上线。", "把摄像头开着，我想确认你没事。"] },
  { title: "公司练歌房", scene: "公司练歌房门口，他把你叫进去听demo。", lines: ["副歌我给你留了空拍，你进来会更好听。", "别给别人先听，先给我一个人。"] },
  { title: "城市夜跑", scene: "城市公园夜跑时他突然并排跟上。", lines: ["你一个人跑不安全，我陪你。", "别甩开我，我跟得上。"] },
  { title: "通告大厅", scene: "他在通告大厅盯着你正在看的项目。", lines: ["这个主创我不放心，别接。", "你要上，就上最好的。"] },
  { title: "社交追踪", scene: "你发完动态一分钟后，他发来长语音。", lines: ["评论区我看过了，别被几句酸话影响。", "你只要看我夸你的那句就够了。"] },
];

const GU_JOB: DailyTemplate[] = [
  { title: "宴会落座", scene: "商业酒会开场前，顾承宴亲自替你拉开座椅。", lines: ["今晚你只需保持从容，其他交锋交给我。", "不必向任何人证明礼貌，你本来就足够有分量。"] },
  { title: "条款微调", scene: "会客室里他把合同最后两条划掉。", lines: ["这两条会限制你的创作自由，我不签。", "对我而言，合作的前提是你先舒服。"] },
  { title: "路演护航", scene: "路演现场突发提问失控，他把话筒接过去。", lines: ["问题到我这里就好。", "你不用站在风口，我来承担舆论成本。"] },
  { title: "品牌初审", scene: "品牌方提案会，他把主视觉换成你的版本。", lines: ["她不需要跟任何人撞路线。", "我们做独立风格，不做复制品。"] },
  { title: "投资博弈", scene: "董事会争论激烈，他仍维持平稳语速。", lines: ["这项目由我担保，她的名字不许被消费。", "你只要专注作品，资本的噪音我会隔开。"] },
  { title: "深夜加班", scene: "他在顶层办公室等你看完最后一版方案。", lines: ["如果你不喜欢，我们就重做，不必迁就任何KPI。", "你的长期价值，从来不该被短期流量定义。"] },
  { title: "公关封口", scene: "恶意黑稿扩散时，他把证据链发到你手机。", lines: ["来源和路径都在这里，已完成取证。", "明早九点，他们会公开撤稿。"] },
  { title: "跨界邀请", scene: "他递来跨界项目时语气少见地温柔。", lines: ["我知道你担心被误读，但这次不会。", "因为我会在每个关键节点亲自把关。"] },
  { title: "海外窗口", scene: "国际项目洽谈后，他把第一轮反馈给你。", lines: ["他们看中你的表达，不只是热度。", "你可以放心去更大的舞台。"] },
  { title: "收官晚餐", scene: "收官夜他把你最常点的菜提前安排好。", lines: ["今天不谈数据，先吃饭。", "你值得被认真庆祝。"] },
];

const GU_LOC: DailyTemplate[] = [
  { title: "小屋来电", scene: "你刚到小屋，顾承宴的电话准时打来。", lines: ["到家了吗？我只确认平安，不打扰你休息。", "有任何突发，直接拨我私人线。"] },
  { title: "公司会晤", scene: "公司会客区，他把日程压缩给你空出一天。", lines: ["你最近太满了，我替你退了两个无效局。", "状态比曝光更重要。"] },
  { title: "城市外景", scene: "你们在城市高架观景台短暂停留。", lines: ["这座城夜里很吵，但你不必被它裹挟。", "你只需要决定自己想走哪条路。"] },
  { title: "通告大厅甄别", scene: "他在通告大厅逐条标注风险等级。", lines: ["高回报高风险不适合你现在的节奏。", "我们做可持续，不做一次性爆点。"] },
  { title: "社交应对", scene: "社交舆情波动时，他发来三行建议。", lines: ["第一，先不回应；第二，保留证据；第三，睡觉。", "剩下的事，明早我来处理。"] },
];

const LIN_JOB: DailyTemplate[] = [
  { title: "值班探班", scene: "林屿下夜班后直接到片场门口等你。", lines: ["我路过，不算探班。", "你先把这杯温水喝了再开工。"] },
  { title: "伤口复查", scene: "武戏结束后他替你检查手背淤青。", lines: ["这处要冰敷，不然明天会肿。", "别逞强，你不是机器。"] },
  { title: "药盒提醒", scene: "转场车里他把分装药盒放进你包侧袋。", lines: ["止痛和护胃分开装好了，标签别拿反。", "你忙起来会忘，我替你记着。"] },
  { title: "夜诊通道", scene: "你临时不适，他把急诊流程全程打通。", lines: ["先别说话，跟着我走。", "检查完再骂我多管闲事也不迟。"] },
  { title: "康复拉伸", scene: "训练间隙他示范了三组肩颈放松动作。", lines: ["按这个节奏做，旧伤就不会反复。", "你要是偷懒，我会发现。"] },
  { title: "录制前餐", scene: "综艺开录前，他把准备好的便当递给你。", lines: ["高盐高糖我都剔掉了，你先垫胃。", "空腹上镜容易低血糖。"] },
  { title: "复盘心率", scene: "高压拍摄后他看着你的腕表数据皱眉。", lines: ["你今天心率峰值太高，晚上必须休息。", "工作可以补，身体坏了补不回。"] },
  { title: "返程守夜", scene: "深夜返程，他坚持陪你坐到最后一站。", lines: ["你睡吧，到站我叫你。", "我在这儿，不会有事。"] },
  { title: "复诊预约", scene: "他在手机里替你排好了下周复诊。", lines: ["不是商量，是通知。", "你答应过我，会先照顾好自己。"] },
  { title: "术后来信", scene: "刚下手术台的他仍给你发来报平安消息。", lines: ["手术顺利，你那边也要顺利。", "有事随时找我，别一个人扛。"] },
];

const LIN_LOC: DailyTemplate[] = [
  { title: "小屋药箱", scene: "他在你小屋门口放下补充好的医药箱。", lines: ["创可贴和退热贴我换新了。", "钥匙我放回原处，没乱动你东西。"] },
  { title: "公司走廊", scene: "公司长廊里他和你并肩走了很久。", lines: ["你最近瘦得太快，别再跳过正餐。", "答应我，今天按时睡。"] },
  { title: "城市医院", scene: "市中心医院门前，他替你挡开围拍镜头。", lines: ["跟我进内侧通道。", "先看病，外面的事我来解释。"] },
  { title: "通告大厅", scene: "你在通告大厅犹豫高强度项目时，他递来体能评估。", lines: ["这类通告两周内最多接一个。", "你红可以，但不能拿身体换。"] },
  { title: "社交夜聊", scene: "凌晨你失眠，他秒回了一段语音。", lines: ["呼吸跟着我数，四拍吸气，四拍呼气。", "别怕，我在听。"] },
];

const ZHOU_JOB: DailyTemplate[] = [
  { title: "赛前嘴硬", scene: "联动赛开场前，周焰把耳机甩到你手里。", lines: ["戴好，别待会儿听不清还怪我。", "你跟着我节奏走就行。"] },
  { title: "复盘硬夸", scene: "赛后复盘室里，他把你关键操作回放三遍。", lines: ["这波还行，勉强像个人。", "下次再快半拍就能封神。"] },
  { title: "直播连麦", scene: "他直播中途突然把你拉进语音。", lines: ["别怂，照你平时那样打。", "喷子我来怼，你只管操作。"] },
  { title: "训练加餐", scene: "凌晨训练结束，他把热汤面推给你。", lines: ["吃，不吃没力气怎么上分。", "我才不是关心你，是怕你拖后腿。"] },
  { title: "战术板前", scene: "战术室白板写满路线，他在你名字旁画了星号。", lines: ["这局你走中，资源我让给你。", "别慌，我兜底。"] },
  { title: "失误回护", scene: "你比赛失误后他第一时间把锅揽走。", lines: ["这波我指挥错了，跟她没关系。", "下把听我，我们能打回来。"] },
  { title: "外设借你", scene: "拍摄现场他把自己的鼠标垫塞给你。", lines: ["你用这个会顺手点。", "用完记得还我，别弄丢。"] },
  { title: "雨夜接人", scene: "暴雨夜你通告延迟，他骑车来接你。", lines: ["上车，别磨叽。", "感冒了我可不伺候你。"] },
  { title: "赛后散步", scene: "夜场结束后你们沿着基地外墙慢慢走。", lines: ["今天其实你最稳。", "这句你别外传，我会没面子。"] },
  { title: "冠军夜", scene: "庆功现场很吵，他把你拉到安静楼梯间。", lines: ["奖杯借你摸一下。", "下次我想跟你一起捧。"] },
];

const ZHOU_LOC: DailyTemplate[] = [
  { title: "小屋催排", scene: "你刚回小屋，周焰就发来双排邀请。", lines: ["上线，今天我带飞。", "你要是不来我就一直发。"] },
  { title: "公司探头", scene: "公司停车场，他靠在机车旁等你。", lines: ["路过而已。", "顺便带你去吃夜宵。"] },
  { title: "城市天桥", scene: "城市天桥夜风很大，他把外套甩到你肩上。", lines: ["别逞强，冻病了谁带我双排。", "披好，我不想重复第二遍。"] },
  { title: "通告大厅抢单", scene: "你刚点开电竞通告，他从后面探头。", lines: ["这单我熟，跟我接。", "有我在，你不会吃亏。"] },
  { title: "社交护短", scene: "社交评论区有人带节奏，他小号冲在最前。", lines: ["我已经处理了几个最吵的。", "你别看，影响手感。"] },
];

const JI_JOB: DailyTemplate[] = [
  { title: "改词开刀", scene: "季明轩在桌上摊开新一版剧本。", lines: ["这一场你别哭，用停顿压住情绪。", "我把台词给你改顺了，今晚背完。"] },
  { title: "片场盯戏", scene: "你刚下机位，他把你叫到监视器前。", lines: ["你这眼神少了三分狠。", "再来一条，我知道你做得到。"] },
  { title: "夜稿批注", scene: "凌晨两点，他把手写批注发到你邮箱。", lines: ["第七页情绪重心我圈出来了。", "明天开机前来我这儿过一遍。"] },
  { title: "对手戏重排", scene: "临时改场时他把你的走位重新标红。", lines: ["你站这个点，镜头会更吃表情。", "别客气，骂你是想让你更好。"] },
  { title: "台词抽查", scene: "化妆间门口他突然丢来台词本。", lines: ["抽你三段，现在背。", "你紧张的时候会咬字飘，注意收。"] },
  { title: "情绪复位", scene: "NG后他把你单独叫到楼梯间。", lines: ["先把呼吸找回来，别被失误带跑。", "你不是不会，你是太急。"] },
  { title: "试映密谈", scene: "试映会散场后他留你做最后复盘。", lines: ["你这一段让角色活了。", "下部我还想写你。"] },
  { title: "旧稿翻新", scene: "他把一叠废稿推给你，页角密密麻麻是改动。", lines: ["这些都给你，你慢慢看。", "我不想再把想法憋回抽屉。"] },
  { title: "配音监督", scene: "配音棚里他隔着玻璃敲了两下桌面。", lines: ["尾音别收太快，情绪会断。", "你抓住那口气，整段就成了。"] },
  { title: "首映前夜", scene: "首映前夜他把最后一版台词备忘录发来。", lines: ["明天你会被很多人看见。", "别怕，我写的每个字都站你这边。"] },
];

const JI_LOC: DailyTemplate[] = [
  { title: "小屋来稿", scene: "你在小屋收到他凌晨发来的修订页。", lines: ["我把你最别扭的两句改了。", "醒了记得看，别硬背旧版。"] },
  { title: "公司争执", scene: "公司走廊里他和制片争得脸色发白。", lines: ["我说了这场戏不能删。", "她的角色弧线我不会让步。"] },
  { title: "城市咖啡馆", scene: "街角咖啡馆，他把笔记本转向你。", lines: ["这个角色原型有你的影子。", "你若愿意，我想继续写下去。"] },
  { title: "通告大厅", scene: "你选通告时，他难得主动给建议。", lines: ["这个本子会浪费你，别接。", "选那个长线剧，我给你保驾。"] },
  { title: "社交转评", scene: "你发了片段后，他转发只写了八个字。", lines: ["她比你们想象的更好。", "别吵了，去看正片。"] },
];

const CHARACTER_JOB_TEMPLATES: Record<CoreCharacterId, DailyTemplate[]> = {
  liu_mengyao: [],
  shen_mo: SHEN_JOB,
  jiang_muci: JIANG_JOB,
  su_tangtang: SU_JOB,
  lu_xingran: LU_JOB,
  gu_chengyan: GU_JOB,
  lin_yu: LIN_JOB,
  zhou_yan: ZHOU_JOB,
  ji_mingxuan: JI_JOB,
};

const CHARACTER_LOCATION_TEMPLATES: Record<CoreCharacterId, DailyTemplate[]> = {
  liu_mengyao: [],
  shen_mo: SHEN_LOC,
  jiang_muci: JIANG_LOC,
  su_tangtang: SU_LOC,
  lu_xingran: LU_LOC,
  gu_chengyan: GU_LOC,
  lin_yu: LIN_LOC,
  zhou_yan: ZHOU_LOC,
  ji_mingxuan: JI_LOC,
};

const toEvent = (
  characterId: CoreCharacterId,
  idx: number,
  template: DailyTemplate,
  trigger: DailyTrigger,
): DailyEventConfig => {
  const name = CHARACTER_NAMES[characterId];
  const baseChance = trigger.type === "job" ? 0.42 : 0.28;
  const variance = (idx % 3) * 0.03;
  const triggerChance = Math.min(0.85, baseChance + variance);
  return {
    id: `daily_${characterId}_${trigger.type}_${idx + 1}`,
    characterId,
    title: template.title,
    scene: template.scene,
    lines: [
      { speaker: name, text: template.lines[0] },
      { speaker: name, text: template.lines[1] },
    ],
    options: buildOptions(name),
    trigger,
    triggerChance,
  };
};

export const DAILY_EVENTS: DailyEventConfig[] = (
  Object.keys(CHARACTER_NAMES) as CoreCharacterId[]
).flatMap((characterId) => {
  if (characterId === "liu_mengyao") {
    return LIU_DAILY_EVENTS;
  }
  const charIndex = CHARACTER_ORDER.indexOf(characterId);
  const jobTriggerIds = rotateList(JOB_TRIGGER_POOL, charIndex * 2);
  const locationTriggerIds = rotateList(LOCATION_TRIGGER_POOL, charIndex);

  const jobEvents = CHARACTER_JOB_TEMPLATES[characterId].map((template, idx) =>
    toEvent(characterId, idx, template, { type: "job", jobId: jobTriggerIds[idx] }),
  );

  const locationEvents = CHARACTER_LOCATION_TEMPLATES[characterId].map((template, idx) =>
    toEvent(characterId, idx, template, { type: "location", locationId: locationTriggerIds[idx] }),
  );

  return [...jobEvents, ...locationEvents];
});

export const dailyStories: Record<string, StoryNode> = DAILY_EVENTS.reduce((acc, event) => {
  acc[event.id] = {
    id: event.id,
    scene: event.scene,
    lines: event.lines,
    options: event.options,
  };
  return acc;
}, {} as Record<string, StoryNode>);

const roll = (chance: number): boolean => Math.random() < chance;

const pickOne = (events: DailyEventConfig[]): DailyEventConfig[] => {
  if (events.length === 0) return [];
  const picked = events[Math.floor(Math.random() * events.length)];
  return picked ? [picked] : [];
};

export function getDailyEventsByJob(jobId: string): DailyEventConfig[] {
  const pool = DAILY_EVENTS.filter(
    (event) =>
      event.trigger.type === "job" &&
      event.trigger.jobId === jobId &&
      roll(event.triggerChance),
  );
  return pickOne(pool);
}

export function getDailyEventsByLocation(locationId: string): DailyEventConfig[] {
  const pool = DAILY_EVENTS.filter(
    (event) =>
      event.trigger.type === "location" &&
      event.trigger.locationId === locationId &&
      roll(event.triggerChance),
  );
  return pickOne(pool);
}
