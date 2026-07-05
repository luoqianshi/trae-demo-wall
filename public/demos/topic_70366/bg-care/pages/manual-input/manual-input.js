Page({
  data: {
    statusBarHeight: 0,
    currentTime: '',
    systolic: '',
    diastolic: '',
    heartRate: ''
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight })
    this.updateTime()
  },

  updateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const hour = now.getHours()
    const minute = String(now.getMinutes()).padStart(2, '0')
    const period = hour < 12 ? '上午' : '下午'
    const displayHour = hour <= 12 ? (hour === 0 ? 12 : hour) : hour - 12
    const timeStr = year + '年' + month + '月' + day + '日 ' + period + ' ' + displayHour + ':' + minute
    this.setData({ currentTime: timeStr })
  },

  onSystolicInput(e) {
    this.setData({ systolic: e.detail.value })
  },

  onDiastolicInput(e) {
    this.setData({ diastolic: e.detail.value })
  },

  onHeartRateInput(e) {
    this.setData({ heartRate: e.detail.value })
  },

  saveRecord() {
    const { systolic, diastolic, heartRate } = this.data

    if (!systolic) {
      wx.showToast({ title: '请输入收缩压', icon: 'none', duration: 2000 })
      return
    }
    if (!diastolic) {
      wx.showToast({ title: '请输入舒张压', icon: 'none', duration: 2000 })
      return
    }
    if (!heartRate) {
      wx.showToast({ title: '请输入心率', icon: 'none', duration: 2000 })
      return
    }

    const sysVal = parseInt(systolic, 10)
    const diaVal = parseInt(diastolic, 10)
    const hrVal = parseInt(heartRate, 10)

    if (sysVal < 60 || sysVal > 250) {
      wx.showToast({ title: '收缩压范围应为60-250', icon: 'none', duration: 2000 })
      return
    }
    if (diaVal < 30 || diaVal > 150) {
      wx.showToast({ title: '舒张压范围应为30-150', icon: 'none', duration: 2000 })
      return
    }
    if (hrVal < 30 || hrVal > 220) {
      wx.showToast({ title: '心率范围应为30-220', icon: 'none', duration: 2000 })
      return
    }

    const record = {
      systolic: sysVal,
      diastolic: diaVal,
      heartRate: hrVal
    }

    const app = getApp()
    app.addRecord(record)

    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  goBack() {
    wx.navigateBack()
  }
})
