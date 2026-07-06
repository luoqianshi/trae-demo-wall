const app = getApp()
const Cloud = require('../../utils/cloud.js')
const StorageUtils = require('../../utils/storage.js')
const RecommendUtils = require('../../utils/recommend.js')

Page({
  data: {
    currentMonth: new Date().getMonth() + 1,
    currentSeason: '',

    searchKeyword: '',
    showSearchBar: false,

    activeFilterTab: '',
    showFilterPanel: false,

    regionFilter: 'hometown',
    regionFilterText: '家乡',
    categoryFilter: 'all',
    categoryFilterText: '全品类',
    timeFilter: 'month',
    timeFilterText: '当月应季',

    activeTag: '',

    seasonalFoods: [],
    recommendList: [],
    leftColumn: [],
    rightColumn: [],

    page: 1,
    pageSize: 10,
    hasMore: true,
    loadingMore: false,
    isRefreshing: false,
    useFilter: false
  },

  onLoad: function (options) {
    this.setData({
      currentSeason: app.globalData.currentSeason
    })
    this.loadSeasonalFoods()
    this.loadRecommendList(true)
  },

  onShow: function () {
  },

  onPullDownRefresh: function () {
    this.setData({ isRefreshing: true, page: 1, hasMore: true })
    this.loadSeasonalFoods()
    this.loadRecommendList(true, () => {
      wx.stopPullDownRefresh()
      this.setData({ isRefreshing: false })
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadRecommendList(false)
    }
  },

  buildFilter: function () {
    const filter = {}

    if (this.data.regionFilter === 'hometown') {
      filter.region = 'hometown'
    } else if (this.data.regionFilter === 'custom') {
      filter.region = 'custom'
    }

    if (this.data.categoryFilter !== 'all' && this.data.categoryFilter !== 'seasonal') {
      filter.category = this.data.categoryFilter
    }

    filter.time = this.data.timeFilter

    if (this.data.activeTag) {
      filter.tag = this.data.activeTag
    }

    if (this.data.searchKeyword) {
      filter.keyword = this.data.searchKeyword
    }

    return filter
  },

  getSeasonMonths: function (season) {
    const seasonMap = {
      spring: [3, 4, 5],
      summer: [6, 7, 8],
      autumn: [9, 10, 11],
      winter: [12, 1, 2]
    }
    return seasonMap[season] || [this.data.currentMonth]
  },

  loadSeasonalFoods: function () {
    const query = {
      month: this.data.currentMonth
    }

    Cloud.callFunction('foodCRUD', {
      action: 'list',
      query: query,
      page: 1,
      pageSize: 6,
      sortBy: 'hotScore',
      sortOrder: 'desc'
    }).then(res => {
      if (res.success && res.data.success) {
        this.setData({
          seasonalFoods: res.data.data.list || []
        })
      }
    }).catch(() => {
    })
  },

  loadRecommendList: function (isRefresh = false, callback = null) {
    if (this.data.loadingMore) return

    const page = isRefresh ? 1 : this.data.page

    this.setData({ loadingMore: true })

    // 构建请求参数
    const params = {
      page: page,
      pageSize: this.data.pageSize,
      scene: 'home'
    }

    // 当用户主动使用筛选时，传入筛选条件覆盖个性化推荐
    if (this.data.useFilter) {
      const filter = RecommendUtils.filterOverrides(this.buildFilter(), StorageUtils.getUserPreferences())
      if (filter) {
        params.filter = filter
      }
    } else {
      // 传入用户偏好数据，用于个性化推荐
      const userPrefs = StorageUtils.getUserPreferences()
      if (userPrefs) {
        params.userPreferences = userPrefs
      }
    }

    RecommendUtils.getRecommendations(params).then(res => {
      if (res.success && res.data.success) {
        const newList = res.data.data.list || []
        const totalList = isRefresh ? newList : [...this.data.recommendList, ...newList]
        const { leftColumn, rightColumn } = this.splitIntoColumns(totalList)

        this.setData({
          recommendList: totalList,
          leftColumn: leftColumn,
          rightColumn: rightColumn,
          page: isRefresh ? 2 : this.data.page + 1,
          hasMore: res.data.data.hasMore,
          loadingMore: false
        })
      } else {
        this.setData({ loadingMore: false })
      }
      if (callback) callback()
    }).catch(() => {
      this.setData({ loadingMore: false })
      if (callback) callback()
    })
  },

  splitIntoColumns: function (list) {
    const leftColumn = []
    const rightColumn = []

    list.forEach((item, index) => {
      if (index % 2 === 0) {
        leftColumn.push(item)
      } else {
        rightColumn.push(item)
      }
    })

    return { leftColumn, rightColumn }
  },

  onSearchTap: function () {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  },

  onFilterTabTap: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (this.data.activeFilterTab === tab && this.data.showFilterPanel) {
      this.setData({
        showFilterPanel: false,
        activeFilterTab: ''
      })
    } else {
      this.setData({
        activeFilterTab: tab,
        showFilterPanel: true
      })
    }
  },

  onRegionFilterTap: function (e) {
    const value = e.currentTarget.dataset.value
    const textMap = {
      all: '全国',
      hometown: '家乡',
      custom: '自选省市'
    }
    this.setData({
      regionFilter: value,
      regionFilterText: textMap[value],
      showFilterPanel: false,
      activeFilterTab: '',
      page: 1,
      hasMore: true,
      useFilter: true
    })
    this.loadRecommendList(true)
  },

  onCategoryFilterTap: function (e) {
    const value = e.currentTarget.dataset.value
    const textMap = {
      all: '全品类',
      fruit: '时令水果',
      vegetable: '生鲜食材',
      snack: '地方小吃',
      seasonal: '季节限定'
    }
    this.setData({
      categoryFilter: value,
      categoryFilterText: textMap[value],
      showFilterPanel: false,
      activeFilterTab: '',
      page: 1,
      hasMore: true,
      useFilter: true
    })
    this.loadRecommendList(true)
  },

  onTimeFilterTap: function (e) {
    const value = e.currentTarget.dataset.value
    const textMap = {
      month: '当月应季',
      season: '当季推荐',
      week: '本周应季'
    }
    this.setData({
      timeFilter: value,
      timeFilterText: textMap[value],
      showFilterPanel: false,
      activeFilterTab: '',
      page: 1,
      hasMore: true,
      useFilter: true
    })
    this.loadRecommendList(true)
  },

  onFeatureTagTap: function (e) {
    const tag = e.currentTarget.dataset.tag
    const newTag = this.data.activeTag === tag ? '' : tag
    this.setData({
      activeTag: newTag,
      page: 1,
      hasMore: true,
      useFilter: true
    })
    this.loadRecommendList(true)
  },

  onFoodTap: function (e) {
    const foodId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/foodDetail/foodDetail?id=${foodId}`
    })
  },

  onSeasonRankTap: function () {
    wx.showToast({
      title: '敬请期待',
      icon: 'none'
    })
  },

  onRegionRankTap: function () {
    wx.showToast({
      title: '敬请期待',
      icon: 'none'
    })
  },

  onSubmitTap: function () {
    wx.navigateTo({
      url: '/pages/submit/submit'
    })
  },

  onFridgeTap: function () {
    wx.switchTab({
      url: '/pages/fridge/fridge'
    })
  },

  onImageError: function (e) {
    const id = e.currentTarget.dataset.id
    const fallback = 'https://placehold.co/300x300/FF6B35/FFFFFF?text=Food'

    const replaceImage = (list) => {
      if (!list || list.length === 0) return list
      return list.map(item => {
        if (item._id === id) {
          return { ...item, images: [fallback] }
        }
        return item
      })
    }

    this.setData({
      seasonalFoods: replaceImage(this.data.seasonalFoods),
      recommendList: replaceImage(this.data.recommendList),
      leftColumn: replaceImage(this.data.leftColumn),
      rightColumn: replaceImage(this.data.rightColumn)
    })
  }
})
