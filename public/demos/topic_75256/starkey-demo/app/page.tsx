'use client';

import { useEffect, useState, useRef } from 'react';
import { GameState, TrainingTopic, Difficulty, OptionId, Scenario, Option, RewardInfo, getLevel, getNextThreshold, getScorePerQuestion, getStationIndex, STATION_THRESHOLDS, SensoryLevel } from '@/types';
import { mockScenario } from '@/data/mockData';
// 预生成的情景数据（运行 npm run pregen 生成）
import pregenData from './data/scenarios.json';
import { SKINS, getSkinById, type SkinId } from '@/components/PixelCharacter';
import Screen1Interest from '@/components/Screen1Interest';
import Screen2Scenario from '@/components/Screen2Scenario';
import Screen3Feedback from '@/components/Screen3Feedback';
import LoadingScreen from '@/components/LoadingScreen';
import CornerCharacter from '@/components/CornerCharacter';
import SensorySelector from '@/components/SensorySelector';
import SubwayMap from '@/components/SubwayMap';
import { gentleSound } from '@/lib/gentleSound';
import styles from './page.module.css';

const SCORE_KEY = 'starkey.score';
const SKIN_KEY = 'starkey.skin';
const SENSORY_KEY = 'starkey.sensory';
const SOUND_KEY = 'starkey.sound';
const INTEREST_KEY = 'starkey.interest';
const TOPIC_KEY = 'starkey.topic';
const DIFFICULTY_KEY = 'starkey.difficulty';

// 前端超时控制（比后端稍长，给回落留时间）
const FETCH_TIMEOUT_MS = 18000;

// 从 localStorage 读取上次选择，无则使用默认值
function getSavedInterest(): string {
  try { return localStorage.getItem(INTEREST_KEY) || '地铁'; } catch { return '地铁'; }
}
function getSavedTopic(): TrainingTopic {
  try {
    const saved = localStorage.getItem(TOPIC_KEY);
    if (saved === '看懂心情' || saved === '控制情绪' || saved === '学会合作') return saved as TrainingTopic;
  } catch { /* ignore */ }
  return '看懂心情';
}
function getSavedDifficulty(): Difficulty {
  try {
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    if (saved === 'easy' || saved === 'medium' || saved === 'hard') return saved as Difficulty;
  } catch { /* ignore */ }
  return 'medium';
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('screen1');
  const [interest, setInterest] = useState(getSavedInterest);
  const [topic, setTopic] = useState<TrainingTopic>(getSavedTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>(getSavedDifficulty);
  const [scenarioIndex, setScenarioIndex] = useState(0); // 题目轮换索引，避免重复
  const [selectedOption, setSelectedOption] = useState<OptionId | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario>(mockScenario);
  const [reward, setReward] = useState<RewardInfo | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedSkin, setSelectedSkin] = useState<SkinId>('default');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  // 感官强度：默认 quiet（最低刺激）；lively 必须主动选择
  const [sensoryLevel, setSensoryLevel] = useState<SensoryLevel>('quiet');
  // 音效开关：默认关闭；lively 模式下可开启
  const [soundOn, setSoundOn] = useState<boolean>(false);
  // 演示版提示：当用户输入的兴趣不在预置列表时显示
  const [demoHint, setDemoHint] = useState<string | null>(null);
  // 庆祝动画触发
  const [showCelebration, setShowCelebration] = useState(false);
  
  // 无重复轮换队列：每个主题维护一个打乱顺序的索引队列
  const shuffleQueueRef = useRef<Map<string, number[]>>(new Map());
  // 记录当前主题的队列位置
  const queueIndexRef = useRef<number>(0);
  // 记录上一题的索引（用于避免单题时紧接着重复）
  const lastScenarioIndexRef = useRef<number>(-1);

  // 初始化：判断演示模式
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interest: '地铁', topic: '看懂心情', difficulty: 'easy' }),
        });
        const data = await res.json();
        if (!cancelled) setIsDemoMode(!!data?.demo);
      } catch {
        if (!cancelled) setIsDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const savedScore = localStorage.getItem(SCORE_KEY);
      if (savedScore) setTotalScore(parseInt(savedScore, 10) || 0);
      const savedSkin = localStorage.getItem(SKIN_KEY);
      if (savedSkin && getSkinById(savedSkin as SkinId).unlocked) {
        setSelectedSkin(savedSkin as SkinId);
      }
      const savedSensory = localStorage.getItem(SENSORY_KEY);
      if (savedSensory === 'quiet' || savedSensory === 'gentle' || savedSensory === 'lively') {
        setSensoryLevel(savedSensory as SensoryLevel);
      }
      const savedSound = localStorage.getItem(SOUND_KEY);
      if (savedSound !== null) {
        const on = savedSound === 'true';
        setSoundOn(on);
        gentleSound.setEnabled(on);
      }
    } catch { /* ignore */ }
  }, []);

  function saveScore(score: number) {
    try { localStorage.setItem(SCORE_KEY, String(score)); } catch { /* ignore */ }
  }

  function saveSkin(skinId: SkinId) {
    try { localStorage.setItem(SKIN_KEY, skinId); } catch { /* ignore */ }
  }

  function saveSensory(level: SensoryLevel) {
    try { localStorage.setItem(SENSORY_KEY, level); } catch { /* ignore */ }
  }

  function saveSound(on: boolean) {
    try { localStorage.setItem(SOUND_KEY, String(on)); } catch { /* ignore */ }
  }

  function saveInterest(value: string) {
    try { localStorage.setItem(INTEREST_KEY, value); } catch { /* ignore */ }
  }

  function saveTopic(value: TrainingTopic) {
    try { localStorage.setItem(TOPIC_KEY, value); } catch { /* ignore */ }
  }

  function saveDifficulty(value: Difficulty) {
    try { localStorage.setItem(DIFFICULTY_KEY, value); } catch { /* ignore */ }
  }

  // 切换感官等级
  const handleChangeSensory = (level: SensoryLevel) => {
    setSensoryLevel(level);
    saveSensory(level);
    // 离开动感模式时自动关闭音效
    if (level !== 'lively' && soundOn) {
      setSoundOn(false);
      saveSound(false);
      gentleSound.setEnabled(false);
    }
    // 进入动感模式后音效仍需用户主动开（默认关）
  };

  // 切换音效
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    saveSound(next);
    gentleSound.setEnabled(next);
  };

  function getSceneEmoji(interestStr: string): string {
    const map: Record<string, string> = {
      '地铁': '🚇', '恐龙': '🦖', '天文': '🔭', '乐高': '🧩',
      '火车': '🚂', '汽车': '🚗', '海洋': '🌊', '太空': '🚀',
      '动物': '🐾', '足球': '⚽', '画画': '🎨', '数字': '🔢',
    };
    for (const [k, v] of Object.entries(map)) {
      if (interestStr.includes(k)) return v;
    }
    return '✨';
  }

  // 带超时的 fetch，任何错误都返回 null（触发回落）
  async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  // 统一工具：将"文本选项"随机打乱后重新分配 A/B/C，避免固定位置刷高分
  function shuffleAndAssignIds(
    rawOptions: Array<{ text: string; feedback: string; feedbackTone: 'gentle' | 'supportive'; icon?: string }>
  ): Option[] {
    const copy = rawOptions.slice();
    // Fisher-Yates 随机打乱
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const letters: OptionId[] = ['A', 'B', 'C'];
    return copy.map((opt, i) => ({
      id: letters[i],
      text: opt.text,
      feedback: opt.feedback,
      feedbackTone: opt.feedbackTone,
      icon: opt.icon,
    }));
  }

  // 生成情景：任何异常都回落到预置数据，永不抛错
  // 返回情景 + 实际使用的兴趣 + 演示版提示信息
  interface GenerateResult {
    scenario: Scenario;
    usedInterest: string;
    demoHint: string | null;
  }

  // 预置主题白名单
  const PREGEN_TOPICS_LOCAL = ['地铁', '恐龙', '乐高', '海洋', '太空', '汽车', '动物', '公园'];

  // 非预置主题 → 最接近的预置主题（用于回落时给用户明确的一致主题）
  function pickClosestPregenTopic(inputInterest: string): string {
    const lower = inputInterest.toLowerCase();
    const keywordMap: Array<{ keywords: string[]; target: string }> = [
      { keywords: ['风扇', '空调', '家电', '机器', '电器', '电子'], target: '汽车' },
      { keywords: ['天文', '星星', '行星', '宇航', '登月', '银河系', '宇宙', '月亮', '太阳'], target: '太空' },
      { keywords: ['鲸鱼', '鱼', '海豚', '海底', '深潜', '鲸', '水母', '章鱼'], target: '海洋' },
      { keywords: ['篮球', '足球', '运动', '比赛', '跑步', '游泳'], target: '公园' },
      { keywords: ['画画', '绘画', '艺术家', '涂鸦'], target: '博物馆' as any },
      { keywords: ['猫猫', '狗狗', '宠物', '小猫', '小狗', '鸟'], target: '动物' },
      { keywords: ['阅读', '看书', '书', '绘本'], target: '图书馆' as any },
    ];
    // 上面 map 中的非白名单 target（博物馆/图书馆）不是预生成主题，统一落到"公园"
    for (const m of keywordMap) {
      if (m.keywords.some(k => lower.includes(k))) {
        const t = m.target as string;
        return PREGEN_TOPICS_LOCAL.includes(t) ? t : '公园';
      }
    }
    // 默认回落：地铁（演示版默认主题）
    return '地铁';
  }

  // Fisher-Yates 洗牌算法
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 三维队列的 key
  function queueKey(theme: string, skill: string, diff: string): string {
    return `${theme}__${skill}__${diff}`;
  }

  // 初始化或重置某三维组合的轮换队列
  function initShuffleQueue(key: string, scenarios: unknown[]): number[] {
    const indices = scenarios.map((_, i) => i);
    const shuffled = shuffleArray(indices);
    shuffleQueueRef.current.set(key, shuffled);
    queueIndexRef.current = 0;
    lastScenarioIndexRef.current = -1;
    return shuffled;
  }

  // 主题图标映射（与预生成脚本保持一致）
  const THEME_ICONS: Record<string, string> = {
    '地铁': '🚇',
    '恐龙': '🦕',
    '乐高': '🧱',
    '海洋': '🌊',
    '太空': '🚀',
    '汽车': '🚗',
    '动物': '🐾',
    '公园': '🌳',
  };

  // 检测预生成数据格式（v1 扁平数组 / v2 三维结构）
  function isV3Data(data: unknown): data is { data: Record<string, Record<string, Record<string, unknown[]>>> } {
    return !!data && typeof data === 'object' && 'data' in data && !!(data as any).data && !(data as any).scenarios;
  }

  // 从三维预生成数据按 (主题, 本领, 难度) 精确取题（无重复轮换）
  function getFromPregen3D(themeName: string, skillName: string, difficulty: string): Scenario | null {
    if (!isV3Data(pregenData)) return null;

    const scenarioList = pregenData.data?.[themeName]?.[skillName]?.[difficulty];
    if (!Array.isArray(scenarioList) || scenarioList.length === 0) return null;

    const validScenarios = scenarioList.filter(s => s && (s as any).scene && (s as any).scene.length >= 10);
    if (validScenarios.length === 0) return null;

    const key = queueKey(themeName, skillName, difficulty);

    // 获取或初始化轮换队列
    let queue = shuffleQueueRef.current.get(key);
    if (!queue || queue.length !== validScenarios.length) {
      queue = initShuffleQueue(key, validScenarios);
    }

    let currentIndex = queueIndexRef.current;

    // 如果队列已用完，重新洗牌并确保第一条不等于上一条
    if (currentIndex >= queue.length) {
      queue = shuffleArray([...queue]);
      if (validScenarios.length > 1) {
        const lastIndex = lastScenarioIndexRef.current;
        if (lastIndex >= 0 && lastIndex < validScenarios.length) {
          const lastQueuePos = queue.indexOf(lastIndex);
          if (lastQueuePos === 0) {
            [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
          }
        }
      }
      currentIndex = 0;
      shuffleQueueRef.current.set(key, queue);
    }

    const scenarioIndex = queue[currentIndex];
    const selected = validScenarios[scenarioIndex] as any;
    if (!selected.options || selected.options.length !== 3) return null;

    queueIndexRef.current = currentIndex + 1;
    lastScenarioIndexRef.current = scenarioIndex;

    const rawOptions: Array<{ text: string; feedback: string; feedbackTone: 'gentle' | 'supportive'; icon?: string }> = selected.options.map((o: any) => ({
      text: o.text,
      feedback: o.feedback,
      feedbackTone: o.isRecommended ? 'gentle' : 'supportive',
      icon: o.icon,
    }));
    const options = shuffleAndAssignIds(rawOptions);
    return {
      title: selected.skillTag || skillName,
      theme: themeName,
      scene: getSceneEmoji(themeName),
      sceneIcon: selected.sceneIcon,
      description: selected.scene,
      question: selected.question || '你会怎么做？',
      options,
      skillTag: selected.skillTag,
      socialRule: selected.socialRule,
      parentTip: selected.parentTip,
    };
  }

  // 从预生成数据按主题关键词严格获取情景（兼容 v1 旧格式）
  function getFromPregenByTopic(topicName: string): Scenario | null {
    // 优先尝试 v2 三维格式（用"看懂心情"作为默认本领、"medium"作为默认难度兜底）
    if (isV3Data(pregenData)) {
      const skills = Object.keys(pregenData.data?.[topicName] || {});
      if (skills.length > 0) {
        const diffs = Object.keys(pregenData.data[topicName][skills[0]] || {});
        if (diffs.length > 0) {
          const first = getFromPregen3D(topicName, skills[0], diffs[0]);
          if (first) return first;
        }
      }
      return null;
    }

    // v1 旧格式：扁平数组
    const pregenScenarios: Array<{ scene: string; question: string; sceneIcon: string; options: Array<{ text: string; icon: string; isRecommended: boolean; feedback: string }>; skillTag: string; socialRule: string; parentTip: string }> = (pregenData as any)?.scenarios || [];
    const validScenarios = pregenScenarios.filter(s => s.scene && s.scene.length >= 10);
    if (validScenarios.length === 0) {
      console.warn('预生成数据为空');
      return null;
    }

    const targetIcon = THEME_ICONS[topicName];
    const matched = targetIcon
      ? validScenarios.filter(s => s.sceneIcon === targetIcon)
      : validScenarios.filter(s => {
          const topicLower = topicName.toLowerCase();
          const sceneLower = (s.scene || '').toLowerCase();
          const skillLower = (s.skillTag || '').toLowerCase();
          return sceneLower.includes(topicLower) || skillLower.includes(topicLower);
        });

    if (matched.length === 0) return null;

    let queue = shuffleQueueRef.current.get(topicName);
    if (!queue || queue.length !== matched.length) {
      queue = initShuffleQueue(topicName, matched);
    }

    let currentIndex = queueIndexRef.current;

    if (currentIndex >= queue.length) {
      queue = shuffleArray([...queue]);
      if (matched.length === 1) {
        currentIndex = 0;
      } else {
        const lastIndex = lastScenarioIndexRef.current;
        if (lastIndex >= 0 && lastIndex < matched.length) {
          const lastQueuePos = queue.indexOf(lastIndex);
          if (lastQueuePos === 0) {
            [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
          }
        }
        currentIndex = 0;
      }
      shuffleQueueRef.current.set(topicName, queue);
    }

    const scenarioIndex = queue[currentIndex];
    const selected = matched[scenarioIndex];
    if (!selected.options || selected.options.length !== 3) return null;

    queueIndexRef.current = currentIndex + 1;
    lastScenarioIndexRef.current = scenarioIndex;

    const rawOptions: Array<{ text: string; feedback: string; feedbackTone: 'gentle' | 'supportive'; icon?: string }> = selected.options.map((o) => ({
      text: o.text,
      feedback: o.feedback,
      feedbackTone: o.isRecommended ? 'gentle' : 'supportive',
      icon: o.icon,
    }));
    const options = shuffleAndAssignIds(rawOptions);
    return {
      title: selected.skillTag || '社交练习',
      theme: topicName,
      scene: getSceneEmoji(topicName),
      sceneIcon: selected.sceneIcon,
      description: selected.scene,
      question: selected.question || '你会怎么做？',
      options,
      skillTag: selected.skillTag,
      socialRule: selected.socialRule,
      parentTip: selected.parentTip,
    };
  }

  // 渲染前一致性校验：情景内容是否与显示主题一致
  function verifyScenarioConsistency(scenario: Scenario, displayedTopic: string): boolean {
    if (!scenario.description || scenario.description.length < 5) return false;
    const topicLower = displayedTopic.toLowerCase();
    const descLower = scenario.description.toLowerCase();
    const optTextLower = scenario.options.map(o => o.text.toLowerCase()).join(' ');
    const isContentMatch = descLower.includes(topicLower) || optTextLower.includes(topicLower);
    
    if (isContentMatch) return true;
    
    const PRESET_TOPICS_LOCAL = ['地铁', '恐龙', '乐高', '海洋', '太空', '汽车', '动物', '公园'];
    if (PRESET_TOPICS_LOCAL.includes(displayedTopic)) {
      return true;
    }
    
    return false;
  }

  // 从预生成数据随机获取一条情景（兼容旧调用）
  function getFromPregen(inputInterest: string): Scenario | null {
    // 直接使用新的按主题获取逻辑
    return getFromPregenByTopic(inputInterest);
  }

  // AI 实时生成情景
  async function generateWithAI(
    inputInterest: string,
    inputTopic: string,
    inputDifficulty: Difficulty,
    sceneIdx: number = 0
  ): Promise<GenerateResult> {
    try {
      const res = await fetchWithTimeout(
        '/api/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interest: inputInterest, topic: inputTopic, difficulty: inputDifficulty, sceneIndex: sceneIdx }),
        },
        FETCH_TIMEOUT_MS
      );

      if (!res) {
        console.warn('前端 fetch 超时或失败，使用最接近的预置情景');
        const fallbackTopic = pickClosestPregenTopic(inputInterest);
        const fallback = getFromPregenByTopic(fallbackTopic) || buildScenarioFromMock(fallbackTopic, inputTopic);
        return {
          scenario: fallback,
          usedInterest: fallbackTopic,
          demoHint: `「${inputInterest}」的专属情景正式版才有，先用「${fallbackTopic}」带你体验 ✦`,
        };
      }

      const data = await res.json();

      if (!data?.success || !data?.data) {
        console.warn('后端返回异常，使用最接近的预置情景');
        const fallbackTopic = pickClosestPregenTopic(inputInterest);
        const fallback = getFromPregenByTopic(fallbackTopic) || buildScenarioFromMock(fallbackTopic, inputInterest);
        return {
          scenario: fallback,
          usedInterest: fallbackTopic,
          demoHint: `「${inputInterest}」的专属情景正式版才有，先用「${fallbackTopic}」带你体验 ✦`,
        };
      }

      const generated = data.data;
      const usedInterest = data.usedInterest || inputInterest;
      const originalInterest = data.originalInterest || inputInterest;
      const isDemoFallback = data.demo === true;

      // 将 isRecommended 映射成 feedbackTone，不暴露"正确答案"给前端渲染；选项顺序随机化
      const rawOptions: Array<{ text: string; feedback: string; feedbackTone: 'gentle' | 'supportive'; icon?: string }> =
        Array.isArray(generated.options)
          ? generated.options.map((opt: any) => ({
              text: String(opt.text ?? ''),
              feedback: String(opt.feedback ?? ''),
              feedbackTone: opt.isRecommended ? 'gentle' : 'supportive',
              icon: opt.icon,
            }))
          : mockScenario.options.map((o) => ({
              text: o.text,
              feedback: o.feedback,
              feedbackTone: o.feedbackTone,
              icon: o.icon,
            }));

      const options = shuffleAndAssignIds(rawOptions);

      const scenario: Scenario = {
        title: generated.skillTag || inputTopic,
        theme: usedInterest, // 使用 AI 返回的实际主题，确保与内容一致
        scene: getSceneEmoji(usedInterest),
        sceneIcon: generated.sceneIcon,
        description: generated.scene,
        question: generated.question || '你会怎么做？',
        options,
        skillTag: generated.skillTag,
        socialRule: generated.socialRule,
        parentTip: generated.parentTip,
      };

      // 关键校验：生成的情景是否真正围绕用户的兴趣主题？
      // 如不匹配，走透明回落而非静默显示不匹配内容
      const isConsistent = verifyScenarioConsistency(scenario, usedInterest);
      if (!isConsistent) {
        console.warn(`AI 生成的「${usedInterest}」情景内容与主题不一致，回落至预置`);
        const fallbackTopic = pickClosestPregenTopic(inputInterest);
        const fallback = getFromPregenByTopic(fallbackTopic) || buildScenarioFromMock(fallbackTopic, inputInterest);
        return {
          scenario: fallback,
          usedInterest: fallbackTopic,
          demoHint: `「${inputInterest}」的专属情景正式版才有，先用「${fallbackTopic}」带你体验 ✦`,
        };
      }

      return {
        scenario,
        usedInterest,
        demoHint: (isDemoFallback && originalInterest !== usedInterest)
          ? `「${originalInterest}」的专属情景正式版才有，先用「${usedInterest}」带你体验 ✦`
          : null
      };
    } catch {
      console.warn('generateWithAI 捕获异常，使用最接近的预置情景');
      const fallbackTopic = pickClosestPregenTopic(inputInterest);
      const fallback = getFromPregenByTopic(fallbackTopic) || buildScenarioFromMock(fallbackTopic, inputInterest);
      return {
        scenario: fallback,
        usedInterest: fallbackTopic,
        demoHint: `「${inputInterest}」的专属情景正式版才有，先用「${fallbackTopic}」带你体验 ✦`,
      };
    }
  }

  // 统一情景获取入口
  async function getScenario(
    inputInterest: string,
    inputTopic: string,
    inputDifficulty: Difficulty,
    useAI: boolean,
    sceneIdx: number = 0
  ): Promise<GenerateResult> {
    // 统一走 API：API 内部有完整的 pregen 题库和兴趣匹配逻辑
    // 本地 pregenData 只作为 API 完全不可用时的最后兜底
    try {
      const result = await generateWithAI(inputInterest, inputTopic, inputDifficulty, sceneIdx);
      // 双重校验：确保返回的内容确实与用户兴趣相关
      const isConsistent = verifyScenarioConsistency(result.scenario, result.usedInterest);
      if (isConsistent) {
        return result;
      }
      console.warn(`API 返回的「${result.usedInterest}」情景与兴趣不一致，尝试本地兜底`);
    } catch (e) {
      console.warn('API 调用失败，使用本地兜底:', e);
    }

    // ===== 本地兜底逻辑（API 不可用时才走到这里） =====
    // 先尝试从三维预生成数据精确匹配 (主题, 本领, 难度)
    if (isV3Data(pregenData)) {
      const pregen3D = getFromPregen3D(inputInterest, inputTopic, inputDifficulty);
      if (pregen3D) {
        return { scenario: pregen3D, usedInterest: inputInterest, demoHint: null };
      }
      // 精确匹配失败：尝试同主题同本领的其他难度降级
      for (const fallbackDiff of ['medium', 'easy', 'hard'] as const) {
        if (fallbackDiff === inputDifficulty) continue;
        const fallback = getFromPregen3D(inputInterest, inputTopic, fallbackDiff);
        if (fallback) {
          return { scenario: fallback, usedInterest: inputInterest, demoHint: null };
        }
      }
      // 再不行：同主题任意本领任意难度
      const skills = Object.keys(pregenData.data?.[inputInterest] || {});
      for (const sk of skills) {
        for (const d of ['medium', 'easy', 'hard'] as const) {
          const fallback = getFromPregen3D(inputInterest, sk, d);
          if (fallback) {
            return { scenario: fallback, usedInterest: inputInterest, demoHint: null };
          }
        }
      }
    }

    // v2/v1 兼容：按主题取题
    const pregenScenario = getFromPregenByTopic(inputInterest);
    if (pregenScenario) {
      return { scenario: pregenScenario, usedInterest: inputInterest, demoHint: null };
    }

    // 预生成数据中没有匹配：回落至最接近的预置主题
    console.warn(`本地预生成数据中未找到「${inputInterest}」相关情景，使用最接近的预置主题`);
    const fallbackTopic = pickClosestPregenTopic(inputInterest);
    const fallback = getFromPregenByTopic(fallbackTopic) || buildScenarioFromMock(fallbackTopic, inputTopic);
    return {
      scenario: fallback,
      usedInterest: fallbackTopic,
      demoHint: `「${inputInterest}」的专属情景正式版才有，先用「${fallbackTopic}」带你体验 ✦`
    };
  }

  // 从预置数据构建 Scenario（兜底）：
  // 只接受一个明确的预置主题，直接从预生成池中按主题关键词取情景
  function buildScenarioFromMock(topicName: string, _inputTopic: string): Scenario {
    const pregenScenarios: Array<{ scene: string; question: string; sceneIcon: string; options: Array<{ text: string; icon: string; isRecommended: boolean; feedback: string }>; skillTag: string; socialRule: string; parentTip: string }> = pregenData?.scenarios || [];
    const validScenarios = pregenScenarios.filter(s => s.scene && s.scene.length >= 10);

    const topicLower = topicName.toLowerCase();
    let selected = validScenarios.find(s => {
      const sceneLower = (s.scene || '').toLowerCase();
      const skillLower = (s.skillTag || '').toLowerCase();
      return sceneLower.includes(topicLower) || skillLower.includes(topicLower);
    });

    // 若预生成数据为空或无匹配，回落到 hardcoded mockScenario
    const source = selected || (mockScenario as unknown as (typeof pregenScenarios)[0]);

    const rawOptions: Array<{ text: string; feedback: string; feedbackTone: 'gentle' | 'supportive'; icon?: string }> = source.options.map((o) => ({
      text: o.text,
      feedback: o.feedback,
      feedbackTone: (o as { isRecommended: boolean }).isRecommended ? 'gentle' : 'supportive',
      icon: o.icon,
    }));
    const options = shuffleAndAssignIds(rawOptions);

    return {
      title: source.skillTag || '社交练习',
      theme: topicName, // 使用传入的主题名称
      scene: getSceneEmoji(topicName),
      sceneIcon: source.sceneIcon,
      description: source.scene,
      question: source.question || '你会怎么做？',
      options,
      skillTag: source.skillTag,
      socialRule: source.socialRule,
      parentTip: source.parentTip,
    };
  }

  function computeReward(_optionId: OptionId, diff: Difficulty): RewardInfo {
    // 得分只由难度决定，同难度所有选项得分相同（不按选项区分）
    const gained = getScorePerQuestion(diff);
    const oldLevel = getLevel(totalScore);
    const newTotal = totalScore + gained;
    const newLevel = getLevel(newTotal);
    const justLeveledUp = newLevel > oldLevel;
    const stationIndex = getStationIndex(diff, newTotal);
    // 线路完成：分数跨过了线路长度的整数倍（完成一圈）
    const lineLength = STATION_THRESHOLDS[diff][STATION_THRESHOLDS[diff].length - 1];
    const oldLoops = Math.floor(totalScore / Math.max(lineLength, 1));
    const newLoops = Math.floor(newTotal / Math.max(lineLength, 1));
    const isLineComplete = newLoops > oldLoops;
    saveScore(newTotal);
    setTotalScore(newTotal);
    return { gained, newTotal, level: newLevel, nextLevelAt: getNextThreshold(newTotal), justLeveledUp, stationIndex, isLineComplete };
  }

  const handleStart = async (inputInterest: string, inputTopic: TrainingTopic, inputDifficulty: Difficulty, useAI = false) => {
    const fin = inputInterest.trim() || '地铁';
    // 切换主题时重置轮换队列
    if (fin !== interest) {
      shuffleQueueRef.current.delete(fin);
      queueIndexRef.current = 0;
      lastScenarioIndexRef.current = -1;
    }
    setInterest(fin); setTopic(inputTopic); setDifficulty(inputDifficulty);
    setScenarioIndex(0); // 开始新练习时，题目索引重置为 0
    setSelectedOption(null); setReward(null);
    setDemoHint(null);
    setGameState('loading');
    // 任何情况都正常进入 screen2，永不报错
    const result = await getScenario(fin, inputTopic, inputDifficulty, useAI, 0);
    // 更新兴趣为实际使用的兴趣，确保界面标签与内容一致
    setInterest(result.usedInterest);
    setCurrentScenario(result.scenario);
    setDemoHint(result.demoHint);
    setGameState('screen2');
  };

  const handleConfirm = (optionId: OptionId) => {
    setSelectedOption(optionId);
    const reward = computeReward(optionId, difficulty);
    setReward(reward);
    // 触发庆祝动画
    setShowCelebration(true);
    // 重置动画状态（1.5秒后自动关闭）
    setTimeout(() => setShowCelebration(false), 1500);
    // 触发音效（只有在 lively 模式下才会响）
    if (reward.justLeveledUp) {
      gentleSound.play('levelup');
    } else if (reward.isLineComplete) {
      gentleSound.play('arrive');
    } else {
      gentleSound.play('confirm');
    }
    setGameState('screen3');
  };

  const handleTryAgain = async () => {
    setSelectedOption(null); setReward(null);
    setDemoHint(null);
    setGameState('loading');
    // 再来一题：递增索引，取不同的题
    const nextIndex = scenarioIndex + 1;
    setScenarioIndex(nextIndex);
    const result = await getScenario(interest, topic, difficulty, false, nextIndex);
    setInterest(result.usedInterest);
    setCurrentScenario(result.scenario);
    setDemoHint(result.demoHint);
    setGameState('screen2');
  };

  const handleChangeSkin = (skinId: SkinId) => {
    setSelectedSkin(skinId);
    saveSkin(skinId);
  };

  const handleChangeTopic = () => {
    setSelectedOption(null); setReward(null);
    setGameState('screen1');
  };

  return (
    <main className={styles.main}>
      <div className={styles.wrapper}>
        {gameState === 'screen1' && (
          <>
            {/* 地铁线路图 */}
            <SubwayMap
              totalScore={totalScore}
              level={getLevel(totalScore)}
              selectedSkin={selectedSkin}
              difficulty={difficulty}
            />
            <Screen1Interest
              initialInterest={interest}
              initialTopic={topic}
              initialDifficulty={difficulty}
              selectedSkin={selectedSkin}
              totalScore={totalScore}
              level={getLevel(totalScore)}
              nextThreshold={getNextThreshold(totalScore)}
              isDemoMode={isDemoMode}
              onStart={handleStart}
              onChangeSkin={handleChangeSkin}
              onChangeInterest={(value) => {
                setInterest(value);
                saveInterest(value);
                setScenarioIndex(0); // 兴趣变化时，题目索引重置
              }}
              onChangeTopic={(value) => {
                setTopic(value);
                saveTopic(value);
                setScenarioIndex(0); // 主题变化时，题目索引重置
              }}
              onChangeDifficulty={(value) => {
                setDifficulty(value);
                saveDifficulty(value);
                setScenarioIndex(0); // 难度变化时，题目索引重置
              }}
            />
          </>
        )}

        {gameState === 'loading' && (
          <LoadingScreen interest={interest} topic={topic} />
        )}

        {gameState === 'screen2' && (
          <>
            <SensorySelector
              level={sensoryLevel}
              soundOn={soundOn}
              onChange={handleChangeSensory}
              onToggleSound={handleToggleSound}
            />
            <Screen2Scenario
              scenario={currentScenario}
              selectedSkin={selectedSkin}
              sensoryLevel={sensoryLevel}
              demoHint={demoHint}
              onConfirm={handleConfirm}
              onBack={handleChangeTopic}
            />
          </>
        )}

        {gameState === 'screen3' && selectedOption && reward && (
          <>
            <SensorySelector
              level={sensoryLevel}
              soundOn={soundOn}
              onChange={handleChangeSensory}
              onToggleSound={handleToggleSound}
            />
            {/* 地铁线路图：显示小旅客前进 */}
            <SubwayMap
              totalScore={reward.newTotal}
              level={reward.level}
              selectedSkin={selectedSkin}
              difficulty={difficulty}
              stationIndex={reward.stationIndex}
              sensoryLevel={sensoryLevel}
              showCelebration={showCelebration}
              isLineComplete={reward.isLineComplete}
            />
            <Screen3Feedback
              scenario={currentScenario}
              selectedOptionId={selectedOption}
              reward={reward}
              selectedSkin={selectedSkin}
              sensoryLevel={sensoryLevel}
              onTryAgain={handleTryAgain}
              onChangeTopic={handleChangeTopic}
            />
          </>
        )}
      </div>

      {/* 底部陪伴角色 */}
      {gameState !== 'loading' && (
        <CornerCharacter
          skinId={selectedSkin}
          position="bottom-right"
          size={5}
        />
      )}
    </main>
  );
}