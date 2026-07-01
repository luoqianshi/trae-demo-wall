import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface BackHeaderProps {
  title: string
  onBack: () => void
  subtitle?: string
  rightAction?: ReactNode
}

/**
 * Apple HIG 风格的返回导航头
 * - 左侧: ChevronLeft + "返回" 文字（可点击）
 * - 中间: 页面标题
 * - 右侧: 可选操作区
 * 全部使用 CSS 变量适配所有主题
 */
export function BackHeader({ title, onBack, subtitle, rightAction }: BackHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        borderBottom: '1px solid var(--color-border, rgba(0,0,0,0.06))',
        background: 'var(--color-surface, rgba(255,255,255,0.8))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* 左侧返回按钮 */}
      <button
        onClick={onBack}
        aria-label="返回"
        className="flex items-center gap-0.5 transition-opacity hover:opacity-70"
        style={{
          color: 'var(--color-zen-terracotta, #C97B5E)',
          minWidth: '60px',
          fontSize: '15px',
        }}
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
        <span style={{ fontWeight: 500 }}>返回</span>
      </button>

      {/* 中间标题 */}
      <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
        <span
          className="truncate"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-ink-primary, #1c1917)',
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="truncate"
            style={{
              fontSize: '11px',
              color: 'var(--color-ink-tertiary, #78716c)',
              marginTop: '1px',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* 右侧操作区 */}
      <div style={{ minWidth: '60px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
