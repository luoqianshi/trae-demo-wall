App({
  globalData: {
    userInfo: null,
    isLogin: false,
    identity: null,
    currentUser: null,
    recommendUsers: [],
    matches: [],
    messages: {},
    likedMe: [],
    wantToDoTags: [],
    cannotDoTags: [],
    interestEmojis: []
  },

  onLaunch() {
    this.initMockData();
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      if (typeof userInfo.remainingSwipes !== 'number' || userInfo.remainingSwipes > 30) {
        userInfo.remainingSwipes = 30;
        wx.setStorageSync('userInfo', userInfo);
      }
      this.globalData.isLogin = true;
      this.globalData.userInfo = userInfo;
      this.globalData.identity = userInfo.identity;
      this.globalData.currentUser = userInfo;
    }
  },

  initMockData() {
    const wantToDoTags = [
      '🛍️ 逛街', '🎬 看电影', '🍳 做美食', '💻 工作/学习陪伴', '🎮 居家打游戏',
      '🏋️ 一起去健身房', '♨️ 蒸桑拿', '🏊 游泳', '⛳ 高尔夫课', '📷 探店打卡',
      '🖼️ 逛展览', '🎤 唱K', '🗝️ 密室逃脱', '🎲 剧本杀', '🌿 公园散步', '☕ 咖啡聊天',
      '🕯️ 一顿烛光晚餐', '🎁 互送礼物'
    ];
    const cannotDoTags = [
      '🚫 不涉及身体接触', '🏠 不去私人住所', '🍺 不饮酒', '🌙 不过夜',
      '💰 不涉及金钱交易（除平台外）', '📵 不拍照/录像', '📍 不接受远距离', '🔒 不单独密闭空间',
      '🚗 不坐陌生人私家车', '🙅 不接受临时加项目', '🧾 不线下转账', '🎭 不隐瞒真实行程',
      '📞 不交换私人电话', '👥 不多人临时加入', '🕒 不超出约定时间', '🧳 不陪同出远门'
    ];
    const relationshipGoalTags = ['寻找长期伴侣', '享受短期交往的乐趣', '结交新朋友', '完成一日好友KPI'];
    const interestTags = [
      '📚 阅读', '🍳 烹饪', '🖼️ 展览', '☕ 咖啡星人', '🎬 电影',
      '🎉 派对', '🎤 演唱会', '🎵 唱歌', '🎨 动漫', '🌸 二次元',
      '🏋️ 健身', '🧘 冥想', '🧘‍♀️ 瑜伽', '🤸 普拉提', '🏃 跑步', '🏊 游泳', '🏸 羽毛球', '🏀 篮球', '⚽ 足球',
      '🌱 自我发展', '📈 投资', '🎸 乐器', '🫶 关爱自己', '🤖 AI',
      '🍷 微醺', '✈️ 旅行', '🐕 遛狗', '🥾 徒步', '🤿 潜水', '🏍️ 机车', '🏞️ 峡谷', '🎮 Steam'
    ];
    const colors = ['#F8BBD0', '#F48FB1', '#F5E6D3', '#FFECB3', '#E1BEE7'];
    const mockUsers = [
      {
        userId: 'u001',
        identity: 'princess',
        nickname: '小土豆',
        avatarUrls: [colors[0], colors[1], colors[2]],
        aboutMe: '喜欢看电影、做美食，周末想找人一起探店打卡。性格温和，很好相处～',
        interests: ['🎬 电影', '🍳 烹饪', '☕ 咖啡星人', '🖼️ 展览'],
        city: '上海',
        height: 165,
        constellation: '白羊座',
        mbti: 'ENFP',
        wantToDo: ['🎬 看电影', '🍳 做美食', '📷 探店打卡', '☕ 咖啡聊天'],
        relationshipGoals: ['寻找长期伴侣'],
        cannotDo: ['🚫 不涉及身体接触', '🏠 不去私人住所', '🌙 不过夜'],
        openingLine: '可以先从一场电影和一杯咖啡开始～',
        voiceUrl: '',
        voiceDuration: 12,
        isPhotoBlur: false,
        age: 24,
        distanceKm: 3,
        wechatId: 'potato_001'
      },
      {
        userId: 'u002',
        identity: 'princess',
        nickname: '香槟玫瑰',
        avatarUrls: [colors[1], colors[2], colors[3]],
        aboutMe: '健身房常客，想找一起运动的小伙伴。也会做饭，偶尔可以一起下厨～',
        interests: ['🏋️ 健身', '🍳 烹饪', '🎵 唱歌', '🧘‍♀️ 瑜伽'],
        city: '北京',
        height: 170,
        constellation: '狮子座',
        mbti: 'ENTJ',
        wantToDo: ['🏋️ 一起去健身房', '🍳 做美食', '♨️ 蒸桑拿', '🏊 游泳'],
        relationshipGoals: ['结交新朋友'],
        cannotDo: ['🚫 不涉及身体接触', '🍺 不饮酒', '📵 不拍照/录像'],
        openingLine: '如果你也喜欢运动，我们可以从轻松训练开始。',
        voiceUrl: '',
        voiceDuration: 15,
        isPhotoBlur: true,
        age: 26,
        distanceKm: 8,
        wechatId: 'champagne_rose'
      },
      {
        userId: 'u003',
        identity: 'princess',
        nickname: '樱花布丁',
        avatarUrls: [colors[2], colors[3], colors[4]],
        aboutMe: '剧本杀重度爱好者，周末经常组局。也想去学高尔夫～',
        interests: ['🎮 Steam', '🎨 动漫', '✈️ 旅行', '🌸 二次元'],
        city: '广州',
        height: 162,
        constellation: '双鱼座',
        mbti: 'INFP',
        wantToDo: ['🎲 剧本杀', '🗝️ 密室逃脱', '⛳ 高尔夫课', '🖼️ 逛展览'],
        relationshipGoals: ['享受短期交往的乐趣'],
        cannotDo: ['🚫 不涉及身体接触', '🏠 不去私人住所', '🌙 不过夜', '🔒 不单独密闭空间'],
        openingLine: '想找一个能一起认真玩剧本杀的人。',
        voiceUrl: '',
        voiceDuration: 8,
        isPhotoBlur: false,
        age: 23,
        distanceKm: 18,
        wechatId: 'sakura_pudding'
      },
      {
        userId: 'u004',
        identity: 'princess',
        nickname: '午后红茶',
        avatarUrls: [colors[3], colors[4], colors[0]],
        aboutMe: '工作比较忙，想找个人周末一起放松。喜欢公园散步、咖啡聊天。',
        interests: ['☕ 咖啡星人', '🧘 冥想', '📚 阅读', '🎵 唱歌'],
        city: '深圳',
        height: 168,
        constellation: '天秤座',
        mbti: 'ISFJ',
        wantToDo: ['🌿 公园散步', '☕ 咖啡聊天', '🎬 看电影', '🎤 唱K'],
        relationshipGoals: ['寻找长期伴侣', '结交新朋友'],
        cannotDo: ['🚫 不涉及身体接触', '🍺 不饮酒', '🌙 不过夜'],
        openingLine: '周末想慢下来，散步或者喝咖啡都很好。',
        voiceUrl: '',
        voiceDuration: 10,
        isPhotoBlur: false,
        age: 27,
        distanceKm: 32,
        wechatId: 'afternoon_tea'
      },
      {
        userId: 'u005',
        identity: 'princess',
        nickname: '马卡龙',
        avatarUrls: [colors[4], colors[0], colors[1]],
        aboutMe: '喜欢小动物，家里有两只猫。想找人一起逛展览、探店。',
        interests: ['🐕 遛狗', '🎨 动漫', '🖼️ 展览', '☕ 咖啡星人'],
        city: '杭州',
        height: 160,
        constellation: '双子座',
        mbti: 'ESFP',
        wantToDo: ['🖼️ 逛展览', '📷 探店打卡', '☕ 咖啡聊天', '🍳 做美食'],
        relationshipGoals: ['结交新朋友'],
        cannotDo: ['🚫 不涉及身体接触', '🏠 不去私人住所', '📵 不拍照/录像'],
        openingLine: '喜欢可爱的小店和展览，见面可以轻松一点。',
        voiceUrl: '',
        voiceDuration: 14,
        isPhotoBlur: true,
        age: 22,
        distanceKm: 68,
        wechatId: 'macaron_2026'
      }
    ].map(user => ({
      ...user,
      previewWantToDo: user.wantToDo.slice(0, 3),
      remainingSwipes: 30,
      superLikesToday: 1,
      memberType: 'none',
      memberExpireAt: null,
      trialUsed: false
    }));

    this.globalData.recommendUsers = mockUsers;
    this.globalData.likedMe = mockUsers.slice(1, 4).map((user, index) => ({
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatarUrls[0],
      identity: user.identity,
      age: user.age,
      city: user.city,
      cannotDo: user.cannotDo,
      wechatId: user.wechatId,
      createdAt: new Date(Date.now() - index * 28 * 60 * 1000).toISOString()
    }));
    this.globalData.wantToDoTags = wantToDoTags;
    this.globalData.cannotDoTags = cannotDoTags;
    this.globalData.interestEmojis = interestTags;
    this.globalData.relationshipGoalTags = relationshipGoalTags;
  }
});
