import { create } from 'zustand';
import type { ScheduleItem, ScheduleType, SpecialState, VacationMode } from '@/types';
import { useUserStore } from './userStore';

interface ScheduleStore {
  items: ScheduleItem[];
  specialState: SpecialState;
  // 已应用的假期模式（避免跨刷新重复累加 buffer）
  vacationApplied: VacationMode | null;
  // 应用假期模式前的原始 items 快照，用于 'normal' 恢复时还原 buffTime/reminder
  vacationSnapshot: ScheduleItem[] | null;
  addSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
  importSchedule: (items: Omit<ScheduleItem, 'id'>[]) => void;
  removeSchedule: (id: string) => void;
  toggleScheduleImportant: (id: string) => void;
  toggleReminder: (id: string) => void;
  toggleComplete: (id: string) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  reorderSchedule: (items: ScheduleItem[]) => void;
  clearAll: () => void;
  setSpecialState: (state: SpecialState) => void;
  applySpecialState: (state: SpecialState) => void;
  applyExamSprint: () => void;
  applyVacationMode: (mode: VacationMode) => void;
  generateDailySchedule: (dateStr: string, includeHidden?: boolean) => ScheduleItem[];
}

// 初始无日程，用户需手动添加课程
const defaultSchedules: ScheduleItem[] = [];

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 课程模板，方便用户快速添加
export const COURSE_TEMPLATES: Omit<ScheduleItem, 'id'>[] = [
  { startTime: '08:00', endTime: '09:30', title: '高等数学', type: 'course', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
  { startTime: '10:00', endTime: '11:30', title: '大学英语', type: 'course', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
  { startTime: '14:00', endTime: '15:30', title: '数据结构', type: 'course', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
  { startTime: '16:00', endTime: '17:30', title: '作业复习', type: 'homework', reminder: true, buffTime: 10, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
  { startTime: '12:00', endTime: '13:00', title: '午餐 + 休息', type: 'rest', reminder: true, buffTime: 15, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
  { startTime: '19:30', endTime: '21:00', title: '番茄钟专注', type: 'homework', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
];

// 周课表模板 - 一键导入完整一周课程
export const WEEKLY_SCHEDULE_TEMPLATE: { name: string; items: Omit<ScheduleItem, 'id'>[] } = {
  name: '标准大学周课表',
  items: [
    { startTime: '07:30', endTime: '08:00', title: '起床洗漱', type: 'custom', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '08:15', endTime: '09:00', title: '休闲时光', type: 'entertainment', reminder: true, buffTime: 10, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
    { startTime: '09:00', endTime: '10:30', title: '高等数学', type: 'course', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
    { startTime: '10:45', endTime: '12:15', title: '大学英语', type: 'course', reminder: false, buffTime: 5, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
    { startTime: '12:30', endTime: '13:30', title: '午餐 + 休息', type: 'rest', reminder: true, buffTime: 15, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '14:00', endTime: '15:30', title: '数据结构', type: 'course', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'weekdays', repeatDays: [1, 2, 3, 4, 5], startDate: getTodayStr() },
    { startTime: '16:00', endTime: '17:30', title: '作业复习', type: 'homework', reminder: true, buffTime: 10, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '18:00', endTime: '19:00', title: '晚餐', type: 'rest', reminder: false, buffTime: 10, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '19:30', endTime: '21:00', title: '番茄钟专注', type: 'homework', reminder: true, buffTime: 5, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
  ],
};

// 月课表模板 - 期末复习模式
export const MONTHLY_SCHEDULE_TEMPLATE: { name: string; items: Omit<ScheduleItem, 'id'>[] } = {
  name: '期末复习月课表',
  items: [
    { startTime: '07:00', endTime: '07:30', title: '起床晨读', type: 'homework', reminder: true, buffTime: 5, isExamSprint: true, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '08:00', endTime: '09:30', title: '高数复习', type: 'homework', reminder: true, buffTime: 5, isExamSprint: true, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '10:00', endTime: '11:30', title: '英语复习', type: 'homework', reminder: true, buffTime: 5, isExamSprint: true, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '12:00', endTime: '13:00', title: '午餐 + 休息', type: 'rest', reminder: true, buffTime: 15, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '14:00', endTime: '15:30', title: '数据结构复习', type: 'homework', reminder: true, buffTime: 5, isExamSprint: true, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '16:00', endTime: '17:30', title: '专业课复习', type: 'homework', reminder: true, buffTime: 5, isExamSprint: true, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '18:00', endTime: '19:00', title: '晚餐', type: 'rest', reminder: false, buffTime: 10, isExamSprint: false, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
    { startTime: '19:30', endTime: '21:30', title: '番茄钟冲刺', type: 'homework', reminder: true, buffTime: 5, isExamSprint: true, repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6], startDate: getTodayStr() },
  ],
};

export const SCHEDULE_TEMPLATES = [
  WEEKLY_SCHEDULE_TEMPLATE,
  MONTHLY_SCHEDULE_TEMPLATE,
];

export const SCHEDULE_TYPE_CONFIG: Record<ScheduleType, { label: string; color: string; icon: string }> = {
  course: { label: '课程', color: 'bg-corgi-orange/15 text-corgi-dark border-corgi-orange/30', icon: '📚' },
  homework: { label: '作业', color: 'bg-mint-fresh/15 text-mint-deep border-mint-fresh/30', icon: '📝' },
  rest: { label: '休息', color: 'bg-berry-pink/15 text-berry-rose border-berry-pink/30', icon: '☕' },
  entertainment: { label: '娱乐', color: 'bg-purple-100 text-purple-500 border-purple-200', icon: '🎮' },
  custom: { label: '其他', color: 'bg-corgi-yellow/15 text-corgi-dark border-corgi-yellow/30', icon: '⭐' },
};

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  items: defaultSchedules,
  specialState: 'normal',
  vacationApplied: null,
  vacationSnapshot: null,
  addSchedule: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        { ...item, id: Date.now().toString() },
      ].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })),
  importSchedule: (newItems) =>
    set((state) => {
      const stamped = newItems.map((it, i) => ({
        ...it,
        id: `${Date.now()}-${i}`,
      }));
      const merged = [...state.items, ...stamped];
      // 去重（相同时间、标题、重复规则才视为重复；工作日/周末同名同时间段是不同条目）
      const seen = new Set<string>();
      const dedup = merged.filter((it) => {
        const key = `${it.startTime}-${it.title}-${it.repeat}-${(it.repeatDays || []).join(',')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return {
        items: dedup.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        vacationApplied: null,
        vacationSnapshot: null,
      };
    }),
  removeSchedule: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  toggleScheduleImportant: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, important: !i.important } : i
      ),
    })),
  toggleReminder: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, reminder: !i.reminder } : i
      ),
    })),
  updateSchedule: (id, updates) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),
  reorderSchedule: (items) => set({ items }),
  clearAll: () => set({ items: [], vacationApplied: null, vacationSnapshot: null }),
  toggleComplete: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, completed: !i.completed } : i
      ),
    })),
  setSpecialState: (specialState) => set({ specialState }),
  applySpecialState: (state) => {
    const current = get().items;
    if (state === 'period') {
      // 生理期：增加休息时间，减少高强度学习
      set({
        items: current.map((i) => {
          if (i.type === 'homework') {
            return { ...i, buffTime: i.buffTime + 10, title: i.title + '（轻松版）' };
          }
          if (i.type === 'rest') {
            return { ...i, endTime: addMinutes(i.endTime, 15) };
          }
          return i;
        }),
        specialState: state,
      });
    } else if (state === 'sick') {
      // 生病：大幅减少学习，增加休息
      set({
        items: current.map((i) => {
          if (i.type === 'homework' || i.type === 'course') {
            return { ...i, buffTime: i.buffTime + 20, title: i.title + '（病假调整）' };
          }
          return i;
        }),
        specialState: state,
      });
    } else {
      set({ specialState: state });
    }
  },
  applyExamSprint: () => {
    const current = get().items;
    set({
      items: current.map((i) => {
        if (i.type === 'homework') {
          return { ...i, isExamSprint: true, buffTime: Math.max(0, i.buffTime - 5) };
        }
        if (i.type === 'rest') {
          return { ...i, buffTime: i.buffTime + 5 };
        }
        return i;
      }),
    });
  },
  applyVacationMode: (mode) => {
    // 假期/非假期作息的显示切换现在由 isScheduleActive 中的 vacationOnly 互斥逻辑自动处理：
    // - vacationOnly=true 的项仅在假期日期内显示
    // - vacationOnly=undefined 的项在假期日期内隐藏
    // 因此不再需要修改 items 的 buffTime 或隐藏标记。
    // 此处仅记录当前假期模式状态，用于 UI 显示（如首页假期提示）。
    if (mode === 'normal') {
      set({ vacationApplied: null, vacationSnapshot: null });
      return;
    }
    // 幂等：若已处于同一假期模式则不重复设置
    if (get().vacationApplied === mode) return;
    set({ vacationApplied: mode, vacationSnapshot: null });
  },
  generateDailySchedule: (dateStr, includeHidden) => {
    const allItems = get().items;
    return allItems
      .filter((item) => isScheduleActive(item, dateStr))
      .filter((item) => includeHidden || item.buffTime !== -1)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
}));

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// 判断某日期是否落在用户配置的任一假期范围内
// 用于 vacationOnly 项的显示与非假期项的假期内隐藏
function isInVacationRange(dateStr: string): boolean {
  const profile = useUserStore.getState().profile;
  const ranges = [
    { start: profile.summerVacationStart, end: profile.summerVacationEnd },
    { start: profile.winterVacationStart, end: profile.winterVacationEnd },
  ];
  for (const r of ranges) {
    if (r.start && r.end && r.start !== 'skipped' && r.end !== 'skipped') {
      if (dateStr >= r.start && dateStr <= r.end) return true;
    }
  }
  return false;
}

function isScheduleActive(item: ScheduleItem, dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();

  if (item.startDate && dateStr < item.startDate) {
    return false;
  }
  if (item.endDate && dateStr > item.endDate) {
    return false;
  }

  // 假期专属项：仅在假期日期内显示
  // 非假期项：在假期日期内隐藏（与非假期项互斥）
  const inVacation = isInVacationRange(dateStr);
  if (item.vacationOnly) {
    if (!inVacation) return false;
  } else {
    if (inVacation) return false;
  }

  switch (item.repeat) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekend':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return item.repeatDays && item.repeatDays.includes(dayOfWeek);
    default:
      return true;
  }
}
