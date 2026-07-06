/**
 * 错题整理小能手 - 小程序入口文件
 * 专为小学生设计的智能错题整理与复习工具
 */

App({
  onLaunch() {
    // 小程序启动时执行
    console.log('错题整理小能手启动啦！')
    
    // 获取系统信息
    try {
      const systemInfo = wx.getWindowInfo()
      this.globalData.systemInfo = systemInfo
    } catch (e) {
      console.log('获取系统信息失败', e)
    }
    
    // 初始化本地存储的错题数据
    this.initData()
  },

  /**
   * 初始化数据 - 从本地存储读取或使用默认数据
   */
  initData() {
    const wrongQuestions = wx.getStorageSync('wrongQuestions')
    if (!wrongQuestions) {
      // 首次使用，加载模拟数据
      const mockData = require('./utils/data.js').mockData
      wx.setStorageSync('wrongQuestions', mockData)
      this.globalData.wrongQuestions = mockData
    } else {
      this.globalData.wrongQuestions = wrongQuestions
    }

    // 学习统计
    const stats = wx.getStorageSync('studyStats')
    if (!stats) {
      const defaultStats = {
        todayCount: 3,        // 今日已整理错题数
        graduatedCount: 5,    // 已毕业错题数
        consecutiveDays: 7   // 连续打卡天数
      }
      wx.setStorageSync('studyStats', defaultStats)
      this.globalData.studyStats = defaultStats
    } else {
      this.globalData.studyStats = stats
    }
  },

  globalData: {
    systemInfo: null,
    wrongQuestions: [],
    studyStats: {
      todayCount: 0,
      graduatedCount: 0,
      consecutiveDays: 0
    }
  }
})
