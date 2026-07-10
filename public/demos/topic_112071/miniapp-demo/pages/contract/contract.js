Page({
  onDownload() {
    wx.showLoading({ title: '生成合同中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '下载成功', icon: 'success' })
    }, 1500)
  }
})
