const app = getApp()
const { getSalaryItems } = require('../../utils/mock-api.js')

Page({
  data: {
    salaryItems: {
      income: [],
      attendanceDeduction: [],
      statutoryDeduction: []
    }
  },

  onLoad() {
    if (!app.checkLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    this.loadSalaryItems()
  },

  loadSalaryItems() {
    const items = getSalaryItems()
    this.setData({ salaryItems: items })
  }
})
