App({
  globalData: {
    userInfo: null,
    settings: null
  },

  onLaunch() {
    this.loadSettings();
  },

  loadSettings() {
    const settings = wx.getStorageSync('comm_settings') || {
      teacherName: '',
      subject: '',
      grade: '',
      defaultStyle: 'gentle',
      defaultChannel: 'wechat'
    };
    this.globalData.settings = settings;
  }
});
