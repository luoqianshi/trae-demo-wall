const Cloud = require('../../utils/cloud.js')

const TYPE_META = {
  seasonal: { icon: '🍓', name: '时令提醒', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.12)' },
  expiry: { icon: '⏰', name: '临期提醒', color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.12)' },
  overstock: { icon: '📦', name: '囤货提醒', color: '#F44336', bg: 'rgba(244, 67, 54, 0.12)' },
  system: { icon: '🔔', name: '系统消息', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.12)' }
}

const TABS = [
  { id: 'all', name: '全部' },
  { id: 'seasonal', name: '时令提醒' },
  { id: 'expiry', name: '临期提醒' },
  { id: 'overstock', name: '囤货提醒' },
  { id: 'system', name: '系统消息' }
]

Page({
  data: {
    tabs: TABS,
    activeTab: 'all',
    messages: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    unreadTotal: 0,
    unreadBreakdown: {},
    isEmpty: false,
    typeMeta: TYPE_META
  },

  onLoad: function (options) {
    if (options && options.type) {
      this.setData({ activeTab: options.type })
    }
    this.loadFirstPage()
    this.loadUnreadCount()
  },

  onShow: function () {
    this.loadFirstPage()
    this.loadUnreadCount()
  },

  onPullDownRefresh: function () {
    this.loadFirstPage().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    this.loadMore()
  },

  onTabChange: function (e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeTab) return
    this.setData({ activeTab: id })
    this.loadFirstPage()
  },

  loadFirstPage: function () {
    this.setData({ page: 1, hasMore: true, messages: [] })
    return this.loadList()
  },

  loadMore: function () {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ page: this.data.page + 1 })
    this.loadList()
  },

  loadList: function () {
    if (this.data.loading) return Promise.resolve()
    this.setData({ loading: true })

    return Cloud.callFunction('messageManager', {
      action: 'getList',
      type: this.data.activeTab,
      page: this.data.page,
      pageSize: this.data.pageSize
    }).then(res => {
      const result = res.data || {}
      if (result.success && result.data) {
        const newList = (result.data.list || []).map(item => ({
          ...item,
          meta: TYPE_META[item.type] || TYPE_META.system
        }))

        this.setData({
          messages: this.data.page === 1 ? newList : this.data.messages.concat(newList),
          hasMore: !!result.data.hasMore,
          isEmpty: this.data.page === 1 && newList.length === 0
        })
      } else {
        if (this.data.page === 1) {
          this.setData({ isEmpty: true })
        }
      }
    }).catch(() => {
      if (this.data.page === 1) {
        this.setData({ isEmpty: true })
      }
    }).then(() => {
      this.setData({ loading: false })
    })
  },

  loadUnreadCount: function () {
    Cloud.callFunction('messageManager', {
      action: 'getUnreadCount'
    }).then(res => {
      const result = res.data || {}
      if (result.success && result.data) {
        this.setData({
          unreadTotal: result.data.total || 0,
          unreadBreakdown: result.data.breakdown || {}
        })
      }
    }).catch(() => {})
  },

  onMessageTap: function (e) {
    const item = e.currentTarget.dataset.item
    if (!item) return

    if (!item.isRead) {
      Cloud.callFunction('messageManager', {
        action: 'markRead',
        messageId: item._id
      }).then(res => {
        const result = res.data || {}
        if (result.success) {
          const messages = this.data.messages.map(msg => {
            if (msg._id === item._id) {
              return { ...msg, isRead: true }
            }
            return msg
          })
          this.setData({
            messages,
            unreadTotal: Math.max(this.data.unreadTotal - 1, 0)
          })
        }
      }).catch(() => {})
    }

    if (item.foodId) {
      wx.navigateTo({
        url: `/pages/foodDetail/foodDetail?id=${item.foodId}`,
        fail: () => {}
      })
    }
  },

  onMarkAllRead: function () {
    if (this.data.unreadTotal === 0) {
      wx.showToast({ title: '没有未读消息', icon: 'none' })
      return
    }

    wx.showModal({
      title: '全部已读',
      content: '确定要将所有消息标记为已读吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          Cloud.callFunction('messageManager', {
            action: 'markAllRead',
            type: 'all'
          }).then(res => {
            wx.hideLoading()
            const result = res.data || {}
            if (result.success) {
              const messages = this.data.messages.map(msg => ({ ...msg, isRead: true }))
              this.setData({ messages, unreadTotal: 0 })
              wx.showToast({ title: '已全部已读', icon: 'success' })
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' })
            }
          }).catch(() => {
            wx.hideLoading()
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  onClearAll: function () {
    if (this.data.messages.length === 0) {
      wx.showToast({ title: '暂无消息可清空', icon: 'none' })
      return
    }

    wx.showModal({
      title: '清空消息',
      content: '确定要清空所有消息吗？此操作不可恢复。',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清空中...' })
          Cloud.callFunction('messageManager', {
            action: 'clearAll',
            type: 'all'
          }).then(res => {
            wx.hideLoading()
            const result = res.data || {}
            if (result.success) {
              this.setData({
                messages: [],
                isEmpty: true,
                unreadTotal: 0,
                hasMore: false
              })
              wx.showToast({ title: '已清空', icon: 'success' })
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' })
            }
          }).catch(() => {
            wx.hideLoading()
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  onOpenSettings: function () {
    wx.navigateTo({
      url: '/pages/notificationSettings/notificationSettings'
    })
  },

  getTabBadge: function (type) {
    if (type === 'all') return this.data.unreadTotal
    return this.data.unreadBreakdown[type] || 0
  }
})
