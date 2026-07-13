// app.js — 饭合小程序全局逻辑
const { mockUser, mockMeals } = require('./utils/data.js')

App({
  globalData: {
    // 用户状态: guest(游客) | tested(已测食人格) | seated(已入席)
    userState: 'seated',
    userInfo: mockUser,
    currentCity: '成都',
    meals: mockMeals,
    // 食人格系统
    personalityTypes: {
      ESRP: { name: '美食侦探', tagline: '看完所有榜单和测评再出发，每一道菜都有道理', dims: ['E 探索派', 'S 实感派', 'R 理性派', 'P 计划党'] },
      CSRF: { name: '烟火常客', tagline: '老地方，老味道，熟悉的就是最好的', dims: ['C 保守派', 'S 实感派', 'R 理性派', 'F 随性党'] },
      CNIF: { name: '餐桌哲学家', tagline: '吃饭不仅是填饱肚子，更是一场生活的修行', dims: ['C 保守派', 'N 直觉派', 'I 感性派', 'F 随性党'] },
      ENRP: { name: '美食策展人', tagline: '每一顿饭都是一次策展，从食材到摆盘都讲究', dims: ['E 探索派', 'N 直觉派', 'R 理性派', 'P 计划党'] }
    }
  },

  onLaunch() {
    // 获取系统信息用于状态栏高度
    const sysInfo = wx.getWindowInfo()
    const menuInfo = wx.getMenuButtonBoundingClientRect()
    this.globalData.statusBarHeight = sysInfo.statusBarHeight
    this.globalData.navBarHeight = (menuInfo.top - sysInfo.statusBarHeight) * 2 + menuInfo.height
    this.globalData.screenWidth = sysInfo.windowWidth
    this.globalData.screenHeight = sysInfo.windowHeight
    this.globalData.menuBottom = menuInfo.bottom
    this.globalData.menuHeight = menuInfo.height
  },

  // 切换用户状态（用于演示不同首页状态）
  setUserState(state) {
    this.globalData.userState = state
    this.globalData.userInfo.state = state
  }
})
