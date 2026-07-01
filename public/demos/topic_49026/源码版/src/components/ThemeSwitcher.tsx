import { useState, useEffect, useRef } from 'react'
import { Palette, Check } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { themeList, getThemeConfig } from '../lib/theme'
import type { ThemeName } from '../lib/theme'

function ThemeColorPreview({ name }: { name: ThemeName }) {
  const config = getThemeConfig(name)
  const { colors } = config

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded overflow-hidden w-8 h-5 border border-ink-muted/20 shrink-0">
        <div className="w-1/2 h-full" style={{ backgroundColor: colors.canvas }} />
        <div className="w-1/2 h-full" style={{ backgroundColor: colors.surface }} />
      </div>
      <div className="flex gap-0.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.terracotta }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.sage }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.indigo }} />
      </div>
    </div>
  )
}

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClick)
      return () => document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const handleSelect = (name: ThemeName) => {
    setTheme(name)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-secondary hover:bg-canvas-warm transition-colors"
        aria-label="切换主题"
        title="切换主题"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-ink-muted/20 rounded-xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1.5 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
            选择主题
          </div>
          {themeList.map((name) => {
            const config = getThemeConfig(name)
            const isActive = currentTheme === name
            return (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3 border-l-4 ${
                  isActive
                    ? 'bg-canvas-warm border-l-zen-terracotta'
                    : 'hover:bg-canvas-warm/50 border-l-transparent'
                }`}
              >
                <ThemeColorPreview name={name} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${isActive ? 'text-ink-primary font-medium' : 'text-ink-secondary'}`}>
                    {config.label}
                  </div>
                  <div className="text-xs text-ink-tertiary truncate">
                    {config.description}
                  </div>
                </div>
                {isActive && (
                  <Check className="w-4 h-4 text-zen-terracotta shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
