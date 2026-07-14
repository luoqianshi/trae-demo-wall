const app = getApp()

Page({
  data: {
    selectedTypes: [],
    selectedGenders: [],
    selectedAges: [],
    selectedFeatures: [],
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'],
    selectedCity: '',
    extraNote: '',
    dailyPush: true,
    showResult: false,
    matchResults: []
  },

  goBack: function() {
    wx.navigateBack()
  },

  toggleType: function(e) {
    const type = e.currentTarget.dataset.type
    let types = [...this.data.selectedTypes]
    if (types.includes(type)) {
      types = types.filter(t => t !== type)
    } else {
      types.push(type)
    }
    this.setData({ selectedTypes: types })
  },

  toggleGender: function(e) {
    const gender = e.currentTarget.dataset.gender
    let genders = [...this.data.selectedGenders]
    if (genders.includes(gender)) {
      genders = genders.filter(g => g !== gender)
    } else {
      genders.push(gender)
    }
    this.setData({ selectedGenders: genders })
  },

  toggleAge: function(e) {
    const age = e.currentTarget.dataset.age
    let ages = [...this.data.selectedAges]
    if (ages.includes(age)) {
      ages = ages.filter(a => a !== age)
    } else {
      ages.push(age)
    }
    this.setData({ selectedAges: ages })
  },

  toggleFeature: function(e) {
    const feature = e.currentTarget.dataset.feature
    let features = [...this.data.selectedFeatures]
    if (features.includes(feature)) {
      features = features.filter(f => f !== feature)
    } else {
      features.push(feature)
    }
    this.setData({ selectedFeatures: features })
  },

  onCityChange: function(e) {
    this.setData({
      selectedCity: this.data.cities[e.detail.value]
    })
  },

  onNoteInput: function(e) {
    this.setData({
      extraNote: e.detail.value
    })
  },

  togglePush: function(e) {
    this.setData({
      dailyPush: e.detail.value
    })
  },

  startMatch: function() {
    if (this.data.selectedTypes.length === 0 && this.data.selectedFeatures.length === 0 && !this.data.selectedCity) {
      wx.showToast({ title: '请至少设置一项偏好', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI匹配中...' })

    setTimeout(() => {
      wx.hideLoading()
      let pets = app.globalData.petData.filter(pet => pet.type === 'adopt')

      if (this.data.selectedTypes.length > 0) {
        pets = pets.filter(pet => {
          if (this.data.selectedTypes.includes('dog')) {
            const dogBreeds = ['金毛', '拉布拉多', '边牧', '贵宾', '泰迪', '萨摩耶', '比熊', '哈士奇', '柯基', '柴犬', '斗牛', '博美', '吉娃娃', '德牧', '杜宾']
            if (dogBreeds.some(b => pet.breed.includes(b))) return true
          }
          if (this.data.selectedTypes.includes('cat')) {
            const catBreeds = ['橘猫', '英短', '美短', '布偶', '波斯', '暹罗', '田园猫', '加菲', '缅因', '无毛', '渐层']
            if (catBreeds.some(b => pet.breed.includes(b))) return true
          }
          if (this.data.selectedTypes.includes('other')) return true
          return false
        })
      }

      if (this.data.selectedGenders.length > 0 && !this.data.selectedGenders.includes('不限')) {
        pets = pets.filter(pet => this.data.selectedGenders.includes(pet.gender))
      }

      if (this.data.selectedAges.length > 0) {
        pets = pets.filter(pet => {
          const ageStr = pet.age.replace(/[^0-9]/g, '')
          const ageNum = parseInt(ageStr) || 0
          if (this.data.selectedAges.includes('幼年') && ageNum < 12) return true
          if (this.data.selectedAges.includes('成年') && ageNum >= 12 && ageNum <= 60) return true
          if (this.data.selectedAges.includes('老年') && ageNum > 60) return true
          return false
        })
      }

      if (this.data.selectedCity) {
        pets = pets.filter(pet => pet.location.includes(this.data.selectedCity))
      }

      if (this.data.selectedFeatures.length > 0) {
        pets = pets.filter(pet => {
          return this.data.selectedFeatures.some(f => pet.features.includes(f) || pet.description.includes(f))
        })
      }

      this.setData({
        matchResults: pets,
        showResult: true
      })

      if (pets.length > 0) {
        wx.showToast({ title: `匹配到${pets.length}只宠物`, icon: 'success' })
      } else {
        wx.showToast({ title: '暂无符合条件的宠物', icon: 'none' })
      }
    }, 1500)
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
