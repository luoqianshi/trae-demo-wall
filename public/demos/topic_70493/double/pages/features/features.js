const app = getApp()
const storage = require('../../utils/storage.js')
const matcher = require('../../utils/matcher.js')

Page({
  data: {
    userData: null,
    wordCloudData: [],
    showWordCloud: false,
    currentSeason: 'summer',
    seasons: [
      { id: 'spring', name: '春樱涟漪', color: '#ffb7c5', icon: '🌸' },
      { id: 'summer', name: '夏夜萤火', color: '#00ff88', icon: '✨' },
      { id: 'autumn', name: '秋叶暖光', color: '#ffaa00', icon: '🍂' },
      { id: 'winter', name: '冬雪薄雾', color: '#a8d8ea', icon: '❄️' }
    ],
    yearReport: null,
    yearReportYear: 0,
    yearReportTotal: 0,
    yearReportMatched: 0,
    yearReportRelations: 0,
    yearReportKeywords: [],
    yearReportSummary: '',
    showYearReport: false,
    hasEnoughData: false
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    const userData = storage.getUserData()
    let season = 'summer'
    if (userData && userData.currentSeason) {
      season = userData.currentSeason
    }
    
    this.setData({
      userData: userData,
      currentSeason: season
    })

    this.generateWordCloud()
    this.generateYearReport()
  },

  generateWordCloud: function () {
    const userData = this.data.userData
    if (!userData || !userData.rivers) {
      this.setData({ wordCloudData: [] })
      return
    }

    const allKeywords = []
    userData.rivers.forEach(function(river) {
      if (river.bottles) {
        river.bottles.forEach(function(bottle) {
          const keywords = matcher.extractKeywords(bottle.content)
          keywords.forEach(function(k) {
            allKeywords.push(k)
          })
        })
      }
    })

    const wordCount = {}
    allKeywords.forEach(function(word) {
      if (wordCount[word]) {
        wordCount[word] = wordCount[word] + 1
      } else {
        wordCount[word] = 1
      }
    })

    const wordCloudData = []
    const words = Object.keys(wordCount)
    words.forEach(function(word) {
      const count = wordCount[word]
      const size = Math.min(120, 40 + count * 20)
      const color = getRandomColor()
      const top = Math.floor(Math.random() * 60)
      const left = Math.floor(Math.random() * 80)
      const rotate = Math.floor((Math.random() - 0.5) * 20)
      wordCloudData.push({
        word: word,
        count: count,
        size: size,
        color: color,
        top: top,
        left: left,
        rotate: rotate
      })
    })

    this.setData({
      wordCloudData: wordCloudData,
      hasEnoughData: wordCloudData.length > 0
    })
  },

  toggleWordCloud: function () {
    this.setData({
      showWordCloud: !this.data.showWordCloud
    })
  },

  saveWordCloud: function () {
    wx.showToast({
      title: '词云图片已保存',
      icon: 'success'
    })
    this.setData({ showWordCloud: false })
  },

  toggleYearReport: function () {
    this.setData({
      showYearReport: !this.data.showYearReport
    })
  },

  generateYearReport: function () {
    const userData = this.data.userData
    if (!userData || !userData.rivers) {
      this.setData({ 
        yearReport: null,
        yearReportYear: 0,
        yearReportTotal: 0,
        yearReportMatched: 0,
        yearReportRelations: 0,
        yearReportKeywords: [],
        yearReportSummary: '正在为你们积攒年度温柔'
      })
      return
    }

    const currentYear = new Date().getFullYear()
    let totalMemories = 0
    let matchedCount = 0
    const keywords = []

    userData.rivers.forEach(function(river) {
      if (river.bottles) {
        river.bottles.forEach(function(bottle) {
          const bottleYear = new Date(bottle.createTime).getFullYear()
          if (bottleYear === currentYear) {
            totalMemories++
            if (bottle.status === 'matched') matchedCount++
            const bottleKeywords = matcher.extractKeywords(bottle.content)
            bottleKeywords.forEach(function(k) {
              keywords.push(k)
            })
          }
        })
      }
    })

    const keywordCount = {}
    keywords.forEach(function(word) {
      if (keywordCount[word]) {
        keywordCount[word] = keywordCount[word] + 1
      } else {
        keywordCount[word] = 1
      }
    })

    const sortedKeywords = []
    const kwKeys = Object.keys(keywordCount)
    kwKeys.sort(function(a, b) {
      return keywordCount[b] - keywordCount[a]
    })
    for (let i = 0; i < Math.min(5, kwKeys.length); i++) {
      sortedKeywords.push(kwKeys[i])
    }

    const summary = generateSummary(totalMemories, matchedCount, userData.rivers.length)

    this.setData({ 
      yearReport: {},
      yearReportYear: currentYear,
      yearReportTotal: totalMemories,
      yearReportMatched: matchedCount,
      yearReportRelations: userData.rivers.length,
      yearReportKeywords: sortedKeywords,
      yearReportSummary: summary
    })
  },

  saveYearReport: function () {
    wx.showToast({
      title: '年度报告已保存',
      icon: 'success'
    })
    this.setData({ showYearReport: false })
  },

  changeSeason: function (e) {
    const season = e.currentTarget.dataset.season
    storage.updateSeason(season)
    this.setData({ currentSeason: season })
    
    wx.showToast({
      title: getSeasonName(season) + '已应用',
      icon: 'success'
    })
  }
})

function getRandomColor() {
  const colors = ['#ffd700', '#ffb7c5', '#87ceeb', '#90ee90', '#dda0dd', '#ffa500']
  return colors[Math.floor(Math.random() * colors.length)]
}

function getSeasonName(season) {
  const seasonMap = {
    spring: '春樱涟漪',
    summer: '夏夜萤火',
    autumn: '秋叶暖光',
    winter: '冬雪薄雾'
  }
  return seasonMap[season] || ''
}

function generateSummary(total, matched, relations) {
  if (total === 0) return '新的一年，让我们开始记录美好的回忆吧'
  if (matched === 0) return '今年你们记录了' + total + '个回忆，期待更多的共鸣时刻'
  if (matched >= total / 2) return '今年你们有' + matched + '个共鸣记忆，每一个都是双向的温暖'
  return '今年记录了' + total + '个回忆，其中' + matched + '个产生了共鸣'
}