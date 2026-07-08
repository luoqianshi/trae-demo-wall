// pages/persona-chat/persona-chat.js
// AI 人设聊天页 — 基于记忆胶囊模拟特定人格对话

Page({
  data: {
    capsuleId: '',
    capsule: null,
    persona: null,
    messages: [],
    inputValue: '',
    sending: false,
    typing: false,
    loading: true,
    scrollToId: '',
    showModal: false,
    suggestions: [
      '最近过得怎么样？',
      '还记得那次旅行吗？',
      '你最喜欢的电影是什么？',
      '给我讲个笑话吧',
      '最近在读什么书？'
    ]
  },

  onLoad: function(options) {
    var capsuleId = options.capsuleId || '';
    var mode = options.mode || '';
    this.setData({ capsuleId: capsuleId, mode: mode });

    if (mode === 'futureMe') {
      this.loadFutureMe();
    } else {
      this.loadCapsule(capsuleId);
    }
  },

  onReady: function() {
    this.scrollToBottom();
  },

  // ---------- 数据加载 ----------

  loadCapsule: function(capsuleId) {
    var that = this;

    // 模拟从服务端/本地加载胶囊数据
    setTimeout(function() {
      var capsule = that.getMockCapsule(capsuleId);
      if (capsule) {
        var persona = capsule.persona;
        var greeting = that.generateGreeting(persona);
        var now = that.formatTime(new Date());

        that.setData({
          capsule: capsule,
          persona: persona,
          loading: false,
          messages: [
            { id: 'time_1', type: 'time', text: now },
            { id: 'msg_1', type: 'message', sender: 'ai', text: greeting }
          ]
        });
        that.scrollToBottom();
      } else {
        that.setData({ loading: false, capsule: null });
      }
    }, 600);
  },

  // ---------- 消息发送 ----------

  onInput: function(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage: function() {
    var text = (this.data.inputValue || '').trim();
    if (!text || this.data.sending || this.data.typing) return;

    var userMsg = {
      id: 'msg_' + Date.now(),
      type: 'message',
      sender: 'user',
      text: text
    };

    var messages = this.data.messages.concat(userMsg);
    this.setData({
      messages: messages,
      inputValue: '',
      sending: true
    });
    this.scrollToBottom();

    // 模拟 AI 打字
    var that = this;
    that.setData({ typing: true });
    that.scrollToBottom();

    var delay = 1000 + Math.random() * 1000;
    setTimeout(function() {
      var reply = that.generateReply(text, that.data.persona);
      var aiMsg = {
        id: 'msg_' + Date.now(),
        type: 'message',
        sender: 'ai',
        text: reply
      };
      that.setData({
        messages: that.data.messages.concat(aiMsg),
        typing: false,
        sending: false
      });
      that.scrollToBottom();
    }, delay);
  },

  sendSuggestion: function(e) {
    var text = e.currentTarget.dataset.text;
    this.setData({ inputValue: text });
    this.sendMessage();
  },

  // ---------- 滚动到底部 ----------

  scrollToBottom: function() {
    var that = this;
    setTimeout(function() {
      that.setData({ scrollToId: 'msg-bottom' });
    }, 100);
  },

  // ---------- 弹窗控制 ----------

  showCapsuleInfo: function() {
    this.setData({ showModal: true });
  },

  hideCapsuleInfo: function() {
    this.setData({ showModal: false });
  },

  preventBubble: function() {
    // 阻止事件冒泡，点击弹窗内容不关闭
  },

  // ---------- 回复生成逻辑 ----------

  generateGreeting: function(persona) {
    var greetings = [
      '嗨，好久不见！我是' + persona.name + '，今天想聊点什么？',
      '你好呀！' + persona.name + '在这里，最近有什么新鲜事吗？',
      '哈喽！我是' + persona.name + '，基于记忆胶囊和你聊天，想聊聊什么？',
      '嘿，终于等到你了！我是' + persona.name + '，今天心情不错，来聊聊天吧。'
    ];
    var idx = Math.floor(Math.random() * greetings.length);
    return greetings[idx];
  },

  generateReply: function(userText, persona) {
    var text = userText.toLowerCase();

    // 如果是「与未来的我」模式，使用专属回复逻辑
    if (this.data.mode === 'futureMe') {
      var replies = this.generateFutureMeReply(userText, persona);
      var idx = Math.floor(Math.random() * replies.length);
      return replies[idx];
    }

    var replies = [];

    if (text.indexOf('过得') !== -1 || text.indexOf('最近') !== -1 || text.indexOf('怎么样') !== -1) {
      replies = [
        '最近还不错，就是' + persona.hobbies[0] + '的时间少了点，你呢？',
        '哈哈，老样子吧，最近在忙' + persona.traits[0] + '的事，挺充实的。',
        '还行，就是偶尔想起以前的事，挺怀念的。你最近怎么样？'
      ];
    } else if (text.indexOf('旅行') !== -1 || text.indexOf('旅游') !== -1 || text.indexOf('去哪') !== -1) {
      replies = [
        '当然记得！那次去' + persona.memories[0].location + '的经历太难忘了，' + persona.memories[0].desc,
        '旅行啊... 我最喜欢' + persona.hobbies[1] + '了，上次去' + persona.memories[0].location + '的时候特别开心。',
        '说到旅行，我印象最深的就是' + persona.memories[0].location + '，那时候' + persona.memories[0].desc
      ];
    } else if (text.indexOf('电影') !== -1 || text.indexOf('片') !== -1) {
      replies = [
        '电影啊，我喜欢那种' + persona.traits[1] + '类型的，你有推荐吗？',
        '最近没怎么看电影，不过以前看过一部特别' + persona.traits[0] + '的，印象很深。'
      ];
    } else if (text.indexOf('笑话') !== -1 || text.indexOf('搞笑') !== -1 || text.indexOf('幽默') !== -1) {
      replies = [
        '哈哈，我的笑话库可能有点旧... 不过既然你喜欢' + persona.hobbies[0] + '，那应该能理解我的笑点吧？',
        '讲个笑话？让我想想... 一个' + persona.traits[0] + '的人走进酒吧... 算了，我编不下去了 😂'
      ];
    } else if (text.indexOf('书') !== -1 || text.indexOf('读') !== -1) {
      replies = [
        '读书是我的爱好之一，特别是关于' + persona.hobbies[1] + '的书，你呢？',
        '最近在重读一本老书，感觉每次读都有新收获。你也喜欢阅读吗？'
      ];
    } else if (text.indexOf('喜欢') !== -1 || text.indexOf('爱好') !== -1) {
      replies = [
        '我喜欢' + persona.hobbies.join('、') + '，这些都是我生活中很重要的部分。',
        '我的爱好挺多的，' + persona.hobbies[0] + '和' + persona.hobbies[1] + '是最喜欢的两个。'
      ];
    } else if (text.indexOf('性格') !== -1 || text.indexOf('人格') !== -1 || text.indexOf('特点') !== -1) {
      replies = [
        '朋友们都说我是个' + persona.traits.join('、') + '的人，你觉得呢？',
        '我觉得自己最' + persona.traits[0] + '了，有时候也会有点' + persona.traits[1] + '。'
      ];
    } else {
      replies = [
        '嗯，这个有意思。作为一个' + persona.traits[0] + '的人，我觉得' + persona.hobbies[0] + '能帮我更好地理解这些。',
        '哈哈，说到这个，我就想起以前在' + persona.memories[0].location + '的时候，' + persona.memories[0].desc,
        '这是个好问题。从我的角度来看，' + persona.traits[1] + '的性格让我对这事有特别的感受。',
        '哦？继续说，我在听呢。作为一个喜欢' + persona.hobbies[0] + '的人，我很感兴趣。',
        '嗯嗯，我懂你的意思。其实我也经常想这些，特别是在' + persona.memories[1].location + '的那段时间。'
      ];
    }

    var idx = Math.floor(Math.random() * replies.length);
    return replies[idx];
  },

  // ---------- 与未来的我对话 ----------

  loadFutureMe: function() {
    var that = this;

    // 模拟从今年的朋友圈、聊天、相册中提取记忆生成人设
    setTimeout(function() {
      var year = new Date().getFullYear();
      var persona = that.getFutureMePersona(year);
      var greeting = that.generateFutureMeGreeting(persona, year);
      var now = that.formatTime(new Date());

      that.setData({
        capsule: {
          id: 'future_me_' + year,
          title: year + '年的我',
          persona: persona,
          sources: persona.sources
        },
        persona: persona,
        loading: false,
        messages: [
          { id: 'time_1', type: 'time', text: now },
          { id: 'msg_1', type: 'message', sender: 'ai', text: greeting }
        ],
        suggestions: [
          '今年的我有什么变化？',
          '还记得年初的目标吗？',
          '今年最开心的事是什么？',
          '给明年的自己说句话',
          '今年的遗憾有哪些？'
        ]
      });
      that.scrollToBottom();
    }, 1200);
  },

  getFutureMePersona: function(year) {
    // 模拟从今年的朋友圈、聊天、相册中提取的数据
    return {
      name: year + '年的我',
      avatar: '🚀',
      year: year,
      hobbies: ['摄影', '旅行', '阅读', '健身'],
      traits: ['乐观', '坚持', '有点完美主义', '爱思考'],
      memories: [
        { location: '西藏', desc: '今年终于完成了西藏自驾，纳木错的星空让我热泪盈眶。' },
        { location: '公司', desc: '年初接了一个大项目，熬了三个月终于上线了，很有成就感。' },
        { location: '家里', desc: '养了一只叫汤圆的猫，每天回家都有个小家伙在等我。' }
      ],
      sources: [
        { type: 'moment', icon: '📝', name: '朋友圈', desc: '今年的心情与分享', count: 86 },
        { type: 'chat', icon: '💬', name: '聊天记录', desc: '与好友的对话', count: 2340 },
        { type: 'photo', icon: '📷', name: '相册', desc: '生活瞬间与旅行', count: 312 }
      ],
      moments: [
        { date: '2026-01-01', text: '新年快乐！今年的目标是：去西藏、学吉他、读完20本书。' },
        { date: '2026-03-15', text: '项目终于上线了，三个月的熬夜值得！团队聚餐庆祝🎉' },
        { date: '2026-05-20', text: '汤圆来家里一个月了，从胆小鬼变成了小霸王😂' },
        { date: '2026-06-10', text: '西藏之行圆满结束。纳木错的星空、布达拉宫的日落，一切都值得。' }
      ],
      chatHighlights: [
        { partner: '小李', text: '这次项目你真的很拼，我看到了你的成长。' },
        { partner: '妈妈', text: '注意身体，别总是熬夜，妈妈心疼。' },
        { partner: '老张', text: '西藏的照片太美了，下次一定要一起去！' }
      ]
    };
  },

  generateFutureMeGreeting: function(persona, year) {
    return '嗨，我是来自' + year + '年的你。'
      + '这一年你发了' + persona.sources[0].count + '条朋友圈，'
      + '聊了' + persona.sources[1].count + '条消息，'
      + '拍了' + persona.sources[2].count + '张照片。'
      + '\n\n这些记忆组成了现在的我。'
      + '想聊聊今年的故事吗？';
  },

  generateFutureMeReply: function(userText, persona) {
    var text = userText.toLowerCase();
    var year = persona.year;

    if (text.indexOf('变化') !== -1 || text.indexOf('成长') !== -1 || text.indexOf('不同') !== -1) {
      return [
        '今年的变化挺大的。年初的时候你还很迷茫，但现在回头看，每一步都算数。',
        '最大的变化是心态吧。以前很在意别人的看法，今年学会了和自己和解。',
        '工作上成长最明显，那个大项目让你学会了怎么带团队、怎么抗压。'
      ];
    } else if (text.indexOf('目标') !== -1 || text.indexOf('计划') !== -1 || text.indexOf('愿望') !== -1) {
      return [
        '年初定的目标：去西藏✅ 学吉他❌ 读完20本书📖（目前读了12本）。',
        '吉他买了，但只练了两次... 不过西藏和读书的目标完成得不错！',
        '明年的目标已经在想了：学会游泳、考个证书、再去一个新地方。'
      ];
    } else if (text.indexOf('开心') !== -1 || text.indexOf('快乐') !== -1 || text.indexOf('幸福') !== -1) {
      return [
        '最开心的是西藏之行，纳木错的星空真的让人想哭。',
        '还有汤圆来到家里的那天，一个小生命带来的快乐超出想象。',
        '项目上线那天团队聚餐，大家笑着哭着，那种成就感无法替代。'
      ];
    } else if (text.indexOf('遗憾') !== -1 || text.indexOf('后悔') !== -1 || text.indexOf('可惜') !== -1) {
      return [
        '遗憾的是吉他没坚持下来，总是找借口说忙。',
        '还有几次朋友聚会因为加班推掉了，现在想想挺可惜的。',
        '没能多回家看看爸妈，每次打电话妈妈都说"没事，你忙"。'
      ];
    } else if (text.indexOf('明年') !== -1 || text.indexOf('未来') !== -1 || text.indexOf('以后') !== -1) {
      return [
        '给明年的自己：别忘了初心，但也别对自己太苛刻。',
        '希望明年的你能学会吉他，能多回家看看，能去更多地方。',
        '不管遇到什么，记得今年的你有多勇敢。继续向前走吧。'
      ];
    } else if (text.indexOf('朋友') !== -1 || text.indexOf('家人') !== -1 || text.indexOf('关系') !== -1) {
      return [
        '今年和小李的友谊更深了，那个项目让我们成了真正的战友。',
        '妈妈每次打电话都嘱咐注意身体，这种牵挂是最温暖的力量。',
        '老张说下次要一起去旅行，期待那个约定能实现。'
      ];
    } else if (text.indexOf('工作') !== -1 || text.indexOf('项目') !== -1 || text.indexOf('事业') !== -1) {
      return [
        '今年的项目虽然辛苦，但收获巨大。你学会了怎么在压力下保持冷静。',
        '团队里的小伙伴都很给力，那种并肩作战的感觉很棒。',
        '老板在项目总结会上特别表扬了你，说你的成长肉眼可见。'
      ];
    } else if (text.indexOf('旅行') !== -1 || text.indexOf('旅游') !== -1 || text.indexOf('去哪') !== -1) {
      return [
        '西藏是今年最大的旅行，纳木错、布达拉宫、林芝桃花，每一帧都是画。',
        '明年想去新疆，听说那里的秋天美得不真实。',
        '旅行让你学会了放下手机，真正去感受当下的美好。'
      ];
    } else {
      return [
        '这是个好问题。从今年的记忆来看，我觉得' + persona.traits[0] + '的性格让我对此有特别的感受。',
        '嗯... 让我想想。今年在' + persona.memories[0].location + '的时候，我也有过类似的思考。',
        '哈哈，说到这个，我想起朋友圈发过一条相关的，那时候的心情和现在不太一样呢。',
        '作为' + year + '年的你，我觉得最重要的是保持' + persona.traits[1] + '，同时也要学会放松。',
        '这个问题很有意思。从聊天记录来看，你也曾和小李讨论过类似的话题。'
      ];
    }
  },

  // ---------- 工具方法 ----------

  formatTime: function(date) {
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return pad(date.getHours()) + ':' + pad(date.getMinutes());
  },

  // ---------- Mock 数据 ----------

  getMockCapsule: function(capsuleId) {
    var capsules = {
      'demo_capsule_1': {
        id: 'demo_capsule_1',
        title: '小鱼的记忆胶囊',
        persona: {
          name: '小鱼',
          avatar: '/assets/avatars/xiaoyu.png',
          hobbies: ['摄影', '旅行', '看电影'],
          traits: ['开朗', '细心', '有点理想主义'],
          memories: [
            { location: '厦门', desc: '海边日落特别美，我们拍了好多照片。' },
            { location: '北京', desc: '那时候每天加班到很晚，但周末一定会去咖啡馆坐坐。' }
          ]
        },
        sources: [
          { type: 'photo', icon: '📷', name: '照片', desc: '旅行、生活瞬间', count: 42 },
          { type: 'moment', icon: '📝', name: '朋友圈', desc: '日常心情与分享', count: 128 },
          { type: 'chat', icon: '💬', name: '聊天记录', desc: '与好友的对话', count: 356 },
          { type: 'bottle', icon: '🍾', name: '漂流瓶', desc: '封存的心愿与回忆', count: 8 }
        ]
      },
      'demo_capsule_2': {
        id: 'demo_capsule_2',
        title: '老王的记忆胶囊',
        persona: {
          name: '老王',
          avatar: '/assets/avatars/laowang.png',
          hobbies: ['编程', '打游戏', '吃火锅'],
          traits: ['幽默', '直率', '技术宅'],
          memories: [
            { location: '成都', desc: '那次团建吃辣火锅，我喝了三瓶豆奶。' },
            { location: '深圳', desc: '第一次参加黑客马拉松，熬了两天夜。' }
          ]
        },
        sources: [
          { type: 'photo', icon: '📷', name: '照片', desc: '技术分享、聚会', count: 23 },
          { type: 'moment', icon: '📝', name: '朋友圈', desc: '技术吐槽与生活', count: 89 },
          { type: 'chat', icon: '💬', name: '聊天记录', desc: '群聊与技术讨论', count: 512 },
          { type: 'bottle', icon: '🍾', name: '漂流瓶', desc: '封存的心愿', count: 3 }
        ]
      }
    };

    // 如果没有匹配到，返回默认胶囊
    var capsule = capsules[capsuleId];
    if (!capsule) {
      capsule = capsules['demo_capsule_1'];
      capsule.id = capsuleId || 'unknown';
    }
    return capsule;
  }
});
