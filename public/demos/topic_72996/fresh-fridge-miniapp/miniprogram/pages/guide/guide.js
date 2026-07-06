const { getProvinces, getCities, getDistricts } = require('../../data/regions')
const { getAllCategories } = require('../../data/categories')
const { getAllTastes } = require('../../data/tastes')
const StorageUtils = require('../../utils/storage')

Page({
  data: {
    currentStep: 1,
    totalSteps: 3,
    provinces: [],
    provinceNames: [],
    cities: [],
    cityNames: [],
    districts: [],
    districtNames: [],
    selectedProvince: '',
    selectedCity: '',
    selectedDistrict: '',
    categories: [],
    selectedCategories: [],
    tastes: [],
    selectedTastes: [],
    loading: false
  },

  onLoad: function () {
    this.initStepData()
  },

  initStepData: function () {
    if (this.data.currentStep === 1) {
      const provinces = getProvinces()
      this.setData({ 
        provinces,
        provinceNames: provinces.map(p => p.name)
      })
    } else if (this.data.currentStep === 2) {
      const categories = getAllCategories()
      this.setData({ categories })
    } else if (this.data.currentStep === 3) {
      const tastes = getAllTastes()
      this.setData({ tastes })
    }
  },

  handleProvinceChange: function (e) {
    const provinceIndex = parseInt(e.detail.value)
    const province = this.data.provinces[provinceIndex]
    const provinceName = province ? province.name : ''
    const cities = province ? getCities(province.code) : []
    
    this.setData({
      selectedProvince: provinceName,
      selectedCity: '',
      selectedDistrict: '',
      cities: cities,
      cityNames: cities.map(c => c.name),
      districts: [],
      districtNames: []
    })
  },

  handleCityChange: function (e) {
    const cityIndex = parseInt(e.detail.value)
    const city = this.data.cities[cityIndex]
    const cityName = city ? city.name : ''
    const districts = city ? getDistricts(city.code) : []
    
    this.setData({
      selectedCity: cityName,
      selectedDistrict: '',
      districts: districts,
      districtNames: districts.map(d => d.name)
    })
  },

  handleDistrictChange: function (e) {
    const districtIndex = parseInt(e.detail.value)
    const district = this.data.districts[districtIndex]
    const districtName = district ? district.name : ''
    
    this.setData({
      selectedDistrict: districtName
    })
  },

  toggleCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    const selectedCategories = [...this.data.selectedCategories]
    const index = selectedCategories.indexOf(categoryId)
    
    if (index === -1) {
      selectedCategories.push(categoryId)
    } else {
      selectedCategories.splice(index, 1)
    }
    
    this.setData({ selectedCategories })
  },

  toggleTaste: function (e) {
    const tasteId = e.currentTarget.dataset.id
    const selectedTastes = [...this.data.selectedTastes]
    const index = selectedTastes.indexOf(tasteId)
    
    if (index === -1) {
      selectedTastes.push(tasteId)
    } else {
      selectedTastes.splice(index, 1)
    }
    
    this.setData({ selectedTastes })
  },

  nextStep: function () {
    if (this.data.currentStep === 1) {
      if (!this.data.selectedProvince) {
        wx.showToast({ title: '请选择省份', icon: 'none' })
        return
      }
      if (!this.data.selectedCity) {
        wx.showToast({ title: '请选择城市', icon: 'none' })
        return
      }
      this.setData({ currentStep: 2 })
      this.initStepData()
    } else if (this.data.currentStep === 2) {
      if (this.data.selectedCategories.length === 0) {
        wx.showToast({ title: '请至少选择一个美食类别', icon: 'none' })
        return
      }
      this.setData({ currentStep: 3 })
      this.initStepData()
    } else if (this.data.currentStep === 3) {
      if (this.data.selectedTastes.length === 0) {
        wx.showToast({ title: '请至少选择一个口味偏好', icon: 'none' })
        return
      }
      this.completeGuide()
    }
  },

  completeGuide: function () {
    this.setData({ loading: true })
    
    const openid = StorageUtils.getOpenid()
    
    const userData = {
      openid: openid,
      region: {
        province: this.data.selectedProvince,
        city: this.data.selectedCity,
        district: this.data.selectedDistrict
      },
      categories: this.data.selectedCategories,
      tastes: this.data.selectedTastes
    }
    
    StorageUtils.setRegion(userData.region)
    StorageUtils.setPreferences({
      tastes: this.data.selectedTastes,
      categories: this.data.selectedCategories,
      notification: true
    })
    StorageUtils.setGuideCompleted(true)
    
    wx.cloud.callFunction({
      name: 'saveUserPreferences',
      data: userData,
      success: (res) => {
        console.log('保存用户偏好成功', res)
        this.navigateToHome()
      },
      fail: (err) => {
        console.error('保存用户偏好失败', err)
        this.navigateToHome()
      }
    })
  },

  navigateToHome: function () {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },

  getStepTitle: function () {
    const titles = ['选择家乡地区', '选择爱吃美食', '选择口味偏好']
    return titles[this.data.currentStep - 1] || ''
  },

  getStepDescription: function () {
    const descriptions = [
      '告诉我们您来自哪里，以便推荐当地特色食材',
      '选择您喜欢的美食类别，我们会为您推荐相关食材',
      '选择您的口味偏好，让推荐更符合您的口味'
    ]
    return descriptions[this.data.currentStep - 1] || ''
  },

  getProgressWidth: function () {
    return `${(this.data.currentStep / this.data.totalSteps) * 100}%`
  },

  isCategorySelected: function (categoryId) {
    return this.data.selectedCategories.indexOf(categoryId) !== -1
  },

  isTasteSelected: function (tasteId) {
    return this.data.selectedTastes.indexOf(tasteId) !== -1
  }
})