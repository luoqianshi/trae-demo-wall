// app.js —— 小程序入口，全局数据与本地持久化辅助
// 存储说明：使用 wx.setStorageSync / wx.getStorageSync 替换 H5 的 localStorage
//   - jingtu_user_routes  => 用户上传的 UGC 路线数组
//   - jingtu_pref         => 用户最近一次偏好（首页可恢复）
//   - jingtu_patches      => 预置路线的运行时补丁（上报结果）
//   - jingtu_theme        => 主题设置（light/dark）

App({
  globalData: {
    // 预置路线，可由 utils/mockRoutes.js 直接读取
    userUploadRoutes: [],
    // 当前主题：light（浅色）/ dark（深色）
    theme: 'light'
  },

  onLaunch() {
    // 读取本地存储中的 UGC 路线（用于预热，实际逻辑由工具函数处理）
    try {
      const saved = wx.getStorageSync('jingtu_user_routes');
      if (saved) {
        this.globalData.userUploadRoutes = saved;
      }
      // 读取主题设置
      const savedTheme = wx.getStorageSync('jingtu_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        this.globalData.theme = savedTheme;
      }
    } catch (e) {
      // ignore
    }
  },

  // 切换主题
  toggleTheme: function() {
    const newTheme = this.globalData.theme === 'light' ? 'dark' : 'light';
    this.globalData.theme = newTheme;
    try {
      wx.setStorageSync('jingtu_theme', newTheme);
    } catch (e) {
      // ignore
    }
    // 通知所有页面更新主题
    const pages = getCurrentPages();
    pages.forEach(function(page) {
      if (page.onThemeChange) {
        page.onThemeChange(newTheme);
      }
    });
    return newTheme;
  },

  // 获取当前主题
  getTheme: function() {
    return this.globalData.theme;
  },

  // 全局 Toast 快捷方法（页面里也可用 wx.showToast）
  toast(title) {
    wx.showToast({
      title: title || '操作成功',
      icon: 'none',
      duration: 1800
    });
  }
});
