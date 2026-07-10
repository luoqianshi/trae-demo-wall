const app = getApp()

Page({
  data: {
    currentTab: 'on',
    filteredHouses: []
  },

  onLoad() {
    this.filterHouses('on')
  },

  onShow() {
    this.filterHouses(this.data.currentTab)
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.filterHouses(tab)
  },

  filterHouses(tab) {
    const allHouses = app.globalData.houses
    let filtered = []
    if (tab === 'on') {
      filtered = allHouses.filter(h => h.status === 'available')
    } else if (tab === 'booked') {
      filtered = allHouses.filter(h => h.status === 'booked')
    } else if (tab === 'off') {
      filtered = allHouses.filter(h => h.status === 'off')
    }
    this.setData({ filteredHouses: filtered })
  },

  onEdit(e) {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' })
  },

  onToggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const house = app.globalData.houses.find(h => h.id === id)
    if (house) {
      house.status = house.status === 'available' ? 'off' : 'available'
      this.filterHouses(this.data.currentTab)
      wx.showToast({ 
        title: house.status === 'available' ? '已上架' : '已下架', 
        icon: 'success' 
      })
    }
  }
})
