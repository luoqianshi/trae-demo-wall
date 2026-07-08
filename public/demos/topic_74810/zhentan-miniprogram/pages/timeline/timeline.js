Page({
  data: {
    places: []
  },

  onLoad(options) {
    const places = wx.getStorageSync('zhentan_places') || [];
    // If id is provided, filter to that place; otherwise show all
    if (options.id) {
      const id = parseInt(options.id);
      const place = places.find(p => p.id === id);
      this.setData({ places: place ? [place] : [] });
    } else {
      this.setData({ places });
    }
  }
});
