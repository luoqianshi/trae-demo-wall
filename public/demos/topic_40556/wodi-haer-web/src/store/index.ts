import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';
import type { StageKey } from '../types/global';

// 用户信息
export interface UserInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

// 宝宝信息
export interface BabyInfo {
  id: string;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  avatar?: string;
}

// ==================== 工具函数：从localStorage恢复初始状态 ====================

function loadUserInitialState() {
  try {
    const saved = storage.get<{ user: UserInfo; token: string }>(STORAGE_KEYS.USER);
    if (saved?.user && saved?.token) {
      return { user: saved.user, token: saved.token, isLoggedIn: true };
    }
  } catch (e) {
    // ignore parse errors
  }
  return { user: null, token: null, isLoggedIn: false };
}

function loadBabyInitialState(): BabyInfo | null {
  try {
    return storage.get<BabyInfo>(STORAGE_KEYS.BABY);
  } catch (e) {
    return null;
  }
}

function loadSettingsInitialState() {
  try {
    const saved = storage.get<typeof defaultNotifications>(STORAGE_KEYS.SETTINGS);
    if (saved) return saved;
  } catch (e) {
    // ignore
  }
  return { feeding: true, sleep: true, vaccine: true, news: true };
}

// ==================== UserStore ====================

interface UserState {
  user: UserInfo | null;
  token: string | null;
  isLoggedIn: boolean;

  login: (user: UserInfo, token: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserInfo>) => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  // 🔄 关键改进：从localStorage恢复初始状态
  ...loadUserInitialState(),

  login: (user, token) => {
    storage.set(STORAGE_KEYS.USER, { user, token });
    set({ user, token, isLoggedIn: true });
  },

  logout: () => {
    storage.remove(STORAGE_KEYS.USER);
    set({ user: null, token: null, isLoggedIn: false });
  },

  updateProfile: (data) => {
    const { user, token } = get();
    if (!user || !token) return;
    const updatedUser = { ...user, ...data };
    storage.set(STORAGE_KEYS.USER, { user: updatedUser, token });
    set({ user: updatedUser });
  },
}));

// ==================== BabyStore ====================

interface BabyState {
  baby: BabyInfo | null;

  setBaby: (baby: BabyInfo) => void;
  updateBaby: (data: Partial<BabyInfo>) => void;
  removeBaby: () => void;
}

export const useBabyStore = create<BabyState>()((set) => ({
  // 🔄 关键改进：从localStorage恢复宝宝信息
  baby: loadBabyInitialState(),

  setBaby: (baby) => {
    storage.set(STORAGE_KEYS.BABY, baby);
    set({ baby });
  },

  updateBaby: (data) =>
    set((state) => {
      if (!state.baby) return state;
      const updated = { ...state.baby, ...data };
      storage.set(STORAGE_KEYS.BABY, updated);
      return { baby: updated };
    }),

  removeBaby: () => {
    storage.remove(STORAGE_KEYS.BABY);
    set({ baby: null });
  },
}));

// ==================== SettingsStore ====================

interface SettingsState {
  notifications: {
    feeding: boolean;
    sleep: boolean;
    vaccine: boolean;
    news: boolean;
  };

  toggleNotification: (key: keyof SettingsState['notifications']) => void;
}

const defaultNotifications = {
  feeding: true,
  sleep: true,
  vaccine: true,
  news: true,
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  // 🔄 关键改进：从localStorage恢复设置
  notifications: loadSettingsInitialState(),

  toggleNotification: (key) =>
    set((state) => {
      const updated = {
        ...state.notifications,
        [key]: !state.notifications[key],
      };
      storage.set(STORAGE_KEYS.SETTINGS, updated);
      return { notifications: updated };
    }),
}));

// ==================== StageStore ====================

interface StageState {
  currentStage: StageKey;
  stageHistory: Array<{ stage: StageKey; since: string }>;
  setStage: (stage: StageKey) => void;
}

const loadStageInitialState = (): Partial<StageState> => {
  try {
    return storage.get<Partial<StageState>>('wdhr_stage') || {};
  } catch { return {}; }
};

export const useStageStore = create<StageState>()((set) => ({
  ...loadStageInitialState(),
  currentStage: (loadStageInitialState() as any).currentStage || 'parenting',
  stageHistory: [],
  setStage: (stage) => {
    const state = { currentStage: stage };
    storage.set('wdhr_stage', state);
    set(state);
  },
}));
