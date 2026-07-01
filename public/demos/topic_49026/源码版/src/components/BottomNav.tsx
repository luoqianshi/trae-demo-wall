import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Bell, Brain, Users, Settings, BookOpen, MoreHorizontal, X } from 'lucide-react'
import { useUIStore, type ActiveNav } from '../stores/useUIStore'

// Apple HIG: 底部 Tab Bar 最多 5 个项，超出部分收入"更多"抽屉
// 5 个主 Tab: 记忆 / 关系 / 对话 / 日记 / 更多
// "对话"居中，作为视觉焦点与拇指自然落点（类似微信/Instagram 中心按钮）
// "更多"抽屉: 提醒 / 设置
const primaryTabs: { nav: ActiveNav; icon: typeof MessageSquare; label: string }[] = [
  { nav: '记忆', icon: Brain, label: '记忆' },
  { nav: '关系', icon: Users, label: '关系' },
  { nav: '对话', icon: MessageSquare, label: '对话' },
  { nav: '日记', icon: BookOpen, label: '日记' },
]

const moreTabs: { nav: ActiveNav; icon: typeof MessageSquare; label: string }[] = [
  { nav: '提醒', icon: Bell, label: '提醒' },
  { nav: '设置', icon: Settings, label: '设置' },
]

export function BottomNav() {
  const activeNav = useUIStore((s) => s.activeNav)
  const setActiveNav = useUIStore((s) => s.setActiveNav)
  const [moreOpen, setMoreOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const [sheetDragOffset, setSheetDragOffset] = useState(0)

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
  }

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - dragStartY.current
    if (dy > 0) setSheetDragOffset(dy)
  }

  const handleSheetTouchEnd = () => {
    if (sheetDragOffset > 80) {
      setMoreOpen(false)
    }
    setSheetDragOffset(0)
  }

  // 点击"更多"中的项后关闭抽屉
  const handleMoreSelect = (nav: ActiveNav) => {
    setActiveNav(nav)
    setMoreOpen(false)
  }

  // 点击遮罩关闭
  useEffect(() => {
    if (!moreOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [moreOpen])

  // 当前激活项是否在"更多"中
  const isActiveInMore = moreTabs.some(t => t.nav === activeNav)

  return (
    <>
      {/* 更多抽屉 - Apple Style Bottom Sheet */}
      {moreOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMoreOpen(false)}
          />
          {/* 底部抽屉 */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 rounded-t-2xl shadow-2xl"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--color-surface, #fff)',
              borderTop: '1px solid var(--color-border, rgba(0,0,0,0.06))',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
              transform: sheetDragOffset > 0 ? `translateY(${sheetDragOffset}px)` : undefined,
              transition: sheetDragOffset > 0 ? 'none' : undefined,
            }}
          >
            {/* 抓手 */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div
                className="rounded-full"
                style={{ width: '36px', height: '4px', background: 'var(--color-ink-muted, #d6d3d1)' }}
              />
            </div>
            {/* 标题 */}
            <div className="px-5 pt-1 pb-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-ink-tertiary, #78716c)' }}
              >
                更多功能
              </span>
            </div>
            {/* 选项列表 */}
            <div className="px-3 space-y-1">
              {moreTabs.map(({ nav, icon: Icon, label }) => {
                const isActive = activeNav === nav
                return (
                  <button
                    key={nav}
                    onClick={() => handleMoreSelect(nav)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors"
                    style={{
                      background: isActive ? 'var(--color-surface-hover, rgba(0,0,0,0.04))' : 'transparent',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg"
                      style={{
                        width: '32px',
                        height: '32px',
                        background: isActive
                          ? 'var(--color-zen-terracotta, #C97B5E)'
                          : 'var(--color-surface-hover, rgba(0,0,0,0.05))',
                      }}
                    >
                      <Icon
                        size={18}
                        strokeWidth={2}
                        color={isActive ? '#fff' : 'var(--color-ink-secondary, #57534e)'}
                      />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isActive
                          ? 'var(--color-ink-primary, #1c1917)'
                          : 'var(--color-ink-secondary, #57534e)',
                      }}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto text-xs"
                        style={{ color: 'var(--color-zen-terracotta, #C97B5E)' }}
                      >
                        ●
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* 底部导航栏 - 5 项布局，宽度跟随移动版页面 */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-stretch border-t backdrop-blur-xl"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '56px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'var(--color-surface, rgba(255,255,255,0.95))',
          borderColor: 'var(--color-border, rgba(0,0,0,0.06))',
        }}
      >
        {/* 4 个主 Tab */}
        {primaryTabs.map(({ nav, icon: Icon, label }, index) => {
          const isActive = activeNav === nav
          const isCenter = index === 2 // "对话"居中，视觉焦点
          return (
            <button
              key={nav}
              onClick={() => setActiveNav(nav)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-all"
              style={{
                color: isActive
                  ? 'var(--color-zen-terracotta, #C97B5E)'
                  : 'var(--color-ink-tertiary, #999)',
              }}
            >
              {isCenter ? (
                /* 居中对话按钮：圆形背景 + 放大图标，类似 Instagram 中心按钮 */
                <div
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: isActive
                      ? 'var(--color-zen-terracotta, #C97B5E)'
                      : 'color-mix(in srgb, var(--color-zen-terracotta, #C97B5E) 15%, transparent)',
                    boxShadow: isActive
                      ? '0 2px 8px color-mix(in srgb, var(--color-zen-terracotta, #C97B5E) 30%, transparent)'
                      : 'none',
                    marginBottom: '2px',
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2.2}
                    color={isActive ? '#fff' : 'var(--color-zen-terracotta, #C97B5E)'}
                  />
                </div>
              ) : (
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              )}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.02em',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}

        {/* 第 5 项: 更多 */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          aria-label="更多功能"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-all"
          style={{
            color: moreOpen || isActiveInMore
              ? 'var(--color-zen-terracotta, #C97B5E)'
              : 'var(--color-ink-tertiary, #999)',
          }}
        >
          <MoreHorizontal size={22} strokeWidth={moreOpen || isActiveInMore ? 2.5 : 1.8} />
          <span
            style={{
              fontSize: '10px',
              fontWeight: moreOpen || isActiveInMore ? 600 : 400,
              letterSpacing: '0.02em',
            }}
          >
            更多
          </span>
        </button>
      </nav>
    </>
  )
}
