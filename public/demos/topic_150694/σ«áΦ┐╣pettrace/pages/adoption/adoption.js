const app = getApp()

Page({
  data: {
    currentType: 'all',
    adoptedPets: []
  },

  onLoad: function () {
    this.filterPets()
  },

  setType: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      currentType: type
    })
    this.filterPets()
  },

  filterPets: function() {
    let pets = app.globalData.petData.filter(pet => pet.type === 'adopt')
    
    if (this.data.currentType === 'dog') {
      pets = pets.filter(pet => this.isDogBreed(pet.breed))
    } else if (this.data.currentType === 'cat') {
      pets = pets.filter(pet => this.isCatBreed(pet.breed))
    }
    
    pets = pets.map(pet => ({
      ...pet,
      genderIcon: pet.gender === '公' ? '♂️' : '♀️'
    }))
    
    this.setData({
      adoptedPets: pets
    })
  },

  isDogBreed: function(breed) {
    const dogBreeds = ['金毛', '拉布拉多', '边牧', '贵宾', '泰迪', '萨摩耶', '比熊', '哈士奇', '柯基', '柴犬', '斗牛', '博美', '吉娃娃', '德牧', '杜宾']
    return dogBreeds.some(b => breed.includes(b))
  },

  isCatBreed: function(breed) {
    const catBreeds = ['橘猫', '英短', '美短', '布偶', '波斯', '暹罗', '田园猫', '加菲', '缅因', '无毛', '渐层']
    return catBreeds.some(b => breed.includes(b))
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  goToPublish: function() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  },

  goToPreference: function() {
    wx.navigateTo({
      url: '/pages/preference/preference'
    })
  }
})
