export type WeeklyChatCharacterId =
  | "liu_mengyao"
  | "shen_mo"
  | "lu_xingran"
  | "su_tangtang"
  | "gu_chengyan"
  | "lin_yu"
  | "zhou_yan"
  | "jiang_muci"
  | "ji_mingxuan";

export type WeeklyChatOption = {
  text: string;
  reply: string;
  affection: number;
};

export type WeeklyChatTopic = {
  id: string;
  scene: string;
  opener: string;
  options: [WeeklyChatOption, WeeklyChatOption, WeeklyChatOption];
};

export const WEEKLY_CHAT_DATA: Record<WeeklyChatCharacterId, WeeklyChatTopic[]> = {
  liu_mengyao: [
    {
      id: "liu_chat_01",
      scene: "凌晨复盘会后，柳梦瑶把平板扣在桌上，示意你留下。",
      opener: "明天是硬仗。你现在给我一句话，说明你会怎么保住镜头。",
      options: [
        { text: "先稳节奏再抢高光", reply: "总算没白教你。先活下来，再赢漂亮。", affection: 5 },
        { text: "听你安排，我执行", reply: "执行力合格，但你要学会自己判断。", affection: 3 },
        { text: "到场看感觉发挥", reply: "靠感觉吃饭的人，通常吃不久。", affection: -2 },
      ],
    },
    {
      id: "liu_chat_02",
      scene: "你咳了两声，柳梦瑶把热水推到你手边，语气依旧冷。",
      opener: "今天行程可以压缩一段。你自己选，训练还是休息？",
      options: [
        { text: "保留一小时修状态", reply: "知道取舍，才配谈长期。", affection: 3 },
        { text: "全程不减，硬扛完", reply: "逞强不是职业素养，是自毁。", affection: -5 },
        { text: "你定，我照做", reply: "别把脑子外包给我。下次你先给方案。", affection: 1 },
      ],
    },
    {
      id: "liu_chat_03",
      scene: "热搜刚压下去，柳梦瑶看着你，指尖轻敲桌面。",
      opener: "舆论会反弹。你要回应，还是继续用作品说话？",
      options: [
        { text: "先出作品，再回应", reply: "对。让成绩替你开口。", affection: 5 },
        { text: "发长文解释一切", reply: "情绪化发言只会喂大节奏。", affection: -2 },
        { text: "我先写草稿给你审", reply: "这次思路像样，发之前先过我。", affection: 3 },
      ],
    },
  ],
  shen_mo: [
    {
      id: "shen_chat_01",
      scene: "片场收工后，沈默站在灯下，替你把风衣领口理平。",
      opener: "你今天第三场戏前手在抖。是冷，还是紧张？",
      options: [
        { text: "都有，但我会调回来", reply: "诚实很好。你已经在变稳了。", affection: 3 },
        { text: "我没事，不用管", reply: "我知道你想扛，但你可以不用一个人扛。", affection: 1 },
        { text: "你怎么连这个都看到", reply: "看着你，很多细节都很难忽略。", affection: 5 },
      ],
    },
    {
      id: "shen_chat_02",
      scene: "雨夜回程，车窗起雾，沈默把纸巾递过来。",
      opener: "你最近睡眠不太好。要不要我把你的夜戏顺序往后调？",
      options: [
        { text: "不用麻烦，我自己调", reply: "好，我尊重你。需要我时，随时说。", affection: 3 },
        { text: "麻烦你了，谢谢", reply: "不麻烦。你开口，本身就很珍贵。", affection: 5 },
        { text: "随便，反正都一样", reply: "不一样。你要先在乎自己。", affection: -2 },
      ],
    },
    {
      id: "shen_chat_03",
      scene: "化妆间只剩你们两人，沈默把剧本翻到折角页。",
      opener: "这句台词你总是快半拍。要不要我陪你再走一遍？",
      options: [
        { text: "好，你帮我听呼吸点", reply: "来。你只管说，我帮你兜住节奏。", affection: 5 },
        { text: "我先自己练十分钟", reply: "可以，我在门外等你。", affection: 1 },
        { text: "不用了，我会过", reply: "自信是好事，轻敌不是。", affection: -5 },
      ],
    },
  ],
  lu_xingran: [
    {
      id: "lu_chat_01",
      scene: "训练室的灯还亮着，陆星燃擦着汗冲你笑。",
      opener: "今晚加练吗？我把场子清空了，就我们两个。",
      options: [
        { text: "加练，冲到最好", reply: "这才对！今晚谁都别想把你比下去。", affection: 5 },
        { text: "练半小时就收", reply: "也行，我盯你半小时全开状态。", affection: 3 },
        { text: "我想先去找别人对练", reply: "你要找他？行……我记住了。", affection: -2 },
      ],
    },
    {
      id: "lu_chat_02",
      scene: "后台走廊人来人往，陆星燃把你拉到安静角落。",
      opener: "刚才那群人围着你聊资源，我看着就烦。你离他们远点。",
      options: [
        { text: "你别乱吃醋", reply: "我没吃醋，我只是怕你被人利用。", affection: 1 },
        { text: "好，我有分寸", reply: "你这句话比奖杯还让我安心。", affection: 5 },
        { text: "你管太多了", reply: "行，我不说了……但我真的会担心。", affection: -5 },
      ],
    },
    {
      id: "lu_chat_03",
      scene: "夜跑结束，陆星燃把耳机塞给你一只。",
      opener: "新demo只给你听。听完告诉我，值不值得明天直接上台。",
      options: [
        { text: "上，我陪你扛现场", reply: "有你这句，我敢直接点火开麦。", affection: 5 },
        { text: "先微调副歌更稳", reply: "懂我。你一说我就知道该改哪。", affection: 3 },
        { text: "一般，换一首吧", reply: "你这刀有点狠……但我会改到你点头。", affection: -2 },
      ],
    },
  ],
  su_tangtang: [
    {
      id: "sutang_chat_01",
      scene: "录音室收工后，苏糖糖抱着保温杯坐在你旁边。",
      opener: "我这段高音总觉得发紧，你觉得我该再冲一次吗？",
      options: [
        { text: "先放松再冲高音", reply: "你总能把我从慌张里拉回来。", affection: 5 },
        { text: "今天先保状态", reply: "嗯，我听你的，稳住比逞强重要。", affection: 3 },
        { text: "硬上，靠天赋顶", reply: "这样会伤嗓子的……我有点怕。", affection: -2 },
      ],
    },
    {
      id: "sutang_chat_02",
      scene: "彩排结束，苏糖糖偷偷把糖果塞进你手心。",
      opener: "刚才有人说我只会卖可爱，你会不会也这么想？",
      options: [
        { text: "你很强，不止可爱", reply: "这句话我会记很久。", affection: 5 },
        { text: "用作品回应就好", reply: "好，我会把这口气唱出来。", affection: 3 },
        { text: "先别在意这些", reply: "我知道你是好意，但我还是会难过。", affection: 1 },
      ],
    },
    {
      id: "sutang_chat_03",
      scene: "深夜回到宿舍，苏糖糖发来一段未发布demo。",
      opener: "这段词我写给很重要的人，你愿意先听吗？",
      options: [
        { text: "我在，发来吧", reply: "有你在，我就敢把心里话唱出来。", affection: 5 },
        { text: "明早再听也可以", reply: "好，我先整理一下再给你。", affection: 1 },
        { text: "先给别人听更客观", reply: "原来我不是你第一个想到的人啊……", affection: -5 },
      ],
    },
  ],
  gu_chengyan: [
    {
      id: "gu_chat_01",
      scene: "商务酒会散场后，顾承宴将外套披在你肩上。",
      opener: "明天有个品牌联名会，你想要热度，还是想要口碑？",
      options: [
        { text: "口碑优先，热度可控", reply: "判断很成熟，我欣赏这种取舍。", affection: 5 },
        { text: "先拿热度，再补口碑", reply: "可以，但节奏必须由我们掌控。", affection: 3 },
        { text: "随便，哪个来都行", reply: "在这个位置，随便是最贵的代价。", affection: -2 },
      ],
    },
    {
      id: "gu_chat_02",
      scene: "会议室里灯光偏冷，顾承宴把合同推到你面前。",
      opener: "这份条件很优厚，但绑定期很长。你敢签吗？",
      options: [
        { text: "先看退出条款再决定", reply: "理性得很好，我会让法务重审细节。", affection: 5 },
        { text: "你认可我就签", reply: "信任可贵，但你要先对自己负责。", affection: 1 },
        { text: "不看了，直接拒绝", reply: "果断是优点，但别浪费可谈判空间。", affection: -2 },
      ],
    },
    {
      id: "gu_chat_03",
      scene: "车窗外是夜景，顾承宴忽然收起了平日的从容。",
      opener: "如果我给你最好的资源，你会一直站在我这边吗？",
      options: [
        { text: "先看你给的是否干净", reply: "很好，你比我想象得更清醒。", affection: 5 },
        { text: "合作可以，边界要清楚", reply: "边界明确，合作才会长久。", affection: 3 },
        { text: "你这是在交换感情？", reply: "你这句太锋利了，但我认。", affection: -5 },
      ],
    },
  ],
  lin_yu: [
    {
      id: "lin_chat_01",
      scene: "值班室外很安静，林屿把热牛奶递到你手里。",
      opener: "你最近心率波动有点大，今晚还要继续熬吗？",
      options: [
        { text: "听你一次，先休息", reply: "这就对了，身体是你最贵的本钱。", affection: 5 },
        { text: "再撑一小时就睡", reply: "那我一小时后提醒你，不许赖。", affection: 3 },
        { text: "我习惯了，没事", reply: "习惯透支不等于没代价。", affection: -2 },
      ],
    },
    {
      id: "lin_chat_02",
      scene: "雨天堵车，林屿在电话那头语气很稳。",
      opener: "你嗓子哑了，明天通告要不要我帮你协调延后？",
      options: [
        { text: "麻烦你协调一下", reply: "好，我已经在联系，今晚先禁声。", affection: 5 },
        { text: "我自己去沟通", reply: "可以，我给你一份沟通要点。", affection: 3 },
        { text: "不用，硬上就行", reply: "你这样是在拿恢复期做赌注。", affection: -5 },
      ],
    },
    {
      id: "lin_chat_03",
      scene: "复诊结束后，林屿把药盒按次序摆好。",
      opener: "你总把自己放最后。今天我问一次，你现在最难受的是哪件事？",
      options: [
        { text: "怕自己撑不住", reply: "能说出来就不是脆弱，是勇气。", affection: 5 },
        { text: "我还在找答案", reply: "那就慢慢找，我会陪着你。", affection: 3 },
        { text: "没什么可说的", reply: "我尊重你，但别把门彻底关上。", affection: 1 },
      ],
    },
  ],
  zhou_yan: [
    {
      id: "zhou_chat_01",
      scene: "训练赛复盘结束，周焰把战术板转向你。",
      opener: "下一把要不要我给你开资源？你敢不敢接主C位？",
      options: [
        { text: "开，我来打正面", reply: "好，这才像队友。你上我就保。", affection: 5 },
        { text: "先打稳再找机会", reply: "行，稳着打也能赢。", affection: 3 },
        { text: "你自己玩就好", reply: "你这话挺伤士气的。", affection: -2 },
      ],
    },
    {
      id: "zhou_chat_02",
      scene: "直播间刚下播，周焰把耳机摘下看着你。",
      opener: "弹幕在带节奏，要不要现在就开怼？",
      options: [
        { text: "不怼，拿成绩回敬", reply: "懂了，先赢再说话。", affection: 5 },
        { text: "发个简短声明", reply: "可以，我帮你压字数和语气。", affection: 3 },
        { text: "直接开团回喷", reply: "你痛快是痛快，但后果谁扛？", affection: -5 },
      ],
    },
    {
      id: "zhou_chat_03",
      scene: "深夜排位匹配中，周焰发来私聊。",
      opener: "这局你跟我走边线，别离开我视野。",
      options: [
        { text: "行，我跟你节奏", reply: "那这局我们一起收割。", affection: 5 },
        { text: "我想单走试试", reply: "也行，出事第一时间叫我。", affection: 1 },
        { text: "你别管我怎么打", reply: "我只是想赢，不是想管你。", affection: -2 },
      ],
    },
  ],
  jiang_muci: [
    {
      id: "jiang_chat_01",
      scene: "停车场风很大，江暮辞把你护在车门内侧。",
      opener: "这几天盯你的人变多了。你还要一个人走夜路吗？",
      options: [
        { text: "那就麻烦你接我", reply: "不麻烦，这是我该做的。", affection: 5 },
        { text: "我会注意路线", reply: "好，我把安全点位发你。", affection: 3 },
        { text: "你太夸张了", reply: "希望是我夸张，但防一手总没错。", affection: -2 },
      ],
    },
    {
      id: "jiang_chat_02",
      scene: "片场外有人围堵，江暮辞挡在你前面低声问。",
      opener: "我现在带你走后门，还是你要正面回应？",
      options: [
        { text: "先撤离，再统一回应", reply: "明白，安全优先。", affection: 5 },
        { text: "我简单说两句就走", reply: "可以，我给你卡三十秒。", affection: 3 },
        { text: "我自己处理，你让开", reply: "你这句很重，但我尊重。", affection: -5 },
      ],
    },
    {
      id: "jiang_chat_03",
      scene: "凌晨回程，江暮辞的消息只弹出一行字。",
      opener: "到家回我。看见已读我才睡。",
      options: [
        { text: "到家了，辛苦你了", reply: "收到，今晚可以放心了。", affection: 5 },
        { text: "晚点再回", reply: "行，我等你消息。", affection: 1 },
        { text: "别这么管着我", reply: "好。我退一步，但你别拿安全赌气。", affection: -2 },
      ],
    },
  ],
  ji_mingxuan: [
    {
      id: "ji_chat_01",
      scene: "剪辑室灯光昏暗，季明轩把新版本推到你面前。",
      opener: "这段情绪我压了两版，你要克制型，还是爆发型？",
      options: [
        { text: "先克制再爆发", reply: "你抓到重点了，层次会更高级。", affection: 5 },
        { text: "直接爆发更痛快", reply: "可以，但细节要跟上。", affection: 3 },
        { text: "都行，你定吧", reply: "你可以依赖我，但别放弃判断。", affection: 1 },
      ],
    },
    {
      id: "ji_chat_02",
      scene: "走廊尽头，季明轩把台词本递给你，纸页满是批注。",
      opener: "我把你的断句全改了。你会照读，还是按你的来？",
      options: [
        { text: "先按你版跑一遍", reply: "很好，先试再争论，效率最高。", affection: 5 },
        { text: "我想融合两版", reply: "有主见。我陪你一起磨。", affection: 3 },
        { text: "全改太多，不想试", reply: "那你至少要告诉我理由。", affection: -2 },
      ],
    },
    {
      id: "ji_chat_03",
      scene: "凌晨一点，季明轩罕见地主动发来语音。",
      opener: "今天那场戏你让我意外。下部片子，你敢不敢跟我赌一次？",
      options: [
        { text: "敢，赌一部代表作", reply: "好。那就别退，我会把你推到最前面。", affection: 5 },
        { text: "先给我看完整计划", reply: "谨慎是对的，明早我发你提案。", affection: 3 },
        { text: "我不想冒险", reply: "我理解，但你可能会错过窗口期。", affection: -5 },
      ],
    },
  ],
};
