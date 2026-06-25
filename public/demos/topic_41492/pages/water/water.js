const app = getApp()

Page({
  data: {
    todayTotal: 0,
    todayRecords: [],
    weekData: [],
    progressPercent: 0,
    progressAngle: 0,
    showModal: false,
    customAmount: ''
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    const records = app.getRecords('water') || []
    const today = app.getTodayDateStr()
    const todayRecords = records.filter(r => r.createTime && r.createTime.includes(today))
    const todayTotal = todayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
    
    const progressPercent = Math.min(Math.round((todayTotal / 2000) * 100), 100)
    const progressAngle = (progressPercent / 100) * 360

    this.setData({
      todayTotal,
      todayRecords,
      progressPercent,
      progressAngle,
      weekData: this.calculateWeekData(records)
    })
  },

  calculateWeekData: function (records) {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const today = new Date()
    const weekData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
      const dayName = weekDays[date.getDay()]
      
      const dayRecords = records.filter(r => r.createTime && r.createTime.includes(dateStr))
      const total = dayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
      
      weekData.push({
        day: dayName,
        total,
        percent: Math.min((total / 2000) * 100, 100)
      })
    }

    return weekData
  },

  addWater: function (e) {
    const amount = parseInt(e.currentTarget.dataset.amount)
    app.saveRecord('water', { amount })
    this.loadData()
    wx.showToast({
      title: `+${amount}ml`,
      icon: 'none'
    })
  },

  showCustomModal: function () {
    this.setData({
      showModal: true,
      customAmount: ''
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
      customAmount: e.detail.value
    })
  },

  addCustomWater: function () {
    const amount = parseInt(this.data.customAmount)
    if (amount > 0) {
      app.saveRecord('water', { amount })
      this.hideModal()
      this.loadData()
      wx.showToast({
        title: `+${amount}ml`,
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '请输入有效数值',
        icon: 'none'
      })
    }
  }
})