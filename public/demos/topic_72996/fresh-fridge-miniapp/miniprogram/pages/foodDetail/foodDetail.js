const app = getApp()
const Cloud = require('../../utils/cloud.js')
const categoriesData = require('../../data/categories.js')

Page({
  data: {
    foodId: '',
    foodDetail: null,
    loading: true,
    categoryName: '',
    isSnackCategory: false,
    hasVoted: false,
    isFavorited: false,
    isWanted: false,
    isInFridge: false,
    currentImageIndex: 0
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ foodId: options.id })
      this.loadFoodDetail()
      this.checkUserStatus()
    }
  },

  onShow: function () {
    if (this.data.foodId) {
      this.checkUserStatus()
    }
  },

  onShareAppMessage: function () {
    const food = this.data.foodDetail
    return {
      title: food ? `推荐美食：${food.name}` : '食鲜冰箱',
      path: `/pages/foodDetail/foodDetail?id=${this.data.foodId}`,
      imageUrl: food && food.images && food.images[0] ? food.images[0] : ''
    }
  },

  onShareTimeline: function () {
    const food = this.data.foodDetail
    return {
      title: food ? `推荐美食：${food.name}` : '食鲜冰箱',
      imageUrl: food && food.images && food.images[0] ? food.images[0] : ''
    }
  },

  loadFoodDetail: function () {
    this.setData({ loading: true })
    Cloud.callFunction('foodCRUD', {
      action: 'detail',
      id: this.data.foodId
    }).then(res => {
      if (res.success && res.data.success) {
        const foodDetail = res.data.data
        const category = categoriesData.getCategoryById(foodDetail.category)
        const categoryName = category ? category.name : ''
        const isSnackCategory = foodDetail.category === 'snack'

        this.setData({
          foodDetail: foodDetail,
          categoryName: categoryName,
          isSnackCategory: isSnackCategory,
          loading: false
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  getUserId: function () {
    return app.globalData.openid || StorageUtils.getOpenid()
  },

  checkUserStatus: function () {
    const userId = this.getUserId()
    if (!userId) return

    const today = new Date()
    const dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()

    Cloud.query('voteRecords', {
      openid: userId,
      foodId: this.data.foodId,
      voteDate: dateStr
    }).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        this.setData({ hasVoted: true })
      }
    }).catch(err => {
      console.error('查询投票状态失败', err)
    })

    Cloud.query('favorites', {
      openid: userId,
      foodId: this.data.foodId
    }).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        this.setData({ isFavorited: true })
      }
    }).catch(err => {
      console.error('查询收藏状态失败', err)
    })

    Cloud.query('wantList', {
      userId: userId,
      foodId: this.data.foodId,
      status: 'active'
    }).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        this.setData({ isWanted: true })
      }
    }).catch(err => {
      console.error('查询想吃状态失败', err)
    })

    Cloud.query('fridge', {
      userId: userId,
      foodId: this.data.foodId,
      status: 'active'
    }).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        this.setData({ isInFridge: true })
      }
    }).catch(err => {
      console.error('查询冰箱状态失败', err)
    })
  },

  onImageChange: function (e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  onVote: function (e) {
    const voteType = e.currentTarget.dataset.type || 'general'

    if (this.data.hasVoted) {
      wx.showToast({
        title: '今天已经投过票了',
        icon: 'none'
      })
      return
    }

    Cloud.callFunction('voteFood', {
      foodId: this.data.foodId,
      voteType: voteType
    }).then(res => {
      if (res.success && res.data.success) {
        this.setData({
          hasVoted: true,
          'foodDetail.voteCount': res.data.voteCount,
          'foodDetail.mailVoteCount': res.data.mailVoteCount
        })
        wx.showToast({
          title: '投票成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.data.message || '投票失败',
          icon: 'none'
        })
      }
    }).catch(() => {
      wx.showToast({
        title: '投票失败',
        icon: 'none'
      })
    })
  },

  onToggleFavorite: function () {
    Cloud.callFunction('toggleFavorite', {
      foodId: this.data.foodId
    }).then(res => {
      if (res.success && res.data.success) {
        this.setData({
          isFavorited: res.data.isFavorited,
          'foodDetail.favoriteCount': res.data.favoriteCount
        })
        wx.showToast({
          title: res.data.message,
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.data.message || '操作失败',
          icon: 'none'
        })
      }
    }).catch(() => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onToggleWant: function () {
    Cloud.callFunction('addToWant', {
      foodId: this.data.foodId
    }).then(res => {
      if (res.success && res.data.success) {
        this.setData({
          isWanted: res.data.isWanted,
          'foodDetail.wantCount': res.data.wantCount
        })
        wx.showToast({
          title: res.data.message,
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.data.message || '操作失败',
          icon: 'none'
        })
      }
    }).catch(() => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onAddToFridge: function () {
    if (this.data.isInFridge) {
      wx.showToast({ title: '已在冰箱中', icon: 'none' })
      return
    }

    const userId = this.getUserId()
    console.log('[详情] 移入冰箱，userId:', userId, 'foodId:', this.data.foodId)

    Cloud.callFunction('addToFridge', {
      foodId: this.data.foodId,
      foodDetail: this.data.foodDetail
    }).then(res => {
      console.log('[详情] addToFridge 返回:', JSON.stringify(res, null, 2))
      
      const cloudResult = res.data || res
      console.log('[详情] 云函数实际返回:', JSON.stringify(cloudResult, null, 2))
      
      if (cloudResult.success) {
        this.setData({ isInFridge: true })
        wx.showToast({ title: cloudResult.message || '已移入冰箱', icon: 'success' })
      } else {
        const msg = cloudResult.message || '移入失败'
        console.error('[详情] 移入冰箱失败:', msg, res)
        wx.showToast({ title: msg, icon: 'none' })
      }
    }).catch(err => {
      console.error('[详情] 调用 addToFridge 异常:', err)
      wx.showToast({ title: '移入失败，请检查网络', icon: 'none' })
    })
  },

  onCopyText: function (e) {
    const text = e.currentTarget.dataset.text
    if (!text) return

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  onBack: function () {
    wx.navigateBack()
  },

  onShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onImageError: function (e) {
    const index = e.currentTarget.dataset.index
    const fallback = 'https://placehold.co/400x400/FF6B35/FFFFFF?text=Delicious+Food'
    const key = `foodDetail.images[${index}]`
    this.setData({ [key]: fallback })
  }
})
