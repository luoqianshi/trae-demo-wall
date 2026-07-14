const app = getApp()

Page({
  data: {
    petData: [],
    filteredPets: [],
    currentFilter: 'all',
    sortBy: 'time',
    favorites: []
  },

  onLoad: function () {
    this.setData({
      petData: app.globalData.petData,
      favorites: this.getFavorites()
    })
    this.filterPets()
  },

  onShow: function () {
    this.setData({
      favorites: this.getFavorites()
    })
  },

  getFavorites: function() {
    try {
      return wx.getStorageSync('favorites') || []
    } catch (e) {
      return []
    }
  },

  saveFavorites: function(favorites) {
    try {
      wx.setStorageSync('favorites', favorites)
    } catch (e) {
      console.error('保存收藏失败', e)
    }
  },

  setFilter: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      currentFilter: type
    })
    this.filterPets()
  },

  toggleSort: function() {
    this.setData({
      sortBy: this.data.sortBy === 'time' ? 'distance' : 'time'
    })
    this.filterPets()
  },

  filterPets: function() {
    let pets = [...this.data.petData]
    
    pets = pets.filter(pet => pet.type !== 'adopt')
    
    if (this.data.currentFilter !== 'all') {
      pets = pets.filter(pet => pet.type === this.data.currentFilter)
    }

    if (this.data.sortBy === 'time') {
      pets.sort((a, b) => {
        const timeOrder = ['刚刚', '5分钟前', '10分钟前', '15分钟前', '20分钟前', '30分钟前', '1小时前', '2小时前', '3小时前', '4小时前', '5小时前', '6小时前', '8小时前', '10小时前', '12小时前', '1天前', '2天前', '3天前', '5天前']
        return timeOrder.indexOf(a.publishTime) - timeOrder.indexOf(b.publishTime)
      })
    } else {
      pets.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    }

    pets = pets.slice(0, 6).map(pet => ({
      ...pet,
      isFavorite: this.data.favorites.includes(pet.id),
      statusClass: pet.type === 'lost' ? 'lost' : (pet.type === 'found' ? 'found' : 'adopt'),
      genderIcon: pet.gender === '公' ? '♂️' : '♀️'
    }))

    this.setData({
      filteredPets: pets
    })
  },

  toggleFavorite: function(e) {
    const id = e.currentTarget.dataset.id
    let favorites = this.data.favorites
    
    if (favorites.includes(id)) {
      favorites = favorites.filter(fid => fid !== id)
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      })
    } else {
      favorites.push(id)
      wx.showToast({
        title: '已收藏',
        icon: 'success'
      })
    }
    
    this.saveFavorites(favorites)
    this.setData({
      favorites: favorites
    })
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  goToPetList: function() {
    wx.navigateTo({
      url: '/pages/petlist/petlist'
    })
  },

  goToScan: function() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  goToSearch: function() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  goToCity: function() {
    wx.switchTab({
      url: '/pages/city/city'
    })
  },

  goToPublish: function() {
    wx.showToast({
      title: '发布功能开发中',
      icon: 'none'
    })
  },

  goToAdoption: function() {
    wx.switchTab({
      url: '/pages/adoption/adoption'
    })
  },

  goToHospital: function() {
    wx.showToast({
      title: '合作医院功能开发中',
      icon: 'none'
    })
  }
})
