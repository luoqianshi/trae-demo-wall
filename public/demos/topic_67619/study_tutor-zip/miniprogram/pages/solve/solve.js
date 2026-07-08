const { callFn } = require('../../utils/cloud')

Page({
  data: {
    questionId: '',
    solution: null,
    visibleLevel: 1,  // 1=hint1, 2=hint2, 3=full
    savingMistake: false,
    feedbackSubmitted: false
  },

  onLoad() {
    const channel = this.getOpenerEventChannel()
    channel.on('solveData', (data) => {
      this.setData({
        questionId: data.questionId,
        solution: data.solution
      })
    })
  },

  showHint2() {
    this.setData({ visibleLevel: 2 })
  },

  showFull() {
    this.setData({ visibleLevel: 3 })
  },

  async addToMistakes() {
    if (this.data.savingMistake) return
    this.setData({ savingMistake: true })
    try {
      await wx.cloud.callFunction({
        name: 'fn-usage',
        data: { action: 'addMistake', questionId: this.data.questionId }
      })
      wx.showToast({ title: '已加入错题本', icon: 'success' })
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ savingMistake: false })
    }
  },

  async submitFeedback(e) {
    const correct = e.currentTarget.dataset.correct === 'true'
    try {
      await wx.cloud.callFunction({
        name: 'fn-usage',
        data: {
          action: 'feedback',
          questionId: this.data.questionId,
          correct
        }
      })
      this.setData({ feedbackSubmitted: true })
      wx.showToast({
        title: correct ? '感谢反馈' : '已记录，我们会核查',
        icon: 'none'
      })
    } catch (err) {
      console.error(err)
    }
  }
})
