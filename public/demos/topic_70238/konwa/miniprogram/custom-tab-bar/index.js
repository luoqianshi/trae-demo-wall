Component({
  data: {
    selected: 0
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const urls = [
        '/pages/index/index',
        '/pages/practice/practice',
        '/pages/wrongbook/wrongbook',
        '/pages/profile/profile'
      ]
      
      wx.switchTab({
        url: urls[index]
      })
    }
  }
})