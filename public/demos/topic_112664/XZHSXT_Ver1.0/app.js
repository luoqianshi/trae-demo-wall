const { initMockData } = require('./utils/mock-api.js')

App({
  globalData: {
    userInfo: null,
    token: '',
    role: 'employee',
    departments: ['技术部', '产品部', '市场部', '财务部', '人事部', '行政部']
  },

  onLaunch() {
    initMockData()
    
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const role = wx.getStorageSync('role')
    
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.role = role || 'employee'
    }
  },

  checkLogin() {
    return !!this.globalData.token
  },

  setUserInfo(userInfo, token, role) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.role = role
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('role', role)
  },

  logout() {
    this.globalData.userInfo = null
    this.globalData.token = ''
    this.globalData.role = 'employee'
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('role')
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },

  hasPermission(requiredRole) {
    const roleHierarchy = {
      'employee': 1,
      'manager': 2,
      'admin': 3
    }
    const userLevel = roleHierarchy[this.globalData.role] || 1
    const requiredLevel = roleHierarchy[requiredRole] || 1
    return userLevel >= requiredLevel
  }
})
