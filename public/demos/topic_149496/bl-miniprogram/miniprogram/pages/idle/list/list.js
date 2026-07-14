// pages/idle/list/list.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const { IDLE_CATEGORIES, PAGE_SIZE } = require('../../../utils/constants.js')

Page({
  data: {
    categories: [{ value: '', label: '全部', icon: '📋', color: '#FF6B6B', bg: '#FFF1F0' }, ...IDLE_CATEGORIES],
    selectedCategory: '',
    selectedStatus: '',
    sortBy: '',
    statusOptions: [
      { value: '', label: '全部' },
      { value: '在售', label: '在售' },
      { value: '已出售', label: '已出售' }
    ],
    sortOptions: [
      { value: '', label: '距离优先' },
      { value: 'priceAsc', label: '价格↑' },
      { value: 'priceDesc', label: '价格↓' }
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
      this.getTabBar().setData({ selected: 2 })
    }
    const userInfo = app.globalData.userInfo || {}
    let locationText = '未获取定位'
    if (userInfo.location && userInfo.location.lat) {
      locationText = `${userInfo.location.lat.toFixed(4)}, ${userInfo.location.lng.toFixed(4)}`
    }
    this.setData({ locationText })
    this.refresh()
  },

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
        type: 'idle',
        status: this.data.selectedStatus,
        category: this.data.selectedCategory,
        sortBy: this.data.sortBy,
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

  onCategoryTap(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.category })
    this.refresh()
  },

  onStatusTap(e) {
    this.setData({ selectedStatus: e.currentTarget.dataset.status })
    this.refresh()
  },

  onSortTap(e) {
    this.setData({ sortBy: e.currentTarget.dataset.sort })
    this.refresh()
  },

  onDistanceChange(e) {
    this.setData({ selectedDistanceIndex: e.detail.value })
    this.refresh()
  },

  onItemTap(e) {
    const id = e.detail.item._id
    wx.navigateTo({ url: `/pages/idle/detail/detail?id=${id}` })
  },

  goPublish() {
    if (!app.checkLogin()) return
    wx.navigateTo({ url: '/pages/idle/publish/publish' })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.setData({ page: this.data.page + 1, loadingMore: true })
      this.loadList()
    }
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  }
})
