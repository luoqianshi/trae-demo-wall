const api = require('./utils/api.js')

App({
  onLaunch: function () {
    console.log('双人记忆摆渡船启动')
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d6g90aucu24ba270c'
      })
    }
    this.login()
  },

  async login() {
    try {
      const result = await api.login()
      if (result.success) {
        this.globalData.user = result.data
        console.log('登录成功:', result.data)
      }
    } catch (err) {
      console.error('登录失败:', err)
    }
  },

  globalData: {
    user: null,
    currentRiver: null,
    currentBottle: null,
    seasonConfig: {
      spring: { name: '春樱涟漪', color: '#ffb7c5', bgColor: '#2d1f3d' },
      summer: { name: '夏夜萤火', color: '#00ff88', bgColor: '#0d2818' },
      autumn: { name: '秋叶暖光', color: '#ffaa00', bgColor: '#3d2817' },
      winter: { name: '冬雪薄雾', color: '#a8d8ea', bgColor: '#1a2a3a' }
    }
  }
})