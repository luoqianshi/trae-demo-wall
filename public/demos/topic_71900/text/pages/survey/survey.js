const app = getApp()

Page({
  data: {
    survey: {},
    currentIndex: 0,
    currentQuestion: null,
    answers: [],
    progress: 0,
    canNext: false
  },

  onLoad: function (options) {
    const id = parseInt(options.id)
    const survey = app.globalData.surveys.find(s => s.id === id)
    if (survey) {
      const questions = survey.questions.map(q => ({
        ...q,
        selected: null
      }))
      const updatedSurvey = { ...survey, questions }
      this.setData({
        survey: updatedSurvey,
        currentQuestion: questions[0],
        progress: 100 / questions.length,
        answers: new Array(questions.length).fill(null)
      })
    }
  },

  checkCanNext: function (question) {
    return question.selected !== null && question.selected !== undefined
  },

  selectRadio: function (e) {
    const qid = e.currentTarget.dataset.qid
    const index = e.currentTarget.dataset.index
    const survey = { ...this.data.survey }
    const question = survey.questions.find(q => q.id === qid)
    const answers = [...this.data.answers]
    
    if (question) {
      question.selected = index
      answers[question.id - 1] = index
    }
    
    this.setData({
      survey: survey,
      currentQuestion: question,
      answers: answers,
      canNext: this.checkCanNext(question)
    })
  },

  prevQuestion: function () {
    const index = this.data.currentIndex - 1
    this.updateQuestion(index)
  },

  nextQuestion: function () {
    if (!this.data.canNext) {
      wx.showToast({
        title: '请先选择一个选项',
        icon: 'none'
      })
      return
    }
    const index = this.data.currentIndex + 1
    this.updateQuestion(index)
  },

  updateQuestion: function (index) {
    const survey = this.data.survey
    const question = survey.questions[index]
    this.setData({
      currentIndex: index,
      currentQuestion: question,
      progress: ((index + 1) / survey.questions.length) * 100,
      canNext: this.checkCanNext(question)
    })
  },

  submitSurvey: function () {
    if (!this.data.canNext) {
      wx.showToast({
        title: '请先选择一个选项',
        icon: 'none'
      })
      return
    }

    const allAnswered = this.data.answers.every(a => a !== null && a !== undefined)
    
    if (!allAnswered) {
      wx.showToast({
        title: '请完成所有问题',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '分析中...' })
    
    setTimeout(() => {
      wx.hideLoading()
      const answersStr = this.data.answers.join(',')
      wx.navigateTo({
        url: `/pages/result/result?answers=${answersStr}`
      })
    }, 1000)
  }
})