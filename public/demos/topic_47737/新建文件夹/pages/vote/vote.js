// pages/vote/vote.js
const app = getApp();

Page({
  data: {
    plan: null,
    voters: [],
    options: [],
    selectedOption: null,
    votedCount: 0,
    votePercent: 0
  },

  onLoad(options) {
    const id = parseInt(options.id);
    const plan = app.globalData.currentPlan || 
                 app.globalData.mockPlans.find(p => p.id === id);
    
    if (plan) {
      const allPlans = app.globalData.mockPlans;
      const otherPlans = allPlans.filter(p => p.id !== id).slice(0, 2);
      const options = [
        { ...plan, votes: 2 },
        ...otherPlans.map((p, i) => ({ ...p, votes: i === 0 ? 1 : 0 }))
      ];

      const voters = [
        { id: 1, name: '我', color: '#FF6B6B', voted: true },
        { id: 2, name: '小明', color: '#4D96FF', voted: true },
        { id: 3, name: '小红', color: '#FFB84D', voted: false },
        { id: 4, name: '小李', color: '#6BCB77', voted: false }
      ];

      this.setData({
        plan,
        options,
        voters,
        votedCount: voters.filter(v => v.voted).length,
        votePercent: Math.round(voters.filter(v => v.voted).length / voters.length * 100)
      });
    }
  },

  addVoter() {
    wx.showModal({
      title: '添加参与者',
      editable: true,
      placeholderText: '请输入好友昵称',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm && res.content) {
          const colors = ['#FF6B6B', '#4D96FF', '#FFB84D', '#6BCB77', '#9D4EDD', '#FF8FAB'];
          const newVoter = {
            id: Date.now(),
            name: res.content,
            color: colors[this.data.voters.length % colors.length],
            voted: false
          };
          const voters = [...this.data.voters, newVoter];
          this.setData({
            voters,
            votedCount: voters.filter(v => v.voted).length,
            votePercent: Math.round(voters.filter(v => v.voted).length / voters.length * 100)
          });
          wx.showToast({ title: '添加成功', icon: 'success' });
        }
      }
    });
  },

  simulateVote(e) {
    const id = e.currentTarget.dataset.id;
    const voters = this.data.voters.map(v => 
      v.id === id ? { ...v, voted: true } : v
    );
    
    const options = this.data.options.map((opt, idx) => ({
      ...opt,
      votes: idx === 0 ? opt.votes + 1 : opt.votes
    }));

    this.setData({
      voters,
      options,
      votedCount: voters.filter(v => v.voted).length,
      votePercent: Math.round(voters.filter(v => v.voted).length / voters.length * 100)
    });

    wx.showToast({ title: '投票完成', icon: 'success' });
  },

  selectOption(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedOption: this.data.selectedOption === id ? null : id
    });
  },

  submitVote() {
    if (!this.data.selectedOption) {
      wx.showToast({ title: '请选择一个方案', icon: 'none' });
      return;
    }

    const options = this.data.options.map(opt => 
      opt.id === this.data.selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
    );

    this.setData({ options });

    wx.showModal({
      title: '投票成功',
      content: '感谢您的投票！分享给好友让更多人参与吧~',
      confirmText: '去分享',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          this.onShareAppMessage();
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: `【投票】一起决定去哪玩吧！${this.data.plan.title}`,
      path: `/pages/vote/vote?id=${this.data.plan.id}`
    };
  }
});
