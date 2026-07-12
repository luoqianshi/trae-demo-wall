// pages/index/index.js
const recommender = require('../../utils/recommender.js');

Page({
  data: {
    currentSection: 1,
    loading: false,
    loadingText: '正在为TA精选礼物...',
    refreshSeed: 0,
    currentTier: 'surprise',
    // 已展开详情的礼物 id 列表（卡片分层：浏览态 / 展开态）
    expandedGiftIds: [],
    formData: {
      gender: null,
      age: null,
      career: null,
      hobbies: [],
      lifestyle: null,
      wish: '',
      history: [],
      budgetMin: 300,
      budgetMax: 800,
      occasion: null,
      feedback: {
        likedGiftIds: [],
        dislikedGiftIds: [],
        dislikedCategories: []
      }
    },
    // 双滑块区间选择器状态
    minPercent: 0,
    maxPercent: 100,
    activeHandle: null,
    trackWidth: 0,
    trackLeft: 0,
    BUDGET_MIN: 100,
    BUDGET_MAX: 5000,
    BUDGET_STEP: 50,
    BUDGET_GAP: 100,
    recommendations: {
      surprise: [],
      practical: [],
      heartfelt: []
    },
    recommendMeta: {
      fallbackLevel: 0,
      emptyReason: '',
      isEmpty: false,
      totalCount: 0
    },
    displayGifts: [],
    lifecycleData: [],
    summaryText: {},

    // 进度步骤
    progressSteps: [
      { num: 1, text: '基本信息' },
      { num: 2, text: '兴趣爱好' },
      { num: 3, text: '心愿需求' },
      { num: 4, text: '预算设置' },
      { num: 5, text: '推荐结果' }
    ],

    // 选项数据
    genderOptions: [
      { value: 'female', label: '女生', emoji: '👩' },
      { value: 'male', label: '男生', emoji: '👨' },
      { value: 'other', label: '其他', emoji: '🌈' }
    ],
    ageOptions: [
      { value: '18-22', label: '18-22岁', emoji: '🎓' },
      { value: '23-28', label: '23-28岁', emoji: '💼' },
      { value: '29-35', label: '29-35岁', emoji: '🏢' },
      { value: '36-45', label: '36-45岁', emoji: '👔' },
      { value: '46+', label: '46岁以上', emoji: '🌟' }
    ],
    careerOptions: [
      { value: 'tech', label: '科技/互联网', emoji: '💻' },
      { value: 'creative', label: '创意/设计', emoji: '🎨' },
      { value: 'business', label: '商务/金融', emoji: '📊' },
      { value: 'education', label: '教育/学术', emoji: '📚' },
      { value: 'medical', label: '医疗/健康', emoji: '🏥' },
      { value: 'arts', label: '艺术/表演', emoji: '🎭' },
      { value: 'student', label: '学生', emoji: '🎒' },
      { value: 'freelance', label: '自由职业', emoji: '🏠' }
    ],
    hobbyOptions: [
      { value: 'reading', label: '阅读', emoji: '📖' },
      { value: 'gaming', label: '游戏', emoji: '🎮' },
      { value: 'music', label: '音乐', emoji: '🎵' },
      { value: 'movies', label: '电影/剧集', emoji: '🎬' },
      { value: 'sports', label: '运动健身', emoji: '⚽' },
      { value: 'travel', label: '旅行', emoji: '✈️' },
      { value: 'photography', label: '摄影', emoji: '📷' },
      { value: 'cooking', label: '美食烹饪', emoji: '🍳' },
      { value: 'fashion', label: '时尚穿搭', emoji: '👗' },
      { value: 'beauty', label: '美妆护肤', emoji: '💄' },
      { value: 'pets', label: '宠物', emoji: '🐱' },
      { value: 'plants', label: '花草植物', emoji: '🌿' },
      { value: 'tech-gadgets', label: '数码科技', emoji: '🔧' },
      { value: 'handmade', label: '手工DIY', emoji: '🧶' },
      { value: 'tea-coffee', label: '咖啡/茶饮', emoji: '☕' },
      { value: 'yoga', label: '瑜伽冥想', emoji: '🧘' }
    ],
    lifestyleOptions: [
      { value: 'homebody', label: '宅家型', emoji: '🏠' },
      { value: 'outgoing', label: '社交型', emoji: '🎉' },
      { value: 'balanced', label: '均衡型', emoji: '⚖️' },
      { value: 'workaholic', label: '事业型', emoji: '💪' }
    ],
    historyOptions: [
      { value: 'clothes', label: '衣服/鞋包', emoji: '👕' },
      { value: 'electronics', label: '数码产品', emoji: '📱' },
      { value: 'jewelry', label: '首饰配饰', emoji: '💍' },
      { value: 'cosmetics', label: '美妆护肤', emoji: '💄' },
      { value: 'flowers', label: '鲜花/永生花', emoji: '💐' },
      { value: 'diy', label: '手工/定制', emoji: '🎨' },
      { value: 'experience', label: '体验/演出', emoji: '🎫' },
      { value: 'perfume', label: '香水', emoji: '🌸' },
      { value: 'watch', label: '手表', emoji: '⌚' },
      { value: 'book', label: '书籍', emoji: '📚' },
      { value: 'home', label: '家居用品', emoji: '🏠' },
      { value: 'food', label: '零食/美食', emoji: '🍫' }
    ],
    occasionOptions: [
      { value: 'birthday', label: '生日', emoji: '🎂' },
      { value: 'valentine', label: '情人节', emoji: '💕' },
      { value: 'anniversary', label: '纪念日', emoji: '💍' },
      { value: 'christmas', label: '圣诞节', emoji: '🎄' },
      { value: 'newyear', label: '新年/春节', emoji: '🎆' },
      { value: 'graduation', label: '毕业季', emoji: '🎓' },
      { value: 'justbecause', label: '就是想送', emoji: '🎁' }
    ]
  },

  onLoad() {
    // 检查是否有保存的数据
    this.loadSavedData();
    // 初始化双滑块百分比
    this.updatePercents();
    // 加载用户历史反馈数据（喜欢/不感兴趣）
    this.loadFeedback();
  },

  onReady() {
    // 获取轨道宽度和位置（用于触摸坐标换算）
    this.queryTrackRect();
  },

  // 查询轨道的实际位置和宽度
  queryTrackRect() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#rangeTrack').boundingClientRect(rect => {
      if (rect && rect.width > 0) {
        this.trackWidth = rect.width;
        this.trackLeft = rect.left;
      }
    }).exec();
  },

  // ============ 双滑块区间选择 ============
  updatePercents() {
    const { BUDGET_MIN, BUDGET_MAX } = this.data;
    const { budgetMin, budgetMax } = this.data.formData;
    const minPercent = (budgetMin - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN) * 100;
    const maxPercent = (budgetMax - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN) * 100;
    this.setData({ minPercent, maxPercent });
  },

  onMinHandleTouchStart() {
    this.setData({ activeHandle: 'min' });
    // 每次开始拖动前刷新一次轨道尺寸，避免布局变化导致坐标错位
    this.queryTrackRect();
  },

  onMaxHandleTouchStart() {
    this.setData({ activeHandle: 'max' });
    this.queryTrackRect();
  },

  onTrackTouchMove(e) {
    if (!this.data.activeHandle) return;
    // 若轨道尺寸未获取到，尝试重新获取
    if (!this.trackWidth) {
      this.queryTrackRect();
      return;
    }
    if (!e.touches || e.touches.length === 0) return;

    const x = e.touches[0].clientX - this.trackLeft;
    let percent = x / this.trackWidth * 100;
    percent = Math.max(0, Math.min(100, percent));

    const { BUDGET_MIN, BUDGET_MAX, BUDGET_STEP, BUDGET_GAP } = this.data;
    // 换算为预算值并对齐步长
    let value = BUDGET_MIN + percent / 100 * (BUDGET_MAX - BUDGET_MIN);
    value = Math.round(value / BUDGET_STEP) * BUDGET_STEP;
    value = Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, value));

    const handle = this.data.activeHandle;
    if (handle === 'min') {
      // 最小值不能超过最大值减去最小间隔
      value = Math.min(value, this.data.formData.budgetMax - BUDGET_GAP);
      value = Math.max(BUDGET_MIN, value);
      this.setData({ 'formData.budgetMin': value });
    } else if (handle === 'max') {
      value = Math.max(value, this.data.formData.budgetMin + BUDGET_GAP);
      value = Math.min(BUDGET_MAX, value);
      this.setData({ 'formData.budgetMax': value });
    }
    this.updatePercents();
  },

  onTrackTouchEnd() {
    this.setData({ activeHandle: null });
  },

  // ============ 单选 ============
  selectSingle(e) {
    const { field, value } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // ============ 多选 ============
  toggleMulti(e) {
    const { field, value } = e.currentTarget.dataset;
    const list = this.data.formData[field];
    const idx = list.indexOf(value);

    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(value);
    }

    this.setData({
      [`formData.${field}`]: list
    });
  },

  // ============ 输入心愿 ============
  inputWish(e) {
    this.setData({
      'formData.wish': e.detail.value
    });
  },

  // ============ 表单导航 ============
  nextSection() {
    const current = this.data.currentSection;

    if (!this.validateSection(current)) {
      wx.showToast({
        title: '请完成当前步骤的选择哦~',
        icon: 'none'
      });
      return;
    }

    this.setData({
      currentSection: current + 1
    });

    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  prevSection() {
    const current = this.data.currentSection;
    this.setData({
      currentSection: current - 1
    });

    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  validateSection(section) {
    const fd = this.data.formData;
    switch (section) {
      case 1:
        return fd.gender && fd.age && fd.career;
      case 2:
        return fd.hobbies.length > 0 && fd.lifestyle;
      case 3:
        return true;
      case 4:
        return fd.occasion;
      default:
        return true;
    }
  },

  // ============ 生成推荐 ============
  generateRecommendations() {
    if (!this.data.formData.occasion) {
      wx.showToast({
        title: '请选择送礼场合哦~',
        icon: 'none'
      });
      return;
    }

    // 动态 loading 文案：初始化为第一句
    const loadingTexts = [
      '正在了解TA的喜好...',
      '从 98 件礼物中筛选...',
      '匹配你的预算范围...',
      '计算四维评分...',
      '生成专属推荐...'
    ];

    this.setData({
      currentSection: 5,
      loading: true,
      loadingText: loadingTexts[0],
      expandedGiftIds: []
    });

    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });

    // 启动文案轮播定时器
    let textIdx = 0;
    this.loadingTimer = setInterval(() => {
      textIdx = (textIdx + 1) % loadingTexts.length;
      this.setData({ loadingText: loadingTexts[textIdx] });
    }, 600);

    // 模拟延迟，显示加载动画
    setTimeout(() => {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;

      const recommendations = recommender.computeRecommendations(this.data.formData);
      const meta = recommendations._meta || {
        fallbackLevel: 0, emptyReason: '', isEmpty: false, totalCount: 0
      };

      this.setData({
        recommendations: recommendations,
        recommendMeta: meta,
        loading: false
      });

      this.renderUserSummary();
      this.renderGiftList();
      this.renderLifecycle();
    }, 800);
  },

  // 页面卸载时清理 loading 定时器，避免内存泄漏
  onUnload() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
  },

  // ============ 切换礼物卡片展开态 ============
  // 在 expandedGiftIds 中 toggle 当前礼物 id，控制浏览态 / 展开态切换
  toggleGiftExpand(e) {
    const giftId = e.currentTarget.dataset.giftId;
    if (!giftId) return;
    const expanded = this.data.expandedGiftIds.slice();
    const idx = expanded.indexOf(giftId);
    if (idx > -1) {
      expanded.splice(idx, 1);
    } else {
      expanded.push(giftId);
    }
    this.setData({ expandedGiftIds: expanded });
    // 同步刷新卡片 isExpanded 标记
    this.renderGiftList();
  },

  // ============ 渲染用户摘要 ============
  renderUserSummary() {
    const fd = this.data.formData;
    const genderMap = { female: '👩 女生', male: '👨 男生', other: '🌈 其他' };
    const ageMap = { '18-22': '18-22岁', '23-28': '23-28岁', '29-35': '29-35岁', '36-45': '36-45岁', '46+': '46岁以上' };
    const careerMap = {
      tech: '科技/互联网', creative: '创意/设计', business: '商务/金融',
      education: '教育/学术', medical: '医疗/健康', arts: '艺术/表演',
      student: '学生', freelance: '自由职业'
    };
    const occasionMap = {
      birthday: '🎂 生日', valentine: '💕 情人节', anniversary: '💍 纪念日',
      christmas: '🎄 圣诞节', newyear: '🎆 新年/春节', graduation: '🎓 毕业季',
      justbecause: '🎁 就是想送'
    };

    this.setData({
      summaryText: {
        gender: genderMap[fd.gender] || '-',
        age: ageMap[fd.age] || '-',
        career: careerMap[fd.career] || '-',
        occasion: occasionMap[fd.occasion] || '-'
      }
    });
  },

  // ============ 渲染礼物列表 ============
  renderGiftList() {
    const gifts = this.data.recommendations[this.data.currentTier] || [];

    if (gifts.length === 0) {
      this.setData({ displayGifts: [] });
      return;
    }

    // 换一批功能：根据 refreshSeed 偏移
    const offset = this.data.refreshSeed % gifts.length;
    const displayGifts = gifts.slice(offset).concat(gifts.slice(0, offset));

    // 为每张卡片预处理需要展示的子数组（避免 wxml 中 wx:for 与 wx:if 一起使用）
    const fb = this.data.formData.feedback;
    const expandedGiftIds = this.data.expandedGiftIds || [];
    displayGifts.forEach(gift => {
      gift.scenariosShow = (gift.scenarios || []).slice(0, 3);
      gift.packagingIdeasShow = (gift.packaging && gift.packaging.ideas || []).slice(0, 2);
      gift.wishShow = (gift.packaging && gift.packaging.wishes && gift.packaging.wishes[0]) || '';
      // 广告标识：从 adInfo 字段读取
      gift.isAd = !!(gift.adInfo && gift.adInfo.isAd);
      gift.merchantName = (gift.adInfo && gift.adInfo.merchantName) || '';
      // 反馈状态：标记当前礼物是否被用户喜欢/不感兴趣
      gift.isLiked = fb.likedGiftIds.indexOf(gift.id) > -1;
      gift.isDisliked = fb.dislikedGiftIds.indexOf(gift.id) > -1;
      // 卡片展开态：基于 expandedGiftIds 判断（分层展示）
      gift.isExpanded = expandedGiftIds.indexOf(gift.id) > -1;
      // 价格显示统一处理：数字加 ¥ 前缀；透传 url 字段供点击跳转
      gift.platformsShow = (gift.platforms || []).map(p => ({
        name: p.name,
        badge: p.badge || '',
        priceText: typeof p.price === 'number' ? '¥' + p.price : p.price,
        url: p.url || ''
      }));
    });

    this.setData({
      displayGifts: displayGifts
    });
  },

  // ============ 点击购买渠道跳转 ============
  onPlatformTap(e) {
    const { url, name, giftName } = e.currentTarget.dataset;
    // 上线初期：不跳转外部链接（业务域名未配置），改为复制搜索提示
    // 后续接入联盟链接后，恢复 web-view 跳转逻辑
    const searchText = giftName || name;
    wx.setClipboardData({
      data: searchText,
      success: () => {
        wx.showToast({
          title: `已复制「${searchText}」，请到${name}搜索购买`,
          icon: 'none',
          duration: 2500
        });
      }
    });
  },

  // ============ 用户反馈：喜欢 / 不感兴趣 ============
  // 切换"喜欢"状态：再次点击取消
  toggleLike(e) {
    const giftId = e.currentTarget.dataset.giftId;
    const gift = this.data.displayGifts.find(g => g.id === giftId);
    if (!gift) return;

    const fb = this.data.formData.feedback;
    let likedGiftIds = fb.likedGiftIds.slice();
    let dislikedGiftIds = fb.dislikedGiftIds.slice();

    // 若当前是不感兴趣状态，先取消不感兴趣
    const dIdx = dislikedGiftIds.indexOf(giftId);
    if (dIdx > -1) dislikedGiftIds.splice(dIdx, 1);

    const lIdx = likedGiftIds.indexOf(giftId);
    if (lIdx > -1) {
      // 已喜欢 -> 取消喜欢
      likedGiftIds.splice(lIdx, 1);
    } else {
      likedGiftIds.push(giftId);
      wx.showToast({ title: '已标记为喜欢', icon: 'none', duration: 1000 });
    }

    this.applyFeedback(likedGiftIds, dislikedGiftIds);
  },

  // 切换"不感兴趣"状态：再次点击取消
  toggleDislike(e) {
    const giftId = e.currentTarget.dataset.giftId;
    const gift = this.data.displayGifts.find(g => g.id === giftId);
    if (!gift) return;

    const fb = this.data.formData.feedback;
    let likedGiftIds = fb.likedGiftIds.slice();
    let dislikedGiftIds = fb.dislikedGiftIds.slice();
    let dislikedCategories = fb.dislikedCategories.slice();

    // 若当前是喜欢状态，先取消喜欢
    const lIdx = likedGiftIds.indexOf(giftId);
    if (lIdx > -1) likedGiftIds.splice(lIdx, 1);

    const dIdx = dislikedGiftIds.indexOf(giftId);
    if (dIdx > -1) {
      // 已不感兴趣 -> 取消
      dislikedGiftIds.splice(dIdx, 1);
    } else {
      dislikedGiftIds.push(giftId);
      // 同步记录其 category（用于同类降权）
      if (gift.category && dislikedCategories.indexOf(gift.category) === -1) {
        dislikedCategories.push(gift.category);
      }
      wx.showToast({ title: '已标记为不感兴趣', icon: 'none', duration: 1000 });
    }

    this.applyFeedback(likedGiftIds, dislikedGiftIds, dislikedCategories);
  },

  // 应用反馈到 formData 并持久化，然后重新渲染列表
  applyFeedback(likedGiftIds, dislikedGiftIds, dislikedCategories) {
    const fb = this.data.formData.feedback;
    if (typeof dislikedCategories === 'undefined') dislikedCategories = fb.dislikedCategories;

    this.setData({
      'formData.feedback.likedGiftIds': likedGiftIds,
      'formData.feedback.dislikedGiftIds': dislikedGiftIds,
      'formData.feedback.dislikedCategories': dislikedCategories
    });

    this.saveFeedback();

    // 重新渲染当前列表，立即更新按钮选中态
    this.renderGiftList();
  },

  // 加载本地存储的反馈数据
  loadFeedback() {
    try {
      const saved = wx.getStorageSync('giftFeedback');
      if (saved) {
        this.setData({
          'formData.feedback.likedGiftIds': saved.likedGiftIds || [],
          'formData.feedback.dislikedGiftIds': saved.dislikedGiftIds || [],
          'formData.feedback.dislikedCategories': saved.dislikedCategories || []
        });
      }
    } catch (e) {
      console.log('读取反馈数据失败', e);
    }
  },

  // 持久化反馈数据到本地
  saveFeedback() {
    try {
      const fb = this.data.formData.feedback;
      wx.setStorageSync('giftFeedback', {
        likedGiftIds: fb.likedGiftIds,
        dislikedGiftIds: fb.dislikedGiftIds,
        dislikedCategories: fb.dislikedCategories
      });
    } catch (e) {
      console.log('保存反馈数据失败', e);
    }
  },

  // 清除全部用户反馈（喜欢/不感兴趣），并重新生成推荐
  clearFeedback() {
    const hasFeedback = this.data.formData.feedback.dislikedGiftIds.length > 0
      || this.data.formData.feedback.likedGiftIds.length > 0;
    if (!hasFeedback) {
      wx.showToast({ title: '暂无反馈数据可清除', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '清除反馈',
      content: '将清空你所有"喜欢/不感兴趣"的标记，并重新生成推荐。确定继续吗？',
      confirmText: '清除',
      success: (res) => {
        if (!res.confirm) return;
        try { wx.removeStorageSync('giftFeedback'); } catch (e) {}
        this.setData({
          'formData.feedback.likedGiftIds': [],
          'formData.feedback.dislikedGiftIds': [],
          'formData.feedback.dislikedCategories': []
        });
        // 重新生成推荐
        const recommendations = recommender.computeRecommendations(this.data.formData);
        const meta = recommendations._meta || {
          fallbackLevel: 0, emptyReason: '', isEmpty: false, totalCount: 0
        };
        this.setData({
          recommendations: recommendations,
          recommendMeta: meta,
          refreshSeed: 0,
          expandedGiftIds: []
        });
        this.renderGiftList();
        this.renderLifecycle();
        wx.showToast({ title: '已清除反馈并刷新', icon: 'none' });
      }
    });
  },

  // 空状态引导：回到预算/送过类型步骤调整条件
  goBackToAdjust() {
    this.setData({ currentSection: 4 });
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  // ============ 渲染生命周期 ============
  renderLifecycle() {
    const topGift = this.data.recommendations[this.data.currentTier] && this.data.recommendations[this.data.currentTier][0];

    const lifecycleData = [
      {
        icon: '💬',
        title: '引导分享使用体验',
        desc: '送完礼物后，如何自然地引导TA分享使用感受，让礼物的情感价值持续发酵。',
        tips: [
          '几天后 casually 问起："那个XX你用了吗？感觉怎么样？"',
          '认真倾听TA的反馈，给予积极回应',
          '如果TA很喜欢，可以说"看到你喜欢我就放心了"',
          '把TA的反馈记在心里，为下次送礼做参考'
        ]
      },
      {
        icon: '📖',
        title: '记录礼物的故事',
        desc: '每一份礼物都有它的故事，记录下来，让这份情感记忆可以追溯。',
        tips: [
          '拍一张TA收到礼物时的照片（表情最真实）',
          '在备忘录里记下：送礼日期、场合、礼物、TA的反应',
          '如果是定制礼物，保存好设计稿和定制的文字',
          '一年后回看这些记录，会是非常美好的回忆'
        ]
      },
      {
        icon: '🚀',
        title: '下次礼物升级建议',
        desc: '基于本次选择，为下一个节日的礼物推荐提供升级方向。',
        tips: recommender.generateUpgradeTips(topGift)
      }
    ];

    this.setData({
      lifecycleData: lifecycleData
    });
  },

  // ============ 切换档次 ============
  switchTier(e) {
    const tier = e.currentTarget.dataset.tier;
    this.setData({
      currentTier: tier,
      refreshSeed: 0,
      expandedGiftIds: []
    });
    this.renderGiftList();
    this.renderLifecycle();
  },

  // ============ 换一批 ============
  refreshRecommendations() {
    this.setData({
      refreshSeed: this.data.refreshSeed + 1,
      expandedGiftIds: []
    });
    this.renderGiftList();
    wx.showToast({
      title: '已为你刷新推荐~',
      icon: 'none'
    });
  },

  // ============ 重新填写 ============
  restartForm() {
    wx.showModal({
      title: '提示',
      content: '确定要重新填写吗？当前推荐方案将不会自动保存。',
      success: (res) => {
        if (res.confirm) {
          // 保留用户反馈数据（喜欢/不感兴趣跨次保留）
          const fb = this.data.formData.feedback;
          this.setData({
            currentSection: 1,
            refreshSeed: 0,
            currentTier: 'surprise',
            recommendations: { surprise: [], practical: [], heartfelt: [] },
            recommendMeta: { fallbackLevel: 0, emptyReason: '', isEmpty: false, totalCount: 0 },
            displayGifts: [],
            lifecycleData: [],
            summaryText: {},
            expandedGiftIds: [],
            formData: {
              gender: null,
              age: null,
              career: null,
              hobbies: [],
              lifestyle: null,
              wish: '',
              history: [],
              budgetMin: 300,
              budgetMax: 800,
              occasion: null,
              feedback: fb
            }
          });

          this.updatePercents();

          wx.pageScrollTo({
            scrollTop: 0,
            duration: 300
          });
        }
      }
    });
  },

  // ============ 保存方案 ============
  saveRecommendations() {
    const data = {
      formData: this.data.formData,
      recommendations: this.data.recommendations,
      currentTier: this.data.currentTier,
      savedAt: new Date().toISOString()
    };

    try {
      wx.setStorageSync('giftRecommendations', data);
      wx.showToast({
        title: '推荐方案已保存~',
        icon: 'success'
      });
    } catch (e) {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  // ============ 加载保存的数据 ============
  loadSavedData() {
    try {
      const saved = wx.getStorageSync('giftRecommendations');
      if (saved) {
        // 不自动恢复，仅在调试时使用
        console.log('检测到保存的方案');
      }
    } catch (e) {
      console.log('无法读取本地存储');
    }
  },

  // ============ 导出报告图片 ============
  exportReportImage() {
    wx.showLoading({
      title: '正在生成报告...',
      mask: true
    });

    const query = wx.createSelectorQuery();
    query.select('#reportCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) {
        wx.hideLoading();
        wx.showToast({
          title: '导出失败，请重试',
          icon: 'none'
        });
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;

      const width = 750;
      const height = 1400;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      this.drawReport(ctx, width, height, () => {
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res) => {
            wx.hideLoading();
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '报告已保存到相册~',
                  icon: 'success'
                });
              },
              fail: (err) => {
                // 用户拒绝相册权限，预览图片
                wx.previewImage({
                  urls: [res.tempFilePath]
                });
              }
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({
              title: '生成失败，请重试',
              icon: 'none'
            });
          }
        });
      });
    });
  },

  // 绘制报告内容
  drawReport(ctx, width, height, callback) {
    const fd = this.data.formData;
    const gifts = this.data.recommendations[this.data.currentTier] || [];

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#fdf8f6');
    gradient.addColorStop(1, '#fff5f8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = '#e8788a';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💝 礼遇推荐报告', width / 2, 80);

    ctx.fillStyle = '#8a7b75';
    ctx.font = '24px sans-serif';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    ctx.fillText(`为TA精选的专属礼物方案 · ${dateStr}`, width / 2, 120);

    // 用户画像
    ctx.fillStyle = '#2d2320';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📋 TA的画像', 50, 180);

    const genderMap = { female: '女生', male: '男生', other: '其他' };
    const ageMap = { '18-22': '18-22岁', '23-28': '23-28岁', '29-35': '29-35岁', '36-45': '36-45岁', '46+': '46岁+' };
    const occasionMap = { birthday: '生日', valentine: '情人节', anniversary: '纪念日', christmas: '圣诞节', newyear: '新年', graduation: '毕业季', justbecause: '就是想送' };

    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#8a7b75';
    ctx.fillText(`性别：${genderMap[fd.gender] || '-'}    年龄：${ageMap[fd.age] || '-'}`, 50, 220);
    ctx.fillText(`预算：¥${fd.budgetMin}~¥${fd.budgetMax}    场合：${occasionMap[fd.occasion] || '-'}`, 50, 256);
    ctx.fillText(`爱好数：${fd.hobbies.length}个`, 50, 292);

    // 推荐方案
    ctx.fillStyle = '#2d2320';
    ctx.font = 'bold 32px sans-serif';
    const tierNames = { surprise: '👑 惊喜优选', practical: '⭐ 实用精选', heartfelt: '💝 心意之选' };
    ctx.fillText(`🎁 推荐方案 · ${tierNames[this.data.currentTier]}`, 50, 360);

    let y = 400;
    const giftsToDraw = gifts.slice(0, 3);

    giftsToDraw.forEach((gift, idx) => {
      // 卡片背景
      ctx.fillStyle = '#ffffff';
      this.roundRect(ctx, 40, y, width - 80, 280, 16);
      ctx.fill();

      ctx.strokeStyle = '#f0e0d8';
      ctx.lineWidth = 1;
      this.roundRect(ctx, 40, y, width - 80, 280, 16);
      ctx.stroke();

      // 礼物名称
      ctx.fillStyle = '#2d2320';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'left';
      let name = gift.name;
      if (name.length > 22) name = name.slice(0, 22) + '...';
      ctx.fillText(`${idx + 1}. ${name}`, 60, y + 50);

      // 价格
      ctx.fillStyle = '#e8788a';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`¥${gift.basePrice}`, width - 60, y + 50);
      ctx.textAlign = 'left';

      // 推荐指数
      ctx.fillStyle = '#2a9d8f';
      ctx.font = '22px sans-serif';
      ctx.fillText(`推荐指数: ${gift.scoreDetails.total}`, 60, y + 85);

      // 推荐理由（截断）
      ctx.fillStyle = '#8a7b75';
      ctx.font = '22px sans-serif';
      let reason = gift.reason;
      if (reason.length > 38) reason = reason.slice(0, 38) + '...';
      ctx.fillText(reason, 60, y + 115);

      // 四维评分
      const scores = gift.scoreDetails;
      const barY = y + 145;
      const scoreLabels = [
        { label: '实用性', value: scores.practical, color: '#2a9d8f' },
        { label: '情感价值', value: scores.emotional, color: '#e8788a' },
        { label: '独特性', value: scores.unique, color: '#f4b8d4' },
        { label: '预算匹配', value: scores.budgetMatch, color: '#c9a227' }
      ];

      const colWidth = (width - 120) / 2;
      scoreLabels.forEach((s, si) => {
        const sx = 60 + (si % 2) * colWidth;
        const sy = barY + Math.floor(si / 2) * 50;

        ctx.fillStyle = '#8a7b75';
        ctx.font = '20px sans-serif';
        ctx.fillText(s.label, sx, sy);

        // 背景条
        ctx.fillStyle = '#f0e0d8';
        ctx.fillRect(sx, sy + 8, colWidth - 60, 8);

        // 填充条
        ctx.fillStyle = s.color;
        ctx.fillRect(sx, sy + 8, (colWidth - 60) * s.value / 100, 8);

        ctx.fillStyle = '#2d2320';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(s.value, sx + colWidth - 50, sy + 16);
      });

      // 适用场景
      ctx.fillStyle = '#e8788a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('🎯 适用场景', 60, y + 260);

      ctx.fillStyle = '#8a7b75';
      ctx.font = '20px sans-serif';
      let scenario = gift.scenarios[0] || '';
      if (scenario.length > 30) scenario = scenario.slice(0, 30) + '...';
      ctx.fillText(scenario, 180, y + 260);

      y += 310;
    });

    // 底部
    ctx.fillStyle = '#8a7b75';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💝 礼遇 LuckyGift · 愿每一份礼物都承载满满的爱', width / 2, height - 40);

    callback();
  },

  // 圆角矩形辅助函数
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
});
