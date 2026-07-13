import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'time';
export type ResolvedTheme = 'light' | 'dark';
export type AccentColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky';

const STORAGE_KEY = 'theme-mode';
const ACCENT_KEY = 'theme-accent';

export interface AccentPalette {
  name: string;
  primary: string;
  primaryDark: string;
  gradient: string;
  rgbHex: string;
}

export const ACCENT_PALETTES: Record<AccentColor, AccentPalette> = {
  indigo: {
    name: '紫蓝',
    primary: '#6366f1',
    primaryDark: '#818cf8',
    gradient: 'from-indigo-500 to-purple-500',
    rgbHex: '99,102,241',
  },
  emerald: {
    name: '青绿',
    primary: '#10b981',
    primaryDark: '#34d399',
    gradient: 'from-emerald-500 to-teal-500',
    rgbHex: '16,185,129',
  },
  rose: {
    name: '玫瑰',
    primary: '#f43f5e',
    primaryDark: '#fb7185',
    gradient: 'from-rose-500 to-pink-500',
    rgbHex: '244,63,94',
  },
  amber: {
    name: '橙黄',
    primary: '#f59e0b',
    primaryDark: '#fbbf24',
    gradient: 'from-amber-500 to-orange-500',
    rgbHex: '245,158,11',
  },
  sky: {
    name: '天蓝',
    primary: '#0ea5e9',
    primaryDark: '#38bdf8',
    gradient: 'from-sky-500 to-blue-500',
    rgbHex: '14,165,233',
  },
};

const ACCENT_VAR_LIGHT: Record<AccentColor, string> = {
  indigo: '99,102,241',
  emerald: '16,185,129',
  rose: '244,63,94',
  amber: '245,158,11',
  sky: '14,165,233',
};

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getTimeBasedTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  const hour = new Date().getHours();
  if (hour >= 19 || hour < 7) return 'dark';
  if (hour >= 17) return 'dark';
  return 'light';
}

function resolveTheme(mode: ThemeMode, currentAccent: AccentColor): ResolvedTheme {
  if (mode === 'system') return getSystemTheme();
  if (mode === 'time') return getTimeBasedTheme();
  return mode;
}

function applyTheme(resolved: ResolvedTheme, accent: AccentColor) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);

  const accentVal = ACCENT_VAR_LIGHT[accent];
  root.style.setProperty('--accent-rgb', accentVal);
  root.style.setProperty('--accent-color', ACCENT_PALETTES[accent].primary);
  root.style.setProperty('--accent-color-dark', ACCENT_PALETTES[accent].primaryDark);
}

function loadAccent(): AccentColor {
  if (typeof window === 'undefined') return 'indigo';
  const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null;
  if (stored && stored in ACCENT_PALETTES) return stored;
  return 'indigo';
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system' || saved === 'time') return saved;
    return 'system';
  });

  const [accent, setAccentState] = useState<AccentColor>(loadAccent);

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(mode, accent));

  useEffect(() => {
    const update = () => {
      const next = resolveTheme(mode, accent);
      setResolvedTheme(next);
      applyTheme(next, accent);
    };
    update();
    localStorage.setItem(STORAGE_KEY, mode);

    const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;
    if (mode === 'system' && media) {
      mediaHandler = () => update();
      media.addEventListener('change', mediaHandler);
    }

    let timeInterval: number | null = null;
    if (mode === 'time') {
      timeInterval = window.setInterval(update, 60_000);
    }

    return () => {
      if (mediaHandler && media) media.removeEventListener('change', mediaHandler);
      if (timeInterval !== null) clearInterval(timeInterval);
    };
  }, [mode, accent]);

  const setLight = useCallback(() => setMode('light'), []);
  const setDark = useCallback(() => setMode('dark'), []);
  const setSystem = useCallback(() => setMode('system'), []);
  const setTime = useCallback(() => setMode('time'), []);
  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a);
    localStorage.setItem(ACCENT_KEY, a);
  }, []);

  const cycleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'time';
      return 'system';
    });
  }, []);

  return {
    mode,
    theme: resolvedTheme,
    accent,
    accentPalette: ACCENT_PALETTES[accent],
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: mode === 'system',
    isTimeBased: mode === 'time',
    setLight,
    setDark,
    setSystem,
    setTime,
    setAccent,
    cycleTheme,
  };
}