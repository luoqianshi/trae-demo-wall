const app = getApp();

Page({
  data: {
    matches: [],
    sproutPotatoes: []
  },

  onShow() {
    const matches = (wx.getStorageSync('matches') || []).map(item => ({
      ...item,
      timeText: this.formatTime(item.lastMessageTime),
      expireText: this.formatExpireText(item.expiresAt),
      isExpired: this.isExpired(item.expiresAt)
    }));
    this.ensureSproutPotatoes();
    const sproutPotatoes = this.loadSproutPotatoes(matches);
    this.setData({ matches, sproutPotatoes });
  },

  ensureSproutPotatoes() {
    const storedLikedMe = wx.getStorageSync('likedMe') || [];
    if (storedLikedMe.length) return storedLikedMe;
    const source = (app.globalData.likedMe && app.globalData.likedMe.length)
      ? app.globalData.likedMe
      : (app.globalData.recommendUsers || []).slice(1, 4).map((user, index) => ({
        userId: user.userId,
        nickname: user.nickname,
        avatar: user.avatarUrls && user.avatarUrls[0],
        identity: user.identity,
        age: user.age,
        city: user.city,
        cannotDo: user.cannotDo || [],
        wechatId: user.wechatId,
        createdAt: new Date(Date.now() - index * 28 * 60 * 1000).toISOString()
      }));
    wx.setStorageSync('likedMe', source);
    app.globalData.likedMe = source;
    return source;
  },

  loadSproutPotatoes(matches) {
    const matchedIds = matches.map(item => item.userId);
    const likedMe = this.getLikedMeSource();
    return likedMe
      .filter(item => !matchedIds.includes(item.userId))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map(item => ({
        ...item,
        timeText: this.formatTime(item.createdAt)
      }));
  },

  getLikedMeSource() {
    const storedLikedMe = wx.getStorageSync('likedMe') || [];
    return storedLikedMe.length ? storedLikedMe : this.ensureSproutPotatoes();
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  isExpired(expiresAt) {
    return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
  },

  formatExpireText(expiresAt) {
    if (!expiresAt) return '24小时限定';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return '一日限定已结束';
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `剩余${hours}小时${minutes}分钟`;
    return `剩余${minutes}分钟`;
  },

  goToChat(e) {
    wx.navigateTo({ url: `/pages/chat/detail/detail?matchId=${e.currentTarget.dataset.matchid}` });
  },

  matchSproutPotato(e) {
    const userId = e.currentTarget.dataset.userid;
    const likedMe = this.getLikedMeSource();
    const user = likedMe.find(item => item.userId === userId);
    if (!user) return;
    const now = Date.now();
    const matches = wx.getStorageSync('matches') || [];
    const match = {
      matchId: `m_${Date.now()}`,
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatar,
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
    };
    wx.setStorageSync('matches', [match, ...matches]);
    const nextLikedMe = likedMe.filter(item => item.userId !== userId);
    app.globalData.likedMe = nextLikedMe;
    wx.setStorageSync('likedMe', nextLikedMe);
    wx.navigateTo({ url: `/pages/chat/detail/detail?matchId=${match.matchId}` });
  },

  goToDiscover() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
