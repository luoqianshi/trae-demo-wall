'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { useState } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  LogOut,
  User,
  Sparkles,
  ChevronRight,
  FileEdit,
  ChevronFirst,
  ChevronLast,
  Settings,
  PenLine,
  FlaskConical,
  Bot
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '写作',
    items: [
      { href: '/app/editor', label: '论文编辑器', icon: FileEdit },
      { href: '/app/plans', label: '写作规划', icon: PenLine },
    ],
  },
  {
    title: '研究',
    items: [
      { href: '/app/papers', label: '文献管理', icon: BookOpen },
      { href: '/app/knowledge', label: '知识库', icon: FlaskConical },
    ],
  },
  {
    title: 'AI 助手',
    items: [
      { href: '/app/chat', label: '对话助手', icon: Bot },
    ],
  },
  {
    title: '设置',
    items: [
      { href: '/app/settings', label: '设置', icon: Settings },
    ],
  },
]

const dashboardItem: NavItem = { href: '/app', label: '工作台', icon: LayoutDashboard }

interface AppSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function AppSidebar({ collapsed: controlledCollapsed, onCollapsedChange }: AppSidebarProps = {}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const setCollapsed = (value: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange(value)
    } else {
      setInternalCollapsed(value)
    }
  }

  const isExpanded = !collapsed || hovered

  /* ---------------------------------------------------------------- */
  /*  Nav item render helper                                           */
  /* ---------------------------------------------------------------- */
  const renderNavItem = (item: NavItem, isDashboard = false) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5E3C]/30 focus-visible:ring-offset-1',
          isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5',
          isActive
            ? 'bg-[#F5EDE3] text-[#8B5E3C]'
            : 'text-[#5A5048] hover:bg-[#F5F0EB] hover:text-[#2C2420] active:scale-[0.98]',
        ].join(' ')}
        title={!isExpanded ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" />
        {isExpanded && <span className="truncate">{item.label}</span>}
        {isActive && isExpanded && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
      </Link>
    )
  }

  return (
    <aside
      className={[
        'fixed left-0 top-0 h-full bg-white border-r border-[#E5DDD4] flex flex-col z-50',
        'transition-all duration-300 ease-out',
        isExpanded ? 'w-64' : 'w-16',
        // 桌面端显示，移动端隐藏（由 MobileNav 接管）
        'hidden md:flex',
      ].join(' ')}
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="主导航"
    >
      {/* Guest warning */}
      {user?.isGuest && isExpanded && (
        <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in">
          <p className="text-xs text-amber-700 mb-2">
            <Sparkles className="w-3 h-3 inline mr-1" />
            游客模式下数据不会保存
          </p>
          <Link
            href="/login"
            className="text-xs text-[#8B5E3C] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5E3C]/30 rounded"
          >
            登录以保存数据 →
          </Link>
        </div>
      )}

      {/* Logo & Toggle */}
      <div className={`border-b border-[#F0EBE5] flex items-center ${isExpanded ? 'p-5 justify-between' : 'p-3 justify-center'}`}>
        <Link
          href="/app"
          className={`flex items-center gap-3 ${!isExpanded && 'hidden'}`}
          aria-label="彩笺寄 - 返回工作台"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8B5E3C] to-[#B54A3A] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#2C2420]">彩笺寄</span>
            <p className="text-[10px] text-[#8A7E74] -mt-0.5">AI 学术写作助手</p>
          </div>
        </Link>
        {!isExpanded && (
          <Link
            href="/app"
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8B5E3C] to-[#B54A3A] flex items-center justify-center shrink-0"
            aria-label="彩笺寄 - 返回工作台"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-[#8A7E74] hover:bg-[#F5F0EB] hover:text-[#2C2420] transition-all shrink-0 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5E3C]/30 ${!isExpanded && 'hidden'}`}
          title={collapsed ? '展开侧边栏' : '收缩侧边栏'}
          aria-label={collapsed ? '展开侧边栏' : '收缩侧边栏'}
        >
          {collapsed ? <ChevronLast className="w-4 h-4" /> : <ChevronFirst className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* 工作台 - 核心入口 */}
        {renderNavItem(dashboardItem, true)}

        {/* 分组分隔线 */}
        {isExpanded && <div className="my-3 border-t border-[#E5DDD4]" role="separator" />}
        {!isExpanded && <div className="my-2 border-t border-[#E5DDD4]" role="separator" />}

        {/* 分组导航 */}
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} role="group" aria-label={group.title}>
            {/* 分组标题 */}
            {isExpanded && (
              <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                <div className="w-1 h-3 rounded-full bg-[#8B5E3C] opacity-40" />
                <span className="text-[11px] font-medium text-[#8A7E74] tracking-wider uppercase">
                  {group.title}
                </span>
              </div>
            )}

            {/* 分组内导航项 */}
            <div className={isExpanded ? 'space-y-0.5' : 'space-y-0.5'}>
              {group.items.map(item => renderNavItem(item))}
            </div>

            {/* 分组之间的分隔线 */}
            {groupIndex < navGroups.length - 1 && (
              <div className={`border-t border-[#E5DDD4] ${isExpanded ? 'mt-2 mb-1' : 'my-2'}`} role="separator" />
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-[#F0EBE5]">
        <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${!isExpanded && 'justify-center px-0'}`}>
          <div className="w-8 h-8 rounded-full bg-[#F5EDE3] flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-[#8B5E3C]" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2C2420] truncate">
                {user?.displayName || user?.username || '用户'}
              </p>
              <p className="text-xs text-[#8A7E74]">
                {user?.isGuest ? '游客用户' : '已登录'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={[
            'flex items-center rounded-lg text-sm transition-all duration-150 w-full',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 focus-visible:ring-offset-1',
            isExpanded ? 'gap-3 px-3 py-2' : 'justify-center px-2 py-2',
            'text-[#8A7E74] hover:bg-red-50 hover:text-red-600 active:scale-[0.98]',
          ].join(' ')}
          title={!isExpanded ? '退出登录' : undefined}
          aria-label="退出登录"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isExpanded && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  )
}
