const app = getApp();

Page({
  data: {
    recommendUsers: [],
    currentCity: '上海',
    remainingSwipes: 30,
    isMember: false,
    userInfo: null,
    showFilter: false,
    minAge: 18,
    maxAge: 35,
    maxDistance: 50,
    showMatchModal: false,
    matchedUser: null,
    matchedMatchId: '',
    showSuperLikeModal: false,
    pendingSuperUser: null,
    showLocationAuthModal: false
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const currentUser = app.globalData.currentUser;
    if (!currentUser) {
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }
    this.normalizeDailySwipeRecords();
    const swipedIds = this.getTodaySwipedIds();
    const filteredUsers = (app.globalData.recommendUsers || [])
      .filter(user => user.age >= this.data.minAge && user.age <= this.data.maxAge)
      .filter(user => (user.distanceKm || 0) <= this.data.maxDistance);
    const users = this.buildDailyRecommendUsers(filteredUsers, swipedIds);
    const isMember = currentUser.memberType !== 'none' && currentUser.memberExpireAt && new Date(currentUser.memberExpireAt) > new Date();
    const usedCount = this.getDailyUsedCount();
    const remainingSwipes = isMember ? 30 : Math.max(0, 30 - usedCount);
    this.setData({
      recommendUsers: users,
      remainingSwipes,
      isMember,
      userInfo: currentUser,
      currentCity: currentUser.city || '上海',
      showLocationAuthModal: !currentUser.locationAuthorized
    });
  },

  requestDiscoverLocation() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        this.fetchDiscoverLocation();
      },
      fail: () => {
        wx.showModal({
          title: '需要位置权限',
          content: '开启位置分享后，才能向你显示附近的会员。',
          confirmText: '去设置',
          cancelText: '稍后',
          success: res => {
            if (res.confirm) {
              wx.openSetting({
                success: setting => {
                  if (setting.authSetting['scope.userLocation']) {
                    this.fetchDiscoverLocation();
                  }
                }
              });
            }
          }
        });
      }
    });
  },

  fetchDiscoverLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        this.saveLocationAuthorizedUser(res.latitude, res.longitude);
      },
      fail: () => {
        wx.showToast({ title: '位置获取失败，请重试', icon: 'none' });
      }
    });
  },

  saveLocationAuthorizedUser(latitude, longitude) {
    const user = app.globalData.currentUser || wx.getStorageSync('userInfo') || {};
    user.locationAuthorized = true;
    user.latitude = latitude;
    user.longitude = longitude;
    app.globalData.currentUser = user;
    app.globalData.userInfo = user;
    wx.setStorageSync('userInfo', user);
    this.setData({ showLocationAuthModal: false, userInfo: user });
  },

  onSwipe(e) {
    const { direction, user } = e.detail;
    const usedCount = this.getDailyUsedCount();
    if (!this.data.isMember && usedCount >= 30) {
      wx.showToast({ title: '今日30次已用完，明天再来吧', icon: 'none' });
      return;
    }
    const swipedIds = this.getTodaySwipedIds();
    if (!swipedIds.includes(user.userId)) {
      swipedIds.push(user.userId);
      this.setTodaySwipedIds(swipedIds);
    }
    if (!this.data.isMember) {
      if (!this.hasSwipedToday(user.userId)) {
        this.recordDailySwipe(user.userId);
      }
      const remaining = Math.max(0, 30 - this.getDailyUsedCount());
      this.setData({ remainingSwipes: remaining });
      if (app.globalData.currentUser) {
        app.globalData.currentUser.remainingSwipes = remaining;
        wx.setStorageSync('userInfo', app.globalData.currentUser);
      }
      if (remaining === 0) {
        wx.showToast({ title: '今日30次已用完', icon: 'none' });
      }
    }
    if (direction === 'potato' || direction === 'super') {
      const likedCheckId = user.baseUserId || user.userId;
      if (this.hasLikedMe(likedCheckId)) {
        this.saveMatch(user);
        this.removeLikedMe(likedCheckId);
        this.showMatchModal(user);
      } else {
        this.saveSentPotato(user, direction);
      }
    }
  },

  getTodaySwipeKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  getTodaySwipedIds() {
    const allSwipedIds = wx.getStorageSync('swipedIdsByDate') || {};
    return allSwipedIds[this.getTodaySwipeKey()] || [];
  },

  setTodaySwipedIds(swipedIds) {
    const allSwipedIds = wx.getStorageSync('swipedIdsByDate') || {};
    allSwipedIds[this.getTodaySwipeKey()] = Array.from(new Set(swipedIds));
    wx.setStorageSync('swipedIdsByDate', allSwipedIds);
  },

  buildDailyRecommendUsers(baseUsers, swipedIds, targetCount = 30) {
    if (!baseUsers.length) return [];
    const today = this.getTodaySwipeKey();
    const cards = [];
    for (let index = 0; cards.length < targetCount && index < targetCount * 3; index += 1) {
      const baseUser = baseUsers[index % baseUsers.length];
      const userId = index < baseUsers.length ? baseUser.userId : `${baseUser.userId}_${today}_${index}`;
      if (swipedIds.includes(userId)) continue;
      cards.push({
        ...baseUser,
        baseUserId: baseUser.userId,
        userId
      });
    }
    return cards;
  },

  getDailyUsedCount() {
    const dailySwipeRecords = this.normalizeDailySwipeRecords();
    const today = this.getTodaySwipeKey();
    return (dailySwipeRecords[today] || []).length;
  },

  normalizeDailySwipeRecords() {
    const dailySwipeRecords = wx.getStorageSync('dailySwipeRecords') || {};
    const today = this.getTodaySwipeKey();
    dailySwipeRecords[today] = Array.from(new Set(dailySwipeRecords[today] || [])).slice(0, 30);
    wx.setStorageSync('dailySwipeRecords', dailySwipeRecords);
    return dailySwipeRecords;
  },

  hasSwipedToday(userId) {
    const dailySwipeRecords = this.normalizeDailySwipeRecords();
    const today = this.getTodaySwipeKey();
    return (dailySwipeRecords[today] || []).includes(userId);
  },

  recordDailySwipe(userId) {
    const dailySwipeRecords = wx.getStorageSync('dailySwipeRecords') || {};
    const today = this.getTodaySwipeKey();
    const todayRecords = dailySwipeRecords[today] || [];
    if (!todayRecords.includes(userId)) {
      todayRecords.push(userId);
    }
    dailySwipeRecords[today] = todayRecords;
    wx.setStorageSync('dailySwipeRecords', dailySwipeRecords);
  },

  hasLikedMe(userId) {
    const storedLikedMe = wx.getStorageSync('likedMe') || [];
    const likedMe = storedLikedMe.length ? storedLikedMe : app.globalData.likedMe || [];
    return likedMe.some(item => item.userId === userId);
  },

  removeLikedMe(userId) {
    const storedLikedMe = wx.getStorageSync('likedMe') || [];
    const likedMe = storedLikedMe.length ? storedLikedMe : app.globalData.likedMe || [];
    const next = likedMe.filter(item => item.userId !== userId);
    app.globalData.likedMe = next;
    wx.setStorageSync('likedMe', next);
  },

  saveSentPotato(user, direction) {
    const sentPotatoes = wx.getStorageSync('sentPotatoes') || [];
    if (sentPotatoes.find(item => item.userId === user.userId)) return;
    sentPotatoes.unshift({
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatarUrls[0],
      identity: user.identity,
      direction,
      createdAt: new Date().toISOString()
    });
    wx.setStorageSync('sentPotatoes', sentPotatoes);
  },

  showMatchModal(user) {
    const matches = wx.getStorageSync('matches') || [];
    const match = matches.find(item => item.userId === user.userId);
    this.setData({ showMatchModal: true, matchedUser: user, matchedMatchId: match ? match.matchId : '' });
  },

  closeMatchModal() {
    this.setData({ showMatchModal: false, matchedUser: null, matchedMatchId: '' });
  },

  goToChatFromMatch() {
    this.closeMatchModal();
    wx.switchTab({ url: '/pages/chat/list/list' });
  },

  sendMatchQuickEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    const matchId = this.data.matchedMatchId;
    if (!emoji || !matchId) return;
    const now = new Date().toISOString();
    const allMessages = wx.getStorageSync('messages') || {};
    const messages = allMessages[matchId] || [];
    messages.push({
      messageId: `msg_${Date.now()}`,
      content: emoji,
      isSelf: true,
      createdAt: now
    });
    allMessages[matchId] = messages;
    wx.setStorageSync('messages', allMessages);
    const matches = wx.getStorageSync('matches') || [];
    const nextMatches = matches.map(item => item.matchId === matchId ? {
      ...item,
      lastMessage: emoji,
      lastMessageTime: now
    } : item);
    wx.setStorageSync('matches', nextMatches);
    this.closeMatchModal();
    wx.navigateTo({ url: `/pages/chat/detail/detail?matchId=${matchId}` });
  },

  saveMatch(user) {
    const matches = wx.getStorageSync('matches') || [];
    if (matches.find(item => item.userId === user.userId)) return;
    const now = Date.now();
    matches.unshift({
      matchId: `m_${Date.now()}`,
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatarUrls[0],
      identity: user.identity,
      age: user.age,
      city: user.city,
      cannotDo: user.cannotDo || [],
      wechatId: user.wechatId || 'wx_potato_123',
      wechatUnlocked: false,
      safetyCodeSet: false,
      read: false,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      lastMessage: '你们已双向匹配成功，开始聊天吧！',
      lastMessageTime: new Date(now).toISOString()
    });
    wx.setStorageSync('matches', matches);
  },

  openDetail(e) {
    wx.navigateTo({ url: `/pages/profile/detail/detail?userId=${e.detail.userId}` });
  },

  onReload() {
    wx.removeStorageSync('swipedIdsByDate');
    wx.removeStorageSync('swipedIds');
    this.loadData();
  },

  goToVip() {
    wx.navigateTo({ url: '/pages/vip/index' });
  },

  showSuperLikeModal(e) {
    this.setData({
      showSuperLikeModal: true,
      pendingSuperUser: e.detail.user
    });
  },

  closeSuperLikeModal() {
    this.setData({
      showSuperLikeModal: false,
      pendingSuperUser: null
    });
    const cards = this.selectComponent('#discoverCards');
    if (cards) cards.resetCard();
  },

  confirmSuperLike() {
    this.setData({ showSuperLikeModal: false });
    const cards = this.selectComponent('#discoverCards');
    if (cards) cards.swipeCard('super');
  },

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter });
  },

  onMinAgeChange(e) {
    const value = Math.min(e.detail.value, this.data.maxAge);
    this.setData({ minAge: value });
  },

  onMaxAgeChange(e) {
    const value = Math.max(e.detail.value, this.data.minAge);
    this.setData({ maxAge: value });
  },

  onDistanceChange(e) {
    this.setData({ maxDistance: e.detail.value });
  },

  applyFilter() {
    this.setData({ showFilter: false });
    this.loadData();
  },

  resetFilter() {
    this.setData({
      minAge: 18,
      maxAge: 35,
      maxDistance: 50
    });
    this.loadData();
  }
});
