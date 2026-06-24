App({
  onLaunch: function () {
    console.log('轻养记小程序启动')
  },
  onShow: function () {
    console.log('小程序显示')
  },
  onHide: function () {
    console.log('小程序隐藏')
  },
  globalData: {
    userInfo: null,
    healthStatus: 'normal',
    temperatureRecords: [],
    medicineRecords: [],
    customRecords: [],
    weightRecords: [],
    waterRecords: [],
    exerciseRecords: []
  },
  formatDate: function (date) {
    const d = date || new Date()
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const seconds = d.getSeconds().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}:${seconds}`
  },
  
  getTodayDateStr: function () {
    const d = new Date()
    return `${d.getMonth() + 1}月${d.getDate()}日`
  },
  
  saveRecord: function (type, data) {
    const records = this.globalData[`${type}Records`] || []
    records.unshift({
      ...data,
      id: Date.now(),
      createTime: this.formatDate()
    })
    if (records.length > 100) {
      records.pop()
    }
    this.globalData[`${type}Records`] = records
    wx.setStorageSync(type, records)
  },
  getRecords: function (type) {
    const stored = wx.getStorageSync(type)
    if (stored) {
      this.globalData[`${type}Records`] = stored
    }
    return this.globalData[`${type}Records`] || []
  }
})