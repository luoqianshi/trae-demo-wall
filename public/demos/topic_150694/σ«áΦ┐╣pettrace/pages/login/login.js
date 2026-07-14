const app = getApp()

Page({
  data: {
    currentTab: 'login',
    phone: '',
    nickname: '',
    code: '',
    agreed: false,
    codeBtnDisabled: false,
    codeCountdown: 60,
    canSubmit: false
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab,
      phone: '',
      nickname: '',
      code: ''
    })
    this.checkCanSubmit()
  },

  onPhoneInput: function(e) {
    this.setData({
      phone: e.detail.value
    })
    this.checkCanSubmit()
  },

  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value
    })
    this.checkCanSubmit()
  },

  onCodeInput: function(e) {
    this.setData({
      code: e.detail.value
    })
    this.checkCanSubmit()
  },

  onAgreeChange: function(e) {
    this.setData({
      agreed: e.detail.value
    })
    this.checkCanSubmit()
  },

  checkCanSubmit: function() {
    const phoneValid = /^1[3-9]\d{9}$/.test(this.data.phone)
    const codeValid = this.data.code.length === 6
    const nicknameValid = this.data.currentTab === 'login' || this.data.nickname.trim()
    
    this.setData({
      canSubmit: phoneValid && codeValid && nicknameValid && this.data.agreed
    })
  },

  sendCode: function() {
    const phone = this.data.phone.trim()
    
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      codeBtnDisabled: true
    })
    
    wx.showToast({
      title: '验证码已发送（演示：123456）',
      icon: 'none'
    })
    
    const timer = setInterval(() => {
      const countdown = this.data.codeCountdown - 1
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          codeBtnDisabled: false,
          codeCountdown: 60
        })
      } else {
        this.setData({
          codeCountdown: countdown
        })
      }
    }, 1000)
  },

  submitForm: function() {
    if (!this.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    if (this.data.code !== '123456') {
      wx.showToast({
        title: '验证码错误（演示：123456）',
        icon: 'none'
      })
      return
    }
    
    const userInfo = {
      phone: this.data.phone,
      nickname: this.data.currentTab === 'login' ? '用户' : this.data.nickname,
      avatar: '我',
      isLogin: true
    }
    
    app.login(userInfo)
    
    wx.showToast({
      title: this.data.currentTab === 'login' ? '登录成功！' : '注册成功！',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  socialLogin: function(e) {
    const platform = e.currentTarget.dataset.platform
    const platformNames = {
      wechat: '微信',
      weibo: '微博',
      qq: 'QQ'
    }
    
    wx.showToast({
      title: `正在跳转${platformNames[platform]}授权...`,
      icon: 'none'
    })
    
    setTimeout(() => {
      const userInfo = {
        phone: '',
        nickname: platformNames[platform] + '用户',
        avatar: '我',
        isLogin: true
      }
      
      app.login(userInfo)
      
      wx.showToast({
        title: `${platformNames[platform]}登录成功！`,
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})
