// pages/budget/budget.js
const app = getApp();

Page({
  data: {
    plan: null,
    peopleCount: 4,
    totalBudget: 0,
    perPerson: 0,
    people: [],
    splitType: 'equal',
    transfers: []
  },

  onLoad(options) {
    const id = parseInt(options.id);
    const plan = app.globalData.currentPlan || 
                 app.globalData.mockPlans.find(p => p.id === id);
    
    if (plan) {
      const peopleCount = 4;
      const totalBudget = plan.budget * peopleCount;
      const perPerson = plan.budget;
      
      const people = [
        { id: 1, name: '我', color: '#FF6B6B', payer: true, amount: perPerson },
        { id: 2, name: '小明', color: '#4D96FF', payer: false, amount: perPerson },
        { id: 3, name: '小红', color: '#FFB84D', payer: false, amount: perPerson },
        { id: 4, name: '小李', color: '#6BCB77', payer: false, amount: perPerson }
      ];

      const transfers = [
        { id: 1, from: '小明', to: '我', amount: perPerson },
        { id: 2, from: '小红', to: '我', amount: perPerson },
        { id: 3, from: '小李', to: '我', amount: perPerson }
      ];

      this.setData({
        plan,
        peopleCount,
        totalBudget,
        perPerson,
        people,
        transfers
      });
    }
  },

  addPerson() {
    wx.showModal({
      title: '添加成员',
      editable: true,
      placeholderText: '请输入成员昵称',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm && res.content) {
          const colors = ['#FF6B6B', '#4D96FF', '#FFB84D', '#6BCB77', '#9D4EDD', '#FF8FAB'];
          const newPerson = {
            id: Date.now(),
            name: res.content,
            color: colors[this.data.people.length % colors.length],
            payer: false,
            amount: this.data.perPerson
          };
          
          const people = [...this.data.people, newPerson];
          const peopleCount = people.length;
          const totalBudget = this.data.plan.budget * peopleCount;
          
          this.recalculateSplit(people, peopleCount, totalBudget);
        }
      }
    });
  },

  togglePayer(e) {
    const id = e.currentTarget.dataset.id;
    const people = this.data.people.map(p => ({
      ...p,
      payer: p.id === id
    }));
    
    this.setData({ people });
    this.calculateTransfers(people);
  },

  selectSplitType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ splitType: type });
    
    const { people, plan } = this.data;
    const peopleCount = people.length;
    const totalBudget = plan.budget * peopleCount;
    
    this.recalculateSplit(people, peopleCount, totalBudget);
  },

  recalculateSplit(people, peopleCount, totalBudget) {
    const perPerson = Math.round(totalBudget / peopleCount);
    
    let updatedPeople;
    
    if (this.data.splitType === 'equal') {
      updatedPeople = people.map(p => ({ ...p, amount: perPerson }));
    } else if (this.data.splitType === 'payer') {
      updatedPeople = people.map(p => ({
        ...p,
        amount: p.payer ? totalBudget : 0
      }));
    } else {
      updatedPeople = people.map(p => ({ ...p, amount: perPerson }));
    }
    
    this.setData({
      peopleCount,
      totalBudget,
      perPerson,
      people: updatedPeople
    });
    
    this.calculateTransfers(updatedPeople);
  },

  calculateTransfers(people) {
    const payer = people.find(p => p.payer);
    if (!payer) return;
    
    const transfers = people
      .filter(p => !p.payer && p.amount > 0)
      .map((p, idx) => ({
        id: idx + 1,
        from: p.name,
        to: payer.name,
        amount: p.amount
      }));
    
    this.setData({ transfers });
  },

  shareSettle() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },

  copyBill() {
    const { plan, people, totalBudget, perPerson } = this.data;
    let text = `【${plan.title}】账单明细\n\n`;
    text += `总预算：¥${totalBudget}（共${people.length}人）\n`;
    text += `人均：¥${perPerson}\n\n`;
    text += `费用明细：\n`;
    plan.schedule.forEach(item => {
      text += `• ${item.activity}：¥${item.cost}/人\n`;
    });
    text += `\n成员分摊：\n`;
    people.forEach(p => {
      text += `• ${p.name}：¥${p.amount}${p.payer ? '（付款人）' : ''}\n`;
    });
    
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制账单',
          icon: 'success'
        });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: `【账单】${this.data.plan.title} 费用分摊`,
      path: `/pages/budget/budget?id=${this.data.plan.id}`
    };
  }
});
