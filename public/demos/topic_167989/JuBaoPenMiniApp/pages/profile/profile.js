Page({
  data: {
    profile: { avatar: '👤', name: '省钱小达人', id: 'ID: JBP20260101' },
    stats: { saved: '¥286', coupons: 52, checkin: 15 },
    menuGroups: [
      {
        title: '省钱工具',
        items: [
          { icon: '⭐', text: '我的关注', bg: 'bg-purple', url: '/pages/subscribe/subscribe' },
          { icon: '📊', text: '省钱账本', bg: 'bg-green', url: '' },
          { icon: '🏆', text: '成就徽章', bg: 'bg-orange', url: '' }
        ]
      },
      {
        title: '设置',
        items: [
          { icon: '🔔', text: '推送设置', bg: 'bg-blue', url: '' },
          { icon: '❤️', text: '邀请好友', bg: 'bg-pink', url: '' },
          { icon: '❓', text: '帮助与反馈', bg: 'bg-red', url: '' }
        ]
      }
    ]
  },

  onLoad() {
  },

  onTapMenuItem(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  }
});
