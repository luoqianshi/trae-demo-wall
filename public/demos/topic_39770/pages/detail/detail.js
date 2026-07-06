/**
 * 错题详情页 - 单题详情+重做区
 * 显示题目内容、错误答案、正确答案、错误原因分析
 * 提供重做功能，让学生重新作答并检查
 */

const app = getApp()
const { SUBJECT_COLORS } = require('../../utils/data.js')

Page({
  data: {
    // 错题数据
    question: null,
    // 学科颜色
    subjectColor: '#667eea',
    // 重做相关
    userAnswer: '',
    // 检查结果：null(未检查) / true(正确) / false(错误)
    checkResult: null,
    // 检查结果消息
    checkMessage: ''
  },

  onLoad(options) {
    const { id } = options
    this.loadQuestion(parseInt(id))
  },

  /**
   * 加载错题详情
   */
  loadQuestion(id) {
    const questions = app.globalData.wrongQuestions || []
    const question = questions.find(q => q.id === id)
    
    if (question) {
      const subjectColor = SUBJECT_COLORS[question.subject] || '#667eea'
      this.setData({ 
        question,
        subjectColor 
      })
    } else {
      wx.showToast({
        title: '未找到该错题',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  /**
   * 输入答案
   */
  onAnswerInput(e) {
    this.setData({ 
      userAnswer: e.detail.value,
      checkResult: null,
      checkMessage: ''
    })
  },

  /**
   * 检查答案
   */
  onCheckAnswer() {
    const { userAnswer, question } = this.data
    
    if (!userAnswer.trim()) {
      wx.showToast({
        title: '请先输入你的答案',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 去除空格后比较
    const userTrimmed = userAnswer.trim()
    const correctTrimmed = question.correctAnswer.trim()
    
    // 判断答案是否正确
    const isCorrect = userTrimmed === correctTrimmed
    
    let message = ''
    if (isCorrect) {
      message = '🎉 太棒了！这题又进步了！'
    } else {
      message = '😅 还差一点点，再想想看！'
    }

    this.setData({
      checkResult: isCorrect,
      checkMessage: message
    })

    // 如果答对了，显示庆祝效果
    if (isCorrect) {
      wx.vibrateShort({ type: 'medium' })
    }
  },

  /**
   * 重置重做区
   */
  onRetry() {
    this.setData({
      userAnswer: '',
      checkResult: null,
      checkMessage: ''
    })
  }
})
