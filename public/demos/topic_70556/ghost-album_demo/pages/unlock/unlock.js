const store = require("../../utils/store");
const auth = require("../../utils/auth");

Page({
  data: {
    password: "",
    errorText: "",
    verifying: false
  },

  onLoad: function () {
    if (!store.hasPassword()) {
      wx.reLaunch({
        url: "/pages/intro/intro"
      });
    }
  },

  onPasswordInput: function (event) {
    this.setData({
      password: event.detail.value,
      errorText: ""
    });
  },

  unlock: function () {
    if (this.data.verifying) {
      return;
    }

    if (!this.data.password) {
      this.setData({
        errorText: "请输入密码"
      });
      return;
    }

    this.setData({
      verifying: true
    });

    if (store.verifyPassword(this.data.password)) {
      auth.markUnlocked("real");
      wx.reLaunch({
        url: "/pages/index/index"
      });
      return;
    }

    if (store.verifyDecoyPassword(this.data.password)) {
      auth.markUnlocked("decoy");
      wx.reLaunch({
        url: "/pages/index/index"
      });
      return;
    }

    this.setData({
      verifying: false,
      password: "",
      errorText: "密码错误，请重试"
    });
  }
});
