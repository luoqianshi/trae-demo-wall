// app.js
App({
  onLaunch() {
    const history = wx.getStorageSync('planHistory') || [];
    const favorites = wx.getStorageSync('favorites') || [];
    this.globalData.planHistory = history;
    this.globalData.favorites = favorites;
  },
  
  globalData: {
    userInfo: null,
    planHistory: [],
    favorites: [],
    currentPlan: null,
    moods: [
      { id: 'relax', name: '治愈放松', icon: '🌿', color: '#6BCB77', desc: '安静舒适，慢慢享受' },
      { id: 'fun', name: '热闹互动', icon: '🎉', color: '#FF6B6B', desc: '嗨翻全场，快乐加倍' },
      { id: 'budget', name: '轻玩省钱', icon: '💰', color: '#4D96FF', desc: '花小钱，大快乐' },
      { id: 'date', name: '浪漫约会', icon: '💕', color: '#FF8FAB', desc: '二人世界，甜蜜时光' },
      { id: 'adventure', name: '新奇探险', icon: '🗺️', color: '#9D4EDD', desc: '探索未知，发现惊喜' },
      { id: 'foodie', name: '美食之旅', icon: '🍜', color: '#FF922B', desc: '舌尖上的狂欢' }
    ],
    mockPlans: [
      {
        id: 1,
        mood: 'relax',
        title: '治愈放松一日局',
        tags: ['咖啡', '书店', '按摩', '轻食'],
        budget: 200,
        duration: '6小时',
        rating: 4.8,
        liked: false,
        schedule: [
          { time: '14:00', place: '漫咖啡(星光店)', activity: '下午茶聊天', cost: 68, duration: '1.5小时' },
          { time: '15:30', place: '方所书店', activity: '看书闲逛', cost: 0, duration: '1.5小时' },
          { time: '17:00', place: '泰式按摩SPA', activity: '放松按摩', cost: 128, duration: '1小时' },
          { time: '18:30', place: 'wagas轻食', activity: '晚餐', cost: 88, duration: '1小时' }
        ]
      },
      {
        id: 2,
        mood: 'fun',
        title: '热闹狂欢派对局',
        tags: ['剧本杀', '火锅', 'KTV', '夜宵'],
        budget: 350,
        duration: '8小时',
        rating: 4.9,
        liked: false,
        schedule: [
          { time: '14:00', place: '谜局剧本杀', activity: '沉浸式剧本杀', cost: 128, duration: '4小时' },
          { time: '18:00', place: '海底捞火锅', activity: '火锅聚餐', cost: 150, duration: '2小时' },
          { time: '20:00', place: '唱吧麦颂KTV', activity: '唱歌狂欢', cost: 88, duration: '2小时' },
          { time: '22:00', place: '深夜食堂', activity: '夜宵撸串', cost: 60, duration: '1小时' }
        ]
      },
      {
        id: 3,
        mood: 'budget',
        title: '低预算轻玩局',
        tags: ['公园', '野餐', '桌游', '奶茶'],
        budget: 80,
        duration: '5小时',
        rating: 4.6,
        liked: false,
        schedule: [
          { time: '14:00', place: '中央公园', activity: '野餐晒太阳', cost: 30, duration: '2小时' },
          { time: '16:00', place: '公园草坪', activity: '桌游卡牌游戏', cost: 0, duration: '1.5小时' },
          { time: '17:30', place: '蜜雪冰城', activity: '奶茶小憩', cost: 12, duration: '0.5小时' },
          { time: '18:00', place: '麻辣烫小店', activity: '晚餐', cost: 25, duration: '1小时' }
        ]
      },
      {
        id: 4,
        mood: 'date',
        title: '浪漫约会甜蜜局',
        tags: ['电影', '西餐厅', '摩天轮', '甜品'],
        budget: 400,
        duration: '7小时',
        rating: 4.9,
        liked: false,
        schedule: [
          { time: '14:00', place: '万达影城', activity: '看电影', cost: 80, duration: '2小时' },
          { time: '16:30', place: '摩天轮乐园', activity: '摩天轮+拍照', cost: 60, duration: '1.5小时' },
          { time: '18:00', place: '西堤厚牛排', activity: '烛光晚餐', cost: 200, duration: '1.5小时' },
          { time: '20:00', place: '哈根达斯', activity: '甜品时光', cost: 60, duration: '1小时' }
        ]
      },
      {
        id: 5,
        mood: 'adventure',
        title: '新奇探险体验局',
        tags: ['密室逃脱', '射箭', '攀岩', '潮玩'],
        budget: 280,
        duration: '7小时',
        rating: 4.7,
        liked: false,
        schedule: [
          { time: '13:00', place: 'Xcape密室逃脱', activity: '密室挑战', cost: 98, duration: '1.5小时' },
          { time: '15:00', place: '射箭馆', activity: '射箭体验', cost: 68, duration: '1小时' },
          { time: '16:30', place: '室内攀岩馆', activity: '攀岩挑战', cost: 88, duration: '1.5小时' },
          { time: '18:30', place: '潮玩集合店', activity: '逛街+晚餐', cost: 80, duration: '2小时' }
        ]
      },
      {
        id: 6,
        mood: 'foodie',
        title: '美食扫荡之旅',
        tags: ['早餐', '下午茶', '正餐', '夜宵'],
        budget: 250,
        duration: '8小时',
        rating: 4.8,
        liked: false,
        schedule: [
          { time: '10:00', place: '老字号早茶店', activity: '广式早茶', cost: 68, duration: '1.5小时' },
          { time: '12:30', place: '网红奶茶店', activity: '下午茶打卡', cost: 30, duration: '1小时' },
          { time: '14:00', place: '日料放题', activity: '海鲜自助', cost: 128, duration: '2小时' },
          { time: '17:00', place: '甜品店', activity: '蛋糕甜点', cost: 38, duration: '1小时' },
          { time: '19:00', place: '夜市小吃街', activity: '逛吃逛吃', cost: 50, duration: '2小时' }
        ]
      }
    ]
  },

  savePlan(plan) {
    const history = this.globalData.planHistory;
    const exists = history.find(item => item.id === plan.id);
    if (!exists) {
      history.unshift(plan);
      wx.setStorageSync('planHistory', history);
    }
  },

  toggleFavorite(plan) {
    const favorites = this.globalData.favorites;
    const index = favorites.findIndex(item => item.id === plan.id);
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.unshift(plan);
    }
    this.globalData.favorites = favorites;
    wx.setStorageSync('favorites', favorites);
    return index === -1;
  }
});
