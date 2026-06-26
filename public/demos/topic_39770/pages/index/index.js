/**
 * 首页 - 错题整理小能手
 * 展示4大功能入口和今日学习统计
 */

const app = getApp()
const { getStats } = require('../../utils/data.js')

Page({
  data: {
    // 日期显示
    dateStr: '',
    weekDay: '',
    // 学习统计
    todayCount: 0,
    graduatedCount: 0,
    consecutiveDays: 0,
    // 功能入口列表
    menuList: [
      {
        icon: '[相机]',
        title: '拍试卷',
        desc: '拍照上传识别',
        color: '#667eea',
        bgColor: 'rgba(102, 126, 234, 0.1)',
        page: '/pages/upload/upload'
      },
      {
        icon: '[书]',
        title: '看错题',
        desc: '查看错题列表',
        color: '#e74c3c',
        bgColor: 'rgba(231, 76, 60, 0.1)',
        page: '/pages/wronglist/wronglist'
      },
      {
        icon: '[图]',
        title: '我的弱点',
        desc: '薄弱点分析',
        color: '#f39c12',
        bgColor: 'rgba(243, 156, 18, 0.1)',
        page: '/pages/analysis/analysis'
      },
      {
        icon: '[打印]',
        title: '打印错题本',
        desc: '生成PDF预览',
        color: '#27ae60',
        bgColor: 'rgba(39, 174, 96, 0.1)',
        page: '/pages/notebook/notebook'
      }
    ]
  },

  onLoad() {
    this.setDate()
    this.loadStats()
  },

  onShow() {
    // 每次显示时刷新统计数据
    this.loadStats()
  },

  /**
   * 设置当前日期
   */
  setDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[now.getDay()]

    this.setData({
      dateStr: `${year}年${month}月${day}日`,
      weekDay: `星期${weekDay}`
    })
  },

  /**
   * 加载学习统计
   */
  loadStats() {
    const questions = app.globalData.wrongQuestions
    const stats = getStats(questions)
    const studyStats = app.globalData.studyStats

    this.setData({
      todayCount: studyStats.todayCount || 0,
      graduatedCount: stats.graduated,
      consecutiveDays: studyStats.consecutiveDays || 0
    })
  },

  /**
   * 点击功能入口
   */
  onMenuTap(e) {
    const { index } = e.currentTarget.dataset
    const menu = this.data.menuList[index]
    
    // tabBar页面用switchTab，其他页面用navigateTo
    if (menu.page === '/pages/wronglist/wronglist' || menu.page === '/pages/analysis/analysis') {
      wx.switchTab({
        url: menu.page
      })
    } else {
      wx.navigateTo({
        url: menu.page
      })
    }
  }
})
