// app.js
// 暖爪归家 - 小程序入口
App({
  onLaunch() {
    // 初始化本地存储的用户信息（首次启动时写入默认值）
    try {
      const userInfo = wx.getStorageSync("userInfo");
      if (!userInfo) {
        const defaultUser = {
          openid: "mock_openid_demo_user",
          nickname: "爱心领养人",
          avatarUrl: "https://picsum.photos/seed/user/100/100",
          phone: "138****8888",
          residenceCity: "北京",
          livingCondition: {
            housingType: "rent",
            spaceSize: 60,
            hasYard: false,
            familyMembers: 3,
            allAgree: true,
          },
          petExperience: "有养猫经验1年",
          creditScore: 92,
          roles: ["adopter", "publisher"], // 普通用户：只有领养者/发布者身份
          isStaff: false,
          createTime: new Date().toISOString(),
        };
        wx.setStorageSync("userInfo", defaultUser);
      }
    } catch (e) {
      console.warn("初始化用户信息失败：", e);
    }

    // 顶部导航栏颜色
    wx.setNavigationBarColor({
      frontColor: "#3a352c",
      backgroundColor: "#fffdf6",
    });
  },

  globalData: {
    // 主题色（暖黄色调，温馨风格）
    theme: {
      primary: "#d9a23e",
      primarySoft: "#fff4d6",
      success: "#9bc97b",
      danger: "#e88a7b",
      textDark: "#3a352c",
      text: "#6b6458",
      textLight: "#a8a094",
      bg: "#fffdf6",
      card: "#ffffff",
      border: "#f3ead0",
    },
  },

  // 获取当前登录用户信息
  getUserInfo() {
    try {
      return wx.getStorageSync("userInfo") || null;
    } catch (e) {
      return null;
    }
  },
});
