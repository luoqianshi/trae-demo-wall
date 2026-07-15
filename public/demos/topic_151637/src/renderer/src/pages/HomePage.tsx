import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import './HomePage.css'

const Icon = {
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 5-6" />
    </svg>
  ),
  Board: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" />
    </svg>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { datasets, loadSamples } = useAppStore()

  useEffect(() => {
    if (datasets.length === 0) loadSamples()
  }, [datasets.length, loadSamples])

  return (
    <div className="home-page">
      {/* === Hero 区 === */}
      <section className="home-hero">
        <div className="hero-badge">
          <Icon.Sparkle />
          <span>AI 驱动的对话式数据分析平台</span>
        </div>
        <h1 className="home-title">
          Data<span className="title-accent">Pilot</span>
        </h1>
        <p className="home-subtitle">数据领航员</p>
        <p className="home-motto">
          真正的创新源于简洁与美感的平衡。<br />
          专注于呈现最本质的价值，去除所有不必要的干扰。
        </p>
        <button
          className="home-cta"
          onClick={() => navigate('/analyze')}
        >
          <span>开始分析</span>
          <Icon.ArrowRight />
        </button>
      </section>

      {/* === 功能卡片 === */}
      <section className="home-cards">
        <button className="home-card card-primary" onClick={() => navigate('/analyze')}>
          <div className="card-icon-wrap accent">
            <Icon.Chart />
          </div>
          <div className="card-number">01</div>
          <div className="card-title">开始分析</div>
          <div className="card-desc">
            选择数据源，描述分析目标，让 Agent 自主规划并执行完整分析流程。
          </div>
          <div className="card-arrow">
            <Icon.ArrowRight />
          </div>
        </button>

        <button className="home-card" onClick={() => navigate('/dashboards')}>
          <div className="card-icon-wrap teal">
            <Icon.Board />
          </div>
          <div className="card-number">02</div>
          <div className="card-title">我的看板</div>
          <div className="card-desc">
            查看已保存的分析结果、图表和报告，随时回顾历史洞察。
          </div>
          <div className="card-arrow">
            <Icon.ArrowRight />
          </div>
        </button>

        <div className="home-card static">
          <div className="card-icon-wrap stone">
            <Icon.Database />
          </div>
          <div className="card-number">03</div>
          <div className="card-title">数据源</div>
          <div className="card-desc">
            {datasets.length > 0
              ? `${datasets.length} 个样例数据集可用`
              : '样例数据加载中…'}
          </div>
          <div className="card-stats">
            {datasets.slice(0, 4).map((d) => (
              <span key={d.id} className="stat-tag">{d.name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* === 特性栏 === */}
      <section className="home-features">
        <div className="feature-item">
          <div className="feature-num">30s</div>
          <div className="feature-label">秒级响应</div>
        </div>
        <div className="feature-divider" />
        <div className="feature-item">
          <div className="feature-num">5</div>
          <div className="feature-label">内置数据集</div>
        </div>
        <div className="feature-divider" />
        <div className="feature-item">
          <div className="feature-num">8</div>
          <div className="feature-label">图表类型</div>
        </div>
        <div className="feature-divider" />
        <div className="feature-item">
          <div className="feature-num">∞</div>
          <div className="feature-label">分析可能</div>
        </div>
      </section>
    </div>
  )
}
