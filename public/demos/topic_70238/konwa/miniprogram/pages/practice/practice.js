const { getMockResult } = require('../../utils/mockData.js')

Page({
  data: {
    statusBarHeight: 20,
    currentSubject: '数学',
    subjects: ['数学', '语文', '英语'],
    types: [
      { name: '薄弱点专项', desc: '针对薄弱知识点', icon: '🎯' },
      { name: '错题重练', desc: '巩固错题', icon: '📝' },
      { name: '每日一练', desc: '每天10道题', icon: '📅' },
      { name: '模拟考试', desc: '真题模拟', icon: '📋' }
    ],
    practiceList: []
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20
    })
    this.loadData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    this.loadData()
  },

  loadData() {
    const result = getMockResult()
    this.setData({
      practiceList: result.studyPlan.exercises.slice(0, 5).map((item, i) => ({
        id: i + 1,
        q: item.question,
        kp: item.knowledgePoint,
        level: '中等'
      }))
    })
  },

  switchSubject(e) {
    const subject = e.currentTarget.dataset.subject
    this.setData({
      currentSubject: subject
    })
  }
})
