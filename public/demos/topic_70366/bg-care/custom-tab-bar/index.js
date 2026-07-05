Component({
  properties: {
    selected: { type: Number, value: 0 }
  },
  data: {
    list: [
      { pagePath: '/pages/home/home', text: '首页' },
      { pagePath: '/pages/trends/trends', text: '趋势' },
      { pagePath: '/pages/profile/profile', text: '我的' }
    ]
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const path = this.data.list[index].pagePath
      wx.switchTab({ url: path })
    }
  }
})
