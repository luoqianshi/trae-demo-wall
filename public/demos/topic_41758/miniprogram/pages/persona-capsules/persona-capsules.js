Page({
  data: {
    capsules: [],
    totalCount: 0,
    myCount: 0,
    othersCount: 0,
    loading: true
  },

  onLoad() {
    this.loadMockData();
  },

  onPullDownRefresh() {
    this.loadMockData();
    wx.stopPullDownRefresh();
  },

  loadMockData() {
    const mockCapsules = [
      {
        id: 'capsule_001',
        avatar: '👦',
        name: '2024年的我',
        description: '记录2024年成长轨迹、工作点滴与生活感悟',
        tags: [
          { icon: '📷', label: '照片' },
          { icon: '📝', label: '朋友圈' },
          { icon: '💬', label: '聊天' }
        ],
        memoryCount: 128,
        createdAt: '2024-01-15'
      },
      {
        id: 'capsule_002',
        avatar: '👩',
        name: '大学室友小李',
        description: '大学四年一起疯一起闹的兄弟，记录我们的青春记忆',
        tags: [
          { icon: '📷', label: '照片' },
          { icon: '💬', label: '聊天' }
        ],
        memoryCount: 86,
        createdAt: '2023-09-10'
      },
      {
        id: 'capsule_003',
        avatar: '👴',
        name: '爷爷的故事',
        description: '收集爷爷讲过的故事、老照片和家族回忆',
        tags: [
          { icon: '📷', label: '照片' },
          { icon: '📝', label: '朋友圈' }
        ],
        memoryCount: 45,
        createdAt: '2024-03-22'
      },
      {
        id: 'capsule_004',
        avatar: '🐱',
        name: '我家毛孩子',
        description: '猫咪汤圆的成长日记，从接回家到现在的点点滴滴',
        tags: [
          { icon: '📷', label: '照片' },
          { icon: '📝', label: '朋友圈' },
          { icon: '💬', label: '聊天' }
        ],
        memoryCount: 203,
        createdAt: '2023-06-01'
      },
      {
        id: 'capsule_005',
        avatar: '👧',
        name: '初恋回忆',
        description: '那段青涩而美好的时光，值得被温柔珍藏',
        tags: [
          { icon: '📷', label: '照片' },
          { icon: '💬', label: '聊天' }
        ],
        memoryCount: 67,
        createdAt: '2023-11-11'
      }
    ];

    const myCount = mockCapsules.filter(c => c.name.includes('我') || c.name.includes('我家')).length;
    const othersCount = mockCapsules.length - myCount;

    this.setData({
      capsules: mockCapsules,
      totalCount: mockCapsules.length,
      myCount,
      othersCount,
      loading: false
    });
  },

  onCreateTap() {
    wx.navigateTo({
      url: '/pages/persona-capsule-create/persona-capsule-create'
    });
  },

  onCapsuleTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/persona-capsule-detail/persona-capsule-detail?id=${id}`
    });
  },

  onChatTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/persona-chat/persona-chat?capsuleId=${id}`
    });
  },

  onFutureMeTap() {
    wx.navigateTo({
      url: '/pages/persona-chat/persona-chat?mode=futureMe'
    });
  }
});
