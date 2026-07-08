Page({
  data: {
    userInfo: {
      nickName: '知缺同学',
      avatarUrl: ''
    },
    stats: [
      { label: '诊断次数', value: '28' },
      { label: '错题总数', value: '156' },
      { label: '掌握考点', value: '89' }
    ],
    menuList: [
      { icon: '📊', name: '学习报告', desc: '查看学情总览' },
      { icon: '📚', name: '我的收藏', desc: '收藏的题目' },
      { icon: '🎯', name: '学习目标', desc: '设置学习计划' },
      { icon: '⚙️', name: '设置', desc: '偏好设置' },
      { icon: '💡', name: '意见反馈', desc: '帮助我们改进' },
      { icon: 'ℹ️', name: '关于我们', desc: '知缺学堂 v1.0' }
    ]
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  chooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
  },

  onNickNameInput(e) {
    const { value } = e.detail
    this.setData({
      'userInfo.nickName': value
    })
  },

  goToMenu(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({
      title: name + ' 功能开发中',
      icon: 'none'
    })
  }
})
