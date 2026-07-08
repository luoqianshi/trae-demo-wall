Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '发现',
        iconPath: '/images/tab_fire.png',
        selectedIconPath: '/images/tab_fire_active.png'
      },
      {
        pagePath: '/pages/chat/list/list',
        text: '聊天',
        iconPath: '/images/tab_chat.png',
        selectedIconPath: '/images/tab_chat_active.png'
      },
      {
        pagePath: '/pages/me/index/index',
        text: '我的',
        iconPath: '/images/tab_me.png',
        selectedIconPath: '/images/tab_me_active.png'
      }
    ]
  },

  lifetimes: {
    attached() {
      this.syncSelected();
    }
  },

  pageLifetimes: {
    show() {
      this.syncSelected();
    }
  },

  methods: {
    syncSelected() {
      const pages = getCurrentPages();
      const route = pages.length ? `/${pages[pages.length - 1].route}` : '';
      const selected = this.data.list.findIndex(item => item.pagePath === route);
      if (selected >= 0) this.setData({ selected });
    },

    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      this.setData({ selected: index });
      wx.switchTab({ url: path });
    }
  }
});
