const { getMockOverview } = require('../../utils/mockData.js')

Page({
  data: {
    overview: {
      masteryRate: 76,
      pendingTasks: 3,
      wrongCount: 12
    },
    features: [
      {
        id: 'report',
        name: '学情报告',
        icon: '📊',
        badge: '1',
        badgeType: 'teal',
        bgType: 'teal',
        path: '/pages/analysis/analysis'
      },
      {
        id: 'wrong',
        name: '错题本',
        icon: '📝',
        badge: '2',
        badgeType: 'orange',
        bgType: 'orange',
        path: '/pages/wrongbook/wrongbook'
      },
      {
        id: 'plan',
        name: '补弱计划',
        icon: '✅',
        badge: '3',
        badgeType: 'blue',
        bgType: 'blue',
        path: '/pages/plan/plan'
      }
    ],
    historyList: []
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })
    this.loadOverview()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.loadOverview()
  },

  loadOverview() {
    const data = getMockOverview()
    this.setData({
      overview: {
        masteryRate: data.masteryRate,
        pendingTasks: data.pendingTasks,
        wrongCount: data.wrongCount
      },
      historyList: data.history
    })
  },

  goToCamera() {
    wx.navigateTo({
      url: '/pages/upload/upload'
    })
  },

  goToAlbum() {
    wx.navigateTo({
      url: '/pages/upload/upload?from=album'
    })
  },

  goToFeature(e) {
    const path = e.currentTarget.dataset.path
    if (path) {
      wx.switchTab({
        url: path,
        fail: () => {
          wx.navigateTo({
            url: path
          })
        }
      })
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/result/result?id=' + id
    })
  }
})
