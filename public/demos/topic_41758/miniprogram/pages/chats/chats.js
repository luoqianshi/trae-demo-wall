// 聊天会话列表
const { request } = require('../../utils/request');

Page({
  data: {
    conversations: [],
    loading: true,
    total: 0
  },

  onShow() {
    this.loadConversations();
  },

  loadConversations() {
    this.setData({ loading: true });
    request('GET', '/api/chats/conversations')
      .then(data => {
        this.setData({
          conversations: data.items || [],
          total: data.total || 0,
          loading: false
        });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: '/pages/chat-detail/chat-detail?id=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(name || '')
    });
  },

  goImport() {
    wx.navigateTo({ url: '/pages/import-chats/import-chats' });
  }
});
