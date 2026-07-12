Page({
  data: {
    userInfo: {
      nickName: '',
      avatar: '/images/avatar.jpg',
      signature: '「顺木之天，以致其性」'
    },
    stats: [
      { value: '365', label: '已陪伴（天）' },
      { value: '12', label: '养护中（盆）' },
      { value: '8', label: '见证（花开）' }
    ],
    menuItems: [
      {
        id: 'plants',
        icon: '🪴',
        title: '我的植物库',
        badge: '12',
        arrow: true
      },
      {
        id: 'knowledge',
        icon: '📖',
        title: '收藏的养护知识',
        badge: '',
        arrow: true
      },
      {
        id: 'badges',
        icon: '🏅',
        title: '勋章馆',
        badge: '',
        arrow: true,
        linkText: '查看全部'
      },
      {
        id: 'settings',
        icon: '❓',
        title: '设置与帮助',
        badge: '',
        arrow: true
      }
    ],
    badges: [
      { id: '1', name: '初级园丁', icon: '🌱' },
      { id: '2', name: '灌溉专家', icon: '💧' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.loadUserInfo()
  },

  // 从本地存储加载用户信息
  loadUserInfo() {
    const savedAvatar = wx.getStorageSync('user_avatar')
    const savedNickname = wx.getStorageSync('user_nickname')
    if (savedAvatar || savedNickname) {
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          avatar: savedAvatar || this.data.userInfo.avatar,
          nickName: savedNickname || this.data.userInfo.nickName
        }
      })
    }
  },

  // 用户选择头像
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({
      'userInfo.avatar': avatarUrl
    })
    wx.setStorageSync('user_avatar', avatarUrl)
    wx.showToast({ title: '头像已更新', icon: 'success' })
  },

  // 昵称输入框失焦
  onNicknameBlur(e) {
    const nickname = e.detail.value
    if (nickname && nickname !== this.data.userInfo.nickName) {
      this.setData({ 'userInfo.nickName': nickname })
      wx.setStorageSync('user_nickname', nickname)
    }
  },

  // 昵称输入框确认
  onNicknameConfirm(e) {
    const nickname = e.detail.value
    if (nickname) {
      this.setData({ 'userInfo.nickName': nickname })
      wx.setStorageSync('user_nickname', nickname)
    }
  },

  goToMenu(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `进入${id}`, icon: 'none' })
  },

  goToSettings() {
    wx.showToast({ title: '设置与帮助', icon: 'none' })
  },

  switchAccount() {
    wx.showModal({
      title: '切换账号',
      content: '确定要清除当前用户信息吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('user_avatar')
          wx.removeStorageSync('user_nickname')
          this.setData({
            userInfo: {
              nickName: '',
              avatar: '/images/avatar.jpg',
              signature: '「顺木之天，以致其性」'
            }
          })
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  },

  viewBadges() {
    wx.showToast({ title: '查看全部勋章', icon: 'none' })
  }
})
