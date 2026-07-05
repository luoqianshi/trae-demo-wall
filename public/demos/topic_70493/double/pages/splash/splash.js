Page({
  data: {
    storyTexts: [
      { icon: '🌊', text: '在时光的长河中', delay: 0.8 },
      { icon: '💌', text: '我们漂流着记忆', delay: 1.1 },
      { icon: '💫', text: '等待一次共鸣', delay: 1.4 },
      { icon: '✨', text: '遇见命中注定的人', delay: 1.7 }
    ],
    particles: [],
    progress: 0,
    autoTimer: null,
    progressTimer: null
  },

  onLoad: function () {
    this.initParticles()
    this.startProgress()
    this.startAutoEnter()
  },

  initParticles: function () {
    const particles = []
    for (let i = 0; i < 15; i++) {
      particles.push({
        left: Math.floor(Math.random() * 100),
        top: Math.floor(Math.random() * 100),
        delay: Math.random() * 4
      })
    }
    this.setData({ particles: particles })
  },

  startProgress: function () {
    let progress = 0
    this.progressTimer = setInterval(function() {
      progress += 2
      if (progress > 100) progress = 100
      this.setData({ progress: progress })
    }.bind(this), 80)
  },

  startAutoEnter: function () {
    this.autoTimer = setTimeout(function() {
      this.enterApp()
    }.bind(this), 5000)
  },

  enterApp: function () {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer)
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
    }
    
    wx.redirectTo({
      url: '/pages/index/index'
    })
  }
})