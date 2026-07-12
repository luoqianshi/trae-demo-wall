const mock = require('../../utils/mock.js')

Page({
  data: {
    activeTab: 'ongoing',
    tabs: [
      { key: 'ongoing', label: '进行中' },
      { key: 'upcoming', label: '即将开始' },
      { key: 'ended', label: '已结束' }
    ],
    list: []
  },

  onLoad() {
    this.loadList()
  },

  onShow() {
    this.loadList()
  },

  loadList() {
    let list
    if (this.data.activeTab === 'all') {
      list = mock.getVotes()
    } else {
      list = mock.getVotes({ status: this.data.activeTab })
    }
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
    wx.navigateTo({ url: `/pages/vote/detail?id=${id}` })
  }
})
