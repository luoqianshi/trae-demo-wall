const app = getApp()
const Cloud = require('../../utils/cloud.js')
const Storage = require('../../utils/storage.js')
const categoriesData = require('../../data/categories.js')

Page({
  data: {
    userInfo: null,
    userPreferences: null,
    stats: {
      totalSaved: 0,
      totalExpired: 0,
      fridgeCount: 0,
      voteCount: 0
    },
    tasteBoard: {
      monthPurchased: 0,
      expiredWaste: 0,
      favoriteTags: [],
      categories: []
    },
    menuItems: [
      { id: 'fridge', name: '我的冰箱', icon: '🥶', badge: 0 },
      { id: 'submissions', name: '我的投稿', icon: '📝', badge: 0 },
      { id: 'votes', name: '我的投票', icon: '🗳️', badge: 0 },
      { id: 'messages', name: '消息通知', icon: '🔔', badge: 0 },
      { id: 'settings', name: '设置', icon: '⚙️', badge: 0 },
      { id: 'help', name: '帮助中心', icon: '❓', badge: 0 }
    ],
    showEditModal: false
  },

  onLoad: function (options) {
    this.loadUserInfo()
    this.loadUserPreferences()
    this.loadStats()
    this.loadTasteBoard()
  },

  onShow: function () {
    this.loadUserInfo()
    this.loadUserPreferences()
    this.loadStats()
    this.loadTasteBoard()
  },

  loadUserInfo: function () {
    const userInfo = Storage.getUserInfo()
    this.setData({ userInfo })
  },

  loadUserPreferences: function () {
    const userId = app.globalData.openid || Storage.getOpenid()
    if (!userId) return

    Cloud.query('userPreferences', { userId: userId }).then(res => {
      if (res.success && res.data.length > 0) {
        this.setData({ userPreferences: res.data[0] })
      }
    }).catch(() => {})
  },

  loadStats: function () {
    const userId = app.globalData.openid || Storage.getOpenid()
    if (!userId) return

    Cloud.query('users', { openid: userId }).then(res => {
      if (res.success && res.data.length > 0) {
        const user = res.data[0]
        this.setData({
          stats: {
            ...this.data.stats,
            totalSaved: user.totalSaved || 0,
            totalExpired: user.totalExpired || 0,
            voteCount: Storage.getVoteRecords().length
          }
        })
      }
    }).catch(() => {})

    Cloud.query('fridge', { userId: userId, status: 'active' }).then(res => {
      if (res.success) {
        this.setData({
          'stats.fridgeCount': res.data.length
        })
      }
    }).catch(() => {})

    Cloud.query('messages', { userId: userId, isRead: false, isDeleted: false }).then(res => {
      if (res.success) {
        this.setData({
          'menuItems[3].badge': res.data.length
        })
      }
    }).catch(() => {})
  },

  loadTasteBoard: function () {
    const userId = app.globalData.openid || Storage.getOpenid()
    if (!userId) return

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    Cloud.query('fridge', { 
      userId: userId,
      status: 'active'
    }).then(res => {
      if (res.success) {
        const items = res.data
        const monthItems = items.filter(item => {
          const createTime = new Date(item.createTime)
          return createTime >= startOfMonth
        })

        const expiredItems = items.filter(item => {
          const expireDate = new Date(item.expireDate)
          return expireDate < now
        })

        const categoryMap = {}
        monthItems.forEach(item => {
          const cat = item.category || 'other'
          if (!categoryMap[cat]) {
            categoryMap[cat] = 0
          }
          categoryMap[cat]++
        })

        const allCategories = categoriesData.getAllCategories()
        const categories = Object.keys(categoryMap).map(catId => {
          const catInfo = allCategories.find(c => c.id === catId)
          return {
            name: catInfo ? catInfo.name : catId,
            icon: catInfo ? catInfo.icon : '🍽️',
            count: categoryMap[catId]
          }
        }).sort((a, b) => b.count - a.count).slice(0, 8)

        let favoriteTags = []
        const prefs = this.data.userPreferences
        if (prefs) {
          if (prefs.tasteTags) {
            favoriteTags = prefs.tasteTags.slice(0, 6)
          }
          if (prefs.favoriteCategories && prefs.favoriteCategories.length > 0) {
            prefs.favoriteCategories.forEach(catId => {
              const catInfo = allCategories.find(c => c.id === catId)
              if (catInfo && favoriteTags.length < 8) {
                favoriteTags.push(catInfo.name)
              }
            })
          }
        }

        this.setData({
          tasteBoard: {
            monthPurchased: monthItems.length,
            expiredWaste: expiredItems.length,
            favoriteTags,
            categories
          }
        })
      }
    }).catch(() => {})
  },

  onGoPreferences: function () {
    wx.navigateTo({
      url: '/pages/preferences/preferences'
    })
  },

  onMenuTap: function (e) {
    const menuId = e.currentTarget.dataset.id
    switch (menuId) {
      case 'fridge':
        wx.switchTab({ url: '/pages/fridge/fridge' })
        break
      case 'submissions':
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break
      case 'votes':
        wx.switchTab({ url: '/pages/vote/vote' })
        break
      case 'messages':
        wx.navigateTo({ url: '/pages/messages/messages' })
        break
      case 'settings':
        wx.navigateTo({ url: '/pages/notificationSettings/notificationSettings' })
        break
      case 'help':
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break
    }
  },

  onEditProfile: function () {
    this.setData({ showEditModal: true })
  },

  onCloseModal: function () {
    this.setData({ showEditModal: false })
  },

  onSaveProfile: function () {
    wx.showToast({ title: '保存成功', icon: 'success' })
    this.setData({ showEditModal: false })
  },

  onLogout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Storage.clear()
          app.globalData.userInfo = null
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  }
})
