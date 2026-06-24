const app = getApp()

Page({
  data: {
    todaySteps: 0,
    todayDistance: 0,
    todayCalories: 0,
    stepProgress: 0,
    stepAngle: 0,
    records: [],
    weekStats: [],
    showModal: false,
    customSteps: ''
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    const records = app.getRecords('exercise') || []
    const today = app.getTodayDateStr()
    const todayRecords = records.filter(r => r.createTime && r.createTime.includes(today))
    const todaySteps = todayRecords.reduce((sum, r) => sum + (r.steps || 0), 0)
    
    const stepProgress = Math.round((todaySteps / 10000) * 100)
    const displayProgress = Math.min(stepProgress, 100)
    const stepAngle = (displayProgress / 100) * 360

    this.setData({
      todaySteps,
      todayDistance: (todaySteps * 0.0007).toFixed(2),
      todayCalories: Math.round(todaySteps * 0.04),
      stepProgress,
      displayProgress,
      stepAngle,
      records: records.slice(0, 20),
      weekStats: this.calculateWeekStats(records)
    })
  },

  calculateWeekStats: function (records) {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const today = new Date()
    const weekStats = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
      const dayName = weekDays[date.getDay()]
      
      const dayRecords = records.filter(r => r.createTime && r.createTime.includes(dateStr))
      const steps = dayRecords.reduce((sum, r) => sum + (r.steps || 0), 0)
      
      weekStats.push({
        day: dayName,
        steps,
        percent: Math.min((steps / 10000) * 100, 100)
      })
    }

    return weekStats
  },

  addExercise: function (e) {
    const steps = parseInt(e.currentTarget.dataset.steps)
    app.saveRecord('exercise', { steps })
    this.loadData()
    wx.showToast({
      title: `+${steps}步`,
      icon: 'none'
    })
  },

  showCustomModal: function () {
    this.setData({
      showModal: true,
      customSteps: ''
    })
  },

  hideModal: function () {
    this.setData({
      showModal: false
    })
  },

  stopPropagation: function () {
  },

  onCustomInput: function (e) {
    this.setData({
      customSteps: e.detail.value
    })
  },

  addCustomExercise: function () {
    const steps = parseInt(this.data.customSteps)
    if (steps > 0) {
      app.saveRecord('exercise', { steps })
      this.hideModal()
      this.loadData()
      wx.showToast({
        title: `+${steps}步`,
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '请输入有效数值',
        icon: 'none'
      })
    }
  },
  
  deleteRecord: function (e) {
    const id = e.currentTarget.dataset.id
    const records = app.getRecords('exercise') || []
    const updatedRecords = records.filter(r => r.id !== id)
    wx.setStorageSync('exercise', updatedRecords)
    app.globalData.exerciseRecords = updatedRecords
    this.loadData()
    wx.showToast({
      title: '已删除',
      icon: 'success'
    })
  }
})