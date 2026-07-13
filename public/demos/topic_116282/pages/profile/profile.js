// pages/profile/profile.js
const app = getApp()
const { mockUser } = require('../../utils/data.js')

Page({
  data: {
    user: {},
    statusBarHeight: 0,
    // 统计数据
    statsList: [],
    // 信用指标（含进度环样式）
    creditMetrics: [],
    // 信用标签
    creditTags: [],
    // 入席名额圆点
    quotaDots: [],
    // 菜单列表
    menuList: [
      { key: 'meals', label: '我的饭局', icon: 'calendar', iconBg: '#F5EDE3', iconColor: '#D4845A' },
      { key: 'personality', label: '食人格结果', icon: 'star', iconBg: '#FDF6E8', iconColor: '#D4A05A' },
      { key: 'favorites', label: '餐厅收藏', icon: 'heart', iconBg: '#FBEDED', iconColor: '#D45A5A' },
      { key: 'notifications', label: '消息通知', icon: 'bell', iconBg: '#EAF0FA', iconColor: '#5A8E9E' },
      { key: 'settings', label: '设置', icon: 'settings', iconBg: '#F0E8DF', iconColor: '#6B5D52' }
    ]
  },

  onLoad() {
    const user = mockUser
    // 统计列
    const statsList = [
      { value: user.stats.favorites, label: '收藏' },
      { value: user.stats.reviews, label: '点评' },
      { value: user.stats.likes, label: '获赞' }
    ]
    // 信用指标进度环
    const m = user.credit.metrics
    const creditMetrics = [
      { label: m.keepRate.label, value: m.keepRate.value + '%', style: 'border-color:' + m.keepRate.color + ';background:rgba(90,158,107,0.1);' },
      { label: m.punctualityRate.label, value: m.punctualityRate.value + '%', style: 'border-color:' + m.punctualityRate.color + ';background:rgba(90,158,107,0.1);' },
      { label: m.paymentCredit.label, value: m.paymentCredit.display, style: 'border-color:' + m.paymentCredit.color + ';background:rgba(212,160,90,0.1);' },
      { label: '综合评分', value: user.credit.score, style: '', isScore: true }
    ]
    // 入席名额圆点（remaining 个填充，used 个空心）
    const quotaDots = []
    for (let i = 0; i < user.inviteQuota.total; i++) {
      quotaDots.push({ filled: i < user.inviteQuota.remaining })
    }

    this.setData({
      user,
      statsList,
      creditMetrics,
      creditTags: user.credit.tags,
      quotaDots,
      statusBarHeight: app.globalData.statusBarHeight || 44
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
  },

  // 编辑资料
  onEditProfile() {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' })
  },

  // 邀请好友
  onInviteFriend() {
    wx.navigateTo({ url: '/pages/invite-code/invite-code' })
  },

  // 菜单项点击
  onTapMenu(e) {
    const key = e.currentTarget.dataset.key
    switch (key) {
      case 'meals':
        wx.switchTab({ url: '/pages/meal-list/meal-list' })
        break
      case 'personality':
        wx.navigateTo({ url: '/pages/personality-result/personality-result' })
        break
      case 'favorites':
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break
      case 'notifications':
        wx.switchTab({ url: '/pages/messages/messages' })
        break
      case 'settings':
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break
    }
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmColor: '#D45A5A',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
