Page({
  data: {
    matchId: '',
    matchUser: { cannotDo: [] },
    messages: [],
    inputValue: '',
    wechatUnlocked: false,
    safetyCodeSet: false,
    isExpired: false,
    expireText: '24小时限定',
    scrollToView: '',
    dateOrder: null,
    showDateInviteModal: false,
    selectedDatePackage: {},
    feeRate: 0.2,
    datePackages: [
      { days: 1, name: '一日 date', price: 69 },
      { days: 2, name: '双日 date', price: 129 },
      { days: 3, name: '三日 date', price: 189 },
      { days: 5, name: '五日 date', price: 299 },
      { days: 7, name: '七日 date', price: 399 }
    ]
  },

  onLoad(options) {
    const matchId = options.matchId || '';
    this.setData({ matchId });
    const loaded = this.loadMatchData(matchId);
    if (!loaded) {
      this.handleMissingMatch();
      return;
    }
    this.loadDateOrder(matchId);
    this.loadMessages(matchId);
  },

  loadDateOrder(matchId) {
    const orders = wx.getStorageSync('dateOrders') || [];
    const order = orders.find(item => item.matchId === matchId);
    this.setData({ dateOrder: order || null });
  },

  withFeeBreakdown(pkg) {
    const platformFee = Number((pkg.price * this.data.feeRate).toFixed(1));
    const providerAmount = Number((pkg.price - platformFee).toFixed(1));
    return {
      ...pkg,
      platformFee,
      providerAmount
    };
  },

  openDateInviteModal() {
    this.setData({
      showDateInviteModal: true,
      selectedDatePackage: this.withFeeBreakdown(this.data.datePackages[0])
    });
  },

  closeDateInviteModal() {
    this.setData({
      showDateInviteModal: false,
      selectedDatePackage: {}
    });
  },

  selectDatePackage(e) {
    const pkg = this.data.datePackages[e.currentTarget.dataset.index];
    this.setData({ selectedDatePackage: this.withFeeBreakdown(pkg) });
  },

  confirmDateInvite() {
    const pkg = this.data.selectedDatePackage;
    if (!pkg.days) return;
    const orders = wx.getStorageSync('dateOrders') || [];
    const order = {
      orderId: `d_${Date.now()}`,
      matchId: this.data.matchId,
      userId: this.data.matchUser.userId,
      nickname: this.data.matchUser.nickname,
      packageName: pkg.name,
      days: pkg.days,
      price: pkg.price,
      platformFee: pkg.platformFee,
      providerAmount: pkg.providerAmount,
      status: '待对方确认',
      feeRate: this.data.feeRate,
      createdAt: new Date().toISOString()
    };
    wx.setStorageSync('dateOrders', [order, ...orders.filter(item => item.matchId !== this.data.matchId)]);
    this.setData({ dateOrder: order });
    this.closeDateInviteModal();
    const content = `${pkg.name} 邀请已发起，待对方确认`;
    const message = {
      messageId: `msg_${Date.now()}`,
      content,
      isSelf: true,
      createdAt: new Date().toISOString(),
      timeText: this.formatMessageTime(new Date())
    };
    const messages = [...this.data.messages, message];
    this.setData({ messages });
    this.saveMessages(messages);
    this.updateMatchAfterMessage(content, message.createdAt);
    wx.showToast({ title: 'date 邀请已发起', icon: 'success' });
    this.scrollToBottom();
  },

  formatTime(timeStr) {
    const date = new Date(timeStr);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  loadMatchData(matchId) {
    const matches = wx.getStorageSync('matches') || [];
    const match = matches.find(item => item.matchId === matchId);
    if (match) {
      this.setData({
        matchUser: match,
        wechatUnlocked: match.wechatUnlocked || false,
        safetyCodeSet: match.safetyCodeSet || false,
        isExpired: this.isExpired(match.expiresAt),
        expireText: this.formatExpireText(match.expiresAt)
      });
      return true;
    }
    return false;
  },

  handleMissingMatch() {
    wx.showToast({ title: '会话不存在或已取消', icon: 'none' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/chat/list/list' });
    }, 700);
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
    if (hours > 0) return `一日限定剩余${hours}小时${minutes}分钟`;
    return `一日限定剩余${minutes}分钟`;
  },

  loadMessages(matchId) {
    const allMessages = wx.getStorageSync('messages') || {};
    const source = allMessages[matchId] || [
      { messageId: 'msg_1', content: '嗨～很高兴认识你！', isSelf: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { messageId: 'msg_2', content: '你好呀！我也很高兴～', isSelf: true, createdAt: new Date(Date.now() - 3000000).toISOString() }
    ];
    const messages = source.map(item => ({ ...item, timeText: this.formatTime(item.createdAt) }));
    this.setData({ messages });
    this.scrollToBottom();
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    if (this.data.isExpired) {
      wx.showToast({ title: '一日限定已结束', icon: 'none' });
      return;
    }
    if (!this.data.inputValue.trim()) return;
    const message = {
      messageId: `msg_${Date.now()}`,
      content: this.data.inputValue.trim(),
      isSelf: true,
      createdAt: new Date().toISOString(),
      timeText: this.formatTime(new Date().toISOString())
    };
    const messages = [...this.data.messages, message];
    this.setData({ messages, inputValue: '' });
    this.saveMessages(messages);
    this.updateMatchAfterMessage(message.content, message.createdAt);
    this.scrollToBottom();
  },

  sendQuickEmoji(e) {
    if (this.data.isExpired) {
      wx.showToast({ title: '一日限定已结束', icon: 'none' });
      return;
    }
    const emoji = e.currentTarget.dataset.emoji;
    if (!emoji) return;
    const message = {
      messageId: `msg_${Date.now()}`,
      content: emoji,
      isSelf: true,
      createdAt: new Date().toISOString(),
      timeText: this.formatTime(new Date().toISOString())
    };
    const messages = [...this.data.messages, message];
    this.setData({ messages });
    this.saveMessages(messages);
    this.updateMatchAfterMessage(message.content, message.createdAt);
    this.scrollToBottom();
  },

  saveMessages(messages) {
    const allMessages = wx.getStorageSync('messages') || {};
    allMessages[this.data.matchId] = messages;
    wx.setStorageSync('messages', allMessages);
  },

  updateMatchAfterMessage(content, createdAt) {
    const matches = wx.getStorageSync('matches') || [];
    const nextMatches = matches.map(item => item.matchId === this.data.matchId ? {
      ...item,
      lastMessage: content,
      lastMessageTime: createdAt,
      read: true
    } : item);
    wx.setStorageSync('matches', nextMatches);
  },

  scrollToBottom() {
    setTimeout(() => this.setData({ scrollToView: `msg-${this.data.messages.length - 1}` }), 100);
  },

  setSafetyCode() {
    wx.showModal({
      title: '🔐 设置安全暗号',
      content: '请输入一个见面时确认身份的暗号',
      editable: true,
      placeholderText: '例如：土豆真好吃',
      success: res => {
        if (res.confirm) {
          this.setData({ safetyCodeSet: true });
          this.persistSafetyCodeSet();
          wx.showToast({ title: '设置成功', icon: 'success' });
        }
      }
    });
  },

  persistSafetyCodeSet() {
    const matches = wx.getStorageSync('matches') || [];
    const nextMatches = matches.map(item => item.matchId === this.data.matchId ? {
      ...item,
      safetyCodeSet: true
    } : item);
    wx.setStorageSync('matches', nextMatches);
  },

  onReport() {
    wx.showActionSheet({
      itemList: ['骚扰/不文明', '虚假信息', '索要金钱', '其他违规'],
      success: () => wx.showToast({ title: '举报已提交', icon: 'success' })
    });
  },

  goBack() {
    wx.navigateBack();
  },

  showMore() {
    wx.showActionSheet({
      itemList: ['查看资料', '取消配对', '加入黑名单', '删除对话'],
      success: res => {
        if (res.tapIndex === 0) this.openMatchProfile();
        if (res.tapIndex === 1) this.cancelMatch();
        if (res.tapIndex === 2) wx.showToast({ title: '已加入黑名单', icon: 'success' });
        if (res.tapIndex === 3) this.deleteConversationOnly();
      }
    });
  },

  openMatchProfile() {
    const userId = this.data.matchUser.userId;
    if (userId) wx.navigateTo({ url: `/pages/profile/detail/detail?userId=${userId}` });
  },

  cancelMatch() {
    wx.showModal({
      title: '取消配对',
      content: '取消后将删除这段匹配和聊天记录，确认继续吗？',
      confirmText: '取消配对',
      confirmColor: '#FF5252',
      success: res => {
        if (!res.confirm) return;
        const matches = wx.getStorageSync('matches') || [];
        wx.setStorageSync('matches', matches.filter(item => item.matchId !== this.data.matchId));
        const allMessages = wx.getStorageSync('messages') || {};
        delete allMessages[this.data.matchId];
        wx.setStorageSync('messages', allMessages);
        wx.showToast({ title: '已取消配对', icon: 'success' });
        setTimeout(() => wx.switchTab({ url: '/pages/chat/list/list' }), 600);
      }
    });
  },

  deleteConversationOnly() {
    const allMessages = wx.getStorageSync('messages') || {};
    allMessages[this.data.matchId] = [];
    wx.setStorageSync('messages', allMessages);
    this.setData({ messages: [] });
  }
});
