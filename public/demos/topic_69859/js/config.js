/* =================================================================
   CodeBeat 节奏编程 - 配置常量
   ================================================================= */

// ============ 游戏基础配置 ============
const BPM = 120;
const BEAT_MS = 60000 / BPM;       // 每拍 500ms

// ============ 游戏时长选项（秒） ============
const DURATION_OPTIONS = [30, 45, 60, 75];

// ============ 游戏模式 ============
const MODE_NORMAL = 'normal';
const MODE_LIFE   = 'life';

// ============ 生命模式参数 ============
const LIFE_MAX_HEARTS    = 3;   // 红心上限
const LIFE_COMBO_HEAL    = 20;  // 每达成 20 连击恢复 1 颗红心

// ============ 轨道颜色 ============
const NOTE_COLORS = {
  D: '#8b5cf6',  // 紫色
  F: '#06b6d4',  // 青色
  J: '#ec4899',  // 粉色
  K: '#10b981',  // 绿色
};

// ============ 音符频率 ============
const NOTE_FREQS = {
  D: 262,  // C4
  F: 330,  // E4
  J: 392,  // G4
  K: 523,  // C5
};

// ============ 判定窗口（ms） ============
const JUDGE_WINDOWS = {
  PERFECT: 100,
  GREAT: 200,
  GOOD: 350,
};

// ============ 判定分数 ============
const JUDGE_SCORES = {
  PERFECT: 100,
  GREAT: 80,
  GOOD: 50,
  MISS: 0,
};

// ============ 画笔颜色（七色循环） ============
const PEN_COLORS = [
  '#ef4444', // 红
  '#f97316', // 橙
  '#eab308', // 黄
  '#10b981', // 绿
  '#06b6d4', // 青
  '#3b82f6', // 蓝
  '#8b5cf6', // 紫
];

// ============ 音符下落速度（旅行时间 ms） ============
const SPEED_MAP = {
  slow: 4000,
  normal: 3000,
  fast: 2000,
};

// ============ 资源路径映射 ============
const NOTE_IMAGES = {
  D: 'images/note-d.webp',
  F: 'images/note-f.webp',
  J: 'images/note-j.webp',
  K: 'images/note-k.webp',
};

const JUDGE_IMAGES = {
  PERFECT: 'images/judge-perfect.webp',
  GREAT: 'images/judge-great.webp',
  GOOD: 'images/judge-good.webp',
  MISS: 'images/judge-miss.webp',
};

const GRADE_IMAGES = {
  S: 'images/grade-s.webp',
  A: 'images/grade-a.webp',
  B: 'images/grade-b.webp',
  C: 'images/grade-c.webp',
  D: 'images/grade-d.webp',
};
