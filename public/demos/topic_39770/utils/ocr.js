/**
 * 百度OCR文字识别服务
 * 功能：将图片转为base64 -> 获取access_token -> 调用OCR识别 -> 解析结果
 * 
 * 注意：config.js 延迟加载，避免模块初始化时阻塞
 */

// 缓存access_token，避免重复请求
let cachedToken = ''
let tokenExpireTime = 0

/**
 * 延迟加载配置（避免模块顶层 require 导致初始化阻塞）
 */
function getConfig() {
  return require('./config.js')
}

/**
 * 获取百度API的access_token
 */
function getAccessToken() {
  return new Promise((resolve, reject) => {
    // 如果token还没过期，直接返回缓存的
    if (cachedToken && Date.now() < tokenExpireTime) {
      resolve(cachedToken)
      return
    }

    const config = getConfig()

    // 检查是否已配置密钥
    if (!config.apiKey || config.apiKey === 'YOUR_API_KEY' || 
        !config.secretKey || config.secretKey === 'YOUR_SECRET_KEY') {
      reject(new Error('请先在 utils/config.js 中配置百度OCR的API Key和Secret Key'))
      return
    }

    wx.request({
      url: config.tokenUrl,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        grant_type: 'client_credentials',
        client_id: config.apiKey,
        client_secret: config.secretKey
      },
      success: (res) => {
        if (res.data && res.data.access_token) {
          cachedToken = res.data.access_token
          // token有效期30天，提前1天刷新
          tokenExpireTime = Date.now() + (res.data.expires_in - 86400) * 1000
          resolve(cachedToken)
        } else {
          reject(new Error('获取access_token失败：' + JSON.stringify(res.data)))
        }
      },
      fail: (err) => {
        reject(new Error('网络请求失败：' + err.errMsg))
      }
    })
  })
}

/**
 * 将本地图片文件转为base64
 */
function imageToBase64(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(new Error('读取图片失败：' + err.errMsg))
      }
    })
  })
}

/**
 * 调用百度OCR识别图片中的文字
 * @param {string} filePath 本地图片路径
 * @returns {Promise<Array>} 识别出的文字行数组 [{words: '识别的文字'}, ...]
 */
function recognizeText(filePath) {
  return new Promise((resolve, reject) => {
    const config = getConfig()

    // 1. 图片转base64
    imageToBase64(filePath).then((base64) => {
      // 2. 获取access_token
      return getAccessToken().then((token) => {
        // 3. 调用OCR接口
        wx.request({
          url: config.ocrUrl + '?access_token=' + token,
          method: 'POST',
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          data: {
            image: base64,
            language_type: 'CHN_ENG'
          },
          success: (res) => {
            if (res.data && res.data.words_result) {
              const lines = res.data.words_result.map(function(item) { return item.words })
              resolve(lines)
            } else {
              reject(new Error('OCR识别失败：' + JSON.stringify(res.data)))
            }
          },
          fail: (err) => {
            reject(new Error('OCR请求失败：' + err.errMsg))
          }
        })
      })
    }).catch((err) => {
      reject(err)
    })
  })
}

/**
 * 从OCR识别的文字行中，智能分析出题目
 * 简单规则：按行号、题号等特征分割题目
 * @param {Array} lines OCR识别出的文字行
 * @returns {Array} 题目列表
 */
function parseQuestions(lines) {
  if (!lines || lines.length === 0) return []

  var questions = []
  var currentQuestion = ''
  var currentNumber = 0

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue

    // 检测题号模式：数字. 或 数字、等
    var match = line.match(/^(\d+)[.、．)\s]/)

    if (match) {
      if (currentQuestion) {
        questions.push({
          number: currentNumber,
          text: currentQuestion.trim()
        })
      }
      currentNumber = parseInt(match[1])
      currentQuestion = line.replace(/^(\d+)[.、．)\s]/, '')
    } else {
      // 检测"第X题"格式
      var match2 = line.match(/第(\d+)[题]/)
      if (match2) {
        if (currentQuestion) {
          questions.push({
            number: currentNumber,
            text: currentQuestion.trim()
          })
        }
        currentNumber = parseInt(match2[1])
        currentQuestion = line.replace(/第(\d+)[题][.、．:\s]*/, '')
      } else {
        currentQuestion += ' ' + line
      }
    }
  }

  if (currentQuestion) {
    questions.push({
      number: currentNumber,
      text: currentQuestion.trim()
    })
  }

  return questions
}

module.exports = {
  recognizeText: recognizeText,
  parseQuestions: parseQuestions,
  getAccessToken: getAccessToken
}
