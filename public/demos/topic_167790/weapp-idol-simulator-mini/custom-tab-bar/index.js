// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    badge: '',
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/flip/flip',   text: '翻牌', icon: '💌', badge: '' },
      { pagePath: '/pages/room/room',   text: '房间', icon: '💬' },
      { pagePath: '/pages/me/me',       text: '我的', icon: '👤' }
    ]
  },
  methods: {
    onTap(e) {
      const idx = e.currentTarget.dataset.index;
      const path = e.currentTarget.dataset.path;
      this.setData({ selected: idx });
      wx.switchTab({ url: path });
    },
    updateBadge(badge) {
      const list = this.data.list.slice();
      list[1].badge = badge || '';
      this.setData({ list });
    }
  }
});
