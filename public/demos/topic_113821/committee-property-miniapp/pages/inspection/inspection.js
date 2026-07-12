const mock = require('../../utils/mock.js')
const app = getApp()

Page({
  data: {
    currentTab: 'daily',
    tabs: [
      { key: 'daily', label: '日常巡检' },
      { key: 'periodic', label: '专项巡检' },
      { key: 'records', label: '巡检记录' }
    ],
    inspectionData: null,
    currentTask: null,
    showTaskDetail: false
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({ currentTab: options.tab })
    }
    this.loadData()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  loadData() {
    const data = mock.getInspection()
    this.setData({ inspectionData: data })
  },

  startDailyInspection(e) {
    const id = e.currentTarget.dataset.id
    const task = this.data.inspectionData.dailyTasks.find(t => t.id === id)
    if (task) {
      this.setData({
        currentTask: task,
        showTaskDetail: true
      })
    }
  },

  startPeriodicInspection(e) {
    const id = e.currentTarget.dataset.id
    const task = this.data.inspectionData.periodicTasks.find(t => t.id === id)
    if (task) {
      wx.showToast({ title: '开始巡检', icon: 'none' })
    }
  },

  closeTaskDetail() {
    this.setData({ showTaskDetail: false, currentTask: null })
  },

  markItemStatus(e) {
    const { itemId, status } = e.currentTarget.dataset
    const task = { ...this.data.currentTask }
    const item = task.items.find(i => i.id === itemId)
    if (item) {
      item.status = status
      
      let completed = 0
      task.items.forEach(i => {
        if (i.status === 'normal' || i.status === 'issue') {
          completed++
        }
      })
      task.completedItems = completed

      this.setData({ currentTask: task })
    }
  },

  addRemark(e) {
    const itemId = e.currentTarget.dataset.itemId
    wx.showModal({
      title: '添加备注',
      editable: true,
      placeholderText: '请输入备注信息',
      success: (res) => {
        if (res.confirm && res.content) {
          const task = { ...this.data.currentTask }
          const item = task.items.find(i => i.id === itemId)
          if (item) {
            item.remark = res.content
            this.setData({ currentTask: task })
            wx.showToast({ title: '已添加备注', icon: 'success' })
          }
        }
      }
    })
  },

  uploadPhoto(e) {
    const itemId = e.currentTarget.dataset.itemId
    wx.chooseImage({
      count: 3,
      success: () => {
        wx.showToast({ title: '照片已上传', icon: 'success' })
      }
    })
  },

  submitInspection() {
    const task = this.data.currentTask
    if (task.completedItems < task.totalItems) {
      wx.showModal({
        title: '提示',
        content: `还有${task.totalItems - task.completedItems}项未完成，确定提交吗？`,
        success: (res) => {
          if (res.confirm) {
            this.doSubmit()
          }
        }
      })
    } else {
      this.doSubmit()
    }
  },

  doSubmit() {
    wx.showLoading({ title: '提交中...' })
    setTimeout(() => {
      wx.hideLoading()
      this.setData({ showTaskDetail: false, currentTask: null })
      wx.showToast({ title: '提交成功', icon: 'success' })
    }, 1000)
  }
})
