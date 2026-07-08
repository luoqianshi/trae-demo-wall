const app = getApp()
const API = 'http://192.168.124.11:3000/api'

const statusMap = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已逾期'
}

const priorityMap = {
  high: '高',
  medium: '中',
  low: '低'
}

Page({
  data: {
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    tasks: [],
    filteredTasks: [],
    filter: 'all',
    users: [],
    groupId: null,
    userInfo: null,
    currentGroup: null
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({
      userInfo: app.globalData.userInfo,
      currentGroup: app.globalData.currentGroup
    })
  },

  async onShow() {
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    // 如果没有 currentGroup，尝试自动获取
    if (!app.globalData.currentGroup && app.globalData.groups.length > 0) {
      app.globalData.currentGroup = app.globalData.groups[0]
    }

    // 如果还是没有群组，从 API 获取
    if (!app.globalData.currentGroup) {
      try {
        const groups = await this.request('/groups')
        app.globalData.groups = groups
        if (groups.length > 0) {
          app.globalData.currentGroup = groups[0]
        }
      } catch (e) {
        console.error('获取群组失败', e)
      }
    }

    this.setData({
      userInfo: app.globalData.userInfo,
      currentGroup: app.globalData.currentGroup,
      groupId: app.globalData.currentGroup?.id
    })
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadData() {
    const groupId = app.globalData.currentGroup?.id
    if (!groupId) return

    const [stats, tasks, users] = await Promise.all([
      this.request(`/tasks/dashboard/stats?groupId=${groupId}`),
      this.request(`/tasks?groupId=${groupId}`),
      this.request('/users')
    ])

    const processedTasks = tasks.map(t => this.processTask(t, users))

    this.setData({
      stats: {
        total: stats.total,
        pending: stats.pending,
        inProgress: stats.inProgress,
        completed: stats.completed,
        overdue: stats.overdue
      },
      tasks: processedTasks,
      users
    })

    this.applyFilter()
  },

  processTask(task, users) {
    const assignee = users.find(u => u.id === task.assigneeId)
    return {
      ...task,
      assigneeName: assignee ? assignee.nickname : '未知',
      statusText: statusMap[task.status] || task.status,
      priorityText: priorityMap[task.priority] || task.priority,
      dueText: this.formatDue(task.dueAt)
    }
  },

  formatDue(iso) {
    if (!iso) return '无截止时间'
    const d = new Date(iso)
    const now = new Date()
    const diff = d - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return `已逾期 ${Math.abs(days)} 天`
    if (days === 0) return '今天截止'
    if (days === 1) return '明天截止'
    return `${d.getMonth() + 1}/${d.getDate()} 截止`
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ filter }, () => this.applyFilter())
  },

  applyFilter() {
    const { tasks, filter } = this.data
    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
    this.setData({ filteredTasks: filtered })
  },

  async completeTask(e) {
    const id = e.currentTarget.dataset.id
    console.log('点击完成任务，ID:', id)
    try {
      const res = await this.request(`/tasks/${id}/complete`, 'PUT')
      console.log('完成任务成功', res)
      wx.showToast({ title: '已完成', icon: 'success' })
      await this.loadData()
    } catch (err) {
      console.error('完成任务失败', err)
      const msg = err.data?.message || err.errMsg || '操作失败'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  // 切换群组
  switchGroup() {
    let groups = app.globalData.groups
    if (groups.length === 0) {
      wx.showToast({ title: '暂无可用群组', icon: 'none' })
      return
    }
    const items = groups.map(g => g.name)
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selected = groups[res.tapIndex]
        app.globalData.currentGroup = selected
        wx.setStorageSync('currentGroup', selected)
        this.setData({ currentGroup: selected, groupId: selected.id })
        this.loadData()
        wx.showToast({ title: `切换到 ${selected.name}`, icon: 'none' })
      }
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = null
          app.globalData.userInfo = null
          app.globalData.currentGroup = null
          wx.clearStorageSync()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  },

  request(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: API + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + app.globalData.token
        },
        success: res => {
          if (res.statusCode === 401) {
            // Token 过期，跳转到登录
            wx.redirectTo({ url: '/pages/login/login' })
            return
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: reject
      })
    })
  }
})
