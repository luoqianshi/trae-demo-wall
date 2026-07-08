export type TrainingTopic =
  | '看懂心情'
  | '轮流玩'
  | '看懂表情和动作'
  | '遇到不开心的时候';

export type OptionId = 'A' | 'B' | 'C';

export type GameState = 'screen1' | 'screen2' | 'screen3' | 'loading';

export type Difficulty = 'easy' | 'medium' | 'hard';

/* 感官强度等级：安静 → 温和 → 动感
 * 默认是 quiet（最低刺激）；lively 必须主动选择，绝不自动切换 */
export type SensoryLevel = 'quiet' | 'gentle' | 'lively';

export const SENSORY_LEVELS: { id: SensoryLevel; label: string; desc: string }[] = [
  { id: 'quiet', label: '安静', desc: '几乎不动，最温和' },
  { id: 'gentle', label: '温和', desc: '微动效，轻松愉悦' },
  { id: 'lively', label: '动感', desc: '更活泼，可加音效' },
];

export interface Option {
  id: OptionId;
  text: string;
  feedback: string;
  feedbackTone: 'gentle' | 'supportive'; /* 统一为建设性反馈, gentle 用于推荐做法, supportive 用于其他 */
  icon?: string; /* 可选的 emoji 小图标, 增强可读性与趣味性 */
}

export interface Scenario {
  title: string;
  theme: string; /* 实际展示的主题名称，用于顶部标签显示，确保与内容一致 */
  scene: string;
  sceneIcon?: string; /* 情景区的 emoji 图标, 如 🚇 🦖 🧩 */
  description: string;
  question: string;
  options: Option[];
  skillTag?: string; /* 技能标签, 用于内部识别, 不展示给孩子 */
  socialRule?: string; /* 社交小规则, 用孩子能懂的语言 */
  parentTip?: string; /* 留给家长/老师的参考提示, 孩子屏不展示 */
}

export interface RewardInfo {
  gained: number;           // 本题得分（仅由难度决定）
  newTotal: number;         // 累计总分
  level: number;            // 当前等级
  nextLevelAt: number;      // 升到下一等级需要的分数
  justLeveledUp: boolean;  // 是否刚升级
  stationIndex: number;     // 当前所在站点索引（0 ~ stationCount-1）
  isLineComplete: boolean;  // 是否刚好到达终点站（完成一段旅程）
}

/* 孩子可见的训练主题（温柔、正向、第二人称） */
export const TRAINING_TOPICS: TrainingTopic[] = [
  '看懂心情',
  '轮流玩',
  '看懂表情和动作',
  '遇到不开心的时候',
];

/* 孩子可见的难度标签 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '轻松',
  medium: '中等',
  hard: '挑战',
};

/* 每题得分：只由难度决定，同难度所有选项得分相同 */
export const SCORE_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 15,    // 轻松：每题 15 分
  medium: 20,  // 中等：每题 20 分
  hard: 30,    // 挑战：每题 30 分
};

/* 各难度对应的站点累计分数阈值（决定站间距离感） */
/* 格式：[站0起点, 站1, 站2, ..., 终点站] */
export const STATION_THRESHOLDS: Record<Difficulty, number[]> = {
  // 轻松：5 站，近站多、远站少，节奏轻快
  easy:     [0, 15, 35, 60, 100],
  // 中等：8 站，距离有起伏，有节奏感
  medium:   [0, 25, 55, 90, 130, 175, 215, 250],
  // 挑战：12 站，距离变化最大，有冒险感
  hard:     [0, 20, 45, 75, 110, 150, 195, 245, 300, 360, 425, 500],
};

// 升级阈值数组（递增）：达到第 n 个值升级到第 n+1 级
export const LEVEL_THRESHOLDS = [100, 250, 500, 900, 1500];

export function getScorePerQuestion(difficulty: Difficulty): number {
  return SCORE_PER_DIFFICULTY[difficulty];
}

/**
 * 获取某难度的线路长度（终点站分数）
 */
export function getLineLength(difficulty: Difficulty): number {
  const thresholds = STATION_THRESHOLDS[difficulty];
  return thresholds[thresholds.length - 1];
}

/**
 * 根据难度和当前累计分数，计算所在站点索引（0 ~ stationCount-1）
 * 支持循环线路：完成一圈后自动回到起点，开启新一段旅程
 */
export function getStationIndex(difficulty: Difficulty, totalScore: number): number {
  const thresholds = STATION_THRESHOLDS[difficulty];
  const lineLength = thresholds[thresholds.length - 1];
  const relativeScore = totalScore % Math.max(lineLength, 1);

  // 如果 relativeScore 为 0 且 totalScore > 0，说明刚好完成一圈，显示在终点站
  // （这一瞬间会配合升级庆祝，下一分即回到下一级的起点）
  if (relativeScore === 0 && totalScore > 0) {
    return thresholds.length - 1;
  }

  let stationIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (relativeScore >= thresholds[i]) {
      stationIndex = i;
    } else {
      break;
    }
  }
  return Math.min(stationIndex, thresholds.length - 1);
}

/**
 * 计算已完成的线路圈数
 */
export function getCompletedLoops(difficulty: Difficulty, totalScore: number): number {
  const lineLength = getLineLength(difficulty);
  return Math.floor(totalScore / Math.max(lineLength, 1));
}

export function getLevel(totalScore: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalScore >= threshold) level++;
  }
  return level;
}

export function getNextThreshold(totalScore: number): number {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalScore < threshold) return threshold;
  }
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 500;
}
