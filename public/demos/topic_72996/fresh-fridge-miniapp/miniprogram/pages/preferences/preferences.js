const app = getApp()
const Cloud = require('../../utils/cloud.js')
const Storage = require('../../utils/storage.js')
const categoriesData = require('../../data/categories.js')
const tastesData = require('../../data/tastes.js')
const regionsData = require('../../data/regions.js')

Page({
  data: {
    hometown: '',
    categories: [],
    selectedCategories: [],
    tastes: [],
    selectedTastes: [],
    showRegionPicker: false,
    regionValue: [0, 0],
    provinces: [],
    cities: [],
    selectedProvinceIndex: 0,
    selectedCityIndex: 0,
    canSave: false
  },

  onLoad: function (options) {
    this.initData()
    this.loadPreferences()
  },

  initData: function () {
    const categories = categoriesData.getAllCategories().slice(0, 8)
    const tastes = tastesData.getAllTastes()
    const provinces = regionsData.getProvinces()
    const cities = provinces.length > 0 ? regionsData.getCities(provinces[0].code) : []

    this.setData({
      categories,
      tastes,
      provinces,
      cities
    })
  },

  loadPreferences: function () {
    const userId = app.globalData.openid || Storage.getOpenid()
    if (!userId) return

    Cloud.query('userPreferences', { userId: userId }).then(res => {
      if (res.success && res.data.length > 0) {
        const prefs = res.data[0]
        
        let provinceIndex = 0
        let cityIndex = 0
        if (prefs.provinceCode) {
          provinceIndex = this.data.provinces.findIndex(p => p.code === prefs.provinceCode)
          if (provinceIndex < 0) provinceIndex = 0
          const cities = regionsData.getCities(this.data.provinces[provinceIndex].code)
          cityIndex = cities.findIndex(c => c.code === prefs.cityCode)
          if (cityIndex < 0) cityIndex = 0
          
          this.setData({
            cities,
            selectedProvinceIndex: provinceIndex,
            selectedCityIndex: cityIndex,
            regionValue: [provinceIndex, cityIndex]
          })
        }

        this.setData({
          hometown: prefs.hometown || '',
          selectedCategories: prefs.favoriteCategories || [],
          selectedTastes: prefs.tastePreferences || []
        })

        this.checkCanSave()
      }
    }).catch(() => {})
  },

  onShowRegionPicker: function () {
    this.setData({ showRegionPicker: true })
  },

  onHideRegionPicker: function () {
    this.setData({ showRegionPicker: false })
  },

  onRegionChange: function (e) {
    const value = e.detail.value
    const provinceIndex = value[0]
    const cityIndex = value[1]
    
    if (provinceIndex !== this.data.selectedProvinceIndex) {
      const province = this.data.provinces[provinceIndex]
      const cities = regionsData.getCities(province.code)
      this.setData({
        cities,
        selectedProvinceIndex: provinceIndex,
        selectedCityIndex: 0,
        regionValue: [provinceIndex, 0]
      })
    } else {
      this.setData({
        selectedCityIndex: cityIndex,
        regionValue: value
      })
    }
  },

  onConfirmRegion: function () {
    const province = this.data.provinces[this.data.selectedProvinceIndex]
    const city = this.data.cities[this.data.selectedCityIndex]
    const hometown = province.name + (city ? ' ' + city.name : '')
    
    this.setData({
      hometown,
      showRegionPicker: false
    })
    
    this.checkCanSave()
  },

  onToggleCategory: function (e) {
    const id = e.currentTarget.dataset.id
    const selected = [...this.data.selectedCategories]
    const index = selected.indexOf(id)
    
    if (index > -1) {
      selected.splice(index, 1)
    } else {
      if (selected.length >= 5) {
        wx.showToast({ title: '最多选5个', icon: 'none' })
        return
      }
      selected.push(id)
    }
    
    this.setData({ selectedCategories: selected })
    this.checkCanSave()
  },

  onToggleTaste: function (e) {
    const id = e.currentTarget.dataset.id
    const selected = [...this.data.selectedTastes]
    const index = selected.indexOf(id)
    
    if (index > -1) {
      selected.splice(index, 1)
    } else {
      if (selected.length >= 3) {
        wx.showToast({ title: '最多选3个', icon: 'none' })
        return
      }
      selected.push(id)
    }
    
    this.setData({ selectedTastes: selected })
    this.checkCanSave()
  },

  checkCanSave: function () {
    const canSave = this.data.hometown && 
                   this.data.selectedCategories.length > 0 && 
                   this.data.selectedTastes.length > 0
    this.setData({ canSave })
  },

  onSave: function () {
    if (!this.data.canSave) {
      wx.showToast({ title: '请完善偏好设置', icon: 'none' })
      return
    }

    const userId = app.globalData.openid || Storage.getOpenid()
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const province = this.data.provinces[this.data.selectedProvinceIndex]
    const city = this.data.cities[this.data.selectedCityIndex]

    const tasteTags = this.data.selectedTastes.map(tasteId => {
      const taste = tastesData.getTasteById(tasteId)
      return taste ? taste.name : ''
    }).filter(t => t)

    const saveData = {
      userId: userId,
      hometown: this.data.hometown,
      provinceCode: province ? province.code : '',
      cityCode: city ? city.code : '',
      favoriteCategories: this.data.selectedCategories,
      tastePreferences: this.data.selectedTastes,
      tasteTags: tasteTags,
      updateTime: new Date()
    }

    wx.showLoading({ title: '保存中...' })

    let existingId = null
    Cloud.query('userPreferences', { userId: userId }).then(res => {
      if (res.success && res.data.length > 0) {
        existingId = res.data[0]._id
        return Cloud.update('userPreferences', existingId, saveData)
      } else {
        return Cloud.add('userPreferences', saveData)
      }
    }).then(addResult => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      
      const prefs = {
        ...saveData,
        _id: existingId || (addResult.data ? addResult.data._id : null)
      }
      Storage.setUserPreferences(prefs)
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  stopPropagation: function () {}
})
