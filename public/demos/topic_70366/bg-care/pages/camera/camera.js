Page({
  data: {
    statusBarHeight: 0,
    hasPhoto: false,
    photoPath: '',
    recognizedData: null,
    recognizing: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight })
  },

  takePhoto() {
    wx.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: (res) => {
        const path = res.tempFilePaths[0]
        this.setData({ hasPhoto: true, photoPath: path })
        this.recognizeBpData(path)
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) return
        wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
      }
    })
  },

  recognizeBpData(imagePath) {
    this.setData({ recognizing: true })
    setTimeout(() => {
      const simulatedSys = 120 + Math.floor(Math.random() * 30)
      const simulatedDia = 70 + Math.floor(Math.random() * 20)
      const simulatedHr = 60 + Math.floor(Math.random() * 30)
      const record = {
        systolic: simulatedSys,
        diastolic: simulatedDia,
        heartRate: simulatedHr
      }
      const app = getApp()
      app.addRecord(record)
      this.setData({
        recognizing: false,
        recognizedData: record
      })
      wx.showToast({ title: '识别成功，已保存记录', icon: 'success', duration: 1500 })
      setTimeout(() => wx.navigateBack(), 1500)
    }, 1500)
  },

  goBack() {
    wx.navigateBack()
  }
})
