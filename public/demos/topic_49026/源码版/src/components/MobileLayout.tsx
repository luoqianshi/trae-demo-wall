import { useUIStore } from '../stores/useUIStore'
import { BottomNav } from './BottomNav'
import { MainStage } from './MainStage'
import { RemindersPage } from './RemindersPage'
import { MemoryPage } from './MemoryPage'
import { RelationsPage } from './RelationsPage'
import { SettingsPage } from './SettingsPage'
import { DiaryPage } from './DiaryPage'
import { ErrorBoundary } from './ErrorBoundary'

export function MobileLayout() {
  const activeNav = useUIStore((s) => s.activeNav)

  const renderPage = () => {
    switch (activeNav) {
      case '对话':
        return (
          <ErrorBoundary>
            <MainStage />
          </ErrorBoundary>
        )
      case '提醒':
        return (
          <ErrorBoundary>
            <RemindersPage />
          </ErrorBoundary>
        )
      case '记忆':
        return (
          <ErrorBoundary>
            <MemoryPage />
          </ErrorBoundary>
        )
      case '关系':
        return (
          <ErrorBoundary>
            <RelationsPage />
          </ErrorBoundary>
        )
      case '日记':
        return (
          <ErrorBoundary>
            <DiaryPage />
          </ErrorBoundary>
        )
      case '设置':
        return (
          <ErrorBoundary>
            <SettingsPage />
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary>
            <MainStage />
          </ErrorBoundary>
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* 主内容区 - 滚动容器 */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* 手机布局居中，最大宽度 480px，模拟手机视口 */}
        <div className="mx-auto h-full" style={{ maxWidth: '480px' }}>
          <div key={activeNav} className="page-enter">
            {renderPage()}
          </div>
        </div>
      </main>

      {/* 底部导航 - fixed 定位 */}
      <BottomNav />
    </div>
  )
}
