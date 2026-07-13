// pages/personality-quiz/personality-quiz.js
const app = getApp()
const { quizQuestions, personalityDetails } = require('../../utils/data.js')

Page({
  data: {
    statusBarHeight: 0,
    currentIndex: 0,
    currentNumber: 1,
    totalQuestions: quizQuestions.length,
    currentQuestion: quizQuestions[0],
    selectedOption: '',
    answers: [],
    progress: 0,
    dimensionGroups: [],
    prevQuestionText: ''
  },

  onLoad() {
    const statusBarHeight = app.globalData.statusBarHeight || 44
    this._refresh(0, [], statusBarHeight)
  },

  // 统一刷新当前题目的派生数据
  _refresh(index, answers, statusBarHeight) {
    const sbh = statusBarHeight !== undefined ? statusBarHeight : this.data.statusBarHeight
    const currentQuestion = quizQuestions[index]
    const prevAnswer = answers.find(a => a.questionId === currentQuestion.id)
    this.setData({
      statusBarHeight: sbh,
      currentIndex: index,
      currentNumber: index + 1,
      currentQuestion,
      selectedOption: prevAnswer ? prevAnswer.label : '',
      answers,
      progress: Math.round((index + 1) / quizQuestions.length * 100),
      dimensionGroups: this._buildDimensionGroups(index, answers),
      prevQuestionText: index > 0 ? quizQuestions[index - 1].question : ''
    })
  },

  // 构建 4 组维度指示点（每组 3 个点）
  _buildDimensionGroups(currentIndex, answers) {
    const dims = ['E', 'S', 'R', 'P']
    return dims.map(dim => {
      const dots = []
      quizQuestions.forEach((q, i) => {
        if (q.dimension === dim) {
          const answered = answers.some(a => a.questionId === q.id)
          const isCurrent = i === currentIndex
          dots.push({ lit: answered || isCurrent, key: i })
        }
      })
      return { dimension: dim, dots }
    })
  },

  // 选择答案：记录后 500ms 自动跳到下一题
  onSelectOption(e) {
    if (this._lock) return
    this._lock = true
    const label = e.currentTarget.dataset.label
    const question = quizQuestions[this.data.currentIndex]
    const option = question.options.find(o => o.label === label)

    const answers = [...this.data.answers]
    const existIdx = answers.findIndex(a => a.questionId === question.id)
    const record = {
      questionId: question.id,
      value: option.value,
      label,
      dimension: question.dimension
    }
    if (existIdx >= 0) answers[existIdx] = record
    else answers.push(record)

    this.setData({
      selectedOption: label,
      answers,
      dimensionGroups: this._buildDimensionGroups(this.data.currentIndex, answers)
    })

    this._timer = setTimeout(() => {
      this._lock = false
      this._goNext()
    }, 500)
  },

  _goNext() {
    const nextIndex = this.data.currentIndex + 1
    if (nextIndex >= quizQuestions.length) {
      this._complete()
      return
    }
    this._refresh(nextIndex, this.data.answers)
  },

  // 跳过：直接下一题
  onSkip() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
    this._lock = false
    this._goNext()
  },

  // 返回：有上一题则回到上一题，否则退出页面
  onBack() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
    this._lock = false
    if (this.data.currentIndex > 0) {
      this._refresh(this.data.currentIndex - 1, this.data.answers)
    } else {
      wx.navigateBack()
    }
  },

  // 完成最后一题：统计维度，拼出 4 字母食人格 code
  _complete() {
    const counts = { E: 0, C: 0, S: 0, N: 0, R: 0, I: 0, P: 0, F: 0 }
    this.data.answers.forEach(a => {
      counts[a.value] = (counts[a.value] || 0) + 1
    })

    let code =
      (counts.E >= counts.C ? 'E' : 'C') +
      (counts.S >= counts.N ? 'S' : 'N') +
      (counts.R >= counts.I ? 'R' : 'I') +
      (counts.P >= counts.F ? 'P' : 'F')

    // 兜底：若计算结果不在预设详情中，默认 ESRP
    if (!personalityDetails[code]) code = 'ESRP'

    app.globalData.userInfo.personality = code
    app.globalData.userInfo.personalityName = personalityDetails[code].name
    app.globalData.userState = 'tested'

    wx.redirectTo({ url: '/pages/personality-result/personality-result' })
  }
})
