/**
 * 错题列表页 - 按学科/知识点分类展示
 * 支持tab切换筛选、点击进入详情、手动添加
 */

const app = getApp()
const { filterBySubject } = require('../../utils/data.js')

Page({
  data: {
    // tab列表
    tabs: ['全部', '数学', '语文', '英语', '科学'],
    currentTab: 0,
    // 错题列表
    wrongList: [],
    // 筛选后的列表
    filteredList: [],
    // 空状态
    isEmpty: false
  },

  onLoad() {
    this.loadWrongList()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadWrongList()
  },

  /**
   * 加载错题列表
   */
  loadWrongList() {
    const questions = app.globalData.wrongQuestions || []
    this.setData({ wrongList: questions })
    this.filterByTab()
  },

  /**
   * 切换tab
   */
  onTabChange(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ currentTab: index })
    this.filterByTab()
  },

  /**
   * 根据当前tab筛选错题
   */
  filterByTab() {
    const tab = this.data.tabs[this.data.currentTab]
    const filtered = filterBySubject(this.data.wrongList, tab)
    this.setData({
      filteredList: filtered,
      isEmpty: filtered.length === 0
    })
  },

  /**
   * 点击错题卡片，进入详情
   */
  onItemTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  /**
   * 手动添加错题（模拟）
   */
  onAddWrong() {
    wx.showToast({
      title: '手动添加功能开发中...',
      icon: 'none',
      duration: 2000
    })
  }
})
