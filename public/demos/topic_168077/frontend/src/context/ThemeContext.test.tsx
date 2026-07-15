import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

const mockGet = vi.fn();
vi.mock('../api/client', () => ({
  default: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockGet.mockReset();
});

function setupWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider>{children}</ThemeProvider>;
  };
}

describe('ThemeContext', () => {
  it('provides default theme on mount', () => {
    mockGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    expect(result.current.currentTheme).toBe('default');
    expect(result.current.themeLabel).toBe('默认主题');
    expect(result.current.autoSwitch).toBe(true);
  });

  it('loads theme list on mount', async () => {
    const themes = [
      { theme: 'default', name: '', label: '默认主题' },
      { theme: 'spring-festival', name: '春节', label: '春节主题' },
    ];
    mockGet.mockResolvedValue({ data: themes });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    await waitFor(() => {
      expect(result.current.allThemes).toEqual(themes);
    });
    expect(mockGet).toHaveBeenCalledWith('/themes');
  });

  it('setTheme changes current theme and updates localStorage', () => {
    mockGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.currentTheme).toBe('dark');
    expect(result.current.themeLabel).toBe('dark');
    expect(localStorage.getItem('coin-kids-theme')).toBe('dark');
  });

  it('setTheme finds label from allThemes', async () => {
    const themes = [
      { theme: 'default', name: '', label: '默认主题' },
      { theme: 'spring-festival', name: '春节', label: '春节主题' },
    ];
    mockGet.mockResolvedValue({ data: themes });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    await waitFor(() => expect(result.current.allThemes.length).toBe(2));
    act(() => {
      result.current.setTheme('spring-festival');
    });
    expect(result.current.themeLabel).toBe('春节主题');
  });

  it('toggleAuto switches autoSwitch state', () => {
    mockGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    expect(result.current.autoSwitch).toBe(true);
    act(() => {
      result.current.toggleAuto();
    });
    expect(result.current.autoSwitch).toBe(false);
    expect(localStorage.getItem('coin-kids-theme-auto')).toBe('false');
    act(() => {
      result.current.toggleAuto();
    });
    expect(result.current.autoSwitch).toBe(true);
  });

  it('reads theme from localStorage', () => {
    localStorage.setItem('coin-kids-theme', 'dark');
    localStorage.setItem('coin-kids-theme-auto', 'false');
    mockGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    expect(result.current.currentTheme).toBe('dark');
    expect(result.current.autoSwitch).toBe(false);
  });

  it('sets data-theme attribute on document element', () => {
    mockGet.mockResolvedValue({ data: [] });
    renderHook(() => useTheme(), { wrapper: setupWrapper() });
    expect(document.documentElement.getAttribute('data-theme')).toBe('default');
  });

  it('updates data-theme attribute when theme changes', () => {
    mockGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('fetches current theme when autoSwitch is enabled', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    // On mount with autoSwitch=true, should fetch /themes/current
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/themes/current');
    });
  });

  it('handles API error gracefully', () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useTheme(), { wrapper: setupWrapper() });
    expect(result.current.currentTheme).toBe('default');
    expect(result.current.allThemes).toEqual([]);
  });
});