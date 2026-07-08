const { callFn } = require('../../utils/cloud')

Page({
  data: {
    fileID: '',
    text: '',
    segments: [],
    confidence: 0,
    submitting: false,
    errorMsg: ''
  },

  onLoad() {
    const channel = this.getOpenerEventChannel()
    channel.on('ocrData', (data) => {
      this.setData({
        fileID: data.fileID,
        text: data.ocr.text,
        segments: data.ocr.segments || [],
        confidence: data.ocr.confidence || 0
      })
    })
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value })
  },

  async submit() {
    if (!this.data.text.trim()) {
      this.setData({ errorMsg: '题目不能为空' })
      return
    }
    this.setData({ submitting: true, errorMsg: '' })

    try {
      const result = await callFn('fn-solve', {
        fileID: this.data.fileID,
        cleanedText: this.data.text.trim()
      })
      wx.navigateTo({
        url: '/pages/solve/solve',
        success: (res) => {
          res.eventChannel.emit('solveData', {
            questionId: result.questionId,
            solution: result.solution
          })
        }
      })
    } catch (err) {
      this.setData({ errorMsg: err.message || '生成讲解失败' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
