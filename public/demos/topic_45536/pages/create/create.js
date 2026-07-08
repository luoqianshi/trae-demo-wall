const app = getApp()
const API = 'http://192.168.124.11:3000/api'

const priorityOptions = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' }
]

Page({
  data: {
    title: '',
    description: '',
    users: [],
    userNames: [],
    selectedAssigneeIndex: 0,
    selectedAssigneeName: '请选择',
    priorities: priorityOptions,
    selectedPriorityIndex: 1,
    selectedPriorityLabel: '中',
    dateRange: [[], [], [], [], []],
    dateIndex: [0, 0, 0, 0, 0],
    dueDateText: '请选择截止时间',
    dueDate: null,
    submitting: false
  },

  onShow() {
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.initDatePicker()
    this.loadUsers()
  },

  async loadUsers() {
    const users = app.globalData.users
    if (users && users.length > 0) {
      this.setData({
        users,
        userNames: users,
        selectedAssigneeIndex: 0,
        selectedAssigneeName: users[0].nickname
      })
      return
    }

    try {
      const res = await this.request('/users')
      app.globalData.users = res
      this.setData({
        users: res,
        userNames: res,
        selectedAssigneeIndex: 0,
        selectedAssigneeName: res[0].nickname
      })
    } catch (e) {
      wx.showToast({ title: '加载用户失败', icon: 'none' })
    }
  },

  initDatePicker() {
    const years = []
    const months = []
    const days = []
    const hours = []
    const minutes = []

    const now = new Date()
    for (let i = now.getFullYear(); i <= now.getFullYear() + 2; i++) years.push(i + '年')
    for (let i = 1; i <= 12; i++) months.push(i + '月')
    for (let i = 1; i <= 31; i++) days.push(i + '日')
    for (let i = 0; i < 24; i++) hours.push(i + '时')
    for (let i = 0; i < 60; i += 5) minutes.push(i + '分')

    this.setData({
      dateRange: [years, months, days, hours, minutes],
      dateIndex: [0, now.getMonth(), now.getDate() - 1, now.getHours(), 0]
    })
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },

  onAssigneeChange(e) {
    const idx = e.detail.value
    this.setData({
      selectedAssigneeIndex: idx,
      selectedAssigneeName: this.data.userNames[idx].nickname
    })
  },

  onPriorityChange(e) {
    const idx = e.detail.value
    this.setData({
      selectedPriorityIndex: idx,
      selectedPriorityLabel: this.data.priorities[idx].label
    })
  },

  onDateChange(e) {
    const val = e.detail.value
    const year = parseInt(this.data.dateRange[0][val[0]])
    const month = parseInt(this.data.dateRange[1][val[1]])
    const day = parseInt(this.data.dateRange[2][val[2]])
    const hour = parseInt(this.data.dateRange[3][val[3]])
    const minute = parseInt(this.data.dateRange[4][val[4]])
    const date = new Date(year, month - 1, day, hour, minute)

    this.setData({
      dateIndex: val,
      dueDateText: `${year}/${month}/${day} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      dueDate: date.toISOString()
    })
  },

  onDateColumnChange(e) {
    const { column, value } = e.detail
    const dateIndex = [...this.data.dateIndex]
    dateIndex[column] = value
    this.setData({ dateIndex })
  },

  async submit() {
    const { title, description, users, selectedAssigneeIndex, selectedPriorityIndex, dueDate } = this.data
    const groupId = app.globalData.currentGroup?.id

    if (!title.trim()) {
      wx.showToast({ title: '请输入任务标题', icon: 'none' })
      return
    }
    if (!groupId) {
      wx.showToast({ title: '未获取到群组信息', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      await this.request('/tasks', 'POST', {
        groupId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: users[selectedAssigneeIndex].id,
        creatorId: app.globalData.userInfo.id,
        status: 'pending',
        priority: priorityOptions[selectedPriorityIndex].value,
        dueAt: dueDate || null,
        completedAt: null,
        sourceMessage: '',
        reminderCount: 0
      })

      wx.showToast({ title: '创建成功', icon: 'success' })
      this.setData({
        title: '',
        description: '',
        dueDateText: '请选择截止时间',
        dueDate: null
      })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 800)
    } catch (e) {
      wx.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
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
