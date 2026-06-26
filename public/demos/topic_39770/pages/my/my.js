/**
 * 我的页面 - 个人信息与设置
 */
const app = getApp()

Page({
  data: {
    stats: {
      total: 0,
      graduated: 0,
      notGraduated: 0,
      subjects: []
    }
  },

  onLoad() {
    this.calculateStats()
  },

  onShow() {
    // 每次显示页面时重新计算统计
    this.calculateStats()
  },

  calculateStats() {
    const wrongList = app.globalData.wrongQuestions || []
    const graduated = wrongList.filter(item => item.graduated).length
    const subjects = [...new Set(wrongList.map(item => item.subject))]

    this.setData({
      stats: {
        total: wrongList.length,
        graduated: graduated,
        notGraduated: wrongList.length - graduated,
        subjects: subjects
      }
    })
  },

  onTapSetting(e) {
    const type = e.currentTarget.dataset.type
    const messages = {
      subjects: '学科管理功能开发中...',
      tags: '知识点标签管理功能开发中...',
      export: '数据导出功能开发中...',
      about: '错题整理小能手 v1.0.0\nTRAE AI 创造力大赛参赛作品\n专为小学生设计的智能错题整理工具'
    }

    wx.showModal({
      title: '提示',
      content: messages[type],
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
