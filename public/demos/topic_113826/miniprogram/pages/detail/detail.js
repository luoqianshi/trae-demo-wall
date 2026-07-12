// miniprogram/pages/detail/detail.js
const { call } = require("../../utils/request.js");
const { formatDate } = require("../../utils/format.js");

Page({
  data: {
    detail: null,
    createDate: "",
    isFavorite: false,
  },

  onLoad(options) {
    this.animalId = options.id;
    this.loadDetail();
    // 检查是否已收藏
    const user = wx.getStorageSync("userInfo") || {};
    this.setData({
      isFavorite: (user.favoriteAnimals || []).indexOf(this.animalId) > -1,
    });
  },

  loadDetail() {
    wx.showLoading({ title: "加载中" });
    call("animalDetail", this.animalId)
      .then((data) => {
        this.setData({
          detail: data,
          createDate: formatDate(data.createTime),
        });
        wx.hideLoading();
      })
      .catch(() => wx.hideLoading());
  },

  toggleFavorite() {
    call("favoriteToggle", this.animalId).then((data) => {
      this.setData({ isFavorite: data.isFavorite });
      wx.showToast({
        title: data.isFavorite ? "已关注" : "已取消关注",
        icon: "none",
      });
      this.loadDetail();
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = (this.data.detail && this.data.detail.images) || [];
    wx.previewImage({ current: url, urls });
  },

  goApply() {
    wx.navigateTo({
      url:
        "/pages/apply/apply?id=" +
        this.animalId +
        "&name=" +
        encodeURIComponent((this.data.detail && this.data.detail.name) || ""),
    });
  },

  contactPublisher() {
    const detail = this.data.detail;
    if (!detail) return;
    
    const params = {
      animalId: detail._id,
      animalName: detail.name || '',
      animalSpecies: detail.species || '',
      animalBreed: detail.breed || '',
      animalAge: detail.ageMonth ? `${detail.ageMonth}个月` : '',
      animalGender: detail.gender || '',
      animalCity: detail.city || '',
      animalDescription: detail.description || '',
      publisherName: detail.publisherName || '发布者',
    };

    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    wx.navigateTo({
      url: `/pages/chat/chat?${query}`,
    });
  },
});
