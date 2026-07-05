const app = getApp()
const api = require('../../utils/api.js')

Page({
  data: {
    relationTypes: [
      { id: 'lover', name: '恋人', icon: '💕' },
      { id: 'friend', name: '闺蜜', icon: '👭' },
      { id: 'family', name: '家人', icon: '👨‍👩‍👧' },
      { id: 'childhood', name: '发小', icon: '🎈' },
      { id: 'custom', name: '自定义', icon: '💫' }
    ],
    selectedType: 'lover',
    riverName: '',
    customRelation: '',
    friendName: '',
    friendOpenid: '',
    canSubmit: false,
    showFriendPicker: false,
    friends: []
  },

  onLoad: function () {},
  
  onShow: function () {
    this.checkSubmit()
  },

  selectRelation: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedType: type
    })
    this.checkSubmit()
  },

  inputRiverName: function (e) {
    this.setData({
      riverName: e.detail.value
    })
    this.checkSubmit()
  },

  inputCustomRelation: function (e) {
    this.setData({
      customRelation: e.detail.value
    })
  },

  inputFriendName: function (e) {
    this.setData({
      friendName: e.detail.value
    })
    this.checkSubmit()
  },

  checkSubmit: function () {
    const riverNameTrimmed = this.data.riverName.replace(/^\s+|\s+$/g, '')
    const hasName = riverNameTrimmed !== ''
    const hasRelation = this.data.selectedType !== ''
    this.setData({
      canSubmit: hasName && hasRelation
    })
  },

  async pickFriend() {
    try {
      const res = await this.getFriendList()
      this.setData({
        friends: res.data,
        showFriendPicker: true
      })
    } catch (err) {
      console.error('获取好友失败:', err)
    }
  },

  getFriendList: function() {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '获取好友列表...' })
      wx.getFriendCloudStorage({
        success: function(res) {
          wx.hideLoading()
          resolve(res)
        },
        fail: function(err) {
          wx.hideLoading()
          reject(err)
        }
      })
    })
  },

  selectFriend: function (e) {
    const friend = e.currentTarget.dataset.friend
    this.setData({
      friendName: friend.nickname,
      friendOpenid: friend.openid,
      showFriendPicker: false
    })
    this.checkSubmit()
  },

  closeFriendPicker: function () {
    this.setData({ showFriendPicker: false })
  },

  async createRiver() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '创建中...' })
    try {
      const result = await api.createRiver(
        this.data.riverName,
        this.data.selectedType,
        this.data.customRelation,
        this.data.friendOpenid
      )

      wx.hideLoading()
      wx.showToast({
        title: '长河创建成功',
        icon: 'success'
      })

      setTimeout(function() {
        wx.redirectTo({
          url: '/pages/river/river?id=' + result.river.id
        })
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      })
    }
  },

  inviteFriend: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showActionSheet({
      itemList: ['发送给朋友', '分享到朋友圈', '了解更多'],
      success: function(res) {
        if (res.tapIndex === 0) {
          wx.showToast({
            title: '请选择好友发送',
            icon: 'none'
          })
        } else if (res.tapIndex === 1) {
          wx.showToast({
            title: '分享到朋友圈',
            icon: 'none'
          })
        } else {
          wx.showModal({
            title: '邀请说明',
            content: '分享给微信好友后，TA点击进入即可与你绑定记忆长河，一起记录美好回忆',
            showCancel: false
          })
        }
      }
    })
  },

  onShareAppMessage: function () {
    return {
      title: '双人记忆摆渡船 - 一起记录美好回忆',
      desc: '每一条河，都藏着两个人的故事',
      path: '/pages/index/index'
    }
  },

  onShareTimeline: function () {
    return {
      title: '双人记忆摆渡船 - 一起记录美好回忆',
      query: '',
      imageUrl: ''
    }
  }
})