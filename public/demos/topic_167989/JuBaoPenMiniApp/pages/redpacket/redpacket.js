Page({
  data: {
    stats: { count: 12, total: '¥86', claimed: 5 },
    redpackets: [
      { icon: '🧧', title: '工商银行信用卡红包', source: '工商银行', condition: '满100元可用', amount: '¥18', limit: '限额1000份', time: '剩余 3 小时', bg: 'bg-red' },
      { icon: '🎁', title: '美团外卖随机红包', source: '美团', condition: '无门槛可用', amount: '¥3~8', limit: '不限', time: '今日 23:59 过期', bg: 'bg-orange' },
      { icon: '💰', title: '支付宝消费红包', source: '支付宝', condition: '付款时自动抵扣', amount: '¥5', limit: '每日限量', time: '剩余 8 小时', bg: 'bg-blue' },
      { icon: '🎁', title: '滴滴出行红包', source: '滴滴', condition: '快车满20可用', amount: '¥10', limit: '限量500份', time: '明天 10:00 过期', bg: 'bg-green' }
    ]
  },

  onLoad() {
  },

  claimRedpacket(e) {
    const index = e.currentTarget.dataset.index;
    wx.showToast({
      title: '领取成功',
      icon: 'success'
    });
  }
});
