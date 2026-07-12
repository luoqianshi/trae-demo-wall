const mock = require('../../utils/mock.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    stats: {},
    newOrders: [],
    rectificationOrders: [],
    pendingAcceptance: [],
    inspectionData: null,
    entries: [
      { icon: '📥', text: '待处理', path: '/pages/work-order/list?status=pending' },
      { icon: '🔧', text: '处理中', path: '/pages/work-order/list?status=processing' },
      { icon: '✅', text: '待验收', path: '/pages/work-order/list?status=waiting_acceptance' },
      { icon: '📊', text: '数据看板', path: '' }
    ],
    entries2: [
      { icon: '🔍', text: '日常巡检', path: '/pages/inspection/inspection?tab=daily' },
      { icon: '📋', text: '专项巡检', path: '/pages/inspection/inspection?tab=periodic' },
      { icon: '📝', text: '巡检记录', path: '/pages/inspection/inspection?tab=records' },
      { icon: '📁', text: '巡检模板', path: '' }
    ]
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/property-workbench/workbench')
    }
  },

  loadData() {
    const stats = mock.getPropertyStats()
    const newOrders = mock.getWorkOrders({ status: 'pending' }).slice(0, 3)
    const rectificationOrders = mock.getWorkOrders({ type: '公共整改' }).filter(o => 
      o.status === 'processing' || o.status === 'dispatched'
    ).slice(0, 3)
    const pendingAcceptance = mock.getWorkOrders({ status: 'waiting_acceptance' }).slice(0, 3)
    const inspectionData = mock.getInspection()

    this.setData({
      stats,
      newOrders,
      rectificationOrders,
      pendingAcceptance,
      inspectionData
    })
  },

  goToOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/work-order/detail?id=${id}` })
  },

  goToOrderList() {
    wx.switchTab({ url: '/pages/work-order/list' })
  },

  handleOrder(e) {
    const id = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action
    if (action === 'progress') {
      wx.showToast({ title: '提交进展', icon: 'none' })
    } else if (action === 'assign') {
      wx.showToast({ title: '转派工单', icon: 'none' })
    } else if (action === 'accept') {
      wx.showToast({ title: '已接单', icon: 'success' })
    }
  },

  handleEntry(e) {
    const path = e.currentTarget.dataset.path
    if (!path) {
      wx.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    if (path.includes('?')) {
      const [basePath, query] = path.split('?')
      const [key, value] = query.split('=')
      wx.setStorageSync('orderListStatus', value)
      wx.switchTab({ url: basePath })
    } else {
      wx.switchTab({ url: path })
    }
  }
})
