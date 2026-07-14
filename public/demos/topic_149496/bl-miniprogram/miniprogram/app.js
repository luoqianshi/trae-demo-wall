// app.js - 比邻小程序
App({
  globalData: {
    userInfo: null,
    openid: null,
    community: null,
    isLogin: false,
    unreadCount: 0
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d4gn8vpc8c530ef79',
        traceUser: true
      })
    }

    // 检查登录状态
    this.checkLoginStatus()

    // 已登录用户启动未读消息监听
    if (this.globalData.isLogin) {
      this.startUnreadWatch()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.openid) {
      this.globalData.userInfo = userInfo
      this.globalData.openid = userInfo.openid
      this.globalData.community = userInfo.community
      this.globalData.isLogin = true
    }
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.openid = userInfo.openid
    this.globalData.community = userInfo.community
    this.globalData.isLogin = true
    wx.setStorageSync('userInfo', userInfo)
    // 启动未读消息监听
    this.startUnreadWatch()
  },

  // 清除登录状态
  clearLogin() {
    this.globalData.userInfo = null
    this.globalData.openid = null
    this.globalData.community = null
    this.globalData.isLogin = false
    this.globalData.unreadCount = 0
    wx.removeStorageSync('userInfo')
    // 停止监听
    if (this.unreadWatcher) {
      this.unreadWatcher.close()
      this.unreadWatcher = null
    }
  },

  // 检查是否登录，未登录则跳转登录页
  checkLogin() {
    if (!this.globalData.isLogin) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return false
    }
    return true
  },

  // 启动全局未读消息监听
  startUnreadWatch() {
    if (this.unreadWatcher) {
      this.unreadWatcher.close()
    }
    if (!this.globalData.openid) return

    const db = wx.cloud.database()
    const _ = db.command
    const openid = this.globalData.openid

    this.unreadWatcher = db.collection('chat_sessions')
      .where(_.or([
        { user_a: openid },
        { user_b: openid }
      ]))
      .watch({
        onChange: (snapshot) => {
          if (snapshot.type === 'init') {
            this.updateUnreadCount(snapshot.docs)
          } else {
            this.updateUnreadCount(snapshot.docs)
          }
        },
        onError: (err) => {
          console.error('监听未读消息失败:', err)
        }
      })
  },

  // 计算并更新未读消息数
  updateUnreadCount(sessions) {
    const openid = this.globalData.openid
    let total = 0
    sessions.forEach(s => {
      const unread = s.user_a === openid ? (s.unread_a || 0) : (s.unread_b || 0)
      total += unread
    })
    this.globalData.unreadCount = total
    this.updateTabBarBadge(total)
  },

  // 更新tabBar消息红点
  updateTabBarBadge(count) {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const page = pages[pages.length - 1]
      if (typeof page.getTabBar === 'function' && page.getTabBar()) {
        const tabBar = page.getTabBar()
        const list = tabBar.data.list
        if (list && list[3]) {
          list[3].badge = count || 0
          tabBar.setData({ list })
        }
      }
    }
  }
})
