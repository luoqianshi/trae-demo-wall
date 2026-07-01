import './index.css'
import { useEffect, useState } from 'react'
import { MobileLayout } from './components/MobileLayout'
import {
  DesktopLayout,
  getLayoutMode,
  resolveLayoutMode,
  type ResolvedLayout,
} from './components/DesktopLayout'
import { MemoryConfirmModal } from './components/MemoryConfirmModal'
import { MemoryToast } from './components/MemoryToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { ErrorToast } from './components/ErrorToast'
import { ReminderNotification } from './components/ReminderNotification'
import { CinematicOpening } from './components/CinematicOpening'
import { GuideTour } from './components/GuideTour'
import { useConversationStore } from './stores/useConversationStore'
import { useDataStore } from './stores/useDataStore'
import { initDemoGuard, isDemoMode } from './lib/demoGuard'

function App() {
  const loadConversations = useConversationStore((s) => s.loadConversations)
  const loadPersons = useDataStore((s) => s.loadPersons)
  const loadMemories = useDataStore((s) => s.loadMemories)
  const loadDiaries = useDataStore((s) => s.loadDiaries)
  const loadPendingMemories = useDataStore((s) => s.loadPendingMemories)

  // 布局模式：根据 localStorage 配置和窗口宽度决定使用移动端还是桌面端
  const [resolvedLayout, setResolvedLayout] = useState<ResolvedLayout>(() =>
    resolveLayoutMode(getLayoutMode()),
  )

  useEffect(() => {
    loadConversations()
    loadPersons()
    loadMemories()
    loadDiaries()
    loadPendingMemories()
  }, [loadConversations, loadPersons, loadMemories, loadDiaries, loadPendingMemories])

  // Demo Guard: 演示模式下初始化数据保护
  useEffect(() => {
    initDemoGuard()
  }, [])

  // 监听布局模式变化（来自设置页）和窗口尺寸变化（auto 模式下）
  useEffect(() => {
    const updateLayout = () => {
      setResolvedLayout((prev) => {
        const next = resolveLayoutMode(getLayoutMode())
        return prev !== next ? next : prev
      })
    }

    window.addEventListener('hengzhou:layout-mode-change', updateLayout)
    window.addEventListener('resize', updateLayout)

    return () => {
      window.removeEventListener('hengzhou:layout-mode-change', updateLayout)
      window.removeEventListener('resize', updateLayout)
    }
  }, [])

  // P0-3: 电影开场动画 — 仅首次访问时展示
  const [showOpening, setShowOpening] = useState(() => {
    return !sessionStorage.getItem('hengzhou-opening-played')
  })

  const handleOpeningComplete = () => {
    sessionStorage.setItem('hengzhou-opening-played', '1')
    setShowOpening(false)
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {showOpening && <CinematicOpening onComplete={handleOpeningComplete} />}
        <div className="h-dvh overflow-hidden bg-canvas flex flex-col">
          {isDemoMode() && <DemoBadge />}
          <div className="flex-1 min-h-0 overflow-hidden">
            {resolvedLayout === 'desktop' ? <DesktopLayout /> : <MobileLayout />}
          </div>
          <ReminderNotification />
          <MemoryConfirmModal />
          <MemoryToast />
          <ErrorToast />
          <GuideTour />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function DemoBadge() {
  return (
    <div
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium shadow-sm"
      style={{
        background: 'color-mix(in srgb, var(--color-zen-sage, #7A9E7E) 12%, var(--color-surface, #FFFFFF) 88%)',
        border: '1px solid color-mix(in srgb, var(--color-zen-sage, #7A9E7E) 25%, transparent)',
        color: 'var(--color-zen-sage, #7A9E7E)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-zen-sage animate-pulse" />
      演示模式 · 数据受保护
    </div>
  )
}

export default App
