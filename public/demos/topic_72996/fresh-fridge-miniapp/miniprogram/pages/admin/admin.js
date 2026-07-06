const app = getApp()
const Cloud = require('../../../utils/cloud.js')

Page({
  data: {
    openid: '',
    isAdmin: false,
    checking: true,
    denied: false,
    modules: [
      { id: 'audit', name: '内容审核', icon: '📋', desc: '投稿与纠错审核', path: '/pages/admin/audit/audit' },
      { id: 'foodManage', name: '美食库管理', icon: '🍽️', desc: '增删改查与置顶', path: '/pages/admin/foodManage/foodManage' },
      { id: 'riskControl', name: '风控管理', icon: '🛡️', desc: '异常账号与限流', path: '/pages/admin/riskControl/riskControl' },
      { id: 'dashboard', name: '数据看板', icon: '📊', desc: '核心运营数据', path: '/pages/admin/dashboard/dashboard' },
      { id: 'pushMessage', name: '消息推送', icon: '📨', desc: '时令活动通知', path: '/pages/admin/pushMessage/pushMessage' }
    ]
  },

  onLoad: function () {
    this.checkAdmin()
  },

  checkAdmin: function () {
    const openid = app.globalData.openid
    if (!openid) {
      this.setData({ checking: false, denied: true })
      return
    }

    Cloud.callFunction('adminManager', { action: 'checkAdmin' }).then(res => {
      const result = res.data
      if (result && result.success && result.isAdmin) {
        this.setData({
          openid,
          isAdmin: true,
          checking: false,
          denied: false
        })
      } else {
        this.setData({
          checking: false,
          denied: true
        })
      }
    }).catch(() => {
      this.setData({ checking: false, denied: true })
    })
  },

  onRetryCheck: function () {
    this.setData({ checking: true, denied: false })
    this.checkAdmin()
  },

  onModuleTap: function (e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({ url: path })
  },

  onBackHome: function () {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
