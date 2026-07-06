const Cloud = require('../../../utils/cloud.js')

const PAGE_SIZE = 10

Page({
  data: {
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'new', name: '新投稿' },
      { id: 'correction', name: '纠错' }
    ],
    activeTab: 'all',
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    isEmpty: false,
    // 详情抽屉
    showDetail: false,
    currentItem: null,
    currentImageIndex: 0,
    // 驳回弹窗
    showReject: false,
    rejectReason: '',
    processing: false
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
      action: 'getAuditList',
      type: this.data.activeTab,
      status: 'pending',
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
          isEmpty: list.length === 0
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

  onPreviewImage: function (e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  },

  onViewDetail: function (e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showDetail: true,
      currentItem: item,
      currentImageIndex: 0
    })
  },

  onCloseDetail: function () {
    this.setData({ showDetail: false, currentItem: null })
  },

  onSwiperChange: function (e) {
    this.setData({ currentImageIndex: e.detail.current })
  },

  onApprove: function (e) {
    const item = e.currentTarget.dataset.item || this.data.currentItem
    if (!item) return

    wx.showModal({
      title: '确认审核',
      content: `确认通过「${item.name}」的审核？通过后将写入美食库。`,
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          this.doAudit(item._id, 'approve', '')
        }
      }
    })
  },

  onShowReject: function (e) {
    const item = e.currentTarget.dataset.item || this.data.currentItem
    if (!item) return
    this.setData({
      showReject: true,
      currentItem: item,
      rejectReason: ''
    })
  },

  onCloseReject: function () {
    this.setData({ showReject: false, rejectReason: '' })
  },

  onRejectInput: function (e) {
    this.setData({ rejectReason: e.detail.value })
  },

  onConfirmReject: function () {
    if (!this.data.rejectReason.trim()) {
      wx.showToast({ title: '请填写驳回原因', icon: 'none' })
      return
    }
    this.doAudit(this.data.currentItem._id, 'reject', this.data.rejectReason.trim())
  },

  doAudit: function (submissionId, action, rejectReason) {
    if (this.data.processing) return
    this.setData({ processing: true })
    wx.showLoading({ title: '处理中...', mask: true })

    Cloud.callFunction('adminManager', {
      action: 'auditSubmission',
      submissionId,
      auditAction: action,
      rejectReason
    }).then(res => {
      wx.hideLoading()
      const result = res.data
      this.setData({ processing: false })

      if (result && result.success) {
        wx.showToast({ title: result.message || '操作成功', icon: 'success' })
        // 从列表移除
        const list = this.data.list.filter(item => item._id !== submissionId)
        this.setData({
          list,
          showDetail: false,
          showReject: false,
          rejectReason: '',
          isEmpty: list.length === 0
        })
      } else {
        wx.showToast({ title: (result && result.message) || '操作失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      this.setData({ processing: false })
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  stopPropagation: function () {}
})
