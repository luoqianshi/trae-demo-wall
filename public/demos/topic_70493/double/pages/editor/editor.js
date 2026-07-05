const app = getApp()
const api = require('../../utils/api.js')

Page({
  data: {
    riverId: '',
    content: '',
    images: [],
    bottleType: 'personal',
    showTemplates: false,
    showImagePreview: false,
    previewImage: '',
    previewIndex: 0,
    templateList: [],
    templateCategories: [
      { id: 'daily', name: '日常', icon: '☀️' },
      { id: 'heart', name: '心动', icon: '💕' },
      { id: 'accompany', name: '陪伴', icon: '🤝' },
      { id: 'regret', name: '心事', icon: '💭' }
    ],
    currentCategory: 'daily'
  },

  onLoad: function (options) {
    this.setData({
      riverId: options.riverId
    })
    this.loadTemplates('daily')
  },

  loadTemplates: function (category) {
    const templates = {
      daily: [
        { content: '今天一起吃了好吃的，很开心~' },
        { content: '天气真好，适合出去走走' },
        { content: '收到了一份特别的礼物' }
      ],
      heart: [
        { content: '第一次见到你的时候，心跳加速' },
        { content: '你笑起来的样子真好看' },
        { content: '和你在一起的每一天都很幸福' }
      ],
      accompany: [
        { content: '谢谢你一直陪在我身边' },
        { content: '有你在，我什么都不怕' },
        { content: '一起走过的路，都是美好的回忆' }
      ],
      regret: [
        { content: '有些话，一直想对你说' },
        { content: '希望时间能够重来' },
        { content: '错过了一些事，但遇见你是幸运的' }
      ]
    }
    this.setData({
      templateList: templates[category] || []
    })
  },

  inputContent: function (e) {
    this.setData({
      content: e.detail.value
    })
  },

  chooseImage: function () {
    wx.chooseImage({
      count: 9 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const newImages = this.data.images.concat(res.tempFilePaths)
        this.setData({
          images: newImages.slice(0, 9)
        })
      }.bind(this)
    })
  },

  previewImage: function (e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      showImagePreview: true,
      previewImage: this.data.images[index],
      previewIndex: index
    })
  },

  closeImagePreview: function () {
    this.setData({ showImagePreview: false })
  },

  deleteImage: function (e) {
    const index = e.currentTarget.dataset.index
    const newImages = []
    this.data.images.forEach(function(img, i) {
      if (i !== index) newImages.push(img)
    })
    this.setData({
      images: newImages
    })
  },

  selectBottleType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      bottleType: type
    })
  },

  toggleTemplates: function () {
    this.setData({
      showTemplates: !this.data.showTemplates
    })
  },

  changeCategory: function (e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category
    })
    this.loadTemplates(category)
  },

  applyTemplate: function (e) {
    const template = e.currentTarget.dataset.template
    this.setData({
      content: template.content,
      showTemplates: false
    })
  },

  async submitBottle() {
    const contentTrimmed = this.data.content.replace(/^\s+|\s+$/g, '')
    if (contentTrimmed === '' && this.data.images.length === 0) {
      wx.showToast({
        title: '写下一点点细碎的美好吧',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '投放中...' })
    try {
      await api.createBottle(
        this.data.riverId,
        this.data.content,
        this.data.bottleType,
        this.data.images
      )

      wx.hideLoading()
      wx.showToast({
        title: '漂流瓶已投入长河',
        icon: 'success'
      })

      setTimeout(function() {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      })
    }
  },

  goBack: function () {
    wx.navigateBack()
  }
})