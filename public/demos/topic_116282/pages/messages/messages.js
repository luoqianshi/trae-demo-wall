// pages/messages/messages.js
const app = getApp()
const { mockNotifications } = require('../../utils/data.js')

const FILTERS = ['全部', '待确认', '提醒', '系统']

// 规范图标名：data 中 'alert' 映射为组件支持的 'alert-triangle'
function normalizeIcon(name) {
  if (name === 'alert') return 'alert-triangle'
  return name
}

// 按筛选条件过滤并按 section 分组
function filterAndGroup(notifications, activeFilter) {
  let filtered = notifications
  if (activeFilter === 1) {
    filtered = notifications.filter(n => n.type === 'confirm')
  } else if (activeFilter === 2) {
    filtered = notifications.filter(n => n.type === 'reminder')
  } else if (activeFilter === 3) {
    filtered = notifications.filter(n => n.type !== 'confirm' && n.type !== 'reminder')
  }
  // 按 section 分组，保持 今天/昨天/更早 顺序
  const sectionOrder = ['今天', '昨天', '更早']
  const groups = []
  sectionOrder.forEach(section => {
    const items = filtered.filter(n => n.section === section)
    if (items.length > 0) {
      groups.push({ section, items })
    }
  })
  return groups
}

Page({
  data: {
    filters: FILTERS,
    activeFilter: 0,
    notifications: [],
    groupedNotifications: [],
    statusBarHeight: 0
  },

  onLoad() {
    const notifications = mockNotifications.map(n => ({
      ...n,
      icon: normalizeIcon(n.icon)
    }))
    this.setData({
      notifications,
      groupedNotifications: filterAndGroup(notifications, 0),
      statusBarHeight: app.globalData.statusBarHeight || 44
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  // 筛选切换
  onTapFilter(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      activeFilter: index,
      groupedNotifications: filterAndGroup(this.data.notifications, index)
    })
  },

  // 全部已读
  onMarkAllRead() {
    const notifications = this.data.notifications.map(n => ({ ...n, unread: false }))
    this.setData({
      notifications,
      groupedNotifications: filterAndGroup(notifications, this.data.activeFilter)
    })
  },

  // 点击通知卡片
  onTapNotification() {
    wx.showToast({ title: '查看详情', icon: 'none' })
  }
})
