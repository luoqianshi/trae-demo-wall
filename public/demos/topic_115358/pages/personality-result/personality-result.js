// pages/personality-result/personality-result.js
const app = getApp()
const { personalityDetails } = require('../../utils/data.js')

// 每种食人格人格解读中需高亮的关键词
const highlightKeywords = {
  ESRP: ['研究', '评分', '必点菜', '避雷菜', '数据驱动', '充分的准备'],
  CSRF: ['老店', '秘密花园', '熟悉', '稳定的出品', '反复去'],
  CNIF: ['"境"', '五感的综合艺术', '故事', '温度'],
  ENRP: ['策展', '精心策划', '品质', '格调', '美食风向标']
}

// 将描述文本按关键词拆分为 {text, highlight} 片段
function splitHighlights(text, keywords) {
  if (!keywords || !keywords.length) return [{ text, highlight: false }]
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp('(' + escaped.join('|') + ')', 'g')
  const parts = text.split(re).filter(p => p)
  return parts.map((p, idx) => ({ text: p, highlight: keywords.indexOf(p) >= 0, idx }))
}

Page({
  data: {
    statusBarHeight: 0,
    detail: null,
    descSegments: []
  },

  onLoad() {
    const statusBarHeight = app.globalData.statusBarHeight || 44
    const code = app.globalData.userInfo.personality || 'ESRP'
    let detail = personalityDetails[code] || personalityDetails['ESRP']
    const descSegments = splitHighlights(detail.description, highlightKeywords[detail.code])
    this.setData({ statusBarHeight, detail, descSegments })
  },

  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/home/home' })
      }
    })
  },

  onShare() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/home/home' })
  }
})
