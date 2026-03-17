import React, { Suspense, lazy, useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { 
  Home, Building2, Map, Briefcase, User, Star, Heart, 
  Music, Video, Sparkles, Coins, Battery, Calendar, Smile, 
  ChevronRight, ChevronDown, Activity, Trophy, ListTodo, Shirt, Camera,
  Menu, X, ClipboardList, CheckCircle2, Loader2, Smartphone, Send, ThumbsUp, MessageCircle, Trash2, MessageSquare,
  
} from 'lucide-react';
import { 
  Stats, Player, GameTime, LocationId, Action, Job, 
  LOCATIONS, ACTIONS, JOBS, getStatName, getPlayerLevel,
  NPCS, STORY_EVENTS, RANDOM_EVENTS, StoryChoice, RandomEvent, StoryEvent,
  Achievement, ACHIEVEMENTS, Clothing, CLOTHING_ITEMS,
  DEADLINES, ENDINGS, Deadline, Ending,
  FACILITIES, FacilityId, PHASE_TASKS, LOCATION_BUFF_LIBRARY, getOutfitStyleBonus,
  BACKGROUNDS, STARTING_BONUSES, COMPANIES, Background, StartingBonus, Company, SocialPost, SOCIAL_USERS, MOCK_POSTS, SocialUser, Message, IndustryEvent,
  CHARACTER_PROFILES, CHARACTER_PROFILE_IMAGES, ENCOUNTER_CONFIG, SPECIAL_EVENT_CONFIG
} from './gameData';
import { type CharacterId, CHARACTER_NAMES, useGameStore } from './store/useGameStore';
import { getStoryById } from './stories';
import { buildDailyChatStory } from './stories/dailyChats';
import { TASK_MILESTONE_REWARDS } from './data/tasks';
import { STAFF_POOL } from './data/staffData';

type SafeImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
};

let geminiModulePromise: Promise<typeof import('./services/gemini')> | null = null;
const loadGeminiModule = () => (geminiModulePromise ??= import('./services/gemini'));
const CharacterCard = lazy(() => import('./components/CharacterCard'));
const TaskScreen = lazy(() => import('./components/TaskScreen'));
const EncounterModal = lazy(() => import('./components/EncounterModal'));
const Agency = lazy(() => import('./components/Agency'));

const resolveCharacterImage = (id?: CharacterId | null) => {
  if (!id) return '';
  return CHARACTER_PROFILE_IMAGES[id] || CHARACTER_PROFILES[id]?.image || '';
};

const SafeImage = ({ src, alt, className = '', fallbackClassName = '', iconClassName = 'h-5 w-5 text-zinc-400' }: SafeImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-zinc-100 ${fallbackClassName}`}>
        <User className={iconClassName} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" decoding="async" />;
};

type GameState = {
  time: GameTime;
  player: Player;
  logs: { id: number; text: string; type: 'info' | 'success' | 'error' | 'warning' | 'taunt' }[];
  currentLocation: LocationId;
  completedEvents: string[];
  completedAchievements: string[];
  activeEvent: { id: string; lineIndex: number; isRandom?: boolean; isDeadline?: boolean; isEnding?: boolean } | null;
  industryEvent: IndustryEvent | null;
  plannedTasks: (Action | Job)[];
  homeFlags: {
    spaGlowReady: boolean;
    lastFanLetterStamp: number | null;
    linyuEncounterTriggered: boolean;
  };
  dynamicNPCs: SocialUser[];
  trendingTopics: { topic: string; heat: number }[];
  industryPulse: {
    lastTriggeredStamp: number | null;
    recentEventIds: string[];
    recentThemes: string[];
  };
  isGameOver?: boolean;
};

let logIdCounter = 0;

const TAUNT_MESSAGES = {
  money: [
    "没钱了？要不把你的限量版手办卖了换馒头？",
    "钱包比你的脸还干净，这星途怕是要凉。",
    "连路费都凑不齐，还想当顶流？做梦呢。",
    "穷成这样，经纪人都想连夜扛火车跑路。",
    "再不赚钱，明天就只能去天桥底下贴膜了。"
  ],
  stamina: [
    "这就累了？广场舞大妈都比你有活力。",
    "身体被掏空，还想在娱乐圈混？",
    "弱不禁风的样子，演林黛玉都不用化妆。",
    "躺平吧，反正也没人期待你的作品。",
    "年轻人身体这么虚，以后怎么熬夜拍戏？"
  ],
  stats: [
    "就这水平？海选第一轮就被刷下来的料。",
    "你的才艺是用来搞笑的吗？",
    "属性差成这样，修图师都救不了你。",
    "导演看了一眼你的简历，把它扔进了碎纸机。",
    "这点实力也想红？回家养猪吧，猪都比你努力。"
  ]
};

const getRandomTaunt = (type: 'money' | 'stamina' | 'stats') => {
  const list = TAUNT_MESSAGES[type];
  return list[Math.floor(Math.random() * list.length)];
};

const LOGIN_CHARACTER_STRIPS = Object.entries(
  import.meta.glob('./assets/characters/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>
)
  .map(([path, src]) => {
    const filename = path.split('/').pop() || 'character';
    const id = filename.replace(/\.[^/.]+$/, '');
    return { id, name: id, src };
  })
  .filter(({ id }) =>
    [
      'liu_mengyao',
      'gu_chengyan',
      'shen_mo',
      'lin_yu',
      'lu_xingran',
      'zhou_yan',
      'su_tangtang',
    ].includes(id)
  )
  .sort((a, b) => a.id.localeCompare(b.id));

const LOGIN_PRIORITY_IDS = new Set(['liu_mengyao', 'lu_xingran']);
const LOGIN_PRELOAD_IMAGE_URLS = [
  new URL('./assets/characters/liu_mengyao.png', import.meta.url).href,
  new URL('./assets/characters/lu_xingran.png', import.meta.url).href,
];
const LOGIN_STRIP_IMAGE_WIDTH = 1080;
const LOGIN_STRIP_IMAGE_HEIGHT = 1920;

const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const LEGACY_WEEKS_PER_MONTH = 4;
const DAYS_PER_LEGACY_WEEK = Math.ceil(DAYS_PER_MONTH / LEGACY_WEEKS_PER_MONTH);
const JOB_STORY_MODAL_CHANCE = 0.25;
const READ_STORY_MODAL_CHANCE = 0.2;
const HONOR_KEYWORDS = ['奖', '封后', '冠军', '代言人'];
const BOSS_MODE_STARTUP_COST = 200000;
const MOOD_MIN = 0;
const MOOD_MAX = 100;

const getSafeMood = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 80;
};

const clampMood = (value: number): number => Math.max(MOOD_MIN, Math.min(MOOD_MAX, value));

const applyMoodDelta = (current: unknown, delta: number): number =>
  clampMood(getSafeMood(current) + delta);

const getSafeStamp = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getMoodCostByStamina = (staminaCost: number): number => {
  if (staminaCost >= 70) return 12;
  if (staminaCost >= 50) return 10;
  if (staminaCost >= 30) return 8;
  if (staminaCost >= 15) return 6;
  if (staminaCost > 0) return 4;
  return 0;
};

const getLegacyWeekFromDay = (day: number): number =>
  Math.min(LEGACY_WEEKS_PER_MONTH, Math.max(1, Math.ceil(day / DAYS_PER_LEGACY_WEEK)));

const shouldRecordTaskHonor = (taskTitle: string, hitMilestone: boolean): boolean =>
  hitMilestone || HONOR_KEYWORDS.some((kw) => taskTitle.includes(kw));

const toTimeStamp = (time: GameTime): number =>
  time.year * MONTHS_PER_YEAR * DAYS_PER_MONTH + time.month * DAYS_PER_MONTH + time.week;

type PhaseTaskRuntimeStatus = 'locked' | 'active' | 'completed';

const getPhaseTaskRuntimeStatus = (
  player: Player,
  _time: GameTime,
  task: (typeof PHASE_TASKS)[number],
): PhaseTaskRuntimeStatus => {
  if (player.submittedPhaseTasks.includes(task.id)) return 'completed';
  const unlocked = !task.preTaskId || player.submittedPhaseTasks.includes(task.preTaskId);
  if (!unlocked) return 'locked';
  if (task.targetJobId && !(player.acceptedJobIds ?? []).includes(task.targetJobId)) return 'locked';
  return 'active';
};

const getDisplayWeekDay = (dayInMonth: number): { week: number; day: number } => {
  const safeDay = Math.max(1, dayInMonth);
  return {
    week: Math.ceil(safeDay / 7),
    day: ((safeDay - 1) % 7) + 1,
  };
};

const formatDisplayTime = (time: GameTime): string => {
  const wd = getDisplayWeekDay(time.week);
  return `第 ${time.year} 年 ${time.month} 月 第 ${wd.week} 周 第 ${wd.day} 天`;
};

const STAGE_LABELS: Record<string, string> = {
  guarded: '警戒',
  warming: '暖昧',
  dependent: '依赖',
  obsessive: '偏执',
  fractured: '破裂',
};

const CHARACTER_SECTIONS: { title: string; ids: CharacterId[] }[] = [
  { title: '娱乐圈内', ids: ['shen_mo', 'lu_xingran', 'liu_mengyao', 'su_tangtang'] },
  { title: '娱乐圈外', ids: ['gu_chengyan', 'lin_yu', 'zhou_yan'] },
  { title: '支线', ids: ['jiang_muci', 'ji_mingxuan'] },
];

const JOB_TRACK_TABS: Array<{ id: 'all' | 'acting' | 'music' | 'gaming' | 'business'; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'acting', label: '影视' },
  { id: 'music', label: '音乐' },
  { id: 'gaming', label: '电竞' },
  { id: 'business', label: '商业' },
];
const CITY_FILTER_TABS: Array<'全部' | '基础外出' | '环境加成' | '剧情地点'> = ['全部', '基础外出', '环境加成', '剧情地点'];
const WARDROBE_OWNERSHIP_TABS: Array<'全部' | '已拥有' | '未拥有' | '已穿戴'> = ['全部', '已拥有', '未拥有', '已穿戴'];
const RATING_ORDER = ['F', 'C', 'B', 'A', 'S'] as const;
const shiftRating = (rating: string, delta: number): string => {
  const idx = RATING_ORDER.indexOf((rating || 'C') as any);
  const safeIdx = idx < 0 ? 1 : idx;
  const target = Math.max(0, Math.min(RATING_ORDER.length - 1, safeIdx + delta));
  return RATING_ORDER[target];
};

type BackgroundMode = 'default' | 'color' | 'image';
type BackgroundCustomizer = {
  mode: BackgroundMode;
  palette: string[];
  imageUrl: string;
};

const BACKGROUND_PREFS_KEY = 'stardream:bg-customizer:v1';
const DEFAULT_BACKGROUND_CUSTOMIZER: BackgroundCustomizer = {
  mode: 'default',
  palette: ['#f4d2a8', '#f0b8a9', '#f2a68f'],
  imageUrl: '',
};

const isHexColor = (value: string): boolean => /^#[0-9a-fA-F]{6}$/.test((value || '').trim());

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const normalized = (hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const normalizePalette = (value: unknown): string[] => {
  const defaults = DEFAULT_BACKGROUND_CUSTOMIZER.palette;
  if (!Array.isArray(value)) return defaults;
  const valid = value
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => isHexColor(x))
    .slice(0, 3);
  if (valid.length >= 3) return valid;
  return [...valid, ...defaults.slice(valid.length)];
};

const buildDiffuseGradient = (colors: string[]): string => {
  const [c1, c2, c3] = normalizePalette(colors);
  const rgb1 = hexToRgb(c1) ?? { r: 196, g: 75, b: 46 };
  const rgb2 = hexToRgb(c2) ?? { r: 179, g: 63, b: 44 };
  const rgb3 = hexToRgb(c3) ?? { r: 205, g: 107, b: 30 };
  const luminance = (rgb: { r: number; g: number; b: number }) => 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  const saturation = (rgb: { r: number; g: number; b: number }) => {
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    return max === 0 ? 0 : (max - min) / max;
  };
  const avgLum = (luminance(rgb1) + luminance(rgb2) + luminance(rgb3)) / 3;
  const avgSat = (saturation(rgb1) + saturation(rgb2) + saturation(rgb3)) / 3;
  const hasVeryBright = [rgb1, rgb2, rgb3].some((c) => luminance(c) > 205);
  const isLightPalette = avgLum >= 145 || (avgLum >= 128 && hasVeryBright && avgSat > 0.45);

  if (isLightPalette) {
    const blendWithWhite = (v: number, t: number) => Math.round(v * (1 - t) + 255 * t);
    const light1 = `${blendWithWhite(rgb1.r, 0.22)}, ${blendWithWhite(rgb1.g, 0.22)}, ${blendWithWhite(rgb1.b, 0.22)}`;
    const light2 = `${blendWithWhite(rgb2.r, 0.2)}, ${blendWithWhite(rgb2.g, 0.2)}, ${blendWithWhite(rgb2.b, 0.2)}`;
    const light3 = `${blendWithWhite(rgb3.r, 0.18)}, ${blendWithWhite(rgb3.g, 0.18)}, ${blendWithWhite(rgb3.b, 0.18)}`;
    return [
      `radial-gradient(980px 560px at 50% -10%, rgba(${rgb3.r}, ${rgb3.g}, ${rgb3.b}, 0.26), transparent 72%)`,
      `radial-gradient(860px 520px at 12% 14%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.24), transparent 76%)`,
      `radial-gradient(820px 500px at 88% 12%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.22), transparent 78%)`,
      `radial-gradient(980px 760px at 84% 82%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.2), transparent 74%)`,
      `radial-gradient(900px 700px at 18% 82%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.16), transparent 78%)`,
      `radial-gradient(760px 620px at 82% 76%, rgba(${rgb3.r}, ${rgb3.g}, ${rgb3.b}, 0.24), transparent 74%)`,
      `linear-gradient(160deg, rgb(${light1}) 0%, rgb(${light2}) 42%, rgb(${light3}) 100%)`,
    ].join(', ');
  }

  const base1 = `${Math.max(10, Math.round(rgb1.r * 0.2))}, ${Math.max(8, Math.round(rgb1.g * 0.16))}, ${Math.max(8, Math.round(rgb1.b * 0.16))}`;
  const base2 = `${Math.max(12, Math.round(rgb2.r * 0.24))}, ${Math.max(10, Math.round(rgb2.g * 0.18))}, ${Math.max(10, Math.round(rgb2.b * 0.18))}`;
  const base3 = `${Math.max(14, Math.round(rgb3.r * 0.28))}, ${Math.max(12, Math.round(rgb3.g * 0.22))}, ${Math.max(12, Math.round(rgb3.b * 0.2))}`;
  return [
    `radial-gradient(980px 560px at 50% -10%, rgba(${rgb3.r}, ${rgb3.g}, ${rgb3.b}, 0.34), transparent 72%)`,
    `radial-gradient(860px 520px at 12% 14%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.28), transparent 76%)`,
    `radial-gradient(820px 500px at 88% 12%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.24), transparent 78%)`,
    `radial-gradient(980px 760px at 84% 82%, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.2), transparent 74%)`,
    `radial-gradient(900px 700px at 18% 82%, rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.18), transparent 78%)`,
    `linear-gradient(160deg, rgb(${base1}) 0%, rgb(${base2}) 42%, rgb(${base3}) 100%)`,
  ].join(', ');
};

const normalizeBackgroundConfig = (raw: unknown): BackgroundCustomizer => {
  if (!raw || typeof raw !== 'object') return DEFAULT_BACKGROUND_CUSTOMIZER;
  const candidate = raw as Partial<BackgroundCustomizer> & { baseColor?: string };
  const mode = candidate.mode === 'color' || candidate.mode === 'image' ? candidate.mode : 'default';
  const palette = normalizePalette(candidate.palette);
  if ((!candidate.palette || !Array.isArray(candidate.palette)) && typeof candidate.baseColor === 'string' && isHexColor(candidate.baseColor)) {
    palette[0] = candidate.baseColor;
  }
  const imageUrl = typeof candidate.imageUrl === 'string' ? candidate.imageUrl.trim() : '';
  return { mode, palette, imageUrl };
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [playerPortrait, setPlayerPortrait] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(BACKGROUNDS[4].id); // Default to ordinary student
  const [selectedBonus, setSelectedBonus] = useState<string>(STARTING_BONUSES[0].id);
  const [selectedCompany, setSelectedCompany] = useState<string>(COMPANIES[0].id);
  const [isBgFocused, setIsBgFocused] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [storyModal, setStoryModal] = useState<{ isOpen: boolean; title: string; content: string; isLoading: boolean }>({
    isOpen: false,
    title: '',
    content: '',
    isLoading: false
  });
  const [jobResultModal, setJobResultModal] = useState<{ isOpen: boolean; jobName: string; evaluation: string; rating: string; rewards: any } | null>(null);
  const [socialTab, setSocialTab] = useState<'feed' | 'explore' | 'me' | 'messages'>('feed');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId | null>(null);
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundCustomizer>(DEFAULT_BACKGROUND_CUSTOMIZER);
  const [shouldLoadFullLoginGallery, setShouldLoadFullLoginGallery] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [avatarPickerMode, setAvatarPickerMode] = useState<'menu' | 'upload' | 'preset'>('menu');
  const [activeJobTab, setActiveJobTab] = useState<'all' | 'acting' | 'music' | 'gaming' | 'business'>('all');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<'全部' | '基础外出' | '环境加成' | '剧情地点'>('全部');
  const [wardrobeOwnershipFilter, setWardrobeOwnershipFilter] = useState<'全部' | '已拥有' | '未拥有' | '已穿戴'>('全部');
  const [wardrobeStyleFilter, setWardrobeStyleFilter] = useState<string>('全部');
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropImageLabel, setCropImageLabel] = useState('自定义人设');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropSaving, setIsCropSaving] = useState(false);
  const [expandedBuffId, setExpandedBuffId] = useState<string | null>(null);
  const [pendingDailyChatCharacterId, setPendingDailyChatCharacterId] = useState<CharacterId | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<CharacterId | null>(null);
  const [contactInput, setContactInput] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactChats, setContactChats] = useState<Partial<Record<CharacterId, Array<{ sender: 'player' | 'character'; text: string }>>>>({});
  const [isArrangeModalOpen, setIsArrangeModalOpen] = useState(false);
  const [isMobileLandscapeViewport, setIsMobileLandscapeViewport] = useState(false);
  const isPostingRef = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsBgFocused(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateViewportMode = () => {
      if (typeof window === 'undefined') return;
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      const isTouchDevice =
        window.matchMedia?.('(pointer: coarse)').matches ||
        navigator.maxTouchPoints > 0;
      setIsMobileLandscapeViewport(isTouchDevice && width > height);
    };

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    window.addEventListener('orientationchange', updateViewportMode);
    window.visualViewport?.addEventListener('resize', updateViewportMode);

    return () => {
      window.removeEventListener('resize', updateViewportMode);
      window.removeEventListener('orientationchange', updateViewportMode);
      window.visualViewport?.removeEventListener('resize', updateViewportMode);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BACKGROUND_PREFS_KEY);
      if (!saved) return;
      setBackgroundConfig(normalizeBackgroundConfig(JSON.parse(saved)));
    } catch {
      // ignore invalid persisted background settings
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(BACKGROUND_PREFS_KEY, JSON.stringify(backgroundConfig));
    } catch {
      // ignore write failures
    }
  }, [backgroundConfig]);

  const paletteColors = useMemo(() => normalizePalette((backgroundConfig as Partial<BackgroundCustomizer>).palette), [backgroundConfig]);

  const mainBackgroundStyle = useMemo<React.CSSProperties>(() => {
    if (backgroundConfig.mode === 'color') {
      return { background: buildDiffuseGradient(paletteColors) };
    }
    if (backgroundConfig.mode === 'image' && backgroundConfig.imageUrl.trim()) {
      const safeUrl = backgroundConfig.imageUrl.trim().replace(/'/g, '%27');
      return {
        backgroundImage: `linear-gradient(145deg, rgba(12, 8, 8, 0.58) 0%, rgba(24, 10, 8, 0.4) 100%), url('${safeUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  }, [backgroundConfig, paletteColors]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const links = LOGIN_PRELOAD_IMAGE_URLS.map((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => {
      links.forEach((link) => link.remove());
    };
  }, []);

  useEffect(() => {
    if (gameState || isCreating) {
      setShouldLoadFullLoginGallery(true);
      return;
    }
    if (typeof window === 'undefined') return;

    let active = true;
    const revealGallery = () => {
      if (active) setShouldLoadFullLoginGallery(true);
    };
    const onUserIntent = () => revealGallery();
    const hasRIC = 'requestIdleCallback' in window;
    const idleId = hasRIC
      ? window.requestIdleCallback(revealGallery, { timeout: 1500 })
      : window.setTimeout(revealGallery, 900);

    window.addEventListener('pointerdown', onUserIntent, { once: true, passive: true });
    window.addEventListener('keydown', onUserIntent, { once: true });

    return () => {
      active = false;
      if (hasRIC) {
        window.cancelIdleCallback(idleId as number);
      } else {
        window.clearTimeout(idleId as number);
      }
      window.removeEventListener('pointerdown', onUserIntent);
      window.removeEventListener('keydown', onUserIntent);
    };
  }, [gameState, isCreating]);

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const characters = useGameStore((state) => state.characters);
  const characterUnlocks = useGameStore((state) => state.characterUnlocks);
  const characterStatuses = useGameStore((state) => state.characterStatuses);
  const hasChattedThisWeek = useGameStore((state) => state.hasChattedThisWeek);
  const activeStory = useGameStore((state) => state.activeStory);
  const currentJobId = useGameStore((state) => state.player.currentJobId);
  const companyState = useGameStore((state) => state.companyState);
  const acceptJob = useGameStore((state) => state.acceptJob);
  const clearCurrentJob = useGameStore((state) => state.clearCurrentJob);
  const updateCompanyState = useGameStore((state) => state.updateCompanyState);
  const playerProfile = useGameStore((state) => state.playerProfile);
  const updatePlayerProfile = useGameStore((state) => state.updatePlayerProfile);
  const syncEncounterContext = useGameStore((state) => state.syncEncounterContext);
  const checkDailyEncounters = useGameStore((state) => state.checkDailyEncounters);
  const setActiveStory = useGameStore((state) => state.setActiveStory);
  const unlockCharacter = useGameStore((state) => state.unlockCharacter);
  const markCharacterEventCompleted = useGameStore((state) => state.markCharacterEventCompleted);
  const markChattedThisWeek = useGameStore((state) => state.markChattedThisWeek);
  const resetWeeklyChatFlags = useGameStore((state) => state.resetWeeklyChatFlags);
  const updateCharacter = useGameStore((state) => state.updateCharacter);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedTimeRef = useRef<string>('');
  const rensheLibrary = useMemo(
    () =>
      Object.entries(
        import.meta.glob('./assets/rensheku/*.{png,jpg,jpeg,webp}', {
          eager: true,
          import: 'default',
        }),
      ).map(([path, src], idx) => ({
        id: `renshe_${idx + 1}`,
        label: `预设人设 ${idx + 1}`,
        src: src as string,
        path,
      })),
    [],
  );

  const readImageFile = (file: File, onDone: (value: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => onDone(reader.result as string);
    reader.readAsDataURL(file);
  };

  const cropAvatarFromPortrait = (portrait: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = Math.max(0, Math.floor((img.width - size) / 2));
        const sy = Math.max(0, Math.floor((img.height - size) / 2));
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(portrait);
          return;
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(portrait);
      img.src = portrait;
    });

  const getCroppedAvatarFromArea = (src: string, area: Area): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });

  const applyPortraitSelection = async (portrait: string, label = '自定义人设', avatarOverride?: string) => {
    const avatar = avatarOverride || (await cropAvatarFromPortrait(portrait));
    setPlayerPortrait(portrait);
    setPlayerAvatar(avatar);
    updatePlayerProfile({ portrait, avatar, label });
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            player: {
              ...prev.player,
              avatar,
            },
          }
        : prev,
    );
  };

  const openAvatarPicker = () => {
    setAvatarPickerMode('menu');
    setIsAvatarPickerOpen(true);
  };

  const closeCropModal = () => {
    setIsCropModalOpen(false);
    setCropImageSrc('');
    setCropImageLabel('自定义人设');
    setCrop({ x: 0, y: 0 });
    setCropZoom(1);
    setCroppedAreaPixels(null);
    setIsCropSaving(false);
  };

  const handleStartDailyChat = (characterId: CharacterId) => {
    if (!gameState) return;
    if (!characterUnlocks[characterId]) return;
    if (hasChattedThisWeek[characterId]) return;
    if (gameState.player.stamina < 10) {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              logs: [...prev.logs, { id: logIdCounter++, text: '体力不足，无法闲聊。', type: 'error' }].slice(-50),
            }
          : prev,
      );
      return;
    }

    const story = buildDailyChatStory(characterId);
    setPendingDailyChatCharacterId(characterId);
    setActiveStory(story, 'encounter');
  };

  const handleEncounterModalClose = (
    storyId?: string,
    payload?: { favorDelta?: number; favorTargetId?: CharacterId; dailyChatFavorDelta?: number },
  ) => {
    if (storyId === 'liumengyao_encounter') {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              logs: [
                ...prev.logs,
                {
                  id: logIdCounter++,
                  text: '成功签约星耀娱乐，柳梦瑶成为了你的专属经纪人。',
                  type: 'success',
                },
              ].slice(-50),
            }
          : prev,
      );
    }
    if (!pendingDailyChatCharacterId) {
      const delta = payload?.favorDelta ?? 0;
      const targetId = payload?.favorTargetId;
      if (delta !== 0 && targetId) {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                logs: [
                  ...prev.logs,
                  {
                    id: logIdCounter++,
                    text: `${CHARACTER_NAMES[targetId]} 好感 ${delta >= 0 ? "+" : ""}${delta}`,
                    type: delta > 0 ? "success" : "warning",
                  },
                ].slice(-50),
              }
            : prev,
        );
      }
      return;
    }
    if (!gameState) {
      setPendingDailyChatCharacterId(null);
      return;
    }
    setGameState((prev) => {
      if (!prev) return prev;
      const characterName = CHARACTER_NAMES[pendingDailyChatCharacterId];
      const delta = payload?.dailyChatFavorDelta ?? 0;
      const deltaText = `${delta >= 0 ? '+' : ''}${delta}`;
      return {
        ...prev,
        player: {
          ...prev.player,
          stamina: Math.max(0, prev.player.stamina - 10),
        },
        logs: [
          ...prev.logs,
          { id: logIdCounter++, text: '体力 -10', type: 'error' },
          { id: logIdCounter++, text: `${characterName}本周闲聊完成（好感 ${deltaText}）`, type: 'success' },
        ].slice(-50),
      };
    });
    markChattedThisWeek(pendingDailyChatCharacterId);
    setPendingDailyChatCharacterId(null);
  };

  const handleSendContactMessage = async () => {
    if (!gameState || !selectedContactId || contactSending) return;
    console.info('[AI:character_chat] 点击角色闲聊发送按钮', { selectedContactId });
    const message = contactInput.trim();
    if (!message) return;
    if (hasChattedThisWeek[selectedContactId]) return;
    if (gameState.player.stamina < 10) {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              logs: [...prev.logs, { id: logIdCounter++, text: '体力不足，无法发起聊天。', type: 'error' }].slice(-50),
            }
          : prev,
      );
      return;
    }

    const profile = CHARACTER_PROFILES[selectedContactId];
    const history = contactChats[selectedContactId] ?? [];
    setContactChats((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] ?? []), { sender: 'player', text: message }],
    }));
    setContactInput('');
    setContactSending(true);
    setContactError(null);

    try {
      const { generateCharacterChatReply } = await loadGeminiModule();
      const result = await generateCharacterChatReply({
        characterName: CHARACTER_NAMES[selectedContactId],
        bio: profile?.bio ?? '',
        surface: profile?.surface ?? '',
        reversal: profile?.reversal ?? '',
        tags: profile?.tags ?? [],
        coreQuotes: profile?.coreQuotes ?? [],
        favor: characters[selectedContactId]?.favor ?? 0,
        relationStage:
          (characters[selectedContactId]?.stage === 'guarded' || characters[selectedContactId]?.stage === 'fractured')
            ? '陌生'
            : characters[selectedContactId]?.stage === 'warming'
              ? '熟悉'
              : characters[selectedContactId]?.stage === 'dependent'
                ? '暧昧'
                : '心动',
        psychStage: characters[selectedContactId]?.stage ?? 'guarded',
        sceneContext: '手机/联系人角色闲聊',
        userInput: message,
        history: [...history, { sender: 'player', text: message }].map((x) => ({
          role: x.sender === 'player' ? 'player' : 'character',
          text: x.text,
        })),
      });

      console.info('[AI:character_chat] 角色闲聊调用完成', result.debug);

      if (!result.ok) {
        setContactError(result.error || '角色闲聊请求失败');
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                logs: [
                  ...prev.logs,
                  { id: logIdCounter++, text: `角色闲聊失败：${result.error || '未知错误'}`, type: 'warning' },
                ].slice(-50),
              }
            : prev,
        );
        return;
      }

      setContactChats((prev) => ({
        ...prev,
        [selectedContactId]: [...(prev[selectedContactId] ?? []), { sender: 'character', text: result.reply }],
      }));
      markChattedThisWeek(selectedContactId);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              player: {
                ...prev.player,
                stamina: Math.max(0, prev.player.stamina - 10),
              },
              logs: [...prev.logs, { id: logIdCounter++, text: '体力 -10', type: 'error' }].slice(-50),
            }
          : prev,
      );
    } finally {
      setContactSending(false);
    }
  };

  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;
    
    const timeKey = `${gameState.time.year}-${gameState.time.month}-${gameState.time.week}`;
    if (lastProcessedTimeRef.current === timeKey) return;
    lastProcessedTimeRef.current = timeKey;

    const runWorldUpdate = async () => {
      // 1. Chance to generate new NPC if count is low
      if (gameState.dynamicNPCs.length < 8 && Math.random() < 0.4) {
        const { generateNPC } = await loadGeminiModule();
        const newNPCData = await generateNPC();
        const newNPC: SocialUser = {
          id: `npc_${Date.now()}`,
          name: newNPCData.name,
          avatar: newNPCData.avatar,
          title: newNPCData.title,
          isVerified: Math.random() < 0.3,
          followers: Math.floor(Math.random() * 100000),
          personality: newNPCData.personality
        };
        
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            dynamicNPCs: [...prev.dynamicNPCs, newNPC],
            logs: [...prev.logs, { id: logIdCounter++, text: `?? 娱乐圈新面孔：【${newNPC.name}】（${newNPC.title}）加入了社交网络。`, type: 'info' }].slice(-50)
          };
        });
      }

      // 2. Chance for existing NPCs to post
      const allNPCs = [...SOCIAL_USERS, ...gameState.dynamicNPCs];
      const postingNPC = allNPCs[Math.floor(Math.random() * allNPCs.length)];
      
      if (Math.random() < 0.5) {
        const wd = getDisplayWeekDay(gameState.time.week);
        const gameContext = `当前时间：第${gameState.time.year}年${gameState.time.month}月第${wd.week}周第${wd.day}天。主角${gameState.player.name}正在娱乐圈闯荡。`;
        const { generateNPCPost } = await loadGeminiModule();
        const content = await generateNPCPost({
          name: postingNPC.name,
          title: postingNPC.title,
          personality: postingNPC.personality || "普通"
        }, gameContext);

        const newPost: SocialPost & { initialCommentCount?: number } = {
          id: `npc_post_${Date.now()}`,
          authorId: postingNPC.id,
          content: content,
          likes: Math.floor(Math.random() * 5000),
          comments: [],
          timestamp: { ...gameState.time },
          type: 'text',
          initialCommentCount: 0
        };

        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            player: {
              ...prev.player,
              social: {
                ...prev.player.social,
                posts: [newPost, ...prev.player.social.posts]
              }
            }
          };
        });
      }
    };

    runWorldUpdate();
  }, [gameState?.time]);

  useEffect(() => {
    if (currentJobId) {
      checkDailyEncounters();
    }
  }, [currentJobId, checkDailyEncounters]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.logs]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.player.social.conversations, socialTab, selectedConversationId]);

  const checkAchievements = (state: GameState): GameState => {
    let newState = { ...state };
    let newPlayer = { ...newState.player, stats: { ...newState.player.stats } };
    let newLogs = [...newState.logs];
    let newCompletedAchievements = [...newState.completedAchievements];
    let hasNewAchievement = false;

    for (const achievement of ACHIEVEMENTS) {
      if (!newCompletedAchievements.includes(achievement.id) && achievement.condition(newPlayer, newState.completedEvents)) {
        hasNewAchievement = true;
        newCompletedAchievements.push(achievement.id);
        newLogs.push({ id: logIdCounter++, text: `?? 获得成就：【${achievement.name}】！${achievement.desc}`, type: 'success' });
        newPlayer = applyEffect(newPlayer, achievement.reward, newLogs, `成就奖励`);
      }
    }

    if (hasNewAchievement) {
      newState.player = newPlayer;
      newState.logs = newLogs.slice(-50);
      newState.completedAchievements = newCompletedAchievements;
    }

    return newState;
  };

  const checkEvents = (state: GameState): GameState => {
    if (state.activeEvent) return state;

    // 1. Check for Endings (End of Year 3)
    if (state.time.year >= 3 && state.time.month >= 12 && state.time.week >= DAYS_PER_MONTH) {
      const ending = ENDINGS.find(e => e.condition(state.player, state.completedAchievements)) || ENDINGS[ENDINGS.length - 1];
      return {
        ...state,
        activeEvent: { id: ending.id, lineIndex: 0, isEnding: true }
      };
    }

    // 2. Check for Deadlines
    const legacyWeek = getLegacyWeekFromDay(state.time.week);
    const deadline = DEADLINES.find(
      (d) => d.year === state.time.year && d.month === state.time.month && d.week === legacyWeek,
    );
    if (deadline && !state.completedEvents.includes(`deadline_${deadline.year}`)) {
      if (!deadline.condition(state.player, state.completedAchievements)) {
        return {
          ...state,
          activeEvent: { id: `deadline_${deadline.year}_fail`, lineIndex: 0, isDeadline: true }
        };
      } else {
        // Passed deadline
        return checkAchievements({
          ...state,
          completedEvents: [...state.completedEvents, `deadline_${deadline.year}`],
          logs: [...state.logs, { id: logIdCounter++, text: `? 通过了年度考核：${deadline.title}！`, type: 'success' as const }].slice(-50)
        });
      }
    }

    // 3. Check for Story Events
    for (const event of STORY_EVENTS) {
      if (event.id === 'intro') continue;
      const legacyTime: GameTime = {
        ...state.time,
        week: legacyWeek,
      };
      if (event.isTriggered(legacyTime, state.player, state.completedEvents)) {
        return {
          ...state,
          activeEvent: { id: event.id, lineIndex: 0 }
        };
      }
    }
    return checkQuests(checkAchievements(state));
  };

  const checkQuests = (state: GameState): GameState => {
    // 旧任务系统已废弃，改由“柳梦瑶阶段性考核”界面手动提交
    return state;
  };

  const advanceTime = (state: GameState, days: number, encounterLocationOverride?: string): GameState => {
    const prevLegacyWeek = getLegacyWeekFromDay(state.time.week);
    const prevMonth = state.time.month;
    const prevYear = state.time.year;
    let newWeek = state.time.week + days;
    let newMonth = state.time.month;
    let newYear = state.time.year;

    while (newWeek > DAYS_PER_MONTH) {
      newWeek -= DAYS_PER_MONTH;
      newMonth += 1;
    }
    while (newMonth > MONTHS_PER_YEAR) {
      newMonth -= MONTHS_PER_YEAR;
      newYear += 1;
    }
    const nextLegacyWeek = getLegacyWeekFromDay(newWeek);
    if (newYear !== prevYear || newMonth !== prevMonth || nextLegacyWeek !== prevLegacyWeek) {
      resetWeeklyChatFlags();
    }

    let newStamina = state.player.stamina;
    if (state.player.companyId === 'star_shine') {
      const dailyRecover = Math.ceil((5 * days) / 7);
      newStamina = Math.min(state.player.maxStamina, newStamina + dailyRecover);
    }

    const nextState = checkEvents({
      ...state,
      player: { ...state.player, stamina: newStamina },
      time: { year: newYear, month: newMonth, week: newWeek }
    });
    const currentLocationName =
      encounterLocationOverride ??
      LOCATIONS.find((loc) => loc.id === nextState.currentLocation)?.name ??
      nextState.currentLocation;
    syncEncounterContext({
      year: nextState.time.year,
      month: nextState.time.month,
      week: nextState.time.week,
      location: currentLocationName,
    });
    checkDailyEncounters();
    return nextState;
  };

  const advanceClock = (time: GameTime, days: number): GameTime => {
    let week = time.week + days;
    let month = time.month;
    let year = time.year;

    while (week > DAYS_PER_MONTH) {
      week -= DAYS_PER_MONTH;
      month += 1;
    }
    while (month > MONTHS_PER_YEAR) {
      month -= MONTHS_PER_YEAR;
      year += 1;
    }

    return { year, month, week };
  };

  const getEncounterLocationFromAction = (action: Action): string | undefined => {
    if (action.id === 'hometown') return '回老家';
    if (action.id === 'hospital_visit') return '去医院';
    return undefined;
  };

  const shouldForceLinyuEncounter = (actionId: string, state?: GameState | null): boolean =>
    actionId === 'hometown' &&
    !Boolean(state?.homeFlags.linyuEncounterTriggered) &&
    !characterUnlocks.lin_yu &&
    !(characters.lin_yu?.completedEvents ?? []).includes('linyu_encounter');

  const buildLocationBuffAction = (spot: (typeof LOCATION_BUFF_LIBRARY)[number]): Action => {
    const effect: Action['effect'] = {};
    if (spot.buff.actingRate) effect.acting = Math.max(1, Math.round(spot.buff.actingRate * 10));
    if (spot.buff.charmRate) effect.charm = Math.max(1, Math.round(spot.buff.charmRate * 10));
    if (spot.buff.popularityRate) effect.popularity = Math.max(1, Math.round(spot.buff.popularityRate * 12));
    if (spot.buff.reputationRate) effect.reputation = Math.max(1, Math.round(spot.buff.reputationRate * 10));
    if (spot.buff.favorRate) effect.reputation = (effect.reputation || 0) + Math.max(1, Math.round(spot.buff.favorRate * 10));
    if (spot.buff.moneyRate) effect.money = Math.max(100, Math.round(spot.buff.moneyRate * 4000));
    if (spot.buff.staminaRecover) effect.stamina = spot.buff.staminaRecover;

    return {
      id: `location_buff_${spot.id}`,
      name: spot.name,
      desc: spot.desc,
      cost: { stamina: 8, money: 0 },
      effect,
      time: 1,
    };
  };

  const startGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    const background = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[4];
    const bonus = STARTING_BONUSES.find(b => b.id === selectedBonus) || STARTING_BONUSES[0];
    const company = COMPANIES.find(c => c.id === selectedCompany) || COMPANIES[0];

    const calculateContractEnd = (startTime: GameTime, durationWeeks: number): GameTime => {
      let week = startTime.week + durationWeeks * 7;
      let month = startTime.month;
      let year = startTime.year;
      while (week > DAYS_PER_MONTH) {
        week -= DAYS_PER_MONTH;
        month += 1;
      }
      while (month > MONTHS_PER_YEAR) {
        month -= MONTHS_PER_YEAR;
        year += 1;
      }
      return { year, month, week };
    };

    const initialStats = {
      appearance: 10 + (background.bonus.appearance || 0) + (bonus.bonus.appearance || 0) + (company.bonus.appearance || 0),
      acting: 10 + (background.bonus.acting || 0) + (bonus.bonus.acting || 0) + (company.bonus.acting || 0),
      singing: 10 + (background.bonus.singing || 0) + (bonus.bonus.singing || 0) + (company.bonus.singing || 0),
      dancing: 10 + (background.bonus.dancing || 0) + (bonus.bonus.dancing || 0) + (company.bonus.dancing || 0),
      charm: 10 + (background.bonus.charm || 0) + (bonus.bonus.charm || 0) + (company.bonus.charm || 0),
      popularity: 0 + (background.bonus.popularity || 0) + (bonus.bonus.popularity || 0) + (company.bonus.popularity || 0),
      mood: 80,
    };

    const initialMoney = 2000 + (background.bonus.money || 0) + (bonus.bonus.money || 0) + (company.bonus.money || 0);
    const initialMaxStamina = 100 + (background.bonus.maxStamina || 0) + (bonus.bonus.maxStamina || 0) + (company.bonus.maxStamina || 0);

    const initialPlayer: Player = {
        name: playerName,
        companyId: company.id,
        contractEnd: company.id !== 'independent' ? calculateContractEnd({ year: 1, month: 1, week: 1 }, company.contractDuration) : undefined,
        stamina: initialMaxStamina,
        maxStamina: initialMaxStamina,
        money: initialMoney,
        stats: initialStats,
        reputation: 0,
        inventory: [],
        equippedClothing: null,
        avatar: playerAvatar || undefined,
        facilities: {
          gym: 0,
          studio: 0,
          classroom: 0,
          rehearsal: 0,
          pr_center: 0,
          media_dept: 0,
        },
        completedQuests: [],
        acceptedJobIds: [],
        submittedPhaseTasks: [],
        completedTaskDomains: {},
        honors: [],
        jobsCompleted: 0,
        social: {
          followers: initialStats.popularity * 10,
          following: [],
          posts: MOCK_POSTS.map(p => ({ ...p, initialCommentCount: p.comments.length })),
          conversations: [],
          relationships: {}
        }
      };

    const initialState: GameState = {
      time: { year: 1, month: 1, week: 1 },
      player: initialPlayer,
      logs: [{ id: logIdCounter++, text: `欢迎来到星梦之路！${playerName}，你的演艺生涯正式开始。`, type: 'info' }],
      currentLocation: 'home',
      completedEvents: [],
      completedAchievements: [],
      activeEvent: null,
      industryEvent: null,
      plannedTasks: [],
      homeFlags: {
        spaGlowReady: false,
        lastFanLetterStamp: null,
        linyuEncounterTriggered: false,
      },
      dynamicNPCs: [],
      trendingTopics: [
        { topic: "新人演员海选启动", heat: 95 },
        { topic: "陈星宇新戏杀青", heat: 88 },
        { topic: "苏娜练习室生图", heat: 72 }
      ],
      industryPulse: {
        lastTriggeredStamp: null,
        recentEventIds: [],
        recentThemes: [],
      },
    };

    setGameState(initialState);
    const currentLocationName = LOCATIONS.find((loc) => loc.id === initialState.currentLocation)?.name ?? initialState.currentLocation;
    syncEncounterContext({
      year: initialState.time.year,
      month: initialState.time.month,
      week: initialState.time.week,
      location: currentLocationName,
    });
    const openingStory = getStoryById('liumengyao_encounter');
    if (openingStory) {
      setActiveStory(openingStory, 'encounter');
    }
    updatePlayerProfile({
      name: playerName.trim(),
      avatar: playerAvatar || playerProfile.avatar || '',
      portrait: playerPortrait || playerProfile.portrait || '',
      label: playerProfile.label || '自定义人设',
    });
  };

  const getEffectiveStats = (player: Player): Stats => {
    const effective: Stats = {
      appearance: Number(player.stats.appearance) || 0,
      acting: Number(player.stats.acting) || 0,
      singing: Number(player.stats.singing) || 0,
      dancing: Number(player.stats.dancing) || 0,
      charm: Number(player.stats.charm) || 0,
      popularity: Number(player.stats.popularity) || 0,
      mood: clampMood(getSafeMood(player.stats.mood)),
    };
    if (player.equippedClothing) {
      const clothing = CLOTHING_ITEMS.find(c => c.id === player.equippedClothing);
      if (clothing && clothing.bonus) {
        Object.keys(clothing.bonus).forEach(key => {
          effective[key as keyof Stats] += clothing.bonus[key as keyof Stats] || 0;
        });
      }
    }
    effective.mood = clampMood(getSafeMood(effective.mood));
    return effective;
  };

  const getPhaseReqCurrentValue = (key: string, player: Player, liuFavor: number) => {
    const effective = getEffectiveStats(player);
    if (key in effective) return (effective as unknown as Record<string, number>)[key] ?? 0;
    if (key === 'money') return player.money;
    if (key === 'favor_liu') return liuFavor;
    if (key === 'fans') return player.social.followers;
    if (key === 'awards') return Math.floor(player.stats.popularity / 20000);
    if (key === 'international') return Math.floor(player.stats.popularity / 80);
    if (key === 'produce') return Math.floor((player.stats.acting + player.stats.singing + player.stats.dancing) / 3);
    if (key === 'charity') return Math.max(0, Math.floor((player.reputation + 100) * 2 + player.stats.charm * 0.4));
    if (key === 'social') return Math.floor(player.stats.charm + player.stats.popularity / 50);
    if (key === 'esports') return Math.floor(player.stats.dancing + player.stats.popularity / 60);
    if (key === 'business') return Math.floor(player.money / 500000);
    if (key === 'innovation') return Math.floor((player.stats.acting + player.stats.singing) / 2);
    if (key === 'variety') return Math.floor(player.stats.charm + player.stats.dancing / 2);
    return 0;
  };

  const getCurrentPhaseTask = (player: Player) =>
    PHASE_TASKS.find((task) => !player.submittedPhaseTasks.includes(task.id)) ?? null;

  const canSubmitPhaseTask = (player: Player, time: GameTime, liuFavor: number, task: (typeof PHASE_TASKS)[number] | null) => {
    if (!task) return false;
    const status = getPhaseTaskRuntimeStatus(player, time, task);
    if (status !== 'active') return false;
    if (task.preTaskId && !player.submittedPhaseTasks.includes(task.preTaskId)) return false;
    if (task.requiredItem && !player.inventory.includes(task.requiredItem)) return false;
    if (task.targetJobId && !(player.acceptedJobIds ?? []).includes(task.targetJobId)) return false;
    if (!Object.entries(task.req).every(([key, target]) => getPhaseReqCurrentValue(key, player, liuFavor) >= Number(target))) {
      return false;
    }
    return true;
  };

  const handleSubmitPhaseTask = (taskId: string) => {
    if (!gameState) return;
    const liuFavor = characters.liu_mengyao?.favor ?? 0;
    const task = PHASE_TASKS.find((item) => item.id === taskId) ?? null;
    if (!task) return;
    if (!canSubmitPhaseTask(gameState.player, gameState.time, liuFavor, task)) return;

    const reward = task.reward;

    setGameState((prev) => {
      if (!prev) return prev;
      const nextPlayer = {
        ...prev.player,
        stats: { ...prev.player.stats },
      };
      const runtimeStatus = getPhaseTaskRuntimeStatus(nextPlayer, prev.time, task);
      if (runtimeStatus !== 'active') {
        const failLogs: GameState['logs'] = [...prev.logs];
        failLogs.push({ id: logIdCounter++, text: `任务【${task.title}】尚未激活或不可提交。`, type: 'warning' });
        return { ...prev, player: nextPlayer, logs: failLogs.slice(-50) };
      }

      if (reward.money) nextPlayer.money += reward.money;
      if (reward.popularity) nextPlayer.stats.popularity += reward.popularity;
      if (reward.stats) {
        Object.entries(reward.stats).forEach(([key, value]) => {
          const statKey = key as keyof Stats;
          nextPlayer.stats[statKey] = Math.max(0, nextPlayer.stats[statKey] + Number(value || 0));
        });
      }
      if (reward.rewardItems?.length) {
        const merged = new Set([...nextPlayer.inventory, ...reward.rewardItems]);
        nextPlayer.inventory = Array.from(merged);
      }

      nextPlayer.submittedPhaseTasks = [...nextPlayer.submittedPhaseTasks, task.id];
      nextPlayer.completedTaskDomains = {
        ...nextPlayer.completedTaskDomains,
        [task.domain]: (nextPlayer.completedTaskDomains[task.domain] ?? 0) + 1,
      };

      const logs: GameState['logs'] = [...prev.logs];
      logs.push({ id: logIdCounter++, text: `完成阶段考核【${task.title}】`, type: 'success' });
      if (reward.money) logs.push({ id: logIdCounter++, text: `金钱 +${reward.money.toLocaleString()}`, type: 'success' });
      if (reward.popularity) logs.push({ id: logIdCounter++, text: `人气 +${reward.popularity}`, type: 'success' });
      if (reward.stats) {
        Object.entries(reward.stats).forEach(([k, v]) => {
          logs.push({ id: logIdCounter++, text: `${getStatName(k) || k} +${v}`, type: 'success' });
        });
      }
      if (reward.rewardItems?.length) logs.push({ id: logIdCounter++, text: `获得物品：${reward.rewardItems.join('、')}`, type: 'info' });
      if (reward.unlockedJobId) logs.push({ id: logIdCounter++, text: `解锁通告：${reward.unlockedJobId}`, type: 'info' });
      if (reward.unlockJobs?.length) logs.push({ id: logIdCounter++, text: `新增通告：${reward.unlockJobs.join('、')}`, type: 'info' });
      if (reward.title) logs.push({ id: logIdCounter++, text: `获得称号：${reward.title}`, type: 'success' });
      if (reward.passiveIncome) logs.push({ id: logIdCounter++, text: `被动收益 +${reward.passiveIncome}/回合`, type: 'success' });

      const milestone = TASK_MILESTONE_REWARDS[task.domain as keyof typeof TASK_MILESTONE_REWARDS];
      const nextDomainCount = nextPlayer.completedTaskDomains[task.domain] ?? 0;
      let hitMilestone = false;
      if (milestone && nextDomainCount === milestone.requiredCount) {
        hitMilestone = true;
        if (milestone.rewardItems?.length) {
          const merged = new Set([...nextPlayer.inventory, ...milestone.rewardItems]);
          nextPlayer.inventory = Array.from(merged);
        }
        logs.push({ id: logIdCounter++, text: milestone.desc, type: 'success' });
        if (milestone.rewardItems?.length) {
          logs.push({ id: logIdCounter++, text: `里程碑物品：${milestone.rewardItems.join('、')}`, type: 'info' });
        }
        if (milestone.unlockJobs?.length) {
          logs.push({ id: logIdCounter++, text: `里程碑通告：${milestone.unlockJobs.join('、')}`, type: 'info' });
        }
      }

      if (shouldRecordTaskHonor(task.title, hitMilestone)) {
        const prevHonors = nextPlayer.honors ?? [];
        if (!prevHonors.includes(task.title)) {
          nextPlayer.honors = [...prevHonors, task.title];
          logs.push({ id: logIdCounter++, text: `荣誉入墙：${task.title}`, type: 'success' });
        } else {
          nextPlayer.honors = prevHonors;
        }
      }

      return {
        ...prev,
        player: nextPlayer,
        logs: logs.slice(-50),
      };
    });

    if (reward.favorBonus?.target) {
      const targetId = reward.favorBonus.target as CharacterId;
      const currentFavor = characters[targetId]?.favor ?? 0;
      updateCharacter(targetId, { favor: currentFavor + reward.favorBonus.value });
    }
  };

  const addToSchedule = (task: Action | Job) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        plannedTasks: [...prev.plannedTasks, task],
        logs: [...prev.logs, { id: logIdCounter++, text: `已将【${task.name}】加入行程安排。`, type: 'info' }].slice(-50)
      };
    });
  };

  const switchCompany = (companyId: string) => {
    if (!gameState) return;
    const { player, time } = gameState;
    const targetCompany = COMPANIES.find(c => c.id === companyId);
    if (!targetCompany) return;

    // 1. Check requirements
    const unmetReqs: string[] = [];
    if (targetCompany.minPopularity && player.stats.popularity < targetCompany.minPopularity) {
      unmetReqs.push(`人气需达到 ${targetCompany.minPopularity}`);
    }
    if (targetCompany.minStats) {
      const effectiveStats = getEffectiveStats(player);
      Object.entries(targetCompany.minStats).forEach(([key, val]) => {
        if (effectiveStats[key as keyof Stats] < (val as number)) {
          unmetReqs.push(`${getStatName(key)}需达到 ${val}`);
        }
      });
    }

    if (unmetReqs.length > 0) {
      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `无法签约【${targetCompany.name}】：${unmetReqs.join('，')}。`, type: 'warning' }].slice(-50) };
      });
      return;
    }

    // 2. Check penalty
    let penalty = 0;
    const currentCompany = COMPANIES.find(c => c.id === player.companyId);
    if (currentCompany && player.contractEnd) {
      const isContractActive = 
        time.year < player.contractEnd.year || 
        (time.year === player.contractEnd.year && time.month < player.contractEnd.month) ||
        (time.year === player.contractEnd.year && time.month === player.contractEnd.month && time.week < player.contractEnd.week);
      
      if (isContractActive) {
        penalty = currentCompany.penalty;
      }
    }

    if (player.money < penalty) {
      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `违约金不足！解约【${currentCompany?.name}】需要 ￥${penalty.toLocaleString()}。`, type: 'error' }].slice(-50) };
      });
      return;
    }

    // 3. Perform switch
    const calculateContractEnd = (startTime: GameTime, durationWeeks: number): GameTime => {
      let week = startTime.week + durationWeeks * 7;
      let month = startTime.month;
      let year = startTime.year;
      while (week > DAYS_PER_MONTH) {
        week -= DAYS_PER_MONTH;
        month += 1;
      }
      while (month > MONTHS_PER_YEAR) {
        month -= MONTHS_PER_YEAR;
        year += 1;
      }
      return { year, month, week };
    };

    setGameState(prev => {
      if (!prev) return prev;
      const newPlayer = { ...prev.player };
      newPlayer.money -= penalty;
      newPlayer.companyId = targetCompany.id;
      newPlayer.contractEnd = targetCompany.id !== 'independent' ? calculateContractEnd(prev.time, targetCompany.contractDuration) : undefined;
      
      const newLogs = [...prev.logs];
      if (penalty > 0) {
        newLogs.push({ id: logIdCounter++, text: `支付了 ￥${penalty.toLocaleString()} 违约金，与【${currentCompany?.name}】解约。`, type: 'warning' });
      }
      newLogs.push({ id: logIdCounter++, text: `成功签约【${targetCompany.name}】！新的合同已生效。`, type: 'success' });

      return {
        ...prev,
        player: newPlayer,
        logs: newLogs.slice(-50)
      };
    });
  };

  const createBossCompany = (companyName: string, startupCost: number = BOSS_MODE_STARTUP_COST) => {
    if (!gameState) return;
    const canUnlock = gameState.player.money > 500000 && (gameState.player.reputation > 1000 || gameState.player.stats.popularity > 1000);
    if (!canUnlock) {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              logs: [...prev.logs, { id: logIdCounter++, text: '条件不足，无法开启老板模式。', type: 'warning' }].slice(-50),
            }
          : prev,
      );
      return;
    }
    if (gameState.player.money < startupCost) {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              logs: [...prev.logs, { id: logIdCounter++, text: `资金不足，成立公司需要 ￥${startupCost.toLocaleString()}。`, type: 'error' }].slice(-50),
            }
          : prev,
      );
      return;
    }

    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          money: prev.player.money - startupCost,
        },
        logs: [
          ...prev.logs,
          { id: logIdCounter++, text: `你成立了【${companyName}】，正式进入老板模式。`, type: 'success' },
          { id: logIdCounter++, text: `支付启动资金 ￥${startupCost.toLocaleString()}。`, type: 'warning' },
        ].slice(-50),
      };
    });
    updateCompanyState({ isBoss: true, companyName, hiredStaffIds: companyState.hiredStaffIds ?? [] });
  };

  const hireStaff = (staffId: string) => {
    if (!gameState) return;
    const staff = STAFF_POOL.find((s) => s.id === staffId);
    if (!staff) return;
    if ((companyState.hiredStaffIds ?? []).includes(staffId)) return;
    if (gameState.player.money < staff.salary) {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              logs: [...prev.logs, { id: logIdCounter++, text: `资金不足，无法招募【${staff.name}】。`, type: 'error' }].slice(-50),
            }
          : prev,
      );
      return;
    }
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          money: prev.player.money - staff.salary,
        },
        logs: [
          ...prev.logs,
          { id: logIdCounter++, text: `已招募【${staff.name}】(${staff.role})。`, type: 'success' },
          { id: logIdCounter++, text: `支付薪资 ￥${staff.salary.toLocaleString()}。`, type: 'warning' },
        ].slice(-50),
      };
    });
    updateCompanyState({ hiredStaffIds: Array.from(new Set([...(companyState.hiredStaffIds ?? []), staffId])) });
  };

  const fireStaff = (staffId: string) => {
    const staff = STAFF_POOL.find((s) => s.id === staffId);
    if (!staff) return;
    updateCompanyState({ hiredStaffIds: (companyState.hiredStaffIds ?? []).filter((id) => id !== staffId) });
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            logs: [...prev.logs, { id: logIdCounter++, text: `已解雇【${staff.name}】。`, type: 'info' }].slice(-50),
          }
        : prev,
    );
  };

  const upgradeFacility = (facilityId: FacilityId) => {
    setGameState(prev => {
      if (!prev) return prev;
      const currentLevel = Number(prev.player.facilities[facilityId] ?? 0);
      const facility = FACILITIES[facilityId];
      
      if (currentLevel >= facility.levels.length) return prev;
      
      const nextLevelData = facility.levels[currentLevel];
      
      if (prev.player.money < nextLevelData.cost.money) {
        return {
          ...prev,
          logs: [...prev.logs, { id: logIdCounter++, text: `资金不足，无法升级${facility.name}。`, type: 'error' }].slice(-50)
        };
      }

      const upgradeTask = {
        id: `upgrade_${facilityId}_${currentLevel + 1}`,
        name: `升级${facility.name} (Lv.${currentLevel + 1})`,
        desc: `将${facility.name}升级至第 ${currentLevel + 1} 级。${nextLevelData.bonusDesc}`,
        cost: { stamina: 0, money: nextLevelData.cost.money },
        effect: facilityId === 'gym' ? { maxStamina: nextLevelData.bonus } : {},
        time: nextLevelData.cost.time,
        isUpgrade: true,
        facilityId: facilityId,
        nextLevel: currentLevel + 1
      };

      return {
        ...prev,
        plannedTasks: [...prev.plannedTasks, upgradeTask],
        logs: [...prev.logs, { id: logIdCounter++, text: `已将【${upgradeTask.name}】加入行程。`, type: 'info' }].slice(-50)
      };
    });
  };

  const removeTask = (index: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newTasks = [...prev.plannedTasks];
      newTasks.splice(index, 1);
      return {
        ...prev,
        plannedTasks: newTasks
      };
    });
  };

  const executeNextTask = async () => {
    if (!gameState || gameState.plannedTasks.length === 0) return;
    const task = gameState.plannedTasks[0];
    const effectiveStats = getEffectiveStats(gameState.player);

    if ('req' in task) {
      // It's a Job
      const unmetReqs: string[] = [];
      Object.keys(task.req).forEach(key => {
        const reqVal = task.req[key as keyof Stats];
        if (reqVal && effectiveStats[key as keyof Stats] < reqVal) {
          unmetReqs.push(`${getStatName(key)}需达到 ${reqVal}`);
        }
      });

      if (unmetReqs.length > 0) {
        setGameState(prev => {
          if (!prev) return prev;
          const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt('stats')}`, type: 'taunt' as const };
          return { 
            ...prev, 
            plannedTasks: prev.plannedTasks.slice(1),
            logs: [...prev.logs, { id: logIdCounter++, text: `行程【${task.name}】取消：${unmetReqs.join('，')}。`, type: 'warning' }, tauntLog].slice(-50) 
          };
        });
        return;
      }

      if (gameState.player.stamina < task.cost.stamina || (task.cost.money && gameState.player.money < task.cost.money)) {
        setGameState(prev => {
          if (!prev) return prev;
          const tauntType = prev.player.stamina < task.cost.stamina ? 'stamina' : 'money';
          const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt(tauntType)}`, type: 'taunt' as const };
          return { 
            ...prev, 
            plannedTasks: prev.plannedTasks.slice(1),
            logs: [...prev.logs, { id: logIdCounter++, text: `行程【${task.name}】取消：体力或金钱不足。`, type: 'error' }, tauntLog].slice(-50) 
          };
        });
        return;
      }

      const shouldShowStoryModal = Math.random() < JOB_STORY_MODAL_CHANCE;
      if (shouldShowStoryModal) {
        setStoryModal({
          isOpen: true,
          title: task.name,
          content: '正在生成剧情与评价...',
          isLoading: true
        });
      }

      if (shouldShowStoryModal) {
        try {
          const { generateStory, generateJobEvaluation } = await loadGeminiModule();
          const [story, evaluationData] = await Promise.all([
            generateStory(gameState.player.name, task.name, task.desc, effectiveStats),
            generateJobEvaluation(task.name, effectiveStats, gameState.player.name)
          ]);
          const equipped = gameState.player.equippedClothing
            ? CLOTHING_ITEMS.find((c) => c.id === gameState.player.equippedClothing) || null
            : null;
          const styleBonus = getOutfitStyleBonus(task as Job, equipped);
          
          setStoryModal(prev => ({ 
            ...prev, 
            content: story, 
            isLoading: false 
          }));

          setJobResultModal({
            isOpen: true,
            jobName: task.name,
            evaluation: evaluationData.evaluation,
            rating: shiftRating(evaluationData.rating, styleBonus),
            rewards: task.reward
          });
        } catch (error) {
          setStoryModal(prev => ({ ...prev, content: '剧情生成失败，但这并不影响你的星途。', isLoading: false }));
        }
      }

      setGameState(prev => {
        if (!prev) return prev;
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        const spaGlowActive = prev.homeFlags?.spaGlowReady;
        newPlayer.stamina -= task.cost.stamina;
        const moodCost = getMoodCostByStamina(task.cost.stamina);
        if (moodCost > 0) {
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -moodCost);
        }
        if (task.cost.money) newPlayer.money -= task.cost.money;

        let taskMoneyReward = task.reward.money;
        let taskPopularityReward = task.reward.popularity;
        let spaMoneyBonus = 0;
        let spaPopularityBonus = 0;
        if (spaGlowActive) {
          spaMoneyBonus = Math.round(taskMoneyReward * 0.15);
          spaPopularityBonus = Math.round(taskPopularityReward * 0.15);
          taskMoneyReward += spaMoneyBonus;
          taskPopularityReward += spaPopularityBonus;
        }

        let newLogs = [...prev.logs, { 
          id: logIdCounter++, 
          text: `完成行程【${task.name}】！获得 ${taskMoneyReward} 金钱，人气 +${taskPopularityReward}。`, 
          type: 'success' 
        }];
        if (moodCost > 0) {
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】: 心情 -${moodCost}。`, type: 'info' });
        }
        if (spaGlowActive) {
          newLogs.push({
            id: logIdCounter++,
            text: `【容光焕发】生效：额外金钱 +${spaMoneyBonus}，额外人气 +${spaPopularityBonus}。`,
            type: 'success',
          });
        }
        newPlayer.money += taskMoneyReward;
        newPlayer.stats.popularity += taskPopularityReward;
        if (task.reward.stats) {
          newPlayer = applyEffect(newPlayer, task.reward.stats, newLogs, `${task.name}额外奖励`);
        }
        const equipped = prev.player.equippedClothing
          ? CLOTHING_ITEMS.find((c) => c.id === prev.player.equippedClothing) || null
          : null;
        const styleBonus = getOutfitStyleBonus(task as Job, equipped);
        if (styleBonus > 0 && equipped?.styleTag) {
          newLogs.push({
            id: logIdCounter++,
            text: `穿搭风格【${equipped.styleTag}】与通告标签契合，评价等级 +${styleBonus}。`,
            type: 'success',
          });
        }
        newPlayer.jobsCompleted += 1;

        const nextState = {
          ...prev,
          player: newPlayer,
          homeFlags: {
            ...prev.homeFlags,
            spaGlowReady: false,
          },
          logs: newLogs.slice(-50),
          plannedTasks: prev.plannedTasks.slice(1)
        };

        return advanceTime(nextState, task.time);
      });
    } else {
      // It's an Action
      if (task.id === 'manager') {
        const currentFavor = characters.liu_mengyao?.favor ?? 0;
        updateCharacter('liu_mengyao', { favor: currentFavor + 2 });
      }
      if (task.id === 'home_esports' && Math.random() < 0.2) {
        const currentFavor = characters.zhou_yan?.favor ?? 0;
        updateCharacter('zhou_yan', { favor: currentFavor + 3 });
      }
      const forceHometownEncounter = gameState ? shouldForceLinyuEncounter(task.id, gameState) : false;
      const hometownEncounterContext =
        gameState && forceHometownEncounter ? advanceClock(gameState.time, task.time) : null;
      setGameState(prev => {
        if (!prev) return prev;
        const dayStamp = toTimeStamp(prev.time);
        const lastFanLetterStamp = getSafeStamp(prev.homeFlags?.lastFanLetterStamp);
        if (task.id === 'fan_letter' && lastFanLetterStamp !== null && dayStamp - lastFanLetterStamp < 3) {
          return {
            ...prev,
            plannedTasks: prev.plannedTasks.slice(1),
            logs: [...prev.logs, { id: logIdCounter++, text: `行程【${task.name}】取消：粉丝手写信每 3 天限 1 次。`, type: 'warning' }].slice(-50),
          };
        }
        if (prev.player.stamina < task.cost.stamina || prev.player.money < task.cost.money) {
          const tauntType = prev.player.stamina < task.cost.stamina ? 'stamina' : 'money';
          const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt(tauntType)}`, type: 'taunt' as const };
          return { 
            ...prev, 
            plannedTasks: prev.plannedTasks.slice(1),
            logs: [...prev.logs, { id: logIdCounter++, text: `行程【${task.name}】取消：体力或金钱不足。`, type: 'error' }, tauntLog].slice(-50) 
          };
        }

        let newLogs = [...prev.logs];
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        
        newPlayer.stamina -= task.cost.stamina;
        newPlayer.money -= task.cost.money;
        const baseMoodCost = getMoodCostByStamina(task.cost.stamina);
        const shouldConsumeMood = !['rest', 'hometown', 'park', 'home_esports', 'fan_letter', 'spa_glow'].includes(task.id);
        if (shouldConsumeMood && baseMoodCost > 0) {
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -baseMoodCost);
        }

        if (task.cost.money > 0) {
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】: 消耗 ${task.cost.stamina} 体力，花费 ${task.cost.money} 金钱。`, type: 'info' });
        } else if (task.cost.stamina > 0) {
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】: 消耗 ${task.cost.stamina} 体力。`, type: 'info' });
        }
        if (shouldConsumeMood && baseMoodCost > 0) {
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】: 心情 -${baseMoodCost}。`, type: 'info' });
        }

        if (task.id === 'social_media_run') {
          if (Math.random() < 0.7) {
            newPlayer.stats.popularity += 35;
            newPlayer.stats.charm += 2;
            newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 6);
            newLogs.push({ id: logIdCounter++, text: '美照出圈！评论区一片夸夸：人气 +35，魅力 +2。', type: 'success' });
            newLogs.push({ id: logIdCounter++, text: '【社交反馈】: 心情 +6。', type: 'success' });
          } else {
            newPlayer.stats.charm = Math.max(0, newPlayer.stats.charm - 1);
            newPlayer.stats.popularity += 8;
            newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -8);
            newLogs.push({ id: logIdCounter++, text: '黑粉抬杠冲热评：魅力 -1，但黑红热度让人气 +8。', type: 'warning' });
            newLogs.push({ id: logIdCounter++, text: '【社交反馈】: 心情 -8。', type: 'warning' });
          }
        } else if (task.id === 'spa_glow') {
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 16);
          newLogs.push({ id: logIdCounter++, text: '做完 SPA，感觉皮肤透亮，状态绝佳！下一次通告收益 +15%。', type: 'success' });
          newLogs.push({ id: logIdCounter++, text: '【沉浸式护肤 SPA】: 心情 +16。', type: 'success' });
        } else if (task.id === 'home_esports') {
          newPlayer.stamina = Math.min(newPlayer.maxStamina, newPlayer.stamina + 30);
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 22);
          newLogs.push({ id: logIdCounter++, text: '宅家连胜，心情拉满！体力恢复 +30。', type: 'success' });
          newLogs.push({ id: logIdCounter++, text: '【宅家打电竞】: 心情 +22。', type: 'success' });
        } else if (task.id === 'fan_letter') {
          newPlayer.stamina = Math.min(newPlayer.maxStamina, newPlayer.stamina + 25);
          newPlayer.stats.charm += 1;
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 18);
          newLogs.push({ id: logIdCounter++, text: '读完粉丝手写信，心里暖暖的。体力恢复 +25，魅力 +1。', type: 'success' });
          newLogs.push({ id: logIdCounter++, text: '【阅读粉丝手写信】: 心情 +18。', type: 'success' });
        }

        if (task.effect) {
          newPlayer = applyEffect(newPlayer, task.effect, newLogs, task.name);
        }
        if (task.id === 'manager') {
          newLogs.push({ id: logIdCounter++, text: '柳梦瑶好感度 +2。', type: 'success' });
        }

        if ((task as any).isUpgrade) {
          const { facilityId, nextLevel } = (task as any);
          newPlayer.facilities = { ...newPlayer.facilities, [facilityId]: nextLevel };
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】完成！${FACILITIES[facilityId as FacilityId].name}已升级至 Lv.${nextLevel}。`, type: 'success' });
        }

        let nextState = {
          ...prev,
          player: newPlayer,
          homeFlags: {
            ...prev.homeFlags,
            spaGlowReady: task.id === 'spa_glow' ? true : prev.homeFlags.spaGlowReady,
            lastFanLetterStamp: task.id === 'fan_letter' ? dayStamp : getSafeStamp(prev.homeFlags.lastFanLetterStamp),
            linyuEncounterTriggered:
              task.id === 'hometown' && !prev.homeFlags.linyuEncounterTriggered
                ? true
                : prev.homeFlags.linyuEncounterTriggered,
          },
          logs: newLogs.slice(-50),
          plannedTasks: prev.plannedTasks.slice(1)
        };

        let triggeredRandomEvent = null;
        if (!forceHometownEncounter) {
          for (const event of RANDOM_EVENTS) {
            if (event.locations.includes(prev.currentLocation)) {
              if (!event.condition || event.condition(newPlayer)) {
                if (Math.random() < event.probability) {
                  triggeredRandomEvent = event;
                  break;
                }
              }
            }
          }
        }

        if (triggeredRandomEvent) {
          nextState.activeEvent = { id: triggeredRandomEvent.id, lineIndex: 0, isRandom: true };
        }

        return advanceTime(nextState, task.time, getEncounterLocationFromAction(task as Action));
      });
      if (forceHometownEncounter && hometownEncounterContext) {
        const linyuStory = getStoryById('linyu_encounter');
        if (linyuStory) {
          unlockCharacter('lin_yu');
          markCharacterEventCompleted('lin_yu', 'linyu_encounter');
          syncEncounterContext({
            ...hometownEncounterContext,
            location: '回老家',
          });
          setActiveStory(linyuStory, 'encounter');
        }
      }
    }
  };

  const applyEffect = (player: Player, effect: any, logs: any[], sourceName: string) => {
    const newPlayer = { ...player, stats: { ...player.stats } };
    const effectsStr: string[] = [];

    if (effect.maxStamina) {
      newPlayer.maxStamina += effect.maxStamina;
      effectsStr.push(`体力上限+${effect.maxStamina}`);
    }
    if (effect.stamina) {
      const heal = Math.min(newPlayer.maxStamina - newPlayer.stamina, effect.stamina);
      newPlayer.stamina += heal;
      effectsStr.push(`恢复 ${heal} 体力`);
    }
    if (effect.money) {
      newPlayer.money += effect.money;
      effectsStr.push(`获得 ${effect.money} 金钱`);
    }
    if (effect.reputation) {
      newPlayer.reputation = Math.max(-100, Math.min(100, newPlayer.reputation + effect.reputation));
      effectsStr.push(`声望${effect.reputation > 0 ? '+' : ''}${effect.reputation}`);
    }
    Object.keys(effect).forEach(key => {
      if (key !== 'stamina' && key !== 'money' && key !== 'maxStamina') {
        let val = effect[key as keyof Stats];
        if (val && val > 0) {
          // Apply facility bonuses
          if (key === 'singing' && player.facilities.studio > 0) {
            const bonus = FACILITIES.studio.levels[player.facilities.studio - 1].bonus;
            val = Math.round(val * (1 + bonus));
          }
          if (key === 'acting' && player.facilities.classroom > 0) {
            const bonus = FACILITIES.classroom.levels[player.facilities.classroom - 1].bonus;
            val = Math.round(val * (1 + bonus));
          }
          if (key === 'dancing' && player.facilities.rehearsal > 0) {
            const bonus = FACILITIES.rehearsal.levels[player.facilities.rehearsal - 1].bonus;
            val = Math.round(val * (1 + bonus));
          }
          if (key === 'charm' && player.facilities.pr_center > 0) {
            const bonus = FACILITIES.pr_center.levels[player.facilities.pr_center - 1].bonus;
            val = Math.round(val * (1 + bonus));
          }
          if (key === 'popularity' && player.facilities.media_dept > 0) {
            const bonus = FACILITIES.media_dept.levels[player.facilities.media_dept - 1].bonus;
            val = Math.round(val * (1 + bonus));
          }
          // Apply company bonus (Muse Studio)
          if (player.companyId === 'muse_studio') {
            val = Math.round(val * 1.1);
          }
        }
        if (val) {
          if (key === 'mood') {
            newPlayer.stats[key as keyof Stats] = clampMood(newPlayer.stats[key as keyof Stats] + val);
          } else {
            newPlayer.stats[key as keyof Stats] = Math.max(0, newPlayer.stats[key as keyof Stats] + val);
          }
          effectsStr.push(`${getStatName(key)}${val > 0 ? '+' : ''}${val}`);
        }
      }
    });

    if (effectsStr.length > 0) {
      logs.push({ id: logIdCounter++, text: `【${sourceName}】: ${effectsStr.join('，')}。`, type: 'success' });
    }

    return newPlayer;
  };

  const triggerIndustryEvent = async (state: GameState, source: 'action' | 'job' = 'action') => {
    if (state.industryEvent) return;
    const nowStamp = toTimeStamp(state.time);
    const pulse = state.industryPulse ?? { lastTriggeredStamp: null, recentEventIds: [], recentThemes: [] };
    const cooldownRounds = source === 'job' ? 4 : 5;
    if (pulse.lastTriggeredStamp !== null && nowStamp - pulse.lastTriggeredStamp < cooldownRounds) return;
    const triggerChance = 0.1;
    if (Math.random() >= triggerChance) return;

    const company = COMPANIES.find(c => c.id === state.player.companyId);
    const { generateIndustryEvent } = await loadGeminiModule();
    const event = await generateIndustryEvent(
      state.player.name,
      state.player.stats,
      state.player.reputation,
      company?.name || '个人工作室',
      {
        excludeIds: pulse.recentEventIds,
        excludeThemes: pulse.recentThemes,
      }
    );
    setGameState(prev => {
      if (!prev) return prev;
      const currentPulse = prev.industryPulse ?? { lastTriggeredStamp: null, recentEventIds: [], recentThemes: [] };
      return {
        ...prev,
        industryEvent: event,
        industryPulse: {
          lastTriggeredStamp: nowStamp,
          recentEventIds: [event.id || event.title, ...currentPulse.recentEventIds].slice(0, 6),
          recentThemes: [event.theme || event.waveType || '行业', ...currentPulse.recentThemes].slice(0, 3),
        },
      };
    });
  };

  const handleIndustryChoice = (choice: any) => {
    if (!gameState || !gameState.industryEvent) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
      let newLogs = [...prev.logs];
      
      // Apply rewards
      if (choice.rewards) {
        newPlayer = applyEffect(newPlayer, choice.rewards, newLogs, `抉择：${prev.industryEvent?.title}`);
      }
      
      newLogs.push({ id: logIdCounter++, text: `【抉择结果】: ${choice.impact}`, type: 'info' });
      
      return {
        ...prev,
        player: newPlayer,
        logs: newLogs.slice(-50),
        industryEvent: null
      };
    });
  };

  const performAction = async (action: Action) => {
    if (!gameState) return;
    const todayStamp = toTimeStamp(gameState.time);
    const lastFanLetterStamp = getSafeStamp(gameState.homeFlags?.lastFanLetterStamp);

    if (action.id === 'fan_letter' && lastFanLetterStamp !== null && todayStamp - lastFanLetterStamp < 3) {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          logs: [...prev.logs, { id: logIdCounter++, text: '粉丝手写信每 3 天只能读 1 次，先去做点别的吧。', type: 'warning' }].slice(-50),
        };
      });
      return;
    }

    if (gameState.player.stamina < action.cost.stamina) {
      setGameState(prev => {
        if (!prev) return prev;
        const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt('stamina')}`, type: 'taunt' as const };
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `体力不足，无法进行【${action.name}】。`, type: 'error' }, tauntLog].slice(-50) };
      });
      return;
    }
    if (gameState.player.money < action.cost.money) {
      setGameState(prev => {
        if (!prev) return prev;
        const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt('money')}`, type: 'taunt' as const };
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `金钱不足，无法进行【${action.name}】。`, type: 'error' }, tauntLog].slice(-50) };
      });
      return;
    }

    if (action.id === 'read' && Math.random() < READ_STORY_MODAL_CHANCE) {
      setStoryModal({
        isOpen: true,
        title: '研读剧本',
        content: '正在挑选剧本...',
        isLoading: true
      });
      try {
        const { generateScriptReading } = await loadGeminiModule();
        const story = await generateScriptReading(gameState.player.name, gameState.player.stats);
        setStoryModal(prev => ({ ...prev, content: story, isLoading: false }));
      } catch (error) {
        setStoryModal(prev => ({ ...prev, content: '你认真研读了剧本，感觉演技有所提升。', isLoading: false }));
      }
    }

    if (action.id === 'manager') {
      const currentFavor = characters.liu_mengyao?.favor ?? 0;
      updateCharacter('liu_mengyao', { favor: currentFavor + 2 });
    }

    if (action.id === 'social_media_run') {
      setGameState(prev => {
        if (!prev) return prev;
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        const newLogs = [...prev.logs];
        newPlayer.stamina -= action.cost.stamina;
        newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -4);
        newLogs.push({ id: logIdCounter++, text: `【社交媒体营业】: 消耗 ${action.cost.stamina} 体力。`, type: 'info' });
        newLogs.push({ id: logIdCounter++, text: '【社交媒体营业】: 心情 -4。', type: 'info' });

        const success = Math.random() < 0.7;
        if (success) {
          newPlayer.stats.popularity += 35;
          newPlayer.stats.charm += 2;
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 6);
          newLogs.push({ id: logIdCounter++, text: '美照出圈！评论区全在夸状态， 人气 +35，魅力 +2。', type: 'success' });
          newLogs.push({ id: logIdCounter++, text: '【社交反馈】: 心情 +6。', type: 'success' });
        } else {
          newPlayer.stats.charm = Math.max(0, newPlayer.stats.charm - 1);
          newPlayer.stats.popularity += 8;
          newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -8);
          newLogs.push({ id: logIdCounter++, text: '黑粉抬杠冲上热评，状态被影响。魅力 -1，但黑红热度让人气 +8。', type: 'warning' });
          newLogs.push({ id: logIdCounter++, text: '【社交反馈】: 心情 -8。', type: 'warning' });
        }

        let nextState = {
          ...prev,
          player: newPlayer,
          logs: newLogs.slice(-50),
        };
        let triggeredRandomEvent = null;
        for (const event of RANDOM_EVENTS) {
          if (event.locations.includes(prev.currentLocation)) {
            if (!event.condition || event.condition(newPlayer)) {
              if (Math.random() < event.probability) {
                triggeredRandomEvent = event;
                break;
              }
            }
          }
        }
        if (triggeredRandomEvent) {
          nextState.activeEvent = { id: triggeredRandomEvent.id, lineIndex: 0, isRandom: true };
        }
        const finalState = advanceTime(nextState, action.time, getEncounterLocationFromAction(action));
        triggerIndustryEvent(finalState, 'action');
        return finalState;
      });
      return;
    }

    if (action.id === 'spa_glow') {
      setGameState(prev => {
        if (!prev) return prev;
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        const newLogs = [...prev.logs];
        newPlayer.stamina -= action.cost.stamina;
        newPlayer.money -= action.cost.money;
        newPlayer.stats.charm += 2;
        newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 16);
        newLogs.push({ id: logIdCounter++, text: `【沉浸式护肤 SPA】: 消耗 ${action.cost.stamina} 体力，花费 ${action.cost.money} 金钱。`, type: 'info' });
        newLogs.push({ id: logIdCounter++, text: '做完 SPA，感觉皮肤透亮，状态绝佳！已获得[容光焕发]：下一次通告收益 +15%。', type: 'success' });
        newLogs.push({ id: logIdCounter++, text: '【沉浸式护肤 SPA】: 心情 +16。', type: 'success' });

        let nextState = {
          ...prev,
          player: newPlayer,
          homeFlags: {
            ...prev.homeFlags,
            spaGlowReady: true,
          },
          logs: newLogs.slice(-50),
        };
        let triggeredRandomEvent = null;
        for (const event of RANDOM_EVENTS) {
          if (event.locations.includes(prev.currentLocation)) {
            if (!event.condition || event.condition(newPlayer)) {
              if (Math.random() < event.probability) {
                triggeredRandomEvent = event;
                break;
              }
            }
          }
        }
        if (triggeredRandomEvent) {
          nextState.activeEvent = { id: triggeredRandomEvent.id, lineIndex: 0, isRandom: true };
        }
        const finalState = advanceTime(nextState, action.time, getEncounterLocationFromAction(action));
        triggerIndustryEvent(finalState, 'action');
        return finalState;
      });
      return;
    }

    if (action.id === 'home_esports') {
      const hitPro = Math.random() < 0.2;
      if (hitPro) {
        const currentFavor = characters.zhou_yan?.favor ?? 0;
        updateCharacter('zhou_yan', { favor: currentFavor + 3 });
      }
      setGameState(prev => {
        if (!prev) return prev;
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        const newLogs = [...prev.logs];
        newPlayer.stamina -= action.cost.stamina;
        newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 22);
        newLogs.push({ id: logIdCounter++, text: `【宅家打电竞】: 消耗 ${action.cost.stamina} 体力。`, type: 'info' });
        newPlayer.stamina = Math.min(newPlayer.maxStamina, newPlayer.stamina + 30);
        newLogs.push({ id: logIdCounter++, text: '连胜几局，心情拉满！体力恢复 +30。', type: 'success' });
        newLogs.push({ id: logIdCounter++, text: '【宅家打电竞】: 心情 +22。', type: 'success' });
        if (hitPro) {
          newPlayer.stats.dancing += 3;
          newLogs.push({ id: logIdCounter++, text: '撞车职业选手触发隐藏事件！反应力暴涨（舞蹈 +3），周焰好感 +3。', type: 'success' });
        }

        let nextState = {
          ...prev,
          player: newPlayer,
          logs: newLogs.slice(-50),
        };
        let triggeredRandomEvent = null;
        for (const event of RANDOM_EVENTS) {
          if (event.locations.includes(prev.currentLocation)) {
            if (!event.condition || event.condition(newPlayer)) {
              if (Math.random() < event.probability) {
                triggeredRandomEvent = event;
                break;
              }
            }
          }
        }
        if (triggeredRandomEvent) {
          nextState.activeEvent = { id: triggeredRandomEvent.id, lineIndex: 0, isRandom: true };
        }
        const finalState = advanceTime(nextState, action.time, getEncounterLocationFromAction(action));
        triggerIndustryEvent(finalState, 'action');
        return finalState;
      });
      return;
    }

    if (action.id === 'fan_letter') {
      setGameState(prev => {
        if (!prev) return prev;
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        const newLogs = [...prev.logs];
        newPlayer.stamina = Math.min(newPlayer.maxStamina, newPlayer.stamina + 25);
        newPlayer.stats.charm += 1;
        newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, 18);
        newLogs.push({ id: logIdCounter++, text: '你翻开粉丝手写信，心里暖了起来。体力恢复 +25，魅力 +1。', type: 'success' });
        newLogs.push({ id: logIdCounter++, text: '【阅读粉丝手写信】: 心情 +18。', type: 'success' });

        let nextState = {
          ...prev,
          player: newPlayer,
          homeFlags: {
            ...prev.homeFlags,
            lastFanLetterStamp: toTimeStamp(prev.time),
          },
          logs: newLogs.slice(-50),
        };
        let triggeredRandomEvent = null;
        for (const event of RANDOM_EVENTS) {
          if (event.locations.includes(prev.currentLocation)) {
            if (!event.condition || event.condition(newPlayer)) {
              if (Math.random() < event.probability) {
                triggeredRandomEvent = event;
                break;
              }
            }
          }
        }
        if (triggeredRandomEvent) {
          nextState.activeEvent = { id: triggeredRandomEvent.id, lineIndex: 0, isRandom: true };
        }
        const finalState = advanceTime(nextState, action.time, getEncounterLocationFromAction(action));
        triggerIndustryEvent(finalState, 'action');
        return finalState;
      });
      return;
    }

    const forceHometownEncounter = shouldForceLinyuEncounter(action.id, gameState);
    const hometownEncounterContext = forceHometownEncounter
      ? advanceClock(gameState.time, action.time)
      : null;

    setGameState(prev => {
      if (!prev) return prev;
      let newLogs = [...prev.logs];
      let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
      
      newPlayer.stamina -= action.cost.stamina;
      newPlayer.money -= action.cost.money;
      const moodCost = getMoodCostByStamina(action.cost.stamina);
      const shouldConsumeMood = !['rest', 'hometown', 'park', 'home_esports', 'fan_letter', 'spa_glow'].includes(action.id);
      if (shouldConsumeMood && moodCost > 0) {
        newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -moodCost);
      }

      if (action.cost.money > 0) {
        newLogs.push({ id: logIdCounter++, text: `【${action.name}】: 消耗 ${action.cost.stamina} 体力，花费 ${action.cost.money} 金钱。`, type: 'info' });
      } else if (action.cost.stamina > 0) {
        newLogs.push({ id: logIdCounter++, text: `【${action.name}】: 消耗 ${action.cost.stamina} 体力。`, type: 'info' });
      }
      if (shouldConsumeMood && moodCost > 0) {
        newLogs.push({ id: logIdCounter++, text: `【${action.name}】: 心情 -${moodCost}。`, type: 'info' });
      }

      if (action.effect) {
        newPlayer = applyEffect(newPlayer, action.effect, newLogs, action.name);
      }
      if (action.id === 'manager') {
        newLogs.push({ id: logIdCounter++, text: '柳梦瑶好感度 +2。', type: 'success' });
      }

      let nextState = {
        ...prev,
        player: newPlayer,
        homeFlags: {
          ...prev.homeFlags,
          linyuEncounterTriggered:
            action.id === 'hometown' && !prev.homeFlags.linyuEncounterTriggered
              ? true
              : prev.homeFlags.linyuEncounterTriggered,
        },
        logs: newLogs.slice(-50)
      };

      let triggeredRandomEvent = null;
      if (!forceHometownEncounter) {
        for (const event of RANDOM_EVENTS) {
          if (event.locations.includes(prev.currentLocation)) {
            if (!event.condition || event.condition(newPlayer)) {
              if (Math.random() < event.probability) {
                triggeredRandomEvent = event;
                break;
              }
            }
          }
        }
      }

      if (triggeredRandomEvent) {
        nextState.activeEvent = { id: triggeredRandomEvent.id, lineIndex: 0, isRandom: true };
      }

      const finalState = advanceTime(nextState, action.time, getEncounterLocationFromAction(action));

      if (!forceHometownEncounter) {
        triggerIndustryEvent(finalState, 'action');
      }

      return finalState;
    });
    if (forceHometownEncounter && hometownEncounterContext) {
      const linyuStory = getStoryById('linyu_encounter');
      if (linyuStory) {
        unlockCharacter('lin_yu');
        markCharacterEventCompleted('lin_yu', 'linyu_encounter');
        syncEncounterContext({
          ...hometownEncounterContext,
          location: '回老家',
        });
        setActiveStory(linyuStory, 'encounter');
      }
    }
  };

  const handleCreatePost = () => {
    if (!gameState || !newPostContent.trim() || isPostingRef.current) return;
    
    const { player, time } = gameState;
    if (player.stamina < 10) {
      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: '体力不足，无法发帖。', type: 'error' }].slice(-50) };
      });
      return;
    }

    setIsPosting(true);
    isPostingRef.current = true;
    
    // Simulate network delay
    setTimeout(() => {
      // Double check ref to prevent race conditions
      if (!isPostingRef.current) return;

      const newPost: SocialPost & { initialCommentCount?: number } = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: 'player',
        content: newPostContent,
        image: newPostImage || undefined,
        likes: 0,
        comments: [],
        timestamp: { ...time },
        type: newPostImage ? 'image' : 'text',
        initialCommentCount: 0
      };

      let baseLikes = player.stats.popularity * 0.5 + player.stats.charm * 0.3;
      
      // Bonus for image
      if (newPostImage) {
        baseLikes += player.stats.appearance * 0.5;
      }

      // Random fluctuation
      const randomFactor = 0.8 + Math.random() * 0.4;
      newPost.likes = Math.floor(Math.max(1, baseLikes * randomFactor));
      
      // Generate comments
      const fanComments = [
        '哇！太好看了吧！',
        '加油加油！期待新作品！',
        '老婆/老公贴贴！',
        '注意身体哦~',
        '第一！',
        '这是什么神仙颜值！',
        '终于营业了！',
        '今天的造型满分??',
      ];
      const commentCount = Math.floor(newPost.likes / 10);
      for (let i = 0; i < Math.min(5, commentCount); i++) {
        newPost.comments.push(fanComments[Math.floor(Math.random() * fanComments.length)]);
      }
      newPost.initialCommentCount = newPost.comments.length;

      setGameState(prev => {
        if (!prev) return prev;
        
        // Ensure no duplicate posts by ID
        if (prev.player.social.posts.some(p => p.id === newPost.id)) return prev;
        
        const newFollowers = Math.floor(newPost.likes * 0.2);
        
        return {
          ...prev,
          player: {
            ...prev.player,
            stamina: prev.player.stamina - 10,
            stats: {
              ...prev.player.stats,
              popularity: prev.player.stats.popularity + Math.floor(newFollowers / 100)
            },
            social: {
              ...prev.player.social,
              followers: prev.player.social.followers + newFollowers,
              posts: [newPost, ...prev.player.social.posts]
            }
          },
          logs: [...prev.logs, { id: logIdCounter++, text: `发布了新动态，获得了 ${newPost.likes} 个赞，涨粉 ${newFollowers}！`, type: 'success' }].slice(-50)
        };
      });

      setNewPostContent('');
      setNewPostImage(null);
      setIsPosting(false);
      isPostingRef.current = false;
      setSocialTab('me');
    }, 1000);
  };

  const handleDeletePost = (postId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          social: {
            ...prev.player.social,
            posts: prev.player.social.posts.filter(p => p.id !== postId)
          }
        },
        logs: [...prev.logs, { id: logIdCounter++, text: '删除了动态。', type: 'info' }].slice(-50)
      };
    });
  };

  const toggleFollow = (userId: string) => {
    if (!gameState) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      const isFollowing = prev.player.social.following.includes(userId);
      
      const newFollowing = isFollowing 
        ? prev.player.social.following.filter(id => id !== userId)
        : [...prev.player.social.following, userId];
      
      return {
        ...prev,
        player: {
          ...prev.player,
          social: {
            ...prev.player.social,
            following: newFollowing
          }
        }
      };
    });
  };

  const handleLikePost = (postId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const post = prev.player.social.posts.find(p => p.id === postId);
      const newRelationships = { ...prev.player.social.relationships };
      
      if (post && post.authorId !== 'player') {
        newRelationships[post.authorId] = Math.min(100, (newRelationships[post.authorId] || 0) + 1);
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          social: {
            ...prev.player.social,
            posts: prev.player.social.posts.map(p => 
              p.id === postId ? { ...p, likes: p.likes + 1 } : p
            ),
            relationships: newRelationships
          }
        }
      };
    });
  };

  const handleAddComment = (postId: string, comment: string) => {
    if (!comment.trim()) return;
    setGameState(prev => {
      if (!prev) return prev;
      const post = prev.player.social.posts.find(p => p.id === postId);
      if (!post) return prev;

      const newRelationships = { ...prev.player.social.relationships };
      if (post.authorId !== 'player') {
        newRelationships[post.authorId] = Math.min(100, (newRelationships[post.authorId] || 0) + 2);
      }

      const newState = {
        ...prev,
        player: {
          ...prev.player,
          social: {
            ...prev.player.social,
            posts: prev.player.social.posts.map(p => 
              p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
            ),
            relationships: newRelationships
          }
        }
      };

      // Trigger NPC response if it's an NPC post
      if (post.authorId !== 'player') {
        const npc = [...SOCIAL_USERS, ...prev.dynamicNPCs].find(u => u.id === post.authorId);
        if (npc && Math.random() < 0.7) { // 70% chance to respond
          const wd = getDisplayWeekDay(prev.time.week);
          const gameContext = `当前时间：第${prev.time.year}年${prev.time.month}月第${wd.week}周第${wd.day}天。主角${prev.player.name}正在娱乐圈闯荡。`;
          loadGeminiModule().then(({ generateNPCResponse }) =>
            generateNPCResponse({
              name: npc.name,
              title: npc.title,
              personality: npc.personality || "普通"
            }, comment, gameContext, false)
          ).then(response => {
            setGameState(current => {
              if (!current) return current;
              return {
                ...current,
                player: {
                  ...current.player,
                  social: {
                    ...current.player.social,
                    posts: current.player.social.posts.map(p => 
                      p.id === postId ? { ...p, comments: [...p.comments, response] } : p
                    )
                  }
                }
              };
            });
          }).catch(() => {
            // ignore NPC reply failures to keep commenting responsive
          });
        }
      }

      return newState;
    });
  };

  const handleSendDM = (userId: string, content: string) => {
    if (!content.trim() || !gameState) return;
    
    const npc = [...SOCIAL_USERS, ...gameState.dynamicNPCs].find(u => u.id === userId);
    if (!npc) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'player',
      content: content,
      timestamp: { ...gameState.time }
    };

    setGameState(prev => {
      if (!prev) return prev;
      const conversations = [...prev.player.social.conversations];
      let convIndex = conversations.findIndex(c => c.userId === userId);
      
      if (convIndex === -1) {
        conversations.push({ userId, messages: [newMessage] });
      } else {
        conversations[convIndex] = {
          ...conversations[convIndex],
          messages: [...conversations[convIndex].messages, newMessage]
        };
      }

      const newRelationships = { ...prev.player.social.relationships };
      newRelationships[userId] = Math.min(100, (newRelationships[userId] || 0) + 5);

      const newState = {
        ...prev,
        player: {
          ...prev.player,
          social: {
            ...prev.player.social,
            conversations,
            relationships: newRelationships
          }
        }
      };

      // Trigger NPC response
      const wd = getDisplayWeekDay(prev.time.week);
      const gameContext = `当前时间：第${prev.time.year}年${prev.time.month}月第${wd.week}周第${wd.day}天。主角${prev.player.name}正在娱乐圈闯荡。`;
      loadGeminiModule().then(({ generateNPCResponse }) =>
        generateNPCResponse({
          name: npc.name,
          title: npc.title,
          personality: npc.personality || "普通"
        }, content, gameContext, true)
      ).then(response => {
        setGameState(current => {
          if (!current) return current;
          const currentConvs = [...current.player.social.conversations];
          const idx = currentConvs.findIndex(c => c.userId === userId);
          if (idx !== -1) {
            const reply: Message = {
              id: `msg_reply_${Date.now()}`,
              senderId: userId,
              content: response,
              timestamp: { ...current.time }
            };
            currentConvs[idx] = {
              ...currentConvs[idx],
              messages: [...currentConvs[idx].messages, reply]
            };
            return {
              ...current,
              player: {
                ...current.player,
                social: {
                  ...current.player.social,
                  conversations: currentConvs
                }
              }
            };
          }
          return current;
        });
      });

      return newState;
    });
  };

  const takeJob = async (job: Job) => {
    if (!gameState) return;
    const linkedEncounter = ENCOUNTER_CONFIG.find((cfg) => cfg.requiredJobId === job.id);
    if (linkedEncounter) {
      const linkedId = linkedEncounter.charId as CharacterId;
      if (characterStatuses[linkedId] === 'missed') {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                logs: [
                  ...prev.logs,
                  {
                    id: logIdCounter++,
                    text: '由于错过了特定时期，相关的人物机缘已消散。',
                    type: 'warning',
                  },
                ].slice(-50),
              }
            : prev,
        );
        return;
      }
    }

    const unmetReqs: string[] = [];
    const effectiveStats = getEffectiveStats(gameState.player);
    Object.keys(job.req).forEach(key => {
      const reqVal = job.req[key as keyof Stats];
      if (reqVal && effectiveStats[key as keyof Stats] < reqVal) {
        unmetReqs.push(`${getStatName(key)}需达到 ${reqVal}`);
      }
    });

    if (unmetReqs.length > 0) {
      setGameState(prev => {
        if (!prev) return prev;
        const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt('stats')}`, type: 'taunt' as const };
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `无法接取【${job.name}】：${unmetReqs.join('，')}。`, type: 'warning' }, tauntLog].slice(-50) };
      });
      return;
    }

    if (gameState.player.stamina < job.cost.stamina) {
      setGameState(prev => {
        if (!prev) return prev;
        const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt('stamina')}`, type: 'taunt' as const };
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `体力不足，无法接取【${job.name}】。`, type: 'error' }, tauntLog].slice(-50) };
      });
      return;
    }
    if (job.cost.money && gameState.player.money < job.cost.money) {
      setGameState(prev => {
        if (!prev) return prev;
        const tauntLog = { id: logIdCounter++, text: `【系统嘲讽】${getRandomTaunt('money')}`, type: 'taunt' as const };
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `金钱不足，无法接取【${job.name}】。`, type: 'error' }, tauntLog].slice(-50) };
      });
      return;
    }

    acceptJob(job.id);
    checkDailyEncounters();
    if (useGameStore.getState().activeStory) {
      return;
    }

    // Calculate rewards with company bonuses
    let moneyReward = job.reward.money;
    if (gameState.player.companyId === 'galaxy_media') {
      moneyReward = Math.round(moneyReward * 1.2);
    }
    
    let popularityReward = job.reward.popularity;
    if (gameState.player.companyId === 'independent') {
      popularityReward = Math.round(popularityReward * 1.2);
    }

    const company = COMPANIES.find(c => c.id === gameState.player.companyId) || COMPANIES[0];
    const commissionAmount = Math.round(moneyReward * company.commission);
    let finalMoneyReward = moneyReward - commissionAmount;
    const spaGlowActive = gameState.homeFlags?.spaGlowReady;
    let spaMoneyBonus = 0;
    let spaPopularityBonus = 0;
    if (spaGlowActive) {
      spaMoneyBonus = Math.round(finalMoneyReward * 0.15);
      spaPopularityBonus = Math.round(popularityReward * 0.15);
      finalMoneyReward += spaMoneyBonus;
      popularityReward += spaPopularityBonus;
    }

    const shouldShowStoryModal = Math.random() < JOB_STORY_MODAL_CHANCE;
    if (shouldShowStoryModal) {
      setStoryModal({
        isOpen: true,
        title: job.name,
        content: '正在生成剧情...',
        isLoading: true
      }).catch(() => {
        // ignore NPC DM failures to avoid blocking the local message send
      });
    }

    const competitors = SOCIAL_USERS.filter(u => u.stats);
    const randomRival = Math.random() < 0.3 ? competitors[Math.floor(Math.random() * competitors.length)] : undefined;

    if (shouldShowStoryModal) {
      try {
        const { generateStory, generateJobEvaluation } = await loadGeminiModule();
        const [story, evaluationData] = await Promise.all([
          generateStory(gameState.player.name, job.name, job.desc, effectiveStats, randomRival?.name),
          generateJobEvaluation(job.name, effectiveStats, gameState.player.name)
        ]);
        const equipped = gameState.player.equippedClothing
          ? CLOTHING_ITEMS.find((c) => c.id === gameState.player.equippedClothing) || null
          : null;
        const styleBonus = getOutfitStyleBonus(job, equipped);
        
        setStoryModal(prev => ({ 
          ...prev, 
          content: story, 
          isLoading: false 
        }));

        setJobResultModal({
          isOpen: true,
          jobName: job.name,
          evaluation: evaluationData.evaluation,
          rating: shiftRating(evaluationData.rating, styleBonus),
          rewards: { ...job.reward, money: finalMoneyReward, popularity: popularityReward }
        });
      } catch (error) {
        setStoryModal(prev => ({ ...prev, content: '剧情生成失败，但这并不影响你的星途。', isLoading: false }));
      }
    }

    setGameState(prev => {
      if (!prev) return prev;
      let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
      newPlayer.acceptedJobIds = Array.from(new Set([...(prev.player.acceptedJobIds ?? []), job.id]));
      newPlayer.stamina -= job.cost.stamina;
      const moodCost = getMoodCostByStamina(job.cost.stamina);
      if (moodCost > 0) {
        newPlayer.stats.mood = applyMoodDelta(newPlayer.stats.mood, -moodCost);
      }
      if (job.cost.money) newPlayer.money -= job.cost.money;

      let newLogs = [...prev.logs, { 
        id: logIdCounter++, 
        text: `完成通告【${job.name}】！获得 ${finalMoneyReward} 金钱${commissionAmount > 0 ? ` (已扣除公司抽成 ${commissionAmount})` : ''}，人气 +${popularityReward}。`, 
        type: 'success' 
      }];
      if (moodCost > 0) {
        newLogs.push({ id: logIdCounter++, text: `【${job.name}】: 心情 -${moodCost}。`, type: 'info' });
      }
      if (spaGlowActive) {
        newLogs.push({
          id: logIdCounter++,
          text: `【容光焕发】生效：额外金钱 +${spaMoneyBonus}，额外人气 +${spaPopularityBonus}。`,
          type: 'success',
        });
      }
      newPlayer.money += finalMoneyReward;
      newPlayer.stats.popularity += popularityReward;
      if (job.reward.stats) {
        newPlayer = applyEffect(newPlayer, job.reward.stats, newLogs, `${job.name}额外奖励`);
      }
      const equipped = prev.player.equippedClothing
        ? CLOTHING_ITEMS.find((c) => c.id === prev.player.equippedClothing) || null
        : null;
      const styleBonus = getOutfitStyleBonus(job, equipped);
      if (styleBonus > 0 && equipped?.styleTag) {
        newLogs.push({
          id: logIdCounter++,
          text: `穿搭风格【${equipped.styleTag}】与通告标签契合，评价等级 +${styleBonus}。`,
          type: 'success',
        });
      }

      const nextState = {
        ...prev,
        player: newPlayer,
        homeFlags: {
          ...prev.homeFlags,
          spaGlowReady: false,
        },
        logs: newLogs.slice(-50)
      };

      const finalState = advanceTime(nextState, job.time);
      
      triggerIndustryEvent(finalState, 'job');

      return finalState;
    });
    clearCurrentJob();
  };

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const generateAsyncStory = async (
    eventTitle: string,
    currentLineText: string,
    choice: StoryChoice,
    isCheck: boolean,
    isSuccess?: boolean
  ) => {
    if (!isCheck && (!choice.effect || !choice.text)) {
      return; // No AI story needed for choices without effects/text
    }

    const modalTitle = isCheck ? '竞争结果' : '剧情演绎';
    const loadingText = isCheck ? '正在生成竞争过程...' : '正在生成演绎结果...';

    setStoryModal({
      isOpen: true,
      title: modalTitle,
      content: loadingText,
      isLoading: true
    });

    try {
      // Use the ref to get the latest game state
      const currentState = gameStateRef.current;
      const choiceText = isCheck 
        ? choice.text + (isSuccess ? " (成功)" : " (失败)")
        : (choice.text || '');

      if (!choiceText) {
        setStoryModal(prev => ({ ...prev, isOpen: false }));
        return;
      }

      const { generateEventPerformance } = await loadGeminiModule();
      const performance = await generateEventPerformance(
        currentState.player.name,
        eventTitle,
        currentLineText,
        choiceText,
        currentState.player.stats
      );
      setStoryModal(prev => ({ ...prev, content: performance, isLoading: false }));
    } catch (error) {
      console.error("Error generating story:", error);
      setStoryModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleEventChoice = (choice?: StoryChoice) => {
    if (!gameState || !gameState.activeEvent) return;

    // --- Trigger asynchronous story generation without waiting ---
    const { id, lineIndex, isRandom, isDeadline, isEnding } = gameState.activeEvent;
    
    let lines: any[] = [];
    let eventTitle = '';
    if (isEnding) {
      const ending = ENDINGS.find(e => e.id === id);
      lines = ending?.lines || [];
      eventTitle = ending?.title || '结局';
    } else if (isDeadline) {
      const deadline = DEADLINES.find(d => `deadline_${d.year}_fail` === id);
      lines = deadline?.failLines || [];
      eventTitle = deadline?.title || '考核失败';
    } else if (isRandom) {
      const event = RANDOM_EVENTS.find(e => e.id === id);
      lines = event?.getLines(gameState.player) || [];
      eventTitle = event?.title || '随机事件';
    } else {
      const event = STORY_EVENTS.find(e => e.id === id);
      lines = event?.lines || [];
      eventTitle = event?.title || '剧情事件';
    }
      
    if (lines.length > 0) {
      const currentLineText = lines[lineIndex]?.text || '';
      if (choice) {
        if (choice.check) {
          const { stat, difficulty, rivalId } = choice.check;
          let targetDifficulty = difficulty;
          if (rivalId) {
            const rival = SOCIAL_USERS.find(u => u.id === rivalId);
            if (rival && rival.stats) targetDifficulty += (rival.stats[stat] || 0);
          }
          const playerStat = gameState.player.stats[stat];
          const isSuccess = playerStat >= targetDifficulty;
          generateAsyncStory(eventTitle, currentLineText, choice, true, isSuccess);
        } else if (choice.effect && choice.text) {
          generateAsyncStory(eventTitle, currentLineText, choice, false);
        }
      }
    }

    // --- Perform immediate state update ---

    setGameState(prev => {
      if (!prev || !prev.activeEvent) return prev;
      
      const { id, lineIndex, isRandom, isDeadline, isEnding } = prev.activeEvent;

      let newPlayer = { ...prev.player };
      let newLogs = [...prev.logs];
      let newCompletedEvents = [...prev.completedEvents];

      let lines: any[] = [];
      if (isEnding) {
        const ending = ENDINGS.find(e => e.id === id);
        lines = ending?.lines || [];
      } else if (isDeadline) {
        const deadline = DEADLINES.find(d => `deadline_${d.year}_fail` === id);
        lines = deadline?.failLines || [];
      } else if (isRandom) {
        const event = RANDOM_EVENTS.find(e => e.id === id);
        lines = event?.getLines(prev.player) || [];
      } else {
        const event = STORY_EVENTS.find(e => e.id === id);
        lines = event?.lines || [];
      }

      let nextLineIndex = lineIndex + 1;

      if (choice) {
        if (choice.check) {
          const { stat, difficulty, rivalId, successLine, failLine, successEffect, failEffect } = choice.check;
          let targetDifficulty = difficulty;
          if (rivalId) {
            const rival = SOCIAL_USERS.find(u => u.id === rivalId);
            if (rival && rival.stats) targetDifficulty += (rival.stats[stat] || 0);
          }
          const playerStat = prev.player.stats[stat];
          const isSuccess = playerStat >= targetDifficulty;

          if (isSuccess) {
            if (successEffect) newPlayer = applyEffect(newPlayer, successEffect, newLogs, '竞争胜利');
            if (choice.check.successEventId) newCompletedEvents.push(choice.check.successEventId);
            newLogs.push({ id: logIdCounter++, text: `竞争胜利！你的${getStatName(stat)}(${playerStat}) 战胜了对手(${targetDifficulty})。`, type: 'success' });
            nextLineIndex = successLine;
          } else {
            if (failEffect) newPlayer = applyEffect(newPlayer, failEffect, newLogs, '竞争失败');
            newLogs.push({ id: logIdCounter++, text: `竞争失败...你的${getStatName(stat)}(${playerStat}) 不敌对手(${targetDifficulty})。`, type: 'error' });
            nextLineIndex = failLine;
          }
        } else if (choice.effect) {
          newPlayer = applyEffect(newPlayer, choice.effect, newLogs, isRandom ? '随机事件' : '剧情奖励');
        }
        if (choice.nextLine !== undefined) {
          nextLineIndex = choice.nextLine;
        }
      }

      let currentLines = lines;
      if (isRandom) {
        const event = RANDOM_EVENTS.find(e => e.id === id);
        currentLines = event?.getLines(newPlayer) || [];
      }

      if (nextLineIndex >= currentLines.length) {
        if (isDeadline || isEnding) {
          return {
            ...prev,
            player: newPlayer,
            logs: newLogs.slice(-50),
            activeEvent: null,
            isGameOver: true
          };
        }

        const nextState = {
          ...prev,
          player: newPlayer,
          logs: newLogs.slice(-50),
          completedEvents: isRandom ? prev.completedEvents : [...newCompletedEvents, id],
          activeEvent: null
        };
        return checkEvents(nextState);
      } else {
        return {
          ...prev,
          player: newPlayer,
          logs: newLogs.slice(-50),
          activeEvent: { ...prev.activeEvent, lineIndex: nextLineIndex }
        };
      }
    });
  };

  const renderEventModal = () => {
    if (!gameState?.activeEvent) return null;
    
    const { id, lineIndex, isRandom, isDeadline, isEnding } = gameState.activeEvent;
    if (id === 'intro') return null;
    
    let lines: any[] = [];
    let title = '';

    if (isEnding) {
      const ending = ENDINGS.find(e => e.id === id);
      lines = ending?.lines || [];
      title = ending?.title || '结局';
    } else if (isDeadline) {
      const deadline = DEADLINES.find(d => `deadline_${d.year}_fail` === id);
      lines = deadline?.failLines || [];
      title = deadline?.title || '年度考核';
    } else if (isRandom) {
      const event = RANDOM_EVENTS.find(e => e.id === id);
      lines = event?.getLines(gameState.player) || [];
      title = event?.title || '';
    } else {
      const event = STORY_EVENTS.find(e => e.id === id);
      lines = event?.lines || [];
      title = event?.title || '';
    }
      
    if (lines.length === 0) return null;
    
    const line = lines[lineIndex];
    if (!line) return null;
    
    let speakerName = '';
    let speakerColor = 'text-zinc-900';
    let avatarSeed = '';
    
    if (line.speaker === 'player') {
      speakerName = gameState.player.name;
      speakerColor = 'text-indigo-600';
      avatarSeed = gameState.player.name;
    } else if (line.speaker && NPCS[line.speaker]) {
      speakerName = NPCS[line.speaker].name;
      speakerColor = NPCS[line.speaker].color;
      avatarSeed = NPCS[line.speaker].avatarSeed;
    }

    const emotion = line.emotion || 'normal';
    const mouthMap: Record<string, string> = {
      normal: 'default',
      happy: 'smile',
      angry: 'serious',
      sad: 'sad',
      surprised: 'scream'
    };
    
    const avatarUrl = (line.speaker === 'player' && gameState.player.avatar) 
      ? gameState.player.avatar 
      : avatarSeed 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&mouth=${mouthMap[emotion]}&backgroundColor=f8fafc` 
        : '';
    const isPlayerTurn = line.speaker === 'player' || Boolean(line.choices);
    const activePortrait = isPlayerTurn ? (playerProfile.portrait || gameState.player.avatar || playerProfile.avatar || '') : avatarUrl;
    const activeName = isPlayerTurn ? gameState.player.name : (speakerName || '旁白');

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/55 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-5xl w-full h-[78vh] overflow-hidden flex"
        >
          <div className="relative w-[36%] min-w-[240px] bg-zinc-100">
            {activePortrait ? (
              <motion.img
                key={activePortrait}
                src={activePortrait}
                alt={activeName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-400">暂无立绘</div>
            )}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-white" />
          </div>

          <div className="flex flex-1 flex-col">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/70">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {title}
              </h3>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="text-sm font-semibold text-zinc-500">{activeName}</div>
              <div className={`mt-1 text-base sm:text-lg font-bold ${isPlayerTurn ? 'text-indigo-600' : speakerColor}`}>
                当前回合
              </div>
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base sm:text-lg text-zinc-800 leading-relaxed">
                {line.text.replace(/\$\{player\.name\}/g, gameState.player.name)}
              </div>
            </div>

            <div className="p-5 bg-zinc-50/70 border-t border-zinc-100 flex flex-col gap-3">
            {line.choices ? (
              line.choices.map((choice, idx) => {
                let checkInfo = null;
                if (choice.check) {
                  const { stat, difficulty, rivalId } = choice.check;
                  let targetDifficulty = difficulty;
                  if (rivalId) {
                    const rival = SOCIAL_USERS.find(u => u.id === rivalId);
                    if (rival && rival.stats) {
                      targetDifficulty += (rival.stats[stat] || 0);
                    }
                  }
                  const playerStat = gameState.player.stats[stat];
                  
                  checkInfo = (
                    <div className="text-xs mt-1 flex items-center gap-2">
                      <span className="font-bold text-zinc-500">
                        {getStatName(stat)}: {playerStat} vs {targetDifficulty}
                      </span>
                      <span className={`font-bold ${playerStat >= targetDifficulty ? 'text-emerald-600' : 'text-red-500'}`}>
                        {playerStat >= targetDifficulty ? '胜算极大' : '胜算渺茫'}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleEventChoice(choice)}
                    className="w-full text-left px-5 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-white font-medium border border-zinc-900 shadow-sm"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span>{choice.text}</span>
                    </div>
                    {checkInfo}
                  </button>
                );
              })
            ) : (
              <button
                onClick={() => handleEventChoice()}
                className="w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-white font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                继续 <ChevronRight className="w-5 h-5" />
              </button>
            )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAvatarPickerModal = () => {
    const currentAvatar = playerProfile.avatar || playerAvatar || gameState?.player?.avatar || '';
    const currentPortrait = playerPortrait || playerProfile.portrait || '';

    return (
    <AnimatePresence>
      {isAvatarPickerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/28 p-4 backdrop-blur-md"
          onClick={() => setIsAvatarPickerOpen(false)}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="no-scrollbar w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[28px] border border-white/20 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">编辑人设图</h3>
              <button
                onClick={() => setIsAvatarPickerOpen(false)}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                关闭
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-white/15 bg-black/15 p-3">
              <div className="mb-2 text-xs font-bold text-zinc-100">当前预览（自动生成头像）</div>
              <div className="grid grid-cols-[72px_1fr] items-start gap-3">
                <div className="h-[72px] w-[72px] overflow-hidden rounded-full border border-white/20 bg-white/5">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt="avatar"
                      className="h-full w-full object-cover object-top"
                    />
                  ) : null}
                </div>
                <div className="no-scrollbar max-h-[42vh] w-full overflow-y-auto rounded-xl border border-white/20 bg-white/5 p-2">
                  {currentPortrait ? (
                    <img src={currentPortrait} alt="portrait" className="h-auto w-full object-contain" />
                  ) : (
                    <div className="flex h-20 items-center justify-center text-xs text-zinc-300">未选择人设图</div>
                  )}
                </div>
              </div>
            </div>

            {avatarPickerMode === 'menu' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setAvatarPickerMode('upload')}
                  className="rounded-2xl border border-white/15 bg-black/15 p-4 text-left transition hover:border-white/30 hover:bg-black/20"
                >
                  <div className="text-sm font-bold text-white">上传人设图</div>
                  <div className="mt-1 text-xs text-zinc-200">从本地选择图片，自动生成头像</div>
                </button>
                <button
                  onClick={() => setAvatarPickerMode('preset')}
                  className="rounded-2xl border border-white/15 bg-black/15 p-4 text-left transition hover:border-white/30 hover:bg-black/20"
                >
                  <div className="text-sm font-bold text-white">选择预留人设图</div>
                  <div className="mt-1 text-xs text-zinc-200">打开人设库，挑选预设立绘</div>
                </button>
              </div>
            )}

            {avatarPickerMode === 'upload' && (
              <div className="rounded-2xl border border-white/15 bg-black/15 p-3">
                <div className="mb-2 text-xs font-bold text-zinc-100">自行上传人设图</div>
                <label className="block w-full cursor-pointer rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-center text-xs font-medium text-white">
                  上传人设图文件
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        readImageFile(file, (portrait) => {
                          setCropImageSrc(portrait);
                          setCropImageLabel('自定义人设');
                          setCrop({ x: 0, y: 0 });
                          setCropZoom(1);
                          setCroppedAreaPixels(null);
                          setIsCropModalOpen(true);
                        });
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <button
                  onClick={() => setAvatarPickerMode('menu')}
                  className="mt-3 rounded-lg border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
                >
                  返回
                </button>
              </div>
            )}

            {avatarPickerMode === 'preset' && (
              <div className="rounded-2xl border border-white/15 bg-black/15 p-3">
                <div className="mb-2 text-xs font-bold text-zinc-100">选择预留人设图（rensheku）</div>
                <div className="no-scrollbar grid max-h-56 grid-cols-3 gap-2 overflow-auto pr-1">
                  {rensheLibrary.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCropImageSrc(item.src);
                        setCropImageLabel(item.label);
                        setCrop({ x: 0, y: 0 });
                        setCropZoom(1);
                        setCroppedAreaPixels(null);
                        setIsCropModalOpen(true);
                      }}
                      className={`aspect-[3/4] w-full rounded-lg border bg-white/5 p-1 transition ${
                        currentPortrait === item.src
                          ? 'border-white'
                          : 'border-white/25 hover:border-white/50'
                      }`}
                    >
                      <img src={item.src} alt={item.label} className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAvatarPickerMode('menu')}
                  className="mt-3 rounded-lg border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
                >
                  返回
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    );
  };

  const renderAvatarCropModal = () => (
    <AnimatePresence>
      {isCropModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/28 p-4 backdrop-blur-md"
          onClick={closeCropModal}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl rounded-[28px] border border-white/20 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">头像裁剪确认</h3>
              <button
                onClick={closeCropModal}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                取消
              </button>
            </div>
            <p className="mb-3 text-xs text-zinc-300">拖拽移动图片，滚轮/双指缩放，让脸部对齐圆框后再确认。</p>

            <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-white/20 bg-black/45">
              {cropImageSrc && (
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={cropZoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  zoomWithScroll
                  onCropChange={setCrop}
                  onZoomChange={setCropZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              )}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-100">缩放</span>
                <span className="text-xs text-zinc-300">{Math.round(cropZoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeCropModal}
                className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!cropImageSrc || !croppedAreaPixels || isCropSaving) return;
                  setIsCropSaving(true);
                  const avatar = await getCroppedAvatarFromArea(cropImageSrc, croppedAreaPixels);
                  await applyPortraitSelection(cropImageSrc, cropImageLabel, avatar);
                  closeCropModal();
                  setIsAvatarPickerOpen(false);
                }}
                className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-60"
                disabled={isCropSaving || !cropImageSrc || !croppedAreaPixels}
              >
                {isCropSaving ? '处理中...' : '确认裁剪'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!gameState) {
    return (
      <div className="relative min-h-screen w-screen overflow-hidden font-sans text-zinc-900">
        <div
          className={`absolute inset-0 flex h-full w-full transition-all duration-700 ${
            !isBgFocused ? 'blur-xl scale-[1.03]' : isCreating ? 'blur-lg' : 'blur-0'
          }`}
        >
          {LOGIN_CHARACTER_STRIPS.map((item) => (
            (() => {
              const isPriority = LOGIN_PRIORITY_IDS.has(item.id);
              const shouldLoadImage = isPriority || shouldLoadFullLoginGallery || expandedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="group relative min-w-0 overflow-hidden transition-[flex] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    flex: expandedId ? (expandedId === item.id ? 2.4 : 0.85) : 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShouldLoadFullLoginGallery(true);
                    setExpandedId((prev) => (prev === item.id ? null : item.id));
                    setHasExpandedOnce(true);
                  }}
                >
                  {shouldLoadImage ? (
                    <img
                      src={item.src}
                      alt={item.name}
                      className={`h-full w-full object-cover object-top transition duration-500 ease-out ${
                        expandedId
                          ? expandedId === item.id
                            ? 'brightness-[1.08] saturate-110 contrast-105'
                            : 'brightness-[0.92] saturate-95'
                          : 'brightness-[0.98] saturate-105'
                      }`}
                      loading={isPriority ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={isPriority ? 'high' : 'low'}
                      width={LOGIN_STRIP_IMAGE_WIDTH}
                      height={LOGIN_STRIP_IMAGE_HEIGHT}
                      sizes="(max-width: 640px) 42vw, 18vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(180deg,rgba(50,43,52,0.96)_0%,rgba(25,22,28,0.92)_100%)]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/16" />
                  {expandedId === item.id && (
                    <div className="pointer-events-none absolute left-6 top-6 text-lg font-semibold tracking-[0.18em] text-white/85 drop-shadow-lg">
                      {CHARACTER_NAMES[item.id as CharacterId] ?? item.name}
                    </div>
                  )}
                </button>
              );
            })()
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 transition-all duration-500" />

        <div className="pointer-events-none relative z-10 min-h-screen overflow-y-auto p-4">
          <div className="mx-auto flex min-h-screen w-full max-w-[1600px] items-center justify-center py-6">
            <AnimatePresence>
              {!isCreating && (expandedId === null || hasExpandedOnce) && (
                <motion.div
                  key="gallery-cta"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.55 }}
                  className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-6"
                >
                  <h1 className="-translate-y-10 text-5xl font-semibold tracking-widest text-white drop-shadow-lg sm:text-7xl">星梦之路</h1>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="pointer-events-auto h-16 w-80 rounded-2xl border border-white/80 bg-white/10 text-base font-semibold tracking-[0.5em] text-white shadow-[0_0_28px_rgba(255,255,255,0.22)] backdrop-blur-xl transition hover:bg-white/18"
                  >
                    开启旅程
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isCreating && (
                <motion.form
                  key="create-steps"
                  onSubmit={startGame}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-auto w-full max-w-[30rem]"
                >
                  <div
                    className="rounded-[28px] border border-white/20 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AnimatePresence mode="wait">
                      {currentStep === 1 ? (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="space-y-6"
                        >
                          <h2 className="text-center text-2xl font-semibold tracking-[0.08em] text-white">建立角色档案</h2>

                          <div className="rounded-2xl border border-white/15 bg-black/15 p-4">
                            <div className="mb-3 text-sm font-semibold text-zinc-100">人设图</div>
                            <button
                              type="button"
                              onClick={openAvatarPicker}
                              className="w-full rounded-xl border border-dashed border-white/30 bg-white/5 p-3 text-left transition hover:border-white/50"
                            >
                              <div className="grid grid-cols-[90px_1fr] gap-3 items-center">
                                <div className="h-[90px] w-[90px] overflow-hidden rounded-full border border-white/20 bg-zinc-100/10">
                                  {(playerAvatar || playerProfile.avatar) ? (
                                    <img src={playerAvatar || playerProfile.avatar} alt="头像预览" className="h-full w-full object-cover object-top" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-300">
                                      <Camera className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="h-24 w-full overflow-hidden rounded-xl border border-white/20 bg-zinc-100/10">
                                    {(playerPortrait || playerProfile.portrait) ? (
                                      <img src={playerPortrait || playerProfile.portrait} alt="人设预览" className="h-full w-full object-contain" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-300">
                                        点击选择预留人设图或上传人设图
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-xs text-zinc-300">上传人设图后会自动裁切生成头像</div>
                                </div>
                              </div>
                            </button>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <label className="block text-sm font-medium text-zinc-100">请输入你的艺名</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const surnames = ["林", "苏", "陆", "沈", "顾", "叶", "周", "秦", "江", "白", "萧", "唐", "慕容", "南宫", "东方", "上官", "司马", "诸葛", "赵", "关", "凌", "盛", "裴", "时", "傅"];
                                  const names = ["星辰", "清月", "云深", "曼妮", "北城", "诗涵", "慕白", "婉莹", "逸风", "若曦", "逸才", "雪见", "雪", "羽", "朔", "婉儿", "懿", "亮", "子龙", "云长", "之航", "予墨", "浅夏", "锦书", "青辞"];
                                  const randomName = surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
                                  setPlayerName(randomName);
                                }}
                                className="rounded-lg border border-white/30 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/10"
                              >
                                随机
                              </button>
                            </div>
                            <input
                              type="text"
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-white placeholder:text-zinc-300 focus:border-white/60 focus:outline-none"
                              placeholder="例如：林星辰"
                              required
                              maxLength={10}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="block mx-auto h-16 w-72 rounded-2xl border border-white/70 bg-white/5 text-base font-semibold tracking-[0.2em] text-white transition hover:bg-white/12"
                          >
                            下一步
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step-2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="space-y-6"
                        >
                          <h2 className="text-center text-2xl font-semibold tracking-[0.08em] text-white">选择出身与天赋</h2>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-zinc-100">出身与天赋</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
                                  const randomBonus = STARTING_BONUSES[Math.floor(Math.random() * STARTING_BONUSES.length)];
                                  const randomCompany = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
                                  setSelectedBackground(randomBg.id);
                                  setSelectedBonus(randomBonus.id);
                                  setSelectedCompany(randomCompany.id);
                                }}
                                className="h-12 rounded-xl border border-white/60 bg-white/5 px-4 text-xs font-semibold tracking-[0.15em] text-white transition hover:bg-white/12"
                              >
                                随机抽取
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 justify-items-center">
                              <div className="w-full max-w-[20rem] rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                <div className="mb-1 text-[10px] uppercase text-zinc-200/80">出身背景</div>
                                <div className="mb-2 text-lg font-semibold text-white">{BACKGROUNDS.find((b) => b.id === selectedBackground)?.name}</div>
                                <p className="mb-3 text-xs leading-relaxed text-zinc-200">{BACKGROUNDS.find((b) => b.id === selectedBackground)?.desc}</p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(BACKGROUNDS.find((b) => b.id === selectedBackground)?.bonus || {}).map(([key, val]) => (
                                    <span key={key} className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-100">
                                      {getStatName(key)} +{val}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full max-w-[20rem] rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                <div className="mb-1 text-[10px] uppercase text-zinc-200/80">初始天赋</div>
                                <div className="mb-2 text-lg font-semibold text-white">{STARTING_BONUSES.find((b) => b.id === selectedBonus)?.name}</div>
                                <p className="mb-3 text-xs leading-relaxed text-zinc-200">{STARTING_BONUSES.find((b) => b.id === selectedBonus)?.desc}</p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(STARTING_BONUSES.find((b) => b.id === selectedBonus)?.bonus || {}).map(([key, val]) => (
                                    <span key={key} className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-100">
                                      {getStatName(key)} +{val}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="col-span-2 flex justify-center">
                                <div className="flex h-[11.5rem] w-full max-w-[24rem] flex-col rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                  <div className="mb-1 text-[10px] uppercase text-zinc-200/80">签约公司</div>
                                  <div className="mb-2 text-lg font-semibold text-white">{COMPANIES.find((c) => c.id === selectedCompany)?.name}</div>
                                  <p className="mb-3 min-h-[3.25rem] text-xs leading-relaxed text-zinc-200">{COMPANIES.find((c) => c.id === selectedCompany)?.desc}</p>
                                  <div className="mt-auto text-xs text-zinc-100">福利：{COMPANIES.find((c) => c.id === selectedCompany)?.perk}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="h-14 w-64 rounded-2xl border border-white/60 bg-white/5 text-sm font-medium tracking-[0.2em] text-white transition hover:bg-white/12"
                            >
                              上一步
                            </button>
                            <button
                              type="submit"
                              className="h-14 w-72 rounded-2xl border border-white/80 bg-white/10 text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-white/16"
                            >
                              开启演艺生涯
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
        {renderAvatarPickerModal()}
        {renderAvatarCropModal()}
      </div>
    );
  }

  const { player, time, currentLocation, logs } = gameState;
  const hasDedicatedLocationPanel = [
    'company',
    'jobs',
    'city',
    'contacts',
    'schedule',
    'social',
    'wardrobe',
    'quests',
    'trophy',
  ].includes(currentLocation);
  const hasActionGrid = Boolean(ACTIONS[currentLocation]);
  const shouldRenderLocationFallback = !hasDedicatedLocationPanel && !hasActionGrid;
  const isHomeLocation = currentLocation === 'home';
  const effectiveStats = getEffectiveStats(player);
  const homeActions = ACTIONS['home'] || [];
  const canExecuteAction = (action: Action) =>
    player.stamina >= (action.cost.stamina || 0) && player.money >= (action.cost.money || 0);
  const homeTimeWd = getDisplayWeekDay(time.week);
  const homeTimeLabel = `第 ${time.year} 年 · ${time.month} 月 · 第 ${homeTimeWd.week} 周 · 第 ${homeTimeWd.day} 天`;
  const homeSuggestion = player.stamina < 25
    ? '体力偏低，优先安排恢复类行动。'
    : player.money < 3000
      ? '资金偏紧，先做低消耗行动稳住节奏。'
      : '状态良好，建议训练与曝光交替推进。';
  type HomeArrangeRoute = 'balanced' | 'recovery' | 'growth' | 'exposure' | 'income';
  const homeArrangeRoutes: Array<{ id: HomeArrangeRoute; name: string; desc: string }> = [
    { id: 'balanced', name: '均衡推进', desc: '训练与曝光兼顾，节奏平稳。' },
    { id: 'recovery', name: '恢复优先', desc: '优先安排恢复状态与低消耗行动。' },
    { id: 'growth', name: '训练成长', desc: '聚焦演技、唱功、舞蹈等成长属性。' },
    { id: 'exposure', name: '曝光热度', desc: '优先增加人气、魅力和剧情推进。' },
    { id: 'income', name: '资金稳健', desc: '优先低成本行动，控制支出压力。' },
  ];
  const getArrangeScore = (action: Action, route: HomeArrangeRoute): number => {
    const growthValue = (action.effect.acting || 0) + (action.effect.singing || 0) + (action.effect.dancing || 0);
    const exposureValue = (action.effect.popularity || 0) + (action.effect.charm || 0);
    const recoveryValue = Math.max(0, action.effect.stamina || 0);
    const costPenalty = (action.cost.stamina || 0) * 0.25 + (action.cost.money || 0) / 1200;
    if (route === 'recovery') return recoveryValue * 4 + growthValue * 0.3 + exposureValue * 0.3 - costPenalty;
    if (route === 'growth') return growthValue * 4 + exposureValue * 0.8 + recoveryValue * 0.6 - costPenalty;
    if (route === 'exposure') return exposureValue * 4 + growthValue * 0.6 + recoveryValue * 0.3 - costPenalty;
    if (route === 'income') return -(action.cost.money || 0) / 150 + exposureValue * 1.4 + growthValue * 0.8 + recoveryValue * 0.5;
    return growthValue * 1.8 + exposureValue * 1.8 + recoveryValue * 1.2 - costPenalty;
  };
  const smartArrangeHomeTasks = (route: HomeArrangeRoute = 'balanced') => {
    const candidates = homeActions
      .filter((action) => canExecuteAction(action))
      .sort((a, b) => {
        const aScore = getArrangeScore(a, route);
        const bScore = getArrangeScore(b, route);
        return bScore - aScore;
      })
      .slice(0, 3);
    candidates.forEach((action) => addToSchedule(action));
    setIsArrangeModalOpen(false);
  };
  const getHomeActionTags = (action: Action): string[] => {
    const bag = `${action.id}|${action.name}|${action.desc}`;
    const tags: string[] = [];
    if (/练|研读|训练|课|script|read|sing|dance/.test(bag)) tags.push('训练');
    if (/粉丝|社交|拜访|经纪|手写信/.test(bag)) tags.push('剧情');
    if (/spa|电竞|手写信|fan_letter|home_esports/.test(bag)) tags.push('稀有事件');
    if ((action.effect.popularity || 0) >= 2 || /社交媒体/.test(bag)) tags.push('高热度');
    if (action.cost.money > 0 && action.cost.money >= 2000) tags.push('推荐');
    if (tags.length === 0) tags.push('日常');
    return tags.slice(0, 2);
  };
  const getHomeTagClasses = (tag: string): string => {
    if (tag === '训练') return 'bg-blue-50/95 text-blue-700 border-blue-200/80 shadow-[0_2px_6px_rgba(59,130,246,0.12)]';
    if (tag === '剧情') return 'bg-violet-50/95 text-violet-700 border-violet-200/80 shadow-[0_2px_6px_rgba(139,92,246,0.12)]';
    if (tag === '推荐') return 'bg-emerald-50/95 text-emerald-700 border-emerald-200/80 shadow-[0_2px_6px_rgba(16,185,129,0.12)]';
    if (tag === '高热度') return 'bg-rose-50/95 text-rose-700 border-rose-200/80 shadow-[0_2px_6px_rgba(244,63,94,0.12)]';
    if (tag === '稀有事件') return 'bg-amber-50/95 text-amber-700 border-amber-200/80 shadow-[0_2px_6px_rgba(245,158,11,0.14)]';
    return 'bg-zinc-100/95 text-zinc-700 border-zinc-200/80 shadow-[0_1px_4px_rgba(24,24,27,0.08)]';
  };
  const getHomeAccentBarClass = (tags: string[]): string => {
    if (tags.includes('高热度')) return 'from-rose-300/80 via-orange-200/70 to-rose-50/20';
    if (tags.includes('推荐')) return 'from-emerald-300/80 via-emerald-100/70 to-emerald-50/20';
    if (tags.includes('训练')) return 'from-blue-300/80 via-sky-100/70 to-blue-50/20';
    if (tags.includes('剧情')) return 'from-violet-300/80 via-fuchsia-100/70 to-violet-50/20';
    if (tags.includes('稀有事件')) return 'from-amber-300/80 via-yellow-100/70 to-amber-50/20';
    return 'from-zinc-300/80 via-zinc-100/70 to-zinc-50/20';
  };
  const isStoryLocationSpot = (spot: (typeof LOCATION_BUFF_LIBRARY)[number]) =>
    /夜|深夜|旧|港湾|电台|放映|居酒|悬|雾|潮/.test(`${spot.name}|${spot.desc}`);
  const cityActions = ACTIONS['city'] || [];
  const citySpots = LOCATION_BUFF_LIBRARY;
  const cityExecutableCount = cityActions.filter((action) => canExecuteAction(action)).length + citySpots.filter((spot) => canExecuteAction(buildLocationBuffAction(spot))).length;
  const citySuggestion = player.stamina < 20
    ? '体力偏低，建议优先轻量外出或恢复型地点。'
    : player.money < 1000
      ? '资金偏紧，先走基础外出路线稳住节奏。'
      : '状态在线，建议基础外出与氛围地点交替推进。';
  const cityRouteHint = player.stamina >= 40 ? '基础外出 → 环境加成 → 剧情地点' : '基础外出 → 低消耗补给';
  const cityEnvHint = citySpots.some((spot) => spot.buff.popularityRate || spot.buff.charmRate)
    ? '今日可触发热度/魅力环境增益'
    : '今日以演技与恢复类环境为主';
  const cityPreferenceHint = effectiveStats.popularity >= effectiveStats.acting
    ? '当前偏好：曝光与热度增长'
    : '当前偏好：训练与稳定成长';
  const getCityTagClasses = (tag: string): string => {
    if (tag === '基础外出') return 'bg-slate-50 text-slate-700 border-slate-200 shadow-[0_2px_6px_rgba(71,85,105,0.12)]';
    if (tag === '营业消费') return 'bg-amber-50 text-amber-700 border-amber-200 shadow-[0_2px_6px_rgba(217,119,6,0.12)]';
    if (tag === '高消费') return 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_2px_6px_rgba(225,29,72,0.12)]';
    if (tag === '环境加成') return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_2px_6px_rgba(16,185,129,0.12)]';
    if (tag === '剧情地点') return 'bg-violet-50 text-violet-700 border-violet-200 shadow-[0_2px_6px_rgba(124,58,237,0.12)]';
    if (tag === '氛围') return 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-[0_2px_6px_rgba(8,145,178,0.12)]';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200 shadow-[0_1px_4px_rgba(24,24,27,0.08)]';
  };
  const getCityAccentBarClass = (tags: string[]): string => {
    if (tags.includes('剧情地点')) return 'from-violet-300/80 via-fuchsia-100/70 to-violet-50/20';
    if (tags.includes('高消费')) return 'from-rose-300/80 via-orange-200/70 to-rose-50/20';
    if (tags.includes('营业消费')) return 'from-amber-300/80 via-yellow-100/70 to-amber-50/20';
    if (tags.includes('环境加成')) return 'from-emerald-300/80 via-teal-100/70 to-emerald-50/20';
    return 'from-slate-300/80 via-zinc-100/70 to-slate-50/20';
  };
  const getCityActionTags = (action: Action): string[] => {
    if (action.id === 'busking' || action.id === 'park') return ['营业消费', '基础外出'];
    const tags: string[] = [];
    if (action.cost.money >= 1200) tags.push('高消费');
    else if (action.cost.money > 0 || (action.effect.money || 0) > 0 || (action.effect.charm || 0) > 0) tags.push('营业消费');
    tags.push('基础外出');
    return tags.slice(0, 2);
  };
  const filteredJobs = JOBS
    .filter((job) => {
      const tags = job.tags || [];
      const bag = `${job.name}|${job.type || ''}|${job.category || ''}|${tags.join('|')}|${job.id}`;

      const matchTab =
        activeJobTab === 'all'
          ? true
          : activeJobTab === 'acting'
            ? job.category === '影视'
            : activeJobTab === 'music'
              ? job.category === '音乐'
              : activeJobTab === 'gaming'
                ? /电竞|联赛|杯|对局|战队|冠军/.test(bag)
                : /商业|品牌|代言|联名|冠名|发布|访谈|峰会|广告/.test(bag) || job.category === '广告';

      if (!matchTab) return false;

      const keyword = jobSearchQuery.trim().toLowerCase();
      if (!keyword) return true;
      return job.name.toLowerCase().includes(keyword);
    })
    .sort((a, b) => {
      const canTakeNow = (job: Job) => {
        const isMet = Object.entries(job.req).every(([key, val]) => effectiveStats[key as keyof Stats] >= (val as number));
        const enoughStamina = player.stamina >= job.cost.stamina;
        const enoughMoney = !job.cost.money || player.money >= job.cost.money;
        const linkedEncounter = ENCOUNTER_CONFIG.find((cfg) => cfg.requiredJobId === job.id);
        const missed =
          !!linkedEncounter && characterStatuses[linkedEncounter.charId as CharacterId] === 'missed';
        return isMet && enoughStamina && enoughMoney && !missed;
      };

      const getPriority = (job: Job) => {
        if (canTakeNow(job)) return 0;
        const unlockedByStat = Object.entries(job.req).every(
          ([key, val]) => effectiveStats[key as keyof Stats] >= (val as number),
        );
        if (unlockedByStat) return 1;
        return 2;
      };

      const pa = getPriority(a);
      const pb = getPriority(b);
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name, 'zh-Hans-CN');
    });
  const wardrobeStyleTabs = ['全部', ...Array.from(new Set(CLOTHING_ITEMS.map((item) => item.styleTag).filter(Boolean))) as string[]];
  const filteredClothingItems = CLOTHING_ITEMS.filter((item) => {
    const isOwned = player.inventory.includes(item.id);
    const isEquipped = player.equippedClothing === item.id;

    if (wardrobeOwnershipFilter === '已拥有' && !isOwned) return false;
    if (wardrobeOwnershipFilter === '未拥有' && isOwned) return false;
    if (wardrobeOwnershipFilter === '已穿戴' && !isEquipped) return false;
    if (wardrobeStyleFilter !== '全部' && item.styleTag !== wardrobeStyleFilter) return false;
    return true;
  });
  const ownedClothingCount = CLOTHING_ITEMS.filter((item) => player.inventory.includes(item.id)).length;
  const unownedClothingCount = CLOTHING_ITEMS.length - ownedClothingCount;
  const equippedClothingCount = player.equippedClothing ? 1 : 0;
  const currentEquippedClothing = player.equippedClothing
    ? CLOTHING_ITEMS.find((item) => item.id === player.equippedClothing) || null
    : null;
  const plannedJob = gameState.plannedTasks.find((task): task is Job => 'req' in task && Boolean((task as Job).category));
  const acceptedJob = (player.acceptedJobIds ?? [])
    .map((id) => JOBS.find((job) => job.id === id))
    .find(Boolean) || null;
  const currentWardrobeJob = plannedJob || acceptedJob || null;
  const getWardrobeRecommendation = (
    job: Job | null,
    stats: Stats,
    equipped: Clothing | null,
  ): {
    suggestion: string;
    direction: string;
    weeklyStyle: string;
    gainHint: string;
    styles: string[];
    focusStats: Array<keyof Stats>;
  } => {
    const lowStats: Array<keyof Stats> = (['appearance', 'charm', 'acting', 'dancing', 'singing'] as Array<keyof Stats>)
      .sort((a, b) => (stats[a] || 0) - (stats[b] || 0));
    const weakestStat = lowStats[0];
    const equippedStyle = equipped?.styleTag || '未设定';

    if (job) {
      const bag = `${job.name}|${job.type || ''}|${job.category || ''}|${(job.tags || []).join('|')}`;
      let styles: string[] = ['现代', '优雅'];
      let focusStats: Array<keyof Stats> = ['charm', 'appearance'];
      let suggestion = '当前通告更偏镜头营业，建议优先选择甜美 / 优雅风格。';
      if (/广告|拍摄|代言|品牌/.test(bag)) {
        styles = ['甜美', '优雅'];
        focusStats = ['charm', 'appearance'];
        suggestion = '当前通告更偏镜头营业，建议优先选择甜美 / 优雅风格。';
      } else if (/舞台|演出|LIVE|打歌|唱跳/.test(bag)) {
        styles = ['舞台', '酷飒'];
        focusStats = ['dancing', 'charm'];
        suggestion = '当前通告需要舞台表现，建议优先舞台 / 酷飒风格。';
      } else if (/商务|采访|峰会|专访/.test(bag)) {
        styles = ['现代', '优雅'];
        focusStats = ['appearance', 'charm'];
        suggestion = '当前通告偏正式气质，建议优先现代 / 优雅风格。';
      } else if (/综艺|直播|团综|节目/.test(bag)) {
        styles = ['甜美', '现代'];
        focusStats = ['charm', 'appearance'];
        suggestion = '当前通告偏互动曝光，建议优先甜美 / 现代风格。';
      }

      return {
        suggestion,
        direction: `当前穿搭方向：${equippedStyle} · 优先 ${focusStats.map((k) => getStatName(k)).join(' / ')}`,
        weeklyStyle: `本周推荐风格：${styles.join(' / ')}`,
        gainHint: `搭配收益提示：优先补足 ${focusStats.map((k) => getStatName(k)).join(' + ')}，更易稳定完成通告。`,
        styles,
        focusStats,
      };
    }

    const fallbackMap: Record<string, { styles: string[]; focus: Array<keyof Stats>; text: string }> = {
      appearance: { styles: ['甜美', '现代'], focus: ['appearance', 'charm'], text: '你当前颜值偏弱，建议优先补足镜头亲和与外形加成。' },
      charm: { styles: ['甜美', '优雅'], focus: ['charm', 'appearance'], text: '你当前魅力偏弱，建议优先选择魅力加成高的服装。' },
      acting: { styles: ['优雅', '现代'], focus: ['acting', 'charm'], text: '你当前演技/气质偏弱，建议以优雅风格稳住表现。' },
      dancing: { styles: ['舞台', '酷飒'], focus: ['dancing', 'charm'], text: '你当前舞台表现偏弱，建议优先舞台 / 酷飒风。' },
      singing: { styles: ['优雅', '舞台'], focus: ['singing', 'charm'], text: '你当前唱功偏弱，建议选择稳态与表现力兼顾的搭配。' },
      popularity: { styles: ['甜美', '现代'], focus: ['charm', 'appearance'], text: '你当前人气增长偏慢，建议选择更有记忆点的搭配。' },
      mood: { styles: ['优雅', '甜美'], focus: ['charm'], text: '你当前状态波动较大，建议选择稳定气质向搭配。' },
      stamina: { styles: ['现代', '优雅'], focus: ['appearance'], text: '你当前体力压力较高，建议走低消耗稳态搭配。' },
      reputation: { styles: ['优雅', '现代'], focus: ['charm', 'acting'], text: '你当前声望提升偏慢，建议走稳重专业路线。' },
      money: { styles: ['现代', '甜美'], focus: ['charm'], text: '你当前资金紧张，建议优先已有服装的高收益搭配。' },
      maxStamina: { styles: ['现代', '优雅'], focus: ['appearance'], text: '建议以耐久稳定路线为主，控制搭配成本。' },
    };
    const fallback = fallbackMap[weakestStat as string] || fallbackMap.charm;
    return {
      suggestion: fallback.text,
      direction: `当前穿搭方向：${equippedStyle} · 重点补强 ${fallback.focus.map((k) => getStatName(k)).join(' / ')}`,
      weeklyStyle: `本周推荐风格：${fallback.styles.join(' / ')}`,
      gainHint: `搭配收益提示：优先带有 ${fallback.focus.map((k) => `${getStatName(k)}加成`).join('、')} 的服装。`,
      styles: fallback.styles,
      focusStats: fallback.focus,
    };
  };
  const wardrobeRecommendation = getWardrobeRecommendation(currentWardrobeJob, effectiveStats, currentEquippedClothing);
  const selectedCharacter = selectedCharacterId ? characters[selectedCharacterId] : null;
  const selectedCharacterProfile = selectedCharacterId ? CHARACTER_PROFILES[selectedCharacterId] : null;
  const selectedCharacterUnlocked = selectedCharacterId ? characterUnlocks[selectedCharacterId] : false;
  const normalizeStoryKey = (value: string) => value.replace(/[_-]/g, '').toLowerCase();
  type PanelEventItem = {
    kind: '初遇事件' | '特殊事件' | '关键抉择' | '羁绊终章';
    eventName?: string;
    sourceName?: string;
    panelTitle?: string;
    displayTitle?: string;
    id: string;
  };
  const getPanelEventTitle = (event: PanelEventItem) =>
    event.panelTitle || event.displayTitle || event.eventName || event.sourceName || event.kind;
  const selectedCharacterEvents: PanelEventItem[] = (() => {
    if (!selectedCharacterId || !selectedCharacterUnlocked) return [];
    const target = normalizeStoryKey(selectedCharacterId);
    const completedNormalized = new Set((gameState.completedEvents || []).map((id) => normalizeStoryKey(id)));
    const isCompleted = (id: string) => completedNormalized.has(normalizeStoryKey(id));
    const events: PanelEventItem[] = [];

    ENCOUNTER_CONFIG
      .filter((cfg) => normalizeStoryKey(cfg.charId) === target)
      .forEach((cfg) => {
        if (!isCompleted(cfg.storyId)) return;
        const story = getStoryById(cfg.storyId);
        events.push({
          id: cfg.storyId,
          kind: '初遇事件',
          eventName: cfg.storyId,
          sourceName: cfg.storyId,
          panelTitle: story?.scene,
        });
      });

    SPECIAL_EVENT_CONFIG
      .filter((cfg) => normalizeStoryKey(cfg.charId) === target)
      .forEach((cfg) => {
        if (!isCompleted(cfg.storyId)) return;
        const story = getStoryById(cfg.storyId);
        const kind: PanelEventItem['kind'] =
          /event4$/i.test(cfg.storyId)
            ? '羁绊终章'
            : /event3$/i.test(cfg.storyId)
              ? '关键抉择'
              : '特殊事件';
        events.push({
          id: cfg.storyId,
          kind,
          eventName: cfg.storyId,
          sourceName: cfg.storyId,
          panelTitle: story?.scene,
        });
      });

    const endingIds = (gameState.completedEvents || []).filter((id) => {
      const normalized = normalizeStoryKey(id);
      return normalized.includes(target) && normalized.includes('ending');
    });
    endingIds.forEach((id) => {
      const story = getStoryById(id);
      events.push({
        id,
        kind: '羁绊终章',
        eventName: id,
        sourceName: id,
        panelTitle: story?.scene,
      });
    });

    const eventOrder: Record<PanelEventItem['kind'], number> = {
      初遇事件: 1,
      特殊事件: 2,
      关键抉择: 3,
      羁绊终章: 4,
    };
    return events
      .filter((event, index, arr) => arr.findIndex((item) => item.id === event.id) === index)
      .sort((a, b) => eventOrder[a.kind] - eventOrder[b.kind]);
  })();
  const liuFavor = characters.liu_mengyao?.favor ?? 0;
  const pendingTasksWithTarget = PHASE_TASKS.filter(
    (task) => !player.submittedPhaseTasks.includes(task.id) && !!task.targetJobId,
  );
  const pendingTaskByJobId = pendingTasksWithTarget.reduce((acc, task) => {
    if (task.targetJobId && !acc[task.targetJobId]) acc[task.targetJobId] = task;
    return acc;
  }, {} as Record<string, (typeof PHASE_TASKS)[number]>);
  const completedTaskIdSet = new Set(player.submittedPhaseTasks);
  const keywordTaskHonors = PHASE_TASKS
    .filter((task) => completedTaskIdSet.has(task.id) && HONOR_KEYWORDS.some((kw) => task.title.includes(kw)))
    .map((task) => task.title);
  const milestoneTaskHonors = Object.entries(TASK_MILESTONE_REWARDS).flatMap(([domain, milestone]) => {
    const completedInDomain = PHASE_TASKS.filter(
      (task) => task.domain === domain && completedTaskIdSet.has(task.id),
    );
    if (completedInDomain.length < milestone.requiredCount) return [];
    const milestoneTask = completedInDomain[milestone.requiredCount - 1];
    return milestoneTask ? [milestoneTask.title] : [];
  });
  const taskHonors = Array.from(new Set([...(player.honors ?? []), ...keywordTaskHonors, ...milestoneTaskHonors]));

  if (gameState.isGameOver) {
    const ending = ENDINGS.find(e => e.condition(gameState.player, gameState.completedAchievements)) || ENDINGS[ENDINGS.length - 1];
    
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-zinc-800 p-10 rounded-3xl border border-zinc-700 shadow-2xl text-center"
        >
          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-amber-500 mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">演艺生涯结束</h1>
          <div className="text-amber-500 font-bold text-lg sm:text-xl mb-6 uppercase tracking-widest">
            最终评价：{ending.title}
          </div>
          <p className="text-zinc-400 text-base sm:text-lg mb-10 leading-relaxed">
            {ending.desc}
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {Object.entries(effectiveStats).map(([key, val]) => (
              <div key={key} className="bg-zinc-700/50 p-3 rounded-xl border border-zinc-600">
                <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">{getStatName(key)}</div>
                <div className="text-xl font-mono font-bold">{val}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-white text-zinc-900 hover:bg-zinc-100 font-bold py-4 px-10 rounded-2xl transition-all transform hover:scale-105"
          >
            重新开始
          </button>
        </motion.div>
      </div>
    );
  }

  const FlashNumber = ({
    value,
    className,
    formatter,
  }: {
    value: number;
    className?: string;
    formatter?: (v: number) => string;
  }) => {
    const [isFlash, setIsFlash] = useState(false);
    const prevRef = useRef(value);

    useEffect(() => {
      if (value > prevRef.current) {
        setIsFlash(true);
        const tid = window.setTimeout(() => setIsFlash(false), 720);
        prevRef.current = value;
        return () => window.clearTimeout(tid);
      }
      prevRef.current = value;
      return undefined;
    }, [value]);

    return (
      <span className={`${className || ''} ${isFlash ? 'stat-up-flash' : ''}`}>
        {formatter ? formatter(value) : value}
      </span>
    );
  };

  const StatRow = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-50 transition-colors group">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 transition-colors ${colorClass}`} />
        <span className="text-sm text-zinc-600 font-medium group-hover:text-zinc-900 transition-colors">{label}</span>
      </div>
      <FlashNumber value={Number(value) || 0} className="font-mono text-sm font-bold text-zinc-900" />
    </div>
  );

  const keepSidebarVisible = isMobileLandscapeViewport;

  return (
    <div
      className={`main-cinematic-lite fixed inset-0 text-zinc-900 font-sans overflow-hidden ${
        keepSidebarVisible ? 'flex flex-row' : 'flex flex-col md:flex-row'
      }`}
      style={mainBackgroundStyle}
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && !keepSidebarVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar - Player Stats */}
      <aside className={`
        ${keepSidebarVisible ? 'w-[224px]' : 'w-72'} min-h-0 bg-white/10 backdrop-blur-xl border-r border-white/15 flex flex-col shrink-0
        ${keepSidebarVisible ? 'relative h-full z-10' : 'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:h-full'}
        ${keepSidebarVisible || isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`border-b border-zinc-100 ${keepSidebarVisible ? 'p-3' : 'p-4 lg:p-5'}`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="decorative-outline text-[11px] font-bold uppercase tracking-widest text-zinc-400">玩家档案</h3>
            <button onClick={() => setIsSidebarOpen(false)} className={`p-2 text-zinc-400 hover:text-zinc-900 md:hidden ${keepSidebarVisible ? 'hidden' : ''}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={openAvatarPicker}
                className="h-14 w-14 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:scale-[1.02]"
                title="编辑人设图"
              >
                {(playerProfile.avatar || player.avatar || playerProfile.portrait) ? (
                  <SafeImage
                    src={playerProfile.avatar || player.avatar || playerProfile.portrait}
                    alt={playerProfile.name || player.name}
                    className="h-full w-full object-cover object-top"
                    fallbackClassName="bg-white"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tracking-tight text-zinc-900">{playerProfile.name || player.name}</h2>
                <div className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                  {playerProfile.label || '冷静主角'}
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    <Trophy className="w-2.5 h-2.5 text-zinc-400" />
                    <span>{getPlayerLevel(player)}</span>
                    <span className="mx-1 opacity-30">|</span>
                    <span className={player.reputation >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {player.reputation >= 80
                        ? "德艺双馨"
                        : player.reputation >= 40
                          ? "正能量偶像"
                          : player.reputation >= 10
                            ? "口碑良好"
                            : player.reputation > -10
                              ? "平平无奇"
                              : player.reputation > -40
                                ? "争议艺人"
                                : player.reputation > -80
                                  ? "黑红顶流"
                                  : "劣迹艺人"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600">
                    <Building2 className="w-2.5 h-2.5" />
                    <span>{COMPANIES.find(c => c.id === player.companyId)?.name}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={openAvatarPicker}
              className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              编辑人设图
            </button>
          </div>
        </div>

        <div className={`${keepSidebarVisible ? 'p-3' : 'p-4 lg:p-5'} border-b border-zinc-100`}>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500 font-medium tracking-wide">体力</span>
                <span className="font-mono font-medium text-zinc-900">
                  <FlashNumber value={player.stamina} />
                  /{player.maxStamina}
                </span>
              </div>
              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-900 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(player.stamina / player.maxStamina) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium tracking-wide">资金</span>
              <FlashNumber
                value={player.money}
                className="font-mono text-zinc-900 font-bold text-base"
                formatter={(v) => `￥${v.toLocaleString()}`}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible no-scrollbar">
          <div className={keepSidebarVisible ? 'p-3' : 'p-4 lg:p-5'}>
            <div className="mb-6 relative">
              <button 
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2 hover:text-zinc-600 transition-colors"
              >
                <span className="decorative-outline">导航</span>
                {isNavExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
                {isNavExpanded && (
                  <nav className="space-y-1 overflow-hidden">
                    {LOCATIONS.map(loc => {
                      const Icon = loc.id === 'home' ? Home : 
                                   loc.id === 'company' ? Building2 : 
                                   loc.id === 'city' ? Map : 
                                   loc.id === 'jobs' ? Briefcase : 
                                   loc.id === 'social' || loc.id === 'contacts' ? Smartphone :
                                   loc.id === 'schedule' ? ListTodo : 
                                   loc.id === 'wardrobe' ? Shirt : 
                                   loc.id === 'quests' ? ClipboardList : Trophy;
                      return (
                        <button
                          key={loc.id}
                          onClick={() => {
                            setIsCharacterPanelOpen(false);
                            setSelectedCharacterId(null);
                            setGameState(prev => prev ? { ...prev, currentLocation: loc.id } : prev);
                            if (gameState) {
                              syncEncounterContext({
                                year: gameState.time.year,
                                month: gameState.time.month,
                                week: gameState.time.week,
                                location: loc.name,
                              });
                              checkDailyEncounters();
                            }
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group mb-1 ${
                            !isCharacterPanelOpen && currentLocation === loc.id 
                              ? 'sidebar-active-glass text-white' 
                              : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <Icon className={`w-5 h-5 transition-colors ${currentLocation === loc.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'}`} />
                            <span className="tracking-wide text-[15px]">{loc.name}</span>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setIsCharacterPanelOpen(true);
                        setSelectedCharacterId(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group mb-1 ${
                        isCharacterPanelOpen
                          ? 'sidebar-active-glass text-white'
                          : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <User className={`w-5 h-5 transition-colors ${isCharacterPanelOpen ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'}`} />
                        <span className="tracking-wide text-[15px]">角色栏</span>
                      </div>
                    </button>
                  </nav>
                )}
            </div>

            <div>
              <button 
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2 hover:text-zinc-600 transition-colors"
              >
                <span className="decorative-outline">能力属性</span>
                {isStatsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
                {isStatsExpanded && (
                  <div className="space-y-0 overflow-hidden">
                    <StatRow icon={Sparkles} label="颜值" value={effectiveStats.appearance} colorClass="text-pink-400 group-hover:text-pink-500" />
                    <StatRow icon={Video} label="演技" value={effectiveStats.acting} colorClass="text-purple-400 group-hover:text-purple-500" />
                    <StatRow icon={Music} label="唱功" value={effectiveStats.singing} colorClass="text-blue-400 group-hover:text-blue-500" />
                    <StatRow icon={Activity} label="舞蹈" value={effectiveStats.dancing} colorClass="text-emerald-400 group-hover:text-emerald-500" />
                    <StatRow icon={Heart} label="魅力" value={effectiveStats.charm} colorClass="text-rose-400 group-hover:text-rose-500" />
                    <StatRow icon={Smile} label="心情" value={effectiveStats.mood} colorClass="text-orange-400 group-hover:text-orange-500" />
                    <div className="pt-1.5 mt-1.5 border-t border-zinc-100">
                      <StatRow icon={Star} label="人气" value={effectiveStats.popularity} colorClass="text-amber-400 group-hover:text-amber-500" />
                      <StatRow icon={Activity} label="声望" value={player.reputation} colorClass={player.reputation >= 0 ? "text-emerald-400 group-hover:text-emerald-500" : "text-red-400 group-hover:text-red-500"} />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col h-full overflow-hidden relative bg-transparent">

        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`md:hidden absolute top-3 left-3 z-20 p-2 rounded-lg bg-black/35 backdrop-blur-md border border-white/20 text-zinc-100 ${keepSidebarVisible ? 'hidden' : ''}`}
          aria-label="打开导航"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Action Area */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${isMobileLandscapeViewport ? 'p-2.5' : 'p-3 sm:p-4 lg:p-6'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentLocation}-${isCharacterPanelOpen ? 'characters' : 'world'}-${selectedCharacterId ?? 'list'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={isMobileLandscapeViewport ? 'w-full' : 'max-w-6xl mx-auto'}
            >
              {isCharacterPanelOpen ? (
                <>
                  {!selectedCharacterId ? (
                    <div className="space-y-5">
                      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">角色栏</h2>
                      <div className={`grid gap-4 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 xl:grid-cols-3'}`}>
                        {CHARACTER_SECTIONS.map((section) => (
                          <section key={section.title} className="rounded-3xl border border-zinc-200 bg-white p-4">
                            <h3 className="mb-3 text-lg font-bold text-zinc-400">{section.title}</h3>
                            <div className="grid grid-cols-2 gap-3">
                              {section.ids.map((characterId) => {
                                const unlocked = characterUnlocks[characterId];
                                const status = characterStatuses[characterId];
                                const missed = status === 'missed';
                                return (
                                  <div key={characterId} className="relative">
                                    <button
                                      type="button"
                                      disabled={!unlocked}
                                      onClick={() => {
                                        if (!unlocked) return;
                                        setSelectedCharacterId(characterId);
                                      }}
                                      className={unlocked ? 'w-full text-left' : 'w-full cursor-not-allowed text-left'}
                                    >
                                      <Suspense fallback={<div className="h-[128px] rounded-2xl bg-zinc-100/70" />}>
                                        <CharacterCard characterId={characterId} minimal />
                                      </Suspense>
                                    </button>
                                    {missed && (
                                      <span className="absolute left-2 top-2 rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                                        已错过
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-zinc-400">角色档案</div>
                          <h2 className="text-2xl font-bold text-zinc-900">{CHARACTER_NAMES[selectedCharacterId]}</h2>
                        </div>
                        <button
                          onClick={() => setSelectedCharacterId(null)}
                          className="px-4 py-1.5 rounded-full border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100"
                        >
                          返回
                        </button>
                      </div>

                      <div className={`grid items-start gap-3 ${isMobileLandscapeViewport ? 'grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1 lg:grid-cols-[320px_1fr]'}`}>
                        <div className="self-start bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                          <div className="bg-zinc-100">
                            {selectedCharacterId && CHARACTER_PROFILE_IMAGES[selectedCharacterId] ? (
                              <img
                                src={CHARACTER_PROFILE_IMAGES[selectedCharacterId]}
                                alt={CHARACTER_NAMES[selectedCharacterId]}
                                className={`block w-full h-auto ${selectedCharacterUnlocked ? '' : 'grayscale opacity-60'}`}
                              />
                            ) : (
                              <div className="h-[320px] w-full bg-zinc-200" />
                            )}
                          </div>
                          {selectedCharacter && (
                            <div className="p-3 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-zinc-800">好感度 <span className="text-xl font-black text-zinc-900">{selectedCharacter.favor}</span></div>
                                <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold shadow-[0_2px_8px_rgba(245,158,11,0.14)]">
                                  {STAGE_LABELS[selectedCharacter.stage] || selectedCharacter.stage}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.45)]" style={{ width: `${selectedCharacter.favor}%` }} />
                                </div>
                                <div className="text-[10px] font-semibold text-zinc-500">关系进度 {Math.max(0, Math.min(100, selectedCharacter.favor))}%</div>
                              </div>
                            </div>
                          )}

                          <div className="border-t border-zinc-200 p-3">
                            <h3 className="text-sm font-bold text-zinc-900 mb-2">核心台词</h3>
                            <div className="space-y-2 text-xs text-zinc-700 leading-5">
                              {selectedCharacterProfile?.coreQuotes?.slice(0, 3).map((quote, idx) => (
                                <p key={idx} className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                                  “{quote}”
                                </p>
                              ))}
                              {!selectedCharacterProfile?.coreQuotes?.length && (
                                <p className="text-zinc-500">暂无台词</p>
                              )}
                            </div>
                          </div>

                        </div>

                        <div className={`space-y-3 ${isMobileLandscapeViewport ? 'min-w-0' : ''}`}>
                          {selectedCharacterProfile?.surface && (
                            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                              <h3 className="text-base font-bold text-zinc-900 mb-2">表面人设</h3>
                              {selectedCharacterProfile.tags?.length ? (
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {selectedCharacterProfile.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              <p className="max-h-28 overflow-auto text-sm font-medium text-zinc-700 leading-7 tracking-[0.01em]">{selectedCharacterProfile.surface}</p>
                            </div>
                          )}

                          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                            <h3 className="text-base font-bold text-zinc-900 mb-2">特殊事件</h3>
                            <div className="space-y-2">
                              {selectedCharacterEvents.length > 0 ? (
                                selectedCharacterEvents.map((event) => (
                                  <div key={event.id} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                                    <div className="mb-1 flex items-center gap-2">
                                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                        event.kind === '初遇事件'
                                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                                          : event.kind === '特殊事件'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : event.kind === '关键抉择'
                                              ? 'border-violet-200 bg-violet-50 text-violet-700'
                                              : 'border-rose-200 bg-rose-50 text-rose-700'
                                      }`}>
                                        {event.kind}
                                      </span>
                                    </div>
                                    <div className="text-sm font-semibold text-zinc-800 leading-6">{getPanelEventTitle(event)}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm font-medium text-zinc-500">暂无已解锁事件</div>
                              )}
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                            <h3 className="text-base font-bold text-zinc-900 mb-2">角色属性</h3>
                            {selectedCharacter ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><div className="text-xs font-semibold text-zinc-700">好感度</div><div className="text-2xl font-black text-zinc-900">{selectedCharacter.favor}</div></div>
                                <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3"><div className="text-xs font-semibold text-zinc-700">信任</div><div className="text-2xl font-black text-zinc-900">{selectedCharacter.trust}</div></div>
                                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3"><div className="text-xs font-semibold text-zinc-700">偏执度</div><div className="text-2xl font-black text-zinc-900">{selectedCharacter.paranoia}</div></div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"><div className="text-xs font-semibold text-zinc-700">占有欲</div><div className="text-2xl font-black text-zinc-900">{selectedCharacter.possessiveness}</div></div>
                                <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3"><div className="text-xs font-semibold text-zinc-700">不安感</div><div className="text-2xl font-black text-zinc-900">{selectedCharacter.insecurity}</div></div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-3 tracking-tight">
                    {LOCATIONS.find(l => l.id === currentLocation)?.name ?? '当前区域'}
                  </h2>

              {isHomeLocation && (
                <div className="mb-4 rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/70 p-4 shadow-[0_10px_24px_-16px_rgba(24,24,27,0.28)]">
                  <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-zinc-900">我的小屋</h3>
                        <p className="mt-1 text-[11px] font-medium tracking-wide text-zinc-400">{homeTimeLabel}</p>
                        <div className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-[0_2px_8px_-6px_rgba(24,24,27,0.35)]">
                          今日建议
                        </div>
                        <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{homeSuggestion}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsArrangeModalOpen(true)}
                          className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-[0_10px_18px_-12px_rgba(24,24,27,0.9)] transition-all hover:-translate-y-0.5 hover:bg-zinc-800"
                        >
                          智能安排行程
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`mt-3 grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
                    <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                      <div className="text-[11px] font-semibold tracking-wide text-zinc-500">当前状态摘要</div>
                      <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">体力 {player.stamina}/{player.maxStamina} · 心情 {effectiveStats.mood}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                      <div className="text-[11px] font-semibold tracking-wide text-zinc-500">今日资源提醒</div>
                      <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">资金 ￥{player.money.toLocaleString()} · 行程 {gameState.plannedTasks.length}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                      <div className="text-[11px] font-semibold tracking-wide text-zinc-500">推荐路线</div>
                      <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{player.stamina >= 40 ? '训练强化 → 曝光增长' : '恢复状态 → 稳定推进'}</div>
                    </div>
                  </div>
                </div>
              )}

              {currentLocation === 'company' && (
                <Suspense fallback={<div className="h-[420px] rounded-3xl border border-zinc-200 bg-white/80" />}>
                  <Agency
                    player={player}
                    time={time}
                    effectiveStats={effectiveStats}
                    companyState={companyState}
                    getStatName={getStatName}
                    formatDisplayTime={formatDisplayTime}
                    onUpgradeFacility={upgradeFacility}
                    onPerformAction={performAction}
                    onAddToSchedule={addToSchedule}
                    onSwitchCompany={switchCompany}
                    onCreateBossMode={createBossCompany}
                    onHireStaff={hireStaff}
                    onFireStaff={fireStaff}
                  />
                </Suspense>
              )}

              {currentLocation === 'home' && ACTIONS[currentLocation] && (
                <div className={`grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {ACTIONS[currentLocation].map(action => {
                    const tags = getHomeActionTags(action);
                    const accentClass = getHomeAccentBarClass(tags);
                    const staminaValue = action.cost.stamina > 0 ? `-${action.cost.stamina}` : '0';
                    const moneyValue = action.cost.money > 0 ? `-${action.cost.money}` : '0';
                    const gainText = action.effect.popularity
                      ? `人气 +${action.effect.popularity}`
                      : action.effect.charm
                        ? `魅力 +${action.effect.charm}`
                        : action.effect.acting
                          ? `演技 +${action.effect.acting}`
                          : action.effect.singing
                            ? `唱功 +${action.effect.singing}`
                            : action.effect.dancing
                              ? `舞蹈 +${action.effect.dancing}`
                              : '状态调整';
                    return (
                      <div
                        key={action.id}
                        className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-[0_12px_22px_-18px_rgba(24,24,27,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-20px_rgba(24,24,27,0.55)] hover:border-zinc-300"
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => (
                              <span
                                key={`${action.id}_${tag}`}
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getHomeTagClasses(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">耗时 {action.time} 天</span>
                        </div>
                        <h3 className="mb-1 text-lg font-black tracking-tight text-zinc-900">{action.name}</h3>
                        <p className="mb-2.5 min-h-[2.25rem] text-xs leading-relaxed text-zinc-500">{action.desc}</p>
                        <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                          <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">体力 / 状态</div>
                            <div className="mt-1 text-base font-black leading-none text-zinc-900">体力 {staminaValue}</div>
                            <div className="mt-1 text-[11px] font-medium text-zinc-500">状态：{action.effect.stamina && action.effect.stamina > 0 ? `恢复 +${action.effect.stamina}` : '常规'}</div>
                          </div>
                          <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">金钱 / 收益</div>
                            <div className="mt-1 text-base font-black leading-none text-zinc-900">金钱 {moneyValue}</div>
                            <div className="mt-1 text-[11px] font-medium text-zinc-500">收益：{gainText}</div>
                          </div>
                        </div>
                        <div className="mt-auto flex gap-1.5">
                          <button onClick={() => performAction(action)} className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800">执行</button>
                          <button onClick={() => addToSchedule(action)} className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50">加入行程</button>
                        </div>
                        <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${accentClass}`} />
                      </div>
                    );
                  })}
                </div>
              )}

              {currentLocation !== 'home' && currentLocation !== 'jobs' && currentLocation !== 'company' && currentLocation !== 'city' && currentLocation !== 'schedule' && currentLocation !== 'wardrobe' && currentLocation !== 'trophy' && currentLocation !== 'quests' && ACTIONS[currentLocation] && (
                <div className={`grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {ACTIONS[currentLocation].map(action => (
                    <div
                      key={action.id}
                      className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all duration-300 group flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-bold text-zinc-900">{action.name}</h3>
                        <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-medium">耗时 {action.time} 天</span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-3 leading-relaxed flex-1">{action.desc}</p>
                      <div className="flex items-center gap-2 text-xs font-medium mb-3">
                        {action.cost.stamina > 0 && (
                          <span className="flex items-center gap-1 text-zinc-600"><Battery className="w-3 h-3 text-zinc-400"/> -{action.cost.stamina}</span>
                        )}
                        {action.cost.money > 0 && (
                          <span className="flex items-center gap-1 text-zinc-600"><Coins className="w-3 h-3 text-zinc-400"/> -{action.cost.money}</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-auto">
                        <button onClick={() => performAction(action)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-1.5 rounded text-xs font-bold transition-colors shadow-sm">执行</button>
                        <button onClick={() => addToSchedule(action)} className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 py-1.5 rounded text-xs font-bold transition-colors">加入行程</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentLocation === 'jobs' && (
                <div className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  <div className="shrink-0 border-b border-zinc-100 p-3 sm:p-4">
                    <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-zinc-400">赛道分类</div>
                    <div className="mb-3 -mx-1 overflow-x-auto">
                      <div className="flex w-max gap-2 px-1">
                        {JOB_TRACK_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveJobTab(tab.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              activeJobTab === tab.id
                                ? 'bg-zinc-900 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      value={jobSearchQuery}
                      onChange={(e) => setJobSearchQuery(e.target.value)}
                      placeholder="搜索通告标题..."
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-300"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {filteredJobs.map(job => {
                    const isMet = Object.entries(job.req).every(([key, val]) => effectiveStats[key as keyof Stats] >= (val as number));
                    const linkedTask = pendingTaskByJobId[job.id];
                    const isAcceptedForTask = !!linkedTask && (player.acceptedJobIds ?? []).includes(job.id);
                    
                    return (
                      <div key={job.id} className={`bg-white rounded-2xl border ${isMet ? 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm' : 'border-zinc-100 opacity-60'} ${isMobileLandscapeViewport ? 'grid grid-cols-[minmax(0,1fr)_88px] items-start gap-3 p-3' : 'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'} transition-all duration-300`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-zinc-900">{job.name}</h3>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{job.category}</span>
                            <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-medium">耗时 {job.time} 天</span>
                            {linkedTask && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAcceptedForTask ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {isAcceptedForTask ? '任务已激活' : '任务目标'}
                              </span>
                            )}
                          </div>
                          {linkedTask && (
                            <div className={`mb-1 text-xs font-semibold ${isAcceptedForTask ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isAcceptedForTask ? `已关联任务：${linkedTask.title}` : `阶段任务关联：${linkedTask.title}`}
                            </div>
                          )}
                          {job.roleName && (
                            <div className="text-xs font-semibold text-zinc-700 mb-1">饰演：{job.roleName}</div>
                          )}
                          <p className="text-xs text-zinc-500 mb-2 leading-relaxed">{job.description || job.desc}</p>
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {job.tags.map((tag) => (
                                <span key={`${job.id}_${tag}`} className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-xs font-medium">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400">要求:</span>
                              {Object.entries(job.req).map(([k, v]) => (
                                <span key={k} className={effectiveStats[k as keyof Stats] >= (v as number) ? 'text-zinc-900' : 'text-red-500'}>
                                  {getStatName(k)} {v}
                                </span>
                              ))}
                            </div>
                            <div className="w-px h-2.5 bg-zinc-200 hidden sm:block mt-1"></div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400">消耗:</span>
                              <span className="text-zinc-900">体力 {job.cost.stamina}</span>
                              {job.cost.money && <span className="text-zinc-900">金钱 {job.cost.money}</span>}
                            </div>
                            <div className="w-px h-2.5 bg-zinc-200 hidden sm:block mt-1"></div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400">报酬:</span>
                              <span className="text-zinc-900">金钱 {job.reward.money}</span>
                              <span className="text-zinc-900">人气 {job.reward.popularity}</span>
                              {job.reward.stats &&
                                Object.entries(job.reward.stats).map(([k, v]) => (
                                  <span key={k} className="text-zinc-900">{getStatName(k)} +{v}</span>
                                ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`flex flex-col gap-1.5 shrink-0 ${isMobileLandscapeViewport ? 'w-[88px]' : 'sm:w-28'}`}>
                          <button
                            onClick={() => takeJob(job)}
                            disabled={!isMet}
                            className={`w-full rounded text-xs font-bold transition-all ${isMobileLandscapeViewport ? 'px-2.5 py-1.5' : 'px-3 py-1.5'} ${
                              isMet 
                                ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm' 
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            }`}
                          >
                            接取通告
                          </button>
                          <button
                            onClick={() => addToSchedule(job)}
                            disabled={!isMet}
                            className={`w-full rounded text-xs font-bold transition-all ${isMobileLandscapeViewport ? 'px-2.5 py-1.5' : 'px-3 py-1.5'} ${
                              isMet 
                                ? 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900' 
                                : 'bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed'
                            }`}
                          >
                            加入行程
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredJobs.length === 0 && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
                      当前筛选下暂无通告。
                    </div>
                  )}
                  </div>
                </div>
              )}

              {currentLocation === 'city' && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/70 p-4 shadow-[0_10px_24px_-16px_rgba(24,24,27,0.28)]">
                    <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-zinc-900">周边外出</h3>
                          <div className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-[0_2px_8px_-6px_rgba(24,24,27,0.35)]">
                            今日外出建议
                          </div>
                          <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{citySuggestion}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-[0_8px_16px_-14px_rgba(24,24,27,0.55)]">
                            可外出次数：{cityExecutableCount}
                          </span>
                          <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                            体力：{player.stamina}
                          </span>
                          <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                            资金：￥{player.money.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {CITY_FILTER_TABS.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setCityFilter(tab)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                              cityFilter === tab
                                ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_10px_18px_-14px_rgba(24,24,27,0.85)]'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={`mt-3 grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
                      <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                        <div className="text-[11px] font-semibold tracking-wide text-zinc-500">推荐路线</div>
                        <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{cityRouteHint}</div>
                      </div>
                      <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                        <div className="text-[11px] font-semibold tracking-wide text-zinc-500">环境加成提示</div>
                        <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{cityEnvHint}</div>
                      </div>
                      <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                        <div className="text-[11px] font-semibold tracking-wide text-zinc-500">当前偏好</div>
                        <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{cityPreferenceHint}</div>
                      </div>
                    </div>
                  </div>
                  <div className={`grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {(cityFilter === '全部' || cityFilter === '基础外出') && (ACTIONS['city'] || []).map(action => (
                      (() => {
                        const tags = getCityActionTags(action);
                        const accentClass = getCityAccentBarClass(tags);
                        const staminaValue = action.cost.stamina > 0 ? `-${action.cost.stamina}` : '0';
                        const moneyValue = action.cost.money > 0 ? `-${action.cost.money}` : '0';
                        const gainText = action.effect.popularity
                          ? `人气 +${action.effect.popularity}`
                          : action.effect.charm
                            ? `魅力 +${action.effect.charm}`
                            : action.effect.reputation
                              ? `声望 +${action.effect.reputation}`
                              : action.effect.appearance
                                ? `颜值 +${action.effect.appearance}`
                                : action.effect.stamina
                                  ? `体力 +${action.effect.stamina}`
                                  : action.effect.money
                                    ? `金钱 +${action.effect.money}`
                                    : '状态调整';
                        return (
                          <div
                            key={action.id}
                            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-[0_12px_22px_-18px_rgba(24,24,27,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-20px_rgba(24,24,27,0.55)] hover:border-zinc-300"
                          >
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                              <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                  <span
                                    key={`${action.id}_${tag}`}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getCityTagClasses(tag)}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">耗时 {action.time} 天</span>
                            </div>
                            <h3 className="mb-1 text-lg font-black tracking-tight text-zinc-900">{action.name}</h3>
                            <p className="mb-2.5 min-h-[2.25rem] text-xs leading-relaxed text-zinc-500">{action.desc}</p>
                            <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                              <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">成本信息</div>
                                <div className="mt-1 text-base font-black leading-none text-zinc-900">体力 {staminaValue}</div>
                                <div className="mt-1 text-[11px] font-medium text-zinc-500">金钱 {moneyValue}</div>
                              </div>
                              <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">收益信息</div>
                                <div className="mt-1 text-base font-black leading-none text-zinc-900">{gainText}</div>
                                <div className="mt-1 text-[11px] font-medium text-zinc-500">适合基础推进</div>
                              </div>
                            </div>
                            <div className="mt-auto flex gap-1.5">
                              <button onClick={() => performAction(action)} className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800">执行</button>
                              <button onClick={() => addToSchedule(action)} className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50">加入行程</button>
                            </div>
                            <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${accentClass}`} />
                          </div>
                        );
                      })()
                    ))}

                    {(cityFilter === '全部' || cityFilter === '环境加成') && LOCATION_BUFF_LIBRARY.map((spot) => {
                      if (cityFilter === '环境加成' && isStoryLocationSpot(spot)) return null;
                      if (cityFilter === '剧情地点') return null;
                      const isExpanded = expandedBuffId === spot.id;
                      const quickDesc = spot.desc.length > 34 ? `${spot.desc.slice(0, 34)}...` : spot.desc;
                      const spotAction = buildLocationBuffAction(spot);
                      const spotTags = isStoryLocationSpot(spot) ? ['剧情地点', '氛围'] : ['环境加成'];
                      const accentClass = getCityAccentBarClass(spotTags);
                      const buffTexts: string[] = [];
                      if (spot.buff.actingRate) buffTexts.push(`演技 +${Math.round(spot.buff.actingRate * 100)}%`);
                      if (spot.buff.favorRate) buffTexts.push(`好感 +${Math.round(spot.buff.favorRate * 100)}%`);
                      if (spot.buff.popularityRate) buffTexts.push('名望/人气提升');
                      if (spot.buff.charmRate) buffTexts.push(`魅力 +${Math.round(spot.buff.charmRate * 100)}%`);
                      if (spot.buff.reputationRate) buffTexts.push(`声望 +${Math.round(spot.buff.reputationRate * 100)}%`);
                      if (spot.buff.staminaRecover) buffTexts.push(`体力 +${spot.buff.staminaRecover}`);
                      if (spot.buff.moneyRate) buffTexts.push(`金钱 +${Math.round(spot.buff.moneyRate * 100)}%`);
                      return (
                        <div
                          key={spot.id}
                          className={`group flex flex-col rounded-2xl border bg-white p-3.5 shadow-[0_12px_22px_-18px_rgba(24,24,27,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-20px_rgba(24,24,27,0.55)] ${
                            isStoryLocationSpot(spot) ? 'border-violet-200/70 hover:border-violet-300/80' : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {spotTags.map((tag) => (
                                <span
                                  key={`${spot.id}_${tag}`}
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getCityTagClasses(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">耗时 1 天</span>
                          </div>
                          <h3 className="mb-1 text-lg font-black tracking-tight text-zinc-900">{spot.name}</h3>
                          <p className="mb-2.5 min-h-[2.25rem] text-xs leading-relaxed text-zinc-500">{isExpanded ? spot.desc : quickDesc}</p>
                          <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                            <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">成本信息</div>
                              <div className="mt-1 text-base font-black leading-none text-zinc-900">体力 -{spotAction.cost.stamina}</div>
                              <div className="mt-1 text-[11px] font-medium text-zinc-500">适合外出探索</div>
                            </div>
                            <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">收益信息</div>
                              <div className="mt-1 text-base font-black leading-none text-zinc-900">{buffTexts[0] ?? '环境增益'}</div>
                              <div className="mt-1 text-[11px] font-medium text-zinc-500">{buffTexts[1] ?? '可触发额外成长'}</div>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mb-2.5 flex flex-wrap gap-1">
                              {spot.buff.actingRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">演技成长 +{Math.round(spot.buff.actingRate * 100)}%</span>}
                              {spot.buff.favorRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 font-semibold">好感成长 +{Math.round(spot.buff.favorRate * 100)}%</span>}
                              {spot.buff.popularityRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">名望/人气加成</span>}
                              {spot.buff.charmRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-semibold">魅力成长 +{Math.round(spot.buff.charmRate * 100)}%</span>}
                              {spot.buff.reputationRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">声望成长 +{Math.round(spot.buff.reputationRate * 100)}%</span>}
                              {spot.buff.staminaRecover && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">体力恢复 +{spot.buff.staminaRecover}</span>}
                              {spot.buff.moneyRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 font-semibold">金钱收益 +{Math.round(spot.buff.moneyRate * 100)}%</span>}
                            </div>
                          )}
                          <div className="mb-1.5 mt-auto flex gap-1.5">
                            <button
                              onClick={() => performAction(spotAction)}
                              className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                            >
                              执行
                            </button>
                            <button
                              onClick={() => addToSchedule(spotAction)}
                              className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
                            >
                              加入行程
                            </button>
                          </div>
                          <button
                            onClick={() => setExpandedBuffId(prev => (prev === spot.id ? null : spot.id))}
                            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
                          >
                            {isExpanded ? '收起详情' : '展开详情'}
                          </button>
                          <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${accentClass}`} />
                        </div>
                      );
                    })}
                    {cityFilter === '剧情地点' && LOCATION_BUFF_LIBRARY.map((spot) => {
                      if (!isStoryLocationSpot(spot)) return null;
                      const isExpanded = expandedBuffId === spot.id;
                      const quickDesc = spot.desc.length > 34 ? `${spot.desc.slice(0, 34)}...` : spot.desc;
                      const spotAction = buildLocationBuffAction(spot);
                      const spotTags = ['剧情地点', '氛围'];
                      const accentClass = getCityAccentBarClass(spotTags);
                      const buffTexts: string[] = [];
                      if (spot.buff.favorRate) buffTexts.push(`好感 +${Math.round(spot.buff.favorRate * 100)}%`);
                      if (spot.buff.charmRate) buffTexts.push(`魅力 +${Math.round(spot.buff.charmRate * 100)}%`);
                      if (spot.buff.reputationRate) buffTexts.push(`声望 +${Math.round(spot.buff.reputationRate * 100)}%`);
                      if (spot.buff.actingRate) buffTexts.push(`演技 +${Math.round(spot.buff.actingRate * 100)}%`);
                      if (spot.buff.staminaRecover) buffTexts.push(`体力 +${spot.buff.staminaRecover}`);
                      return (
                        <div
                          key={`${spot.id}_story`}
                          className="group flex flex-col rounded-2xl border border-violet-200/70 bg-white p-3.5 shadow-[0_12px_22px_-18px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-[0_18px_30px_-20px_rgba(124,58,237,0.35)]"
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {spotTags.map((tag) => (
                                <span
                                  key={`${spot.id}_${tag}_story`}
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getCityTagClasses(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">耗时 1 天</span>
                          </div>
                          <h3 className="mb-1 text-lg font-black tracking-tight text-zinc-900">{spot.name}</h3>
                          <p className="mb-2.5 min-h-[2.25rem] text-xs leading-relaxed text-zinc-500">{isExpanded ? spot.desc : quickDesc}</p>
                          <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                            <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">成本信息</div>
                              <div className="mt-1 text-base font-black leading-none text-zinc-900">体力 -{spotAction.cost.stamina}</div>
                              <div className="mt-1 text-[11px] font-medium text-zinc-500">适合剧情推进</div>
                            </div>
                            <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 to-zinc-100/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">收益信息</div>
                              <div className="mt-1 text-base font-black leading-none text-zinc-900">{buffTexts[0] ?? '氛围增益'}</div>
                              <div className="mt-1 text-[11px] font-medium text-zinc-500">{buffTexts[1] ?? '更容易触发关系成长'}</div>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mb-2.5 flex flex-wrap gap-1">
                              {spot.buff.actingRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">演技成长 +{Math.round(spot.buff.actingRate * 100)}%</span>}
                              {spot.buff.favorRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 font-semibold">好感成长 +{Math.round(spot.buff.favorRate * 100)}%</span>}
                              {spot.buff.popularityRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">名望/人气加成</span>}
                              {spot.buff.charmRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-semibold">魅力成长 +{Math.round(spot.buff.charmRate * 100)}%</span>}
                              {spot.buff.reputationRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">声望成长 +{Math.round(spot.buff.reputationRate * 100)}%</span>}
                              {spot.buff.staminaRecover && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">体力恢复 +{spot.buff.staminaRecover}</span>}
                              {spot.buff.moneyRate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 font-semibold">金钱收益 +{Math.round(spot.buff.moneyRate * 100)}%</span>}
                            </div>
                          )}
                          <div className="mb-1.5 mt-auto flex gap-1.5">
                            <button
                              onClick={() => performAction(spotAction)}
                              className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
                            >
                              执行
                            </button>
                            <button
                              onClick={() => addToSchedule(spotAction)}
                              className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
                            >
                              加入行程
                            </button>
                          </div>
                          <button
                            onClick={() => setExpandedBuffId(prev => (prev === spot.id ? null : spot.id))}
                            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
                          >
                            {isExpanded ? '收起详情' : '展开详情'}
                          </button>
                          <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${accentClass}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {currentLocation === 'contacts' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-3">手机 / 联系人</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
                      <div className="space-y-3">
                        {(Object.keys(characterUnlocks) as CharacterId[])
                          .filter((id) => characterUnlocks[id])
                          .map((id) => {
                            const p = characters[id];
                            const chatted = hasChattedThisWeek[id];
                            const isActive = selectedContactId === id;
                            return (
                              <div
                                key={id}
                                className={`rounded-xl border p-3 transition-colors ${isActive ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}
                              >
                                <button
                                  onClick={() => setSelectedContactId(id)}
                                  className="w-full flex items-center gap-3 text-left"
                                >
                                  <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-100 border border-zinc-200">
                                    <SafeImage
                                      src={resolveCharacterImage(id)}
                                      alt={CHARACTER_NAMES[id]}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-bold text-zinc-900">{CHARACTER_NAMES[id]}</div>
                                    <div className="text-xs text-zinc-500">好感度 {p?.favor ?? 0}</div>
                                  </div>
                                </button>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => handleStartDailyChat(id)}
                                    disabled={chatted || player.stamina < 10}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                                      chatted || player.stamina < 10
                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                    }`}
                                  >
                                    {chatted ? '本周已聊' : '随机闲聊'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        {(Object.keys(characterUnlocks) as CharacterId[]).filter((id) => characterUnlocks[id]).length === 0 && (
                          <div className="text-center py-8 text-zinc-400 text-sm">暂无已解锁联系人</div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                        {selectedContactId ? (
                          <div className="h-full flex flex-col bg-white">
                            <div className="border-b border-zinc-100 px-4 py-3 flex items-center gap-3 bg-zinc-50/80">
                              <div className="h-10 w-10 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                                <SafeImage
                                  src={resolveCharacterImage(selectedContactId)}
                                  alt={CHARACTER_NAMES[selectedContactId]}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="text-sm font-bold text-zinc-900">{CHARACTER_NAMES[selectedContactId]}</div>
                            </div>

                            <div className="grid grid-cols-[220px_1fr] min-h-[380px]">
                              <div className="border-r border-zinc-100 bg-zinc-50">
                                <SafeImage
                                  src={resolveCharacterImage(selectedContactId)}
                                  alt={CHARACTER_NAMES[selectedContactId]}
                                  className="h-full w-full object-cover"
                                  iconClassName="h-10 w-10 text-zinc-300"
                                />
                              </div>
                              <div className="p-4 space-y-3 overflow-y-auto bg-white">
                                {(contactChats[selectedContactId] ?? []).length === 0 && (
                                  <div className="text-sm text-zinc-400">输入一句话，开始和 TA 聊天。</div>
                                )}
                                {(contactChats[selectedContactId] ?? []).map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                        msg.sender === 'player'
                                          ? 'bg-zinc-900 text-white'
                                          : 'bg-zinc-50 border border-zinc-200 text-zinc-800'
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-zinc-100 p-3 bg-zinc-50/80">
                              {hasChattedThisWeek[selectedContactId] ? (
                                <div className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                                  这周他/她似乎很忙，晚点再聊吧
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {contactError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                      {contactError}
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <input
                                      value={contactInput}
                                      onChange={(e) => {
                                        setContactInput(e.target.value);
                                        if (contactError) setContactError(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSendContactMessage();
                                        }
                                      }}
                                      placeholder="输入你想说的话..."
                                      className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-900 disabled:opacity-100"
                                    />
                                    <button
                                      onClick={handleSendContactMessage}
                                      disabled={contactSending || !contactInput.trim() || player.stamina < 10}
                                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                      {contactSending ? '发送中...' : '发送'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-[460px] flex items-center justify-center text-sm text-zinc-400 bg-white">
                            选择一个联系人开始互动
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentLocation === 'schedule' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-bold text-zinc-900 tracking-tight">当前行程安排</h3>
                      <button 
                        onClick={executeNextTask}
                        disabled={gameState.plannedTasks.length === 0}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${gameState.plannedTasks.length > 0 ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                      >
                        执行下一个行程
                      </button>
                    </div>
                    
                    {gameState.plannedTasks.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
                        暂无安排的行程。请在其他界面将活动加入行程。
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {gameState.plannedTasks.map((task, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900 text-sm">{task.name}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5">耗时 {task.time} 天</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeTask(idx)}
                              className="text-zinc-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                            >
                              移除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {currentLocation === 'social' && (
                <div className="space-y-6">
                  {/* Social Header */}
                  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100">
                        {player.avatar ? (
                          <img src={player.avatar} alt="Avatar" className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                            <User className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                          {player.name}
                          <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wide">Verified</span>
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-zinc-900">{player.social.followers.toLocaleString()}</span> 粉丝
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-zinc-900">{player.social.following.length}</span> 关注
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-zinc-900">{player.social.posts.filter(p => p.authorId === 'player').length}</span> 动态
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 border-b border-zinc-100 pb-4 mb-4">
                      <button
                        onClick={() => setSocialTab('feed')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${socialTab === 'feed' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                      >
                        关注动态
                      </button>
                      <button
                        onClick={() => setSocialTab('explore')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${socialTab === 'explore' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                      >
                        发现 & 吃瓜
                      </button>
                      <button
                        onClick={() => setSocialTab('messages')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${socialTab === 'messages' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                      >
                        私信
                      </button>
                      <button
                        onClick={() => setSocialTab('me')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${socialTab === 'me' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                      >
                        我的主页
                      </button>
                    </div>

                    {/* Create Post Area */}
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-6">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="分享你的新鲜事..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder-zinc-400"
                        maxLength={200}
                      />
                      {newPostImage && (
                        <div className="relative w-20 h-20 mb-3 group">
                          <img src={newPostImage} alt="Upload" className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={() => setNewPostImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
                        <label className="cursor-pointer text-zinc-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs font-bold">
                          <Camera className="w-4 h-4" />
                          <span>添加图片</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewPostImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={handleCreatePost}
                          disabled={!newPostContent.trim() || isPosting}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${!newPostContent.trim() || isPosting ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                          {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          发布
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="space-y-4">
                    {socialTab === 'explore' && (
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索用户或内容..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                          <div className="absolute left-3 top-2.5 text-zinc-400">
                            <Smartphone className="w-4 h-4" />
                          </div>
                        </div>
                        
                        {/* Trending Topics */}
                        <div className="mt-6 mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">全网热搜</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {gameState.trendingTopics.map((topic, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors cursor-pointer group"
                                onClick={() => setSearchQuery(topic.topic)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-bold w-4 ${idx < 3 ? 'text-red-500' : 'text-zinc-400'}`}>{idx + 1}</span>
                                  <span className="text-xs text-zinc-700 group-hover:text-zinc-900 transition-colors">{topic.topic}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                  <Activity className="w-3 h-3" />
                                  {topic.heat}w
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Suggested Users */}
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">推荐关注</h4>
                          <div className="space-y-3">
                            {[...SOCIAL_USERS, ...gameState.dynamicNPCs].filter(u => 
                              (searchQuery ? true : !player.social.following.includes(u.id)) && 
                              (u.name.includes(searchQuery) || u.title.includes(searchQuery))
                            ).map(user => {
                              const isFollowing = player.social.following.includes(user.id);
                              return (
                                <div key={user.id} className="flex items-center justify-between">
                                  <div 
                                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setViewingUserId(user.id)}
                                  >
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} alt={user.name} className="w-full h-full" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-sm text-zinc-900 hover:text-indigo-600">{user.name}</span>
                                        {user.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                      </div>
                                      <div className="text-xs text-zinc-500">{user.title} · {user.followers.toLocaleString()} 粉丝</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => toggleFollow(user.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${isFollowing ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50'}`}
                                  >
                                    {isFollowing ? '取消关注' : '关注'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profile View */}
                    {viewingUserId && (
                      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-4">
                        <button 
                          onClick={() => setViewingUserId(null)}
                          className="mb-4 text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          返回
                        </button>
                        
                        {(() => {
                          const user = [...SOCIAL_USERS, ...gameState.dynamicNPCs].find(u => u.id === viewingUserId);
                          if (!user) return <div className="text-center py-8 text-zinc-400">用户不存在</div>;
                          
                          const isFollowing = player.social.following.includes(user.id);
                          
                          return (
                            <div>
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-100">
                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                                    {user.name}
                                    {user.isVerified && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                                  </h2>
                                  <p className="text-zinc-500 text-sm mb-2">{user.title}</p>
                                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-zinc-900">{user.followers.toLocaleString()}</span> 粉丝
                                    </div>
                                  </div>
                                  {/* Relationship Meter */}
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                      <span>关系度</span>
                                      <span>{player.social.relationships[user.id] || 0}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${player.social.relationships[user.id] || 0}%` }}
                                        className="h-full bg-indigo-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                                  <div className="ml-auto flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSocialTab('messages');
                                        setSelectedConversationId(user.id);
                                        setViewingUserId(null);
                                      }}
                                      className="px-4 py-2 rounded-full text-sm font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      私信
                                    </button>
                                    <button
                                      onClick={() => toggleFollow(user.id)}
                                      className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${isFollowing ? 'bg-zinc-100 text-zinc-900 border border-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                                    >
                                      {isFollowing ? '取消关注' : '关注'}
                                    </button>
                                  </div>
                              </div>
                              
                              <h3 className="font-bold text-lg mb-4">动态</h3>
                              <div className="space-y-4">
                                {player.social.posts
                                  .filter(p => p.authorId === user.id)
                                  .sort((a, b) => {
                                    const timeA = toTimeStamp(a.timestamp);
                                    const timeB = toTimeStamp(b.timestamp);
                                    if (timeA === timeB) {
                                      return b.id.localeCompare(a.id);
                                    }
                                    return timeB - timeA;
                                  })
                                  .map(post => (
                                  <div key={post.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                    <div className="text-xs text-zinc-400 mb-2">
                                      {formatDisplayTime(post.timestamp)}
                                    </div>
                                    <p className="text-zinc-800 text-sm mb-3 leading-relaxed">{post.content}</p>
                                    {post.image && (
                                      <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200">
                                        <img src={post.image} alt="Post content" className="w-full h-auto max-h-64 object-cover" />
                                      </div>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                      <div className="flex items-center gap-1">
                                        <ThumbsUp className="w-3 h-3" /> {post.likes.toLocaleString()}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" /> {post.comments.length}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {player.social.posts.filter(p => p.authorId === user.id).length === 0 && (
                                  <div className="text-center py-8 text-zinc-400">暂无动态</div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Messages Tab Content */}
                    {!viewingUserId && socialTab === 'messages' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
                        {/* Conversation List */}
                        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-zinc-100 font-bold text-sm">对话列表</div>
                          <div className="flex-1 overflow-y-auto">
                            {player.social.conversations.length === 0 ? (
                              <div className="p-8 text-center text-zinc-400 text-xs">暂无私信</div>
                            ) : (
                              player.social.conversations.map(conv => {
                                const user = [...SOCIAL_USERS, ...gameState.dynamicNPCs].find(u => u.id === conv.userId);
                                if (!user) return null;
                                const lastMsg = conv.messages[conv.messages.length - 1];
                                return (
                                  <button
                                    key={conv.userId}
                                    onClick={() => setSelectedConversationId(conv.userId)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 ${selectedConversationId === conv.userId ? 'bg-indigo-50/50' : ''}`}
                                  >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} alt={user.name} className="w-full h-full" />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                      <div className="font-bold text-sm text-zinc-900 truncate">{user.name}</div>
                                      <div className="text-[10px] text-zinc-500 truncate">{lastMsg?.content}</div>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Message View */}
                        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
                          {selectedConversationId ? (() => {
                            const user = [...SOCIAL_USERS, ...gameState.dynamicNPCs].find(u => u.id === selectedConversationId);
                            const conv = player.social.conversations.find(c => c.userId === selectedConversationId);
                            if (!user) return null;

                            return (
                              <>
                                <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`} alt={user.name} className="w-full h-full" />
                                  </div>
                                  <div className="font-bold text-sm">{user.name}</div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
                                  {conv?.messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === 'player' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === 'player' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-zinc-800 border border-zinc-100 rounded-tl-none shadow-sm'}`}>
                                        {msg.content}
                                      </div>
                                    </div>
                                  ))}
                                  <div ref={chatEndRef} />
                                </div>
                                <div className="p-4 border-t border-zinc-100">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="输入消息..."
                                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 disabled:text-zinc-900 disabled:opacity-100"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSendDM(selectedConversationId, e.currentTarget.value);
                                          e.currentTarget.value = '';
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        handleSendDM(selectedConversationId, input.value);
                                        input.value = '';
                                      }}
                                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                      发送
                                    </button>
                                  </div>
                                </div>
                              </>
                            );
                          })() : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                              <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                              <p className="text-sm">选择一个对话开始聊天</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Post List */}
                    {!viewingUserId && socialTab !== 'messages' && (() => {
                      let postsToShow = player.social.posts;
                      
                      if (socialTab === 'feed') {
                        postsToShow = postsToShow.filter(p => player.social.following.includes(p.authorId) || p.authorId === 'player');
                      } else if (socialTab === 'explore') {
                        // Show all posts except player's own (unless searched), filtered by search
                        postsToShow = postsToShow.filter(p => 
                          (p.content.includes(searchQuery)) &&
                          (searchQuery ? true : p.authorId !== 'player')
                        );
                      } else if (socialTab === 'me') {
                        postsToShow = postsToShow.filter(p => p.authorId === 'player');
                      }

                      // Sort by timestamp (newest first)
                      postsToShow.sort((a, b) => {
                        const timeA = toTimeStamp(a.timestamp);
                        const timeB = toTimeStamp(b.timestamp);
                        if (timeA === timeB) {
                            return b.id.localeCompare(a.id);
                        }
                        return timeB - timeA;
                      });
                      
                      if (postsToShow.length === 0) {
                        return (
                          <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>这里空空如也~</p>
                          </div>
                        );
                      }

                      return postsToShow.map(post => {
                        const author = post.authorId === 'player' 
                          ? { name: player.name, avatar: player.avatar, isVerified: true, title: '我', id: 'player' }
                          : [...SOCIAL_USERS, ...gameState.dynamicNPCs].find(u => u.id === post.authorId);
                        
                        if (!author) return null;

                        return (
                          <div key={post.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div 
                                  className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => post.authorId !== 'player' && setViewingUserId(post.authorId)}
                                >
                                  {post.authorId === 'player' && author.avatar ? (
                                    <img src={author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : post.authorId !== 'player' ? (
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(author as any).avatar}`} alt="Avatar" className="w-full h-full" />
                                  ) : (
                                    <User className="w-6 h-6 m-2 text-zinc-300" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span 
                                      className={`font-bold text-zinc-900 text-sm ${post.authorId !== 'player' ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                                      onClick={() => post.authorId !== 'player' && setViewingUserId(post.authorId)}
                                    >
                                      {author.name}
                                    </span>
                                    {author.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    {(author as any).title} · {formatDisplayTime(post.timestamp)}
                                  </div>
                                </div>
                              </div>
                              {post.type === 'news' && (
                                <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  HOT
                                </span>
                              )}
                              {post.authorId !== 'player' && (
                                <button
                                  onClick={() => toggleFollow(post.authorId)}
                                  className={`text-xs font-bold px-2 py-1 rounded border ${player.social.following.includes(post.authorId) ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                >
                                  {player.social.following.includes(post.authorId) ? '取消关注' : '关注'}
                                </button>
                              )}
                              {post.authorId === 'player' && (
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-zinc-400 hover:text-red-500 transition-colors"
                                  title="删除动态"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <p className="text-zinc-800 text-sm mb-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            
                            {post.image && (
                              <div className="mb-4 rounded-xl overflow-hidden border border-zinc-100">
                                <img src={post.image} alt="Post content" className="w-full h-auto max-h-96 object-cover" />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-6 border-t border-zinc-100 pt-3 mb-3">
                              <button 
                                onClick={() => handleLikePost(post.id)}
                                className="flex items-center gap-1.5 text-zinc-500 text-xs hover:text-red-500 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{post.likes.toLocaleString()}</span>
                              </button>
                              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments.length}</span>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  placeholder="发表评论..."
                                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 disabled:text-zinc-900 disabled:opacity-100"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddComment(post.id, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                                <button 
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    handleAddComment(post.id, input.value);
                                    input.value = '';
                                  }}
                                  className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                                >
                                  评论
                                </button>
                              </div>
                            </div>

                            {post.comments.length > 0 && (
                              <div className="bg-zinc-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                                {post.comments.map((comment, idx) => (
                                  <div key={idx} className="text-xs flex gap-2">
                                    <span className="font-bold text-zinc-700 shrink-0">
                                      {idx < (post as any).initialCommentCount ? `网友${Math.floor(Math.random() * 1000)}` : player.name}:
                                    </span>
                                    <span className="text-zinc-600">{comment}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
              {currentLocation === 'wardrobe' && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/70 p-4 shadow-[0_10px_24px_-16px_rgba(24,24,27,0.28)]">
                    <h3 className="mb-3 text-lg font-black tracking-tight text-zinc-900">我的衣橱</h3>
                    <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-[0_2px_8px_-6px_rgba(24,24,27,0.35)]">
                            动态推荐
                          </div>
                          <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-zinc-400">今日穿搭建议</div>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{wardrobeRecommendation.suggestion}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">已拥有：{ownedClothingCount}</span>
                          <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">已穿戴：{equippedClothingCount}</span>
                          <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">未拥有：{unownedClothingCount}</span>
                        </div>
                      </div>
                      <div className={`mt-3 grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
                        <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">当前穿搭方向</div>
                          <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{wardrobeRecommendation.direction}</div>
                        </div>
                        <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">本周推荐风格</div>
                          <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{wardrobeRecommendation.weeklyStyle}</div>
                        </div>
                        <div className="rounded-2xl border border-zinc-200/90 bg-white/85 p-3 shadow-[0_8px_18px_-14px_rgba(24,24,27,0.5)]">
                          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">搭配收益提示</div>
                          <div className="mt-1.5 text-sm font-extrabold tracking-tight text-zinc-900">{wardrobeRecommendation.gainHint}</div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">状态分类</div>
                          <div className="flex flex-wrap gap-2">
                            {WARDROBE_OWNERSHIP_TABS.map((tab) => (
                              <button
                                key={`wardrobe_ownership_${tab}`}
                                onClick={() => setWardrobeOwnershipFilter(tab)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                                  wardrobeOwnershipFilter === tab
                                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_10px_18px_-14px_rgba(24,24,27,0.85)]'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">风格分类</div>
                          <div className="flex flex-wrap gap-2">
                            {wardrobeStyleTabs.map((tab) => (
                              <button
                                key={`wardrobe_style_${tab}`}
                                onClick={() => setWardrobeStyleFilter(tab)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                                  wardrobeStyleFilter === tab
                                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-[0_10px_18px_-14px_rgba(24,24,27,0.85)]'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`mt-3 grid gap-3 ${isMobileLandscapeViewport ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                      {filteredClothingItems.map(item => {
                        const isOwned = player.inventory.includes(item.id);
                        const isEquipped = player.equippedClothing === item.id;
                        const statusLabel = isEquipped ? '已穿戴' : isOwned ? '已拥有' : '未拥有';
                        const styleLabel = item.styleTag || '日常';
                        const isRare = item.cost >= 20000;
                        const cardClass = isEquipped
                          ? 'border-zinc-900 bg-zinc-50/80 shadow-[0_16px_24px_-22px_rgba(24,24,27,0.8)]'
                          : isOwned
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-zinc-200 bg-white';
                        const statusBadgeClass = isEquipped
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : isOwned
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200';
                        
                        return (
                          <div key={item.id} className={`flex flex-col rounded-2xl border p-3 ${cardClass}`}>
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                              <div className="flex flex-wrap gap-1">
                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-700 shadow-[0_2px_6px_rgba(24,24,27,0.08)]">
                                  {styleLabel}
                                </span>
                                {isRare && (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-[0_2px_6px_rgba(245,158,11,0.12)]">
                                    稀有
                                  </span>
                                )}
                                {!isRare && (
                                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                                    日常
                                  </span>
                                )}
                              </div>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass}`}>{statusLabel}</span>
                            </div>
                            <h4 className="mb-1 text-base font-black tracking-tight text-zinc-900">{item.name}</h4>
                            <p className="mb-2 min-h-[2.15rem] text-xs text-zinc-500">{item.desc}</p>
                            <div className="mb-2 flex flex-wrap gap-1">
                              {Object.entries(item.bonus).map(([k, v]) => (
                                <span key={k} className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                                  {getStatName(k)} +{v}
                                </span>
                              ))}
                            </div>
                            <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">价格 / 状态</div>
                              <div className="mt-1 text-sm font-black text-zinc-900">￥{item.cost.toLocaleString()}</div>
                              <div className="mt-0.5 text-[11px] font-medium text-zinc-500">{isOwned ? '已收藏，可随时切换穿搭。' : '未拥有，购买后可加入衣橱。'}</div>
                            </div>
                            
                            <div className="mt-auto flex gap-1.5">
                              <button
                                onClick={() => {
                                  if (isEquipped) return;
                                  if (isOwned) {
                                    setGameState(prev => prev ? { ...prev, player: { ...prev.player, equippedClothing: item.id } } : prev);
                                    return;
                                  }
                                  if (player.money >= item.cost) {
                                    setGameState(prev => {
                                      if (!prev) return prev;
                                      return {
                                        ...prev,
                                        player: {
                                          ...prev.player,
                                          money: prev.player.money - item.cost,
                                          inventory: [...prev.player.inventory, item.id]
                                        },
                                        logs: [...prev.logs, { id: logIdCounter++, text: `购买了服装【${item.name}】。`, type: 'success' }].slice(-50)
                                      };
                                    });
                                  }
                                }}
                                disabled={(!isOwned && player.money < item.cost) || isEquipped}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                                  isEquipped
                                    ? 'bg-zinc-900 text-white cursor-default'
                                    : isOwned
                                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                      : player.money >= item.cost
                                        ? 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50'
                                        : 'bg-zinc-50 text-zinc-400 border border-zinc-100 cursor-not-allowed'
                                }`}
                              >
                                {isEquipped ? '当前穿搭' : isOwned ? '穿戴' : `购买`}
                              </button>
                              <button
                                onClick={() => {
                                  if (item.styleTag) {
                                    setWardrobeStyleFilter(item.styleTag);
                                  }
                                }}
                                className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
                              >
                                查看搭配
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {filteredClothingItems.length === 0 && (
                        <div className="col-span-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
                          当前筛选下暂无服装
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {currentLocation === 'quests' && (
                <div className="space-y-6">
                  <Suspense fallback={<div className="h-[420px] rounded-2xl border border-zinc-200 bg-white/80" />}>
                    <TaskScreen
                      player={player}
                      tasks={PHASE_TASKS}
                      completedTaskIds={player.submittedPhaseTasks}
                      currentTime={gameState.time}
                      liuFavor={liuFavor}
                      getReqCurrentValue={getPhaseReqCurrentValue}
                      onSubmit={handleSubmitPhaseTask}
                      isMobileLandscapeViewport={isMobileLandscapeViewport}
                    />
                  </Suspense>
                </div>
              )}

              {currentLocation === 'trophy' && (
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm h-[70vh] min-h-[420px] flex flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      荣誉墙
                    </h3>
                    <div className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                      🏆 已获得荣誉：{taskHonors.length}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1">
                    {taskHonors.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {taskHonors.map((honorTitle, idx) => (
                          <div
                            key={honorTitle}
                            className="relative rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-4 shadow-sm"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                                <Trophy className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-bold tracking-wider text-amber-700">NO.{idx + 1}</span>
                            </div>
                            <div className="text-sm font-extrabold text-amber-900 leading-snug">{honorTitle}</div>
                            <div className="mt-2 text-[11px] font-medium text-amber-700">荣誉证书已入柜</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                        暂未获得任务荣誉
                      </div>
                    )}
                  </div>
                </div>
              )}
              {shouldRenderLocationFallback && (
                <div className="rounded-2xl border border-zinc-200 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
                  <div className="text-base font-bold text-zinc-900">这个页面暂时没有内容</div>
                  <p className="mt-1 text-sm text-zinc-600">
                    当前定位为「{currentLocation}」，已自动保留主界面，避免空白屏。
                  </p>
                  <button
                    onClick={() => setGameState((prev) => (prev ? { ...prev, currentLocation: 'home' } : prev))}
                    className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                  >
                    返回我的小屋
                  </button>
                </div>
              )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Log Panel */}
        <div className="h-24 sm:h-32 bg-white/8 backdrop-blur-xl border-t border-white/15 flex flex-col shrink-0 z-10">
          <div className="px-4 py-1.5 border-b border-white/10 bg-black/10 flex items-center gap-2">
            <Activity className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">动态日志</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs custom-scrollbar">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`flex gap-2 ${
                  log.type === 'error' ? 'text-red-600' :
                  log.type === 'warning' ? 'text-amber-600' :
                  log.type === 'success' ? 'text-emerald-600' :
                  log.type === 'taunt' ? 'text-purple-600 font-bold' :
                  'text-zinc-600'
                }`}
              >
                <span className="text-zinc-300 shrink-0 select-none">→</span>
                <span className="leading-tight">{log.text}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </main>
      {isArrangeModalOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-zinc-900">选择安排行程路线</h3>
                <p className="mt-1 text-xs text-zinc-500">选择一种策略，系统会自动加入 3 个行动。</p>
              </div>
              <button
                onClick={() => setIsArrangeModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
              >
                关闭
              </button>
            </div>
            <div className="space-y-2.5">
              {homeArrangeRoutes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => smartArrangeHomeTasks(route.id)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-[0_10px_20px_-16px_rgba(24,24,27,0.55)]"
                >
                  <div className="text-sm font-bold text-zinc-900">{route.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{route.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
      {renderEventModal()}
      {activeStory && (
        <Suspense fallback={null}>
          <EncounterModal
            story={activeStory}
            onClose={(payload) => handleEncounterModalClose(activeStory?.id, payload)}
          />
        </Suspense>
      )}
      {renderAvatarPickerModal()}
      {renderAvatarCropModal()}

      {/* Industry Event Modal */}
      {gameState.industryEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
              className={`w-full overflow-hidden rounded-[28px] border border-zinc-300/40 bg-[linear-gradient(180deg,#f6f2ee_0%,#f1ece7_100%)] shadow-[0_34px_70px_-28px_rgba(0,0,0,0.7)] ${
                isMobileLandscapeViewport
                  ? 'flex h-[96dvh] max-w-[99vw] flex-col'
                  : 'max-w-3xl'
              }`}
          >
            <div className={`relative shrink-0 border-b border-amber-900/20 bg-[linear-gradient(140deg,#1e1714_0%,#2b1d18_52%,#3f231c_100%)] text-zinc-100 ${isMobileLandscapeViewport ? 'p-4' : 'p-6'}`}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(226,149,75,0.2)_0%,transparent_45%)]" />
              <div className="relative flex items-start justify-between gap-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-amber-200/30 bg-amber-200/10 p-2.5 shadow-inner shadow-amber-100/10">
                    <Activity className="h-5 w-5 text-amber-200" />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-amber-200/35 bg-amber-100/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-100">
                        行业情报
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
                        {gameState.industryEvent.level ?? '中波动'}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
                        {gameState.industryEvent.waveType ?? '舆情观察'}
                      </span>
                    </div>
                    <h3 className="text-[22px] font-black tracking-tight text-zinc-50">{gameState.industryEvent.title}</h3>
                    <p className="mt-1 text-xs text-zinc-300">
                      {gameState.industryEvent.sourceTag ?? '行业监测中心'} · 第 {gameState.time.year} 年 {gameState.time.month} 月 第 {gameState.time.week} 周
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-zinc-200">
                  {gameState.industryEvent.sentiment ?? '中性'}风向
                </div>
              </div>
            </div>
            
            <div className={`min-h-0 ${isMobileLandscapeViewport ? 'flex-1 overflow-y-auto p-4' : 'space-y-5 p-6'}`}>
              <div className={isMobileLandscapeViewport ? 'space-y-4' : 'space-y-5'}>
                <div className="rounded-2xl border border-zinc-300/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5">事件简报</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5">风向快照</span>
                  </div>
                  <div className="whitespace-pre-wrap text-[15px] leading-8 text-zinc-700">{gameState.industryEvent.scenario}</div>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {gameState.industryEvent.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleIndustryChoice(choice)}
                      className="group relative overflow-hidden rounded-2xl border border-zinc-300/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(246,246,246,0.92)_100%)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-[0_14px_24px_-20px_rgba(15,23,42,0.55)] active:translate-y-0 active:scale-[0.998]"
                    >
                      <div className="relative z-10 flex-1 pr-4">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="rounded-md border border-zinc-300 bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 shadow-sm">
                            方案 {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                            {idx === 0 ? '稳健策略' : idx === 1 ? '平衡策略' : '进取策略'}
                          </span>
                        </div>
                        <div className="mb-1 text-[17px] font-black tracking-tight text-zinc-900">{choice.text}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">策略倾向</div>
                        <div className="mt-1 text-xs leading-relaxed text-zinc-500">{choice.impact}</div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-amber-300/0 via-amber-400/70 to-rose-400/0 opacity-50 transition-opacity duration-200 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Story Generation Modal */}
      <AnimatePresence>
        {storyModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl ${
                isMobileLandscapeViewport
                  ? 'flex max-h-[94dvh] max-w-[96vw] flex-col'
                  : 'max-w-lg'
              }`}
            >
              <div className={`min-h-0 ${isMobileLandscapeViewport ? 'flex flex-1 flex-col overflow-hidden p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    {storyModal.title}
                  </h3>
                  {!storyModal.isLoading && (
                    <button 
                      onClick={() => setStoryModal(prev => ({ ...prev, isOpen: false }))}
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className={`${isMobileLandscapeViewport ? 'min-h-0 flex-1 overflow-y-auto pr-1' : 'min-h-[150px] flex items-center justify-center'}`}>
                  {storyModal.isLoading ? (
                    <div className="flex h-full min-h-[150px] flex-col items-center justify-center gap-3 text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium animate-pulse">正在生成剧情...</span>
                    </div>
                  ) : (
                    <div className="text-zinc-700 leading-loose text-lg text-justify whitespace-pre-wrap font-serif tracking-wide">
                      {storyModal.content}
                    </div>
                  )}
                </div>
              </div>
              
              {!storyModal.isLoading && (
                <div className={`shrink-0 border-t border-zinc-100 bg-zinc-50 flex justify-end ${isMobileLandscapeViewport ? 'px-4 py-3' : 'px-6 py-4'}`}>
                  <button
                    onClick={() => setStoryModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    继续星途
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Job Result Modal */}
        {!storyModal.isOpen && jobResultModal && jobResultModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl ${
                isMobileLandscapeViewport
                  ? 'flex max-h-[94dvh] max-w-[94vw] flex-col'
                  : 'max-w-md'
              }`}
            >
              <div className={`relative shrink-0 overflow-hidden bg-zinc-900 text-center ${isMobileLandscapeViewport ? 'p-4' : 'p-6'}`}>
                <h3 className="text-2xl font-black text-white mb-1 relative z-10 tracking-tight">{jobResultModal.jobName}</h3>
                <p className="text-zinc-300 text-sm font-medium relative z-10">工作结算</p>
              </div>
              
              <div className={`min-h-0 ${isMobileLandscapeViewport ? 'flex-1 overflow-y-auto p-4' : 'p-6'}`}>
                <div className="flex flex-col items-center mb-6">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">媒体评价</div>
                  <div className={`text-5xl font-black mb-4 ${
                    jobResultModal.rating === 'S' ? 'text-amber-400 drop-shadow-md' :
                    jobResultModal.rating === 'A' ? 'text-purple-500' :
                    jobResultModal.rating === 'B' ? 'text-blue-500' : 'text-zinc-500'
                  }`}>
                    {jobResultModal.rating}
                  </div>
                  <p className="text-center text-zinc-700 text-sm leading-relaxed italic bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    "{jobResultModal.evaluation}"
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">获得奖励</div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-lg">￥</span>
                      </div>
                      资金
                    </div>
                    <span className="font-mono text-lg font-black text-emerald-600">+{jobResultModal.rewards.money}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 font-bold">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Star className="w-4 h-4" />
                      </div>
                      人气
                    </div>
                    <span className="font-mono text-lg font-black text-amber-600">+{jobResultModal.rewards.popularity}</span>
                  </div>
                </div>

                <button
                  onClick={() => setJobResultModal(null)}
                  className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}




