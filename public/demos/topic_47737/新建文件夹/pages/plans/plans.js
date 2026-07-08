// pages/plans/plans.js
const app = getApp();

Page({
  data: {
    loading: true,
    mood: '',
    moodInfo: {},
    peopleCount: 4,
    area: '',
    budget: 200,
    duration: '4小时',
    plans: []
  },

  onLoad(options) {
    const mood = options.mood || 'fun';
    const moods = app.globalData.moods;
    const moodInfo = moods.find(m => m.id === mood) || moods[0];
    
    this.setData({
      mood,
      moodInfo,
      peopleCount: parseInt(options.people) || 4,
      area: options.area || '全城',
      budget: parseInt(options.budget) || 200,
      duration: options.duration || '4小时'
    });

    this.generatePlans();
  },

  generatePlans() {
    this.setData({ loading: true });
    
    setTimeout(() => {
      const allPlans = app.globalData.mockPlans;
      const moodPlans = allPlans.filter(p => p.mood === this.data.mood);
      
      let plans = moodPlans.length > 0 ? moodPlans : allPlans.slice(0, 3);
      
      if (plans.length < 3) {
        const otherPlans = allPlans.filter(p => p.mood !== this.data.mood);
        plans = [...plans, ...otherPlans.slice(0, 3 - plans.length)];
      }

      plans = plans.map(plan => ({
        ...plan,
        budget: this.adjustBudget(plan.budget),
        liked: app.globalData.favorites.some(f => f.id === plan.id)
      }));

      plans.sort((a, b) => b.rating - a.rating);

      this.setData({
        loading: false,
        plans
      });
    }, 2000);
  },

  adjustBudget(baseBudget) {
    const targetBudget = this.data.budget;
    const ratio = targetBudget / 200;
    return Math.round(baseBudget * ratio / 10) * 10;
  },

  refreshPlans() {
    this.generatePlans();
    wx.showToast({ title: '正在刷新方案...', icon: 'loading' });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.plans.find(p => p.id === id);
    if (plan) {
      app.savePlan(plan);
      app.globalData.currentPlan = plan;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    }
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.plans.find(p => p.id === id);
    if (plan) {
      const isLiked = app.toggleFavorite(plan);
      const plans = this.data.plans.map(p => 
        p.id === id ? { ...p, liked: isLiked } : p
      );
      this.setData({ plans });
      wx.showToast({
        title: isLiked ? '已收藏' : '已取消收藏',
        icon: 'none'
      });
    }
  },

  startVote(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.plans.find(p => p.id === id);
    if (plan) {
      app.globalData.currentPlan = plan;
      wx.navigateTo({
        url: `/pages/vote/vote?id=${id}`
      });
    }
  }
});
