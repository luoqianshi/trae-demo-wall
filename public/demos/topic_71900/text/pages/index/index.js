const app = getApp()

Page({
  data: {},

  onLoad: function () {},

  goToSurvey: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/survey/survey?id=${id}`
    })
  }
})