import { useState, useContext } from 'react'
import { AppContext } from '../App'
import { formatDate } from '../utils/storage'
import './ReviewPlan.css'

const FILTER_OPTIONS = ['全部', '今日', '未完成', '已完成']

export default function ReviewPlan() {
  const { reviewTasks, wrongQuestions, updateReviewTask, deleteReviewTask, navigateTo } = useContext(AppContext)
  const [filter, setFilter] = useState('全部')

  const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0]

    switch (filter) {
      case '今日':
        return reviewTasks.filter(t => t.reviewDate === today)
      case '未完成':
        return reviewTasks.filter(t => t.status !== '已完成')
      case '已完成':
        return reviewTasks.filter(t => t.status === '已完成')
      default:
        return reviewTasks
    }
  }

  const sortedTasks = [...getFilteredTasks()].sort((a, b) => {
    if (a.reviewDate === '考前') return 1
    if (b.reviewDate === '考前') return -1
    return new Date(a.reviewDate) - new Date(b.reviewDate)
  })

  const handleToggleComplete = (task) => {
    updateReviewTask(task.id, task.status === '已完成' ? '未完成' : '已完成')
  }

  const handleViewQuestion = (task) => {
    if (task.wrongQuestionId) {
      navigateTo('detail', task.wrongQuestionId)
    }
  }

  const getTaskTypeColor = (taskType) => {
    if (taskType.includes('当天')) return 'primary'
    if (taskType.includes('3天')) return 'warning'
    if (taskType.includes('7天')) return 'success'
    if (taskType.includes('考前')) return 'danger'
    return 'default'
  }

  return (
    <div className="review-page fade-in">
      <div className="page-header">
        <h1 className="page-title">复习计划</h1>
        <p className="page-subtitle">系统化复习，告别遗忘</p>
      </div>

      <div className="review-filters">
        {FILTER_OPTIONS.map(option => (
          <button
            key={option}
            className={`review-filter-btn ${filter === option ? 'active' : ''}`}
            onClick={() => setFilter(option)}
          >
            {option}
            {option === '全部' && <span className="filter-count">{reviewTasks.length}</span>}
            {option === '未完成' && (
              <span className="filter-count">
                {reviewTasks.filter(t => t.status !== '已完成').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {sortedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>暂无复习计划</h3>
          <p>录入错题后，系统会自动生成复习计划</p>
        </div>
      ) : (
        <div className="review-tasks">
          {sortedTasks.map(task => {
            const question = wrongQuestions.find(q => q.id === task.wrongQuestionId)
            return (
              <div
                key={task.id}
                className={`review-task-item ${task.status === '已完成' ? 'completed' : ''}`}
              >
                <div
                  className={`review-task-checkbox ${task.status === '已完成' ? 'completed' : ''}`}
                  onClick={() => handleToggleComplete(task)}
                >
                  {task.status === '已完成' && '✓'}
                </div>

                <div className="review-task-content" onClick={() => handleViewQuestion(task)}>
                  <div className="review-task-header">
                    <span className={`review-task-type ${getTaskTypeColor(task.taskType)}`}>
                      {task.taskType}
                    </span>
                    <span className="review-task-date">
                      {formatDate(task.reviewDate)}
                    </span>
                  </div>
                  {question && (
                    <div className="review-task-question">
                      {question.subject} · {question.knowledgePoint || '未指定知识点'}
                    </div>
                  )}
                </div>

                <div className="review-task-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleViewQuestion(task)}
                  >
                    查看
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteReviewTask(task.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewTasks.length > 0 && (
        <div className="review-summary">
          <div className="summary-item">
            <span className="summary-num">{reviewTasks.length}</span>
            <span className="summary-label">总任务</span>
          </div>
          <div className="summary-item">
            <span className="summary-num success">
              {reviewTasks.filter(t => t.status === '已完成').length}
            </span>
            <span className="summary-label">已完成</span>
          </div>
          <div className="summary-item">
            <span className="summary-num">
              {reviewTasks.filter(t => t.status !== '已完成').length}
            </span>
            <span className="summary-label">待复习</span>
          </div>
        </div>
      )}
    </div>
  )
}
