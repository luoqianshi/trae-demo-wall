import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName } from '../lib/theme'
import { themeList } from '../lib/theme'

interface ThemeState {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'glass',
      setTheme: (theme) => set({ currentTheme: theme }),
      toggleTheme: () => {
        const list = themeList
        const idx = list.indexOf(get().currentTheme)
        const next = list[(idx + 1) % list.length]
        set({ currentTheme: next })
      },
    }),
    {
      name: 'hengzhou-theme-v2',
      partialize: (state) => ({ currentTheme: state.currentTheme }),
    }
  )
)
