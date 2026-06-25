const app = getApp()

Page({
  data: {
    currentTemp: 36.5,
    tempSliderValue: 36.5,
    records: [],
    todayRecords: []
  },

  onLoad: function () {
    this.loadRecords()
  },

  onShow: function () {
    this.loadRecords()
  },

  loadRecords: function () {
    const records = app.getRecords('temperature') || []
    const today = app.formatDate()
    const todayMonthDay = today.split(' ')[0]
    
    const todayRecords = records.filter(r => r.createTime && r.createTime.includes(todayMonthDay))
    const otherRecords = records.filter(r => !r.createTime || !r.createTime.includes(todayMonthDay))
    
    this.setData({
      records: otherRecords.slice(0, 20),
      todayRecords: todayRecords.slice(0, 10)
    })
    this.drawChart()
  },

  onTempChange: function (e) {
    const value = parseFloat(e.detail.value)
    this.setData({
      currentTemp: value.toFixed(1),
      tempSliderValue: value
    })
  },

  addRecord: function () {
    app.saveRecord('temperature', { value: parseFloat(this.data.currentTemp) })
    this.loadRecords()
    wx.showToast({
      title: '记录成功',
      icon: 'success'
    })
  },

  getTempIcon: function (temp) {
    if (!temp) return '🌡️'
    const t = parseFloat(temp)
    if (t < 36) return '🥶'
    if (t < 37.3) return '😊'
    if (t < 38) return '🤒'
    return '🔥'
  },

  getTempStatus: function (temp) {
    if (!temp) return '--'
    const t = parseFloat(temp)
    if (t < 36) return '体温偏低'
    if (t < 37.3) return '正常体温'
    if (t < 38) return '低烧'
    if (t < 39) return '中度发烧'
    return '高烧'
  },

  getTempDesc: function (temp) {
    if (!temp) return ''
    const t = parseFloat(temp)
    if (t < 36) return '注意保暖，多喝温水'
    if (t < 37.3) return '体温正常，请继续保持'
    if (t < 38) return '轻微发烧，多喝水多休息'
    if (t < 39) return '中度发烧，建议就医'
    return '高烧！请立即就医'
  },

  getTempClass: function (temp) {
    if (!temp) return ''
    const t = parseFloat(temp)
    if (t < 36) return 'temp-low'
    if (t < 37.3) return 'temp-normal'
    if (t < 39) return 'temp-fever'
    return 'temp-high'
  },

  drawChart: function () {
    const records = this.data.todayRecords
    if (records.length < 2) return

    const ctx = wx.createCanvasContext('tempChart')
    const width = 650
    const height = 300
    const padding = { top: 30, right: 30, bottom: 50, left: 60 }

    const data = [...records].reverse()
    const temps = data.map(r => parseFloat(r.value))
    const times = data.map(r => {
      const time = r.createTime
      if (time) {
        const parts = time.split(' ')
        return parts[1] ? parts[1].substring(0, 5) : ''
      }
      return ''
    })
    
    let minTemp = Math.min(...temps) - 0.5
    let maxTemp = Math.max(...temps) + 0.5
    let range = maxTemp - minTemp

    if (range < 1) {
      const center = (minTemp + maxTemp) / 2
      minTemp = center - 0.5
      maxTemp = center + 0.5
      range = 1
    }

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.setStrokeStyle('#f0f0f0')
    ctx.setLineWidth(1)
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i * chartHeight) / 4
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      
      const temp = maxTemp - (i * range) / 4
      ctx.setFillStyle('#999999')
      ctx.setFontSize(10)
      ctx.setTextAlign('right')
      ctx.fillText(temp.toFixed(1) + '°', padding.left - 8, y + 4)
    }

    ctx.setStrokeStyle('#4CAF50')
    ctx.setLineWidth(3)
    ctx.beginPath()
    
    const stepX = chartWidth / Math.max(1, temps.length - 1)
    
    temps.forEach((temp, index) => {
      const x = padding.left + index * stepX
      const normalizedY = (maxTemp - temp) / range
      const y = padding.top + normalizedY * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    temps.forEach((temp, index) => {
      const x = padding.left + index * stepX
      const normalizedY = (maxTemp - temp) / range
      const y = padding.top + normalizedY * chartHeight
      
      ctx.setFillStyle('#4CAF50')
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.setFillStyle('#ffffff')
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()

      ctx.setFillStyle('#666666')
      ctx.setFontSize(10)
      ctx.setTextAlign('center')
      ctx.fillText(times[index], x, height - 20)
    })

    ctx.draw()
  },
  
  deleteRecord: function (e) {
    const id = e.currentTarget.dataset.id
    const records = app.getRecords('temperature') || []
    const updatedRecords = records.filter(r => r.id !== id)
    wx.setStorageSync('temperature', updatedRecords)
    app.globalData.temperatureRecords = updatedRecords
    this.loadRecords()
    wx.showToast({
      title: '已删除',
      icon: 'success'
    })
  }
})