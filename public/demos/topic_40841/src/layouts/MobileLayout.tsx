import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MapPin, GraduationCap, Trophy, HeartHandshake, User } from 'lucide-react'
import PhoneFrame from '@/components/PhoneFrame'

const tabs = [
  { path: '/app', label: '附近', icon: MapPin },
  { path: '/app/cert', label: '考证', icon: GraduationCap },
  { path: '/app/contest', label: '赛事', icon: Trophy },
  { path: '/app/mutual', label: '互助', icon: HeartHandshake },
  { path: '/app/mine', label: '我的', icon: User },
]

const hideTabPaths = ['/app/detail', '/app/upload', '/app/guide', '/app/favorites', '/app/my-uploads']

export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  // 所有 Tab 页共用一个滚动容器，切换路由时回到顶部
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [location.pathname])

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app'
    return location.pathname.startsWith(path)
  }

  const showTabBar = !hideTabPaths.some(p => location.pathname.startsWith(p))

  return (
    <PhoneFrame>
      <div className={`mobile-app-shell${showTabBar ? '' : ' mobile-app-shell--no-tab'}`}>
        <div ref={scrollRef} className="mobile-app-content">
          <Outlet />
        </div>

        {showTabBar && (
          <nav className="mobile-tab-bar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = isActive(tab.path)
              return (
                <button
                  type="button"
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="mobile-tab-item"
                >
                  <span className={`mobile-tab-icon-wrap ${active ? 'mobile-tab-icon-wrap--active' : ''}`}>
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                      color={active ? '#FFFFFF' : '#A1A1AA'}
                    />
                  </span>
                  <span className={`mobile-tab-label ${active ? 'mobile-tab-label--active' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </PhoneFrame>
  )
}
