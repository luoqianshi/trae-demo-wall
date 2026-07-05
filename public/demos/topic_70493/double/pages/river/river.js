const app = getApp()
const api = require('../../utils/api.js')

Page({
  data: {
    river: null,
    riverId: '',
    riverName: '记忆长河',
    bottles: [],
    bottlesWithPosition: [],
    matchedPairs: [],
    boatPosition: 300,
    currentSeason: 'summer',
    seasonBg: '',
    seasonName: '',
    seasonConfig: {
      spring: { name: '春樱涟漪', color: '#ffb7c5', bg: 'linear-gradient(180deg, #2d1f3d 0%, #4a2c5a 100%)' },
      summer: { name: '夏夜萤火', color: '#00ff88', bg: 'linear-gradient(180deg, #0d2818 0%, #1a4731 100%)' },
      autumn: { name: '秋叶暖光', color: '#ffaa00', bg: 'linear-gradient(180deg, #3d2817 0%, #5a3d2b 100%)' },
      winter: { name: '冬雪薄雾', color: '#a8d8ea', bg: 'linear-gradient(180deg, #1a2a3a 0%, #2d4a5e 100%)' }
    },
    showDetail: false,
    selectedBottle: null,
    selectedBottleContent: '',
    selectedBottleTime: '',
    selectedPair: null,
    selectedPairBottle1Content: '',
    selectedPairBottle1Time: '',
    selectedPairBottle2Content: '',
    selectedPairBottle2Time: '',
    selectedPairKeywords: [],
    loading: true
  },

  onLoad: function (options) {
    this.setData({
      riverId: options.id
    })
    this.loadRiver()
  },

  onShow: function () {
    this.loadRiver()
  },

  async loadRiver() {
    this.setData({ loading: true })
    try {
      const result = await api.getRiver(this.data.riverId)
      const river = result.river
      const bottles = result.bottles

      const season = river.season || 'summer'
      const seasonConfig = this.data.seasonConfig[season]

      const bottlesWithPosition = []
      const matchedPairs = []
      const matchedIds = new Set()

      bottles.forEach(function(bottle) {
        if (bottle.status === 'matched' && bottle.matchedWith && !matchedIds.has(bottle.id)) {
          const matchedBottle = bottles.find(function(b) {
            return b.id === bottle.matchedWith.id
          })
          if (matchedBottle) {
            matchedPairs.push({
              bottle1: bottle,
              bottle2: matchedBottle,
              keywords: bottle.keywords.filter(function(k) {
                return matchedBottle.keywords.includes(k)
              })
            })
            matchedIds.add(bottle.id)
            matchedIds.add(matchedBottle.id)
          }
        }

        const isMatched = matchedIds.has(bottle.id)
        const bottleClass = isMatched ? 'bottle-matched' : 'bottle-personal'
        const opacity = getBottleOpacity(bottle.createdAt)
        const contentPreview = bottle.content.length > 10 ? bottle.content.substring(0, 10) + '...' : bottle.content

        bottlesWithPosition.push({
          id: bottle.id,
          content: bottle.content,
          contentPreview: contentPreview,
          createTime: bottle.createdAt,
          bottleClass: bottleClass,
          opacity: opacity,
          left: 200 + Math.floor(Math.random() * 400),
          top: 100 + Math.floor(Math.random() * 400),
          delay: Math.random() * 3
        })
      })

      this.setData({
        river: river,
        riverName: river.name || '记忆长河',
        bottles: bottles,
        bottlesWithPosition: bottlesWithPosition,
        matchedPairs: matchedPairs,
        currentSeason: season,
        seasonBg: seasonConfig.bg,
        seasonName: seasonConfig.name,
        loading: false
      })
    } catch (err) {
      console.error('获取河道失败:', err)
      this.setData({ loading: false })
    }
  },

  onTouchStart: function (e) {
    this.setData({
      isDragging: true,
      startX: e.touches[0].clientX
    })
  },

  onTouchMove: function (e) {
    if (!this.data.isDragging) return
    
    const deltaX = e.touches[0].clientX - this.data.startX
    let newPosition = this.data.boatPosition + deltaX
    newPosition = Math.max(50, Math.min(550, newPosition))
    
    this.setData({
      boatPosition: newPosition,
      startX: e.touches[0].clientX
    })
  },

  onTouchEnd: function () {
    this.setData({
      isDragging: false
    })
  },

  goToEditor: function () {
    wx.navigateTo({
      url: '/pages/editor/editor?riverId=' + this.data.riverId
    })
  },

  goToCabin: function () {
    wx.redirectTo({
      url: '/pages/cabin/cabin'
    })
  },

  openBottle: function (e) {
    const bottleId = e.currentTarget.dataset.id
    const bottle = this.data.bottles.find(function(b) {
      return b.id === bottleId
    })

    if (bottle && bottle.status === 'matched' && bottle.matchedWith) {
      const matchedBottle = this.data.bottles.find(function(b) {
        return b.id === bottle.matchedWith.id
      })

      if (matchedBottle) {
        this.setData({
          showDetail: true,
          selectedPair: { bottle1: bottle, bottle2: matchedBottle },
          selectedPairBottle1Content: bottle.content,
          selectedPairBottle1Time: this.formatTime(bottle.createdAt),
          selectedPairBottle2Content: matchedBottle.content,
          selectedPairBottle2Time: this.formatTime(matchedBottle.createdAt),
          selectedPairKeywords: bottle.keywords.filter(function(k) {
            return matchedBottle.keywords.includes(k)
          }),
          selectedBottle: null
        })
      }
    } else if (bottle) {
      this.setData({
        showDetail: true,
        selectedBottle: bottle,
        selectedBottleContent: bottle.content,
        selectedBottleTime: this.formatTime(bottle.createdAt),
        selectedPair: null
      })
    }
  },

  closeDetail: function () {
    this.setData({
      showDetail: false,
      selectedBottle: null,
      selectedPair: null
    })
  },

  switchSeason: function () {
    const seasons = ['spring', 'summer', 'autumn', 'winter']
    const currentIndex = seasons.indexOf(this.data.currentSeason)
    const nextSeason = seasons[(currentIndex + 1) % 4]
    const seasonConfig = this.data.seasonConfig[nextSeason]
    
    this.setData({
      currentSeason: nextSeason,
      seasonBg: seasonConfig.bg,
      seasonName: seasonConfig.name
    })
  },

  goToMessage: function () {
    wx.showToast({
      title: '留言功能开发中',
      icon: 'none'
    })
  },

  formatTime: function (timestamp) {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return month + '月' + day + '日 ' + hour + ':' + (minute < 10 ? '0' + minute : minute)
  },

  onShareAppMessage: function () {
    return {
      title: '双人记忆摆渡船 - 一起记录美好回忆',
      desc: '每一条河，都藏着两个人的故事',
      path: '/pages/index/index'
    }
  },

  onShareTimeline: function () {
    return {
      title: '双人记忆摆渡船 - 一起记录美好回忆',
      query: '',
      imageUrl: ''
    }
  }
})

function getBottleOpacity(createdAt) {
  const now = Date.now()
  const days = Math.floor((now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  if (days > 30) {
    return Math.max(0.4, 1 - (days - 30) / 60)
  }
  return 0.9
}