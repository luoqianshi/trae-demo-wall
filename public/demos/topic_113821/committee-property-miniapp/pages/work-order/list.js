const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待处理' },
      { key: 'processing', label: '处理中' },
      { key: 'waiting_acceptance', label: '待验收' },
      { key: 'completed', label: '已完成' }
    ],
    list: [],
    currentRole: 'owner'
  },

  onLoad(options) {
    const role = app.globalData.currentRole
    if (options.status) {
      this.setData({ activeTab: options.status, currentRole: role })
    } else {
      this.setData({ currentRole: role })
    }
    this.loadList()
  },

  onShow() {
    this.setData({ currentRole: app.globalData.currentRole })
    const savedStatus = wx.getStorageSync('orderListStatus')
    if (savedStatus) {
      this.setData({ activeTab: savedStatus })
      wx.removeStorageSync('orderListStatus')
    }
    this.loadList()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/work-order/list')
    }
  },

  loadList() {
    let list = mock.getWorkOrders()
    if (this.data.activeTab === 'processing') {
      list = list.filter(o => o.status === 'processing' || o.status === 'dispatched')
    } else if (this.data.activeTab !== 'all') {
      list = list.filter(o => o.status === this.data.activeTab)
    }
    if (this.data.currentRole === 'owner') {
      list = list.filter(o => o.source === '业主')
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
    wx.navigateTo({ url: `/pages/work-order/detail?id=${id}` })
  },

  goToSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit' })
  }
})
