const app = getApp()
const Cloud = require('../../utils/cloud.js')
const regionsData = require('../../data/regions.js')

Page({
  data: {
    formData: {
      name: '',
      category: '',
      images: [],
      originProvince: '',
      originCity: '',
      originDistrict: '',
      originFull: '',
      onShelfMonth: 0,
      bestTasteMonths: [],
      offShelfMonth: 0,
      priceMin: '',
      priceMax: '',
      priceUnit: '元/斤',
      tips: '',
      shopName: '',
      shopAddress: '',
      shopYears: '',
      canMail: false,
      mailPackage: '',
      expressCompanies: [],
      shelfLifeDays: '',
      shippingRule: '',
      remoteAreaShip: false,
      bossWechat: '',
      taobaoShop: '',
      pddShop: '',
      mailTips: ''
    },
    categories: [
      { id: 'seasonal_fruit', name: '时令水果', icon: '🍎' },
      { id: 'fresh_meat', name: '生鲜肉禽', icon: '🥩' },
      { id: 'grain_ingredient', name: '米面食材', icon: '🌾' },
      { id: 'snack_shop', name: '地方小吃', icon: '🍜' },
      { id: 'seasonal_dish', name: '季节限定菜品', icon: '🍲' }
    ],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    monthLabels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    priceUnits: ['元/斤', '元/个', '元/份', '元/盒', '元/袋', '元/瓶'],
    priceUnitIndex: 0,
    onShelfMonthIndex: -1,
    offShelfMonthIndex: -1,
    showRegionPicker: false,
    regionColumns: [[], [], []],
    regionIndex: [0, 0, 0],
    provinces: [],
    cities: [],
    districts: [],
    isSnackShop: false,
    showMonthPicker: false,
    currentMonthType: '',
    uploadProgress: 0,
    isUploading: false,
    isSubmitting: false,
    showSuccess: false,
    mailPackages: ['真空', '冷链', '常温'],
    mailPackageIndex: 0,
    expressOptions: ['顺丰', '京东', '中通', '圆通', '申通', '韵达', '极兔', '邮政EMS'],
    selectedExpress: []
  },

  onLoad: function (options) {
    this.initRegionData()
  },

  initRegionData: function () {
    const provinces = regionsData.getProvinces()
    let cities = []
    let districts = []

    if (provinces.length > 0) {
      cities = regionsData.getCities(provinces[0].code)
      if (cities.length > 0) {
        districts = regionsData.getDistricts(cities[0].code)
      }
    }

    const provinceNames = provinces.map(p => p.name)
    const cityNames = cities.map(c => c.name)
    const districtNames = districts.map(d => d.name)

    this.setData({
      provinces,
      cities,
      districts,
      regionColumns: [provinceNames, cityNames, districtNames]
    })
  },

  onInputName: function (e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onSelectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    const isSnackShop = categoryId === 'snack_shop'
    this.setData({
      'formData.category': categoryId,
      isSnackShop
    })
  },

  onChooseImage: function () {
    const remaining = 9 - this.data.formData.images.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath)
        this.uploadImages(tempFiles)
      }
    })
  },

  uploadImages: function (filePaths) {
    this.setData({ isUploading: true, uploadProgress: 0 })

    const uploadPromises = filePaths.map((filePath, index) => {
      const cloudPath = `submissions/${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.jpg`

      return new Promise((resolve, reject) => {
        const uploadTask = wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: filePath,
          success: (res) => resolve(res.fileID),
          fail: reject
        })

        uploadTask.onProgressUpdate((res) => {
          const totalProgress = (index + res.progress / 100) / filePaths.length * 100
          this.setData({ uploadProgress: Math.round(totalProgress) })
        })
      })
    })

    Promise.all(uploadPromises).then(fileIDs => {
      const newImages = [...this.data.formData.images, ...fileIDs]
      this.setData({
        'formData.images': newImages,
        isUploading: false,
        uploadProgress: 0
      })
    }).catch(() => {
      this.setData({ isUploading: false, uploadProgress: 0 })
      wx.showToast({ title: '图片上传失败', icon: 'none' })
    })
  },

  onDeleteImage: function (e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.formData.images]
    images.splice(index, 1)
    this.setData({
      'formData.images': images
    })
  },

  onPreviewImage: function (e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.formData.images
    wx.previewImage({
      current: images[index],
      urls: images
    })
  },

  onShowRegionPicker: function () {
    this.setData({ showRegionPicker: true })
  },

  onHideRegionPicker: function () {
    this.setData({ showRegionPicker: false })
  },

  onRegionChange: function (e) {
    const value = e.detail.value
    const [provinceIndex, cityIndex, districtIndex] = value

    const provinces = this.data.provinces
    const province = provinces[provinceIndex]

    let cities = regionsData.getCities(province.code)
    let city = cities[cityIndex] || cities[0]

    let districts = []
    if (city) {
      districts = regionsData.getDistricts(city.code)
    }

    const district = districts[districtIndex] || districts[0]

    const provinceNames = provinces.map(p => p.name)
    const cityNames = cities.map(c => c.name)
    const districtNames = districts.map(d => d.name)

    this.setData({
      cities,
      districts,
      regionColumns: [provinceNames, cityNames, districtNames],
      regionIndex: [provinceIndex, cityIndex, districtIndex]
    })
  },

  onConfirmRegion: function () {
    const [provinceIndex, cityIndex, districtIndex] = this.data.regionIndex
    const province = this.data.provinces[provinceIndex]
    const city = this.data.cities[cityIndex]
    const district = this.data.districts[districtIndex]

    const originFull = province.name + (city ? city.name : '') + (district ? district.name : '')

    this.setData({
      'formData.originProvince': province ? province.name : '',
      'formData.originCity': city ? city.name : '',
      'formData.originDistrict': district ? district.name : '',
      'formData.originFull': originFull,
      showRegionPicker: false
    })
  },

  onShowMonthPicker: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      showMonthPicker: true,
      currentMonthType: type
    })
  },

  onHideMonthPicker: function () {
    this.setData({ showMonthPicker: false })
  },

  onToggleMonth: function (e) {
    const month = e.currentTarget.dataset.month
    const type = this.data.currentMonthType
    const key = `formData.${type}`
    const selected = [...this.data.formData[type]]
    const index = selected.indexOf(month)

    if (index > -1) {
      selected.splice(index, 1)
    } else {
      selected.push(month)
      selected.sort((a, b) => a - b)
    }

    this.setData({ [key]: selected })
  },

  onConfirmMonth: function () {
    this.setData({ showMonthPicker: false })
  },

  onSingleMonthChange: function (e) {
    const type = e.currentTarget.dataset.type
    const index = Number(e.detail.value)
    const month = this.data.months[index]
    if (type === 'onShelfMonth') {
      this.setData({
        onShelfMonthIndex: index,
        'formData.onShelfMonth': month
      })
    } else if (type === 'offShelfMonth') {
      this.setData({
        offShelfMonthIndex: index,
        'formData.offShelfMonth': month
      })
    }
  },

  onInputPriceMin: function (e) {
    this.setData({
      'formData.priceMin': e.detail.value
    })
  },

  onInputPriceMax: function (e) {
    this.setData({
      'formData.priceMax': e.detail.value
    })
  },

  onPriceUnitChange: function (e) {
    const index = e.detail.value
    this.setData({
      priceUnitIndex: index,
      'formData.priceUnit': this.data.priceUnits[index]
    })
  },

  onInputTips: function (e) {
    this.setData({
      'formData.tips': e.detail.value
    })
  },

  onInputShopName: function (e) {
    this.setData({
      'formData.shopName': e.detail.value
    })
  },

  onInputShopAddress: function (e) {
    this.setData({
      'formData.shopAddress': e.detail.value
    })
  },

  onInputShopYears: function (e) {
    this.setData({
      'formData.shopYears': e.detail.value
    })
  },

  onCanMailChange: function (e) {
    this.setData({
      'formData.canMail': e.detail.value
    })
  },

  onMailPackageChange: function (e) {
    const index = e.detail.value
    this.setData({
      mailPackageIndex: index,
      'formData.mailPackage': this.data.mailPackages[index]
    })
  },

  onToggleExpress: function (e) {
    const express = e.currentTarget.dataset.express
    const selected = [...this.data.selectedExpress]
    const index = selected.indexOf(express)

    if (index > -1) {
      selected.splice(index, 1)
    } else {
      selected.push(express)
    }

    this.setData({
      selectedExpress: selected,
      'formData.expressCompanies': selected
    })
  },

  onInputShelfLife: function (e) {
    this.setData({
      'formData.shelfLifeDays': e.detail.value
    })
  },

  onInputShippingRule: function (e) {
    this.setData({
      'formData.shippingRule': e.detail.value
    })
  },

  onRemoteAreaChange: function (e) {
    this.setData({
      'formData.remoteAreaShip': e.detail.value
    })
  },

  onInputBossWechat: function (e) {
    this.setData({
      'formData.bossWechat': e.detail.value
    })
  },

  onInputTaobaoShop: function (e) {
    this.setData({
      'formData.taobaoShop': e.detail.value
    })
  },

  onInputPddShop: function (e) {
    this.setData({
      'formData.pddShop': e.detail.value
    })
  },

  onInputMailTips: function (e) {
    this.setData({
      'formData.mailTips': e.detail.value
    })
  },

  validateForm: function () {
    const data = this.data.formData

    if (!data.name.trim()) {
      wx.showToast({ title: '请输入美食名称', icon: 'none' })
      return false
    }

    if (data.images.length === 0) {
      wx.showToast({ title: '请至少上传1张图片', icon: 'none' })
      return false
    }

    if (!data.category) {
      wx.showToast({ title: '请选择品类', icon: 'none' })
      return false
    }

    if (!data.originFull) {
      wx.showToast({ title: '请选择产地', icon: 'none' })
      return false
    }

    if (!data.onShelfMonth) {
      wx.showToast({ title: '请选择上市月份', icon: 'none' })
      return false
    }

    if (data.bestTasteMonths.length === 0) {
      wx.showToast({ title: '请选择最佳赏味月份', icon: 'none' })
      return false
    }

    if (!data.offShelfMonth) {
      wx.showToast({ title: '请选择下市月份', icon: 'none' })
      return false
    }

    if (data.onShelfMonth > data.offShelfMonth) {
      wx.showToast({ title: '上市月份需早于下市月份', icon: 'none' })
      return false
    }

    if (!data.priceMin || !data.priceMax) {
      wx.showToast({ title: '请填写参考价格', icon: 'none' })
      return false
    }

    if (parseFloat(data.priceMin) > parseFloat(data.priceMax)) {
      wx.showToast({ title: '最低价不能大于最高价', icon: 'none' })
      return false
    }

    if (this.data.isSnackShop) {
      if (!data.shopName.trim()) {
        wx.showToast({ title: '请输入店铺名称', icon: 'none' })
        return false
      }
      if (!data.shopAddress.trim()) {
        wx.showToast({ title: '请输入门店地址', icon: 'none' })
        return false
      }
      if (!data.shopYears.trim()) {
        wx.showToast({ title: '请填写开业年限', icon: 'none' })
        return false
      }
      if (data.canMail) {
        if (!data.mailPackage) {
          wx.showToast({ title: '请选择邮寄包装', icon: 'none' })
          return false
        }
        if (data.expressCompanies.length === 0) {
          wx.showToast({ title: '请选择可用快递', icon: 'none' })
          return false
        }
        if (!data.shelfLifeDays) {
          wx.showToast({ title: '请填写真空保质期', icon: 'none' })
          return false
        }
        if (!data.shippingRule.trim()) {
          wx.showToast({ title: '请填写运费规则', icon: 'none' })
          return false
        }
      }
    }

    return true
  },

  onSubmit: function () {
    if (this.data.isSubmitting) return

    if (!this.validateForm()) return

    this.setData({ isSubmitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    const submitData = {
      ...this.data.formData,
      priceMin: parseFloat(this.data.formData.priceMin) || 0,
      priceMax: parseFloat(this.data.formData.priceMax) || 0,
      shopYears: parseInt(this.data.formData.shopYears) || 0,
      shelfLifeDays: parseInt(this.data.formData.shelfLifeDays) || 0
    }

    console.log('[投稿] 前端提交数据:', submitData)
    Cloud.callFunction('submitFood', { formData: submitData }).then(res => {
      wx.hideLoading()
      this.setData({ isSubmitting: false })
      console.log('[投稿] 云函数返回:', res)

      if (res.data && res.data.success) {
        this.setData({ showSuccess: true })
      } else {
        const msg = (res.data && res.data.message) || '提交失败'
        console.error('[投稿] 提交失败:', msg, res)
        wx.showToast({ title: msg, icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      this.setData({ isSubmitting: false })
      console.error('[投稿] 调用云函数异常:', err)
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    })
  },

  onViewSubmission: function () {
    this.setData({ showSuccess: false })
    wx.navigateBack()
  },

  stopPropagation: function () {}
})
