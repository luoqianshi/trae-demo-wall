const app = getApp();

Page({
  data: { likedMe: [] },

  onShow() {
    const likedMe = this.getLikedMeSource();
    this.setData({ likedMe });
  },

  getLikedMeSource() {
    const storedLikedMe = wx.getStorageSync('likedMe') || [];
    return storedLikedMe.length ? storedLikedMe : app.globalData.likedMe || [];
  },

  returnPotato(e) {
    const userId = e.currentTarget.dataset.userid;
    const user = this.data.likedMe.find(item => item.userId === userId);
    if (!user) return;
    this.saveMutualMatch(user);
    this.removeLikedMe(user.userId);
    wx.showModal({
      title: '🥔 双向匹配！',
      content: `你也向 ${user.nickname} 投出了土豆，你们已经互投成功，可以开始聊天了`,
      confirmText: '去聊天',
      cancelText: '继续看看',
      success: res => {
        if (res.confirm) wx.switchTab({ url: '/pages/chat/list/list' });
      }
    });
  },

  saveMutualMatch(user) {
    const matches = wx.getStorageSync('matches') || [];
    if (matches.find(item => item.userId === user.userId)) return;
    const now = Date.now();
    matches.unshift({
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
      lastMessage: '你们已双向投出土豆，开始聊天吧！',
      lastMessageTime: new Date(now).toISOString()
    });
    wx.setStorageSync('matches', matches);
  },

  removeLikedMe(userId) {
    const likedMe = this.getLikedMeSource().filter(item => item.userId !== userId);
    app.globalData.likedMe = likedMe;
    wx.setStorageSync('likedMe', likedMe);
    this.setData({ likedMe });
  }
});
