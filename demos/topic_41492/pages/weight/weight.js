const app = getApp()

Page({
  data: {
    currentWeight: '',
    targetWeight: 65,
    inputWeight: 65,
    records: [],
    weightDiff: 0,
    diffColor: 'even',
    showTargetModal: false,
    showWeightModal: false,
    editTargetWeight: '',
    editInputWeight: ''
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    const records = app.getRecords('weight')
    const targetWeight = parseFloat(wx.getStorageSync('targetWeight')) || 65
    
    if (records.length > 0) {
      const latest = records[0]
      this.setData({
        currentWeight: latest.value,
        inputWeight: latest.value,
        records: records.slice(0, 20)
      })
    } else {
      this.setData({
        currentWeight: '',
        inputWeight: targetWeight,
        records: []
      })
    }

    this.setData({
      targetWeight,
      weightDiff: this.calculateDiff(),
      diffColor: this.getDiffColor()
    })

    this.drawChart()
  },

  calculateDiff: function () {
    const current = parseFloat(this.data.currentWeight)
    const target = parseFloat(this.data.targetWeight)
    if (!current || !target) return 0
    return (current - target).toFixed(1)
  },

  getDiffColor: function () {
    const diff = parseFloat(this.data.weightDiff)
    if (diff > 0) return 'gain'
    if (diff < 0) return 'loss'
    return 'even'
  },

  adjustWeight: function (e) {
    const step = parseFloat(e.currentTarget.dataset.step)
    const current = parseFloat(this.data.inputWeight)
    const newValue = Math.max(30, Math.min(200, current + step))
    this.setData({
      inputWeight: newValue.toFixed(1)
    })
  },

  addRecord: function () {
    app.saveRecord('weight', { value: parseFloat(this.data.inputWeight) })
    this.loadData()
    wx.showToast({
      title: '记录成功',
      icon: 'success'
    })
  },
  
  editTargetWeight: function () {
    this.setData({
      showTargetModal: true,
      editTargetWeight: this.data.targetWeight.toString()
    })
  },
  
  hideTargetModal: function () {
    this.setData({
      showTargetModal: false
    })
  },
  
  onTargetInput: function (e) {
    this.setData({
      editTargetWeight: e.detail.value
    })
  },
  
  saveTargetWeight: function () {
    const target = parseFloat(this.data.editTargetWeight)
    if (!target || target <= 0) {
      wx.showToast({
        title: '请输入有效体重',
        icon: 'none'
      })
      return
    }
    wx.setStorageSync('targetWeight', target)
    this.setData({
      targetWeight: target,
      showTargetModal: false
    })
    this.loadData()
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },
  
  showWeightInput: function () {
    this.setData({
      showWeightModal: true,
      editInputWeight: this.data.inputWeight.toString()
    })
  },
  
  hideWeightModal: function () {
    this.setData({
      showWeightModal: false
    })
  },
  
  onWeightInput: function (e) {
    this.setData({
      editInputWeight: e.detail.value
    })
  },
  
  saveWeightInput: function () {
    const weight = parseFloat(this.data.editInputWeight)
    if (!weight || weight <= 0) {
      wx.showToast({
        title: '请输入有效体重',
        icon: 'none'
      })
      return
    }
    this.setData({
      inputWeight: weight.toFixed(1),
      showWeightModal: false
    })
    wx.showToast({
      title: '已修改',
      icon: 'success'
    })
  },

  getChange: function (id) {
    const index = this.data.records.findIndex(r => r.id === id)
    if (index >= this.data.records.length - 1) return ''
    
    const current = parseFloat(this.data.records[index].value)
    const prev = parseFloat(this.data.records[index + 1].value)
    const change = (current - prev).toFixed(1)
    
    if (change > 0) return `↑${change}kg`
    if (change < 0) return `↓${Math.abs(change)}kg`
    return '→0kg'
  },
  
  formatDate: function (dateStr) {
    if (!dateStr) return ''
    return dateStr
  },

  drawChart: function () {
    const records = this.data.records
    if (records.length < 2) return

    const ctx = wx.createCanvasContext('weightChart')
    const width = 650
    const height = 340
    const padding = { top: 30, right: 40, bottom: 50, left: 60 }

    const data = records.slice(0, 7).reverse()
    const weights = data.map(r => parseFloat(r.value))
    const dates = data.map(r => this.formatDateShort(r.createTime))
    
    let minWeight = Math.min(...weights) - 0.5
    let maxWeight = Math.max(...weights) + 0.5
    let range = maxWeight - minWeight

    if (range < 1) {
      const center = (minWeight + maxWeight) / 2
      minWeight = center - 0.5
      maxWeight = center + 0.5
      range = 1
    }

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.setStrokeStyle('#e0e0e0')
    ctx.setLineWidth(1)
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i * chartHeight) / 4
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      
      const weight = maxWeight - (i * range) / 4
      ctx.setFillStyle('#999999')
      ctx.setFontSize(10)
      ctx.setTextAlign('right')
      ctx.fillText(weight.toFixed(1) + 'kg', padding.left - 8, y + 4)
    }

    ctx.setStrokeStyle('#2196F3')
    ctx.setLineWidth(3)
    ctx.beginPath()
    
    const stepX = chartWidth / Math.max(1, weights.length - 1)
    
    weights.forEach((weight, index) => {
      const x = padding.left + index * stepX
      const normalizedY = (maxWeight - weight) / range
      const y = padding.top + normalizedY * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    weights.forEach((weight, index) => {
      const x = padding.left + index * stepX
      const normalizedY = (maxWeight - weight) / range
      const y = padding.top + normalizedY * chartHeight
      
      ctx.setFillStyle('#2196F3')
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
      ctx.fillText(dates[index], x, height - 20)
    })

    ctx.draw()
  },
  
  formatDateShort: function (dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split(' ')
    if (parts.length >= 1) {
      return parts[0]
    }
    return dateStr
  },
  
  deleteRecord: function (e) {
    const id = e.currentTarget.dataset.id
    const records = app.getRecords('weight') || []
    const updatedRecords = records.filter(r => r.id !== id)
    wx.setStorageSync('weight', updatedRecords)
    app.globalData.weightRecords = updatedRecords
    this.loadData()
    wx.showToast({
      title: '已删除',
      icon: 'success'
    })
  }
})