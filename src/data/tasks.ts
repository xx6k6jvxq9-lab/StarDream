export type TaskTrack = "acting" | "business" | "gaming" | "charity" | "music" | "dance";

export type TaskMentor = {
  id: string;
  name: string;
  role: string;
  line: string;
};

type TaskReward = {
  money?: number;
  popularity?: number;
  stats?: Record<string, number>;
  rewardItems?: string[];
  unlockedJobId?: string;
  unlockJobs?: string[];
  title?: string;
  passiveIncome?: number;
  favorBonus?: { target: string; value: number };
};

export type PhaseTask = {
  id: string;
  track: TaskTrack;
  domain: TaskTrack;
  level: number;
  title: string;
  desc: string;
  dialogue: string;
  mentorName: string;
  targetJobId?: string;
  preTaskId?: string;
  requiredItem?: string;
  req: Record<string, number>;
  reward: TaskReward;
};

type TaskSeed = {
  req: Record<string, number>;
  reward: TaskReward;
};

const pad = (num: number) => String(num).padStart(2, "0");
const makeTaskId = (track: TaskTrack, level: number) => `task_${track}_${pad(level)}`;

const buildTrackTasks = (track: TaskTrack, seeds: TaskSeed[]): PhaseTask[] =>
  seeds.map((seed, idx) => {
    const level = idx + 1;
    return {
      id: makeTaskId(track, level),
      track,
      domain: track,
      level,
      title: `${track}-${level}`,
      desc: "待更新",
      dialogue: "系统助手：继续推进本轮目标。",
      mentorName: "系统助手",
      preTaskId: level > 1 ? makeTaskId(track, level - 1) : undefined,
      req: seed.req,
      reward: seed.reward,
    };
  });

export const TASK_TRACK_ORDER: TaskTrack[] = ["acting", "business", "gaming", "charity", "music", "dance"];

export const TASK_TRACK_META: Record<TaskTrack, { label: string; levels: [string, string, string] }> = {
  acting: { label: "演艺", levels: ["试镜新人", "镜头核心", "银幕王牌"] },
  business: { label: "商业", levels: ["品牌起步", "渠道放大", "资本主理"] },
  gaming: { label: "电竞", levels: ["对局新秀", "联赛主力", "冠军门面"] },
  charity: { label: "公益", levels: ["善意起步", "持续影响", "公共榜样"] },
  music: { label: "音乐", levels: ["录音新声", "舞台主唱", "榜单常驻"] },
  dance: { label: "舞台", levels: ["节拍入门", "编排进阶", "压轴主舞"] },
};

export const TASK_MENTORS: Record<TaskTrack, TaskMentor> = {
  acting: {
    id: "liu_mengyao",
    name: "柳梦瑶",
    role: "演艺总经纪",
    line: "这通告是我截胡来的，搞砸了你就回去演背景板。",
  },
  business: {
    id: "system_business",
    name: "系统助手",
    role: "商业教练",
    line: "目标已同步，按计划推进转化与口碑双指标。",
  },
  gaming: {
    id: "system_gaming",
    name: "系统助手",
    role: "赛事分析",
    line: "关键局决策优先，先保证执行稳定再追求高光。",
  },
  charity: {
    id: "system_charity",
    name: "系统助手",
    role: "公益顾问",
    line: "透明、可追溯、可复盘，这是长期信任的底线。",
  },
  music: {
    id: "system_music",
    name: "系统助手",
    role: "音乐制作",
    line: "声线状态良好，本轮建议冲击更高完成度。",
  },
  dance: {
    id: "system_dance",
    name: "系统助手",
    role: "舞台编导",
    line: "卡点精度优先，后半程体能要留出爆发窗口。",
  },
};

const actingSeeds: TaskSeed[] = Array.from({ length: 40 }, (_, i) => ({
  req: { acting: 16 + i * 8, charm: 12 + i * 5 },
  reward: { money: 1200 + i * 450, popularity: 15 + i * 4 },
}));

const musicSeeds: TaskSeed[] = Array.from({ length: 40 }, (_, i) => ({
  req: { singing: 16 + i * 8, charm: 10 + i * 5 },
  reward: { money: 1300 + i * 460, popularity: 15 + i * 4 },
}));

const businessSeeds: TaskSeed[] = Array.from({ length: 40 }, (_, i) => ({
  req: {
    charm: 28 + i * 6,
    popularity: 60 + i * 20,
    appearance: 18 + i * 3,
    money: 6000 + i * 9000,
  },
  reward: { money: 4800 + i * 1800, popularity: 20 + i * 4 },
}));

const gamingSeeds: TaskSeed[] = Array.from({ length: 40 }, (_, i) => ({
  req: {
    dancing: 24 + i * 6,
    charm: 20 + i * 4,
    popularity: 70 + i * 22,
    money: 5000 + i * 8000,
  },
  reward: { money: 4500 + i * 1700, popularity: 19 + i * 4 },
}));

const charitySeeds: TaskSeed[] = Array.from({ length: 40 }, (_, i) => ({
  req: {
    charm: 24 + i * 6,
    acting: 18 + i * 6,
    popularity: 60 + i * 20,
    money: 4000 + i * 7000,
  },
  reward: { money: 4200 + i * 1600, popularity: 18 + i * 4 },
}));

const danceSeeds: TaskSeed[] = Array.from({ length: 40 }, (_, i) => ({
  req: {
    dancing: 28 + i * 7,
    charm: 20 + i * 4,
    stamina: 35 + i * 3,
    popularity: 80 + i * 22,
    money: 5000 + i * 8000,
  },
  reward: { money: 4400 + i * 1650, popularity: 19 + i * 4 },
}));

const buildCopyOverrides = (
  track: TaskTrack,
  items: readonly { title: string; desc: string; dialogue?: string; mentorName?: string; targetJobId?: string }[],
): Record<string, Pick<PhaseTask, "title" | "desc" | "dialogue" | "mentorName" | "targetJobId">> =>
  Object.fromEntries(
    items.map((item, idx) => [
      makeTaskId(track, idx + 1),
      {
        title: item.title,
        desc: item.desc,
        dialogue: item.dialogue ?? TASK_MENTORS[track].line,
        mentorName: item.mentorName ?? TASK_MENTORS[track].name,
        targetJobId: item.targetJobId,
      },
    ]),
  );

const ACTING_TARGET_JOB_BY_TASK_ID: Record<string, string> = {
  task_acting_01: "cyber_lover_0719",
  task_acting_03: "changhe_luori_web",
  task_acting_05: "forbidden_deep_sea",
  task_acting_07: "job_night_rain_court",
  task_acting_09: "job_dark_alley_echo",
  task_acting_11: "job_white_day_maze",
  task_acting_13: "job_fog_city_letter",
  task_acting_15: "job_moon_harbor_past",
  task_acting_17: "job_night_banquet",
  task_acting_19: "job_snowline_meeting",
  task_acting_21: "job_time_gap_night_scene",
  task_acting_23: "job_island_testimony",
  task_acting_25: "job_backlight_rule",
  task_acting_27: "job_riverside_old_dream",
  task_acting_29: "job_burning_day",
  task_acting_31: "job_weightless_night",
  task_acting_33: "job_blind_zone",
  task_acting_35: "job_south_court_wind",
  task_acting_37: "job_silent_sea",
};

const BUSINESS_TARGET_JOB_BY_TASK_ID: Record<string, string> = {
  task_business_01: "mint_city_brand",
  task_business_03: "mirror_queen_show",
  task_business_05: "job_distant_star_launch",
  task_business_07: "seashell_radio",
  task_business_09: "job_blue_flame_announcement",
  task_business_11: "seashell_radio",
  task_business_13: "job_tide_sequence_cocreate",
  task_business_16: "velvet_court_drama",
  task_business_18: "city_heartbeat_live",
  task_business_21: "job_glow_mag_cover_sign",
  task_business_23: "job_bazaar_special_project",
  task_business_25: "job_cloudscreen_launch_host",
  task_business_27: "job_star_tide_sponsor_night",
  task_business_29: "job_obsidian_plan_collab",
  task_business_31: "job_farsea_weekly_interview",
  task_business_33: "job_golden_line_gala",
  task_business_35: "job_rising_brand_cocreate",
  task_business_37: "job_trend_summit_keynote",
  task_business_39: "rose_finance_talk",
};

const GAMING_TARGET_JOB_BY_TASK_ID: Record<string, string> = {
  task_gaming_01: "neon_chase_variety",
  task_gaming_03: "shine_trainee_s1",
  task_gaming_05: "esports_fps",
  task_gaming_07: "northwind_legend",
  task_gaming_09: "job_night_trial_linkup",
  task_gaming_11: "job_white_day_flare_cup",
  task_gaming_13: "job_deepsea_echo_tactic_show",
  task_gaming_15: "job_distant_star_home_finale",
  task_gaming_17: "job_streamlight_cross_circle",
  task_gaming_19: "job_era_echo_finals_night",
  task_gaming_21: "job_tower_seal_night",
  task_gaming_23: "job_limit_teamfight_starter",
  task_gaming_25: "job_canyon_storm_wildcard",
  task_gaming_27: "job_champion_night_talk",
  task_gaming_29: "job_omni_domination_elim",
  task_gaming_31: "job_snowline_breakout_top8",
  task_gaming_33: "job_endgame_echo_semifinal",
  task_gaming_35: "job_galaxy_cup_decider",
  task_gaming_37: "job_throne_clash_grandfinal",
  task_gaming_39: "job_global_review_top1",
};

const CHARITY_TARGET_JOB_BY_TASK_ID: Record<string, string> = {
  task_charity_01: "city_chronicle_docu",
  task_charity_03: "mint_city_brand",
  task_charity_05: "seashell_radio",
  task_charity_07: "city_heartbeat_live",
  task_charity_09: "job_distant_star_childcare",
  task_charity_11: "job_nightlog_hotline_day",
  task_charity_13: "job_tide_sequence_river_week",
  task_charity_15: "job_white_noise_forum",
  task_charity_17: "job_blue_flame_kindness_report",
  task_charity_19: "job_era_echo_charity_cover",
  task_charity_21: "job_warm_winter_visit",
  task_charity_23: "job_river_guard_action",
  task_charity_25: "job_morninglight_library_corner",
  task_charity_27: "job_city_hotmeal_nightshift",
  task_charity_29: "job_child_dream_workshop_day",
  task_charity_31: "job_blue_coast_cleanup",
  task_charity_33: "job_neighborhood_watch_linkvisit",
  task_charity_35: "job_rainnight_hotline_shift",
  task_charity_37: "job_starbridge_charity_run_finale",
  task_charity_39: "job_kindness_annual_report",
};

const MUSIC_TARGET_JOB_BY_TASK_ID: Record<string, string> = {
  task_music_01: "acoustic_demo_room",
  task_music_03: "campus_radio_live",
  task_music_05: "shine_trainee_s1",
  task_music_07: "job_tide_sound_night",
  task_music_09: "job_fogport_diary_ost",
  task_music_11: "job_white_day_echo_record",
  task_music_13: "job_flowfire_live_stage",
  task_music_15: "job_moonface_whisper_duet",
  task_music_17: "job_tide_plan_release",
  task_music_19: "job_nightglow_stage_debut",
  task_music_21: "job_farshore_recording_week",
  task_music_23: "job_blue_night_signal_premiere",
  task_music_25: "job_outside_gravity_rerecord",
  task_music_27: "job_starscreen_tour_stop",
  task_music_29: "job_countercurrent_title_track",
  task_music_31: "job_finale_overture_wrap",
  task_music_33: "job_obsidian_star_collab_music",
  task_music_35: "job_endless_summer_finale",
  task_music_37: "job_lightyear_special_stage",
};

const DANCE_TARGET_JOB_BY_TASK_ID: Record<string, string> = {
  task_dance_01: "falling_orbit_mv",
  task_dance_03: "city_heartbeat_live",
  task_dance_05: "shine_trainee_s1",
  task_dance_07: "northwind_legend",
  task_dance_09: "job_distant_star_heels_training",
  task_dance_11: "job_tide_sequence_rework_stage",
  task_dance_13: "job_nightlog_duet_dance",
  task_dance_15: "job_blueflame_finale_stage",
  task_dance_17: "job_era_echo_groupnight_stage",
  task_dance_19: "job_national_concert_maindance",
  task_dance_21: "job_riftstage_debut",
  task_dance_23: "job_neon_fantasia_groupdance",
  task_dance_25: "job_burnplan_maindance",
  task_dance_27: "job_tidenight_linkupdance",
  task_dance_29: "job_storm_return_encore",
  task_dance_31: "job_mirror_zero_duet",
  task_dance_33: "job_nightvoyage_heartbeat_rework",
  task_dance_35: "job_finalwave_closing",
  task_dance_37: "job_national_dancenight_home",
  task_dance_39: "job_peak_dancewar_finalnight",
};

const actingCopy = buildCopyOverrides("acting", [
  { title: "拿下《赛博情人》", desc: "柳梦瑶：这个本子我截胡来的，试镜丢脸你就别回公司。" },
  { title: "破碎感上热搜", desc: "柳梦瑶：这场哭戏给我一条过，黑粉的嘴要你亲手封上。" },
  { title: "《长河落日》围读", desc: "柳梦瑶：这个剧组在横店开机，去证明你不是去旅游的。" },
  { title: "全网眼神杀", desc: "柳梦瑶：连看镜头都飘，就别谈什么女主命。" },
  { title: "《深海》一秒入戏", desc: "柳梦瑶：开机第一条就要稳，你没资格慢热。" },
  { title: "截胡S级资源", desc: "柳梦瑶：我帮你把门踹开了，接下来你自己站稳。" },
  { title: "《夜雨庭》定妆", desc: "柳梦瑶：定妆照就是战书，气场不够就重拍到凌晨。" },
  { title: "红毯艳压通稿", desc: "柳梦瑶：今晚谁都能输，只有你不能输给镜头。" },
  { title: "《暗巷回声》补拍", desc: "柳梦瑶：补拍最见功底，台词咬不稳就继续磨。" },
  { title: "一镜到底封神", desc: "柳梦瑶：镜头不会心疼你，失误一次就重来十次。" },
  { title: "《白昼迷城》试镜", desc: "柳梦瑶：你不是来见世面的，你是来拿角色的。" },
  { title: "路透反杀黑评", desc: "柳梦瑶：把质疑变成掌声，这叫本事。" },
  { title: "《雾都来信》开机", desc: "柳梦瑶：第一天就要进状态，别让我盯着你催。" },
  { title: "通稿战翻盘", desc: "柳梦瑶：嘴仗没意义，用成片说话。" },
  { title: "《月港往事》复拍", desc: "柳梦瑶：情绪断点给我接严丝合缝。" },
  { title: "哭戏一条过", desc: "柳梦瑶：眼泪不是演出来的，是压出来的。" },
  { title: "《夜宴》配角抢戏", desc: "柳梦瑶：戏份少也得让人记住你。" },
  { title: "路人缘逆袭", desc: "柳梦瑶：把轻飘飘的漂亮脸，演成有重量的人。" },
  { title: "《雪线》主创会", desc: "柳梦瑶：台上发言别发虚，字字都要有分量。" },
  { title: "拿下女主角", desc: "柳梦瑶：这次你要么封神，要么重头再来。" },
  { title: "《时差》夜戏", desc: "柳梦瑶：熬夜不是借口，状态给我顶住。" },
  { title: "台词杀疯全网", desc: "柳梦瑶：每个字都给我钉进观众脑子里。" },
  { title: "《孤岛证词》加拍", desc: "柳梦瑶：临时加戏是信任，你别把它演碎了。" },
  { title: "戏眼稳稳拿住", desc: "柳梦瑶：别抢戏，控戏，懂了吗？" },
  { title: "《逆光法则》进组", desc: "柳梦瑶：进组第一天就要让导演放心。" },
  { title: "全组改口夸", desc: "柳梦瑶：口碑不是等来的，是一条条拼出来的。" },
  { title: "《河岸旧梦》收官", desc: "柳梦瑶：收官戏最难，你给我稳住最后一击。" },
  { title: "监视器点头", desc: "柳梦瑶：导演沉默不是坏事，点头才是过关。" },
  { title: "《燃昼》主演位", desc: "柳梦瑶：主演不是头衔，是责任。" },
  { title: "路演全场泪崩", desc: "柳梦瑶：把情绪留给角色，不要留给借口。" },
  { title: "《失重夜》补录", desc: "柳梦瑶：补录台词也要有画面感。" },
  { title: "演技词条拉满", desc: "柳梦瑶：你现在每一次出场都要值回票价。" },
  { title: "《盲区》终极试镜", desc: "柳梦瑶：这是高压局，别演安全牌。" },
  { title: "全网催你播", desc: "柳梦瑶：热度在这，别让实力掉线。" },
  { title: "《风起南庭》官宣", desc: "柳梦瑶：官宣只是开始，成片才是战场。" },
  { title: "制片人回头签", desc: "柳梦瑶：回头签约说明你真的值钱了。" },
  { title: "《无声海》压轴", desc: "柳梦瑶：压轴戏不许抖，给我收得漂亮。" },
  { title: "演技封面人物", desc: "柳梦瑶：这位置不是赠品，是你拼来的。" },
  { title: "年榜第一女主", desc: "柳梦瑶：最后一关，拿下它，你就站稳了。" },
  { title: "银幕封神夜", desc: "柳梦瑶：这次别让我提醒，你该有王者样子了。" },
]);

const musicCopy = buildCopyOverrides("music", [
  { title: "《录音室奇迹》", desc: "系统助手：本轮主线为声线稳定与情感精准，建议一次成歌。" },
  { title: "高音一击封麦", desc: "系统助手：保持共鸣区连续性，本次目标是高音完整穿透。" },
  { title: "《深夜电台》首唱", desc: "系统助手：现场环境已配置，建议先锁准情绪基调。" },
  { title: "黑粉原地转粉", desc: "系统助手：节奏与咬字同步优化，舆情转化窗口已打开。" },
  { title: "《星光101》踢馆", desc: "系统助手：舞台通告已接入，优先保证副歌爆发点。" },
  { title: "录音棚惊艳开嗓", desc: "系统助手：建议采用主副声区衔接方案，减少断层感。" },
  { title: "《潮声夜》返场", desc: "系统助手：返场段建议提升情绪张力，建立记忆点。" },
  { title: "热单预定词条", desc: "系统助手：传播节奏已就绪，持续保持稳定输出。" },
  { title: "《雾港日记》OST", desc: "系统助手：影视OST要求叙事感，请强化画面化表达。" },
  { title: "音综名场面", desc: "系统助手：本轮重点为临场修正能力与稳定控场。" },
  { title: "《白昼回声》录制", desc: "系统助手：建议先完成主旋律精修，再强化情绪层次。" },
  { title: "副歌杀穿榜单", desc: "系统助手：传播曲线良好，注意控制疲劳导致的音准漂移。" },
  { title: "《流火》现场版", desc: "系统助手：现场噪声较高，请稳住呼吸点与节拍点。" },
  { title: "全网二创刷屏", desc: "系统助手：辨识度已提升，建议放大一句抓耳旋律。" },
  { title: "《月面低语》合唱", desc: "系统助手：双人段需保持频段互补，避免互相覆盖。" },
  { title: "返场安可三次", desc: "系统助手：观众反馈积极，继续保持情绪递进曲线。" },
  { title: "《潮汐计划》发布", desc: "系统助手：新歌上线窗口已开启，请同步执行宣发动作。" },
  { title: "乐评人改口夸", desc: "系统助手：口碑拐点出现，建议坚持高完成度路线。" },
  { title: "《夜光》舞台首秀", desc: "系统助手：舞台编排与声线状态均已达可冲线标准。" },
  { title: "榜单冲进前十", desc: "系统助手：当前曲线向上，注意收尾段稳定性。" },
  { title: "《远岸》录音周", desc: "系统助手：密集录制期间，优先保证每轨质量一致。" },
  { title: "开口即全场静", desc: "系统助手：已进入高关注阶段，细节容错会明显下降。" },
  { title: "《蓝夜信号》首播", desc: "系统助手：首播通告上线，建议强化主副歌对比。" },
  { title: "热搜挂三天", desc: "系统助手：热度持续中，建议稳定追加内容供给。" },
  { title: "《重力之外》重录", desc: "系统助手：重录目标为高频段更圆润，避免尖锐刺耳。" },
  { title: "开麦零失误", desc: "系统助手：当前状态优秀，请维持全段呼吸控制。" },
  { title: "《星幕》巡演站", desc: "系统助手：巡演强度提升，建议按分段恢复体力。" },
  { title: "全场合唱爆灯", desc: "系统助手：互动效率高，继续放大副歌记忆点。" },
  { title: "《逆流》主打曲", desc: "系统助手：主打任务启动，请锁定最优情绪版本。" },
  { title: "连唱不掉线", desc: "系统助手：连续作业阶段，请优先守住音准底线。" },
  { title: "《终章序曲》录完", desc: "系统助手：收官录制进行中，保持最后一轨完整度。" },
  { title: "乐迷夜排长队", desc: "系统助手：口碑转化稳定，建议继续高频触达。" },
  { title: "《黑曜星》联动", desc: "系统助手：跨界通告已接入，请保持风格一致性。" },
  { title: "冠单锁定", desc: "系统助手：榜单窗口有利，建议进行最后冲刺。" },
  { title: "《无尽夏》终演", desc: "系统助手：终演舞台重点是后半程体力与声线稳定。" },
  { title: "直播百万同听", desc: "系统助手：并发压力高，请稳定输出避免失误。" },
  { title: "《光年》特别场", desc: "系统助手：特别场曝光极高，建议保守处理高风险段。" },
  { title: "年度十大金曲", desc: "系统助手：本轮目标为高完成度收官，请保持连贯。" },
  { title: "音乐封面人物", desc: "系统助手：你已进入核心位，继续维持专业标准。" },
  { title: "舞台王者夜", desc: "系统助手：终局节点已到，执行冠军线版本。" },
]);

const businessCopy = buildCopyOverrides("business", [
  { title: "《薄荷城》首签", desc: "系统助手：首轮品牌通告已开放，请完成签约闭环。" },
  { title: "直播破百万", desc: "系统助手：黄金时段已锁定，优先拉满转化率。" },
  { title: "《镜面女王》联名", desc: "系统助手：联名项目上线，请同时守住口碑与销量。" },
  { title: "黑评区翻盘", desc: "系统助手：舆情波动中，请用结果完成反转。" },
  { title: "《远星》发布会", desc: "系统助手：发布会主理任务开始，控场优先。" },
  { title: "续约点名你", desc: "系统助手：复购窗口开启，保持稳定交付。" },
  { title: "《夜航日志》联动", desc: "系统助手：跨项目联动进行中，统一传播口径。" },
  { title: "大促清仓战", desc: "系统助手：冲刺阶段，请压缩无效消耗。" },
  { title: "《蓝焰》官宣", desc: "系统助手：官宣投放已启动，请同步拉升讨论度。" },
  { title: "品牌周收官", desc: "系统助手：跨平台整合执行，目标高转化收尾。" },
  { title: "《海螺电台》植入", desc: "系统助手：内容融合度将影响长期价值。" },
  { title: "商务白皮书", desc: "系统助手：权威窗口已开，交付可复盘方案。" },
  { title: "《潮汐序章》共创", desc: "系统助手：共创会排期完成，输出落地执行稿。" },
  { title: "三城路演", desc: "系统助手：多地节奏需一致，优先保证稳定口碑。" },
  { title: "危机公关夜", desc: "系统助手：时限任务触发，请快速完成舆情回正。" },
  { title: "《天鹅妆法庭》", desc: "系统助手：剧内植入位确认，保证自然呈现。" },
  { title: "爆单冲榜", desc: "系统助手：销量窗口短，执行效率优先。" },
  { title: "《城市心跳》冠名", desc: "系统助手：冠名资源接入，请完成全链路曝光。" },
  { title: "全网改口夸", desc: "系统助手：连续稳定交付可提升正向反馈占比。" },
  { title: "商业战报封面", desc: "系统助手：本阶段目标为高转化高口碑收官。" },
  { title: "《璀璨刊》封面签", desc: "系统助手：封面合作窗口开启，请同步提升品牌好感与转化率。" },
  { title: "截胡年度代言", desc: "系统助手：高价值资源已切入，执行节奏必须快且稳。" },
  { title: "《时尚芭莎》特企", desc: "系统助手：特企通告上线，内容调性和商业诉求要双达标。" },
  { title: "品牌方连夜追单", desc: "系统助手：临时追加合作出现，请优先保障履约质量。" },
  { title: "《云幕发布会》主理", desc: "系统助手：发布会进入高压段，控场与信息传达并重。" },
  { title: "全网测评改口", desc: "系统助手：测评舆论回暖，持续稳定交付可放大优势。" },
  { title: "《星潮夜》冠名局", desc: "系统助手：冠名链路启动，请完成跨平台曝光闭环。" },
  { title: "爆款同款断货", desc: "系统助手：销售峰值已到，注意补货节奏与口碑维护。" },
  { title: "《黑曜计划》联动", desc: "系统助手：联动项目并发提高，统一叙事优先。" },
  { title: "商务榜冲前三", desc: "系统助手：榜单窗口短，请集中资源冲刺关键指标。" },
  { title: "《远海周刊》专访", desc: "系统助手：专访内容将影响信任曲线，表达需专业克制。" },
  { title: "谈判桌反杀局", desc: "系统助手：议价阶段开始，目标是长期条款而非短期让利。" },
  { title: "《金线盛典》席位", desc: "系统助手：盛典通告确认，现场表现将放大商业价值。" },
  { title: "黑词条逆转红榜", desc: "系统助手：舆情反转窗口打开，用结果完成叙事切换。" },
  { title: "《新锐品牌》共创", desc: "系统助手：共创阶段需兼顾创意表达与落地效率。" },
  { title: "三天两城签约", desc: "系统助手：高密度签约开始，请确保每场交付稳定。" },
  { title: "《潮流峰会》压轴讲", desc: "系统助手：压轴发言关注度极高，观点要可执行可复盘。" },
  { title: "年度续约率拉满", desc: "系统助手：复购与续约进入收官统计，请稳住质量线。" },
  { title: "《资本夜话》头条", desc: "系统助手：头条曝光窗口开启，维持高可信商务形象。" },
  { title: "商业封神收官", desc: "系统助手：终局任务已到，目标是高质量成交与长期合作。" },
]);

const gamingCopy = buildCopyOverrides("gaming", [
  { title: "《霓虹追击夜》首战", desc: "系统助手：首场对局目标是稳节奏、少失误。" },
  { title: "五连胜开局", desc: "系统助手：连胜考核中，保持操作稳定性。" },
  { title: "《星光101》联训赛", desc: "系统助手：联训通告接入，完成高强度输出。" },
  { title: "黑粉直播改口", desc: "系统助手：用实战表现完成舆情反转。" },
  { title: "《城市心跳》电竞夜", desc: "系统助手：跨界赛程开始，技术与舞台都要稳。" },
  { title: "天秀操作上墙", desc: "系统助手：提升关键回合击杀效率。" },
  { title: "《北风未尽》表演赛", desc: "系统助手：高压环境下保持决策准确。" },
  { title: "全网复盘夸爆", desc: "系统助手：多平台复盘窗口已开启。" },
  { title: "《夜色审判》联动", desc: "系统助手：联动资源上线，执行协同策略。" },
  { title: "总决前哨战", desc: "系统助手：校准峰值状态与心态稳定。" },
  { title: "《白昼焰火》冠军杯", desc: "系统助手：赛程锁定，控制失误并拉满输出。" },
  { title: "一穿三翻盘", desc: "系统助手：终盘局执行要更果断。" },
  { title: "《深海回声》战术秀", desc: "系统助手：提升临场判断精度。" },
  { title: "热搜第一战队脸", desc: "系统助手：提高胜场与话题同步增速。" },
  { title: "《远星》主场压轴", desc: "系统助手：主场局请稳定收束对局。" },
  { title: "解说台点名夸", desc: "系统助手：连续交付高质量操作。" },
  { title: "《流光电台》跨圈赛", desc: "系统助手：保持协同与控图效率。" },
  { title: "连斩强敌周榜", desc: "系统助手：压制波动，维持连胜曲线。" },
  { title: "《时代回声》总决夜", desc: "系统助手：执行终局级对局表现。" },
  { title: "电竞封神终局", desc: "系统助手：以冠军线稳定度完成收官。" },
  { title: "《封塔之夜》踢馆", desc: "系统助手：决胜局看你拆塔节奏，不给对面翻盘位。" },
  { title: "抢下MVP镜头", desc: "系统助手：导播重点追踪，关键团要打成名场面。" },
  { title: "《极限团战》首发", desc: "系统助手：今晚首发出战，稳住前十分钟。" },
  { title: "五杀冲上热搜", desc: "系统助手：击杀效率与存活率都要在线。" },
  { title: "《峡谷风暴》外卡", desc: "系统助手：外卡赛容错低，资源控制优先。" },
  { title: "逆风翻盘名局", desc: "系统助手：按预案拖住后期并一波终结。" },
  { title: "《冠军夜谈》连麦", desc: "系统助手：赛后复盘表达要专业有锋芒。" },
  { title: "黑粉弹幕破防", desc: "系统助手：用零失误把质疑压回去。" },
  { title: "《全域争霸》淘汰", desc: "系统助手：先手开团与收割点要精确。" },
  { title: "解说点名夸爆", desc: "系统助手：保持高频高质量决策输出。" },
  { title: "《雪线突围》八强", desc: "系统助手：控图与转线必须统一。" },
  { title: "丝血反杀封神", desc: "系统助手：残局处理优先规避贪刀。" },
  { title: "《终局回声》半决", desc: "系统助手：曝光大幅提升，执行力拉满。" },
  { title: "主场掌声停不下", desc: "系统助手：把兴奋转成有效操作。" },
  { title: "《银河杯》决胜局", desc: "系统助手：资源刷新前完成站位布控。" },
  { title: "让二追三反杀", desc: "系统助手：按分段目标逐局追回主动权。" },
  { title: "《王座争夺》总决", desc: "系统助手：团队沟通与开团信号统一。" },
  { title: "战队官宣核心位", desc: "系统助手：拿出可复现的统治表现。" },
  { title: "全网复盘第一名", desc: "系统助手：保持连续高光而非单局爆发。" },
  { title: "捧杯夜封神", desc: "系统助手：目标只有冠军级稳定度和终局执行。" },
]);

const charityCopy = buildCopyOverrides("charity", [
  { title: "《城事纪年》探访", desc: "系统助手：首轮探访已排期，请以真实表达建立信任。" },
  { title: "善意热搜反转", desc: "系统助手：用持续行动拉升公众信任。" },
  { title: "《薄荷城》图书角", desc: "系统助手：完成物资交付与公开流程闭环。" },
  { title: "夜援行动全记录", desc: "系统助手：确保流程规范与信息透明。" },
  { title: "《海螺电台》特辑", desc: "系统助手：保持叙事真实与温度。" },
  { title: "全网自发转发", desc: "系统助手：提升正向讨论与复传播率。" },
  { title: "《城市心跳》义卖夜", desc: "系统助手：同步保障秩序与募资效率。" },
  { title: "评论区破防", desc: "系统助手：稳定输出可验证信息。" },
  { title: "《远星》儿童关怀", desc: "系统助手：完成现场陪伴与后续跟踪。" },
  { title: "公益口碑暴涨", desc: "系统助手：持续执行一致性与透明度。" },
  { title: "《夜航日志》热线日", desc: "系统助手：保障响应质量与时效。" },
  { title: "质疑声当场闭麦", desc: "系统助手：以数据和结果完成回应。" },
  { title: "《潮汐序章》护河周", desc: "系统助手：完成多方协同推进。" },
  { title: "透明账本上头条", desc: "系统助手：账目完整可追溯是底线。" },
  { title: "《白噪梦境》论坛局", desc: "系统助手：输出专业且可落地观点。" },
  { title: "跨城联动爆点", desc: "系统助手：保持同频协作与节奏。" },
  { title: "《蓝焰》善意报告", desc: "系统助手：提升公信力指标。" },
  { title: "信任值拉满周", desc: "系统助手：维持高质量连续行动轨迹。" },
  { title: "《时代回声》封面", desc: "系统助手：叙事与数据双达标。" },
  { title: "年度善意封神", desc: "系统助手：以稳定影响力完成收官。" },
  { title: "《暖冬计划》探访", desc: "系统助手：现场沟通要克制，不做过度表演。" },
  { title: "一条视频破圈", desc: "系统助手：用可验证信息驱动讨论。" },
  { title: "《河岸守护》行动", desc: "系统助手：流程透明与执行效率同等重要。" },
  { title: "质疑声当场熄火", desc: "系统助手：请以回访闭环回应压力。" },
  { title: "《晨光图书角》落地", desc: "系统助手：公示节点必须准时完成。" },
  { title: "公益直播百万赞", desc: "系统助手：突出实际帮扶结果。" },
  { title: "《城市热餐》夜班", desc: "系统助手：保障秩序和分发准确率。" },
  { title: "网友自发接力", desc: "系统助手：维护长期参与意愿。" },
  { title: "《童梦工坊》陪伴日", desc: "系统助手：记录方式必须尊重隐私边界。" },
  { title: "善意榜单登顶", desc: "系统助手：维持稳定可追溯执行。" },
  { title: "《蓝海净滩》集结", desc: "系统助手：跨城联动重在协同沟通。" },
  { title: "黑评区反向致谢", desc: "系统助手：用持续行动替代一次性回应。" },
  { title: "《邻里守望》联访", desc: "系统助手：需求采集与跟进要闭环。" },
  { title: "透明账本上首页", desc: "系统助手：资金流向与执行明细需可查。" },
  { title: "《雨夜热线》值守", desc: "系统助手：响应速度与判断并重。" },
  { title: "媒体专访改口夸", desc: "系统助手：保持事实表达与边界意识。" },
  { title: "《星桥义跑》收官", desc: "系统助手：统筹与复盘资料同步完成。" },
  { title: "全城联动响应", desc: "系统助手：优先保障信息一致与节奏统一。" },
  { title: "《善意年报》发布", desc: "系统助手：数据、故事、结果三线一致。" },
  { title: "年度公益封面", desc: "系统助手：用长期影响力完成赛道收官。" },
]);

const danceCopy = buildCopyOverrides("dance", [
  { title: "《坠轨》卡点首秀", desc: "系统助手：首轮卡点输出需保持高精度。" },
  { title: "一镜舞炸全场", desc: "系统助手：保证动作完整与节奏稳定。" },
  { title: "《城市心跳》齐舞", desc: "系统助手：统一队形线条与爆发节点。" },
  { title: "黑粉看完改夸", desc: "系统助手：用成片质量完成口碑反转。" },
  { title: "《星光101》主题舞", desc: "系统助手：稳住副歌段卡点精度。" },
  { title: "压轴脚本封神", desc: "系统助手：控制体能分配与动作力度。" },
  { title: "《乐队夏天》联动", desc: "系统助手：保持协同节奏一致性。" },
  { title: "全站循环直拍", desc: "系统助手：提升完成度与复看率。" },
  { title: "《远星》高跟特训", desc: "系统助手：压缩失误并稳住重心。" },
  { title: "返场万人尖叫", desc: "系统助手：中后段持续爆发。" },
  { title: "《潮汐序章》改版", desc: "系统助手：限时完成编排重构。" },
  { title: "舞台灯一亮封神", desc: "系统助手：表情与动作同步精度拉满。" },
  { title: "《夜航日志》双人舞", desc: "系统助手：强化默契与交接点。" },
  { title: "镜面练到零误差", desc: "系统助手：连续达成高精度动作轨迹。" },
  { title: "《蓝焰》终场压轴", desc: "系统助手：执行压轴级稳定输出。" },
  { title: "全网二创爆发", desc: "系统助手：提升动作辨识度与模仿率。" },
  { title: "《时代回声》群舞夜", desc: "系统助手：保持阵型层次控制。" },
  { title: "热搜舞台第一名", desc: "系统助手：维持连续高完成度表现。" },
  { title: "《国民演唱会》主舞", desc: "系统助手：完成长段高压输出。" },
  { title: "舞台加冕终秀", desc: "系统助手：以冠军级表现完成收官。" },
  { title: "《裂空舞台》首秀", desc: "系统助手：开场八拍必须零偏差命中镜头。" },
  { title: "返场尖叫拉满", desc: "系统助手：体能分配要支撑最后爆发。" },
  { title: "《霓光狂想》齐舞", desc: "系统助手：队形线条与卡点同步稳定。" },
  { title: "一镜到底封神", desc: "系统助手：长镜头不留救场空间。" },
  { title: "《燃场计划》主舞", desc: "系统助手：强弱拍切换必须干净利落。" },
  { title: "热搜直拍破百万", desc: "系统助手：控制动作细节与表情完成度。" },
  { title: "《潮夜回响》联动", desc: "系统助手：统一风格并保留记忆点。" },
  { title: "黑粉看完闭嘴", desc: "系统助手：稳定成片质量完成逆转。" },
  { title: "《风暴返场》加演", desc: "系统助手：后半程动作不能塌架。" },
  { title: "全场跟跳挑战", desc: "系统助手：保持辨识度与传播性。" },
  { title: "《镜面失重》双人", desc: "系统助手：交接位与视线点必须精确。" },
  { title: "舞台灯一亮封王", desc: "系统助手：三秒内建立存在感。" },
  { title: "《夜航心跳》改编", desc: "系统助手：重构段落兼顾节奏与爆点。" },
  { title: "连跳三首不崩", desc: "系统助手：呼吸管理与重心控制同步执行。" },
  { title: "《终章浪潮》压轴", desc: "系统助手：尾段爆发稳住线条完整度。" },
  { title: "二创全网刷屏", desc: "系统助手：动作记忆点清晰可复刻。" },
  { title: "《国民舞夜》主场", desc: "系统助手：控场节奏优先于炫技堆叠。" },
  { title: "万人合唱返场", desc: "系统助手：把互动转化为稳定输出。" },
  { title: "《巅峰舞战》总夜", desc: "系统助手：整段完成度保持冠军线以上。" },
  { title: "封麦前终极一跳", desc: "系统助手：用最稳版本交付最终舞台。" },
]);

const COPY_OVERRIDES: Record<string, Pick<PhaseTask, "title" | "desc" | "dialogue" | "mentorName" | "targetJobId">> = {
  ...actingCopy,
  ...businessCopy,
  ...gamingCopy,
  ...charityCopy,
  ...musicCopy,
  ...danceCopy,
};

const applyTaskCopyOverrides = (task: PhaseTask): PhaseTask => {
  const override = COPY_OVERRIDES[task.id];
  const targetJobId =
    task.track === "acting"
      ? ACTING_TARGET_JOB_BY_TASK_ID[task.id]
      : task.track === "business"
        ? BUSINESS_TARGET_JOB_BY_TASK_ID[task.id]
        : task.track === "gaming"
          ? GAMING_TARGET_JOB_BY_TASK_ID[task.id]
          : task.track === "charity"
            ? CHARITY_TARGET_JOB_BY_TASK_ID[task.id]
            : task.track === "music"
              ? MUSIC_TARGET_JOB_BY_TASK_ID[task.id]
              : task.track === "dance"
                ? DANCE_TARGET_JOB_BY_TASK_ID[task.id]
        : undefined;
  if (!override && !targetJobId) return task;
  return {
    ...task,
    ...override,
    ...(targetJobId ? { targetJobId } : {}),
  };
};

export const PHASE_TASKS: PhaseTask[] = [
  ...buildTrackTasks("acting", actingSeeds),
  ...buildTrackTasks("business", businessSeeds),
  ...buildTrackTasks("gaming", gamingSeeds),
  ...buildTrackTasks("charity", charitySeeds),
  ...buildTrackTasks("music", musicSeeds),
  ...buildTrackTasks("dance", danceSeeds),
].map(applyTaskCopyOverrides);

export const TASK_MILESTONE_REWARDS: Partial<
  Record<
    TaskTrack,
    {
      requiredCount: number;
      desc: string;
      rewardItems?: string[];
      unlockJobs?: string[];
    }
  >
> = {
  acting: { requiredCount: 40, desc: "演艺赛道里程碑达成：你已进入核心主演名单。", unlockJobs: ["movie_lead", "daming_fengyun"] },
  business: { requiredCount: 40, desc: "商业赛道里程碑达成：品牌方将你纳入长期合作名单。", rewardItems: ["moon_tassel_earring"] },
  gaming: { requiredCount: 40, desc: "电竞赛道里程碑达成：你已成为联赛门面。", unlockJobs: ["esports_showmatch"] },
  charity: { requiredCount: 40, desc: "公益赛道里程碑达成：公众信任显著提升。", rewardItems: ["charity_badge"] },
  music: { requiredCount: 40, desc: "音乐赛道里程碑达成：你的声音成为榜单常客。", unlockJobs: ["music_festival_headliner"] },
  dance: { requiredCount: 40, desc: "舞台赛道里程碑达成：你已具备压轴主舞实力。", unlockJobs: ["dance_showcase_finale"] },
};
