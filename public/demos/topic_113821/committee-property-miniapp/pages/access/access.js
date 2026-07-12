const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    doorList: [],
    selectedDoor: null,
    recentRecords: [],
    qrCodeVisible: false,
    qrCodeText: '',
    expireTime: '',
    countDown: 60
  },

  onLoad() {
    this.loadData()
  },

  loadData() {
    const accessData = mock.getAccessCode()
    this.setData({
      doorList: accessData.doorList,
      recentRecords: accessData.recentRecords,
      selectedDoor: accessData.doorList[0]
    })
  },

  selectDoor(e) {
    const door = e.currentTarget.dataset.door
    this.setData({ selectedDoor: door })
  },

  generateQRCode() {
    if (!this.data.selectedDoor) {
      wx.showToast({ title: '请选择门禁', icon: 'none' })
      return
    }

    wx.showLoading({ title: '生成中...' })
    setTimeout(() => {
      wx.hideLoading()
      const code = 'YG' + Date.now() + Math.floor(Math.random() * 1000)
      const now = new Date()
      const expire = new Date(now.getTime() + 60 * 1000)
      const expireTime = `${expire.getHours()}:${expire.getMinutes()}:${expire.getSeconds()}`
      
      this.setData({
        qrCodeVisible: true,
        qrCodeText: code,
        expireTime: expireTime,
        countDown: 60
      })

      this.startCountDown()
    }, 500)
  },

  startCountDown() {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      let count = this.data.countDown - 1
      if (count <= 0) {
        clearInterval(this.timer)
        this.setData({ countDown: 0 })
      } else {
        this.setData({ countDown: count })
      }
    }, 1000)
  },

  refreshQRCode() {
    this.generateQRCode()
  },

  closeQRCode() {
    if (this.timer) clearInterval(this.timer)
    this.setData({ qrCodeVisible: false })
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  }
})
