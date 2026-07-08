// 聊天详情页 - 支持从聊天总结卡跳转并定位到指定日期
const { request } = require('../../utils/request');

Page({
  data: {
    conversation: null,
    messages: [],
    loading: true,
    showSummary: true,
    dialogInput: '',
    aiAnswer: '',
    aiThinking: false,
    periodStart: '',
    anchorMsgId: '',
    hasAnchor: false
  },

  onLoad(options) {
    const id = options.id || '';
    const name = decodeURIComponent(options.name || '对话');
    const periodStart = options.period_start ? decodeURIComponent(options.period_start) : '';
    wx.setNavigationBarTitle({ title: name });
    this.setData({ periodStart });
    this.loadConversation(id);
  },

  toggleSummary() {
    this.setData({ showSummary: !this.data.showSummary });
  },

  loadConversation(id) {
    this.setData({ loading: true });
    request('GET', '/api/chats/conversations/' + id)
      .then(data => {
        // 消息按时间倒序（最新在前），我们需要从旧到新展示
        // 实际上 mock 中 messages 就是按时间顺序的（old→new）
        // 这里直接取
        const ordered = data.messages || [];

        // 插入日期分隔符
        const withDates = [];
        let currentDate = '';
        let anchorMsgId = '';
        const anchorTs = this.data.periodStart ? new Date(this.data.periodStart).getTime() : 0;
        let anchorFound = false;

        ordered.forEach((msg, idx) => {
          const datePart = (msg.timestamp_text || '').split(' ')[0];
          if (datePart !== currentDate) {
            currentDate = datePart;
            withDates.push({ type: 'date', text: datePart, _id: 'date_' + idx });
          }
          const msgId = 'msg_' + idx;
          const isAnchor = anchorTs > 0 && !anchorFound && (new Date(msg.timestamp).getTime() >= anchorTs);
          if (isAnchor) {
            anchorFound = true;
            anchorMsgId = msgId;
            // 在锚点位置前面加一个提示条
            withDates.push({ type: 'anchor_marker', text: '← 你点击的时段从这里开始', _id: 'anchor_' + idx });
          }
          withDates.push({
            ...msg,
            _id: msgId,
            type: msg.content_type === 'image' ? 'image_msg' : 'text_msg'
          });
        });

        this.setData({
          conversation: data.conversation,
          messages: withDates,
          hasAnchor: anchorFound && anchorTs > 0,
          anchorMsgId,
          loading: false
        });

        // 如果有 period_start，滚动到锚点；否则滚到底部看最新
        wx.nextTick(() => {
          if (anchorMsgId) {
            setTimeout(() => this.scrollToAnchor(anchorMsgId), 200);
          } else {
            this.scrollToBottom();
          }
        });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  scrollToAnchor(id) {
    const query = wx.createSelectorQuery();
    query.select('#' + id).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(res => {
      if (res && res[0] && res[1]) {
        wx.pageScrollTo({
          scrollTop: res[0].top + (res[1].scrollTop || 0) - 40,
          duration: 500
        });
        wx.showToast({ title: '已定位到所选时段', icon: 'none', duration: 1500 });
      }
    });
  },

  scrollToBottom() {
    const query = wx.createSelectorQuery();
    query.select('#chat-end').boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(res => {
      if (res && res[1] && res[0]) {
        wx.pageScrollTo({
          scrollTop: res[0].top + (res[1].scrollTop || 0),
          duration: 200
        });
      }
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ urls: [url], current: url });
  },

  onDialogInput(e) {
    this.setData({ dialogInput: e.detail.value });
  },

  askAI() {
    const q = (this.data.dialogInput || '').trim();
    if (!q) {
      wx.showToast({ title: '请输入问题', icon: 'none' });
      return;
    }
    this.setData({ aiThinking: true, aiAnswer: '' });
    request('POST', '/api/dialog', { query: q })
      .then(data => {
        this.setData({
          aiAnswer: data.answer || '没有找到相关的记忆内容。',
          aiThinking: false
        });
      })
      .catch(() => {
        this.setData({ aiThinking: false, aiAnswer: 'AI 有点累，请稍后再试。' });
      });
  }
});
