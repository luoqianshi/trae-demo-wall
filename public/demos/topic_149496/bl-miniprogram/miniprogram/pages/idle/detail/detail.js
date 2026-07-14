// pages/idle/detail/detail.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')

Page({
  data: {
    id: '',
    detail: null,
    categoryConfig: {},
    timeText: '',
    completeTimeText: '',
    isOwner: false,
    loading: true,
    currentPhoto: 0,
    distanceText: '',
    hasPhone: false,
    contactValue: '',
    chatting: false,
    completing: false,
    toggling: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.loadDetail()
    }
  },

  async loadDetail() {
    try {
      const userLocation = app.globalData.userInfo && app.globalData.userInfo.location
      const res = await cloud.getDetail({ type: 'idle', id: this.data.id, userLocation })
      if (res.success) {
        const detail = res.detail
        const categoryConfig = util.getCategoryConfig(detail.category)
        const timeText = util.formatTime(detail.create_time)
        const completeTimeText = detail.complete_time ? util.formatTime(detail.complete_time) : ''
        const isOwner = app.globalData.openid === detail.user_id

        // 联系方式处理
        const contact = detail.contact || {}
        const hasPhone = contact.type === 'phone' && contact.value
        const contactValue = contact.value || ''

        // 距离处理
        let distanceText = ''
        if (detail.distance !== null && detail.distance !== undefined) {
          distanceText = '距您' + util.formatDistance(detail.distance)
        }

        this.setData({
          detail, categoryConfig, timeText, completeTimeText,
          isOwner, hasPhone, contactValue, distanceText, loading: false
        })
      } else {
        util.showToast(res.message || '加载失败')
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载详情失败:', err)
      this.setData({ loading: false })
      util.showToast('加载失败')
    }
  },

  // 预览图片
  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.detail.photos || []
    this.setData({ currentPhoto: index })
    wx.previewImage({ current: urls[index], urls })
  },

  // 轮播切换
  onPhotoChange(e) {
    this.setData({ currentPhoto: e.detail.current })
  },

  // 拨打电话
  onCallPhone() {
    if (!this.data.contactValue) {
      util.showToast('未提供电话号码')
      return
    }
    wx.makePhoneCall({ phoneNumber: this.data.contactValue })
  },

  // 复制号码
  onCopyPhone() {
    if (!this.data.contactValue) return
    util.copyToClipboard(this.data.contactValue).then(() => {
      util.showToast('已复制号码', 'success')
    })
  },

  // 平台对话联系
  async onChat() {
    if (!app.checkLogin()) return
    if (this.data.isOwner) {
      util.showToast('不能和自己聊天')
      return
    }
    if (this.data.chatting) return
    this.setData({ chatting: true })
    const toUserId = this.data.detail.user_id
    const itemId = this.data.detail._id
    const itemType = 'idle'
    const itemTitle = this.data.detail.name || '闲置物品'
    util.showLoading('正在打开对话...')
    try {
      const res = await cloud.getChatSession({ toUserId, itemId, itemType, itemTitle })
      util.hideLoading()
      if (res.success) {
        wx.navigateTo({
          url: `/pages/chat/detail/detail?sessionId=${res.sessionId}&toUserId=${toUserId}&toNickname=${encodeURIComponent(res.otherUser.nickname || '邻居')}&itemTitle=${encodeURIComponent(itemTitle)}`
        })
      } else {
        util.showToast(res.message || '打开对话失败')
      }
    } catch (err) {
      util.hideLoading()
      util.handleNetError(err, '打开对话失败')
    } finally {
      this.setData({ chatting: false })
    }
  },

  // 完成交易
  async onComplete() {
    if (this.data.completing) return
    const confirm = await util.showConfirm('确认该物品已出售？')
    if (!confirm) return

    this.setData({ completing: true })
    util.showLoading('处理中...')
    try {
      const res = await cloud.completeTrade({ id: this.data.id })
      util.hideLoading()
      if (res.success) {
        util.showToast('交易已完成', 'success')
        setTimeout(() => this.loadDetail(), 1500)
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

  // 切换下架/上架
  async onToggleVisibility() {
    if (this.data.toggling) return
    const detail = this.data.detail
    const isHidden = detail.hidden === true
    const actionText = isHidden ? '上架' : '下架'
    const confirm = await util.showConfirm(`确认${actionText}该物品？${isHidden ? '' : '下架后他人将看不到此物品'}`)
    if (!confirm) return

    this.setData({ toggling: true })
    util.showLoading('处理中...')
    try {
      const res = await cloud.updateRecord({ type: 'idle', id: this.data.id, action: 'toggleVisibility' })
      util.hideLoading()
      if (res.success) {
        util.showToast(res.message || '操作成功', 'success')
        setTimeout(() => this.loadDetail(), 1200)
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

  // 转发分享
  onShareAppMessage() {
    const detail = this.data.detail || {}
    return {
      title: `【闲置转让】${detail.name || '好物转让'} ¥${detail.price || ''}`,
      path: `/pages/idle/detail/detail?id=${this.data.id}`,
      imageUrl: (detail.photos && detail.photos[0]) || ''
    }
  }
})
