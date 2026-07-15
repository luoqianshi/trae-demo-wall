import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from './store/appStore'
import type { ProgressEvent } from '../../types/shared'
import type { Dashboard } from '../../types/shared'
import Plotly from 'plotly.js-dist-min'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import './App.css'
import './pages/AnalyzePage.css'

import DataSourceSelector from './components/DataSourceSelector'
import DataPreview from './components/DataPreview'
import ChatPanel from './components/ChatPanel'
import AgentTimeline from './components/AgentTimeline'
import ChartView from './components/ChartView'
import ReportView from './components/ReportView'
import SessionList from './components/SessionList'
import DataSourceUpload from './components/DataSourceUpload'
import SettingsView from './components/SettingsView'

type View = 'chat' | 'dashboards' | 'settings'

// === 图标 ===
const Icons = {
  Logo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l4-8 5 16 4-12 5 8" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" opacity="0.3" />
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="currentColor" opacity="0.15" />
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

const DEFAULT_SESSION_WIDTH = 220

export default function App() {
  const [sessionWidth, setSessionWidth] = useState(() => {
    // 恢复上次保存的宽度
    try {
      const saved = localStorage.getItem('datapilot-session-width')
      return saved ? Number(saved) : DEFAULT_SESSION_WIDTH
    } catch {
      return DEFAULT_SESSION_WIDTH
    }
  })
  const [resizing, setResizing] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('datapilot-session-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const settings = useAppStore((s) => s.settings)
  const handleProgress = useAppStore((s) => s.handleProgress)
  const handleComplete = useAppStore((s) => s.handleComplete)
  const handleError = useAppStore((s) => s.handleError)
  const setApiPort = useAppStore((s) => s.setApiPort)

  // 应用主题到 body
  useEffect(() => {
    document.body.dataset.theme = settings.theme
    document.documentElement.style.setProperty('--color-accent', settings.accentColor)
  }, [settings.theme, settings.accentColor])

  // === 监听 API 端口 ===
  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.datapilot : undefined
    if (!api) return
    const unsub = api.onApiPort((port) => {
      setApiPort(port)
    })
    return () => unsub?.()
  }, [setApiPort])

  // === 注册 Agent IPC 事件监听器 ===
  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.datapilot : undefined
    if (!api) return

    const unsubProgress = api.agent.onProgress((event) => {
      handleProgress(event as ProgressEvent)
    })
    const unsubComplete = api.agent.onComplete((result) => {
      handleComplete(result as Parameters<typeof handleComplete>[0])
    })
    const unsubError = api.agent.onError((error) => {
      handleError(error)
    })

    return () => {
      unsubProgress?.()
      unsubComplete?.()
      unsubError?.()
    }
  }, [handleProgress, handleComplete, handleError])

  // === Session 侧栏拖拽缩放 ===
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)
    const startX = e.clientX
    const startWidth = sessionWidth

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      const newWidth = Math.max(160, Math.min(420, startWidth + delta))
      setSessionWidth(newWidth)
    }

    const onUp = () => {
      setResizing(false)
      localStorage.setItem('datapilot-session-width', String(sessionWidth))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('datapilot-session-collapsed', String(next))
  }

  return (
    <div className="ide-layout">
      {/* === 主内容区 === */}
      <div className="ide-main">
        {/* 会话列 — 可折叠，可拖拽缩放 */}
        <div className={`ide-sessions${collapsed ? ' collapsed' : ''}`} style={{ width: collapsed ? 32 : sessionWidth }}>
          {collapsed ? (
            <div className="ide-sessions-collapsed">
              <button
                className="ide-sessions-toggle"
                onClick={toggleCollapse}
                title="展开会话列"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <div className="ide-sessions-collapsed-nav">
                {[
                  { key: 'chat', icon: <Icons.Chat />, label: '对话' },
                  { key: 'dashboards', icon: <Icons.Dashboard />, label: '看板' },
                  { key: 'settings', icon: <Icons.Settings />, label: '设置' }
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`ide-collapsed-nav-item${view === item.key ? ' active' : ''}`}
                    onClick={() => setView(item.key)}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <SessionList collapsed={collapsed} onToggleCollapse={toggleCollapse} />
              <SessionNav view={view} setView={setView} />
            </>
          )}
          {!collapsed && (
            <div
              className={`ide-sessions-resize-handle${resizing ? ' active' : ''}`}
              onMouseDown={handleResizeStart}
            />
          )}
        </div>

        {/* 内容区 — 根据视图切换 */}
        {view === 'chat' && <ChatView />}
        {view === 'dashboards' && <DashboardsView />}
        {view === 'settings' && <SettingsView />}
      </div>

      {/* === 状态栏 === */}
      <StatusBar />

      {/* === 上传弹窗 === */}
      <DataSourceUpload />
    </div>
  )
}

// === 会话列底部导航 ===
function SessionNav({ view, setView }: { view: View; setView: (v: View) => void }) {
  const navItems: { key: View; icon: React.ReactNode; label: string }[] = [
    { key: 'chat', icon: <Icons.Chat />, label: '对话' },
    { key: 'dashboards', icon: <Icons.Dashboard />, label: '看板' },
    { key: 'settings', icon: <Icons.Settings />, label: '设置' }
  ]
  return (
    <div className="session-nav">
      {navItems.map((item) => (
        <button
          key={item.key}
          className={`session-nav-item${view === item.key ? ' active' : ''}`}
          onClick={() => setView(item.key)}
          title={item.label}
        >
          <span className="session-nav-icon">{item.icon}</span>
          <span className="session-nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

// === 对话视图（主工作区） ===
function ChatView() {
  const currentSessionId = useAppStore((s) => s.currentSessionId)
  const agentSteps = useAppStore((s) => s.agentSteps)
  const setShowUploadModal = useAppStore((s) => s.setShowUploadModal)
  const [rightTab, setRightTab] = useState<'chart' | 'report' | 'dashboard'>('chart')
  const [rightWidth, setRightWidth] = useState(360)
  const resizingRef = useState<{ startX: number; startW: number } | null>(null)[1]
  const dashboardHTML = useAppStore((s) => s.dashboardHTML)
  const setDashboardHTML = useAppStore((s) => s.setDashboardHTML)
  const apiPort = useAppStore((s) => s.apiPort)

  const hasContent = (agentSteps || []).length > 0

  // 拖拽调整右侧面板宽度
  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidth
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      const newW = Math.max(240, Math.min(600, startW + delta))
      setRightWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <>
      {/* 数据源侧边栏 */}
      <div className="ide-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">数据源</span>
          <button className="sidebar-upload-btn" onClick={() => setShowUploadModal(true)} title="上传数据">
            <Icons.Upload />
          </button>
        </div>
        <div className="sidebar-body">
          <DataSourceSelector embedded />
          <DataPreview embedded />
        </div>
      </div>

      {/* 中央工作区 */}
      <div className="ide-center" style={{ flex: `1 1 ${rightWidth > 400 ? 'auto' : '0'}` }}>
        <div className="center-tabs">
          <div className="center-tab active">
            <Icons.Chat />
            Agent 对话
          </div>
        </div>
        <div className="center-body">
          {!hasContent && !currentSessionId ? (
            <WelcomeScreen />
          ) : (
            <>
              <div className="chat-timeline-area">
                <AgentTimeline embedded />
              </div>
              <ChatPanel embedded />
            </>
          )}
        </div>
      </div>

      {/* 拖拽手柄 */}
      <div className="resize-handle" onMouseDown={onResizeStart}>
        <div className="resize-handle-line" />
      </div>

      {/* 右侧面板 */}
      <div className="ide-right" style={{ width: rightWidth, minWidth: rightWidth, maxWidth: rightWidth }}>
        <div className="right-tabs">
          <button className={`right-tab${rightTab === 'chart' ? ' active' : ''}`} onClick={() => setRightTab('chart')}>
            图表
          </button>
          <button className={`right-tab${rightTab === 'report' ? ' active' : ''}`} onClick={() => setRightTab('report')}>
            报告
          </button>
          {dashboardHTML && (
            <button className={`right-tab${rightTab === 'dashboard' ? ' active' : ''}`} onClick={() => setRightTab('dashboard')}>
              看板
            </button>
          )}
        </div>
        <div className="right-body">
          {rightTab === 'chart' && <ChartView embedded />}
          {rightTab === 'report' && <ReportView embedded />}
          {rightTab === 'dashboard' && dashboardHTML && (
            <iframe
              srcDoc={dashboardHTML}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="数据看板"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
          {!dashboardHTML && hasContent && (
            <div className="empty-dashboard-hint">
              <p>看板尚未生成</p>
              <p className="hint-sub">Agent 完成分析后会自动生成看板</p>
              {apiPort && (
                <button
                  className="load-test-btn"
                  onClick={async () => {
                    try {
                      const res = await fetch(`http://127.0.0.1:${apiPort}/api/test-dashboard`)
                      if (res.ok) {
                        const html = await res.text()
                        if (html) {
                          setDashboardHTML(html)
                          setRightTab('dashboard')
                        }
                      }
                    } catch (e) {
                      console.error('加载测试看板失败:', e)
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  加载测试看板
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// === 欢迎屏幕（无会话时的背景） ===
function WelcomeScreen() {
  const createSession = useAppStore((s) => s.createSession)
  const setShowUploadModal = useAppStore((s) => s.setShowUploadModal)
  const loadSamples = useAppStore((s) => s.loadSamples)
  const datasets = useAppStore((s) => s.datasets)

  useEffect(() => {
    if (datasets.length === 0) loadSamples()
  }, [datasets.length, loadSamples])

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <Icons.Sparkle />
        </div>
        <h1 className="welcome-title">DataPilot</h1>
        <p className="welcome-subtitle">AI 驱动的数据分析 Agent</p>
        <p className="welcome-desc">
          上传数据或选择内置样例，用自然语言描述你的分析目标，<br />
          Agent 将自动完成数据探索、统计分析、可视化和报告生成。
        </p>
        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={() => createSession()}>
            <Icons.Chat />
            开始新对话
          </button>
          <button className="welcome-btn" onClick={() => setShowUploadModal(true)}>
            <Icons.Upload />
            上传数据
          </button>
        </div>
        <div className="welcome-features">
          <div className="welcome-feature">
            <span className="welcome-feature-icon">📊</span>
            <span>自动可视化</span>
          </div>
          <div className="welcome-feature">
            <span className="welcome-feature-icon">🔍</span>
            <span>深度分析</span>
          </div>
          <div className="welcome-feature">
            <span className="welcome-feature-icon">📄</span>
            <span>报告生成</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// === 看板视图 ===
function DashboardsView() {
  const dashboards = useAppStore((s) => s.dashboards)
  const loadDashboards = useAppStore((s) => s.loadDashboards)
  const deleteDashboard = useAppStore((s) => s.deleteDashboard)
  const setView = useAppStore((s) => s.setView)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadDashboards()
  }, [loadDashboards])

  const handleViewDashboard = async (id: string) => {
    setSelectedId(id)
    setLoading(true)
    try {
      const api = window.datapilot
      if (!api) {
        console.error('API not available')
        return
      }
      const db = await api.storage.getDashboard(id)
      if (db) {
        setDashboard(db)
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteDashboard(id)
      setConfirmDeleteId(null)
      if (selectedId === id) {
        setSelectedId(null)
        setDashboard(null)
      }
    } else {
      setConfirmDeleteId(id)
    }
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDeleteId(null)
  }

  const handleBack = () => {
    setSelectedId(null)
    setDashboard(null)
  }

  // 看板详情视图
  if (selectedId && dashboard) {
    return <DashboardDetailView dashboard={dashboard} onBack={handleBack} onDelete={() => handleDelete(selectedId)} />
  }

  if (loading) {
    return (
      <div className="dashboards-view">
        <div className="dashboards-loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="dashboards-view">
      <div className="dashboards-header">
        <h2>我的看板</h2>
        <span className="dashboards-count">{dashboards.length} 个已保存</span>
      </div>
      <div className="dashboards-grid">
        {dashboards.length === 0 ? (
          <div className="dashboards-empty">
            <div className="dashboards-empty-icon">
              <Icons.Dashboard />
            </div>
            <p>暂无保存的看板</p>
            <p className="dashboards-empty-hint">
              完成分析后点击"保存到看板"即可在此查看
              <br />
              <button className="back-to-chat-btn" onClick={() => setView('chat')}>
                返回分析
              </button>
            </p>
          </div>
        ) : (
          dashboards.map((d) => (
            <div
              key={d.id}
              className={`dashboard-card${confirmDeleteId === d.id ? ' confirm-delete' : ''}`}
              onClick={() => {
                if (confirmDeleteId === d.id) return
                handleViewDashboard(d.id)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleViewDashboard(d.id) }}
            >
              <div className="dashboard-card-title">{d.title}</div>
              <div className="dashboard-card-date">{new Date(d.createdAt).toLocaleString('zh-CN')}</div>
              <div className="dashboard-card-hint">点击查看详情</div>
              {confirmDeleteId === d.id ? (
                <div className="dashboard-card-delete-confirm">
                  <span className="delete-confirm-text">确认删除？</span>
                  <button className="delete-confirm-btn yes" onClick={(e) => { e.stopPropagation(); handleDelete(d.id) }}>删除</button>
                  <button className="delete-confirm-btn no" onClick={handleCancelDelete}>取消</button>
                </div>
              ) : (
                <button
                  className="dashboard-card-delete"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(d.id) }}
                  title="删除看板"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// === 看板详情视图 ===
function DashboardDetailView({ dashboard, onBack, onDelete }: { dashboard: Dashboard; onBack: () => void; onDelete: () => void }) {
  const charts = dashboard.charts as Array<{ title: string; figure: object; reasoning: string }> || []
  const report = dashboard.report ? (() => {
    try { return JSON.parse(dashboard.report) } catch { return null }
  })() : null
  const dashboardHTML = dashboard.dashboardHTML || null

  // 如果有看板 HTML，优先展示
  if (dashboardHTML) {
    return (
      <div className="dashboard-detail-view">
        <div className="dashboard-detail-header">
          <button className="back-btn" onClick={onBack}>
            <Icons.ChevronLeft />
            返回
          </button>
          <h2>{dashboard.title}</h2>
          <span className="dashboards-count">{new Date(dashboard.createdAt).toLocaleString('zh-CN')}</span>
          <button className="dashboard-delete-btn" onClick={onDelete} title="删除看板">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            删除
          </button>
        </div>
        <div className="dashboard-detail-body">
          <iframe
            srcDoc={dashboardHTML}
            style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: '8px' }}
            title={dashboard.title}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    )
  }

  // 渲染图表
  useEffect(() => {
    const container = document.getElementById('dashboard-charts')
    if (!container || !charts || charts.length === 0) return
    container.innerHTML = ''
    for (const chart of charts) {
      const card = document.createElement('div')
      card.className = 'chart-card'
      const title = document.createElement('div')
      title.className = 'chart-title'
      title.textContent = chart.title
      card.appendChild(title)
      const plotDiv = document.createElement('div')
      card.appendChild(plotDiv)
      container.appendChild(card)
      try {
        Plotly.newPlot(plotDiv, chart.figure.data || [], chart.figure.layout || {}, {
          responsive: true,
          displayModeBar: false,
        })
      } catch (e) {
        console.error('Failed to render chart:', e)
      }
    }
    return () => {
      if (container) container.innerHTML = ''
    }
  }, [charts])

  // 渲染报告
  const reportHtml = useMemo(() => {
    if (!report) return ''
    const parts = (report.sections as Array<{ heading: string; content: string }> || [])
      .map((s) => `## ${s.heading}\n\n${s.content}`)
    const md = `# ${report.title}\n\n${parts.join('\n\n')}`
    return DOMPurify.sanitize(marked(md, { async: false }) as string)
  }, [report])

  return (
    <div className="dashboard-detail-view">
      <div className="dashboard-detail-header">
        <button className="back-btn" onClick={onBack}>
          <Icons.ChevronLeft />
          返回
        </button>
        <h2>{dashboard.title}</h2>
        <span className="dashboards-count">{new Date(dashboard.createdAt).toLocaleString('zh-CN')}</span>
        <button className="dashboard-delete-btn" onClick={onDelete} title="删除看板">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          删除
        </button>
      </div>
      <div className="dashboard-detail-body">
        {charts && charts.length > 0 && (
          <div className="dashboard-detail-section">
            <h3 className="dashboard-detail-section-title">图表</h3>
            <div id="dashboard-charts" className="chart-view" />
          </div>
        )}
        {report && (
          <div className="dashboard-detail-section">
            <h3 className="dashboard-detail-section-title">报告</h3>
            <div className="report-content" dangerouslySetInnerHTML={{ __html: reportHtml }} />
          </div>
        )}
        {(!charts || charts.length === 0) && !report && (
          <div className="dashboards-empty">
            <p>该看板暂无内容</p>
          </div>
        )}
      </div>
    </div>
  )
}

// === 状态栏 ===
function StatusBar() {
  const agentRunning = useAppStore((s) => s.agentRunning)
  const runningSessionId = useAppStore((s) => s.runningSessionId)
  const currentSessionId = useAppStore((s) => s.currentSessionId)
  const agentSteps = useAppStore((s) => s.agentSteps)
  const charts = useAppStore((s) => s.charts)
  const settings = useAppStore((s) => s.settings)

  const isCurrentRunning = agentRunning && currentSessionId === runningSessionId
  const statusText = isCurrentRunning
    ? '运行中'
    : agentRunning
      ? '就绪（另一会话运行中）'
      : '就绪'

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`status-indicator${isCurrentRunning ? ' running' : ''}`}>
          {statusText}
        </span>
        <span className="status-sep">|</span>
        <span className="status-item">步骤: {(agentSteps || []).length}</span>
        <span className="status-sep">|</span>
        <span className="status-item">图表: {(charts || []).length}</span>
      </div>
      <div className="status-right">
        <span className="status-item">
          {settings.apiConfigs.find((c) => c.id === settings.activeApiConfigId)?.name || '未配置模型'}
        </span>
        <span className="status-sep">|</span>
        <span className="status-item">DataPilot v1.0</span>
      </div>
    </div>
  )
}
