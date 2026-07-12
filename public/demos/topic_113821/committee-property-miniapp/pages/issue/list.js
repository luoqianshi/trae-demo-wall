const mock = require('../../utils/mock.js')

Page({
  data: {
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'collecting', label: '意见征集中' },
      { key: 'voting', label: '待表决' },
      { key: 'processing', label: '处理中' },
      { key: 'completed', label: '已完成' }
    ],
    list: []
  },

  onLoad() {
    this.loadList()
  },

  onShow() {
    this.loadList()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/issue/list')
    }
  },

  loadList() {
    let list
    if (this.data.activeTab === 'all') {
      list = mock.getIssues()
    } else {
      list = mock.getIssues({ status: this.data.activeTab })
    }
    list.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
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
    wx.navigateTo({ url: `/pages/issue/detail?id=${id}` })
  }
})
