Page({
  data: {
    statusBarHeight: 44,
    activeTag: 'distance',
    venues: [
      {
        id: 1,
        name: '海底捞火锅（朝阳门店）',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        stars: 5,
        distance: '1.2km',
        tags: ['包间', '24小时', '可预约'],
        match: 96,
        selected: false
      },
      {
        id: 2,
        name: '很久以前羊肉串',
        image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
        stars: 4,
        distance: '2.5km',
        tags: ['露天', '排队少', '氛围好'],
        match: 88,
        selected: false
      },
      {
        id: 3,
        name: '湊湊火锅·茶憩',
        image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
        stars: 5,
        distance: '3.0km',
        tags: ['奶茶', '景观位', '商务'],
        match: 82,
        selected: false
      },
      {
        id: 4,
        name: '木屋烧烤',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
        stars: 4,
        distance: '1.8km',
        tags: ['人均低', '上菜快', '聚餐'],
        match: 78,
        selected: false
      }
    ],
    selectedCount: 0
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onReady() {
  },

  onShow() {
  },

  onHide() {
  },

  onUnload() {
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  switchTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      activeTag: tag
    });
    wx.showToast({
      title: '已切换：' + this.getTagName(tag),
      icon: 'none'
    });
  },

  getTagName(tag) {
    const map = {
      distance: '距离最近',
      budget: '预算匹配',
      vibe: '氛围契合',
      traffic: '交通便利',
      facility: '设施完善'
    };
    return map[tag] || tag;
  },

  selectVenue(e) {
    const id = e.currentTarget.dataset.id;
    const venues = this.data.venues.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    const selectedCount = venues.filter(item => item.selected).length;
    this.setData({
      venues,
      selectedCount
    });
  },

  confirmVote() {
    if (this.data.selectedCount === 0) {
      wx.showToast({
        title: '请至少选择一个场地',
        icon: 'none'
      });
      return;
    }
    wx.showModal({
      title: '发起投票',
      content: `已选择 ${this.data.selectedCount} 个候选地，确认发起投票？`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '投票已发起',
            icon: 'success'
          });
        }
      }
    });
  },

  smartReorder() {
    wx.showToast({
      title: '智能重排中...',
      icon: 'loading',
      duration: 1000
    });
    setTimeout(() => {
      const shuffled = [...this.data.venues].sort(() => Math.random() - 0.5);
      this.setData({
        venues: shuffled
      });
      wx.showToast({
        title: '已智能重排',
        icon: 'success'
      });
    }, 1000);
  }
});
