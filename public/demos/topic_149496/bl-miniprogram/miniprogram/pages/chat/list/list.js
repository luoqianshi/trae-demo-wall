// pages/chat/list/list.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')

Page({
  data: {
    list: [],
    loading: true,
    unreadCount: 0
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    if (!app.checkLogin()) {
      this.setData({ loading: false })
      return
    }
    this.loadList()
    this.loadUnread()
  },

  async loadList() {
    try {
      const res = await cloud.getChatList()
      if (res.success) {
        const list = (res.list || []).map(item => ({
          ...item,
          timeText: util.timeAgo(item.lastTime)
        }))
        this.setData({ list, loading: false })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载会话列表失败:', err)
      this.setData({ loading: false })
    }
  },

  async loadUnread() {
    try {
      const res = await cloud.getUnreadCount()
      if (res.success) {
        this.setData({ unreadCount: res.unreadCount || 0 })
        // 更新tabBar红点
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
          const tabBar = this.getTabBar()
          const list = tabBar.data.list
          if (list[3]) {
            list[3].badge = res.unreadCount || 0
            tabBar.setData({ list })
          }
        }
      }
    } catch (err) {
      console.error('获取未读数失败:', err)
    }
  },

  // 进入聊天详情
  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    const nickname = item.otherUser.nickname || '邻居'
    const itemTitle = item.itemTitle || ''
    wx.navigateTo({
      url: `/pages/chat/detail/detail?sessionId=${item.sessionId}&toUserId=${item.otherUser._id}&toNickname=${encodeURIComponent(nickname)}&itemTitle=${encodeURIComponent(itemTitle)}`
    })
  },

  // 长按删除会话
  onItemLongPress(e) {
    const item = e.currentTarget.dataset.item
    const nickname = item.otherUser.nickname || '邻居'
    wx.showActionSheet({
      itemList: ['删除该对话'],
      itemColor: '#FF6B6B',
      success: (res) => {
        if (res.tapIndex === 0) {
          this.confirmDelete(item, nickname)
        }
      }
    })
  },

  // 确认删除
  confirmDelete(item, nickname) {
    wx.showModal({
      title: '删除对话',
      content: `确定删除与「${nickname}」的对话吗？删除后聊天记录将无法恢复。`,
      confirmText: '删除',
      confirmColor: '#FF6B6B',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return
        util.showLoading('删除中...')
        try {
          const result = await cloud.deleteChatSession({ sessionId: item.sessionId })
          util.hideLoading()
          if (result.success) {
            util.showToast('删除成功', 'success')
            this.loadList()
            this.loadUnread()
          } else {
            util.showToast(result.message || '删除失败')
          }
        } catch (err) {
          util.hideLoading()
          console.error('删除会话失败:', err)
          util.handleNetError(err, '删除失败')
        }
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadList()
    this.loadUnread()
    wx.stopPullDownRefresh()
  }
})
