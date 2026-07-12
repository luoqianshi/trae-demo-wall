Page({
  data: {
    imageUrl: '',
    loading: false,
    result: null,
    plantName: '',
    status: '',
    statusText: '',
    suggestion: '',
    waterAdvice: '',
    lightAdvice: '',
    tip: '',
    hasResult: false
  },

  onLoad() {
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  chooseImage() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        that.setData({
          imageUrl: tempFilePath,
          loading: true,
          hasResult: false
        })
        that.identifyPlant(tempFilePath)
      }
    })
  },

  async identifyImage() {
    if (!this.data.imageUrl) {
      this.chooseImage()
      return
    }
    this.setData({ loading: true, hasResult: false })
    this.identifyPlant(this.data.imageUrl)
  },

  identifyPlant(imagePath) {
    setTimeout(() => {
      const results = [
        {
          plantName: '绿萝',
          status: 'thirsty',
          statusText: '有点缺水',
          quote: '它在说：主人，我也想喝一口清晨的露水。',
          suggestion: '建议浇水 200ml',
          waterAdvice: '建议浇水 200ml',
          lightAdvice: '避开烈日暴晒，散光环境佳',
          tip: '保持土壤微湿，它会是你最忠实的绿色伙伴。'
        },
        {
          plantName: '多肉',
          status: 'healthy',
          statusText: '状态健康',
          quote: '饱满的叶片里，藏着阳光的秘密。',
          suggestion: '继续保持当前养护方式',
          waterAdvice: '见干见湿，约7-10天浇一次',
          lightAdvice: '充足阳光，叶片更饱满',
          tip: '多肉植物越晒越美，记得多给它晒太阳。'
        },
        {
          plantName: '龟背竹',
          status: 'growth',
          statusText: '生长旺盛',
          quote: '每一片开裂的叶子，都是岁月的勋章。',
          suggestion: '生长旺季，可适当追肥',
          waterAdvice: '保持土壤湿润，约5天浇一次',
          lightAdvice: '散射光最佳，避免强光直射',
          tip: '龟背竹喜欢温暖湿润的环境，经常喷水会更精神。'
        },
        {
          plantName: '虎皮兰',
          status: 'overwater',
          statusText: '浇水过多',
          quote: '根说：我快要喘不过气了...',
          suggestion: '暂停浇水，松土通风',
          waterAdvice: '减少浇水频率，约15天浇一次',
          lightAdvice: '移至通风处，加速水分蒸发',
          tip: '虎皮兰耐旱怕涝，宁干勿湿是养护秘诀。'
        },
        {
          plantName: '发财树',
          status: 'disease',
          statusText: '叶片发黄',
          quote: '黄叶是它在求救的信号。',
          suggestion: '检查根系，必要时换盆',
          waterAdvice: '减少浇水，保持土壤偏干',
          lightAdvice: '移至光线明亮处',
          tip: '发财树黄叶多因浇水过多，管住手很重要。'
        }
      ]

      const randomResult = results[Math.floor(Math.random() * results.length)]
      
      this.setData({
        loading: false,
        hasResult: true,
        result: randomResult,
        plantName: randomResult.plantName,
        status: randomResult.status,
        statusText: randomResult.statusText,
        suggestion: randomResult.suggestion,
        waterAdvice: randomResult.waterAdvice,
        lightAdvice: randomResult.lightAdvice,
        tip: randomResult.tip
      })
    }, 2000)
  },

  addToCalendar() {
    wx.showToast({ title: '已记入日历', icon: 'success' })
  },

  shareResult() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  goToEncyclopedia() {
    wx.navigateTo({ url: '/pages/encyclopedia/encyclopedia' })
  },

  resetImage() {
    this.setData({
      imageUrl: '',
      hasResult: false,
      result: null
    })
  }
})
