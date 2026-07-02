'use client'

import React from 'react'
import { LucideIcon, HelpCircle, Sparkles } from 'lucide-react'
import { Button } from './Button'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
}

interface EmptyStateProps {
  /** lucide-react 图标组件 */
  icon?: LucideIcon
  /** 主标题 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 操作按钮列表 */
  actions?: EmptyStateAction[]
  /** 底部帮助提示 */
  helpTip?: string
  /** 是否显示装饰性背景纹理 */
  showDecoration?: boolean
  className?: string
  /** 插画替代材质 (SVG 风格) */
  illustration?: 'simple' | 'paper' | 'search'
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const illustrationSVG: Record<string, React.ReactNode> = {
  paper: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="w-16 h-16">
      <rect x="8" y="4" width="48" height="56" rx="4" stroke="#C4A882" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="18" x2="48" y2="18" stroke="#E5DDD4" strokeWidth="1.5" />
      <line x1="16" y1="26" x2="48" y2="26" stroke="#E5DDD4" strokeWidth="1.5" />
      <line x1="16" y1="34" x2="40" y2="34" stroke="#E5DDD4" strokeWidth="1.5" />
      <line x1="16" y1="42" x2="36" y2="42" stroke="#E5DDD4" strokeWidth="1.5" />
      <circle cx="16" cy="50" r="2" fill="#C4A882" opacity="0.5" />
    </svg>
  ),
  search: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="w-16 h-16">
      <circle cx="28" cy="28" r="14" stroke="#C4A882" strokeWidth="1.5" fill="none" />
      <line x1="38" y1="38" x2="50" y2="50" stroke="#C4A882" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="28" x2="34" y2="28" stroke="#E5DDD4" strokeWidth="1.5" />
      <line x1="24" y1="34" x2="32" y2="34" stroke="#E5DDD4" strokeWidth="1.5" />
    </svg>
  ),
}

export function EmptyState({
  icon: Icon,
  title = '暂无数据',
  description,
  actions,
  helpTip,
  showDecoration = true,
  className,
  illustration,
}: EmptyStateProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center py-16 px-6 text-center overflow-hidden ${className || ''}`}
    >
      {/* 装饰性宣纸纹理 */}
      {showDecoration && (
        <div className="absolute inset-0 pointer-events-none opacity-30 paper-texture" aria-hidden="true" />
      )}

      {/* 图标/插画区域 */}
      {illustration && illustrationSVG[illustration] ? (
        <div className="mb-5 animate-empty-float">
          <div className="w-20 h-20 rounded-full bg-ochre-bg flex items-center justify-center border border-border">
            {illustrationSVG[illustration]}
          </div>
        </div>
      ) : Icon ? (
        <div className="animate-empty-float mb-5">
          <div className="w-16 h-16 rounded-full bg-ochre-bg flex items-center justify-center border border-border">
            <Icon className="w-8 h-8 text-ochre" aria-hidden="true" />
          </div>
        </div>
      ) : null}

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>

      {/* 描述 */}
      {description && (
        <p className="text-sm text-ink-muted max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || (idx === 0 ? 'primary' : 'secondary')}
              size="md"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* 帮助提示 */}
      {helpTip && (
        <div className="flex items-center gap-1.5 mt-6 text-xs text-ink-muted">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{helpTip}</span>
        </div>
      )}
    </div>
  )
}