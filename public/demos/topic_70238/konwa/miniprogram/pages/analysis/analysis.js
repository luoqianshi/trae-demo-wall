const { getMockResult } = require('../../utils/mockData.js')

Page({
  data: {
    result: null,
    radarData: [],
    weakPoints: [],
    reasonDistribution: [],
    canvasWidth: 300,
    canvasHeight: 300
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })

    if (options.data) {
      try {
        const result = JSON.parse(decodeURIComponent(options.data))
        this.setData({ result })
        this.processAnalysisData(result)
      } catch (e) {
        this.loadMockData()
      }
    } else {
      this.loadMockData()
    }
  },

  onReady() {
    this.drawRadar()
  },

  loadMockData() {
    const result = getMockResult()
    this.setData({ result })
    this.processAnalysisData(result)
  },

  processAnalysisData(result) {
    const analysis = result.knowledgeAnalysis
    this.setData({
      radarData: analysis.radarData,
      weakPoints: analysis.weakPoints,
      reasonDistribution: analysis.reasonDistribution
    })
  },

  drawRadar() {
    const query = wx.createSelectorQuery()
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height
        
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        this.radarCtx = ctx
        this.radarCanvas = canvas
        this.renderRadar(width, height)
      })
  },

  renderRadar(width, height) {
    const ctx = this.radarCtx
    const data = this.data.radarData
    const count = data.length
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 30

    ctx.clearRect(0, 0, width, height)

    for (let level = 4; level >= 1; level--) {
      const r = radius * (level / 4)
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2
        const x = centerX + r * Math.cos(angle)
        const y = centerY + r * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = '#F0E6D2'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = '#F0E6D2'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.beginPath()
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      const value = data[i].value / 100
      const r = radius * value
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(44, 200, 184, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#2CC8B8'
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      const value = data[i].value / 100
      const r = radius * value
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#2CC8B8'
      ctx.fill()
    }

    ctx.fillStyle = '#333333'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      const labelRadius = radius + 20
      const x = centerX + labelRadius * Math.cos(angle)
      const y = centerY + labelRadius * Math.sin(angle)
      ctx.fillText(data[i].name, x, y)
    }
  },

  goToPlan() {
    const dataStr = encodeURIComponent(JSON.stringify(this.data.result))
    wx.navigateTo({
      url: `/pages/plan/plan?data=${dataStr}`
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
