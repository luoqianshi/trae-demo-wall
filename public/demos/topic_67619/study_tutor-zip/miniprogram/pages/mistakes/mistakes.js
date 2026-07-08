Page({
  data: {
    items: [],
    loading: true,
    errorMsg: ''
  },

  onShow() {
    this.loadMistakes()
  },

  async loadMistakes() {
    this.setData({ loading: true, errorMsg: '' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'fn-usage',
        data: { action: 'listMistakes' }
      })
      if (!res.result || !res.result.ok) {
        throw new Error(res.result && res.result.error || 'load failed')
      }
      const items = await this.enrich(res.result.items)
      this.setData({ items })
    } catch (err) {
      this.setData({ errorMsg: err.message })
    } finally {
      this.setData({ loading: false })
    }
  },

  async enrich(mistakes) {
    if (mistakes.length === 0) return []
    const ids = mistakes.map(m => m.questionId)
    const db = wx.cloud.database()
    const res = await db.collection('questions').where({ _id: db.command.in(ids) }).get()
    const map = {}
    for (const q of res.data) map[q._id] = q
    return mistakes.map(m => ({
      ...m,
      question: map[m.questionId] || null
    }))
  },

  openMistake(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find(m => m._id === id)
    if (!item || !item.question) return
    wx.navigateTo({
      url: '/pages/solve/solve',
      success: (res) => {
        res.eventChannel.emit('solveData', {
          questionId: item.questionId,
          solution: item.question.solution
        })
      }
    })
  }
})
