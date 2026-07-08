// 聊天总结卡详情页（点击时间线上"聊天总结"进入）
const { request } = require('../../utils/request');

Page({
  data: {
    summaryId: '',
    summary: null,
    messages: [],
    loading: true
  },

  onLoad(options) {
    this.setData({ summaryId: options.id || '' });
    this.loadSummary();
  },

  onPullDownRefresh() {
    this.loadSummary();
  },

  loadSummary() {
    this.setData({ loading: true });
    request('GET', `/api/chats/summaries/${this.data.summaryId}`)
      .then(data => {
        const s = data.summary;
        wx.setNavigationBarTitle({ title: `与${s.conversation_name} · ${s.period_label}` });
        this.setData({
          summary: s,
          messages: data.messages || [],
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      });
  },

  // 跳转到完整会话，并定位到该时期起始点
  goFullConversation() {
    const s = this.data.summary;
    if (!s) return;
    wx.navigateTo({
      url: `/pages/chat-detail/chat-detail?id=${s.conversation_id}&period_start=${encodeURIComponent(s.period_start)}&name=${encodeURIComponent(s.conversation_name)}`
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ urls: [url], current: url });
  },

  // 问 AI：关于这个会话的更多信息
  askAI() {
    if (!this.data.summary) return;
    wx.showModal({
      title: 'AI 记忆',
      content: this.data.summary.ai_summary.caption,
      showCancel: false,
      confirmText: '好的',
      confirmColor: '#7c5cfc'
    });
  }
});
