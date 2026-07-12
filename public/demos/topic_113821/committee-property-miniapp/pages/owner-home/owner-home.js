const mock = require('../../utils/mock.js')
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    communityName: '',
    buildingInfo: '',
    topAnnouncements: [],
    stats: {},
    activeIssues: [],
    myOrders: [],
    ownerMeeting: null,
    unpaidBills: [],
    entries: [
      { icon: '🔧', text: '我要报修', path: '/pages/submit/submit?type=repair' },
      { icon: '💡', text: '公共建议', path: '/pages/submit/submit?type=suggestion' },
      { icon: '🗳️', text: '参与表决', path: '/pages/vote/list' },
      { icon: '📋', text: '我的工单', path: '/pages/work-order/list' }
    ],
    entries2: [
      { icon: '📱', text: '二维码开门', path: '/pages/access/access' },
      { icon: '💰', text: '物业费', path: '/pages/payment/payment?type=property' },
      { icon: '🚗', text: '停车费', path: '/pages/payment/payment?type=parking' },
      { icon: '🏛️', text: '业主大会', path: '/pages/meeting/meeting' }
    ],
    entries3: [
      { icon: '📊', text: '公共收益', path: '/pages/funds/funds?tab=income' },
      { icon: '🏦', text: '维修基金', path: '/pages/funds/funds?tab=fund' },
      { icon: '📢', text: '小区公告', path: '/pages/announcement/list' },
      { icon: '📝', text: '公共议题', path: '/pages/issue/list' }
    ]
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateAndSetSelected('/pages/owner-home/owner-home')
    }
  },

  loadData() {
    const communityInfo = app.globalData.communityInfo
    const topAnnouncements = mock.getAnnouncements({ isTop: true }).slice(0, 2)
    const stats = mock.getOwnerStats()
    const activeIssues = mock.getIssues().filter(i => 
      i.status === 'collecting' || i.status === 'voting'
    ).slice(0, 2)
    const myOrders = mock.getWorkOrders({ source: '业主' }).slice(0, 2)
    const ownerMeeting = mock.getOwnerMeeting().current
    const bills = mock.getPaymentBills()
    const unpaidBills = [...bills.property, ...bills.parking].filter(b => b.status === 'unpaid')

    this.setData({
      communityName: communityInfo.name,
      buildingInfo: `${communityInfo.building} ${communityInfo.room}`,
      topAnnouncements,
      stats,
      activeIssues,
      myOrders,
      ownerMeeting,
      unpaidBills
    })
  },

  goToPage(e) {
    const path = e.currentTarget.dataset.path
    if (!path) return
    wx.navigateTo({ url: path })
  },

  goToAnnouncement(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/announcement/detail?id=${id}` })
  },

  goToIssue(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/issue/detail?id=${id}` })
  },

  goToOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/work-order/detail?id=${id}` })
  },

  goToAnnouncementList() {
    wx.switchTab({ url: '/pages/announcement/list' })
  },

  goToIssueList() {
    wx.switchTab({ url: '/pages/issue/list' })
  },

  goToOrderList() {
    wx.switchTab({ url: '/pages/work-order/list' })
  },

  getStatusText(status) {
    return util.getStatusText(status)
  },

  getStatusClass(status) {
    return util.getStatusClass(status)
  }
})
