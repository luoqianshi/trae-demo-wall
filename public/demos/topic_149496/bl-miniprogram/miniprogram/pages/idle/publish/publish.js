// pages/idle/publish/publish.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')
const { IDLE_CATEGORIES } = require('../../../utils/constants.js')

Page({
  data: {
    categories: IDLE_CATEGORIES,
    selectedCategory: '',
    name: '',
    price: '',
    description: '',
    phone: '',
    community: '',
    photos: [],
    submitting: false,
    hasPhone: false
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {}
    const community = userInfo.community || ''
    this.setData({ community })
  },

  // 选择分类
  onCategoryTap(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.category })
  },

  // 输入
  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },

  // 输入手机号
  onPhoneInput(e) {
    const phone = e.detail.value
    this.setData({ phone, hasPhone: phone.length > 0 })
  },

  // 选择照片
  onChoosePhoto() {
    const remaining = 3 - this.data.photos.length
    if (remaining <= 0) {
      util.showToast('最多上传3张照片')
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ photos: [...this.data.photos, ...newPhotos] })
      }
    })
  },

  // 删除照片
  onDeletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const photos = [...this.data.photos]
    photos.splice(index, 1)
    this.setData({ photos })
  },

  // 预览照片
  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({ current: this.data.photos[index], urls: this.data.photos })
  },

  // 校验
  validate() {
    if (!this.data.name.trim()) { util.showToast('请输入物品名称'); return false }
    if (this.data.name.length > 20) { util.showToast('名称最多20字'); return false }
    if (!this.data.price || isNaN(this.data.price) || Number(this.data.price) < 0) {
      util.showToast('请输入有效价格'); return false
    }
    if (this.data.photos.length === 0) { util.showToast('请至少上传1张照片'); return false }
    if (!this.data.selectedCategory) { util.showToast('请选择物品分类'); return false }
    if (this.data.description.length > 200) { util.showToast('描述最多200字'); return false }
    // 手机号可选，但填写了必须格式正确
    if (this.data.phone && !util.isPhone(this.data.phone)) {
      util.showToast('手机号格式不正确')
      return false
    }
    return true
  },

  // 提交
  async onSubmit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    util.showLoading('发布中...')

    try {
      // 上传照片到云存储
      const photoIds = []
      for (let i = 0; i < this.data.photos.length; i++) {
        const filePath = this.data.photos[i]
        const timestamp = Date.now()
        const cloudPath = `idle_items/${timestamp}_${i}.jpg`
        const fileId = await cloud.uploadFile(filePath, cloudPath)
        photoIds.push(fileId)
      }

      // 构造联系方式：有手机号用phone类型，没有用wechat类型（仅平台对话）
      const contact = this.data.phone
        ? { type: 'phone', value: this.data.phone }
        : { type: 'wechat', value: '' }

      // 调用发布云函数
      const res = await cloud.publishIdle({
        name: this.data.name.trim(),
        price: Number(this.data.price),
        photos: photoIds,
        category: this.data.selectedCategory,
        description: this.data.description.trim(),
        community: this.data.community,
        contact
      })

      util.hideLoading()
      if (res.success) {
        util.showToast('发布成功', 'success')
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        util.showToast(res.message || '发布失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '发布失败')
      console.error(err)
    } finally {
      this.setData({ submitting: false })
    }
  }
})
