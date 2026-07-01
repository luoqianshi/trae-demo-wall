// [HMR-TOUCH] 2026-06-20: 桌面端/移动端布局切换按钮
import { useState, useEffect } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import {
  getLayoutMode,
  setLayoutMode,
  resolveLayoutMode,
  type ResolvedLayout,
} from './DesktopLayout'

/**
 * 桌面端 / 移动端布局切换按钮
 * 固定在页面右上角，两个按钮并排显示
 * 点击后立即切换布局模式并持久化到 localStorage
 */
export function LayoutToggle() {
  const [current, setCurrent] = useState<ResolvedLayout>(() =>
    resolveLayoutMode(getLayoutMode()),
  )

  useEffect(() => {
    const update = () => {
      setCurrent(resolveLayoutMode(getLayoutMode()))
    }
    window.addEventListener('hengzhou:layout-mode-change', update)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('hengzhou:layout-mode-change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const switchTo = (mode: ResolvedLayout) => {
    if (mode === current) return
    setLayoutMode(mode) // 直接设为 'desktop' 或 'mobile'，覆盖 auto
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      role="group"
      aria-label="布局模式切换"
    >
      {/* 桌面端按钮 */}
      <button
        onClick={() => switchTo('desktop')}
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
          current === 'desktop'
            ? 'bg-zen-terracotta/15 text-zen-terracotta'
            : 'text-ink-muted hover:text-ink-secondary hover:bg-canvas-warm'
        }`}
        aria-label="桌面端布局"
        aria-pressed={current === 'desktop'}
        title="桌面端布局"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>

      {/* 移动端按钮 */}
      <button
        onClick={() => switchTo('mobile')}
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
          current === 'mobile'
            ? 'bg-zen-terracotta/15 text-zen-terracotta'
            : 'text-ink-muted hover:text-ink-secondary hover:bg-canvas-warm'
        }`}
        aria-label="移动端布局"
        aria-pressed={current === 'mobile'}
        title="移动端布局"
      >
        <Smartphone className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
