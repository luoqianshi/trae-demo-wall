import { useContext } from 'react'
import { AppContext } from '../App'
import { getLearningSuggestions } from '../utils/aiMock'
import './LearningProfile.css'

export default function LearningProfile() {
  const { wrongQuestions, reviewTasks } = useContext(AppContext)

  const totalCount = wrongQuestions.length
  const masteredCount = wrongQuestions.filter(q => q.status === '已掌握').length
  const masteryRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  const statusCounts = {
    '未诊断': wrongQuestions.filter(q => q.status === '未诊断').length,
    '已诊断': wrongQuestions.filter(q => q.status === '已诊断').length,
    '引导中': wrongQuestions.filter(q => q.status === '引导中').length,
    '变式训练中': wrongQuestions.filter(q => q.status === '变式训练中').length,
    '待复测': wrongQuestions.filter(q => q.status === '待复测').length,
    '已掌握': masteredCount
  }

  const subjectCounts = {}
  wrongQuestions.forEach(q => {
    subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1
  })

  const knowledgePointCounts = {}
  wrongQuestions.forEach(q => {
    if (q.knowledgePoint) {
      knowledgePointCounts[q.knowledgePoint] = (knowledgePointCounts[q.knowledgePoint] || 0) + 1
    }
  })

  const topKnowledgePoints = Object.entries(knowledgePointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const causeCounts = {}
  wrongQuestions.forEach(q => {
    if (q.diagnosis?.causeType) {
      causeCounts[q.diagnosis.causeType] = (causeCounts[q.diagnosis.causeType] || 0) + 1
    }
  })

  const topCauses = Object.entries(causeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const todayTasks = reviewTasks.filter(t => {
    if (t.status === '已完成') return false
    const today = new Date().toISOString().split('T')[0]
    return t.reviewDate === today
  })

  const { suggestion, primaryIssue } = getLearningSuggestions(wrongQuestions)

  const maxSubjectCount = Math.max(...Object.values(subjectCounts), 1)
  const maxKPCount = Math.max(...Object.values(knowledgePointCounts), 1)
  const maxCauseCount = Math.max(...Object.values(causeCounts), 1)

  return (
    <div className="profile-page fade-in">
      <div className="page-header">
        <h1 className="page-title">学习画像</h1>
        <p className="page-subtitle">了解你的学习状况，发现提升空间</p>
      </div>

      <div className="profile-overview">
        <div className="profile-stat-card main">
          <div className="stat-value">{masteryRate}%</div>
          <div className="stat-label">总体掌握率</div>
          <div className="stat-detail">
            {masteredCount} / {totalCount} 题已掌握
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">总错题数</div>
        </div>
        <div className="profile-stat-card">
          <div className="stat-value">{todayTasks.length}</div>
          <div className="stat-label">今日待复习</div>
        </div>
        <div className="profile-stat-card">
          <div className="stat-value">{Object.keys(subjectCounts).length}</div>
          <div className="stat-label">涉及科目</div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h3 className="profile-card-title">📊 各科错题分布</h3>
          <div className="profile-chart">
            {Object.entries(subjectCounts).map(([subject, count]) => (
              <div key={subject} className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ height: `${(count / maxSubjectCount) * 100}%` }}
                  title={`${subject}: ${count}题`}
                />
                <span className="chart-label">{subject}</span>
                <span className="chart-value">{count}</span>
              </div>
            ))}
            {Object.keys(subjectCounts).length === 0 && (
              <div className="chart-empty">暂无数据</div>
            )}
          </div>
        </div>

        <div className="profile-card">
          <h3 className="profile-card-title">📈 状态分布</h3>
          <div className="status-distribution">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="status-row">
                <span className={`status-dot ${status}`} />
                <span className="status-name">{status}</span>
                <div className="status-bar-container">
                  <div
                    className="status-bar"
                    style={{ width: `${totalCount > 0 ? (count / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="status-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h3 className="profile-card-title">📌 高频薄弱知识点</h3>
          {topKnowledgePoints.length > 0 ? (
            <div className="weak-points">
              {topKnowledgePoints.map(([kp, count], index) => (
                <div key={kp} className="weak-point">
                  <span className="weak-rank">{index + 1}</span>
                  <span className="weak-name">{kp}</span>
                  <div className="weak-bar-container">
                    <div
                      className="weak-bar"
                      style={{ width: `${(count / maxKPCount) * 100}%` }}
                    />
                  </div>
                  <span className="weak-count">{count}次</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">完成 AI 诊断后可见</p>
          )}
        </div>

        <div className="profile-card">
          <h3 className="profile-card-title">🎯 常见错因分析</h3>
          {topCauses.length > 0 ? (
            <div className="weak-points">
              {topCauses.map(([cause, count], index) => (
                <div key={cause} className="weak-point">
                  <span className="weak-rank danger">{index + 1}</span>
                  <span className="weak-name">{cause}</span>
                  <div className="weak-bar-container">
                    <div
                      className="weak-bar danger"
                      style={{ width: `${(count / maxCauseCount) * 100}%` }}
                    />
                  </div>
                  <span className="weak-count">{count}次</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">完成 AI 诊断后可见</p>
          )}
        </div>
      </div>

      {suggestion && (
        <div className="profile-suggestion">
          <h3>
            {primaryIssue ? '💡 学习建议' : '💡 开始学习'}
          </h3>
          <p>{suggestion}</p>
        </div>
      )}

      <div className="profile-card">
        <h3 className="profile-card-title">📅 最近7天趋势</h3>
        <div className="trend-chart">
          {[...Array(7)].map((_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const dateStr = date.toISOString().split('T')[0]
            const dayTasks = reviewTasks.filter(t => {
              const taskDate = t.reviewDate
              return taskDate === dateStr
            })
            const completed = dayTasks.filter(t => t.status === '已完成').length

            return (
              <div key={i} className="trend-day">
                <div className="trend-bar-container">
                  <div
                    className="trend-bar"
                    style={{ height: `${Math.min(100, completed * 20)}%` }}
                  />
                </div>
                <span className="trend-label">
                  {date.toLocaleDateString('zh-CN', { weekday: 'short' })}
                </span>
                <span className="trend-value">{completed}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
