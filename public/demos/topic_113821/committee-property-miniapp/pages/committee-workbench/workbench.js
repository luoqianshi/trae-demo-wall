const mock = require('../../utils/mock.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    stats: {},
    pendingIssues: [],
    acceptanceOrders: [],
    draftAnnouncements: [],
    inspectionData: null,
    entries: [
      { icon: '📝', text: '创建议题', path: '', action: 'createIssue' },
      { icon: '📢', text: '发布公告', path: '', action: 'createAnnouncement' },
      { icon: '🗳️', text: '发起表决', path: '/pages/vote/list' },
      { icon: '📊', text: '数据看板', path: '' }
    ],
    entries2: [
      { icon: '🔍', text: '巡检监督', path: '/pages/inspection/inspection' },
      { icon: '💰', text: '公共收益', path: '/pages/funds/funds?tab=income' },
      { icon: '🏦', text: '维修基金', path: '/pages/funds/funds?tab=fund' },
      { icon: '🏛️', text: '业主大会', path: '/pages/meeting/meeting' }
    ]
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/committee-workbench/workbench')
    }
  },

  loadData() {
    const stats = mock.getCommitteeStats()
    const pendingIssues = mock.getIssues().filter(i => 
      i.status === 'collecting' || i.status === 'voting'
    ).slice(0, 3)
    const acceptanceOrders = mock.getWorkOrders({ status: 'waiting_acceptance' }).slice(0, 3)
    const drafts = [
      { title: '6月公共收益公示', status: '待2位委员确认后发布', type: '公告草稿' }
    ]
    const inspectionData = mock.getInspection()

    this.setData({
      stats,
      pendingIssues,
      acceptanceOrders,
      draftAnnouncements: drafts,
      inspectionData
    })
  },

  goToIssue(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/issue/detail?id=${id}` })
  },

  goToOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/work-order/detail?id=${id}` })
  },

  goToIssueList() {
    wx.switchTab({ url: '/pages/issue/list' })
  },

  goToOrderList() {
    wx.switchTab({ url: '/pages/work-order/list' })
  },

  handleEntry(e) {
    const action = e.currentTarget.dataset.action
    const path = e.currentTarget.dataset.path
    if (path) {
      wx.navigateTo({ url: path })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },

  handleAcceptance(e) {
    const id = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action
    if (action === 'accept') {
      wx.showToast({ title: '验收通过', icon: 'success' })
    } else {
      wx.showToast({ title: '已退回', icon: 'none' })
    }
  },

  handleIssue(e) {
    const id = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action
    wx.showToast({ title: action === 'view' ? '查看详情' : '已催办', icon: 'none' })
  }
})
