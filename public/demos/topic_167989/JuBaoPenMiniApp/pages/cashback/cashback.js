Page({
  data: {
    stats: { ongoing: 8, returned: '¥2.6', pending: '¥15.8' },
    cashbacks: [
      { icon: '💰', title: '淘宝购物返现', desc: '通过聚宝盆跳转下单，享 2%~8% 返现', rate: '8%', label: '最高返现', bg: 'bg-green' },
      { icon: '🍜', title: '美团外卖返现', desc: '每笔外卖订单返现 1~3 元', rate: '¥3', label: '每笔返现', bg: 'bg-orange' },
      { icon: '📱', title: '话费充值返现', desc: '充 100 返 3，充 50 返 1.5', rate: '3%', label: '返现比例', bg: 'bg-blue' },
      { icon: '❤️', title: '信用卡还款返现', desc: '使用指定通道还款享返现', rate: '¥5', label: '固定返现', bg: 'bg-red' },
      { icon: '🎬', title: '视频会员开通返现', desc: '开通年卡会员返现最高 20 元', rate: '¥20', label: '最高返现', bg: 'bg-purple' }
    ]
  },

  onLoad() {
  },

  onTapCard(e) {
    const index = e.currentTarget.dataset.index;
    wx.showToast({
      title: '敬请期待',
      icon: 'none'
    });
  }
});
