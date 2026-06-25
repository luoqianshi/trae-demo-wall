import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Menu, Moon, Sun, MessageCircle } from 'lucide-react'
import { fetchBackgrounds } from '../../lib/api'
import { ErrorBoundary } from '../ui/error-boundary'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [bgURL, setBgURL] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const isLocalChat = location.pathname === '/local-chat'

  // 背景获取
  useEffect(() => {
    fetchBackgrounds().then(data => {
      if (data.success && data.selected) {
        const bg = data.backgrounds?.find(b => b.id === data.selected)
        if (bg) setBgURL(bg.url)
        else setBgURL('')
      } else {
        setBgURL('')
      }
    }).catch(() => {})
  }, [])

  // 监听背景变更事件（背景页选择后实时生效）
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ url: string }>
      setBgURL(ce.detail.url)
    }
    window.addEventListener('bg-change', handler)
    return () => window.removeEventListener('bg-change', handler)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden aurora-bg">
      {/* 全局背景图层 - 最下层 */}
      {bgURL && (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
          style={{ backgroundImage: `url(${bgURL})`, zIndex: -20 }}
        />
      )}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-200 ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'}`}>
        <header className="glass sticky top-0 z-40 flex h-12 shrink-0 items-center gap-3 px-4 lg:px-5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="打开菜单"
            className="btn-ghost inline-flex items-center justify-center rounded-md p-1.5 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            className="btn-ghost hidden items-center justify-center rounded-md p-1.5 lg:flex"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
              className="btn-ghost inline-flex items-center justify-center rounded-md p-1.5"
            >
              {isDark ? (
                <Sun className="h-4 w-4" style={{ color: '#fbbf24' }} aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
              )}
            </button>

            <div className="flex items-center gap-2 pl-2 ml-1" style={{ borderLeft: '1px solid hsl(var(--border))' }}>
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-xs font-semibold leading-tight">语瞳 Demo</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--text-muted))' }}>TRAE 创造力大赛</p>
              </div>
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
              >
                <span className="text-xs font-bold text-white">Y</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto" id="main-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* 本地聊天浮动入口按钮 */}
      {!isLocalChat && (
        <button
          onClick={() => navigate('/local-chat')}
          title="打开本地聊天室"
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            boxShadow: '0 4px 24px hsl(var(--primary) / 0.35)',
          }}
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5 text-white" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white animate-pulse"
              style={{ background: 'hsl(142, 76%, 45%)' }} />
          </div>
          <span className="text-sm font-semibold text-white hidden sm:inline">本地聊天</span>
        </button>
      )}
    </div>
  )
}
