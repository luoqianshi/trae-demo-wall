// pages/profile/records/records.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')

Page({
  data: {
    activeTab: 'help',
    helpRecords: [],
    idleRecords: [],
    loading: true,
    completing: false,
    toggling: false
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    if (this.data.helpRecords.length > 0 || this.data.idleRecords.length > 0) {
      this.loadRecords()
    }
  },

  async loadRecords() {
    try {
      const res = await cloud.getUserInfo(app.globalData.openid)
      if (res.success) {
        this.setData({
          helpRecords: res.helpRecords || [],
          idleRecords: res.idleRecords || [],
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载记录失败:', err)
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // 查看详情
  goHelpDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/help/detail/detail?id=${id}` })
  },

  goIdleDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/idle/detail/detail?id=${id}` })
  },

  // 编辑互助
  onEditHelp(e) {
    const id = e.currentTarget.dataset.id
    const record = this.data.helpRecords.find(r => r._id === id)
    if (!record) return
    const dataStr = encodeURIComponent(JSON.stringify(record))
    wx.navigateTo({ url: `/pages/profile/edit-record/edit-record?type=help&id=${id}&data=${dataStr}` })
  },

  // 编辑闲置
  onEditIdle(e) {
    const id = e.currentTarget.dataset.id
    const record = this.data.idleRecords.find(r => r._id === id)
    if (!record) return
    const dataStr = encodeURIComponent(JSON.stringify(record))
    wx.navigateTo({ url: `/pages/profile/edit-record/edit-record?type=idle&id=${id}&data=${dataStr}` })
  },

  // 切换互助显隐
  async onToggleHelp(e) {
    const id = e.currentTarget.dataset.id
    await this.toggleVisibility(id, 'help')
  },

  // 切换闲置显隐（下架/上架）
  async onToggleIdle(e) {
    const id = e.currentTarget.dataset.id
    await this.toggleVisibility(id, 'idle')
  },

  // 显隐切换通用方法
  async toggleVisibility(id, type) {
    if (this.data.toggling) return
    const record = (type === 'help' ? this.data.helpRecords : this.data.idleRecords).find(r => r._id === id)
    if (!record) return
    const actionText = record.hidden ? (type === 'help' ? '显示' : '上架') : (type === 'help' ? '隐藏' : '下架')
    const confirm = await util.showConfirm(`确认${actionText}该信息？${record.hidden ? '' : (type === 'help' ? '隐藏后他人将看不到此互助' : '下架后他人将看不到此物品')}`)
    if (!confirm) return

    this.setData({ toggling: true })
    util.showLoading('处理中...')
    try {
      const res = await cloud.updateRecord({ type, id, action: 'toggleVisibility' })
      util.hideLoading()
      if (res.success) {
        util.showToast(res.message || '操作成功', 'success')
        this.loadRecords()
      } else {
        util.showToast(res.message || '操作失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '操作失败')
    } finally {
      this.setData({ toggling: false })
    }
  },

  // 删除记录
  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    const confirm = await util.showConfirm('确认删除该记录？')
    if (!confirm) return

    util.showLoading('删除中...')
    try {
      const res = await cloud.deleteRecord({ type, id })
      util.hideLoading()
      if (res.success) {
        util.showToast('删除成功', 'success')
        this.loadRecords()
      } else {
        util.showToast(res.message || '删除失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '删除失败')
    }
  },

  // 标记互助完成
  async onCompleteHelp(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.completing) return
    const confirm = await util.showConfirm('确认该互助已完成？')
    if (!confirm) return

    this.setData({ completing: true })
    util.showLoading('处理中...')
    try {
      const res = await cloud.completeHelp({ id })
      util.hideLoading()
      if (res.success) {
        util.showToast('已标记完成', 'success')
        this.loadRecords()
      } else {
        util.showToast(res.message || '操作失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '操作失败')
    } finally {
      this.setData({ completing: false })
    }
  },

  // 标记闲置已售
  async onCompleteIdle(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.completing) return
    const confirm = await util.showConfirm('确认该物品已出售？')
    if (!confirm) return

    this.setData({ completing: true })
    util.showLoading('处理中...')
    try {
      const res = await cloud.completeTrade({ id })
      util.hideLoading()
      if (res.success) {
        util.showToast('已标记已售', 'success')
        this.loadRecords()
      } else {
        util.showToast(res.message || '操作失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '操作失败')
    } finally {
      this.setData({ completing: false })
    }
  }
})
