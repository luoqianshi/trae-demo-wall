// 日程项类型
export type ScheduleType = 'course' | 'homework' | 'rest' | 'entertainment' | 'custom';

export type RepeatType = 'daily' | 'weekdays' | 'weekend' | 'custom';

export interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: ScheduleType;
  reminder: boolean;
  buffTime: number;
  isExamSprint: boolean;
  completed?: boolean;
  important?: boolean;      // 标星重要日程项，显示在月度日历中
  vacationOnly?: boolean;   // 假期专属作息项：仅在假期日期内显示，非假期项在假期内隐藏
  repeat: RepeatType;
  repeatDays: number[];
  startDate: string;
  endDate?: string;
}

// 柯基心情
export type CorgiMood = 'happy' | 'sleepy' | 'excited' | 'sad' | 'normal';

// 宠物类型
export type PetType = 'corgi' | 'ragdoll' | 'golden' | 'shiba' | 'tabby';

// 柯基状态
export interface CorgiState {
  name: string;
  furColor: FurColor;
  petType: PetType;        // 宠物类型
  mood: CorgiMood;
  satiety: number;       // 饱食度 0-100，离线每小时-10
  affinity: number;      // 好感度 0-500，每100升一级
  level: number;         // 等级 1-5（由好感度决定）
  streak: number;        // 连胜天数，断签重置为0
  adopted: boolean;
  lastActiveTime: number;     // 上次活跃时间戳（用于离线饥饿计算）
  lastInteractionDate: string; // 上次互动日期 YYYY-MM-DD
  petCountToday: number;      // 今日抚摸次数
  feedCountToday: number;     // 今日喂食次数
  playCountToday: number;     // 今日玩耍次数
  interactionMinutesToday: number; // 今日互动分钟数（防沉迷）
}

// 好友
export interface Friend {
  id: string;
  name: string;
  corgiName: string;
  corgiColor: FurColor;
  petType: PetType;
  affinity: number;
  avatar: string;
  lastActive: string;
}

// 毛色选项
export type FurColor =
  | 'classic'      // 经典黄白
  | 'tricolor'     // 三色
  | 'red'          // 红棕色
  | 'cream'        // 奶白色
  | 'merle'        // 陨石柯基
  | 'chocolate'    // 巧克力色
  | 'blue'         // 蓝色稀有
  | 'lilac'        // 薰衣草紫
  | 'sable'        // 黑貂色
  | 'peach'        // 蜜桃粉
  | 'mint'         // 薄荷绿
  | 'lavender';    // 淡紫梦幻

// 背包奖励类型 - 盲盒产出（不再包含 title 称号）
// expression: 表情包（柯基主题）
// card: 卡牌
// snack: 零食（喂食柯基用）
// points: 积分
// decoration: 院子装饰（五级解锁小院子后摆放）
// title 称号通过完成日程/番茄钟解锁，不来自盲盒
export type RewardType = 'expression' | 'card' | 'snack' | 'points' | 'title' | 'decoration';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BlindBoxReward {
  id: string;
  type: RewardType;
  name: string;
  rarity: Rarity;
  emoji: string;
  description: string;
  // points 类型专用：奖励积分数
  pointsValue?: number;
  // snack 类型专用：饱食度恢复
  satietyValue?: number;
}

export interface CollectionItem {
  reward: BlindBoxReward;
  count: number;
  unlocked: boolean;
}

export interface Backpack {
  points: number;
  expressions: CollectionItem[];
  cards: CollectionItem[];
  snacks: CollectionItem[];
  titles: CollectionItem[];
  decorations: CollectionItem[];
}

// ===== 时间管理器类型 =====
// 项目难度
export type Difficulty = 'easy' | 'medium' | 'hard';
// 项目类型
export type TaskCategory = 'homework' | 'homework_outer' | 'study' | 'hobby' | 'chore' | 'reading' | 'custom';

export interface PlannerTask {
  id: string;
  name: string;
  category: TaskCategory;
  difficulty: Difficulty;
  preference: number;        // 喜好度 1-5 星
  estimatedMinutes: number; // 预估耗时（分钟）
  actualMinutes?: number;   // 实际耗时（修正用）
  photoHint?: string;       // 拍照预估后的提示文字
  breakAfter: number;       // 项目间隔休息时间（分钟）
  done?: boolean;
  important?: boolean;      // 标星重要项目，显示在月度日历中
}

// 空闲时间段
export interface FreeSlot {
  id: string;
  date: string;     // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  label?: string;
}

// 自动生成的时间表条目
export interface ScheduledBlock {
  id: string;
  taskId: string;
  taskName: string;
  category: TaskCategory;
  date: string;
  startTime: string;
  endTime: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  isBreak?: boolean;
  done?: boolean;
  // 标星重要项目（从 PlannerTask.important 同步），显示在月度日历中
  important?: boolean;
  // 该项目是否已发放专注完成积分奖励（避免重复发奖）
  pointsAwarded?: boolean;
}

// 长假模式
export type VacationMode = 'normal' | 'winter' | 'summer' | 'spring' | 'national' | 'newyear';

// 计划偏好：决定生成计划时项目的排序与填充规则
export type SchedulePreference = 'preference-high' | 'preference-low' | 'easy-first' | 'hard-first';

// 设置
export interface Settings {
  pomodoroDuration: number;
  breakDuration: number;
  buffTime: number;
  examSprintMode: boolean;
  vacationMode: VacationMode;
  schedulePreference: SchedulePreference;
  soundEnabled: boolean;
  animationEnabled: boolean;
}

// 特殊状态
export type SpecialState = 'period' | 'sick' | 'busy' | 'normal';

// 日历事项
export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'exam' | 'event' | 'deadline' | 'personal';
  note?: string;
}

// 月度统计
export interface MonthlyStats {
  month: string; // YYYY-MM
  totalSchedules: number;
  completedSchedules: number;
  focusCount: number;
  pointsEarned: number;
  corgiLevelUp: number;
}
