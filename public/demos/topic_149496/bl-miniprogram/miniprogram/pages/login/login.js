// pages/login/login.js
const app = getApp()
const cloud = require('../../utils/cloud.js')
const util = require('../../utils/util.js')

// 演示用默认位置（唐山市中心），正式使用时改回真实定位逻辑
const DEFAULT_LOCATION = { lat: 39.782189, lng: 118.155996 }

Page({
  data: {
    step: 'init',        // init: 初始状态, register: 新用户注册
    checking: false,     // 正在检查用户
    nickname: '',
    avatar: '',
    community: '',
    loading: false,
    location: DEFAULT_LOCATION,  // 演示用：默认位置，正式使用时改回 null
    locationText: '',
    locationLoading: false,
    locationDenied: false
  },

  // 微信一键登录（先查询用户）
  async onWeChatLogin() {
    if (this.data.checking) return
    this.setData({ checking: true })

    try {
      // 先调用login云函数查询用户（不传community和location）
      const res = await cloud.login()
      if (res.success) {
        if (!res.isNewUser) {
          // 老用户，直接进入
          const userInfo = {
            ...res.user,
            openid: res.user._id
          }
          app.setUserInfo(userInfo)
          util.showToast('登录成功', 'success')
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' })
          }, 1000)
        } else {
          // 新用户，进入注册流程
          this.setData({ step: 'register' })
        }
      } else {
        util.showToast(res.message || '登录失败')
      }
    } catch (err) {
      util.showToast('登录失败，请重试')
      console.error(err)
    } finally {
      this.setData({ checking: false })
    }
  },

  // 选择微信头像
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({ avatar: avatarUrl })
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  // 输入社区
  onCommunityInput(e) {
    this.setData({ community: e.detail.value })
  },

  // 获取定位（演示用：暂不调用，正式使用时恢复）
  // async getLocation() {
  //   this.setData({ locationLoading: true, locationDenied: false })
  //   try {
  //     const res = await new Promise((resolve, reject) => {
  //       wx.getLocation({
  //         type: 'gcj02',
  //         success: resolve,
  //         fail: reject
  //       })
  //     })
  //     const location = { lat: res.latitude, lng: res.longitude }
  //     const locationText = `当前位置：${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`
  //     this.setData({ location, locationText, locationLoading: false })
  //     util.showToast('定位成功', 'success')
  //   } catch (err) {
  //     console.error('定位失败:', err)
  //     this.setData({ locationLoading: false, locationDenied: true })
  //     if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
  //       util.showToast('请在设置中开启定位权限')
  //     } else {
  //       util.showToast('定位失败，请检查位置服务')
  //     }
  //   }
  // },

  // 完善信息并注册
  async onRegister() {
    if (!this.data.nickname.trim()) {
      util.showToast('请输入昵称')
      return
    }
    if (!this.data.community.trim()) {
      util.showToast('请输入所属社区')
      return
    }
    // 演示用：使用默认位置，不再要求获取定位
    // 正式使用时恢复以下定位校验逻辑：
    // if (!this.data.location) {
    //   wx.showModal({
    //     title: '未获取定位',
    //     content: '获取定位后才能查看附近的互助和闲置信息，是否现在获取？',
    //     confirmText: '去获取',
    //     cancelText: '稍后',
    //     success: (res) => {
    //       if (res.confirm) {
    //         this.getLocation()
    //       }
    //     }
    //   })
    //   return
    // }

    this.setData({ loading: true })

    try {
      // 调用login云函数创建用户（传完整信息，使用默认位置）
      const res = await cloud.login(
        this.data.nickname.trim(),
        this.data.avatar,
        this.data.community.trim(),
        this.data.location
      )

      if (res.success && res.user) {
        const userInfo = {
          ...res.user,
          openid: res.user._id
        }
        app.setUserInfo(userInfo)
        util.showToast('注册成功', 'success')
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 1000)
      } else {
        util.showToast(res.message || '注册失败')
      }
    } catch (err) {
      util.showToast('注册失败，请重试')
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
