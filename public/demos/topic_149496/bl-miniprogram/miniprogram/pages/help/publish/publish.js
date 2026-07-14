// pages/help/publish/publish.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')
const { HELP_TYPES } = require('../../../utils/constants.js')

Page({
  data: {
    helpTypes: HELP_TYPES,
    selectedType: '',
    title: '',
    description: '',
    phone: '',
    community: '',
    submitting: false,
    hasPhone: false
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {}
    const community = userInfo.community || ''
    this.setData({ community })
  },

  // 选择类型
  onTypeTap(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ selectedType: type })
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  // 输入手机号
  onPhoneInput(e) {
    const phone = e.detail.value
    this.setData({ phone, hasPhone: phone.length > 0 })
  },

  // 校验
  validate() {
    if (!this.data.selectedType) {
      util.showToast('请选择互助类型')
      return false
    }
    if (!this.data.title.trim()) {
      util.showToast('请输入标题')
      return false
    }
    if (this.data.title.length > 20) {
      util.showToast('标题最多20字')
      return false
    }
    if (this.data.description.length > 200) {
      util.showToast('描述最多200字')
      return false
    }
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
      // 构造联系方式：有手机号用phone类型，没有用wechat类型（仅平台对话）
      const contact = this.data.phone
        ? { type: 'phone', value: this.data.phone }
        : { type: 'wechat', value: '' }

      const res = await cloud.publishHelp({
        type: this.data.selectedType,
        title: this.data.title.trim(),
        description: this.data.description.trim(),
        community: this.data.community,
        contact
      })

      util.hideLoading()
      if (res.success) {
        util.showToast('发布成功', 'success')
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
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
