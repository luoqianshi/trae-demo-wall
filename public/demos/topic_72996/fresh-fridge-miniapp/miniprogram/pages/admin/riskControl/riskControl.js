const Cloud = require('../../../utils/cloud.js')

const PAGE_SIZE = 10

Page({
  data: {
    tabs: [
      { id: 'abnormalVote', name: '异常投票' },
      { id: 'adLimited', name: '广告限流' }
    ],
    activeTab: 'abnormalVote',
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    isEmpty: false,
    threshold: 10
  },

  onLoad: function () {
    this.loadList(true)
  },

  onPullDownRefresh: function () {
    this.loadList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadList(false)
    }
  },

  onTabChange: function (e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeTab) return
    this.setData({ activeTab: id })
    this.loadList(true)
  },

  loadList: function (reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page + 1

    if (reset) {
      this.setData({ loading: true, isEmpty: false })
    } else {
      this.setData({ loadingMore: true })
    }

    return Cloud.callFunction('adminManager', {
      action: 'listRiskAccounts',
      type: this.data.activeTab,
      page: page,
      pageSize: PAGE_SIZE
    }).then(res => {
      const result = res.data
      if (result && result.success) {
        const newList = result.data.list
        const list = reset ? newList : [...this.data.list, ...newList]
        this.setData({
          list,
          page,
          hasMore: result.data.hasMore,
          loading: false,
          loadingMore: false,
          isEmpty: list.length === 0,
          threshold: result.data.threshold || 10
        })
      } else {
        this.setData({ loading: false, loadingMore: false, isEmpty: reset })
        wx.showToast({ title: (result && result.message) || '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false, loadingMore: false, isEmpty: reset })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onBan: function (e) {
    const item = e.currentTarget.dataset.item
    if (item.isBanned) {
      this.doRiskControl(item.openid, 'unban', '确认解封该账号？')
    } else {
      this.doRiskControl(item.openid, 'ban', `确认封禁该账号？`, '违规账号封禁')
    }
  },

  onLimitAd: function (e) {
    const item = e.currentTarget.dataset.item
    if (item.isAdLimited) {
      this.doRiskControl(item.openid, 'unlimitAd', '确认移出限流列表？')
    } else {
      this.doRiskControl(item.openid, 'limitAd', '确认加入广告限流？', '广告账号限流')
    }
  },

  onCleanVotes: function (e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '清理异常票数',
      content: `将清理该账号近7天的投票记录并扣减对应美食票数，确认操作？`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.doCleanVotes(item.openid)
        }
      }
    })
  },

  doRiskControl: function (openid, op, content, reason) {
    wx.showModal({
      title: '确认操作',
      content,
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          this.callRiskControl(openid, op, reason)
        }
      }
    })
  },

  callRiskControl: function (openid, op, reason) {
    wx.showLoading({ title: '处理中...', mask: true })
    Cloud.callFunction('adminManager', {
      action: 'riskControl',
      op,
      openid,
      reason
    }).then(res => {
      wx.hideLoading()
      const result = res.data
      if (result && result.success) {
        wx.showToast({ title: result.message || '操作成功', icon: 'success' })
        this.loadList(true)
      } else {
        wx.showToast({ title: (result && result.message) || '操作失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  doCleanVotes: function (openid) {
    wx.showLoading({ title: '清理中...', mask: true })
    Cloud.callFunction('adminManager', {
      action: 'riskControl',
      op: 'cleanVotes',
      openid,
      days: 7
    }).then(res => {
      wx.hideLoading()
      const result = res.data
      if (result && result.success) {
        wx.showToast({ title: result.message || '清理完成', icon: 'success' })
        this.loadList(true)
      } else {
        wx.showToast({ title: (result && result.message) || '清理失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '清理失败', icon: 'none' })
    })
  },

  onCopyOpenid: function (e) {
    const openid = e.currentTarget.dataset.openid
    wx.setClipboardData({
      data: openid,
      success: () => {
        wx.showToast({ title: '已复制openid', icon: 'none' })
      }
    })
  }
})
