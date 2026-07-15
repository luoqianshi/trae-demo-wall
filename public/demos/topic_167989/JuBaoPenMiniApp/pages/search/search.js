Page({
  data: {
    searchTags: ['外卖红包','话费充值','电商满减','银行优惠','出行打车','视频会员','超市折扣','快递优惠券'],
    hotSearches: [
      { rank: 1, text: '支付宝消费红包', tag: '热', top: true },
      { rank: 2, text: '美团外卖满减券', tag: '新', top: true },
      { rank: 3, text: '移动话费充值优惠', tag: '', top: true },
      { rank: 4, text: '京东618满减活动', tag: '', top: false },
      { rank: 5, text: '滴滴打车红包', tag: '', top: false },
      { rank: 6, text: '爱奇艺会员特价', tag: '', top: false },
      { rank: 7, text: '拼多多百亿补贴', tag: '', top: false }
    ],
    keyword: ''
  },

  onLoad() {
  },

  onInput(e) {
    this.setData({
      keyword: e.detail.value
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      keyword: tag
    })
  },

  onHotTap(e) {
    const text = e.currentTarget.dataset.text
    this.setData({
      keyword: text
    })
  },

  onCancel() {
    this.setData({
      keyword: ''
    })
    wx.navigateBack()
  }
})
