const app = getApp()

Page({
  data: {
    uploadImage: '',
    petTypes: ['全部类型', '狗狗', '猫咪', '其他'],
    timeOptions: ['不限时间', '1天内', '3天内', '1周内', '1个月内', '3个月内'],
    cities: ['选择城市', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'],
    areas: ['选择区域', '朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区', '顺义区', '昌平区'],
    selectedPetType: '',
    selectedTime: '',
    selectedCity: '',
    selectedArea: '',
    locationDetail: '',
    selectedFeatures: [],
    showOther: false,
    otherFeature: '',
    showOtherPetType: false,
    otherPetType: '',
    description: '',
    showResults: false,
    searchResults: []
  },

  goBack: function() {
    wx.navigateBack()
  },

  chooseImage: function() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          uploadImage: res.tempFilePaths[0]
        })
      },
      fail: (err) => {
        console.error('选择图片失败', err)
      }
    })
  },

  clearImage: function() {
    this.setData({
      uploadImage: ''
    })
  },

  onPetTypeChange: function(e) {
    const type = this.data.petTypes[e.detail.value]
    this.setData({
      selectedPetType: type,
      showOtherPetType: type === '其他',
      otherPetType: ''
    })
  },

  onOtherPetTypeInput: function(e) {
    this.setData({
      otherPetType: e.detail.value
    })
  },

  onTimeChange: function(e) {
    this.setData({
      selectedTime: this.data.timeOptions[e.detail.value]
    })
  },

  onCityChange: function(e) {
    this.setData({
      selectedCity: this.data.cities[e.detail.value]
    })
  },

  onAreaChange: function(e) {
    this.setData({
      selectedArea: this.data.areas[e.detail.value]
    })
  },

  onLocationInput: function(e) {
    this.setData({
      locationDetail: e.detail.value
    })
  },

  toggleFeature: function(e) {
    const feature = e.currentTarget.dataset.feature
    let features = [...this.data.selectedFeatures]
    
    if (features.includes(feature)) {
      features = features.filter(f => f !== feature)
    } else {
      features.push(feature)
    }
    
    this.setData({
      selectedFeatures: features
    })
  },

  showOtherInput: function() {
    this.setData({
      showOther: !this.data.showOther
    })
  },

  onOtherInput: function(e) {
    this.setData({
      otherFeature: e.detail.value
    })
  },

  onDescriptionInput: function(e) {
    this.setData({
      description: e.detail.value
    })
  },

  clearAll: function() {
    this.setData({
      uploadImage: '',
      selectedPetType: '',
      selectedTime: '',
      selectedCity: '',
      selectedArea: '',
      locationDetail: '',
      selectedFeatures: [],
      showOther: false,
      otherFeature: '',
      showOtherPetType: false,
      otherPetType: '',
      description: '',
      showResults: false,
      searchResults: []
    })
  },

  aiAnalyze: function() {
    wx.showLoading({
      title: 'AI分析中...'
    })

    setTimeout(() => {
      wx.hideLoading()

      let results = app.globalData.petData.filter(pet => pet.type !== 'adopt')

      if (this.data.selectedPetType && this.data.selectedPetType !== '全部类型') {
        const typeMap = { '狗狗': ['金毛寻回犬', '拉布拉多', '边境牧羊犬', '萨摩耶', '贵宾犬'], '猫咪': ['橘猫', '英短', '田园猫'] }
        results = results.filter(pet => typeMap[this.data.selectedPetType]?.includes(pet.breed))
      }

      if (this.data.selectedCity && this.data.selectedCity !== '选择城市') {
        results = results.filter(pet => pet.location.includes(this.data.selectedCity))
      }

      if (this.data.selectedArea && this.data.selectedArea !== '选择区域') {
        results = results.filter(pet => pet.location.includes(this.data.selectedArea))
      }

      if (this.data.locationDetail) {
        results = results.filter(pet => pet.location.includes(this.data.locationDetail))
      }

      if (this.data.description) {
        const desc = this.data.description.toLowerCase()
        results = results.filter(pet => 
          pet.description.toLowerCase().includes(desc) ||
          pet.name.toLowerCase().includes(desc) ||
          pet.breed.toLowerCase().includes(desc)
        )
      }

      results = results.slice(0, 10)

      this.setData({
        searchResults: results,
        showResults: true
      })

      wx.showToast({
        title: `找到 ${results.length} 条匹配结果`,
        icon: 'success'
      })
    }, 1500)
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
