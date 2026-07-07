import { create } from 'zustand';
import type { FoodItem, FoodCategory, FoodHistoryItem } from '@/types/food';
import { enrichFoodItem, sortByExpiry } from '@/utils/dateUtils';

const STORAGE_KEY = 'foodItems';
const HISTORY_KEY = 'foodHistory';
const THEME_KEY = 'foodManagerTheme';
const BACKUP_VERSION = '1.0';

export type ThemeMode = 'light' | 'dark';

interface BackupData {
  version: string;
  foods: FoodItem[];
  history: FoodHistoryItem[];
  exportTime: number;
}

interface FoodStore {
  foods: FoodItem[];
  history: FoodHistoryItem[];
  theme: ThemeMode;
  addFood: (name: string, category: FoodCategory, expiryDate: string) => void;
  deleteFood: (id: string) => void;
  markAsUsed: (food: FoodItem) => void;
  markAsWasted: (food: FoodItem) => void;
  clearAllFoods: () => void;
  loadFoods: () => void;
  getEnrichedFoods: () => ReturnType<typeof sortByExpiry>;
  getStats: () => { used: number; wasted: number };
  setTheme: (theme: ThemeMode) => void;
  exportBackup: () => string;
  importBackup: (jsonString: string) => boolean;
  getAllDataStats: () => {
    total: number;
    notExpired: number;
    warning: number;
    expired: number;
    used: number;
    wasted: number;
  };
}

function loadFromStorage(): FoodItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((item: FoodItem & { category?: FoodCategory }) => ({
      ...item,
      category: item.category || 'other',
    }));
  } catch {
    return [];
  }
}

function loadHistoryFromStorage(): FoodHistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function loadThemeFromStorage(): ThemeMode {
  try {
    const data = localStorage.getItem(THEME_KEY);
    if (data === 'dark') return 'dark';
    return 'light';
  } catch {
    return 'light';
  }
}

function saveToStorage(foods: FoodItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
}

function saveHistoryToStorage(history: FoodHistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function saveThemeToStorage(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
}

export const useFoodStore = create<FoodStore>((set, get) => ({
  foods: [],
  history: [],
  theme: 'light',

  loadFoods: () => {
    const foods = loadFromStorage();
    const history = loadHistoryFromStorage();
    const theme = loadThemeFromStorage();
    set({ foods, history, theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  addFood: (name: string, category: FoodCategory, expiryDate: string) => {
    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      expiryDate,
      createdAt: Date.now(),
    };
    const newFoods = [...get().foods, newFood];
    set({ foods: newFoods });
    saveToStorage(newFoods);
  },

  deleteFood: (id: string) => {
    const newFoods = get().foods.filter((f) => f.id !== id);
    set({ foods: newFoods });
    saveToStorage(newFoods);
  },

  markAsUsed: (food: FoodItem) => {
    const newFoods = get().foods.filter((f) => f.id !== food.id);
    const historyItem: FoodHistoryItem = {
      ...food,
      action: 'used',
      actionAt: Date.now(),
    };
    const newHistory = [...get().history, historyItem];
    set({ foods: newFoods, history: newHistory });
    saveToStorage(newFoods);
    saveHistoryToStorage(newHistory);
  },

  markAsWasted: (food: FoodItem) => {
    const newFoods = get().foods.filter((f) => f.id !== food.id);
    const historyItem: FoodHistoryItem = {
      ...food,
      action: 'wasted',
      actionAt: Date.now(),
    };
    const newHistory = [...get().history, historyItem];
    set({ foods: newFoods, history: newHistory });
    saveToStorage(newFoods);
    saveHistoryToStorage(newHistory);
  },

  clearAllFoods: () => {
    set({ foods: [] });
    saveToStorage([]);
  },

  getEnrichedFoods: () => {
    const enriched = get().foods.map(enrichFoodItem);
    return sortByExpiry(enriched);
  },

  getStats: () => {
    const history = get().history;
    return {
      used: history.filter((h) => h.action === 'used').length,
      wasted: history.filter((h) => h.action === 'wasted').length,
    };
  },

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    saveThemeToStorage(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  exportBackup: () => {
    const backupData: BackupData = {
      version: BACKUP_VERSION,
      foods: get().foods,
      history: get().history,
      exportTime: Date.now(),
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackup: (jsonString: string) => {
    try {
      const backupData = JSON.parse(jsonString) as BackupData;
      if (backupData.version !== BACKUP_VERSION) {
        return false;
      }
      if (!Array.isArray(backupData.foods) || !Array.isArray(backupData.history)) {
        return false;
      }
      const validFoods = backupData.foods.map((item) => ({
        ...item,
        category: item.category || 'other',
      }));
      set({ foods: validFoods, history: backupData.history });
      saveToStorage(validFoods);
      saveHistoryToStorage(backupData.history);
      return true;
    } catch {
      return false;
    }
  },

  getAllDataStats: () => {
    const enrichedFoods = get().foods.map(enrichFoodItem);
    const history = get().history;
    return {
      total: enrichedFoods.length,
      notExpired: enrichedFoods.filter((f) => f.status === 'fresh' || f.status === 'normal').length,
      warning: enrichedFoods.filter((f) => f.status === 'warning').length,
      expired: enrichedFoods.filter((f) => f.status === 'expired').length,
      used: history.filter((h) => h.action === 'used').length,
      wasted: history.filter((h) => h.action === 'wasted').length,
    };
  },
}));
