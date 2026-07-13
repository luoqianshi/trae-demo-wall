// Theme Hook
// Theme switching and persistence logic

import { useState, useEffect, useCallback } from 'react';

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * 实际应用的主题（解析后的）
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * 主题存储键名
 */
const THEME_STORAGE_KEY = 'memory-anchor-theme';

/**
 * 获取系统主题偏好
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * 从 localStorage 获取主题
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored;
    }
    return null;
  } catch (error) {
    console.error('Failed to get stored theme:', error);
    return null;
  }
}

/**
 * 存储主题到 localStorage
 */
function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to store theme:', error);
  }
}

/**
 * 应用主题到 DOM
 */
function applyTheme(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  // 移除所有主题类
  root.classList.remove('light', 'dark');

  // 添加当前主题类
  root.classList.add(resolvedTheme);

  // 更新 body 的主题属性（兼容性）
  document.body.setAttribute('data-theme', resolvedTheme);
}

/**
 * 解析主题（将 'system' 转换为实际主题）
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * 主题 Hook
 */
export function useTheme() {
  // 主题状态（用户选择的 theme: light/dark/system）
  const [theme, setThemeState] = useState<Theme>(() => {
    // 优先从 localStorage 获取
    const stored = getStoredTheme();
    if (stored) {
      return stored;
    }

    // 默认深色（Archive 设计以深色为主）
    return 'dark';
  });

  // 解析后的主题（实际应用的主题）
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    return resolveTheme(theme);
  });

  /**
   * 设置主题
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
  }, []);

  /**
   * 切换主题（light <-> dark）
   */
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  /**
   * 应用主题到 DOM
   */
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  /**
   * 监听系统主题变化
   */
  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
    };

    // 添加监听器
    mediaQuery.addEventListener('change', handleChange);

    // 清理监听器
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  /**
   * 同步主题到配置文件（通过 IPC）
   */
  useEffect(() => {
    // 异步同步到配置文件
    const syncToConfig = async () => {
      try {
        if (window.electronAPI?.config?.update) {
          await window.electronAPI.config.update({
            app: {
              theme: theme === 'system' ? 'auto' : theme,
            },
          });
        }
      } catch (error) {
        console.error('Failed to sync theme to config:', error);
      }
    };

    void syncToConfig();
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };
}

/**
 * 导出辅助函数
 */
export {
  getSystemTheme,
  getStoredTheme,
  storeTheme,
  applyTheme,
  resolveTheme,
};