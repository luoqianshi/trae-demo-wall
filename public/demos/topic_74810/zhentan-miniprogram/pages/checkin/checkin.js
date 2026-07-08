Page({
  data: {
    place: null,
    checkedIn: false,
    verifying: false,
    verifyStep: 0,
    isRealLocation: false,
    overallRating: 0,
    dimensions: [
      { key: 'env', label: '环境质量', value: 0 },
      { key: 'facility', label: '设施完善', value: 0 },
      { key: 'service', label: '服务态度', value: 0 },
      { key: 'value', label: '性价比', value: 0 },
      { key: 'safety', label: '安全性', value: 0 },
      { key: 'fun', label: '趣味性', value: 0 }
    ],
    photos: [],
    content: '',
    tagOptions: ['人多', '免费', '照骗', '设施旧', '交通便利', '性价比高', '适合雨天', '建议工作日'],
    selectedTags: [],
    hasCompare: false
  },

  onLoad(options) {
    const id = parseInt(options.id);
    const places = wx.getStorageSync('zhentan_places') || [];
    const place = places.find(p => p.id === id);
    this.setData({ place });
  },

  doCheckin() {
    this.setData({ verifying: true, verifyStep: 0 });

    // Step 1: GPS 定位
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        // 真实 GPS 定位成功
        this.setData({ verifyStep: 1, isRealLocation: true });
        console.log('真实GPS定位成功:', res.latitude, res.longitude);

        // Step 2: 模拟基站定位延迟
        setTimeout(() => {
          this.setData({ verifyStep: 2 });

          // Step 3: 模拟 WiFi 匹配延迟
          setTimeout(() => {
            this.setData({ verifyStep: 3 });

            // 完成验证
            setTimeout(() => {
              this.setData({ verifying: false, checkedIn: true });
              wx.showToast({ title: '打卡成功', icon: 'success' });
            }, 300);
          }, 500);
        }, 500);
      },
      fail: (err) => {
        // 真实定位失败（授权拒绝/定位关闭），降级到模拟定位
        console.warn('真实GPS定位失败，降级为模拟:', err);
        this.setData({ isRealLocation: false });

        // 模拟逐步验证过程
        this.setData({ verifyStep: 1 });
        setTimeout(() => {
          this.setData({ verifyStep: 2 });
        }, 500);
        setTimeout(() => {
          this.setData({ verifyStep: 3 });
        }, 1000);
        setTimeout(() => {
          this.setData({ verifying: false, checkedIn: true });
          wx.showToast({ title: '打卡成功（模拟定位）', icon: 'success' });
        }, 1500);
      }
    });
  },

  setOverallRating(e) {
    const val = parseInt(e.currentTarget.dataset.val);
    this.setData({ overallRating: val });
  },

  setDimension(e) {
    const key = e.currentTarget.dataset.key;
    const val = parseInt(e.currentTarget.dataset.val);
    const dims = this.data.dimensions.map(d =>
      d.key === key ? { ...d, value: val } : d
    );
    this.setData({ dimensions: dims });
  },

  chooseImage() {
    wx.chooseImage({
      count: 3,
      sizeType: ['original', 'compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({ photos: [...this.data.photos, ...res.tempFilePaths] });
      }
    });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const tags = this.data.selectedTags.includes(tag)
      ? this.data.selectedTags.filter(t => t !== tag)
      : [...this.data.selectedTags, tag];
    this.setData({ selectedTags: tags });
  },

  toggleCompare(e) {
    this.setData({ hasCompare: e.detail.value });
  },

  submitReview() {
    if (this.data.overallRating === 0) {
      wx.showToast({ title: '请给出总体评分', icon: 'none' });
      return;
    }

    const dimensionObj = {};
    this.data.dimensions.forEach(d => dimensionObj[d.key] = d.value || 3);

    const review = {
      placeId: this.data.place.id,
      user: '探店达人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
      level: '探索者',
      verified: true,
      time: new Date().toISOString().split('T')[0],
      rating: this.data.overallRating,
      content: this.data.content || '用户未填写文字评价',
      tags: this.data.selectedTags,
      imgs: this.data.photos,
      dimensions: dimensionObj,
      compare: this.data.hasCompare
    };

    const reviews = wx.getStorageSync('zhentan_reviews') || [];
    reviews.unshift(review);
    wx.setStorageSync('zhentan_reviews', reviews);

    // Update user stats
    const user = wx.getStorageSync('zhentan_user');
    user.reviews++;
    user.contributions += this.calcPoints(review);
    wx.setStorageSync('zhentan_user', user);

    wx.showModal({
      title: '提交成功',
      content: `评价将在24-72小时后公开发布。\n获得贡献值：+${this.calcPoints(review)}`,
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },

  calcPoints(review) {
    let points = 10;
    if (review.imgs.length > 0) points += 15;
    if (review.content.length > 50) points += 20;
    if (review.compare) points += 25;
    return points;
  }
});
