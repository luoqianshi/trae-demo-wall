const storage = require('../../utils/storage')
const ai = require('../../utils/ai')

function generateId() {
  return 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
}

function getBpCategory(sys, dia) {
  if (sys < 120 && dia < 80) return { level: 'normal', label: '正常' }
  if (sys < 130 && dia < 80) return { level: 'elevated', label: '正常偏高' }
  if (sys < 140 || dia < 90) return { level: 'high', label: '高血压前期' }
  if (sys < 160 || dia < 100) return { level: 'stage1', label: '轻度高血压' }
  if (sys < 180 || dia < 110) return { level: 'stage2', label: '中度高血压' }
  return { level: 'critical', label: '重度高血压' }
}

function getSystolicTrend(dailyData) {
  var sysValues = dailyData.filter(function(d) { return d.systolic !== null }).map(function(d) { return d.systolic })
  if (sysValues.length < 2) return 'stable'

  var firstHalf = sysValues.slice(0, Math.floor(sysValues.length / 2))
  var secondHalf = sysValues.slice(Math.floor(sysValues.length / 2))
  var firstAvg = firstHalf.reduce(function(a, b) { return a + b }, 0) / firstHalf.length
  var secondAvg = secondHalf.reduce(function(a, b) { return a + b }, 0) / secondHalf.length
  var diff = secondAvg - firstAvg

  if (diff > 5) return 'rising'
  if (diff < -5) return 'falling'
  return 'stable'
}

function getVolatility(dailyData) {
  var sysValues = dailyData.filter(function(d) { return d.systolic !== null }).map(function(d) { return d.systolic })
  if (sysValues.length < 2) return 'low'

  var avg = sysValues.reduce(function(a, b) { return a + b }, 0) / sysValues.length
  var variance = sysValues.reduce(function(s, v) { return s + (v - avg) * (v - avg) }, 0) / sysValues.length
  var stdDev = Math.sqrt(variance)

  if (stdDev > 15) return 'high'
  if (stdDev > 8) return 'moderate'
  return 'low'
}

function generateLocalAnalysis(records) {
  var dailyData = storage.getLatest7DaysData()
  var validDays = dailyData.filter(function(d) { return d.systolic !== null })
  var stats = storage.getStatsSummary(7)

  if (!stats || validDays.length === 0) {
    return {
      overallAssessment: '暂无足够的血压数据，请先记录血压后再来查看分析报告。',
      healthScore: 0,
      findings: [{
        type: 'info',
        text: '建议每天早晚各测量一次血压，连续记录7天以上可获得更准确的分析结果。'
      }],
      recommendations: [
        { label: '测量方面', text: '每天固定时间测量，保持安静状态下进行' },
        { label: '记录方面', text: '每次测量后及时记录，方便追踪变化趋势' }
      ]
    }
  }

  var avgSys = stats.avgSystolic
  var avgDia = stats.avgDiastolic
  var avgHr = stats.avgHeartRate
  var bpCategory = getBpCategory(avgSys, avgDia)
  var sysTrend = getSystolicTrend(dailyData)
  var volatility = getVolatility(dailyData)
  var maxSys = Math.max.apply(null, validDays.map(function(d) { return d.systolic }))
  var minSys = Math.min.apply(null, validDays.map(function(d) { return d.systolic }))

  var healthScore = 75
  if (bpCategory.level === 'normal') healthScore = 92
  else if (bpCategory.level === 'elevated') healthScore = 80
  else if (bpCategory.level === 'high') healthScore = 68
  else if (bpCategory.level === 'stage1') healthScore = 55
  else if (bpCategory.level === 'stage2') healthScore = 40
  else healthScore = 25

  if (sysTrend === 'rising') healthScore = Math.max(healthScore - 10, 10)
  else if (sysTrend === 'falling') healthScore = Math.min(healthScore + 8, 100)
  if (volatility === 'high') healthScore = Math.max(healthScore - 8, 10)
  else if (volatility === 'low') healthScore = Math.min(healthScore + 5, 100)
  if (validDays.length >= 6) healthScore = Math.min(healthScore + 5, 100)

  var overallAssessment = ''
  if (bpCategory.level === 'normal') {
    overallAssessment = '您的血压保持在理想范围内，非常健康！'
    if (sysTrend === 'rising') overallAssessment = '血压总体正常，但近期有轻微上升趋势，建议关注。'
  } else if (bpCategory.level === 'elevated') {
    overallAssessment = '血压略偏高，处于正常高值范围，需要注意生活方式调节。'
    if (sysTrend === 'rising') overallAssessment = '血压偏高且有上升趋势，请引起重视，调整生活习惯。'
  } else if (bpCategory.level === 'high') {
    overallAssessment = '血压处于高血压前期，建议及时调整饮食和运动习惯。'
    if (sysTrend === 'rising') overallAssessment = '血压持续偏高且呈上升趋势，建议咨询医生进行评估。'
  } else if (bpCategory.level === 'stage1') {
    overallAssessment = '血压已达到轻度高血压水平，建议尽快就医咨询专业意见。'
  } else if (bpCategory.level === 'stage2') {
    overallAssessment = '血压处于中度高血压范围，请务必遵医嘱规律服药和监测。'
  } else {
    overallAssessment = '血压处于较高水平，强烈建议您立即就医进行全面检查。'
  }

  var findings = []

  if (sysTrend === 'rising') {
    findings.push({
      type: 'warning',
      text: '最近几天收缩压有上升趋势（从' + minSys + '升至' + maxSys + 'mmHg），建议持续监测并注意休息。'
    })
  } else if (sysTrend === 'falling') {
    findings.push({
      type: 'success',
      text: '血压近期呈下降趋势，说明您的生活方式调整正在起作用，继续保持！'
    })
  }

  if (volatility === 'high') {
    findings.push({
      type: 'warning',
      text: '血压波动幅度较大（波动范围' + (maxSys - minSys) + 'mmHg），建议固定测量时间和状态，保证数据可比性。'
    })
  } else if (volatility === 'low') {
    findings.push({
      type: 'success',
      text: '血压波动幅度小，说明您的血压控制得比较稳定，非常不错！'
    })
  }

  if (avgHr > 0 && avgHr >= 60 && avgHr <= 100) {
    findings.push({
      type: 'success',
      text: '平均心率' + avgHr + '次/分，保持在正常范围内，心脏功能良好！'
    })
  } else if (avgHr > 100) {
    findings.push({
      type: 'warning',
      text: '平均心率' + avgHr + '次/分，略偏快，建议减少咖啡因摄入并保持情绪平稳。'
    })
  }

  if (avgDia >= 90) {
    findings.push({
      type: 'warning',
      text: '平均舒张压' + avgDia + 'mmHg偏高，舒张压过高会增加心血管负担，需引起重视。'
    })
  }

  if (validDays.length < 4) {
    findings.push({
      type: 'info',
      text: '近7天仅有' + validDays.length + '天有记录，建议保持每天规律测量，便于更准确地评估血压状况。'
    })
  }

  if (validDays.length >= 6 && bpCategory.level !== 'critical' && bpCategory.level !== 'stage2') {
    findings.push({
      type: 'success',
      text: '您测量习惯很好，坚持每天记录有助于更好地管理血压健康！'
    })
  }

  var recommendations = []

  if (avgSys >= 130 || avgDia >= 85) {
    recommendations.push({
      label: '饮食方面',
      text: '控制盐分摄入（每天不超过5克），少吃腌制食品，多吃富含钾的蔬果如香蕉、菠菜。'
    })
  } else {
    recommendations.push({
      label: '饮食方面',
      text: '继续保持低盐低脂的饮食习惯，多吃新鲜蔬菜水果，适量补充优质蛋白。'
    })
  }

  if (sysTrend === 'rising' || volatility === 'high') {
    recommendations.push({
      label: '运动方面',
      text: '建议每天进行30分钟中等强度运动（如快走、太极拳），避免剧烈运动，运动前后注意测量血压。'
    })
  } else {
    recommendations.push({
      label: '运动方面',
      text: '保持每天适度运动的好习惯，散步、太极都是很好的选择，每周至少坚持5天。'
    })
  }

  if (bpCategory.level === 'stage1' || bpCategory.level === 'stage2' || bpCategory.level === 'critical') {
    recommendations.push({
      label: '用药方面',
      text: '请严格遵医嘱按时服用降压药，不可自行停药或增减药量，定期复诊评估治疗效果。'
    })
  } else if (bpCategory.level === 'high') {
    recommendations.push({
      label: '用药方面',
      text: '目前处于高血压前期，建议先通过生活方式干预，如3个月无法改善请咨询医生。'
    })
  } else {
    recommendations.push({
      label: '用药方面',
      text: '血压控制良好，请遵医嘱维持当前方案，不要随意停药。如有服药请按时按量。'
    })
  }

  if (avgHr > 0) {
    recommendations.push({
      label: '情绪管理',
      text: '保持心态平和，避免情绪大起大落。听音乐、深呼吸、与家人聊天都有助于放松心情。'
    })
  }

  return {
    overallAssessment: overallAssessment,
    healthScore: healthScore,
    findings: findings.slice(0, 5),
    recommendations: recommendations
  }
}

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    userName: '',
    userNameFirst: '我',
    scrollToId: ''
  },

  onLoad: function() {
    var self = this
    var app = getApp()
    var userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    var userName = ''
    var userNameFirst = '我'

    if (userInfo && userInfo.nickName) {
      userName = userInfo.nickName
      userNameFirst = userInfo.nickName.charAt(0)
    }

    this.setData({
      userName: userName,
      userNameFirst: userNameFirst
    })

    var records = app.globalData.records || storage.getRecords()

    var greeting = '您好！我是您的专属健康助手，可以帮您分析最近的血压数据。'
    if (userName) {
      greeting = userName + '您好！我是您的专属健康助手，可以帮您分析最近的血压数据。'
    }

    var welcomeMessages = [{
      id: generateId(),
      role: 'ai',
      content: greeting,
      large: true
    }]

    this.setData({ messages: welcomeMessages })
    var selfRef = this

    if (records && records.length > 0) {
      this.setData({ loading: true })
      var scrollTimer = setTimeout(function() {
        selfRef.scrollToBottom()
      }, 300)

      var aiConfig = ai.getConfig()
      if (aiConfig && aiConfig.baseUrl && aiConfig.apiKey) {
        ai.setConfig(aiConfig)
        wx.nextTick(function() {
          ai.generateHealthAnalysis(records).then(function(aiText) {
            clearTimeout(scrollTimer)
            selfRef.setData({ loading: false })
            var messages = selfRef.data.messages.slice()
            messages.push({
              id: generateId(),
              role: 'ai',
              content: aiText,
              large: false
            })
            messages.push({
              id: generateId(),
              role: 'ai',
              content: '以上建议仅供参考，如有不适请及时就医哦~',
              closing: true
            })
            selfRef.setData({ messages: messages })
            wx.nextTick(function() { selfRef.scrollToBottom() })
          }).catch(function() {
            selfRef.generateLocalReport(records, scrollTimer)
          })
        })
      } else {
        wx.nextTick(function() {
          selfRef.generateLocalReport(records, scrollTimer)
        })
      }
    }
  },

  generateLocalReport: function(records, scrollTimer) {
    var self = this
    var report = generateLocalAnalysis(records)
    clearTimeout(scrollTimer)
    this.setData({ loading: false })

    var messages = self.data.messages.slice()
    messages.push({
      id: generateId(),
      role: 'ai',
      type: 'analysis_card',
      report: report
    })
    messages.push({
      id: generateId(),
      role: 'ai',
      content: '以上建议仅供参考，如有不适请及时就医哦~',
      closing: true
    })
    self.setData({ messages: messages })
    wx.nextTick(function() { self.scrollToBottom() })
  },

  onInput: function(e) {
    this.setData({ inputValue: e.detail.value })
  },

  sendMessage: function() {
    var self = this
    var value = this.data.inputValue.trim()
    if (!value || this.data.loading) return

    var messages = this.data.messages.slice()
    messages.push({
      id: generateId(),
      role: 'user',
      content: value
    })
    this.setData({ inputValue: '', messages: messages, loading: true })
    wx.nextTick(function() { self.scrollToBottom() })

    var app = getApp()
    var records = app.globalData.records || storage.getRecords()
    var aiConfig = ai.getConfig()

    if (aiConfig && aiConfig.baseUrl && aiConfig.apiKey) {
      ai.setConfig(aiConfig)
      ai.generalChat(messages, records).then(function(aiText) {
        var msgs = self.data.messages.slice()
        msgs.push({
          id: generateId(),
          role: 'ai',
          content: aiText
        })
        self.setData({ loading: false, messages: msgs })
        wx.nextTick(function() { self.scrollToBottom() })
      }).catch(function() {
        self.generateLocalAdvice(value, records, messages)
      })
    } else {
      self.generateLocalAdvice(value, records, messages)
    }
  },

  generateLocalAdvice: function(question, records, chatMessages) {
    var self = this
    var stats = storage.getStatsSummary(7)

    var healthKeywords = ['血压', '高压', '低压', '心率', '饮食', '吃', '运动',
      '锻炼', '药', '降压', '健康', '头晕', '胸闷', '睡眠', '盐', '油', '胖', '瘦']
    var isHealthQuestion = false
    for (var i = 0; i < healthKeywords.length; i++) {
      if (question.indexOf(healthKeywords[i]) !== -1) {
        isHealthQuestion = true
        break
      }
    }

    var reply = ''

    if (isHealthQuestion && stats) {
      var bpCategory = getBpCategory(stats.avgSystolic, stats.avgDiastolic)
      reply = '根据您近期的数据，平均血压为' + stats.avgSystolic + '/' + stats.avgDiastolic + 'mmHg（' + bpCategory.label + '）。'

      if (question.indexOf('饮食') !== -1 || question.indexOf('吃') !== -1) {
        reply += '饮食上建议低盐低脂，每天食盐不超过5克，多吃新鲜蔬果和全谷物，少吃腌制食品和肥肉。'
      } else if (question.indexOf('运动') !== -1 || question.indexOf('锻炼') !== -1) {
        reply += '建议每天进行30分钟左右的中等强度运动，如快走、太极拳、骑自行车等，避免剧烈运动。'
      } else if (question.indexOf('药') !== -1 || question.indexOf('降压') !== -1) {
        reply += '请严格遵医嘱按时按量服药，不可自行停药或调整剂量。如有不适请及时咨询医生。'
      } else {
        reply += '建议您保持规律作息、低盐饮食、适度运动，最重要的是遵医嘱按时服药和定期监测血压哦~'
      }
    } else if (isHealthQuestion && !stats) {
      reply = '目前还没有您的血压记录数据呢，建议您先记录血压，这样才能给您更有针对性的建议哦~'
    } else {
      var now = new Date()
      var weekDays = ['日', '一', '二', '三', '四', '五', '六']
      var weekDayStr = '星期' + weekDays[now.getDay()]
      var month = now.getMonth() + 1
      var day = now.getDate()

      var casualReplies = [
        '今天是' + month + '月' + day + '日 ' + weekDayStr + '，天气好的话可以出门散散步哦！有什么我可以帮您的吗？',
        '您好呀！今天是个好日子，' + weekDayStr + '总让人心情愉快呢。想聊些什么呢？',
        '嗨！我是小血压，您的健康生活小助手。' + weekDayStr + '了，记得保持好心情哦~',
        weekDayStr + '快乐！有什么想聊的尽管问我，饮食、运动、日常生活都可以哦~'
      ]
      reply = casualReplies[Math.floor(Math.random() * casualReplies.length)]
    }

    var msgs = chatMessages.slice()
    msgs.push({
      id: generateId(),
      role: 'ai',
      content: reply
    })
    self.setData({ loading: false, messages: msgs })
    wx.nextTick(function() { self.scrollToBottom() })
  },

  scrollToBottom: function() {
    var messages = this.data.messages
    if (messages.length > 0) {
      this.setData({ scrollToId: 'msg-' + (messages.length - 1) })
    }
  },

  goBack: function() {
    wx.navigateBack({ delta: 1 })
  }
})
