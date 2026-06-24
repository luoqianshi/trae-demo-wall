const app = getApp()

Page({
  data: {
    healthStatus: 'normal',
    statusIndex: 0,
    statusOptions: [
      { label: '正常模式', value: 'normal' },
      { label: '生病模式', value: 'sick' }
    ],
    todayTemp: '',
    todayWeight: '',
    waterProgress: 0,
    todayExercise: '',
    medicineReminders: [],
    customReminders: [],
    allReminders: [],
    medicineCount: 0,
    showReminderModal: false,
    newReminder: {
      content: '',
      time: ''
    }
  },

  onLoad: function () {
    const status = wx.getStorageSync('healthStatus') || 'normal'
    this.setData({
      healthStatus: status
    })
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    const status = wx.getStorageSync('healthStatus') || 'normal'
    this.setData({
      healthStatus: status
    })

    const tempRecords = app.getRecords('temperature') || []
    const weightRecords = app.getRecords('weight') || []
    const waterRecords = app.getRecords('water') || []
    const exerciseRecords = app.getRecords('exercise') || []
    const medicineRecords = app.getRecords('medicine') || []
    const customRecords = app.getRecords('custom') || []

    const today = app.getTodayDateStr()
    const todayTemp = tempRecords.find(r => r.createTime && r.createTime.includes(today))
    const todayWeight = weightRecords.find(r => r.createTime && r.createTime.includes(today))
    const todayExercise = exerciseRecords.find(r => r.createTime && r.createTime.includes(today))

    const pendingMedicine = medicineRecords.filter(r => !r.taken).map(r => ({ ...r, type: 'medicine' }))
    const pendingCustom = customRecords.filter(r => !r.done).map(r => ({ ...r, type: 'custom' }))
    
    const allReminders = [...pendingMedicine, ...pendingCustom].sort((a, b) => a.time.localeCompare(b.time))
    
    const todayWaterAmount = waterRecords.filter(r => r.createTime && r.createTime.includes(today)).reduce((sum, r) => sum + (r.amount || 0), 0)
    const todayExerciseSteps = exerciseRecords.filter(r => r.createTime && r.createTime.includes(today)).reduce((sum, r) => sum + (r.steps || 0), 0)
    
    this.setData({
      todayTemp: todayTemp ? todayTemp.value : '',
      todayWeight: todayWeight ? todayWeight.value : '',
      todayExercise: todayExerciseSteps || '',
      waterProgress: this.calculateWaterProgress(waterRecords),
      medicineReminders: pendingMedicine.slice(0, 5),
      customReminders: pendingCustom.slice(0, 5),
      allReminders: allReminders.slice(0, 10),
      medicineCount: pendingMedicine.length
    })
  },

  calculateWaterProgress: function (records) {
    const today = app.getTodayDateStr()
    const todayWater = records.filter(r => r.createTime && r.createTime.includes(today))
    const total = todayWater.reduce((sum, r) => sum + (r.amount || 0), 0)
    return Math.min(Math.round((total / 2000) * 100), 100)
  },

  onStatusChange: function (e) {
    const index = e.detail.value
    const newStatus = this.data.statusOptions[index].value
    this.setData({
      healthStatus: newStatus,
      statusIndex: index
    })
    wx.setStorageSync('healthStatus', newStatus)
    app.globalData.healthStatus = newStatus
    
    const tips = newStatus === 'sick' ? '已切换到生病模式，记得按时吃药哦~' : '已切换到正常模式，继续保持！'
    wx.showToast({
      title: tips,
      icon: 'none'
    })
    this.loadData()
  },
  
  toggleMode: function () {
    const newStatus = this.data.healthStatus === 'normal' ? 'sick' : 'normal'
    this.setData({
      healthStatus: newStatus
    })
    wx.setStorageSync('healthStatus', newStatus)
    app.globalData.healthStatus = newStatus
    
    const tips = newStatus === 'sick' ? '已切换到生病模式，记得按时吃药哦~' : '已切换到正常模式，继续保持！'
    wx.showToast({
      title: tips,
      icon: 'none'
    })
  },
  
  stopPropagation: function () {
  },

  goToPage: function (e) {
    const page = e.currentTarget.dataset.page
    wx.navigateTo({
      url: page
    })
  },

  takeMedicine: function (e) {
    const id = e.currentTarget.dataset.id
    const medicineRecords = app.getRecords('medicine')
    const updatedRecords = medicineRecords.map(r => {
      if (r.id === id) {
        return { ...r, taken: true }
      }
      return r
    })
    wx.setStorageSync('medicine', updatedRecords)
    app.globalData.medicineRecords = updatedRecords
    this.loadData()

    wx.showToast({
      title: '已确认服用',
      icon: 'success'
    })
  },
  
  completeReminder: function (e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    
    if (type === 'medicine') {
      this.takeMedicine(e)
    } else {
      const customRecords = app.getRecords('custom') || []
      const updatedRecords = customRecords.map(r => {
        if (r.id === id) {
          return { ...r, done: true }
        }
        return r
      })
      wx.setStorageSync('custom', updatedRecords)
      app.globalData.customRecords = updatedRecords
      this.loadData()

      wx.showToast({
        title: '已完成',
        icon: 'success'
      })
    }
  },
  
  showAddReminderModal: function () {
    this.setData({
      showReminderModal: true,
      newReminder: {
        content: '',
        time: ''
      }
    })
  },
  
  hideReminderModal: function () {
    this.setData({
      showReminderModal: false
    })
  },
  
  onReminderInput: function (e) {
    this.setData({
      'newReminder.content': e.detail.value
    })
  },
  
  onReminderTimeChange: function (e) {
    this.setData({
      'newReminder.time': e.detail.value
    })
  },
  
  saveReminder: function () {
    const { content, time } = this.data.newReminder
    
    if (!content || !time) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    app.saveRecord('custom', {
      content,
      time,
      done: false
    })
    
    this.hideReminderModal()
    this.loadData()
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
  },

  addWater: function () {
    wx.showModal({
      title: '添加喝水记录',
      editable: true,
      placeholderText: '输入喝水量(ml)',
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseInt(res.content)
          if (amount > 0) {
            app.saveRecord('water', { amount })
            this.loadData()
            wx.showToast({
              title: '记录成功',
              icon: 'success'
            })
          }
        }
      }
    })
  },

  addExercise: function () {
    wx.showModal({
      title: '添加运动记录',
      editable: true,
      placeholderText: '输入步数',
      success: (res) => {
        if (res.confirm && res.content) {
          const steps = parseInt(res.content)
          if (steps > 0) {
            app.saveRecord('exercise', { steps })
            this.loadData()
            wx.showToast({
              title: '记录成功',
              icon: 'success'
            })
          }
        }
      }
    })
  },

  addTemperature: function () {
    wx.showModal({
      title: '添加体温记录',
      editable: true,
      placeholderText: '输入体温(°C)',
      success: (res) => {
        if (res.confirm && res.content) {
          const value = parseFloat(res.content)
          if (value > 0) {
            app.saveRecord('temperature', { value })
            this.loadData()
            wx.showToast({
              title: '记录成功',
              icon: 'success'
            })
          }
        }
      }
    })
  },

  addWeight: function () {
    wx.showModal({
      title: '添加体重记录',
      editable: true,
      placeholderText: '输入体重(kg)',
      success: (res) => {
        if (res.confirm && res.content) {
          const value = parseFloat(res.content)
          if (value > 0) {
            app.saveRecord('weight', { value })
            this.loadData()
            wx.showToast({
              title: '记录成功',
              icon: 'success'
            })
          }
        }
      }
    })
  }
})