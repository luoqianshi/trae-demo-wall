// pages/persona-capsule-detail/persona-capsule-detail.js
Page({
  data: {
    loading: true,
    capsule: null,
    activeTab: 'photos',
    tabs: [
      { key: 'photos', label: '照片', icon: '📷' },
      { key: 'moments', label: '朋友圈', icon: '📝' },
      { key: 'chats', label: '聊天记录', icon: '💬' },
      { key: 'bottles', label: '漂流瓶', icon: '🍾' }
    ],
    photoCount: 0,
    momentsCount: 0,
    chatsCount: 0,
    bottlesCount: 0,
    memoryCount: 0
  },

  onLoad: function(options) {
    this.capsuleId = options.id || 'demo_persona_1';
    this.loadDetail();
  },

  onShareAppMessage: function() {
    var c = this.data.capsule;
    return {
      title: (c && c.name) || '我的人设胶囊',
      path: '/pages/persona-capsule-detail/persona-capsule-detail?id=' + this.capsuleId
    };
  },

  loadDetail: function() {
    var that = this;
    setTimeout(function() {
      var mock = that.getMockCapsule(that.capsuleId);
      var formatted = that.formatCapsule(mock);
      that.setData({
        capsule: formatted,
        loading: false,
        photoCount: formatted.photos.length,
        momentsCount: formatted.moments.length,
        chatsCount: formatted.chats.length,
        bottlesCount: formatted.bottles.length,
        memoryCount: formatted.photos.length + formatted.moments.length + formatted.chats.length + formatted.bottles.length
      });
    }, 400);
  },

  formatCapsule: function(c) {
    var photos = (c.photos || []).map(function(p, idx) {
      return {
        id: p.id || ('p_' + idx),
        url: p.url || '',
        desc: p.desc || ''
      };
    });

    var moments = (c.moments || []).map(function(m, idx) {
      return {
        id: m.id || ('m_' + idx),
        content: m.content || '',
        date: m.date || '',
        likes: m.likes || 0
      };
    });

    var chats = (c.chats || []).map(function(ch, idx) {
      return {
        id: ch.id || ('ch_' + idx),
        title: ch.title || '聊天记录',
        summary: ch.summary || '',
        date: ch.date || '',
        msgCount: ch.msgCount || 0
      };
    });

    var bottles = (c.bottles || []).map(function(b, idx) {
      return {
        id: b.id || ('b_' + idx),
        title: b.title || '漂流瓶',
        content: b.content || '',
        date: b.date || ''
      };
    });

    return {
      id: c.id || this.capsuleId,
      name: c.name || '未命名胶囊',
      avatar: c.avatar || '🧑',
      description: c.description || '',
      createdAt: c.createdAt || '',
      aiSummary: c.aiSummary || '',
      traits: c.traits || [],
      photos: photos,
      moments: moments,
      chats: chats,
      bottles: bottles
    };
  },

  switchTab: function(e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key });
  },

  startChat: function() {
    wx.navigateTo({
      url: '/pages/persona-chat/persona-chat?capsuleId=' + this.capsuleId
    });
  },

  editCapsule: function() {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' });
  },

  deleteCapsule: function() {
    var that = this;
    wx.showModal({
      title: '删除胶囊',
      content: '确认要删除这个人设胶囊吗？删除后无法恢复。',
      confirmColor: '#f472b6',
      success: function(res) {
        if (!res.confirm) return;
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(function() { wx.navigateBack(); }, 700);
      }
    });
  },

  previewPhoto: function(e) {
    var url = e.currentTarget.dataset.url;
    if (!url) return;
    var urls = (this.data.capsule.photos || []).map(function(p) { return p.url; });
    wx.previewImage({ current: url, urls: urls });
  },

  goBack: function() {
    wx.navigateBack();
  },

  getMockCapsule: function(id) {
    var map = {
      'capsule_001': {
        id: 'capsule_001',
        name: '2024年的我',
        avatar: '👦',
        description: '记录2024年成长轨迹、工作点滴与生活感悟',
        createdAt: '2024-01-15',
        aiSummary: '这是一个积极向上、不断成长的人。记录了过去一年的工作成就、学习进步和生活感悟，展现出对生活的热爱和对未来的期待。',
        traits: ['积极向上', '热爱学习', '工作认真', '生活感悟', '成长型思维', '乐观开朗'],
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', desc: '川西·雪山日出' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=400&fit=crop', desc: '瑞士·湖光山色' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=400&fit=crop', desc: '京都·红叶季' },
          { id: 'p4', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop', desc: '新疆·草原公路' }
        ],
        moments: [
          { id: 'm1', content: '终于完成了今年的第一个大项目，团队配合非常默契，感谢每一位伙伴的付出！', date: '2024-03-15', likes: 86 },
          { id: 'm2', content: '今天学会了做红烧排骨，虽然糖色炒得有点焦，但爸妈说很好吃。家的味道，大概就是如此吧。', date: '2024-05-20', likes: 64 },
          { id: 'm3', content: '深夜加班后走在回家的路上，抬头看到满天繁星。城市里的星星很少，但今晚它们特别亮。', date: '2024-08-12', likes: 45 }
        ],
        chats: [
          { id: 'ch1', title: '与阿杰的深夜长谈', summary: '聊了各自的工作压力和对未来的规划，互相鼓励要坚持初心。', date: '2024-11-20', msgCount: 86 },
          { id: 'ch2', title: '家庭群·春节计划', summary: '讨论春节回家安排，爸妈准备了好多好吃的，期待团圆。', date: '2024-12-15', msgCount: 42 }
        ],
        bottles: [
          { id: 'b1', title: '给五年后的自己', content: '希望你依然保持对世界的好奇，依然愿意为了看一场日出而早起。', date: '2024-12-31' }
        ]
      },
      'capsule_002': {
        id: 'capsule_002',
        name: '大学室友小李',
        avatar: '👩',
        description: '大学四年一起疯一起闹的兄弟，记录我们的青春记忆',
        createdAt: '2023-09-10',
        aiSummary: '这是一个重情重义、珍惜友谊的人。记录了与大学室友小李四年的点点滴滴，从一起上课到深夜畅谈，展现出对青春岁月和真挚友情的珍视。',
        traits: ['重情重义', '珍惜友谊', '青春热血', '回忆收藏', '真诚待人', '乐观开朗'],
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=400&fit=crop', desc: '毕业典礼合影' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=400&fit=crop', desc: '宿舍深夜泡面' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=400&fit=crop', desc: '图书馆自习' }
        ],
        moments: [
          { id: 'm1', content: '和小李在操场聊到凌晨三点，从人生理想到喜欢的女孩，这就是青春吧。', date: '2023-06-15', likes: 128 },
          { id: 'm2', content: '期末考试前一夜，两个人在宿舍互相提问，结果都睡着了。', date: '2023-01-05', likes: 96 }
        ],
        chats: [
          { id: 'ch1', title: '毕业后的约定', summary: '约定每年至少聚一次，不管多忙都要见面。', date: '2023-06-20', msgCount: 156 },
          { id: 'ch2', title: '找工作互相打气', summary: '毕业季一起投简历、面试，互相分享经验和鼓励。', date: '2023-03-10', msgCount: 203 }
        ],
        bottles: [
          { id: 'b1', title: '十年后的小李', content: '希望十年后我们还能像现在这样无话不谈。', date: '2023-06-18' }
        ]
      },
      'capsule_003': {
        id: 'capsule_003',
        name: '爷爷的故事',
        avatar: '👴',
        description: '收集爷爷讲过的故事、老照片和家族回忆',
        createdAt: '2024-03-22',
        aiSummary: '这是一个心怀感恩、珍视亲情的人。记录了爷爷讲述的家族故事、珍藏的老照片和温暖的相处时光，展现出对长辈的敬爱和对家族历史的珍视。',
        traits: ['心怀感恩', '珍视亲情', '家族传承', '故事收藏', '温暖细腻', '敬老爱幼'],
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', desc: '爷爷年轻时的照片' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1513159446162-54eb8bdaa79b?w=400&h=400&fit=crop', desc: '老家院子' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop', desc: '全家福' }
        ],
        moments: [
          { id: 'm1', content: '爷爷今天讲了当年当兵的故事，虽然听过很多遍，但每次都有新的细节。', date: '2024-04-10', likes: 86 },
          { id: 'm2', content: '翻出了爷爷年轻时的照片，原来爷爷也曾是个帅小伙。', date: '2024-05-15', likes: 64 }
        ],
        chats: [
          { id: 'ch1', title: '家族群·春节团圆', summary: '讨论春节回家安排，爷爷说准备了好多好吃的。', date: '2024-02-01', msgCount: 56 }
        ],
        bottles: [
          { id: 'b1', title: '给爷爷的一封信', content: '谢谢您一直以来的关爱和教导，我会好好珍藏这些故事。', date: '2024-03-22' }
        ]
      },
      'capsule_004': {
        id: 'capsule_004',
        name: '我家毛孩子',
        avatar: '🐱',
        description: '猫咪汤圆的成长日记，从接回家到现在的点点滴滴',
        createdAt: '2023-06-01',
        aiSummary: '这是一个温柔细腻、充满爱心的人。记录了猫咪汤圆从接回家到现在的成长点滴，展现出对宠物的深厚感情和生活中的小确幸。',
        traits: ['温柔细腻', '充满爱心', '宠物达人', '生活记录', '耐心细致', '治愈系'],
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop', desc: '汤圆第一天到家' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop', desc: '晒太阳的汤圆' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop', desc: '调皮捣蛋' }
        ],
        moments: [
          { id: 'm1', content: '汤圆今天学会了开门，智商堪忧但又觉得好聪明。', date: '2023-08-15', likes: 128 },
          { id: 'm2', content: '加班回家看到汤圆在门口等我，一天的疲惫都消失了。', date: '2023-10-20', likes: 96 }
        ],
        chats: [
          { id: 'ch1', title: '宠物群·养猫经验', summary: '分享了汤圆的日常，群友推荐了几款不错的猫粮。', date: '2023-07-10', msgCount: 45 }
        ],
        bottles: [
          { id: 'b1', title: '汤圆的五岁生日', content: '希望汤圆永远健康快乐，陪我走过更多岁月。', date: '2023-06-01' }
        ]
      },
      'capsule_005': {
        id: 'capsule_005',
        name: '初恋回忆',
        avatar: '👧',
        description: '那段青涩而美好的时光，值得被温柔珍藏',
        createdAt: '2023-11-11',
        aiSummary: '这是一个温柔细腻、懂得感恩的人。记录了那段青涩而美好的初恋时光，展现出对过去感情的温柔珍藏和对成长的深刻理解。',
        traits: ['温柔细腻', '懂得感恩', '珍藏回忆', '情感丰富', '成熟理性', '珍惜当下'],
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=400&fit=crop', desc: '第一次约会的地方' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop', desc: '一起看日落' }
        ],
        moments: [
          { id: 'm1', content: '今天是我们相识一周年，虽然最后没有走到一起，但感谢这段经历让我成长。', date: '2023-11-11', likes: 86 }
        ],
        chats: [
          { id: 'ch1', title: '最后的对话', summary: '和平分手后的最后一次聊天，互相祝福未来。', date: '2023-12-01', msgCount: 32 }
        ],
        bottles: [
          { id: 'b1', title: '给未来的自己', content: '无论未来如何，都要相信爱情，相信自己值得被爱。', date: '2023-11-11' }
        ]
      }
    };

    return map[id] || map['capsule_001'];
  }
});
