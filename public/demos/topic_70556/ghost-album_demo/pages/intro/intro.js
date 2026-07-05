const store = require("../../utils/store");
const auth = require("../../utils/auth");

Page({
  data: {
    showPasswordModal: false,
    showDecoyModal: false,
    password: "",
    confirmPassword: "",
    decoyPassword: "",
    decoyConfirm: "",
    errorText: "",
    decoyErrorText: ""
  },

  onLoad: function () {
    if (store.hasPassword()) {
      wx.reLaunch({
        url: "/pages/unlock/unlock"
      });
    }
  },

  openPasswordModal: function () {
    this.setData({
      showPasswordModal: true,
      errorText: ""
    });
  },

  closePasswordModal: function () {
    this.setData({
      showPasswordModal: false,
      password: "",
      confirmPassword: "",
      errorText: ""
    });
  },

  onPasswordInput: function (event) {
    this.setData({
      password: event.detail.value,
      errorText: ""
    });
  },

  onConfirmInput: function (event) {
    this.setData({
      confirmPassword: event.detail.value,
      errorText: ""
    });
  },

  submitPassword: function () {
    var password = this.data.password;
    var confirmPassword = this.data.confirmPassword;

    if (!password || password.length < 4) {
      this.setData({
        errorText: "请设置至少 4 位密码"
      });
      return;
    }

    if (password !== confirmPassword) {
      this.setData({
        errorText: "两次输入的密码不一致"
      });
      return;
    }

    store.setPassword(password);
    this.closePasswordModal();
    this.setData({
      showDecoyModal: true
    });
  },

  closeDecoyModal: function () {
    this.setData({
      showDecoyModal: false,
      decoyPassword: "",
      decoyConfirm: "",
      decoyErrorText: ""
    });
  },

  onDecoyPasswordInput: function (event) {
    this.setData({
      decoyPassword: event.detail.value,
      decoyErrorText: ""
    });
  },

  onDecoyConfirmInput: function (event) {
    this.setData({
      decoyConfirm: event.detail.value,
      decoyErrorText: ""
    });
  },

  submitDecoyPassword: function () {
    var decoyPassword = this.data.decoyPassword;
    var decoyConfirm = this.data.decoyConfirm;

    if (!decoyPassword || decoyPassword.length < 4) {
      this.setData({
        decoyErrorText: "请设置至少 4 位密码"
      });
      return;
    }

    if (decoyPassword !== decoyConfirm) {
      this.setData({
        decoyErrorText: "两次输入的密码不一致"
      });
      return;
    }

    store.setDecoyPassword(decoyPassword);
    this.closeDecoyModal();
    auth.markUnlocked("real");
    wx.reLaunch({
      url: "/pages/index/index"
    });
  },

  skipDecoyPassword: function () {
    this.closeDecoyModal();
    auth.markUnlocked("real");
    wx.reLaunch({
      url: "/pages/index/index"
    });
  }
});
