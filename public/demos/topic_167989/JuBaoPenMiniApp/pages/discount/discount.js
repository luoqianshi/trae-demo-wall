Page({
  data: {
    categories: ['全部', '外卖', '电商', '话费', '出行', '娱乐', '生活'],
    activeCategory: 0,
    discounts: [
      { emoji: '🍜', title: '饿了么超级会员月卡', price: '¥12.9', original: '¥30', badge: '57% OFF', bg: 'bg-red' },
      { emoji: '📱', title: '联通流量包 20GB', price: '¥19.9', original: '¥50', badge: '6折', bg: 'bg-green' },
      { emoji: '🛒', title: '拼多多百亿补贴专区', price: '低至3折', original: '', badge: '热卖', bg: 'bg-blue' },
      { emoji: '🎬', title: '腾讯视频季卡', price: '¥58', original: '¥98', badge: '41% OFF', bg: 'bg-orange' },
      { emoji: '🚀', title: '高德打车优惠券包', price: '¥9.9', original: '¥30', badge: '限时', bg: 'bg-purple' },
      { emoji: '🏠', title: '水电燃气缴费优惠', price: '满50减5', original: '', badge: '热门', bg: 'bg-pink' }
    ]
  },

  onLoad() {
  },

  switchCategory(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeCategory: index });
  }
});
