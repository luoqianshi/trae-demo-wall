const { getMockResult } = require('../../utils/mockData.js')

Page({
  data: {
    statusBarHeight: 20,
    currentSubject: '全部',
    subjects: ['全部', '数学', '语文', '英语'],
    wrongList: [],
    totalWrong: 0,
    mastered: 0,
    toMaster: 0
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })
    this.loadWrongBook()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.loadWrongBook()
  },

  loadWrongBook() {
    const result = getMockResult()
    const wrongList = result.wrongQuestions.map((item, i) => ({
      id: i + 1,
      q: item.question,
      kps: item.knowledgePoints
    }))
    this.setData({
      wrongList: wrongList,
      totalWrong: wrongList.length,
      mastered: Math.floor(wrongList.length * 0.3),
      toMaster: Math.floor(wrongList.length * 0.7)
    })
  },

  switchSubject(e) {
    const subject = e.currentTarget.dataset.subject
    this.setData({
      currentSubject: subject
    })
  }
})
