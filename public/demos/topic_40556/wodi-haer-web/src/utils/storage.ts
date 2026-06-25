﻿// 本地存储封装 — 增强版（处理隐私模式/存储满/容量超限）

const PREFIX = 'wodi_haer_';

/**
 * 检测 localStorage 是否可用
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** 缓存 localStorage 可用性检测结果 */
let _storageAvailable: boolean | null = null;

function checkStorageAvailable(): boolean {
  if (_storageAvailable === null) {
    _storageAvailable = isStorageAvailable();
  }
  return _storageAvailable;
}

export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      if (!checkStorageAvailable()) return defaultValue ?? null;
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return defaultValue ?? null;
      return JSON.parse(raw) as T;
    } catch {
      // JSON解析失败或存储异常，返回默认值
      return defaultValue ?? null;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      if (!checkStorageAvailable()) {
        console.warn('[Storage] localStorage不可用（隐私模式或存储禁用）');
        return false;
      }
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      // QuotaExceededError — 存储空间满
      if (e instanceof DOMException && (
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' // Firefox
      )) {
        console.warn('[Storage] 存储空间已满，尝试清理旧数据');
        // 尝试清理后重试一次
        try {
          storage.cleanup();
          localStorage.setItem(PREFIX + key, JSON.stringify(value));
          return true;
        } catch {
          console.error('[Storage] 清理后仍无法写入:', key);
          return false;
        }
      }
      console.warn('[Storage] 写入失败:', key, e);
      return false;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },

  /**
   * 清理非关键数据以释放空间（保留用户登录态和宝宝信息）
   */
  cleanup(): void {
    const preservedKeys = [STORAGE_KEYS.USER, STORAGE_KEYS.BABY, STORAGE_KEYS.TOKEN];
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX) && !preservedKeys.some(pk => k.endsWith(pk)))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },

  /** 获取当前已用存储大小（估算，单位：KB） */
  getUsageKB(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          total += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16 ≈ 2 bytes per char
        }
      }
      return Math.round(total / 1024 * 100) / 100;
    } catch {
      return 0;
    }
  },

  // 会话级存储（关闭浏览器即清除）
  getSession<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setSession<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
};

// 存储Key常量
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  BABY: 'baby',
  RECORDS: 'records',
  SETTINGS: 'settings',
  THEME: 'theme',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * 对存储字符串值进行XSS转义（读取时使用）
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** 敏感 key 列表 */
export const SENSITIVE_KEYS: Set<string> = new Set([
  STORAGE_KEYS.USER,     // 包含token的用户信息
  STORAGE_KEYS.TOKEN,
]);

/**
 * 检查某个key是否属于敏感数据
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}