Page({
  data: {
    places: [],
    filteredPlaces: [],
    searchQuery: '',
    activeFilter: 'all'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  loadData() {
    const places = wx.getStorageSync('zhentan_places') || [];
    const placesWithStars = places.map(p => ({
      ...p,
      starStr: '★'.repeat(Math.floor(p.rating)) + '☆'.repeat(5 - Math.floor(p.rating))
    }));
    this.setData({ 
      places: placesWithStars,
      filteredPlaces: placesWithStars 
    });
  },

  onSearchInput(e) {
    const query = e.detail.value.toLowerCase();
    this.setData({ searchQuery: query });
    this.filterPlaces(query, this.data.activeFilter);
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.filterPlaces(this.data.searchQuery, filter);
  },

  filterPlaces(query, filter) {
    let result = this.data.places;
    
    if (query) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (filter !== 'all') {
      result = result.filter(p => 
        p.type === filter || p.tags.includes(filter)
      );
    }
    
    this.setData({ filteredPlaces: result });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
