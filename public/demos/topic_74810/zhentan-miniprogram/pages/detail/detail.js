Page({
  data: {
    place: null,
    reviews: [],
    starStr: '',
    dimensionList: []
  },

  onLoad(options) {
    const id = parseInt(options.id);
    this.loadPlaceData(id);
  },

  loadPlaceData(id) {
    const places = wx.getStorageSync('zhentan_places') || [];
    const place = places.find(p => p.id === id);
    
    if (!place) return;

    const reviews = wx.getStorageSync('zhentan_reviews') || [];
    const placeReviews = reviews.filter(r => r.placeId === id);

    // Calculate average dimensions
    const avgDims = { env: 0, facility: 0, service: 0, value: 0, safety: 0, fun: 0 };
    placeReviews.forEach(r => {
      Object.keys(avgDims).forEach(k => avgDims[k] += (r.dimensions[k] || 0));
    });
    const count = placeReviews.length || 1;
    Object.keys(avgDims).forEach(k => {
      avgDims[k] = placeReviews.length ? (avgDims[k] / count) : place.dimensions[k];
    });

    const dimLabels = {
      env: '环境质量', facility: '设施完善', service: '服务态度',
      value: '性价比', safety: '安全性', fun: '趣味性'
    };

    const dimensionList = Object.keys(dimLabels).map(key => {
      const score = avgDims[key];
      const pct = (score / 5) * 100;
      const color = score >= 4 ? '#5B9A7D' : score >= 3 ? '#f59e0b' : '#E8734A';
      return { key, label: dimLabels[key], score, pct, color };
    });

    // Pre-compute star strings for WXML (cannot use .repeat() in template)
    const reviewsWithStars = placeReviews.map(r => ({
      ...r,
      starStr: '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)
    }));

    this.setData({
      place,
      reviews: reviewsWithStars,
      starStr: '★'.repeat(Math.floor(place.rating)) + '☆'.repeat(5 - Math.floor(place.rating)),
      dimensionList
    });
  },

  goToCheckin() {
    wx.navigateTo({ url: `/pages/checkin/checkin?id=${this.data.place.id}` });
  },

  goToCompare() {
    wx.navigateTo({ url: `/pages/compare/compare?id=${this.data.place.id}` });
  },

  goToTimeline() {
    wx.navigateTo({ url: `/pages/timeline/timeline?id=${this.data.place.id}` });
  }
});
