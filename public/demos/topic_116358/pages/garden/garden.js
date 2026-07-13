Page({
  data: {
    greeting: '',
    waterCount: 2,
    sunLevel: '适中',
    plants: [
      {
        id: '1',
        name: '龟背竹',
        avatar: '/images/龟背竹.jpg',
        status: 'healthy',
        statusText: '茁壮',
        quote: '"山林里的阔叶梦"',
        days: '已陪伴 128 天',
        needWater: false
      },
      {
        id: '2',
        name: '多肉·静夜',
        avatar: '/images/多肉·静夜.jpg',
        status: 'thirsty',
        statusText: '提醒',
        quote: '"晨露微光中的温柔"',
        days: '已陪伴 45 天',
        needWater: true
      },
      {
        id: '3',
        name: '虎尾兰',
        avatar: '/images/虎尾兰.jpg',
        status: 'healthy',
        statusText: '良好',
        quote: '今日已通过光合作用产生12g氧气',
        days: '已陪伴 200 天',
        needWater: false
      }
    ],
    todayTip: '今日适宜补水、松土',
    seasonName: '五月·仲夏'
  },

  onLoad() {
    this.setGreeting()
  },

  onShow() {
    this.setGreeting()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  setGreeting() {
    const hour = new Date().getHours()
    let greeting = ''
    if (hour < 6) greeting = '夜深了，你的植物已经睡了'
    else if (hour < 12) greeting = '早安，你的绿友们正在呼吸'
    else if (hour < 14) greeting = '午后阳光正好，植物也在打盹'
    else if (hour < 18) greeting = '傍晚时分，记得给植物浇水'
    else greeting = '夜色温柔，园子也安静下来了'
    this.setData({ greeting })
  },

  goToSeason() {
    wx.switchTab({ url: '/pages/season/season' })
  },

  goToPlantDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/growth/growth?id=${id}` })
  },

  goToGrowth() {
    wx.navigateTo({ url: '/pages/growth/growth' })
  },

  goToPlantList() {
    wx.showToast({ title: '查看全部植物', icon: 'none' })
  },

  waterPlant(e) {
    e.stopPropagation()
    wx.showToast({ title: '已浇水', icon: 'success' })
  }
})