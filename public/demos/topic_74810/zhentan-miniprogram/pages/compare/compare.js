Page({
  data: {
    place: null,
    diff: 0,
    realPhotos: [],
    reviews: []
  },

  onLoad(options) {
    const id = parseInt(options.id);
    this.loadData(id);
  },

  loadData(id) {
    const places = wx.getStorageSync('zhentan_places') || [];
    const place = places.find(p => p.id === id);
    
    if (!place) return;

    const reviews = wx.getStorageSync('zhentan_reviews') || [];
    const placeReviews = reviews.filter(r => r.placeId === id);
    const realPhotos = placeReviews.flatMap(r => r.imgs || []);

    this.setData({
      place,
      diff: place.compareScore.promo - place.compareScore.real,
      realPhotos,
      reviews: placeReviews.slice(0, 3)
    });
  }
});
