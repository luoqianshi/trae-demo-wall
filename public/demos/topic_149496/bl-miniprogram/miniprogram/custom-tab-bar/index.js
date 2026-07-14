// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: '#9CA3AF',
    selectedColor: '#1890FF',
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠', iconActive: '🏠' },
      { pagePath: '/pages/help/list/list', text: '互助', icon: '🤝', iconActive: '🤝' },
      { pagePath: '/pages/idle/list/list', text: '闲置', icon: '🛍️', iconActive: '🛍️' },
      { pagePath: '/pages/chat/list/list', text: '消息', icon: '💬', iconActive: '💬' },
      { pagePath: '/pages/profile/profile/profile', text: '我的', icon: '👤', iconActive: '👤' }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({ selected: data.index })
    }
  }
})
