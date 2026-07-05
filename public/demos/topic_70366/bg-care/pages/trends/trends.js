const storage = require('../../utils/storage.js')

Page({
  data: {
    weeklyData: [],
    stats: null,
    records: [],
    hasData: false
  },

  onShow() {
    this.loadData()
    setTimeout(() => this.drawChart(), 300)
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  loadData() {
    const weeklyData = storage.getLatest7DaysData()
    const stats = storage.getStatsSummary(7)

    const hasData = !!(stats && stats.totalCount > 0)

    const sysStatusText = stats ? storage.getBpStatusText(stats.sysStatus) : ''

    const records = storage.getRecords().slice(0, 5).map(r => {
      const d = new Date(r.createdAt)
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const status = storage.evalBpStatus(r.systolic, r.diastolic)
      return {
        ...r,
        dateLabel: storage.formatDate(r.createdAt) + ' ' + dayNames[d.getDay()],
        timeLabel: storage.formatTime(r.createdAt),
        status
      }
    })

    this.setData({
      weeklyData,
      stats: {
        ...stats,
        sysStatusText
      },
      records,
      hasData
    })
  },

  drawChart() {
    const weeklyData = this.data.weeklyData
    if (!weeklyData || weeklyData.length === 0) return

    const ctx = wx.createCanvasContext('bpChart', this)
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.windowWidth
    const r = screenWidth / 750

    const canvasWidth = screenWidth - 64 * r
    const canvasHeight = 400 * r

    const padLeft = 72 * r
    const padRight = 24 * r
    const padTop = 32 * r
    const padBottom = 52 * r

    const chartW = canvasWidth - padLeft - padRight
    const chartH = canvasHeight - padTop - padBottom

    const yMin = 60
    const yMax = 160
    const yRange = yMax - yMin

    const mapY = function (value) {
      return padTop + chartH - ((value - yMin) / yRange) * chartH
    }

    const validDays = weeklyData.filter(function (d) { return d.systolic !== null })
    const pointCount = Math.max(validDays.length, weeklyData.length)

    const xStep = pointCount > 1 ? chartW / Math.max(pointCount - 1, 1) : 0

    const xPositions = weeklyData.map(function (_, i) {
      return padLeft + i * xStep
    })

    ctx.setFillStyle('rgba(91, 140, 90, 0.10)')
    ctx.fillRect(padLeft, mapY(120), chartW, mapY(60) - mapY(120))

    ctx.setFillStyle('rgba(196, 155, 63, 0.10)')
    ctx.fillRect(padLeft, mapY(140), chartW, mapY(120) - mapY(140))

    ctx.setFillStyle('rgba(184, 69, 60, 0.08)')
    ctx.fillRect(padLeft, mapY(160), chartW, mapY(140) - mapY(160))

    const yLabels = [60, 80, 100, 120, 140, 160]

    ctx.setStrokeStyle('rgba(60, 50, 30, 0.06)')
    ctx.setLineWidth(1)
    ctx.setFontSize(11)
    ctx.setFillStyle('#8C8270')
    ctx.setTextAlign('right')
    ctx.setTextBaseline('middle')

    yLabels.forEach(function (val) {
      var y = mapY(val)
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(canvasWidth - padRight, y)
      ctx.stroke()
      ctx.fillText(val.toString(), padLeft - 6 * r, y)
    })

    ctx.setFontSize(10)
    ctx.setFillStyle('#8C8270')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('top')

    weeklyData.forEach(function (item, i) {
      ctx.fillText(item.shortLabel, xPositions[i], canvasHeight - padBottom + 10 * r)
    })

    var sysPoints = []
    var diaPoints = []

    weeklyData.forEach(function (item, i) {
      if (item.systolic !== null) {
        sysPoints.push({ x: xPositions[i], y: mapY(item.systolic), val: item.systolic })
      }
      if (item.diastolic !== null) {
        diaPoints.push({ x: xPositions[i], y: mapY(item.diastolic), val: item.diastolic })
      }
    })

    var drawPolyline = function (points, color) {
      if (points.length < 2) return

      ctx.setStrokeStyle(color)
      ctx.setLineWidth(2.5)
      ctx.setLineCap('round')
      ctx.setLineJoin('round')
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()

      points.forEach(function (p) {
        ctx.setFillStyle(color)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    drawPolyline(sysPoints, '#CC6B3A')
    drawPolyline(diaPoints, '#7B8AB8')

    ctx.setFontSize(10)
    ctx.setTextAlign('center')
    ctx.setTextBaseline('bottom')

    sysPoints.forEach(function (p) {
      ctx.setFillStyle('#CC6B3A')
      ctx.fillText(p.val.toString(), p.x, p.y - 8)
    })

    diaPoints.forEach(function (p) {
      ctx.setFillStyle('#7B8AB8')
      ctx.fillText(p.val.toString(), p.x, p.y - 8)
    })

    ctx.draw()
  },

  viewAll() {
    wx.pageScrollTo({
      scrollTop: 9999,
      duration: 300
    })
  }
})
