Page({
  onMenuTap(e) {
    const page = e.currentTarget.dataset.page
    const urls = {
      myhouses: '/pages/myhouses/myhouses',
      chat: '/pages/chat/chat',
      contract: '/pages/contract/contract',
      guide: '/pages/guide/guide'
    }
    if (urls[page]) {
      wx.navigateTo({ url: urls[page] })
    }
  }
})
