const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    currentMeeting: null,
    historyMeetings: [],
    hasSignedIn: false,
    currentTab: 'agenda'
  },

  onLoad() {
    this.loadData()
  },

  loadData() {
    const meetingData = mock.getOwnerMeeting()
    this.setData({
      currentMeeting: meetingData.current,
      historyMeetings: meetingData.history
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  handleSignIn() {
    wx.showModal({
      title: '签到确认',
      content: '确认参加本次业主大会并签到吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '签到中...' })
          setTimeout(() => {
            wx.hideLoading()
            this.setData({ hasSignedIn: true })
            wx.showToast({ title: '签到成功', icon: 'success' })
          }, 1000)
        }
      }
    })
  },

  goToVote(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/vote/detail?id=${id}` })
  },

  downloadMaterial(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({ title: `下载${name}`, icon: 'none' })
  }
})
