/**
 * 薄弱点分析页 - TOP5薄弱知识点图表
 * 使用canvas绘制水平柱状图，展示薄弱知识点和建议
 */

const app = getApp()
const { getWeakPoints, SUBJECT_COLORS } = require('../../utils/data.js')

Page({
  data: {
    // TOP5薄弱知识点
    weakPoints: [],
    // 最大错误次数（用于计算柱子宽度比例）
    maxCount: 0,
    // 建议列表
    suggestions: []
  },

  onLoad() {
    this.loadWeakPoints()
  },

  onShow() {
    this.loadWeakPoints()
  },

  /**
   * 加载薄弱知识点数据
   */
  loadWeakPoints() {
    const questions = app.globalData.wrongQuestions || []
    const weakPoints = getWeakPoints(questions)
    
    // 为每个知识点添加学科信息和建议
    const enriched = weakPoints.map(point => {
      // 找到对应的错题获取学科
      const relatedQ = questions.find(q => q.knowledgePoint === point.name)
      const subject = relatedQ ? relatedQ.subject : '未知'
      const color = SUBJECT_COLORS[subject] || '#999999'
      
      // 根据错误次数生成建议
      let suggestion = ''
      if (point.count >= 3) {
        suggestion = '这个知识点错误较多，建议每天练5道相关题目，重点复习！'
      } else if (point.count >= 2) {
        suggestion = '还需要加强练习，建议每天练3道巩固一下。'
      } else {
        suggestion = '已经进步了，再练2道就可以毕业啦！'
      }

      return {
        ...point,
        subject,
        color,
        suggestion,
        barWidth: 0 // 将在绘制时计算
      }
    })

    const maxCount = weakPoints.length > 0 ? weakPoints[0].count : 1

    this.setData({
      weakPoints: enriched,
      maxCount: Math.max(maxCount, 1)
    })

    // 绘制图表
    setTimeout(() => {
      this.drawChart()
    }, 300)
  },

  /**
   * 使用canvas绘制水平柱状图
   */
  drawChart() {
    const query = wx.createSelectorQuery()
    query.select('#chartCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          console.log('Canvas节点未找到')
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getWindowInfo().pixelRatio
        
        // 设置canvas尺寸
        const width = res[0].width
        const height = res[0].height
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        // 清空画布
        ctx.clearRect(0, 0, width, height)

        const points = this.data.weakPoints
        if (points.length === 0) return

        // 绘制参数
        const barHeight = 36
        const barGap = 24
        const labelWidth = 160
        const countWidth = 80
        const startY = 30
        const maxBarWidth = width - labelWidth - countWidth - 40

        // 绘制每个柱子
        points.forEach((point, index) => {
          const y = startY + index * (barHeight + barGap)
          const barWidth = Math.max((point.count / this.data.maxCount) * maxBarWidth, 20)

          // 绘制知识点名称
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 14px sans-serif'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(point.name, labelWidth - 10, y + barHeight / 2)

          // 绘制柱子（带圆角效果）
          ctx.fillStyle = point.color
          ctx.beginPath()
          const radius = barHeight / 2
          const x = labelWidth
          // 简单圆角矩形
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + barWidth - radius, y)
          ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius)
          ctx.lineTo(x + barWidth, y + barHeight - radius)
          ctx.arcTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight, radius)
          ctx.lineTo(x + radius, y + barHeight)
          ctx.arcTo(x, y + barHeight, x, y + barHeight - radius, radius)
          ctx.lineTo(x, y + radius)
          ctx.arcTo(x, y, x + radius, y, radius)
          ctx.fill()

          // 绘制次数标签
          ctx.fillStyle = '#666666'
          ctx.font = 'bold 14px sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(`${point.count}次`, labelWidth + barWidth + 12, y + barHeight / 2)
        })
      })
  },

  /**
   * 点击"开始练习"按钮
   */
  onPractice(e) {
    const { index } = e.currentTarget.dataset
    const point = this.data.weakPoints[index]
    wx.showToast({
      title: `正在准备${point.name}练习题...`,
      icon: 'none',
      duration: 2000
    })
  }
})
