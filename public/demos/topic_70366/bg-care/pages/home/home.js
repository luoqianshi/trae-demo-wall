const storage = require('../../utils/storage.js')
const tts = require('../../utils/tts.js')

Page({
  data: {
    greeting: '',
    nickName: '',
    latestRecord: null,
    latestDate: '',
    bpStatus: { text: '', color: '#5B8C5A', className: 'normal' },
    systolicColor: '#2A241A',
    diastolicColor: '#2A241A',
    todayRecords: [],
    hasRecords: false,
    elderlyMode: false,
    ttsEnabled: false
  },

  onLoad: function () {
    var app = getApp()
    this.setData({
      elderlyMode: app.globalData.elderlyMode || false,
      ttsEnabled: tts.isEnabled() || false
    })

    if (this.data.elderlyMode) {
      this.applyElderlyClass(true)
    }
  },

  onShow: function () {
    this.loadData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  applyElderlyClass: function (enabled) {
    try {
      if (enabled) {
        wx.setPageStyle({ style: { '--scale': '1.35' } })
      } else {
        wx.setPageStyle({ style: { '--scale': '1' } })
      }
    } catch (e) { }
  },

  loadData: function () {
    this.setGreeting()
    this.loadNickName()
    this.loadLatestRecord()
    this.loadTodayRecords()
  },

  loadNickName: function () {
    const app = getApp()
    const userInfo = app.globalData.userInfo || {}
    this.setData({ nickName: userInfo.nickName || '您' })
  },

  setGreeting: function () {
    const hour = new Date().getHours()
    let greeting = ''

    if (hour < 9) {
      greeting = '早上好'
    } else if (hour < 12) {
      greeting = '上午好'
    } else if (hour < 14) {
      greeting = '中午好'
    } else if (hour < 18) {
      greeting = '下午好'
    } else {
      greeting = '晚上好'
    }

    this.setData({ greeting })
  },

  loadLatestRecord: function () {
    const latest = storage.getLatestRecord()

    if (!latest) {
      this.setData({
        hasRecords: false,
        latestRecord: null,
        latestDate: '',
        bpStatus: { text: '', color: '#5B8C5A', className: 'normal' },
        systolicColor: '#2A241A',
        diastolicColor: '#2A241A'
      })
      return
    }

    const status = storage.evalBpStatus(latest.systolic, latest.diastolic)
    const text = storage.getBpStatusText(status)
    const color = storage.getBpStatusColor(status)

    const dateStr = storage.formatDate(latest.createdAt)
    const timeStr = storage.formatTime(latest.createdAt)

    const statusClassMap = { normal: 'normal', elevated: 'elevated', high: 'high', critical: 'critical' }

    let systolicColor = '#2A241A'
    let diastolicColor = '#2A241A'

    if (status === 'normal') {
      systolicColor = '#5B8C5A'
      diastolicColor = '#5B8C5A'
    } else if (status === 'elevated') {
      systolicColor = '#C49B3F'
      diastolicColor = '#2A241A'
    } else if (status === 'high') {
      systolicColor = '#CC6B3A'
      diastolicColor = '#CC6B3A'
    } else if (status === 'critical') {
      systolicColor = '#B8453C'
      diastolicColor = '#B8453C'
    }

    this.setData({
      hasRecords: true,
      latestRecord: latest,
      latestDate: dateStr + ' ' + timeStr,
      bpStatus: {
        text,
        color,
        className: statusClassMap[status] || 'normal'
      },
      systolicColor,
      diastolicColor
    })
  },

  loadTodayRecords: function () {
    const records = storage.getTodayRecords()
    const todayRecords = records.map(function (r) {
      const d = new Date(r.createdAt)
      const status = storage.evalBpStatus(r.systolic, r.diastolic)
      return {
        ...r,
        timeStr: storage.formatTime(r.createdAt),
        periodLabel: storage.getPeriodLabel(d.getHours()),
        statusText: storage.getBpStatusText(status),
        statusClass: status
      }
    })

    this.setData({ todayRecords })
  },

  onTapSpeak: function (e) {
    if (!tts.isEnabled()) return
    var text = e.currentTarget.dataset.text || ''
    if (text) {
      tts.speak(text)
    }
  },

  goToManualInput: function () {
    wx.navigateTo({ url: '/pages/manual-input/manual-input' })
  },

  goToCamera: function () {
    wx.navigateTo({ url: '/pages/camera/camera' })
  },

  goToTrends: function () {
    wx.switchTab({ url: '/pages/trends/trends' })
  }
})
