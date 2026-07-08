// pages/content/content.js
const api = require('../../utils/api');

Page({
  data: {
    content: null,
    loading: true,
  },

  onLoad(options) {
    if (options.id) this.loadContent(options.id);
  },

  async loadContent(id) {
    try {
      const content = await api.getContent(id);
      this.setData({ content, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },
});
