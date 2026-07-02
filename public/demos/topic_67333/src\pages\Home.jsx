import { useContext } from 'react'
import { AppContext } from '../App'
import { formatDate } from '../utils/storage'
import { getLearningSuggestions } from '../utils/aiMock'
import './Home.css'

export default function Home() {
  const { wrongQuestions, reviewTasks, navigateTo } = useContext(AppContext)

  const todayTasks = reviewTasks.filter(t => {
    if (t.status === '已完成') return false
    const today = new Date().toISOString().split('T')[0]
    return t.reviewDate === today
  })

  const masteredCount = wrongQuestions.filter(q => q.status === '已掌握').length
  const totalCount = wrongQuestions.length
  const masteryRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  const recentQuestions = [...wrongQuestions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const { suggestion, stats } = getLearningSuggestions(wrongQuestions)

  const weakPoints = stats?.weakPoints?.slice(0, 3) || []

  const getStatusClass = (status) => {
    const map = {
      '未诊断': 'status-unconfirmed',
      '已诊断': 'status-diagnosed',
      '引导中': 'status-guiding',
      '变式训练中': 'status-training',
      '待复测': 'status-review',
      '已掌握': 'status-mastered'
    }
    return map[status] || 'status-unconfirmed'
  }

  return (
    <div className="home fade-in">
      {/* Hero Welcome */}
      <div className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">高中生的 AI 学习陪跑教练</h1>
          <p className="home-hero-subtitle">不是让 AI 替学生学习，而是让 AI 陪学生真正学会</p>
          <div className="home-hero-tip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>{suggestion || '每天坚持录入错题，系统会帮你规划复习节奏'}</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="home-stats">
        <div className="stat-card card fade-in stagger-1">
          <div className="stat-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{todayTasks.length}</div>
          <div className="stat-label">今日待复习</div>
        </div>
        <div className="stat-card card fade-in stagger-2">
          <div className="stat-card-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">总错题数</div>
        </div>
        <div className="stat-card card fade-in stagger-3">
          <div className="stat-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{masteredCount}</div>
          <div className="stat-label">已掌握错题</div>
        </div>
        <div className="stat-card card fade-in stagger-4">
          <div className="stat-card-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{masteryRate}%</div>
          <div className="stat-label">当前掌握率</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-section">
        <h2 className="home-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          快捷入口
        </h2>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => navigateTo('entry')}>
            <div className="quick-action-icon primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div className="quick-action-text">
              <h4>拍照上传错题</h4>
              <p>AI 自动识别题目内容</p>
            </div>
          </button>
          <button className="quick-action-btn" onClick={() => navigateTo('entry')}>
            <div className="quick-action-icon success">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div className="quick-action-text">
              <h4>手动录入错题</h4>
              <p>输入题目详细信息</p>
            </div>
          </button>
          <button className="quick-action-btn" onClick={() => navigateTo('list')}>
            <div className="quick-action-icon warning">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/></svg>
            </div>
            <div className="quick-action-text">
              <h4>错题生命线</h4>
              <p>查看所有错题状态</p>
            </div>
          </button>
          <button className="quick-action-btn" onClick={() => navigateTo('review')}>
            <div className="quick-action-icon danger">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="quick-action-text">
              <h4>查看今日复习计划</h4>
              <p>系统化复习，告别遗忘</p>
            </div>
          </button>
          <button className="quick-action-btn" onClick={() => navigateTo('profile')}>
            <div className="quick-action-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="quick-action-text">
              <h4>查看学习画像</h4>
              <p>了解你的学习状况</p>
            </div>
          </button>
        </div>
      </div>

      {/* Today's Review */}
      {todayTasks.length > 0 && (
        <div className="home-section">
          <h2 className="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            今日复习
          </h2>
          <div className="today-review-list">
            {todayTasks.slice(0, 3).map(task => {
              const question = wrongQuestions.find(q => q.id === task.wrongQuestionId)
              return (
                <div key={task.id} className="today-review-item card">
                  <div className="review-task-type">{task.taskType}</div>
                  <div className="review-task-knowledge">
                    {question?.knowledgePoint || '未知知识点'}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigateTo('detail', question?.id)}
                  >
                    去复习
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Questions */}
      {recentQuestions.length > 0 && (
        <div className="home-section">
          <h2 className="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            最近错题
          </h2>
          <div className="question-list">
            {recentQuestions.map(q => (
              <div
                key={q.id}
                className="question-card"
                onClick={() => navigateTo('detail', q.id)}
              >
                <div className="question-card-header">
                  <span className="question-card-subject">{q.subject}</span>
                  <span className={`question-card-status ${getStatusClass(q.status)}`}>
                    {q.status}
                  </span>
                </div>
                <div className="question-card-knowledge">{q.knowledgePoint}</div>
                <div className="question-card-preview">{q.questionText}</div>
                <div className="question-card-footer">
                  <div className="question-card-meta">
                    <span>{formatDate(q.createdAt)}</span>
                  </div>
                  <div className="question-card-progress">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${q.progress === 100 ? 'success' : ''}`}
                        style={{ width: `${q.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Points */}
      {weakPoints.length > 0 && (
        <div className="home-section">
          <h2 className="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            高频薄弱点
          </h2>
          <div className="weak-points-list">
            {weakPoints.map(([point, count], index) => (
              <div key={point} className="weak-point-item card">
                <span className="weak-point-rank">{index + 1}</span>
                <span className="weak-point-name">{point}</span>
                <span className="weak-point-count">{count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      {suggestion && (
        <div className="home-suggestion-card">
          <div className="suggestion-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <div className="suggestion-content">
            <h3>学习建议</h3>
            <p>{suggestion}</p>
          </div>
        </div>
      )}

      {totalCount === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <h3>还没有错题记录</h3>
          <p>点击上方「录入新错题」开始你的学习之旅</p>
        </div>
      )}
    </div>
  )
}
