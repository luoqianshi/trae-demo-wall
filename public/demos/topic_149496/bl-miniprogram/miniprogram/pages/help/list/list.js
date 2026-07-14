// pages/help/list/list.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const { HELP_TYPES, PAGE_SIZE } = require('../../../utils/constants.js')

Page({
  data: {
    helpTypes: [{ value: '', label: '全部', icon: '📋', color: '#1890FF', bg: '#E6F4FF' }, ...HELP_TYPES],
    selectedType: '',
    selectedStatus: '',
    statusOptions: [
      { value: '', label: '全部' },
      { value: '待帮助', label: '待帮助' },
      { value: '已完成', label: '已完成' }
    ],
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    distanceOptions: [
      { value: 3, label: '3公里' },
      { value: 5, label: '5公里' },
      { value: 10, label: '10公里' },
      { value: 50, label: '50公里' }
    ],
    selectedDistanceIndex: 2,
    locationText: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    const userInfo = app.globalData.userInfo || {}
    let locationText = '未获取定位'
    if (userInfo.location && userInfo.location.lat) {
      locationText = `${userInfo.location.lat.toFixed(4)}, ${userInfo.location.lng.toFixed(4)}`
    }
    this.setData({ locationText })
    this.refresh()
  },

  // 刷新
  refresh() {
    this.setData({ page: 1, list: [], hasMore: true })
    this.loadList()
  },

  async loadList() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const userLocation = app.globalData.userInfo && app.globalData.userInfo.location
      const maxDistance = this.data.distanceOptions[this.data.selectedDistanceIndex].value
      const res = await cloud.getList({
        type: 'help',
        status: this.data.selectedStatus,
        helpType: this.data.selectedType,
        page: this.data.page,
        pageSize: PAGE_SIZE,
        maxDistance,
        userLocation
      })

      if (res.success) {
        this.setData({
          list: this.data.page === 1 ? res.list : [...this.data.list, ...res.list],
          hasMore: res.hasMore,
          loading: false,
          loadingMore: false
        })
      } else {
        this.setData({ loading: false, loadingMore: false })
      }
    } catch (err) {
      console.error('加载列表失败:', err)
      this.setData({ loading: false, loadingMore: false })
    }
  },

  // 选择类型
  onTypeTap(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ selectedType: type })
    this.refresh()
  },

  // 选择状态
  onStatusTap(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ selectedStatus: status })
    this.refresh()
  },

  // 选择距离
  onDistanceChange(e) {
    this.setData({ selectedDistanceIndex: e.detail.value })
    this.refresh()
  },

  // 查看详情
  onItemTap(e) {
    const id = e.detail.item._id
    wx.navigateTo({ url: `/pages/help/detail/detail?id=${id}` })
  },

  // 发布
  goPublish() {
    if (!app.checkLogin()) return
    wx.navigateTo({ url: '/pages/help/publish/publish' })
  },

  // 加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({
        page: this.data.page + 1,
        loadingMore: true
      })
      this.loadList()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  }
})
