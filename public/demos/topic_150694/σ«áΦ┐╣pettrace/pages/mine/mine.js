const app = getApp()

Page({
  data: {
    userInfo: null,
    myPosts: 0,
    myFavorites: 0,
    myAdoptions: 0,
    unreadCount: 3
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    const userInfo = app.globalData.userInfo
    this.setData({
      userInfo: userInfo,
      userName: userInfo ? userInfo.nickname : '点击登录',
      hasPhone: userInfo && userInfo.phone && userInfo.phone.length > 0
    })
    
    try {
      const favorites = wx.getStorageSync('favorites') || []
      this.setData({
        myFavorites: favorites.length
      })
    } catch (e) {
      this.setData({
        myFavorites: 0
      })
    }
  },

  goToLogin: function() {
    if (!this.data.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    } else {
      wx.showToast({
        title: '编辑功能开发中',
        icon: 'none'
      })
    }
  },

  goToMyPosts: function() {
    if (!this.data.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.showToast({
      title: '我的发布功能开发中',
      icon: 'none'
    })
  },

  goToFavorites: function() {
    if (!this.data.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.showToast({
      title: '我的收藏功能开发中',
      icon: 'none'
    })
  },

  goToAdoptions: function() {
    if (!this.data.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.showToast({
      title: '领养记录功能开发中',
      icon: 'none'
    })
  },

  goToMessages: function() {
    if (!this.data.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.showToast({
      title: '消息通知功能开发中',
      icon: 'none'
    })
  },

  goToHospital: function() {
    wx.showToast({
      title: '合作医院功能开发中',
      icon: 'none'
    })
  },

  goToGuide: function() {
    wx.showModal({
      title: '领养须知',
      content: '领养宠物需要负责任：\n1. 提供小动物的吃喝拉撒\n2. 生病时及时照顾\n3. 日常遛狗或给猫咪铲屎\n4. 每月可能的买粮看病费用\n5. 需要和家人沟通达成一致',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  goToAgreement: function() {
    wx.showToast({
      title: '用户协议功能开发中',
      icon: 'none'
    })
  },

  goToSettings: function() {
    wx.showActionSheet({
      itemList: ['清除缓存', '关于我们', '退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '关于我们',
            content: '宠迹 PetTrace\n版本：1.0.0\n让每一次走失都有重逢的希望',
            showCancel: false
          })
        } else if (res.tapIndex === 2) {
          if (this.data.userInfo) {
            app.logout()
            this.setData({
              userInfo: null,
              myFavorites: 0
            })
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '请先登录',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
