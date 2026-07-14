const app = getApp()

Page({
  data: {
    petTypes: ['狗狗', '猫咪', '其他'],
    genders: ['公', '母'],
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'],
    showOtherPetType: false,
    formData: {
      name: '',
      petType: '',
      otherPetType: '',
      gender: '',
      breed: '',
      age: '',
      city: '',
      image: '',
      description: '',
      features: [],
      requirement: ''
    }
  },

  goBack: function() {
    wx.navigateBack()
  },

  onNameInput: function(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onPetTypeChange: function(e) {
    const type = this.data.petTypes[e.detail.value]
    this.setData({
      'formData.petType': type,
      showOtherPetType: type === '其他',
      'formData.otherPetType': ''
    })
  },

  onOtherPetTypeInput: function(e) {
    this.setData({
      'formData.otherPetType': e.detail.value
    })
  },

  onGenderChange: function(e) {
    this.setData({
      'formData.gender': this.data.genders[e.detail.value]
    })
  },

  onBreedInput: function(e) {
    this.setData({
      'formData.breed': e.detail.value
    })
  },

  onAgeInput: function(e) {
    this.setData({
      'formData.age': e.detail.value
    })
  },

  onCityChange: function(e) {
    this.setData({
      'formData.city': this.data.cities[e.detail.value]
    })
  },

  chooseImage: function() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'formData.image': res.tempFilePaths[0]
        })
      }
    })
  },

  onDescriptionInput: function(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  toggleFeature: function(e) {
    const feature = e.currentTarget.dataset.feature
    let features = [...this.data.formData.features]
    
    if (features.includes(feature)) {
      features = features.filter(f => f !== feature)
    } else {
      features.push(feature)
    }
    
    this.setData({
      'formData.features': features
    })
  },

  onRequirementInput: function(e) {
    this.setData({
      'formData.requirement': e.detail.value
    })
  },

  submitForm: function() {
    const form = this.data.formData
    
    if (!form.name) {
      wx.showToast({ title: '请输入宠物名称', icon: 'none' })
      return
    }
    if (!form.petType) {
      wx.showToast({ title: '请选择宠物类型', icon: 'none' })
      return
    }
    if (!form.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }
    if (!form.breed) {
      wx.showToast({ title: '请输入品种', icon: 'none' })
      return
    }
    if (!form.city) {
      wx.showToast({ title: '请选择城市', icon: 'none' })
      return
    }

    wx.showLoading({
      title: '发布中...'
    })

    setTimeout(() => {
      wx.hideLoading()
      
      wx.showToast({
        title: '发布成功！',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1500)
  }
})
