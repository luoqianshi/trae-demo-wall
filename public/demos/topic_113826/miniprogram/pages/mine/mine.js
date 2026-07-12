// miniprogram/pages/mine/mine.js
const { call } = require("../../utils/request.js");
const app = getApp();

Page({
  data: {
    user: {},
    stats: {
      applyCount: 0,
      favCount: 0,
      reviewCount: 0,
    },
  },

  onShow() {
    this.load();
  },

  load() {
    const user = wx.getStorageSync("userInfo") || {};
    this.setData({ user });
    call("applicationMy").then((data) => {
      this.setData({ "stats.applyCount": (data || []).length });
    });
    call("reviewListByUser").then((data) => {
      this.setData({ "stats.reviewCount": (data || []).length });
    });
    this.setData({ "stats.favCount": (user.favoriteAnimals || []).length });
  },

  goApplications() {
    wx.navigateTo({ url: "/pages/applications/applications" });
  },

  goReviews() {
    wx.navigateTo({ url: "/pages/reviews/reviews" });
  },

  goMyFav() {
    wx.showToast({ title: "可在首页筛选已关注", icon: "none" });
  },

  editProfile() {
    wx.showModal({
      title: "修改昵称",
      editable: true,
      placeholderText: "请输入新昵称",
      success: (res) => {
        if (res.confirm && res.content) {
          const user = wx.getStorageSync("userInfo") || {};
          user.nickname = res.content;
          wx.setStorageSync("userInfo", user);
          this.setData({ user });
          wx.showToast({ title: "已更新", icon: "success" });
        }
      },
    });
  },

  showAbout() {
    wx.showModal({
      title: "关于暖爪归家",
      content:
        "一款连接流浪动物与潜在领养人的微信小程序。让善意被看见，让责任可跟踪。",
      showCancel: false,
      confirmText: "好的",
    });
  },

  resetAll() {
    wx.showModal({
      title: "确认重置",
      content: "将清空本地模拟数据，回到初始演示状态",
      success: (res) => {
        if (res.confirm) {
          call("resetAll").then(() => {
            const user = {
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
              roles: ["adopter", "publisher"],
              isStaff: false,
              createTime: new Date().toISOString(),
            };
            wx.setStorageSync("userInfo", user);
            wx.showToast({ title: "已重置", icon: "success" });
            this.load();
          });
        }
      },
    });
  },
});
