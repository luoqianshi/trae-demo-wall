import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import './DashboardsPage.css'

const BoardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export default function DashboardsPage() {
  const { dashboards, loadDashboards } = useAppStore()

  useEffect(() => {
    loadDashboards()
  }, [loadDashboards])

  return (
    <div className="dashboards-page">
      <div className="dashboards-header">
        <div className="dashboards-title-row">
          <span className="dashboards-icon">
            <BoardIcon />
          </span>
          <div>
            <h1 className="dashboards-title">我的看板</h1>
            <p className="dashboards-subtitle">
              {dashboards.length > 0
                ? `共 ${dashboards.length} 个已保存的分析结果`
                : '完成分析后可保存结果到看板'}
            </p>
          </div>
        </div>
      </div>

      {dashboards.length === 0 ? (
        <div className="dashboards-empty">
          <div className="empty-icon">
            <BoardIcon />
          </div>
          <div className="empty-title">暂无保存的看板</div>
          <div className="empty-desc">完成分析后可在右栏保存结果</div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {dashboards.map((d) => (
            <div key={d.id} className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-icon">
                  <BoardIcon />
                </div>
                <div className="dashboard-card-title">{d.title}</div>
              </div>
              <div className="dashboard-card-footer">
                <span className="dashboard-card-date">
                  <ClockIcon />
                  {new Date(d.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
