'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  FileEdit,
  PenLine,
  BookOpen,
  FlaskConical,
  Bot,
  ChevronDown,
} from 'lucide-react'

interface NavGroup {
  title: string
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
}

const navGroups: NavGroup[] = [
  {
    title: '写作',
    items: [
      { href: '/app/editor', label: '翰墨', icon: FileEdit },
      { href: '/app/plans', label: '筹谋', icon: PenLine },
    ],
  },
  {
    title: '研究',
    items: [
      { href: '/app/papers', label: '典籍', icon: BookOpen },
      { href: '/app/knowledge', label: '博闻', icon: FlaskConical },
    ],
  },
  {
    title: 'AI',
    items: [
      { href: '/app/chat', label: '智囊', icon: Bot },
    ],
  },
]

export function TopNavBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  /* ---- Scroll listener for glass transition ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---- Click outside to close user menu ---- */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
      setUserMenuOpen(false)
    }
  }, [])

  useEffect(() => {
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, handleClickOutside])

  /* ---- Esc to close menus ---- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 h-14 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${scrolled
          ? 'liquid-glass border-b border-ochre/10 shadow-sm'
          : 'bg-transparent'
        }`}
      style={scrolled ? { backdropFilter: 'blur(50px) saturate(180%)', WebkitBackdropFilter: 'blur(50px) saturate(180%)' } : undefined}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { onMenuToggle?.(); setMobileNavOpen(!mobileNavOpen) }}
            className="lg:hidden p-2 rounded-[10px] text-ink-secondary hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            aria-label="切换菜单"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/app" className="flex items-center gap-2.5 shrink-0" aria-label="彩笺寄 - 返回工作台">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-ochre to-cinnabar flex items-center justify-center shadow-sm animate-glow-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-ochre hidden sm:inline tracking-wide">彩笺寄</span>
          </Link>
        </div>

        {/* Center: Grouped Navigation (desktop) */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="主导航">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="flex items-center">
              {groupIdx > 0 && (
                <div className="w-px h-4 bg-gradient-to-b from-transparent via-ochre/15 to-transparent mx-2" role="separator" aria-hidden="true" />
              )}
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-serif font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 ${isActive
                        ? 'text-ochre'
                        : 'text-ink-secondary hover:text-ink'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {item.label}
                    {/* Active indicator: ink dot above + ochre gradient underline */}
                    {isActive && (
                      <>
                        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-ochre shadow-[0_0_6px_rgba(139,94,60,0.4)]" />
                        <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-ochre/60 via-ochre to-ochre/60" />
                      </>
                    )}
                    {/* Hover underline */}
                    {!isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[1.5px] rounded-full bg-gradient-to-r from-ochre/40 via-ochre/60 to-ochre/40 scale-x-0 transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-x-100 origin-left" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-[10px] text-ink-muted hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            aria-label="搜索"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <button
            className="p-2 rounded-[10px] text-ink-muted hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 relative"
            aria-label="通知"
          >
            <Bell className="w-[18px] h-[18px]" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-[10px] hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
              aria-label="用户菜单"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-ochre/10 flex items-center justify-center border border-ochre/20">
                <User className="w-3.5 h-3.5 text-ochre" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-[20px] shadow-lg py-1.5 animate-modal-appear z-50 ink-wash-dropdown"
                role="menu"
                aria-label="用户菜单选项"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(50px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                  border: '0.5px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="px-4 py-2.5 ink-divider">
                  <p className="text-sm font-serif font-medium text-ink truncate">
                    {user?.displayName || user?.username || '雅士'}
                  </p>
                  <p className="text-xs font-serif text-ink-muted">{user?.isGuest ? '过客' : '已入席'}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/app/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-center gap-2.5 px-4 py-2 text-sm font-serif text-ink-secondary hover:bg-ochre/5 hover:text-ink transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] relative"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4" />
                    雅设
                    <span className="absolute bottom-0.5 left-4 right-4 h-[1px] bg-gradient-to-r from-ochre/30 via-ochre/50 to-ochre/30 scale-x-0 transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-x-100 origin-left" />
                  </Link>
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false) }}
                    className="group flex items-center gap-2.5 px-4 py-2 text-sm font-serif text-ink-muted hover:bg-cinnabar/5 hover:text-cinnabar transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] w-full text-left relative"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    辞归
                    <span className="absolute bottom-0.5 left-4 right-4 h-[1px] bg-gradient-to-r from-cinnabar/20 via-cinnabar/40 to-cinnabar/20 scale-x-0 transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-x-100 origin-left" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {mobileNavOpen && (
        <div className="lg:hidden liquid-glass border-t border-ochre/10 animate-fade-in">
          <nav className="p-3 space-y-1" aria-label="移动端导航">
            {navGroups.map(group => (
              <div key={group.title} role="group" aria-label={group.title}>
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-sm font-serif font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${isActive
                          ? 'bg-ochre/5 text-ochre'
                          : 'text-ink-secondary hover:bg-ochre/5'
                        }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Gold gradient line at very bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(196,168,130,0.35) 30%, rgba(196,168,130,0.5) 50%, rgba(196,168,130,0.35) 70%, transparent 100%)',
        }}
      />
    </header>
  )
}
