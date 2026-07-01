import { useCallback, useMemo } from 'react'
import type { ThemeName, ThemeConfig } from '../lib/theme'
import { themeList, getThemeConfig } from '../lib/theme'
import { useThemeStore } from '../stores/useThemeStore'

export interface UseThemeReturn {
  currentTheme: ThemeName
  setTheme: (name: ThemeName) => void
  themeConfig: ThemeConfig
  toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const setThemeStore = useThemeStore((s) => s.setTheme)
  const toggleThemeStore = useThemeStore((s) => s.toggleTheme)

  const setTheme = useCallback((name: ThemeName) => {
    setThemeStore(name)
    document.documentElement.dataset.theme = name
    document.body.setAttribute('data-theme', name)
  }, [setThemeStore])

  const toggleTheme = useCallback(() => {
    toggleThemeStore()
    const next = themeList[(themeList.indexOf(currentTheme) + 1) % themeList.length]
    document.documentElement.dataset.theme = next
    document.body.setAttribute('data-theme', next)
  }, [currentTheme, toggleThemeStore])

  const themeConfig = useMemo(() => getThemeConfig(currentTheme), [currentTheme])

  return {
    currentTheme,
    setTheme,
    themeConfig,
    toggleTheme,
  }
}
