import { useState, useContext } from 'react'
import { AppContext } from '../App'
import { formatDate } from '../utils/storage'
import './WrongQuestionList.css'

const STATUS_FILTERS = ['全部', '未诊断', '已诊断', '引导中', '变式训练中', '待复测', '已掌握']

export default function WrongQuestionList() {
  const { wrongQuestions, navigateTo, deleteWrongQuestion } = useContext(AppContext)
  const [filter, setFilter] = useState('全部')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const filteredQuestions = filter === '全部'
    ? wrongQuestions
    : wrongQuestions.filter(q => q.status === filter)

  const sortedQuestions = [...filteredQuestions].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  )

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

  const handleDelete = (id) => {
    deleteWrongQuestion(id)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="list-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">错题生命线</h1>
          <p className="page-subtitle">追踪每一道错题的学习轨迹</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigateTo('print')}
            disabled={wrongQuestions.length === 0}
          >
            🖨️ 打印错题本
          </button>
        </div>
      </div>

      <div className="list-filters">
        {STATUS_FILTERS.map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
            {status !== '全部' && (
              <span className="filter-count">
                {wrongQuestions.filter(q => q.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="question-list">
        {sortedQuestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h3>暂无错题</h3>
            <p>点击「录入新错题」开始你的学习之旅</p>
          </div>
        ) : (
          sortedQuestions.map(q => (
            <div key={q.id} className="question-card" data-status={q.status} onClick={() => navigateTo('detail', q.id)}>
              <div className="question-card-header">
                <span className="question-card-subject">{q.subject}</span>
                <span className={`question-card-status ${getStatusClass(q.status)}`}>
                  {q.status}
                </span>
              </div>

              <div className="question-card-knowledge">{q.knowledgePoint || '未指定知识点'}</div>
              <div className="question-card-preview">{q.questionText}</div>

              {q.diagnosis?.causeType && (
                <div className="question-card-diagnosis">
                  <span className="diagnosis-label">错因：</span>
                  {q.diagnosis.causeType}
                </div>
              )}

              <div className="question-card-footer">
                <div className="question-card-meta">
                  <span>创建 {formatDate(q.createdAt)}</span>
                  {q.nextReviewAt && q.nextReviewAt !== '考前' && (
                    <span>复习 {formatDate(q.nextReviewAt)}</span>
                  )}
                </div>
                <div className="question-card-progress">
                  <span className="progress-text">{q.progress || 0}%</span>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${q.progress === 100 ? 'success' : ''}`}
                      style={{ width: `${q.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="question-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigateTo('detail', q.id)}
                >
                  查看详情
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowDeleteConfirm(q.id)}
                >
                  删除
                </button>
              </div>

              {showDeleteConfirm === q.id && (
                <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
                  <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                    <h4>确认删除</h4>
                    <p>删除后无法恢复，确定要删除这道错题吗？</p>
                    <div className="delete-confirm-actions">
                      <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                        取消
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(q.id)}>
                        确认删除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
