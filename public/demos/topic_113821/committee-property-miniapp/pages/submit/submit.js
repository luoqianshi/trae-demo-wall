Page({
  data: {
    type: 'repair',
    typeOptions: [
      { key: 'repair', label: '个人报修' },
      { key: 'suggestion', label: '公共建议' }
    ],
    title: '',
    location: '',
    description: '',
    category: '',
    categoryOptions: [
      { key: 'facility', label: '设施设备' },
      { key: 'environment', label: '环境卫生' },
      { key: 'security', label: '安全秩序' },
      { key: 'parking', label: '停车管理' },
      { key: 'other', label: '其他' }
    ],
    images: []
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ type: options.type })
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ type })
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.key
    this.setData({ category })
  },

  addImage() {
    wx.chooseImage({
      count: 3 - this.data.images.length,
      success: (res) => {
        this.setData({
          images: [...this.data.images, ...res.tempFilePaths]
        })
      }
    })
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  submit() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' })
      return
    }
    if (!this.data.description.trim()) {
      wx.showToast({ title: '请填写问题描述', icon: 'none' })
      return
    }
    wx.showModal({
      title: '提交确认',
      content: '确认提交吗？提交后将进入处理流程。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '提交成功', icon: 'success' })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }, 1000)
        }
      }
    })
  }
})
