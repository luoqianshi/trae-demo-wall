const { getMockResult } = require('../../utils/mockData.js')
const { analyzePaper } = require('../../utils/api.js')

Page({
  data: {
    imagePath: '',
    grade: '',
    subject: '',
    progress: 0,
    progressText: '正在识别试卷...',
    tips: [
      '正在识别试卷内容...',
      '正在匹配正确答案...',
      '正在分析考点知识点...',
      '正在生成学情报告...'
    ],
    currentTipIndex: 0,
    timer: null
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      imagePath: decodeURIComponent(options.image || ''),
      grade: options.grade || '三年级',
      subject: options.subject || 'math',
      statusBarHeight: app.globalData.statusBarHeight || 20
    })

    this.startProgress()
  },

  startProgress() {
    let progress = 0
    let tipIndex = 0
    let analyzeDone = false
    let analyzeResult = null

    analyzePaper(this.data.imagePath, this.data.grade, this.data.subject)
      .then(result => {
        analyzeDone = true
        analyzeResult = result
      })
      .catch(() => {
        analyzeDone = true
        analyzeResult = getMockResult()
      })

    const timer = setInterval(() => {
      progress += Math.random() * 6 + 2
      if (progress >= 90 && !analyzeDone) {
        progress = 90
      }
      if (progress >= 100) {
        progress = 100
      }

      if (progress > 25 && tipIndex === 0) {
        tipIndex = 1
      } else if (progress > 50 && tipIndex === 1) {
        tipIndex = 2
      } else if (progress > 75 && tipIndex === 2) {
        tipIndex = 3
      }

      this.setData({
        progress: Math.floor(progress),
        currentTipIndex: tipIndex
      })

      if (progress >= 100 && analyzeDone) {
        clearInterval(timer)
        setTimeout(() => {
          this.goToResult(analyzeResult)
        }, 500)
      }
    }, 200)

    this.setData({ timer })
  },

  goToResult(result) {
    const resultData = result || getMockResult()
    const resultStr = encodeURIComponent(JSON.stringify(resultData))

    wx.redirectTo({
      url: `/pages/result/result?data=${resultStr}`
    })
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
