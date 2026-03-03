import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Building2, Map, Briefcase, User, Star, Heart, 
  Music, Video, Sparkles, Coins, Battery, Calendar, 
  ChevronRight, ChevronDown, Activity, Trophy, ListTodo, Shirt, Camera,
  Menu, X, ClipboardList, CheckCircle2, Loader2, Smartphone, Send, ThumbsUp, MessageCircle, Trash2, MessageSquare
} from 'lucide-react';
import { 
  Stats, Player, GameTime, LocationId, Action, Job, 
  LOCATIONS, ACTIONS, JOBS, getStatName, getPlayerLevel,
  NPCS, STORY_EVENTS, RANDOM_EVENTS, StoryChoice, RandomEvent, StoryEvent,
  Achievement, ACHIEVEMENTS, Clothing, CLOTHING_ITEMS,
  DEADLINES, ENDINGS, Deadline, Ending,
  FACILITIES, FacilityId, QUESTS,
  BACKGROUNDS, STARTING_BONUSES, COMPANIES, Background, StartingBonus, Company, SocialPost, SOCIAL_USERS, MOCK_POSTS, SocialUser, Message, IndustryEvent,
  CHARACTER_PROFILES, CHARACTER_PROFILE_IMAGES
} from './gameData';
import { type CharacterId, CHARACTER_NAMES, useGameStore } from './store/useGameStore';
import CharacterCard from './components/CharacterCard';

import { 
  generateStory, 
  generateEventPerformance, 
  generateScriptReading,
  generateNPC,
  generateNPCPost,
  generateNPCResponse,
  generateJobEvaluation,
  generateIndustryEvent
} from './services/gemini';

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
  dynamicNPCs: SocialUser[];
  trendingTopics: { topic: string; heat: number }[];
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

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(BACKGROUNDS[4].id); // Default to ordinary student
  const [selectedBonus, setSelectedBonus] = useState<string>(STARTING_BONUSES[0].id);
  const [selectedCompany, setSelectedCompany] = useState<string>(COMPANIES[0].id);
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
  const isPostingRef = useRef(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const characters = useGameStore((state) => state.characters);
  const characterUnlocks = useGameStore((state) => state.characterUnlocks);
  const unlockCharacter = useGameStore((state) => state.unlockCharacter);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedTimeRef = useRef<string>('');

  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;
    
    const timeKey = `${gameState.time.year}-${gameState.time.month}-${gameState.time.week}`;
    if (lastProcessedTimeRef.current === timeKey) return;
    lastProcessedTimeRef.current = timeKey;

    const runWorldUpdate = async () => {
      // 1. Chance to generate new NPC if count is low
      if (gameState.dynamicNPCs.length < 8 && Math.random() < 0.4) {
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
            logs: [...prev.logs, { id: logIdCounter++, text: `🔍 娱乐圈新面孔：【${newNPC.name}】（${newNPC.title}）加入了社交网络。`, type: 'info' }].slice(-50)
          };
        });
      }

      // 2. Chance for existing NPCs to post
      const allNPCs = [...SOCIAL_USERS, ...gameState.dynamicNPCs];
      const postingNPC = allNPCs[Math.floor(Math.random() * allNPCs.length)];
      
      if (Math.random() < 0.5) {
        const gameContext = `当前时间：第${gameState.time.year}年${gameState.time.month}月第${gameState.time.week}周。主角${gameState.player.name}正在娱乐圈闯荡。`;
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
    // Test-only: open one role card for quick verification.
    unlockCharacter('shen_mo');
  }, [unlockCharacter]);

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
        newLogs.push({ id: logIdCounter++, text: `🏆 获得成就：【${achievement.name}】！${achievement.desc}`, type: 'success' });
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
    if (state.time.year >= 3 && state.time.month >= 12 && state.time.week >= 4) {
      const ending = ENDINGS.find(e => e.condition(state.player, state.completedAchievements)) || ENDINGS[ENDINGS.length - 1];
      return {
        ...state,
        activeEvent: { id: ending.id, lineIndex: 0, isEnding: true }
      };
    }

    // 2. Check for Deadlines
    const deadline = DEADLINES.find(d => d.year === state.time.year && d.month === state.time.month && d.week === state.time.week);
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
          logs: [...state.logs, { id: logIdCounter++, text: `✅ 通过了年度考核：${deadline.title}！`, type: 'success' as const }].slice(-50)
        });
      }
    }

    // 3. Check for Story Events
    for (const event of STORY_EVENTS) {
      if (event.isTriggered(state.time, state.player, state.completedEvents)) {
        return {
          ...state,
          activeEvent: { id: event.id, lineIndex: 0 }
        };
      }
    }
    return checkQuests(checkAchievements(state));
  };

  const checkQuests = (state: GameState): GameState => {
    let newPlayer = { ...state.player };
    let newLogs = [...state.logs];
    let newCompletedQuests = [...newPlayer.completedQuests];
    let hasNewQuest = false;

    for (const quest of QUESTS) {
      if (!newCompletedQuests.includes(quest.id) && quest.condition(newPlayer, state.time)) {
        hasNewQuest = true;
        newCompletedQuests.push(quest.id);
        newLogs.push({ id: logIdCounter++, text: `✨ 完成任务：【${quest.title}】！${quest.desc}`, type: 'success' });
        
        if (quest.reward.money) newPlayer.money += quest.reward.money;
        if (quest.reward.stats) {
          newPlayer = applyEffect(newPlayer, quest.reward.stats, newLogs, `任务奖励`);
        }
      }
    }

    if (hasNewQuest) {
      newPlayer.completedQuests = newCompletedQuests;
      return {
        ...state,
        player: newPlayer,
        logs: newLogs.slice(-50)
      };
    }

    return state;
  };

  const advanceTime = (state: GameState, weeks: number): GameState => {
    let newWeek = state.time.week + weeks;
    let newMonth = state.time.month;
    let newYear = state.time.year;

    while (newWeek > 4) {
      newWeek -= 4;
      newMonth += 1;
    }
    while (newMonth > 12) {
      newMonth -= 12;
      newYear += 1;
    }

    let newStamina = state.player.stamina;
    if (state.player.companyId === 'star_shine') {
      newStamina = Math.min(state.player.maxStamina, newStamina + 5 * weeks);
    }

    return checkEvents({
      ...state,
      player: { ...state.player, stamina: newStamina },
      time: { year: newYear, month: newMonth, week: newWeek }
    });
  };

  const startGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    const background = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[4];
    const bonus = STARTING_BONUSES.find(b => b.id === selectedBonus) || STARTING_BONUSES[0];
    const company = COMPANIES.find(c => c.id === selectedCompany) || COMPANIES[0];

    const calculateContractEnd = (startTime: GameTime, durationWeeks: number): GameTime => {
      let week = startTime.week + durationWeeks;
      let month = startTime.month;
      let year = startTime.year;
      while (week > 4) {
        week -= 4;
        month += 1;
      }
      while (month > 12) {
        month -= 12;
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
    };

    const initialMoney = 2000 + (background.bonus.money || 0) + (bonus.bonus.money || 0) + (company.bonus.money || 0);
    const initialMaxStamina = 100 + (background.bonus.maxStamina || 0) + (bonus.bonus.maxStamina || 0) + (company.bonus.maxStamina || 0);

    const initialState: GameState = {
      time: { year: 1, month: 1, week: 1 },
      player: {
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
          classroom: 0
        },
        completedQuests: [],
        jobsCompleted: 0,
        social: {
          followers: initialStats.popularity * 10,
          following: [],
          posts: MOCK_POSTS.map(p => ({ ...p, initialCommentCount: p.comments.length })),
          conversations: [],
          relationships: {}
        }
      },
      logs: [{ id: logIdCounter++, text: `欢迎来到星梦之路！${playerName}，你的演艺生涯正式开始。`, type: 'info' }],
      currentLocation: 'home',
      completedEvents: [],
      completedAchievements: [],
      activeEvent: null,
      industryEvent: null,
      plannedTasks: [],
      dynamicNPCs: [],
      trendingTopics: [
        { topic: "新人演员海选启动", heat: 95 },
        { topic: "陈星宇新戏杀青", heat: 88 },
        { topic: "苏娜练习室生图", heat: 72 }
      ]
    };

    setGameState(checkEvents(initialState));
  };

  const getEffectiveStats = (player: Player): Stats => {
    const effective = { ...player.stats };
    if (player.equippedClothing) {
      const clothing = CLOTHING_ITEMS.find(c => c.id === player.equippedClothing);
      if (clothing && clothing.bonus) {
        Object.keys(clothing.bonus).forEach(key => {
          effective[key as keyof Stats] += clothing.bonus[key as keyof Stats] || 0;
        });
      }
    }
    return effective;
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
        return { ...prev, logs: [...prev.logs, { id: logIdCounter++, text: `违约金不足！解约【${currentCompany?.name}】需要 ¥${penalty.toLocaleString()}。`, type: 'error' }].slice(-50) };
      });
      return;
    }

    // 3. Perform switch
    const calculateContractEnd = (startTime: GameTime, durationWeeks: number): GameTime => {
      let week = startTime.week + durationWeeks;
      let month = startTime.month;
      let year = startTime.year;
      while (week > 4) {
        week -= 4;
        month += 1;
      }
      while (month > 12) {
        month -= 12;
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
        newLogs.push({ id: logIdCounter++, text: `支付了 ¥${penalty.toLocaleString()} 违约金，与【${currentCompany?.name}】解约。`, type: 'warning' });
      }
      newLogs.push({ id: logIdCounter++, text: `成功签约【${targetCompany.name}】！新的合同已生效。`, type: 'success' });

      return {
        ...prev,
        player: newPlayer,
        logs: newLogs.slice(-50)
      };
    });
  };

  const upgradeFacility = (facilityId: FacilityId) => {
    setGameState(prev => {
      if (!prev) return prev;
      const currentLevel = prev.player.facilities[facilityId];
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

      // Start story generation
      setStoryModal({
        isOpen: true,
        title: task.name,
        content: '正在生成剧情与评价...',
        isLoading: true
      });

      try {
        const [story, evaluationData] = await Promise.all([
          generateStory(gameState.player.name, task.name, task.desc, effectiveStats),
          generateJobEvaluation(task.name, effectiveStats, gameState.player.name)
        ]);
        
        setStoryModal(prev => ({ 
          ...prev, 
          content: story, 
          isLoading: false 
        }));

        setJobResultModal({
          isOpen: true,
          jobName: task.name,
          evaluation: evaluationData.evaluation,
          rating: evaluationData.rating,
          rewards: task.reward
        });
      } catch (error) {
        setStoryModal(prev => ({ ...prev, content: '剧情生成失败，但这并不影响你的星途。', isLoading: false }));
      }

      setGameState(prev => {
        if (!prev) return prev;
        let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
        newPlayer.stamina -= task.cost.stamina;
        if (task.cost.money) newPlayer.money -= task.cost.money;

        newPlayer.money += task.reward.money;
        newPlayer.stats.popularity += task.reward.popularity;
        newPlayer.jobsCompleted += 1;

        let newLogs = [...prev.logs, { 
          id: logIdCounter++, 
          text: `完成行程【${task.name}】！获得 ${task.reward.money} 金钱，人气 +${task.reward.popularity}。`, 
          type: 'success' 
        }];

        const nextState = {
          ...prev,
          player: newPlayer,
          logs: newLogs.slice(-50),
          plannedTasks: prev.plannedTasks.slice(1)
        };

        return advanceTime(nextState, task.time);
      });
    } else {
      // It's an Action
      setGameState(prev => {
        if (!prev) return prev;
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

        if (task.cost.money > 0) {
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】: 消耗 ${task.cost.stamina} 体力，花费 ${task.cost.money} 金钱。`, type: 'info' });
        } else if (task.cost.stamina > 0) {
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】: 消耗 ${task.cost.stamina} 体力。`, type: 'info' });
        }

        if (task.effect) {
          newPlayer = applyEffect(newPlayer, task.effect, newLogs, task.name);
        }

        if ((task as any).isUpgrade) {
          const { facilityId, nextLevel } = (task as any);
          newPlayer.facilities = { ...newPlayer.facilities, [facilityId]: nextLevel };
          newLogs.push({ id: logIdCounter++, text: `【${task.name}】完成！${FACILITIES[facilityId as FacilityId].name}已升级至 Lv.${nextLevel}。`, type: 'success' });
        }

        let nextState = {
          ...prev,
          player: newPlayer,
          logs: newLogs.slice(-50),
          plannedTasks: prev.plannedTasks.slice(1)
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

        return advanceTime(nextState, task.time);
      });
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
          // Apply company bonus (Muse Studio)
          if (player.companyId === 'muse_studio') {
            val = Math.round(val * 1.1);
          }
        }
        if (val) {
          newPlayer.stats[key as keyof Stats] = Math.max(0, newPlayer.stats[key as keyof Stats] + val);
          effectsStr.push(`${getStatName(key)}${val > 0 ? '+' : ''}${val}`);
        }
      }
    });

    if (effectsStr.length > 0) {
      logs.push({ id: logIdCounter++, text: `【${sourceName}】: ${effectsStr.join('，')}。`, type: 'success' });
    }

    return newPlayer;
  };

  const triggerIndustryEvent = async (state: GameState) => {
    const company = COMPANIES.find(c => c.id === state.player.companyId);
    const event = await generateIndustryEvent(
      state.player.name,
      state.player.stats,
      state.player.reputation,
      company?.name || '个人工作室'
    );
    setGameState(prev => prev ? { ...prev, industryEvent: event } : prev);
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

    if (action.id === 'read') {
      setStoryModal({
        isOpen: true,
        title: '研读剧本',
        content: '正在挑选剧本...',
        isLoading: true
      });
      try {
        const story = await generateScriptReading(gameState.player.name, gameState.player.stats);
        setStoryModal(prev => ({ ...prev, content: story, isLoading: false }));
      } catch (error) {
        setStoryModal(prev => ({ ...prev, content: '你认真研读了剧本，感觉演技有所提升。', isLoading: false }));
      }
    }

    setGameState(prev => {
      if (!prev) return prev;
      let newLogs = [...prev.logs];
      let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
      
      newPlayer.stamina -= action.cost.stamina;
      newPlayer.money -= action.cost.money;

      if (action.cost.money > 0) {
        newLogs.push({ id: logIdCounter++, text: `【${action.name}】: 消耗 ${action.cost.stamina} 体力，花费 ${action.cost.money} 金钱。`, type: 'info' });
      } else if (action.cost.stamina > 0) {
        newLogs.push({ id: logIdCounter++, text: `【${action.name}】: 消耗 ${action.cost.stamina} 体力。`, type: 'info' });
      }

      if (action.effect) {
        newPlayer = applyEffect(newPlayer, action.effect, newLogs, action.name);
      }

      let nextState = {
        ...prev,
        player: newPlayer,
        logs: newLogs.slice(-50)
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

      const finalState = advanceTime(nextState, action.time);
      
      // Trigger industry event randomly (10% chance)
      if (Math.random() < 0.1) {
        triggerIndustryEvent(finalState);
      }

      return finalState;
    });
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
        '今天的造型满分💯',
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
          const gameContext = `当前时间：第${prev.time.year}年${prev.time.month}月第${prev.time.week}周。主角${prev.player.name}正在娱乐圈闯荡。`;
          generateNPCResponse({
            name: npc.name,
            title: npc.title,
            personality: npc.personality || "普通"
          }, comment, gameContext, false).then(response => {
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
      const gameContext = `当前时间：第${prev.time.year}年${prev.time.month}月第${prev.time.week}周。主角${prev.player.name}正在娱乐圈闯荡。`;
      generateNPCResponse({
        name: npc.name,
        title: npc.title,
        personality: npc.personality || "普通"
      }, content, gameContext, true).then(response => {
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
    const finalMoneyReward = moneyReward - commissionAmount;

    // Start story generation
    setStoryModal({
      isOpen: true,
      title: job.name,
      content: '正在生成剧情...',
      isLoading: true
    });

    const competitors = SOCIAL_USERS.filter(u => u.stats);
    const randomRival = Math.random() < 0.3 ? competitors[Math.floor(Math.random() * competitors.length)] : undefined;

    try {
      const [story, evaluationData] = await Promise.all([
        generateStory(gameState.player.name, job.name, job.desc, effectiveStats, randomRival?.name),
        generateJobEvaluation(job.name, effectiveStats, gameState.player.name)
      ]);
      
      setStoryModal(prev => ({ 
        ...prev, 
        content: story, 
        isLoading: false 
      }));

      setJobResultModal({
        isOpen: true,
        jobName: job.name,
        evaluation: evaluationData.evaluation,
        rating: evaluationData.rating,
        rewards: { ...job.reward, money: finalMoneyReward, popularity: popularityReward }
      });
    } catch (error) {
      setStoryModal(prev => ({ ...prev, content: '剧情生成失败，但这并不影响你的星途。', isLoading: false }));
    }

    setGameState(prev => {
      if (!prev) return prev;
      let newPlayer = { ...prev.player, stats: { ...prev.player.stats } };
      newPlayer.stamina -= job.cost.stamina;
      if (job.cost.money) newPlayer.money -= job.cost.money;

      newPlayer.money += finalMoneyReward;
      newPlayer.stats.popularity += popularityReward;

      let newLogs = [...prev.logs, { 
        id: logIdCounter++, 
        text: `完成通告【${job.name}】！获得 ${finalMoneyReward} 金钱${commissionAmount > 0 ? ` (已扣除公司抽成 ${commissionAmount})` : ''}，人气 +${popularityReward}。`, 
        type: 'success' 
      }];

      const nextState = {
        ...prev,
        player: newPlayer,
        logs: newLogs.slice(-50)
      };

      const finalState = advanceTime(nextState, job.time);
      
      // Trigger industry event randomly (15% chance for jobs)
      if (Math.random() < 0.15) {
        triggerIndustryEvent(finalState);
      }

      return finalState;
    });
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

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
        >
          <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {title}
            </h3>
          </div>
          
          <div className="p-4 sm:p-8 min-h-[150px] sm:min-h-[200px] flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:text-left">
            {avatarUrl && (
              <motion.div 
                key={avatarUrl}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-full overflow-hidden border-4 border-zinc-50 shadow-sm bg-zinc-50"
              >
                <img src={avatarUrl} alt={speakerName} className="w-full h-full object-cover" />
              </motion.div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              {speakerName && (
                <div className={`text-base sm:text-lg font-bold mb-1 sm:mb-3 ${speakerColor}`}>
                  {speakerName}
                </div>
              )}
              <div className="text-lg sm:text-xl text-zinc-800 leading-relaxed">
                {line.text.replace(/\$\{player\.name\}/g, gameState.player.name)}
              </div>
            </div>
          </div>

          <div className="p-5 bg-zinc-50/50 border-t border-zinc-100 flex flex-col gap-3">
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
                    className="w-full text-left px-6 py-4 bg-white hover:bg-zinc-50 rounded-xl transition-colors text-zinc-900 font-medium border border-zinc-200 hover:border-zinc-300 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span>{choice.text}</span>
                      {choice.effect && (
                        <div className="flex gap-1 text-xs">
                           {Object.entries(choice.effect).map(([k, v]) => (
                             <span key={k} className={`${(v as number) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                               {getStatName(k)} {(v as number) > 0 ? '+' : ''}{v}
                             </span>
                           ))}
                        </div>
                      )}
                    </div>
                    {checkInfo}
                  </button>
                );
              })
            ) : (
              <button
                onClick={() => handleEventChoice()}
                className="w-full px-6 py-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors text-white font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                继续 <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 text-zinc-900 font-sans overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200 shadow-xl max-w-md w-full my-auto"
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
              <Star className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-3 text-zinc-900 tracking-tight">星梦之路</h1>
          <p className="text-zinc-500 text-center mb-10 text-sm">娱乐圈养成模拟</p>
          
          <form onSubmit={startGame} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <label className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-zinc-300 group-hover:border-indigo-500 transition-colors flex items-center justify-center bg-zinc-50">
                  {playerAvatar ? (
                    <img src={playerAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-400 group-hover:text-indigo-500">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-medium">上传头像</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPlayerAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <p className="text-[10px] text-zinc-400">点击上传你的艺人头像（可选）</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700">
                  请输入你的艺名
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const surnames = ["林", "苏", "陆", "沈", "顾", "叶", "周", "秦", "江", "白", "萧", "唐", "慕容", "南宫", "东方", "上官", "司马", "诸葛", "赵", "关", "凌", "盛", "裴", "时", "傅"];
                    const names = ["星辰", "清月", "云深", "曼妮", "北城", "诗涵", "慕白", "婉莹", "逸风", "若曦", "逸才", "雪见", "雪", "羽", "朔", "婉儿", "懿", "亮", "子龙", "云长", "之航", "予墨", "浅夏", "锦书", "青辞"];
                    const randomName = surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
                    setPlayerName(randomName);
                  }}
                  className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md hover:bg-zinc-200 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  随机
                </button>
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="例如：林星辰"
                required
                maxLength={10}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-700">
                  出身与天赋
                </label>
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
                  className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  随机抽取
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Background Card */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <User className="w-16 h-16 text-indigo-600" />
                  </div>
                  <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">出身背景</div>
                  <div className="font-bold text-zinc-900 text-lg mb-1">
                    {BACKGROUNDS.find(b => b.id === selectedBackground)?.name}
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    {BACKGROUNDS.find(b => b.id === selectedBackground)?.desc}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(BACKGROUNDS.find(b => b.id === selectedBackground)?.bonus || {}).map(([key, val]) => (
                      <span key={key} className="text-[10px] px-1.5 py-0.5 bg-zinc-50 rounded border border-zinc-100 text-zinc-600 font-medium">
                        {getStatName(key)} +{val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bonus Card */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star className="w-16 h-16 text-amber-500" />
                  </div>
                  <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">初始天赋</div>
                  <div className="font-bold text-zinc-900 text-lg mb-1">
                    {STARTING_BONUSES.find(b => b.id === selectedBonus)?.name}
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    {STARTING_BONUSES.find(b => b.id === selectedBonus)?.desc}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(STARTING_BONUSES.find(b => b.id === selectedBonus)?.bonus || {}).map(([key, val]) => (
                      <span key={key} className="text-[10px] px-1.5 py-0.5 bg-zinc-50 rounded border border-zinc-100 text-zinc-600 font-medium">
                        {getStatName(key)} +{val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Company Card */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group sm:col-span-2">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Building2 className="w-16 h-16 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">签约公司</div>
                    <button
                      type="button"
                      onClick={() => {
                        const randomCompany = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
                        setSelectedCompany(randomCompany.id);
                      }}
                      className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      随机
                    </button>
                  </div>
                  <div className="font-bold text-zinc-900 text-lg mb-1">
                    {COMPANIES.find(c => c.id === selectedCompany)?.name}
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    {COMPANIES.find(c => c.id === selectedCompany)?.desc}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(COMPANIES.find(c => c.id === selectedCompany)?.bonus || {}).map(([key, val]) => (
                        <span key={key} className="text-[10px] px-1.5 py-0.5 bg-zinc-50 rounded border border-zinc-100 text-zinc-600 font-medium">
                          {getStatName(key)} +{val}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      福利：{COMPANIES.find(c => c.id === selectedCompany)?.perk}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              开始演艺生涯 <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const { player, time, currentLocation, logs } = gameState;
  const effectiveStats = getEffectiveStats(player);
  const selectedCharacter = selectedCharacterId ? characters[selectedCharacterId] : null;
  const selectedCharacterProfile = selectedCharacterId ? CHARACTER_PROFILES[selectedCharacterId] : null;
  const selectedCharacterUnlocked = selectedCharacterId ? characterUnlocks[selectedCharacterId] : false;

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

  const StatRow = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-50 transition-colors group">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 transition-colors ${colorClass}`} />
        <span className="text-sm text-zinc-600 font-medium group-hover:text-zinc-900 transition-colors">{label}</span>
      </div>
      <span className="font-mono text-sm font-bold text-zinc-900">{value}</span>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-[#f8f9fa] text-zinc-900 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
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
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:h-screen shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 lg:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-full overflow-hidden flex items-center justify-center border border-zinc-200 shadow-sm">
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{player.name}</h2>
                <div className="flex flex-col gap-0.5 mt-0.5">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  <Trophy className="w-2.5 h-2.5 text-zinc-400" />
                  <span>{getPlayerLevel(player)}</span>
                  <span className="mx-1 opacity-30">|</span>
                  <span className={player.reputation >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {player.reputation >= 80 ? "德艺双馨" : 
                     player.reputation >= 40 ? "正能量偶像" : 
                     player.reputation >= 10 ? "口碑良好" : 
                     player.reputation > -10 ? "平平无奇" : 
                     player.reputation > -40 ? "争议艺人" : 
                     player.reputation > -80 ? "黑红顶流" : "劣迹艺人"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium tracking-wider">
                  <Building2 className="w-2.5 h-2.5" />
                  <span>{COMPANIES.find(c => c.id === player.companyId)?.name}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-zinc-400 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 lg:p-5 border-b border-zinc-100">
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500 font-medium tracking-wide">体力</span>
                <span className="font-mono font-medium text-zinc-900">{player.stamina}/{player.maxStamina}</span>
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
              <span className="font-mono text-zinc-900 font-bold text-base">¥{player.money.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-5">
            <div className="mb-6">
              <button 
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2 hover:text-zinc-600 transition-colors"
              >
                <span>导航</span>
                {isNavExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence>
                {isNavExpanded && (
                  <motion.nav 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {LOCATIONS.map(loc => {
                      const Icon = loc.id === 'home' ? Home : 
                                   loc.id === 'company' ? Building2 : 
                                   loc.id === 'city' ? Map : 
                                   loc.id === 'jobs' ? Briefcase : 
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
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group mb-1 ${
                            !isCharacterPanelOpen && currentLocation === loc.id 
                              ? 'bg-[#18181b] text-white shadow-sm' 
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
                          ? 'bg-[#18181b] text-white shadow-sm'
                          : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <User className={`w-5 h-5 transition-colors ${isCharacterPanelOpen ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'}`} />
                        <span className="tracking-wide text-[15px]">角色栏</span>
                      </div>
                    </button>
                  </motion.nav>
                )}
              </AnimatePresence>
            </div>

            <div>
              <button 
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2 hover:text-zinc-600 transition-colors"
              >
                <span>能力属性</span>
                {isStatsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence>
                {isStatsExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-0 overflow-hidden"
                  >
                    <StatRow icon={Sparkles} label="颜值" value={effectiveStats.appearance} colorClass="text-pink-400 group-hover:text-pink-500" />
                    <StatRow icon={Video} label="演技" value={effectiveStats.acting} colorClass="text-purple-400 group-hover:text-purple-500" />
                    <StatRow icon={Music} label="唱功" value={effectiveStats.singing} colorClass="text-blue-400 group-hover:text-blue-500" />
                    <StatRow icon={Activity} label="舞蹈" value={effectiveStats.dancing} colorClass="text-emerald-400 group-hover:text-emerald-500" />
                    <StatRow icon={Heart} label="魅力" value={effectiveStats.charm} colorClass="text-rose-400 group-hover:text-rose-500" />
                    <div className="pt-1.5 mt-1.5 border-t border-zinc-100">
                      <StatRow icon={Star} label="人气" value={effectiveStats.popularity} colorClass="text-amber-400 group-hover:text-amber-500" />
                      <StatRow icon={Activity} label="声望" value={player.reputation} colorClass={player.reputation >= 0 ? "text-emerald-400 group-hover:text-emerald-500" : "text-red-400 group-hover:text-red-500"} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f8f9fa]">
        
        {/* Top Header */}
        <header className="h-14 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-zinc-900 bg-zinc-100/80 px-3 py-1.5 rounded-full border border-zinc-200/50">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span className="font-bold tracking-tight text-xs sm:text-sm whitespace-nowrap">第 {time.year} 年 {time.month} 月 {time.week} 周</span>
            </div>
          </div>
        </header>

        {/* Action Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentLocation}-${isCharacterPanelOpen ? 'characters' : 'world'}-${selectedCharacterId ?? 'list'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              {isCharacterPanelOpen ? (
                <>
                  {!selectedCharacterId ? (
                    <div className="space-y-5">
                      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">角色栏</h2>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        {CHARACTER_SECTIONS.map((section) => (
                          <section key={section.title} className="rounded-3xl border border-zinc-200 bg-white p-4">
                            <h3 className="mb-3 text-lg font-bold text-zinc-400">{section.title}</h3>
                            <div className="grid grid-cols-2 gap-3">
                              {section.ids.map((characterId) => {
                                const unlocked = characterUnlocks[characterId];
                                return (
                                  <button
                                    key={characterId}
                                    type="button"
                                    disabled={!unlocked}
                                    onClick={() => {
                                      if (!unlocked) return;
                                      setSelectedCharacterId(characterId);
                                    }}
                                    className={unlocked ? 'text-left' : 'cursor-not-allowed text-left'}
                                  >
                                    <CharacterCard characterId={characterId} minimal />
                                  </button>
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

                      <div className="grid items-start grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
                        <div className="self-start bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                          <div className="h-[280px] bg-zinc-100">
                            {selectedCharacterId && CHARACTER_PROFILE_IMAGES[selectedCharacterId] ? (
                              <img
                                src={CHARACTER_PROFILE_IMAGES[selectedCharacterId]}
                                alt={CHARACTER_NAMES[selectedCharacterId]}
                                className={`w-full h-full object-contain bg-zinc-50 ${selectedCharacterUnlocked ? '' : 'grayscale opacity-60'}`}
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-200" />
                            )}
                          </div>
                          {selectedCharacter && (
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-2xl font-black text-zinc-900">{selectedCharacter.favor}</div>
                                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold">
                                  {STAGE_LABELS[selectedCharacter.stage] || selectedCharacter.stage}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${selectedCharacter.favor}%` }} />
                              </div>
                            </div>
                          )}

                          <div className="border-t border-zinc-200 p-3">
                            <h3 className="text-sm font-bold text-zinc-900 mb-2">核心台词</h3>
                            <div className="space-y-2 text-xs text-zinc-700 leading-5">
                              {selectedCharacterProfile?.coreQuotes?.slice(0, 3).map((quote, idx) => (
                                <p key={idx} className="rounded-lg bg-zinc-50 px-2.5 py-2">
                                  “{quote}”
                                </p>
                              ))}
                              {!selectedCharacterProfile?.coreQuotes?.length && (
                                <p className="text-zinc-500">暂无台词</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {selectedCharacterProfile?.surface && (
                            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                              <h3 className="text-base font-bold text-zinc-900 mb-2">表面人设</h3>
                              <p className="text-sm text-zinc-700 leading-6 max-h-24 overflow-auto">{selectedCharacterProfile.surface}</p>
                            </div>
                          )}

                          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                            <h3 className="text-base font-bold text-zinc-900 mb-2">特殊事件</h3>
                            <div className="space-y-2 text-sm font-medium text-zinc-600">
                              <div>{selectedCharacterUnlocked ? '初遇事件' : '???'}</div>
                              <div>{selectedCharacterUnlocked ? '关键抉择' : '???'}</div>
                              <div>{selectedCharacterUnlocked ? '羁绊终章' : '???'}</div>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                            <h3 className="text-base font-bold text-zinc-900 mb-2">角色属性</h3>
                            {selectedCharacter ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-zinc-50 rounded-xl p-3"><div className="text-xs text-zinc-500">好感度</div><div className="text-2xl font-black">{selectedCharacter.favor}</div></div>
                                <div className="bg-zinc-50 rounded-xl p-3"><div className="text-xs text-zinc-500">信任</div><div className="text-2xl font-black">{selectedCharacter.trust}</div></div>
                                <div className="bg-zinc-50 rounded-xl p-3"><div className="text-xs text-zinc-500">偏执度</div><div className="text-2xl font-black">{selectedCharacter.paranoia}</div></div>
                                <div className="bg-zinc-50 rounded-xl p-3"><div className="text-xs text-zinc-500">占有欲</div><div className="text-2xl font-black">{selectedCharacter.possessiveness}</div></div>
                                <div className="bg-zinc-50 rounded-xl p-3"><div className="text-xs text-zinc-500">不安感</div><div className="text-2xl font-black">{selectedCharacter.insecurity}</div></div>
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
                    {LOCATIONS.find(l => l.id === currentLocation)?.name}
                  </h2>

              {currentLocation === 'company' && (
                <div className="space-y-8">
                  {/* Current Contract Info */}
                  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Building2 className="w-24 h-24 text-zinc-900" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-widest">当前签约公司</div>
                        <h3 className="text-2xl font-black text-zinc-900 mb-2">
                          {COMPANIES.find(c => c.id === player.companyId)?.name}
                        </h3>
                        <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                          {COMPANIES.find(c => c.id === player.companyId)?.desc}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:gap-8">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">合同到期</div>
                          <div className="text-sm font-bold text-zinc-900">
                            {player.contractEnd ? `第 ${player.contractEnd.year} 年 ${player.contractEnd.month} 月 ${player.contractEnd.week} 周` : '长期合作'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">公司抽成</div>
                          <div className="text-sm font-bold text-zinc-900">
                            {Math.round((COMPANIES.find(c => c.id === player.companyId)?.commission || 0) * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">违约金</div>
                          <div className="text-sm font-bold text-red-500">
                            ¥{(COMPANIES.find(c => c.id === player.companyId)?.penalty || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">专属福利</div>
                          <div className="text-sm font-bold text-emerald-600">
                            {COMPANIES.find(c => c.id === player.companyId)?.perk}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facility Upgrades */}
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      公司设施
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.values(FACILITIES).map(facility => {
                        const currentLevel = player.facilities[facility.id];
                        const isMaxLevel = currentLevel >= facility.levels.length;
                        const nextLevelData = isMaxLevel ? null : facility.levels[currentLevel];
                        
                        return (
                          <div key={facility.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-zinc-900">{facility.name}</h4>
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Lv.{currentLevel}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4 flex-1">{facility.desc}</p>
                            
                            {nextLevelData ? (
                              <div className="space-y-3">
                                <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">下一级预览</div>
                                <div className="text-xs font-medium text-emerald-600">{nextLevelData.bonusDesc}</div>
                                <div className="flex items-center justify-between text-xs text-zinc-500">
                                  <span>费用: ¥{nextLevelData.cost.money.toLocaleString()}</span>
                                  <span>耗时: {nextLevelData.cost.time} 周</span>
                                </div>
                                <button 
                                  onClick={() => upgradeFacility(facility.id)}
                                  disabled={player.money < nextLevelData.cost.money}
                                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                                    player.money >= nextLevelData.cost.money 
                                      ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                  }`}
                                >
                                  升级设施
                                </button>
                              </div>
                            ) : (
                              <div className="text-center py-2 text-xs font-bold text-zinc-400 bg-zinc-50 rounded-xl">
                                已达到最高等级
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Learning Actions */}
                  {ACTIONS['company'] && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        进修学习
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ACTIONS['company'].map(action => (
                          <div
                            key={action.id}
                            className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all duration-300 group flex flex-col"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-base font-bold text-zinc-900">{action.name}</h3>
                              <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-medium">耗时 {action.time} 周</span>
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
                    </div>
                  )}

                  {/* Other Companies to Switch */}
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Map className="w-5 h-5 text-emerald-500" />
                      寻找新东家
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COMPANIES.filter(c => c.id !== player.companyId).map(company => {
                        const isMet = (!company.minPopularity || player.stats.popularity >= company.minPopularity) && 
                                     (!company.minStats || Object.entries(company.minStats).every(([k, v]) => effectiveStats[k as keyof Stats] >= (v as number)));
                        
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

                        return (
                          <div key={company.id} className={`bg-white p-5 rounded-2xl border ${isMet ? 'border-zinc-200' : 'border-zinc-100 opacity-60'} shadow-sm flex flex-col`}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-zinc-900">{company.name}</h4>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">抽成 {Math.round(company.commission * 100)}%</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">合同 {company.contractDuration} 周</span>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4 flex-1">{company.desc}</p>
                            
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {company.minPopularity && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${player.stats.popularity >= company.minPopularity ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    人气 {company.minPopularity}
                                  </span>
                                )}
                                {company.minStats && Object.entries(company.minStats).map(([k, v]) => (
                                  <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${effectiveStats[k as keyof Stats] >= (v as number) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {getStatName(k)} {v}
                                  </span>
                                ))}
                                {penalty > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">
                                    违约金 ¥{penalty.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => switchCompany(company.id)}
                                disabled={!isMet || player.money < penalty}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                                  isMet && player.money >= penalty
                                    ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                }`}
                              >
                                {penalty > 0 ? '支付违约金并签约' : '签约'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentLocation !== 'jobs' && currentLocation !== 'company' && currentLocation !== 'schedule' && currentLocation !== 'wardrobe' && currentLocation !== 'trophy' && currentLocation !== 'quests' && ACTIONS[currentLocation] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACTIONS[currentLocation].map(action => (
                    <div
                      key={action.id}
                      className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all duration-300 group flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-bold text-zinc-900">{action.name}</h3>
                        <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-medium">耗时 {action.time} 周</span>
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
                <div className="space-y-3">
                  {JOBS.map(job => {
                    const isMet = Object.entries(job.req).every(([key, val]) => effectiveStats[key as keyof Stats] >= (val as number));
                    
                    return (
                      <div key={job.id} className={`bg-white p-4 rounded-2xl border ${isMet ? 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm' : 'border-zinc-100 opacity-60'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-zinc-900">{job.name}</h3>
                            <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-medium">耗时 {job.time} 周</span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-2 leading-relaxed">{job.desc}</p>
                          
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
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 shrink-0 sm:w-28">
                          <button
                            onClick={() => takeJob(job)}
                            disabled={!isMet}
                            className={`w-full px-3 py-1.5 rounded text-xs font-bold transition-all ${
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
                            className={`w-full px-3 py-1.5 rounded text-xs font-bold transition-all ${
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
                                <p className="text-[10px] text-zinc-500 mt-0.5">耗时 {task.time} 周</p>
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
                          <img src={player.avatar} alt="Avatar" className="w-full h-full object-cover" />
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
                                    const timeA = a.timestamp.year * 48 + a.timestamp.month * 4 + a.timestamp.week;
                                    const timeB = b.timestamp.year * 48 + b.timestamp.month * 4 + b.timestamp.week;
                                    if (timeA === timeB) {
                                      return b.id.localeCompare(a.id);
                                    }
                                    return timeB - timeA;
                                  })
                                  .map(post => (
                                  <div key={post.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                    <div className="text-xs text-zinc-400 mb-2">
                                      第 {post.timestamp.year} 年 {post.timestamp.month} 月 {post.timestamp.week} 周
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
                                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
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
                        const timeA = a.timestamp.year * 48 + a.timestamp.month * 4 + a.timestamp.week;
                        const timeB = b.timestamp.year * 48 + b.timestamp.month * 4 + b.timestamp.week;
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
                                    {(author as any).title} · 第 {post.timestamp.year} 年 {post.timestamp.month} 月 {post.timestamp.week} 周
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
                                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
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
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-3">我的衣橱</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CLOTHING_ITEMS.map(item => {
                        const isOwned = player.inventory.includes(item.id);
                        const isEquipped = player.equippedClothing === item.id;
                        
                        return (
                          <div key={item.id} className={`p-3 rounded-xl border ${isEquipped ? 'border-indigo-500 bg-indigo-50/30' : 'border-zinc-200 bg-white'} flex flex-col`}>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-sm font-bold text-zinc-900">{item.name}</h4>
                              {isEquipped && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">已穿戴</span>}
                            </div>
                            <p className="text-xs text-zinc-500 mb-2 flex-1">{item.desc}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {Object.entries(item.bonus).map(([k, v]) => (
                                <span key={k} className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                  {getStatName(k)} +{v}
                                </span>
                              ))}
                            </div>
                            
                            {isOwned ? (
                              <button
                                onClick={() => setGameState(prev => prev ? { ...prev, player: { ...prev.player, equippedClothing: isEquipped ? null : item.id } } : prev)}
                                className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${isEquipped ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                              >
                                {isEquipped ? '脱下' : '穿上'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
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
                                disabled={player.money < item.cost}
                                className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${player.money >= item.cost ? 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50' : 'bg-zinc-50 text-zinc-400 border border-zinc-100 cursor-not-allowed'}`}
                              >
                                购买 (¥{item.cost})
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {currentLocation === 'quests' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                    <h3 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-500" />
                      当前任务
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {QUESTS.map(quest => {
                        const isCompleted = player.completedQuests.includes(quest.id);
                        return (
                          <div key={quest.id} className={`p-4 rounded-xl border ${isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-zinc-50 border-zinc-100'} flex gap-4 items-start relative overflow-hidden`}>
                            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-400'}`}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-base font-bold ${isCompleted ? 'text-emerald-900' : 'text-zinc-700'}`}>{quest.title}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${quest.type === 'short' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                  {quest.type === 'short' ? '短期' : '长期'}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-500 mt-1">{quest.desc}</p>
                              {!isCompleted && (
                                <div className="mt-3 pt-3 border-t border-zinc-200/50">
                                  <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">奖励</div>
                                  <div className="flex flex-wrap gap-2">
                                    {quest.reward.money && <span className="text-xs font-medium text-emerald-600">¥{quest.reward.money}</span>}
                                    {quest.reward.stats && Object.entries(quest.reward.stats).map(([k, v]) => (
                                      <span key={k} className="text-xs font-medium text-indigo-600">{getStatName(k)} +{v}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {isCompleted && (
                              <div className="absolute -right-2 -bottom-2 opacity-10">
                                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentLocation === 'trophy' && (
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <h3 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    荣誉墙
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ACHIEVEMENTS.map(achieve => {
                      const isUnlocked = gameState.completedAchievements.includes(achieve.id);
                      return (
                        <div key={achieve.id} className={`p-4 rounded-xl border ${isUnlocked ? 'bg-amber-50/50 border-amber-200' : 'bg-zinc-50 border-zinc-100 opacity-60'} flex gap-4 items-start`}>
                          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-amber-100 text-amber-600' : 'bg-zinc-200 text-zinc-400'}`}>
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-base font-bold ${isUnlocked ? 'text-amber-900' : 'text-zinc-500'}`}>{achieve.name}</h4>
                            <p className="text-sm text-zinc-500 mt-1">{achieve.desc}</p>
                            {!isUnlocked && (
                              <div className="text-xs text-zinc-400 mt-2 font-medium">
                                奖励: {Object.entries(achieve.reward).map(([k, v]) => `${getStatName(k)}+${v}`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Log Panel */}
        <div className="h-24 sm:h-32 bg-white border-t border-zinc-200 flex flex-col shrink-0 z-10">
          <div className="px-4 py-1.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
            <Activity className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">动态日志</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
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
      {renderEventModal()}

      {/* Industry Event Modal */}
      {gameState.industryEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-200"
          >
            <div className="bg-zinc-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{gameState.industryEvent.title}</h3>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">娱乐圈抉择</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="text-zinc-700 leading-loose text-lg text-justify whitespace-pre-wrap font-serif tracking-wide mb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                {gameState.industryEvent.scenario}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {gameState.industryEvent.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleIndustryChoice(choice)}
                    className="group relative bg-white border-2 border-zinc-100 hover:border-zinc-900 p-5 rounded-2xl transition-all text-left flex items-center justify-between overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="text-sm font-black text-zinc-900 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                        选项 {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="text-base font-bold text-zinc-800 mb-1">{choice.text}</div>
                      <div className="text-xs text-zinc-400 font-medium italic">{choice.impact}</div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 relative z-10">
                      {choice.rewards && Object.entries(choice.rewards).map(([k, v]) => (
                        v !== 0 && (
                          <span key={k} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(v) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {getStatName(k) || (k === 'money' ? '金钱' : k === 'reputation' ? '声望' : k)} {Number(v) > 0 ? '+' : ''}{v}
                          </span>
                        )
                      ))}
                    </div>
                    
                    <div className="absolute top-0 right-0 w-1 h-full bg-zinc-900 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                  </button>
                ))}
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
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-zinc-200"
            >
              <div className="p-6">
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
                
                <div className="min-h-[150px] flex items-center justify-center">
                  {storyModal.isLoading ? (
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
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
                <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex justify-end">
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
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <h3 className="text-2xl font-black text-white mb-1 relative z-10 tracking-tight">{jobResultModal.jobName}</h3>
                <p className="text-indigo-100 text-sm font-medium relative z-10">工作结算</p>
              </div>
              
              <div className="p-6">
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
                        <span className="text-lg">¥</span>
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
