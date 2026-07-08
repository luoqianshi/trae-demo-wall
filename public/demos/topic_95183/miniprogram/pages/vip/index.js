const app = getApp();

Page({
  data: {
    selectedPlan: 'quarterly',
    selectedPrice: 98,
    trialUsed: true,
    planPrices: { monthly: 38, quarterly: 98, yearly: 298 }
  },

  onLoad() {
    const user = app.globalData.currentUser;
    if (user) this.setData({ trialUsed: user.trialUsed });
  },

  selectPlan(e) {
    const plan = e.currentTarget.dataset.plan;
    this.setData({ selectedPlan: plan, selectedPrice: this.data.planPrices[plan] });
  },

  startTrial() {
    const user = app.globalData.currentUser;
    if (!user) return;
    wx.showModal({
      title: '领取3天免费体验',
      content: '体验期可查看谁给我投了土豆。确认领取？',
      confirmText: '立即领取',
      success: res => {
        if (!res.confirm) return;
        user.trialUsed = true;
        user.memberType = 'monthly';
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 3);
        user.memberExpireAt = expireDate.toISOString();
        app.globalData.currentUser = user;
        wx.setStorageSync('userInfo', user);
        this.setData({ trialUsed: true });
        wx.showToast({ title: '领取成功', icon: 'success' });
      }
    });
  },

  pay() {
    const plan = this.data.selectedPlan;
    const user = app.globalData.currentUser;
    if (!user) return;
    wx.showModal({
      title: '确认支付',
      content: `支付 ¥${this.data.selectedPrice} 开通会员`,
      confirmText: '确认支付',
      success: res => {
        if (!res.confirm) return;
        user.memberType = plan;
        const expireDate = new Date();
        if (plan === 'monthly') expireDate.setMonth(expireDate.getMonth() + 1);
        else if (plan === 'quarterly') expireDate.setMonth(expireDate.getMonth() + 3);
        else expireDate.setFullYear(expireDate.getFullYear() + 1);
        user.memberExpireAt = expireDate.toISOString();
        app.globalData.currentUser = user;
        wx.setStorageSync('userInfo', user);
        wx.showToast({ title: '开通成功', icon: 'success' });
      }
    });
  }
});
