Page({
  data: {
    statusBarHeight: 44,
    nickname: '',
    phone: '',
    code: '',
    password: '',
    agree: false,
    countdown: 0,
    timer: null
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onToggleAgree() {
    this.setData({ agree: !this.data.agree });
  },

  onSendCode() {
    const { phone, countdown } = this.data;

    if (countdown > 0) return;

    if (!phone || phone.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '验证码已发送',
      icon: 'success'
    });

    // TODO: 调用发送验证码接口

    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      const newCountdown = this.data.countdown - 1;
      if (newCountdown <= 0) {
        clearInterval(timer);
        this.setData({ countdown: 0, timer: null });
      } else {
        this.setData({ countdown: newCountdown });
      }
    }, 1000);
    this.setData({ timer });
  },

  onRegister() {
    const { nickname, phone, code, password, agree } = this.data;

    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!code || code.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' });
      return;
    }

    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    if (!agree) {
      wx.showToast({ title: '请同意用户协议和隐私政策', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '注册中...' });

    // TODO: 调用注册接口
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500,
        complete: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }, 1500);
  },

  onGoBack() {
    wx.navigateBack();
  },

  onGoLogin() {
    wx.navigateBack();
  },

  onViewAgreement() {
    wx.showToast({
      title: '用户协议页面开发中',
      icon: 'none'
    });
  },

  onViewPrivacy() {
    wx.showToast({
      title: '隐私政策页面开发中',
      icon: 'none'
    });
  }
});
