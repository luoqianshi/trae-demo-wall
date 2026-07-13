// components/custom-tab-bar/custom-tab-bar.js
Component({
  data: {
    selected: 0,
    color: '#A09589',
    selectedColor: '#D4845A',
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: 'home' },
      { pagePath: '/pages/meal-list/meal-list', text: '饭局', icon: 'calendar' },
      { pagePath: '/pages/meal-create/meal-create', text: '发起', icon: 'plus', isCenter: true },
      { pagePath: '/pages/messages/messages', text: '消息', icon: 'message', hasBadge: true },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'user' }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const index = data.index
      const path = data.path
      const isCenter = data.isCenter

      // 中心按钮跳转到发起饭局页
      if (isCenter) {
        wx.navigateTo({ url: '/pages/meal-create/meal-create' })
        return
      }

      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
