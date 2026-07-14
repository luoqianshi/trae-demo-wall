// pages/profile/edit-record/edit-record.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')
const { HELP_TYPES, IDLE_CATEGORIES } = require('../../../utils/constants.js')

Page({
  data: {
    type: 'help',        // help | idle
    id: '',
    // 互助字段
    title: '',
    description: '',
    selectedType: '',
    helpTypes: HELP_TYPES,
    // 闲置字段
    name: '',
    price: '',
    selectedCategory: '',
    categories: IDLE_CATEGORIES,
    description_idle: '',
    photos: [],
    // 通用
    phone: '',
    submitting: false
  },

  onLoad(options) {
    if (options.type) this.setData({ type: options.type })
    if (options.id) this.setData({ id: options.id })
    // 从全局或上一页传参获取原始数据
    if (options.data) {
      try {
        const record = JSON.parse(decodeURIComponent(options.data))
        this.fillData(record)
      } catch (e) {
        console.error('解析数据失败', e)
      }
    }
  },

  fillData(record) {
    const contact = record.contact || {}
    const phone = contact.type === 'phone' ? (contact.value || '') : ''
    if (this.data.type === 'help') {
      this.setData({
        title: record.title || '',
        description: record.description || '',
        selectedType: record.type || '',
        phone
      })
    } else {
      this.setData({
        name: record.name || '',
        price: String(record.price || ''),
        selectedCategory: record.category || '',
        description_idle: record.description || '',
        photos: record.photos || [],
        phone
      })
    }
  },

  // ===== 互助输入 =====
  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },
  onTypeTap(e) { this.setData({ selectedType: e.currentTarget.dataset.type }) },

  // ===== 闲置输入 =====
  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onDescIdleInput(e) { this.setData({ description_idle: e.detail.value }) },
  onCategoryTap(e) { this.setData({ selectedCategory: e.currentTarget.dataset.category }) },

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

  onDeletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const photos = [...this.data.photos]
    photos.splice(index, 1)
    this.setData({ photos })
  },

  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({ current: this.data.photos[index], urls: this.data.photos })
  },

  // ===== 通用 =====
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },

  // 校验
  validate() {
    if (this.data.type === 'help') {
      if (!this.data.title.trim()) { util.showToast('请输入标题'); return false }
      if (this.data.title.length > 20) { util.showToast('标题最多20字'); return false }
      if (this.data.description.length > 200) { util.showToast('描述最多200字'); return false }
    } else {
      if (!this.data.name.trim()) { util.showToast('请输入物品名称'); return false }
      if (this.data.name.length > 20) { util.showToast('名称最多20字'); return false }
      if (!this.data.price || isNaN(this.data.price) || Number(this.data.price) < 0) {
        util.showToast('请输入有效价格'); return false
      }
      if (this.data.photos.length === 0) { util.showToast('请至少保留1张照片'); return false }
      if (this.data.description_idle.length > 200) { util.showToast('描述最多200字'); return false }
    }
    if (this.data.phone && !util.isPhone(this.data.phone)) {
      util.showToast('手机号格式不正确'); return false
    }
    return true
  },

  // 提交
  async onSubmit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    util.showLoading('保存中...')

    try {
      const contact = this.data.phone
        ? { type: 'phone', value: this.data.phone }
        : { type: 'wechat', value: '' }

      let data
      if (this.data.type === 'help') {
        data = {
          title: this.data.title.trim(),
          description: this.data.description.trim(),
          contact
        }
      } else {
        // 闲置图片：需要区分云存储fileID和本地临时路径
        const photos = await this.uploadNewPhotos()
        data = {
          name: this.data.name.trim(),
          price: Number(this.data.price),
          category: this.data.selectedCategory,
          description: this.data.description_idle.trim(),
          photos,
          contact
        }
      }

      const res = await cloud.updateRecord({
        type: this.data.type,
        id: this.data.id,
        action: 'edit',
        data
      })

      util.hideLoading()
      if (res.success) {
        util.showToast('修改成功', 'success')
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        util.showToast(res.message || '修改失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '修改失败')
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 上传新增的本地图片（fileID开头为cloud://则跳过）
  async uploadNewPhotos() {
    const result = []
    for (let i = 0; i < this.data.photos.length; i++) {
      const p = this.data.photos[i]
      if (typeof p === 'string' && p.indexOf('cloud://') === 0) {
        result.push(p)
      } else {
        const timestamp = Date.now()
        const cloudPath = `idle_items/${timestamp}_${i}.jpg`
        const fileId = await cloud.uploadFile(p, cloudPath)
        result.push(fileId)
      }
    }
    return result
  }
})
