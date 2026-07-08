// pages/market-publish/market-publish.js
Page({
  data: {
    images: [], // 已上传的图片列表
    categories: ['健身器材', '运动服饰', '营养补剂', '其他'],
    conditions: ['全新', '9成新', '8成新', '7成新'],
    categoryIndex: null,
    conditionIndex: null,
    formData: {
      name: '',
      price: '',
      category: '',
      condition: '',
      description: '',
      wechat: ''
    }
  },

  onLoad() {
    // 页面加载时的初始化逻辑
  },

  // 选择图片
  chooseImage() {
    const maxCount = 9 - this.data.images.length
    if (maxCount <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...this.data.images, ...res.tempFilePaths]
        this.setData({
          images: newImages
        })
      },
      fail: (err) => {
        console.log('选择图片失败', err)
      }
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 商品名称输入
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  // 商品价格输入
  onPriceInput(e) {
    this.setData({
      'formData.price': e.detail.value
    })
  },

  // 商品分类选择
  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    })
  },

  // 商品成色选择
  onConditionChange(e) {
    const index = e.detail.value
    this.setData({
      conditionIndex: index,
      'formData.condition': this.data.conditions[index]
    })
  },

  // 商品描述输入
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  // 微信号输入
  onWechatInput(e) {
    this.setData({
      'formData.wechat': e.detail.value
    })
  },

  // 表单验证
  validateForm() {
    const { formData, images } = this.data

    if (images.length === 0) {
      wx.showToast({
        title: '请至少上传一张商品图片',
        icon: 'none'
      })
      return false
    }

    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      })
      return false
    }

    if (!formData.price.trim()) {
      wx.showToast({
        title: '请输入商品价格',
        icon: 'none'
      })
      return false
    }

    if (!formData.category) {
      wx.showToast({
        title: '请选择商品分类',
        icon: 'none'
      })
      return false
    }

    if (!formData.condition) {
      wx.showToast({
        title: '请选择商品成色',
        icon: 'none'
      })
      return false
    }

    if (!formData.wechat.trim()) {
      wx.showToast({
        title: '请输入微信号',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 发布商品
  publishProduct() {
    if (!this.validateForm()) {
      return
    }

    const { formData, images } = this.data

    // 构建商品数据
    const productData = {
      id: Date.now(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      condition: formData.condition,
      description: formData.description,
      wechat: formData.wechat,
      images: images,
      createTime: new Date().toISOString(),
      status: 'active'
    }

    // Mock保存到本地存储
    try {
      let products = wx.getStorageSync('market_products') || []
      products.unshift(productData)
      wx.setStorageSync('market_products', products)

      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 2000
      })

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    } catch (error) {
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      })
      console.error('保存商品失败:', error)
    }
  }
})