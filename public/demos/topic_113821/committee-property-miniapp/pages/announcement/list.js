const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: '整改结果', label: '整改结果' },
      { key: '业主大会', label: '业主大会' },
      { key: '财务公开', label: '财务公开' },
      { key: '温馨提示', label: '温馨提示' }
    ],
    list: []
  },

  onLoad(options) {
    this.loadList()
  },

  onShow() {
    this.loadList()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/announcement/list')
    }
  },

  loadList() {
    let list
    if (this.data.activeTab === 'all') {
      list = mock.getAnnouncements()
    } else {
      list = mock.getAnnouncements({ type: this.data.activeTab })
    }
    list.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1
      if (!a.isTop && b.isTop) return 1
      return new Date(b.publishTime) - new Date(a.publishTime)
    })
    this.setData({ list })
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ activeTab: key }, () => {
      this.loadList()
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/announcement/detail?id=${id}` })
  }
})
