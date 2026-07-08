// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    plan: null
  },

  onLoad(options) {
    const id = parseInt(options.id);
    const plan = app.globalData.currentPlan || 
                 app.globalData.mockPlans.find(p => p.id === id);
    
    if (plan) {
      const liked = app.globalData.favorites.some(f => f.id === plan.id);
      this.setData({
        plan: { ...plan, liked }
      });
      app.savePlan(plan);
    }
  },

  navigateTo(e) {
    const index = e.currentTarget.dataset.index;
    const place = this.data.plan.schedule[index];
    wx.showToast({
      title: `正在导航到${place.place}`,
      icon: 'none'
    });
  },

  reserve(e) {
    const index = e.currentTarget.dataset.index;
    const place = this.data.plan.schedule[index];
    wx.showModal({
      title: '预约确认',
      content: `是否预约「${place.place}」？\n${place.activity} - ${place.time}`,
      confirmText: '确认预约',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '预约成功！',
            icon: 'success'
          });
        }
      }
    });
  },

  toggleLike() {
    const plan = this.data.plan;
    const isLiked = app.toggleFavorite(plan);
    this.setData({
      'plan.liked': isLiked
    });
    wx.showToast({
      title: isLiked ? '已收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  sharePlan() {
    wx.showModal({
      title: '分享方案',
      content: '是否复制方案链接分享给好友？',
      confirmText: '复制链接',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: `【心情派对规划师】${this.data.plan.title}，人均¥${this.data.plan.budget}，快来看看吧！`,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  goVote() {
    wx.navigateTo({
      url: `/pages/vote/vote?id=${this.data.plan.id}`
    });
  },

  goBudget() {
    wx.navigateTo({
      url: `/pages/budget/budget?id=${this.data.plan.id}`
    });
  },

  onShareAppMessage() {
    return {
      title: `【心情派对规划师】${this.data.plan.title}`,
      path: `/pages/detail/detail?id=${this.data.plan.id}`
    };
  }
});
