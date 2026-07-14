const app = getApp()

Page({
  data: {
    petList: [],
    currentFilter: 'all',
    sortBy: 'time',
    favorites: []
  },

  onLoad: function(options) {
    try {
      const favorites = wx.getStorageSync('favorites') || []
      this.setData({
        favorites: favorites
      })
    } catch (e) {
      console.error('读取收藏失败', e)
    }
    
    this.loadPets()
  },

  loadPets: function() {
    let pets = app.globalData.petData.filter(pet => pet.type !== 'adopt')
    
    pets = pets.map(pet => ({
      ...pet,
      isFavorite: this.data.favorites.includes(pet.id),
      statusClass: pet.type === 'lost' ? 'lost' : 'found',
      genderIcon: pet.gender === '公' ? '♂️' : '♀️'
    }))

    this.setData({
      petList: pets
    })
    
    this.filterPets()
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
    let pets = app.globalData.petData.filter(pet => pet.type !== 'adopt')
    
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

    pets = pets.map(pet => ({
      ...pet,
      isFavorite: this.data.favorites.includes(pet.id),
      statusClass: pet.type === 'lost' ? 'lost' : 'found',
      genderIcon: pet.gender === '公' ? '♂️' : '♀️'
    }))

    this.setData({
      petList: pets
    })
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    })
  },

  toggleFavorite: function(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    let favorites = this.data.favorites

    if (favorites.includes(id)) {
      favorites = favorites.filter(fid => fid !== id)
    } else {
      favorites.push(id)
    }

    this.setData({
      favorites: favorites
    })

    try {
      wx.setStorageSync('favorites', favorites)
    } catch (e) {
      console.error('保存收藏失败', e)
    }

    this.filterPets()
  }
})
