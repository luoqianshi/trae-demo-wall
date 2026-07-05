const AI_CONFIG_KEY = 'ai_config'

const DEFAULT_CONFIG = {
  baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
  apiKey: 'tp-cs7eammxbwx588zovzdu9tfqah4rqbsqlggbbtbe5h6k98q1',
  model: 'mimo-v2.5-pro'
}

let aiConfig = null

function loadConfig() {
  try {
    const saved = wx.getStorageSync(AI_CONFIG_KEY)
    if (saved && saved.baseUrl && saved.apiKey) {
      aiConfig = { ...DEFAULT_CONFIG, ...saved }
      return
    }
  } catch (e) { }

  aiConfig = { ...DEFAULT_CONFIG }
  saveConfigToStorage()
}

function saveConfigToStorage() {
  try {
    wx.setStorageSync(AI_CONFIG_KEY, {
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model
    })
  } catch (e) { }
}

function setConfig(config) {
  if (!aiConfig) loadConfig()
  aiConfig = { ...aiConfig, ...config }
  saveConfigToStorage()
}

function getConfig() {
  if (!aiConfig) loadConfig()
  return { ...aiConfig }
}

function callMimoModel(messages, options) {
  if (!options) options = {}
  if (!aiConfig) loadConfig()

  return new Promise(function (resolve, reject) {
    if (!aiConfig || !aiConfig.baseUrl || !aiConfig.apiKey) {
      reject(new Error('AI配置未完成'))
      return
    }

    var requestUrl = aiConfig.baseUrl + '/chat/completions'

    wx.request({
      url: requestUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'api-key': aiConfig.apiKey
      },
      data: {
        model: options.model || aiConfig.model || 'mimo-v2.5-pro',
        messages: messages,
        temperature: options.temperature != null ? options.temperature : 0.5,
        max_tokens: options.maxTokens || 2000
      },
      success: function (res) {
        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
          resolve(res.data.choices[0].message.content)
        } else {
          var errMsg = 'AI请求失败'
          if (res.data && res.data.error && res.data.error.message) {
            errMsg = res.data.error.message
          } else if (res.statusCode !== 200) {
            errMsg = 'AI请求失败: HTTP ' + res.statusCode
          }
          reject(new Error(errMsg))
        }
      },
      fail: function (err) {
        reject(new Error('网络请求失败: ' + err.errMsg))
      }
    })
  })
}

function generateHealthAnalysis(records) {
  if (!records || records.length === 0) {
    return Promise.reject(new Error('暂无血压记录数据'))
  }

  var recentRecords = records.slice(0, 14)
  var sysValues = recentRecords.map(function (r) { return r.systolic })
  var diaValues = recentRecords.map(function (r) { return r.diastolic })
  var hrValues = recentRecords.filter(function (r) { return r.heartRate }).map(function (r) { return r.heartRate })

  var avgSys = Math.round(sysValues.reduce(function (a, b) { return a + b }, 0) / sysValues.length)
  var avgDia = Math.round(diaValues.reduce(function (a, b) { return a + b }, 0) / diaValues.length)
  var avgHr = hrValues.length > 0
    ? Math.round(hrValues.reduce(function (a, b) { return a + b }, 0) / hrValues.length)
    : 0

  var dataSummary = recentRecords.map(function (r) {
    var d = new Date(r.createdAt)
    return (d.getMonth() + 1) + '/' + d.getDate() + ' 高压' + r.systolic + ' 低压' + r.diastolic +
      (r.heartRate ? ' 心率' + r.heartRate : '')
  }).join('；')

  var systemPrompt = '你是一位专业、温暖的健康顾问，专门为长辈提供血压健康分析。请用亲切、易懂的中文，使用关怀的口吻。回复需要大段落，分点说明。'
  var userPrompt = '请根据以下血压记录数据，生成一份健康分析报告：\n\n' +
    '共有' + recentRecords.length + '天血压记录：\n' +
    dataSummary + '\n\n' +
    '平均高压：' + avgSys + ' mmHg\n' +
    '平均低压：' + avgDia + ' mmHg\n' +
    (avgHr > 0 ? '平均心率：' + avgHr + ' 次/分\n\n' : '\n') +
    '请从以下方面进行分析：\n' +
    '1. 整体血压状况评估（简短一两句）\n' +
    '2. 健康指数打分（0-100分，数字）\n' +
    '3. 需要关注的问题（如有）\n' +
    '4. 做得好的方面（鼓励）\n' +
    '5. 饮食、运动、用药方面的建议\n\n' +
    '请用温暖关怀的语气回复，把长辈称呼为"您"。'

  return callMimoModel([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.5, maxTokens: 1500 })
}

function generateHealthAdvice(question, records) {
  var dataContext = records.slice(0, 14).map(function (r) {
    var d = new Date(r.createdAt)
    return (d.getMonth() + 1) + '/' + d.getDate() + ' 高压' + r.systolic + ' 低压' + r.diastolic +
      (r.heartRate ? ' 心率' + r.heartRate : '')
  }).join('；')

  var systemPrompt = '你是一位专业、温暖的健康顾问，专门为长辈提供血压健康建议。请用亲切、易懂的中文回复，使用关怀的口吻。重要提醒：你的建议仅供参考，不能替代医生诊断。'
  var userPrompt = '用户最近的血压数据：' + dataContext + '\n\n用户的问题：' + question + '\n\n请用温暖关怀的语气回答。'

  return callMimoModel([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])
}

loadConfig()

function buildBpContext(records) {
  if (!records || records.length === 0) return ''

  var recentRecords = records.slice(0, 14)
  var sysValues = recentRecords.map(function (r) { return r.systolic })
  var diaValues = recentRecords.map(function (r) { return r.diastolic })
  var hrValues = recentRecords.filter(function (r) { return r.heartRate }).map(function (r) { return r.heartRate })

  var avgSys = Math.round(sysValues.reduce(function (a, b) { return a + b }, 0) / sysValues.length)
  var avgDia = Math.round(diaValues.reduce(function (a, b) { return a + b }, 0) / diaValues.length)
  var avgHr = hrValues.length > 0
    ? Math.round(hrValues.reduce(function (a, b) { return a + b }, 0) / hrValues.length)
    : 0

  var dataSummary = recentRecords.map(function (r) {
    var d = new Date(r.createdAt)
    return (d.getMonth() + 1) + '/' + d.getDate() + ' 高压' + r.systolic + ' 低压' + r.diastolic +
      (r.heartRate ? ' 心率' + r.heartRate : '')
  }).join('；')

  var ctx = '用户最近的血压记录（共' + recentRecords.length + '天）：' + dataSummary + '。'
  ctx += '平均高压' + avgSys + 'mmHg，平均低压' + avgDia + 'mmHg'
  if (avgHr > 0) ctx += '，平均心率' + avgHr + '次/分'
  ctx += '。'
  return ctx
}

function stripMarkdown(text) {
  if (!text) return ''
  var result = text
  result = result.replace(/\*\*(.+?)\*\*/g, '$1')
  result = result.replace(/__(.+?)__/g, '$1')
  result = result.replace(/~~(.+?)~~/g, '$1')
  result = result.replace(/`{1,3}[^`]*`{1,3}/g, '')
  result = result.replace(/^#{1,6}\s+/gm, '')
  result = result.replace(/^\s*[-*+]\s+/gm, '')
  result = result.replace(/^\s*\d+\.\s+/gm, '')
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.trim()
  return result
}

function generalChat(chatMessages, records) {
  var bpCtx = buildBpContext(records)

  var systemContent = '你叫"小血压"，是一位亲切温暖的健康生活助手，专门陪伴长辈。你的性格温柔体贴，像家人的朋友一样。' +
    '你可以聊血压健康、饮食养生、运动建议，也可以闲聊天气、日期、日常话题。' +
    '回复时请用亲切易懂的中文，称呼用户为"您"，语气温暖自然。回复要简洁，控制在3-5句话以内。' +
    '如果用户问到血压相关问题，请结合已知的血压数据分析；如果用户聊其他话题，就自然地闲聊，不要强行扯回血压。' +
    '请使用纯文本回复，不要使用markdown格式，不要使用*号或#号。'
  if (bpCtx) {
    systemContent += ' ' + bpCtx
  }
  systemContent += ' 重要提醒：你的建议仅供参考，不能替代医生诊断。'

  var apiMessages = [{ role: 'system', content: systemContent }]

  for (var i = 0; i < chatMessages.length; i++) {
    var msg = chatMessages[i]
    var role = msg.role
    if (role === 'ai' && msg.type === 'analysis_card') continue
    if (role === 'ai' && msg.closing) continue
    var content = msg.content || ''
    if (!content) continue
    apiMessages.push({
      role: role === 'ai' ? 'assistant' : 'user',
      content: content
    })
  }

  return callMimoModel(apiMessages, { temperature: 0.7, maxTokens: 600 }).then(function(rawText) {
    return stripMarkdown(rawText)
  })
}

module.exports = {
  setConfig: setConfig,
  getConfig: getConfig,
  callMimoModel: callMimoModel,
  generateHealthAnalysis: generateHealthAnalysis,
  generateHealthAdvice: generateHealthAdvice,
  generalChat: generalChat,
  buildBpContext: buildBpContext
}
