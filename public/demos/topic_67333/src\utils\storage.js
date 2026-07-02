const STORAGE_KEYS = {
  WRONG_QUESTIONS: 'wrongQuestions',
  REVIEW_TASKS: 'reviewTasks',
  THEME: 'theme'
}

export const storage = {
  getWrongQuestions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WRONG_QUESTIONS)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get wrong questions:', e)
      return []
    }
  },

  saveWrongQuestions(questions) {
    try {
      localStorage.setItem(STORAGE_KEYS.WRONG_QUESTIONS, JSON.stringify(questions))
    } catch (e) {
      console.error('Failed to save wrong questions:', e)
    }
  },

  getReviewTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEW_TASKS)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get review tasks:', e)
      return []
    }
  },

  saveReviewTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEW_TASKS, JSON.stringify(tasks))
    } catch (e) {
      console.error('Failed to save review tasks:', e)
    }
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.WRONG_QUESTIONS)
    localStorage.removeItem(STORAGE_KEYS.REVIEW_TASKS)
  },

  exportData() {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      wrongQuestions: this.getWrongQuestions(),
      reviewTasks: this.getReviewTasks()
    }
  },

  importData(data) {
    if (data.wrongQuestions) {
      this.saveWrongQuestions(data.wrongQuestions)
    }
    if (data.reviewTasks) {
      this.saveReviewTasks(data.reviewTasks)
    }
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatDate(dateString) {
  if (dateString === '考前') return '考前'
  const date = new Date(dateString)
  const now = new Date()
  const diff = date - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '明天'
  if (days === -1) return '昨天'
  if (days < 0) return `${Math.abs(days)}天前`
  if (days <= 7) return `${days}天后`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
