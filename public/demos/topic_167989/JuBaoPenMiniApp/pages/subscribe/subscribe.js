Page({
  data: {
    subList: [
      { icon: '🍜', name: '外卖红包', count: '今日 8 个新优惠', bg: 'bg-red', on: true },
      { icon: '📱', name: '话费充值', count: '今日 3 个新优惠', bg: 'bg-green', on: true },
      { icon: '🛒', name: '网购优惠', count: '今日 12 个新优惠', bg: 'bg-blue', on: true },
      { icon: '🚀', name: '出行福利', count: '今日 2 个新优惠', bg: 'bg-orange', on: false },
      { icon: '🎬', name: '视频会员', count: '今日 4 个新优惠', bg: 'bg-purple', on: false },
      { icon: '🏠', name: '生活缴费', count: '今日 1 个新优惠', bg: 'bg-pink', on: false },
      { icon: '📦', name: '快递优惠', count: '今日 5 个新优惠', bg: 'bg-blue', on: true },
      { icon: '🏦', name: '超市折扣', count: '今日 6 个新优惠', bg: 'bg-green', on: false }
    ]
  },

  onLoad() {
  },

  goBack() {
    wx.navigateBack()
  },

  toggleSwitch(e) {
    const index = e.currentTarget.dataset.index
    const key = `subList[${index}].on`
    this.setData({
      [key]: !this.data.subList[index].on
    })
  }
})
