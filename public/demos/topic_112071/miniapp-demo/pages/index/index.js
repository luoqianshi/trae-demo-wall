const app = getApp()

Page({
  data: {
    houses: [],
    currentFilter: 'all',
    refreshing: false
  },

  onLoad() {
    this.setData({
      houses: app.globalData.houses
    })
  },

  onShow() {
    this.setData({
      houses: app.globalData.houses
    })
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ currentFilter: filter })
    
    let filtered = app.globalData.houses
    if (filter === 'whole') {
      filtered = app.globalData.houses.filter(h => h.type === '整租')
    } else if (filter === 'share') {
      filtered = app.globalData.houses.filter(h => h.type === '合租')
    } else if (filter === '1room') {
      filtered = app.globalData.houses.filter(h => h.rooms.includes('1室'))
    } else if (filter === '2room') {
      filtered = app.globalData.houses.filter(h => h.rooms.includes('2室'))
    } else if (filter === '3room') {
      filtered = app.globalData.houses.filter(h => h.rooms.includes('3室'))
    }
    
    this.setData({ houses: filtered })
  },

  onHouseTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  onSearchTap() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' })
  },

  onLocationTap() {
    wx.showToast({ title: '切换位置', icon: 'none' })
  },

  onRefresh() {
    this.setData({ refreshing: true })
    setTimeout(() => {
      this.setData({ 
        refreshing: false,
        houses: app.globalData.houses
      })
    }, 1000)
  }
})
