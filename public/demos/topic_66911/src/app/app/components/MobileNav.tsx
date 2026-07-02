'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, FileEdit, Target, BookOpen, Menu, Settings, FlaskConical, X, Sparkles } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { icon: Home, label: '首页', href: '/app' },
  { icon: FileEdit, label: '对话', href: '/app/editor' },
  { icon: BookOpen, label: '文献', href: '/app/papers' },
  { icon: FlaskConical, label: '知识', href: '/app/knowledge' },
  { icon: Target, label: '计划', href: '/app/plans' },
]

const moreItems = [
  { icon: Target, label: '写作筹谋', href: '/app/plans' },
  { icon: FileEdit, label: '典籍管理', href: '/app/papers' },
  { icon: FlaskConical, label: '博闻', href: '/app/knowledge' },
  { icon: Settings, label: '雅设', href: '/app/settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* 底部导航栏 - 仅移动端显示 */}
      <nav
        className="fixed bottom-0 left-0 right-0 liquid-glass border-t border-ochre/10 z-40 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="移动端导航"
      >
        {/* Ink-wash overlay at very low opacity */}
        <div
          className="absolute inset-0 rounded-none pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 300px 200px at 20% 50%, rgba(139,94,60,0.03) 0%, transparent 70%), radial-gradient(ellipse 250px 180px at 80% 40%, rgba(74,107,138,0.02) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-around py-2 px-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[12px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 ${isActive
                    ? 'text-ochre'
                    : 'text-ink-muted hover:text-ink-secondary'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator: ink brush stroke SVG */}
                {isActive && (
                  <svg
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2"
                    width="16"
                    height="6"
                    viewBox="0 0 16 6"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 4.5C3 2.5 5 1.5 8 1.5C11 1.5 13 2.5 15 4.5"
                      stroke="#8B5E3C"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.85"
                    />
                  </svg>
                )}
                <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
                <span className="text-[10px] font-serif font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* 更多按钮 */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[12px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 ${drawerOpen ? 'text-ochre' : 'text-ink-muted'
              }`}
            aria-label="更多功能"
            aria-expanded={drawerOpen}
          >
            {drawerOpen && (
              <svg
                className="absolute -top-0.5 left-1/2 -translate-x-1/2"
                width="16"
                height="6"
                viewBox="0 0 16 6"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 4.5C3 2.5 5 1.5 8 1.5C11 1.5 13 2.5 15 4.5"
                  stroke="#8B5E3C"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
              </svg>
            )}
            <Menu
              className="w-[22px] h-[22px] transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ transform: drawerOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              aria-hidden="true"
            />
            <span className="text-[10px] font-serif font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* 抽屉式更多菜单 */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 md:hidden animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-16 left-4 right-4 liquid-glass rounded-[20px] shadow-xl z-50 md:hidden animate-slide-up overflow-hidden"
            role="dialog"
            aria-label="更多功能"
            style={{
              background:
                'rgba(255,255,255,0.72) radial-gradient(ellipse 400px 300px at 30% 40%, rgba(139,94,60,0.04) 0%, transparent 70%)',
            }}
          >
            <div className="p-3">
              <div className="flex items-center justify-between px-3 pb-2 mb-1 ink-divider">
                <h3 className="text-sm font-display text-ochre">更多功能</h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-[10px] text-ink-muted hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90"
                  aria-label="关闭菜单"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {moreItems.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-[14px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 relative overflow-hidden ${isActive
                        ? 'bg-ochre/5 text-ochre'
                        : 'text-ink-secondary hover:bg-ochre/5'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Left ochre border on hover */}
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-ochre/60 scale-y-0 transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-y-100 origin-center" />
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm font-serif font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
