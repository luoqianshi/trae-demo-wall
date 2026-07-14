// pages/profile/edit/edit.js
const app = getApp()
const cloud = require('../../../utils/cloud.js')
const util = require('../../../utils/util.js')

Page({
  data: {
    nickname: '',
    community: '',
    avatar: '',
    userInfo: null,
    submitting: false
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {}
    this.setData({
      nickname: userInfo.nickname || '',
      community: userInfo.community || '',
      avatar: userInfo.avatar || '',
      userInfo: userInfo
    })
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onCommunityInput(e) {
    this.setData({ community: e.detail.value })
  },

  async onSubmit() {
    if (!this.data.nickname.trim()) {
      util.showToast('请输入昵称')
      return
    }
    if (!this.data.community.trim()) {
      util.showToast('请输入所属社区')
      return
    }

    this.setData({ submitting: true })
    util.showLoading('保存中...')

    try {
      const res = await cloud.updateProfile({
        nickname: this.data.nickname.trim(),
        community: this.data.community.trim()
      })

      util.hideLoading()
      if (res.success) {
        // 更新本地用户信息
        const userInfo = { ...app.globalData.userInfo, ...res.user, openid: app.globalData.openid }
        app.setUserInfo(userInfo)
        util.showToast('保存成功', 'success')
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        util.showToast(res.message || '保存失败')
      }
    } catch (err) {
      util.hideLoading()
      util.showToast('保存失败')
    } finally {
      this.setData({ submitting: false })
    }
  }
})
