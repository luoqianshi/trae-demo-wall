import { useEffect } from 'react'
import { useThemeStore } from '../stores/useThemeStore'
import { getThemeConfig, themeList } from '../lib/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = useThemeStore((s) => s.currentTheme)

  useEffect(() => {
    // 防御性检查：主题配置可能在持久化恢复完成前或主题名失效时为 undefined，
    // 直接访问 config.colors 会抛出 TypeError，需提前拦截。
    if (!currentTheme || !themeList.includes(currentTheme)) {
      console.warn('[ThemeProvider] 主题未加载或无效，跳过主题变量应用:', currentTheme)
      return
    }

    const config = getThemeConfig(currentTheme)
    if (!config) {
      console.warn('[ThemeProvider] 主题颜色未加载，使用默认值')
      return
    }

    // 应用 CSS 变量到 document.documentElement
    const root = document.documentElement
    root.style.setProperty('--canvas', config.colors.canvas)
    root.style.setProperty('--canvas-warm', config.colors.canvasWarm)
    root.style.setProperty('--surface', config.colors.surface)
    root.style.setProperty('--surface-hover', config.colors.surfaceHover)
    root.style.setProperty('--ink-primary', config.colors.inkPrimary)
    root.style.setProperty('--ink-secondary', config.colors.inkSecondary)
    root.style.setProperty('--ink-tertiary', config.colors.inkTertiary)
    root.style.setProperty('--ink-muted', config.colors.inkMuted)
    root.style.setProperty('--terracotta', config.colors.terracotta)
    root.style.setProperty('--sage', config.colors.sage)
    root.style.setProperty('--indigo', config.colors.indigo)
    root.style.setProperty('--amber', config.colors.amber)
    root.style.setProperty('--rose', config.colors.rose)
    root.style.setProperty('--stone', config.colors.stone)
    root.style.setProperty('--font-serif', config.fonts.serif)
    root.style.setProperty('--font-sans', config.fonts.sans)
    root.style.setProperty('--font-mono', config.fonts.mono)

    // 同时设置 data-theme 属性供 CSS 选择器使用
    document.documentElement.dataset.theme = currentTheme
    document.body.setAttribute('data-theme', currentTheme)

    // 添加主题切换过渡动画
    root.style.transition = 'background-color 0.5s ease, color 0.5s ease'
    const timer = setTimeout(() => {
      root.style.transition = ''
    }, 500)

    return () => clearTimeout(timer)
  }, [currentTheme])

  return <>{children}</>
}
