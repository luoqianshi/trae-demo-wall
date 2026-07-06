const StorageUtils = require('./utils/storage')

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d4gg5ot3j3fc30fe5',
        traceUser: true
      })
    }

    // 从本地存储恢复登录态，避免冷启动时页面因 openid 缺失而无法加载
    this.globalData.openid = StorageUtils.getOpenid()
    this.globalData.userInfo = StorageUtils.getUserInfo()
    this.globalData.currentSeason = this.getCurrentSeason()

    this.checkGuideStatus()
  },

  checkGuideStatus: function () {
    const isCompleted = StorageUtils.getGuideCompleted()
    
    if (isCompleted) {
      this.login()
    } else {
      this.login(() => {
        wx.redirectTo({
          url: '/pages/guide/guide'
        })
      })
    }
  },

  onShow: function () {
    this.checkExpiredFoods()
  },

  getCurrentSeason: function () {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  },

  login: function (callback) {
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        console.log('云函数登录成功', res)
        if (res.result && res.result.success) {
          const { openid, user } = res.result
          this.globalData.openid = openid
          this.globalData.userInfo = user
          
          StorageUtils.setOpenid(openid)
          StorageUtils.setUserInfo(user)
          
          if (callback) callback()
        }
      },
      fail: (err) => {
        console.error('云函数登录失败', err)
        if (callback) callback()
      }
    })
  },

  checkExpiredFoods: function () {
    const openid = StorageUtils.getOpenid()
    if (!openid) return
    
    const db = wx.cloud.database()
    db.collection('fridge').where({
      userId: openid,
      isExpired: false
    }).get().then((res) => {
      const expiredItems = res.data.filter(item => {
        const expireDate = new Date(item.expireDate)
        return expireDate < new Date()
      })
      if (expiredItems.length > 0) {
        wx.showToast({
          title: `${expiredItems.length}件食材即将过期`,
          icon: 'none'
        })
      }
    })
  },

  globalData: {
    userInfo: null,
    openid: null,
    fridgeItems: [],
    currentSeason: '',
    isGuideCompleted: false
  }
})