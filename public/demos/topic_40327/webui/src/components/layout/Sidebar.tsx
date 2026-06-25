import { NavLink } from 'react-router-dom'
import {
  Settings,
  Cpu,
  Database,
  Brain,
  MessageSquare,
} from 'lucide-react'

interface SidebarProps {
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  onMobileMenuClose: () => void
}

// 导航项目 - 全部使用蓝色主色调
const menuItems = [
  { icon: MessageSquare, label: '本地聊天', path: '/local-chat' },
  { icon: Settings, label: '主程序配置', path: '/bot-config' },
  { icon: Cpu, label: '模型配置', path: '/model-config' },
  { icon: Database, label: '知识库', path: '/knowledge' },
  { icon: Brain, label: '记忆系统', path: '/memory' },
]

export function Sidebar({ sidebarOpen, mobileMenuOpen, onMobileMenuClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 ease-out
        ${sidebarOpen ? 'w-[260px]' : 'w-[72px]'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{
        background: 'hsl(var(--surface))',
        borderRight: '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      {/* Logo 区域 */}
      <div className="flex h-14 items-center gap-3 px-4 flex-shrink-0">
        <div 
          className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)' }}
        >
          <span className="text-sm font-bold text-white tracking-tight">语</span>
        </div>
        
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-out flex-1 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
          <h1 className="text-sm font-bold tracking-tight" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            语瞳 Demo
          </h1>
          <p className="text-[11px]" style={{ color: 'hsl(var(--text-muted))' }}>TRAE 创造力大赛</p>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="mx-3 h-px" style={{ background: 'hsl(var(--border))' }} />

      {/* 导航区域 */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="主导航">
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onMobileMenuClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg p-2.5 transition-all duration-150 ease-out
                ${isActive 
                  ? 'font-medium' 
                  : 'hover:opacity-80'
                }
                ${!sidebarOpen ? 'lg:justify-center lg:px-2' : 'justify-start'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
              })}
            >
              {/* 激活状态左侧指示条 */}
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
                      style={{ background: 'hsl(var(--primary))' }}
                    />
                  )}
                  
                  {/* 图标 */}
                  <div 
                    className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.08)',
                      color: isActive ? 'white' : 'hsl(var(--primary))',
                    }}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  
                  {/* 文字标签 */}
                  <span 
                    className={`text-sm transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}
                    style={{ color: 'inherit' }}
                  >
                    {item.label}
                  </span>
                  
                  {/* 悬停提示 - 收起状态 */}
                  {!sidebarOpen && (
                    <div 
                      className="absolute left-full ml-2 px-3 py-1.5 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg"
                      style={{ 
                        background: 'hsl(var(--surface-elevated))', 
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* 底部状态区域 */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {/* 收起时的状态点 */}
        {!sidebarOpen && (
          <div className="hidden lg:flex justify-center mb-2">
            <div className="h-2 w-2 rounded-full animate-pulse-soft" style={{ background: 'hsl(var(--success))' }} />
          </div>
        )}
        
        {/* 展开时的底部信息 */}
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-out ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full animate-pulse-soft" style={{ background: 'hsl(var(--success))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>系统运行中</span>
          </div>
          <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))', opacity: 0.6 }}>v1.0.0 Demo</p>
        </div>
      </div>
    </aside>
  )
}