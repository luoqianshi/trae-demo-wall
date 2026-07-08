const app = getApp()
const API = 'http://192.168.124.11:3000/api'

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onLoad() {
    // 如果已登录，直接跳转到首页
    if (app.globalData.token) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },

  async login() {
    const { username } = this.data
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      // 调用登录接口
      const res = await this.request('/auth/login', 'POST', {
        username: username.trim()
      })

      // 保存登录信息
      app.globalData.token = res.token
      app.globalData.userInfo = res.user
      app.globalData.groups = res.groups
      if (res.groups.length > 0) {
        app.globalData.currentGroup = res.groups[0]
      }

      wx.setStorageSync('token', res.token)
      wx.setStorageSync('userInfo', res.user)
      wx.setStorageSync('groups', res.groups)

      wx.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (e) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  request(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: API + url,
        method,
        data,
        header: { 'Content-Type': 'application/json' },
        success: res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: reject
      })
    })
  }
})
