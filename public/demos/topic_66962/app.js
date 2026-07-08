// 微信云开发初始化
App({
  onLaunch() {
    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    });
    
    // 从本地存储读取用户登录信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    // 选中的学习等级 1=文学一级 2=文学二级
    currentLevel: 1,
    // 当前课程
    currentCourse: null,
    // 当前答题记录
    quizRecord: null,
    // 进度同步（页面间即时传递，不依赖 localStorage）
    progressSync: {}
  },

  // 班级年级
  grades: ['三年级', '四年级', '五年级', '六年级', '七年级', '八年级']
});