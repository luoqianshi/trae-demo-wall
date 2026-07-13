import { create } from 'zustand';
import type { PlannerTask, FreeSlot, ScheduledBlock, ScheduleItem, Difficulty, TaskCategory, SchedulePreference } from '@/types';
import { useScheduleStore } from './scheduleStore';
import { useSettingsStore } from './settingsStore';

interface PlannerStore {
  tasks: PlannerTask[];
  freeSlots: FreeSlot[];
  schedule: ScheduledBlock[];
  learningStats: Record<string, { totalEst: number; totalActual: number; count: number }>;

  addTask: (task: Omit<PlannerTask, 'id'>) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<PlannerTask>) => void;
  toggleTaskDone: (id: string) => void;
  toggleTaskImportant: (id: string) => void;
  recordActual: (taskId: string, actualMinutes: number) => void;

  addFreeSlot: (slot: Omit<FreeSlot, 'id'>) => void;
  removeFreeSlot: (id: string) => void;
  calculateFreeSlots: (dateStr: string) => void;
  calculateWeeklyFreeSlots: () => void;

  generateSchedule: () => void;
  reuseYesterdaySchedule: () => boolean;
  clearSchedule: () => void;
  toggleScheduleDone: (id: string) => void;
  recordScheduleActual: (id: string, actualMinutes: number) => void;
}

// ===== localStorage 持久化 =====
// 让"复用昨日计划"在刷新/重开应用后仍可用
const PLANNER_STORAGE_KEY = 'time-master-planner';

interface PersistedPlanner {
  tasks: PlannerTask[];
  freeSlots: FreeSlot[];
  schedule: ScheduledBlock[];
  learningStats: Record<string, { totalEst: number; totalActual: number; count: number }>;
}

function loadPlanner(): PersistedPlanner {
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        freeSlots: Array.isArray(parsed.freeSlots) ? parsed.freeSlots : [],
        schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
        learningStats: parsed.learningStats && typeof parsed.learningStats === 'object' ? parsed.learningStats : {},
      };
    }
  } catch { /* ignore */ }
  return { tasks: [], freeSlots: [], schedule: [], learningStats: {} };
}

function savePlanner(state: PersistedPlanner) {
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify({
      tasks: state.tasks,
      freeSlots: state.freeSlots,
      schedule: state.schedule,
      learningStats: state.learningStats,
    }));
  } catch { /* ignore */ }
}

// 从 localStorage 加载初始状态（首次使用为空）
const persisted = loadPlanner();
const initialTasks: PlannerTask[] = persisted.tasks;
const initialFreeSlots: FreeSlot[] = persisted.freeSlots;
const initialSchedule: ScheduledBlock[] = persisted.schedule;
const initialLearningStats = persisted.learningStats;

// 时间字符串 → 分钟数
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// 分钟数 → 时间字符串
function toTime(min: number): string {
  if (min >= 1440) return '24:00'; // 当日终点，避免取模后显示 "00:00" 造成歧义
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// 难度数值化：hard=3, medium=2, easy=1
function difficultyValue(d: Difficulty): number {
  return d === 'hard' ? 3 : d === 'medium' ? 2 : 1;
}

// 按计划偏好计算排序键：返回值大的排在前面优先安排
// 使用乘法主权重（主键 × 100 + 次键），保证主排序键主导，避免加法交换律导致的碰撞
function preferenceSortKey(task: PlannerTask, preference: SchedulePreference): number {
  const pref = task.preference;                   // 喜好度 1-5
  const diff = difficultyValue(task.difficulty); // hard=3, medium=2, easy=1
  switch (preference) {
    case 'preference-high':
      // 喜好度高优先，次级难度高先做
      return pref * 100 + diff;
    case 'preference-low':
      // 喜好度低优先（6-pref 使低喜好值更大），次级难度高先做
      return (6 - pref) * 100 + diff;
    case 'easy-first':
      // 简单先做（4-diff 使低难度值更大），次级喜好度高先做
      return (4 - diff) * 100 + pref;
    case 'hard-first':
      // 困难先做，次级喜好度高先做
      return diff * 100 + pref;
  }
}

// ===== 睡眠时段兜底逻辑 =====
// 默认睡眠时段：22:00 - 次日 07:00（跨午夜）
const SLEEP_START_MIN = 22 * 60; // 22:00 → 1320 分钟
const SLEEP_END_MIN = 7 * 60;    // 07:00 → 420 分钟

// 判断某时间是否在默认睡眠时段（22:00-次日07:00）
export function isSleepTime(timeStr: string): boolean {
  const m = toMinutes(timeStr);
  return m >= SLEEP_START_MIN || m < SLEEP_END_MIN;
}

// 用于空闲时段计算的时间区间（仅需起止时间）
type TimeRange = Pick<ScheduleItem, 'startTime' | 'endTime'>;

// 在日程中补齐默认睡眠时段（22:00-次日07:00）作为非空闲时段
// 仅当用户未设置任何 rest 项（即未在 DailyRoutine 配置睡眠）时才补齐，
// 一旦用户设置了睡眠时段，完全信任用户设置，不再硬编码默认睡眠
function withDefaultSleep(items: ScheduleItem[]): TimeRange[] {
  const ranges: TimeRange[] = items.map((i) => ({ startTime: i.startTime, endTime: i.endTime }));
  const hasRest = items.some((i) => i.type === 'rest');
  // 仅当用户完全没设置任何 rest 项时，才补齐默认睡眠时段（兜底）
  if (!hasRest) {
    ranges.push({ startTime: '22:00', endTime: '24:00' });
    ranges.push({ startTime: '00:00', endTime: '07:00' });
  }
  return ranges;
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  tasks: initialTasks,
  freeSlots: initialFreeSlots,
  schedule: initialSchedule,
  learningStats: initialLearningStats,

  addTask: (task) =>
    set((state) => {
      const tasks = [...state.tasks, { ...task, id: `t-${Date.now()}` }];
      savePlanner({ ...state, tasks });
      return { tasks };
    }),

  removeTask: (id) => set((state) => {
    const tasks = state.tasks.filter((t) => t.id !== id);
    savePlanner({ ...state, tasks });
    return { tasks };
  }),

  updateTask: (id, patch) =>
    set((state) => {
      const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
      savePlanner({ ...state, tasks });
      return { tasks };
    }),

  toggleTaskDone: (id) =>
    set((state) => {
      const tasks = state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      savePlanner({ ...state, tasks });
      return { tasks };
    }),

  toggleTaskImportant: (id) =>
    set((state) => {
      const tasks = state.tasks.map((t) => (t.id === id ? { ...t, important: !t.important } : t));
      savePlanner({ ...state, tasks });
      return { tasks };
    }),

  recordActual: (taskId, actualMinutes) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    set((state) => {
      const prev = state.learningStats[task.name] || { totalEst: 0, totalActual: 0, count: 0 };
      const learningStats = {
        ...state.learningStats,
        [task.name]: {
          totalEst: prev.totalEst + t_default_est(task),
          totalActual: prev.totalActual + actualMinutes,
          count: prev.count + 1,
        },
      };
      savePlanner({ ...state, learningStats });
      return {
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, actualMinutes } : t)),
        learningStats,
      };
    });
  },

  addFreeSlot: (slot) =>
    set((state) => {
      const freeSlots = [...state.freeSlots, { ...slot, id: `s-${Date.now()}` }];
      savePlanner({ ...state, freeSlots });
      return { freeSlots };
    }),

  removeFreeSlot: (id) => set((state) => {
    const freeSlots = state.freeSlots.filter((s) => s.id !== id);
    savePlanner({ ...state, freeSlots });
    return { freeSlots };
  }),

  calculateFreeSlots: (dateStr) => {
    const dailySchedule = useScheduleStore.getState().generateDailySchedule(dateStr);
    // 补齐默认睡眠时段（22:00-次日07:00）作为非空闲时段，避免睡眠被算作空闲
    const effectiveSchedule = withDefaultSleep(dailySchedule);
    const sortedSchedule = [...effectiveSchedule].sort((a, b) => a.startTime.localeCompare(b.startTime));

    const freeSlots: Omit<FreeSlot, 'id'>[] = [];
    let lastEnd = '00:00';

    for (const item of sortedSchedule) {
      if (item.startTime > lastEnd) {
        freeSlots.push({
          date: dateStr,
          startTime: lastEnd,
          endTime: item.startTime,
          label: getSlotLabel(lastEnd, item.startTime),
        });
      }
      lastEnd = item.endTime;
    }

    if (lastEnd < '24:00') {
      freeSlots.push({
        date: dateStr,
        startTime: lastEnd,
        endTime: '24:00',
        label: getSlotLabel(lastEnd, '24:00'),
      });
    }

    set((state) => {
      const merged = [...state.freeSlots.filter((s) => s.date !== dateStr), ...freeSlots.map((s, i) => ({ ...s, id: `auto-${dateStr}-${i}` }))];
      savePlanner({ ...state, freeSlots: merged });
      return { freeSlots: merged };
    });
  },

  calculateWeeklyFreeSlots: () => {
    const today = new Date();
    const freeSlots: Omit<FreeSlot, 'id'>[] = [];
    const autoDates = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      autoDates.add(dateStr);

      const dailySchedule = useScheduleStore.getState().generateDailySchedule(dateStr);
      // 补齐默认睡眠时段（22:00-次日07:00）作为非空闲时段，避免睡眠被算作空闲
      const effectiveSchedule = withDefaultSleep(dailySchedule);
      const sortedSchedule = [...effectiveSchedule].sort((a, b) => a.startTime.localeCompare(b.startTime));

      let lastEnd = '00:00';
      for (const item of sortedSchedule) {
        if (item.startTime > lastEnd) {
          freeSlots.push({
            date: dateStr,
            startTime: lastEnd,
            endTime: item.startTime,
            label: getSlotLabel(lastEnd, item.startTime),
          });
        }
        lastEnd = item.endTime;
      }

      if (lastEnd < '24:00') {
        freeSlots.push({
          date: dateStr,
          startTime: lastEnd,
          endTime: '24:00',
          label: getSlotLabel(lastEnd, '24:00'),
        });
      }
    }

    set((state) => {
      // 保留手动添加的非自动日期时段，仅替换这 7 天的自动时段
      const manual = state.freeSlots.filter((s) => !autoDates.has(s.date) && !s.id.startsWith('auto-'));
      const merged = [...manual, ...freeSlots.map((s, i) => ({ ...s, id: `auto-week-${i}` }))];
      savePlanner({ ...state, freeSlots: merged });
      return { freeSlots: merged };
    });
  },

  // 自动生成时间表算法：
  // 1. 按计划偏好（设置中的 schedulePreference）排序项目
  // 2. 遍历空闲时间段，依次塞入项目 + 项目间隔休息
  // 3. 时间合理性填充：当队首高优先级项目放不下剩余空闲时，在未安排项目中
  //    按偏好顺序挑出第一个能放下的项目塞入，最大化利用碎片时间
  // 4. 基于学习曲线优化预估：如果同名任务有历史实际，按 平均实际/平均预估 比例修正
  generateSchedule: () => {
    const { tasks, freeSlots, learningStats } = get();
    if (tasks.length === 0 || freeSlots.length === 0) {
      set((state) => {
        savePlanner({ ...state, schedule: [] });
        return { schedule: [] };
      });
      return;
    }

    // 读取计划偏好
    const preference = useSettingsStore.getState().schedulePreference;

    // 计算每个任务的有效预估时间（应用学习曲线）
    const tasksWithEff = tasks.map((t) => {
      const stat = learningStats[t.name];
      let effectiveMinutes = t.estimatedMinutes;
      if (stat && stat.count > 0 && stat.totalEst > 0) {
        const ratio = stat.totalActual / stat.totalEst;
        effectiveMinutes = Math.round(t.estimatedMinutes * ratio);
      }
      return { ...t, effectiveMinutes };
    });

    // 按偏好排序：key 大的优先
    const sorted = [...tasksWithEff].sort((a, b) => preferenceSortKey(b, preference) - preferenceSortKey(a, preference));

    const blocks: ScheduledBlock[] = [];
    // 待安排项目池：从队首取，放不下时回退到池中寻找能放下的
    const pool = [...sorted];
    let blockSeq = 0;

    // 当前系统时间：用于跳过已过去的时段，计划从点击生成的时刻起算
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const slot of freeSlots) {
      // 跳过过去日期的 slot
      if (slot.date < todayStr) continue;
      let cursor = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      // 当日 slot：从当前系统时间起算，且跳过已完全结束的 slot
      if (slot.date === todayStr) {
        if (slotEnd <= nowMin) continue;       // 该 slot 已完全过去
        if (cursor < nowMin) cursor = nowMin;  // 从当前时刻开始，不使用已发生的时间
      }

      while (cursor < slotEnd && pool.length > 0) {
        const remaining = slotEnd - cursor;
        // 队首项目
        let idx = 0;
        let task = pool[idx];
        // 队首放不下时：按偏好顺序在池中找第一个能放下的（时间合理性填充）
        if (task.effectiveMinutes > remaining) {
          idx = pool.findIndex((t) => t.effectiveMinutes <= remaining);
          if (idx === -1) break; // 池中没有能放下剩余时间的项目，结束本时段
          task = pool[idx];
        }

        const duration = task.effectiveMinutes;
        const endTime = cursor + duration;
        blocks.push({
          id: `b-${Date.now()}-${blockSeq}`,
          taskId: task.id,
          taskName: task.name,
          category: task.category,
          date: slot.date,
          startTime: toTime(cursor),
          endTime: toTime(endTime),
          estimatedMinutes: duration,
          isBreak: false,
          done: false,
          important: task.important,
        });
        blockSeq += 1;
        cursor = endTime;
        // 从池中移除已安排项
        pool.splice(idx, 1);

        // 添加休息（仅当还有项目可安排且休息能放下）
        if (task.breakAfter > 0 && pool.length > 0 && cursor + task.breakAfter <= slotEnd) {
          const restEnd = cursor + task.breakAfter;
          blocks.push({
            id: `b-rest-${Date.now()}-${blockSeq}`,
            taskId: 'rest',
            taskName: '休息一下',
            category: 'custom',
            date: slot.date,
            startTime: toTime(cursor),
            endTime: toTime(restEnd),
            estimatedMinutes: task.breakAfter,
            isBreak: true,
            done: false,
          });
          blockSeq += 1;
          cursor = restEnd;
        }
      }
    }

    set((state) => {
      savePlanner({ ...state, schedule: blocks });
      return { schedule: blocks };
    });
  },

  // 复用昨日计划：将昨日时段复制到今天，仅替换今日块，保留其他日期
  // 预估时间按学习曲线优化：若同名任务有历史实际耗时，按 平均实际/平均预估 比例修正
  reuseYesterdaySchedule: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const yesterdayBlocks = get().schedule.filter((b) => b.date === yesterdayStr);
    if (yesterdayBlocks.length === 0) return false;
    const { learningStats, tasks } = get();
    const copied = yesterdayBlocks.map((b, idx) => {
      // 仅对非休息块应用学习曲线优化预估
      if (b.isBreak) {
        return { ...b, id: `b-${Date.now()}-${idx}`, date: todayStr, done: false, actualMinutes: undefined };
      }
      // 通过 block.taskName 查找对应 task，再查学习统计
      const task = tasks.find((t) => t.id === b.taskId);
      const stat = task ? learningStats[task.name] : undefined;
      let effectiveMinutes = b.estimatedMinutes;
      if (stat && stat.count > 0 && stat.totalEst > 0) {
        const ratio = stat.totalActual / stat.totalEst;
        effectiveMinutes = Math.round(b.estimatedMinutes * ratio);
      }
      return {
        ...b,
        id: `b-${Date.now()}-${idx}`,
        date: todayStr,
        done: false,
        actualMinutes: undefined,
        estimatedMinutes: effectiveMinutes,
        // 同步当前 task 的重要标记，确保月历显示一致
        important: task ? task.important : b.important,
      };
    });
    set((state) => {
      // 仅替换今日块，保留其他日期的安排
      const others = state.schedule.filter((b) => b.date !== todayStr);
      const newSchedule = [...others, ...copied];
      savePlanner({ ...state, schedule: newSchedule });
      return { schedule: newSchedule };
    });
    return true;
  },

  clearSchedule: () => set((state) => {
    savePlanner({ ...state, schedule: [] });
    return { schedule: [] };
  }),

  toggleScheduleDone: (id) =>
    set((state) => {
      const schedule = state.schedule.map((b) => (b.id === id ? { ...b, done: !b.done } : b));
      savePlanner({ ...state, schedule });
      return { schedule };
    }),

  recordScheduleActual: (id, actualMinutes) =>
    set((state) => {
      const block = state.schedule.find((b) => b.id === id);
      if (!block) return {};
      const task = state.tasks.find((t) => t.id === block.taskId);
      const newStats = { ...state.learningStats };
      if (task) {
        const prev = newStats[task.name] || { totalEst: 0, totalActual: 0, count: 0 };
        newStats[task.name] = {
          totalEst: prev.totalEst + block.estimatedMinutes,
          totalActual: prev.totalActual + actualMinutes,
          count: prev.count + 1,
        };
      }
      const schedule = state.schedule.map((b) =>
        b.id === id ? { ...b, actualMinutes } : b
      );
      savePlanner({ ...state, schedule, learningStats: newStats });
      return { schedule, learningStats: newStats };
    }),
}));

// helper: 提取预估时间用于学习曲线统计
function t_default_est(t: PlannerTask): number {
  return t.estimatedMinutes;
}

// helper: 根据时间段生成标签
function getSlotLabel(start: string, end: string): string {
  const startHour = parseInt(start.split(':')[0]);
  if (startHour >= 6 && startHour < 9) return '早晨';
  if (startHour >= 9 && startHour < 12) return '上午';
  if (startHour >= 12 && startHour < 14) return '中午';
  if (startHour >= 14 && startHour < 17) return '下午';
  if (startHour >= 17 && startHour < 20) return '傍晚';
  if (startHour >= 20 && startHour < 23) return '晚上';
  return '深夜';
}

// 配置
export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; color: string; icon: string }> = {
  homework: { label: '校内作业', color: 'bg-corgi-orange/15 text-corgi-dark border-corgi-orange/30', icon: '📚' },
  homework_outer: { label: '课外班作业', color: 'bg-berry-pink/15 text-berry-rose border-berry-pink/30', icon: '✏️' },
  study: { label: '自习', color: 'bg-mint-fresh/15 text-mint-deep border-mint-fresh/30', icon: '📖' },
  hobby: { label: '兴趣', color: 'bg-purple-100 text-purple-500 border-purple-200', icon: '🎨' },
  chore: { label: '家务', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: '🧹' },
  reading: { label: '阅读', color: 'bg-corgi-yellow/15 text-corgi-dark border-corgi-yellow/30', icon: '📕' },
  custom: { label: '其他', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: '📌' },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: 'bg-mint-fresh/20 text-mint-deep' },
  medium: { label: '中等', color: 'bg-corgi-yellow/20 text-corgi-dark' },
  hard: { label: '困难', color: 'bg-berry-pink/20 text-berry-rose' },
};
