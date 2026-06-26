/**
 * 上传页 - 拍照/相册选取 + 云函数OCR识别
 * 
 * 流程：拍照/选照片 -> 上传到云存储 -> 云函数从云存储读取图片 -> OCR识别
 * 通过云存储中转，避免云函数调用5MB数据限制
 * 
 * 使用前需要完成以下配置：
 * 1. 获取百度OCR密钥（API Key + Secret Key）
 * 2. 在云函数 cloudfunctions/ocr/index.js 中填入密钥
 * 3. 开通云开发环境
 * 4. 部署云函数
 */

const app = getApp()

Page({
  data: {
    stage: 'choose',
    imagePath: '',
    recognizeProgress: 0,
    recognizeMode: '',
    ocrTextLines: [],
    recognizeResults: [],
    selectedCount: 0
  },

  onTakePhoto() {
    if (this.data.stage !== 'choose') return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath, stage: 'preview' })
      },
      fail: (err) => { console.log('拍照取消或失败', err) }
    })
  },

  onPickFromAlbum() {
    if (this.data.stage !== 'choose') return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath, stage: 'preview' })
      },
      fail: (err) => { console.log('选取取消或失败', err) }
    })
  },

  onStartRecognize() {
    this.setData({ stage: 'recognizing', recognizeProgress: 0, recognizeMode: '' })
    this.doRecognize()
  },

  doRecognize() {
    const that = this

    // 进度条动画
    let progress = 0
    var progressTimer = setInterval(function() {
      progress += Math.random() * 8 + 2
      if (progress > 90) progress = 90
      that.setData({ recognizeProgress: Math.floor(progress) })
    }, 200)

    // 初始化云开发
    if (!wx.cloud) {
      clearInterval(progressTimer)
      that.setData({ stage: 'preview' })
      wx.showModal({ title: '提示', content: '当前微信版本不支持云开发，请更新微信版本', showCancel: false })
      return
    }

    wx.cloud.init({ traceUser: true })
    that.setData({ recognizeMode: '百度OCR识别' })

    // 第一步：上传图片到云存储
    var cloudPath = 'ocr_temp/' + Date.now() + '_' + Math.floor(Math.random() * 10000) + '.jpg'

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: that.data.imagePath,
      success: function(uploadRes) {
        // 上传成功，获取fileID
        var fileID = uploadRes.fileID
        console.log('图片上传到云存储成功：', fileID)

        // 第二步：调用云函数，传入fileID
        that.callCloudOCR(fileID, progressTimer)
      },
      fail: function(err) {
        clearInterval(progressTimer)
        console.log('上传图片到云存储失败：', err)
        wx.showModal({
          title: '上传失败',
          content: '无法上传图片到云存储，请检查云开发环境是否正常。\n\n错误：' + (err.errMsg || '未知错误'),
          showCancel: true, cancelText: '返回', confirmText: '重试', confirmColor: '#667eea',
          success: function(m) { that.setData({ stage: m.confirm ? 'preview' : 'choose' }) }
        })
      }
    })
  },

  callCloudOCR(fileID, progressTimer) {
    const that = this

    wx.cloud.callFunction({
      name: 'ocr',
      data: { fileID: fileID },
      success: function(res) {
        clearInterval(progressTimer)
        console.log('云函数返回：', res.result)

        if (res.result && res.result.success) {
          that.setData({ recognizeProgress: 100 })
          that.showRecognizeResults(res.result.textLines)
        } else {
          var errorMsg = (res.result && res.result.error) ? res.result.error : '未知错误'
          wx.showModal({
            title: '识别失败',
            content: errorMsg + '\n\n请检查云函数中是否已配置百度OCR密钥。',
            showCancel: true, cancelText: '返回', confirmText: '重试', confirmColor: '#667eea',
            success: function(m) { that.setData({ stage: m.confirm ? 'preview' : 'choose' }) }
          })
        }
      },
      fail: function(err) {
        clearInterval(progressTimer)
        console.log('云函数调用失败：', err)
        wx.showModal({
          title: '云函数调用失败',
          content: '错误：' + (err.errMsg || '未知错误') +
                   '\n\n请确保：\n1. 已开通云开发环境\n2. 已上传部署ocr云函数\n3. 云函数中已配置百度OCR密钥',
          showCancel: true, cancelText: '返回', confirmText: '重试', confirmColor: '#667eea',
          success: function(m) { that.setData({ stage: m.confirm ? 'preview' : 'choose' }) }
        })
      }
    })
  },

  parseQuestionsFromLines(textLines) {
    if (!textLines || textLines.length === 0) return []
    var questions = [], currentQuestion = '', currentNumber = 0
    for (var i = 0; i < textLines.length; i++) {
      var line = textLines[i].trim()
      if (!line) continue
      var match = line.match(/^(\d+)[.、．)\s]/)
      if (match) {
        if (currentQuestion) questions.push({ number: currentNumber, text: currentQuestion.trim() })
        currentNumber = parseInt(match[1])
        currentQuestion = line.replace(/^(\d+)[.、．)\s]/, '')
      } else {
        var match2 = line.match(/第(\d+)[题]/)
        if (match2) {
          if (currentQuestion) questions.push({ number: currentNumber, text: currentQuestion.trim() })
          currentNumber = parseInt(match2[1])
          currentQuestion = line.replace(/第(\d+)[题][.、．:\s]*/, '')
        } else {
          currentQuestion += ' ' + line
        }
      }
    }
    if (currentQuestion) questions.push({ number: currentNumber, text: currentQuestion.trim() })
    return questions
  },

  showRecognizeResults(textLines) {
    const that = this
    const questions = that.parseQuestionsFromLines(textLines)
    var results = questions.map(function(q, idx) {
      return { id: 200 + idx, number: q.number, subject: '待分类', knowledgePoint: '待分析', question: q.text, recognized: true, isWrong: true }
    })
    if (results.length === 0 && textLines.length > 0) {
      results = textLines.map(function(line, idx) {
        return { id: 200 + idx, number: idx + 1, subject: '待分类', knowledgePoint: '待分析', question: line, recognized: true, isWrong: true }
      })
    }
    setTimeout(function() {
      that.setData({ stage: 'result', recognizeResults: results })
    }, 500)
  },

  onToggleWrong(e) {
    const { index } = e.currentTarget.dataset
    const results = this.data.recognizeResults
    results[index].isWrong = !results[index].isWrong
    this.setData({ recognizeResults: results, selectedCount: results.filter(function(r) { return r.isWrong }).length })
  },

  onConfirmAdd() {
    const selected = this.data.recognizeResults.filter(function(r) { return r.isWrong })
    if (selected.length === 0) {
      wx.showToast({ title: '请至少选择一道错题', icon: 'none', duration: 2000 })
      return
    }
    wx.showLoading({ title: '添加中...', mask: true })
    setTimeout(function() {
      wx.hideLoading()
      wx.showModal({
        title: '添加成功', content: '已添加 ' + selected.length + ' 道错题到错题本！',
        showCancel: false, confirmText: '太棒了', confirmColor: '#667eea',
        success: function() { wx.navigateBack() }
      })
    }, 1000)
  },

  onReselect() {
    this.setData({ stage: 'choose', imagePath: '', recognizeProgress: 0, recognizeMode: '', ocrTextLines: [], recognizeResults: [], selectedCount: 0 })
  }
})
