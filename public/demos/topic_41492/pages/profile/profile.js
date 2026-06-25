const app = getApp()

Page({
  data: {
    userName: '轻养用户',
    targetWeight: 65,
    healthStatus: 'normal',
    totalDays: 0,
    totalRecords: 0,
    streakDays: 0,
    tempCount: 0,
    weightCount: 0,
    waterCount: 0,
    exerciseCount: 0,
    medicineCount: 0,
    showTargetModal: false,
    showStatusModal: false,
    newStatus: 'normal'
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    const tempRecords = app.getRecords('temperature')
    const weightRecords = app.getRecords('weight')
    const waterRecords = app.getRecords('water')
    const exerciseRecords = app.getRecords('exercise')
    const medicineRecords = app.getRecords('medicine')

    const targetWeight = parseFloat(wx.getStorageSync('targetWeight')) || 65
    const healthStatus = wx.getStorageSync('healthStatus') || 'normal'

    this.setData({
      targetWeight,
      healthStatus,
      tempCount: tempRecords.length,
      weightCount: weightRecords.length,
      waterCount: waterRecords.length,
      exerciseCount: exerciseRecords.length,
      medicineCount: medicineRecords.length,
      totalRecords: tempRecords.length + weightRecords.length + waterRecords.length + exerciseRecords.length,
      totalDays: this.calculateTotalDays([...tempRecords, ...weightRecords, ...waterRecords, ...exerciseRecords]),
      streakDays: this.calculateStreak([...tempRecords, ...weightRecords, ...waterRecords, ...exerciseRecords])
    })
  },

  calculateTotalDays: function (records) {
    if (records.length === 0) return 0
    const dates = new Set(records.map(r => r.createTime.split(' ')[0]))
    return dates.size
  },

  calculateStreak: function (records) {
    if (records.length === 0) return 0
    
    const dates = new Set(records.map(r => r.createTime.split(' ')[0]))
    const dateList = Array.from(dates).sort().reverse()
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toLocaleDateString('zh-CN')
      
      if (dates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    
    return streak
  },

  editProfile: function () {
    wx.showModal({
      title: '编辑资料',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            userName: res.content
          })
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
        }
      }
    })
  },

  goToWeightTarget: function () {
    this.setData({
      showTargetModal: true
    })
  },

  hideTargetModal: function () {
    this.setData({
      showTargetModal: false
    })
  },

  onTargetInput: function (e) {
    this.setData({
      targetWeight: e.detail.value
    })
  },

  saveTarget: function () {
    const weight = parseFloat(this.data.targetWeight)
    if (weight > 0) {
      wx.setStorageSync('targetWeight', weight)
      this.hideTargetModal()
      this.loadData()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '请输入有效数值',
        icon: 'none'
      })
    }
  },

  goToHealthStatus: function () {
    this.setData({
      showStatusModal: true,
      newStatus: this.data.healthStatus
    })
  },

  hideStatusModal: function () {
    this.setData({
      showStatusModal: false
    })
  },

  setStatus: function (e) {
    this.setData({
      newStatus: e.currentTarget.dataset.status
    })
  },

  confirmStatus: function () {
    wx.setStorageSync('healthStatus', this.data.newStatus)
    this.hideStatusModal()
    this.loadData()
    const tips = this.data.newStatus === 'sick' ? '已切换到生病状态' : '已切换到健康状态'
    wx.showToast({
      title: tips,
      icon: 'none'
    })
  },

  goToPage: function (e) {
    const page = e.currentTarget.dataset.page
    wx.navigateTo({
      url: page
    })
  },

  goToExercise: function () {
    wx.navigateTo({
      url: '/pages/exercise/exercise'
    })
  },

  showAbout: function () {
    wx.showModal({
      title: '关于轻养记',
      content: '轻养记 - 全龄段智能健康助手\n\n让健康记录变得轻松有趣，帮助您养成良好的健康习惯。\n\n功能特色：\n• 体温记录与趋势分析\n• 用药提醒与管理\n• 体重追踪与目标管理\n• 喝水打卡与统计\n• 运动记录与步数统计',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  clearData: function () {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          app.globalData.temperatureRecords = []
          app.globalData.medicineRecords = []
          app.globalData.customRecords = []
          app.globalData.weightRecords = []
          app.globalData.waterRecords = []
          app.globalData.exerciseRecords = []
          this.loadData()
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  stopPropagation: function () {
  }
})