import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface ThemeInfo {
  theme: string;
  name: string;
  label: string;
}

interface ThemeState {
  currentTheme: string;
  themeLabel: string;
  allThemes: ThemeInfo[];
  autoSwitch: boolean;
  setTheme: (theme: string) => void;
  toggleAuto: () => void;
}

const ThemeContext = createContext<ThemeState>(null!);

const STORAGE_KEY = 'coin-kids-theme';
const AUTO_KEY = 'coin-kids-theme-auto';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'default');
  const [themeLabel, setThemeLabel] = useState('默认主题');
  const [allThemes, setAllThemes] = useState<ThemeInfo[]>([]);
  const [autoSwitch, setAutoSwitch] = useState(() => {
    const v = localStorage.getItem(AUTO_KEY);
    return v === null ? true : v === 'true';
  });

  // 加载主题列表
  useEffect(() => {
    api.get('/themes').then(res => {
      const list = res.data as ThemeInfo[];
      setAllThemes(list);
    }).catch(() => {});
  }, []);

  // 自动切换：每10分钟检测一次节日主题
  const fetchCurrentTheme = useCallback(async () => {
    try {
      const res = await api.get('/themes/current');
      const t = res.data as ThemeInfo;
      if (autoSwitch) {
        setCurrentTheme(t.theme);
        setThemeLabel(t.label);
        localStorage.setItem(STORAGE_KEY, t.theme);
      }
    } catch {}
  }, [autoSwitch]);

  useEffect(() => {
    if (autoSwitch) {
      fetchCurrentTheme();
      const interval = setInterval(fetchCurrentTheme, 600000); // 10min
      return () => clearInterval(interval);
    }
  }, [autoSwitch, fetchCurrentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const setTheme = useCallback((theme: string) => {
    setCurrentTheme(theme);
    const found = allThemes.find(t => t.theme === theme);
    setThemeLabel(found?.label || theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [allThemes]);

  const toggleAuto = useCallback(() => {
    setAutoSwitch(prev => {
      const next = !prev;
      localStorage.setItem(AUTO_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeLabel, allThemes, autoSwitch, setTheme, toggleAuto }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);