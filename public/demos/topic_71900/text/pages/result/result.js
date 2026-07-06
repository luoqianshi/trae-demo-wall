const app = getApp()

Page({
  data: {
    mainPersonality: {}
  },

  onLoad: function (options) {
    if (options.answers) {
      const answers = options.answers.split(',').map(a => parseInt(a))
      const result = app.calculatePersonality(answers)
      const types = app.globalData.personalityTypes
      
      this.setData({
        mainPersonality: types[result.mainType]
      })
    }
  },

  retry: function () {
    wx.navigateBack({
      delta: 2
    })
  },

  share: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    })
  },

  onShareAppMessage: function () {
    const main = this.data.mainPersonality
    return {
      title: `我是${main.name}${main.icon}，快来测测你的家居人格吧！`,
      desc: '通过9个简单问题，发现你的生活方式与空间性格',
      path: '/pages/index/index'
    }
  },

  onShareTimeline: function () {
    const main = this.data.mainPersonality
    return {
      title: `我是${main.name}${main.icon}，快来测测你的家居人格吧！`,
      query: '',
      imageUrl: ''
    }
  }
})