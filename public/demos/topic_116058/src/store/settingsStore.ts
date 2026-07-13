import { create } from 'zustand';
import type { Settings, VacationMode, SchedulePreference } from '@/types';

interface SettingsStore extends Settings {
  update: (updates: Partial<Settings>) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  pomodoroDuration: 25,
  breakDuration: 5,
  buffTime: 10,
  examSprintMode: false,
  vacationMode: 'normal',
  schedulePreference: 'preference-high',
  soundEnabled: true,
  animationEnabled: true,
};

// 长假模式配置
export const VACATION_MODES: Record<VacationMode, { label: string; icon: string; desc: string }> = {
  normal: { label: '日常模式', icon: '📅', desc: '正常上课日程' },
  winter: { label: '寒假模式', icon: '❄️', desc: '减少课程，增加作业和休息' },
  summer: { label: '暑假模式', icon: '☀️', desc: '自由安排，以作业为主' },
  spring: { label: '春假模式', icon: '🌸', desc: '适度学习，多安排户外活动' },
  national: { label: '国庆模式', icon: '🇨🇳', desc: '假期放松，轻量学习' },
  newyear: { label: '新年模式', icon: '🧧', desc: '节日模式，少量学习' },
};

// 计划偏好配置：label 文案 + 用于 generateSchedule 排序的比较函数方向
export const SCHEDULE_PREFERENCES: Record<SchedulePreference, { label: string; icon: string; desc: string }> = {
  'preference-high': { label: '喜好度高优先', icon: '⭐', desc: '越喜欢的越先做，碎片时间塞入能完成的低喜好项目' },
  'preference-low': { label: '喜好度低优先', icon: '🌱', desc: '先做不太喜欢的，把喜欢的留到后面' },
  'easy-first': { label: '简单先做', icon: '🐤', desc: '由易到难，先完成简单的建立节奏' },
  'hard-first': { label: '困难先做', icon: '🔥', desc: '精力旺盛时先攻克难题' },
};

// ===== localStorage 持久化 =====
const SETTINGS_STORAGE_KEY = 'time-master-settings';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...loadSettings(),
  update: (updates) =>
    set((state) => {
      const next = { ...state, ...updates };
      // 仅持久化 Settings 字段，排除 action 方法
      const { update: _u, reset: _r, ...persisted } = next;
      saveSettings(persisted as Settings);
      return updates;
    }),
  reset: () => {
    saveSettings(DEFAULT_SETTINGS);
    set(DEFAULT_SETTINGS);
  },
}));
