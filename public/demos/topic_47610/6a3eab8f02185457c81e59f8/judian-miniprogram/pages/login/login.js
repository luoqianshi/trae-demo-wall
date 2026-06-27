Page({
  data: {
    statusBarHeight: 44,
    phone: '',
    password: ''
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  onLogin() {
    const { phone, password } = this.data;

    if (!phone || phone.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!password || password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    // TODO: 调用登录接口
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      // wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  },

  onForgotPassword() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  onGoRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  onWechatLogin(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      wx.showLoading({ title: '登录中...' });
      // TODO: 调用微信快捷登录接口，传入 e.detail.code
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      }, 1500);
    } else {
      wx.showToast({
        title: '您取消了授权',
        icon: 'none'
      });
    }
  }
});
