Page({
  data: {
    bestItem: {
      id: 1,
      name: '静谧时光咖啡馆',
      image: '/images/cafe-best.jpg',
      tags: ['安静', 'WiFi快', '有插座'],
      score: 92,
      votes: 3
    },
    topList: [
      {
        id: 2,
        name: '书香茶舍',
        image: '/images/tea-1.jpg',
        distance: '距你 580m',
        tags: ['安静', '茶饮'],
        score: 85
      },
      {
        id: 3,
        name: '云端自习室',
        image: '/images/study-1.jpg',
        distance: '距你 1.2km',
        tags: ['24小时', '静音区'],
        score: 78
      },
      {
        id: 4,
        name: '慢时光书屋',
        image: '/images/book-1.jpg',
        distance: '距你 890m',
        tags: ['阅读', '咖啡'],
        score: 72
      },
      {
        id: 5,
        name: '城市绿洲',
        image: '/images/park-1.jpg',
        distance: '距你 1.5km',
        tags: ['户外', '自然'],
        score: 65
      }
    ]
  },

  onLoad(options) {
    // 可在此根据传入参数加载真实投票数据
    console.log('vote page onLoad', options);
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  },

  viewRoute() {
    const best = this.data.bestItem;
    wx.openLocation({
      latitude: 31.2304,
      longitude: 121.4737,
      name: best.name,
      address: '推荐地点'
    });
  },

  rematch() {
    wx.showModal({
      title: '重新匹配',
      content: '确定要重新进行地点匹配吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/match/match'
          });
        }
      }
    });
  }
});
