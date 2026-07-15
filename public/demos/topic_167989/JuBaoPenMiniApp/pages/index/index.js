Page({
  data: {
    activePicksTab: 0,
    picksTabs: ['红包', '返现', '优惠'],
    quickNavs: [
      { icon: '\ud83e\udde7', name: '今日红包', bg: 'bg-red', url: '/pages/redpacket/redpacket' },
      { icon: '\ud83d\udcb0', name: '优惠折扣', bg: 'bg-green', url: '/pages/discount/discount' },
      { icon: '\ud83d\udcb3', name: '返现活动', bg: 'bg-orange', url: '/pages/cashback/cashback' },
      { icon: '\u2b50', name: '我的关注', bg: 'bg-purple', url: '/pages/subscribe/subscribe' },
      { icon: '\ud83d\udcf1', name: '话费充值', bg: 'bg-blue', url: '' },
      { icon: '\ud83c\udf5c', name: '外卖红包', bg: 'bg-pink', url: '' },
      { icon: '\ud83d\uded2', name: '网购优惠', bg: 'bg-green', url: '' },
      { icon: '\ud83d\ude80', name: '出行福利', bg: 'bg-orange', url: '' }
    ],
    coupons: [
      { value: 15, platform: '美团外卖', type: '满30可用', expire: '今天 23:59 过期' },
      { value: 8, platform: '饿了么', type: '满25可用', expire: '明天 23:59 过期' },
      { value: 20, platform: '京东', type: '满99可用', expire: '剩余 2 天' }
    ],
    cashbackList: [
      { icon: '\ud83d\udcb0', title: '淘宝购物返现', desc: '通过聚宝盆跳转下单，享 2%~8% 返现', val: '8%', btn: '去参与', bg: 'bg-green' },
      { icon: '\ud83c\udf5c', title: '美团外卖返现', desc: '每笔外卖订单返现 1~3 元', val: '¥3', btn: '去参与', bg: 'bg-orange' },
      { icon: '\ud83d\udcf1', title: '话费充值返现', desc: '充 100 返 3，充 50 返 1.5', val: '3%', btn: '去参与', bg: 'bg-blue' }
    ],
    discountList: [
      { icon: '\ud83c\udf55', title: '肯德基疯狂星期四', desc: '指定套餐 7 折起', val: '¥14.9', btn: '去查看', bg: 'bg-red' },
      { icon: '\ud83d\udcf1', title: '移动话费充值优惠', desc: '满 50 减 5 元', val: '¥45', btn: '去查看', bg: 'bg-green' },
      { icon: '\ud83c\udfac', title: '爱奇艺年卡会员', desc: '新用户首年仅 ¥98', val: '¥98', btn: '去查看', bg: 'bg-purple' }
    ],
    hotDeals: [
      { emoji: '\ud83c\udf55', title: '肯德基疯狂星期四 指定套餐 7 折起', tag: '限时', tagColor: '#FFF3E0', tagTextColor: '#F39C12', price: '¥14.9', original: '¥21' },
      { emoji: '\ud83d\udcf1', title: '中国移动话费充值 满 50 减 5 元', tag: '热门', tagColor: '#E8F8F5', tagTextColor: '#00B894', price: '¥45', original: '¥50' },
      { emoji: '\ud83c\udfac', title: '爱奇艺年卡会员 新用户首年仅 ¥98', tag: '新人', tagColor: '#F4ECF7', tagTextColor: '#6C5CE7', price: '¥98', original: '¥248' }
    ]
  },

  onLoad() {},

  switchPicksTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activePicksTab: index })
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  goQuickNav(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.switchTab({ url }) 
    }
  },

  goMoreDiscount() {
    wx.switchTab({ url: '/pages/discount/discount' })
  }
})
