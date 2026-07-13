/**
 * 饭泛之交 - Store 数据持久化
 * 模块化拆分自单文件原型
 */

const STORAGE_KEY = 'fanfanzhijiao_state_v1';

const Store = {
  data: {
    user: null,
    isLoggedIn: false,
    currentTab: 'home',
    surveyAnswers: {},
    mealHistory: [],
    reviewTarget: null,
    currentChat: null,
    creditScore: 100,
    creditHistory: [],
    chats: [],
    surveyCompleted: false,
    vouchers: [],
    posts: [],
    postApplications: {},
    verification: {
      basic: { status: 'verified', label: '基础认证', icon: '📱', desc: '手机号 + 微信授权' },
      realname: { status: 'unverified', label: '实名认证', icon: '🪪', desc: '身份证OCR + 公安联网校验' },
      face: { status: 'unverified', label: '人脸认证', icon: '🤳', desc: '3D活体检测' },
      education: { status: 'unverified', label: '学历认证', icon: '🎓', desc: '学信网接口验证' },
      profession: { status: 'unverified', label: '职业认证', icon: '💼', desc: '企业邮箱/工作证明' }
    },
    invitationCodes: [],
    invitedBy: null
  },

  init() {
    this.load();
    // 如果有存活的聊天数据，同步到运行时
    if (this.data.chats && this.data.chats.length > 0) {
      mockChats.length = 0;
      mockChats.push(...this.data.chats);
    }
  },

  save() {
    // 同步运行时 chats 到 store
    this.data.chats = [...mockChats];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch(e) {
      console.warn('localStorage保存失败:', e);
    }
  },

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed };
      }
    } catch(e) {
      console.warn('localStorage读取失败:', e);
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = {
      user: null,
      isLoggedIn: false,
      currentTab: 'home',
      surveyAnswers: {},
      mealHistory: [],
      reviewTarget: null,
      currentChat: null,
      creditScore: 100,
      creditHistory: [],
      chats: [],
      surveyCompleted: false,
      vouchers: [],
      posts: [],
      postApplications: {},
      verification: {
        basic: { status: 'verified', label: '基础认证', icon: '📱', desc: '手机号 + 微信授权' },
        realname: { status: 'unverified', label: '实名认证', icon: '🪪', desc: '身份证OCR + 公安联网校验' },
        face: { status: 'unverified', label: '人脸认证', icon: '🤳', desc: '3D活体检测' },
        education: { status: 'unverified', label: '学历认证', icon: '🎓', desc: '学信网接口验证' },
        profession: { status: 'unverified', label: '职业认证', icon: '💼', desc: '企业邮箱/工作证明' }
      },
      invitationCodes: [],
      invitedBy: null
    };
    // 重置 mockChats 到初始状态
    mockChats.length = 0;
    mockChats.push(
      {avatar:'👩',name:'小食光',preview:'明天晚上见！我已经到餐厅附近了～',time:'2分钟前',unread:2},
      {avatar:'👨',name:'美食探险家',preview:'好的，那我们就定周五晚上7点',time:'1小时前',unread:0},
      {avatar:'👩‍🦰',name:'辣妹子',preview:'哈哈那家店确实好吃，下次再约！',time:'昨天',unread:0}
    );
  },

  // 便捷访问器
  get user() { return this.data.user; },
  set user(v) { this.data.user = v; this.save(); },
  get isLoggedIn() { return this.data.isLoggedIn; },
  set isLoggedIn(v) { this.data.isLoggedIn = v; this.save(); },
  get mealHistory() { return this.data.mealHistory; },
  get creditScore() { return this.data.creditScore; },
  get surveyAnswers() { return this.data.surveyAnswers; },
  get surveyCompleted() { return this.data.surveyCompleted; },
  set surveyCompleted(v) { this.data.surveyCompleted = v; this.save(); },

  addMeal(meal) {
    this.data.mealHistory.unshift(meal);
    this.save();
  },

  updateMeal(id, updates) {
    const meal = this.data.mealHistory.find(h => h.id === id);
    if (meal) {
      Object.assign(meal, updates);
      this.save();
    }
  },

  addCreditScore(delta) {
    this.data.creditScore += delta;
    this.data.creditHistory.unshift({
      delta: delta,
      reason: arguments[1] || '操作',
      time: new Date().toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),
      score: this.data.creditScore
    });
    this.save();
  },

  get creditHistory() { return this.data.creditHistory; },
  get vouchers() { return this.data.vouchers; },
  get posts() { return this.data.posts; },
  get postApplications() { return this.data.postApplications; },

  addPost(post) {
    this.data.posts.unshift(post);
    this.save();
  },

  addApplication(postId, applicant) {
    if(!this.data.postApplications[postId]) {
      this.data.postApplications[postId] = [];
    }
    this.data.postApplications[postId].push(applicant);
    this.save();
  },

  addVoucher(voucher) {
    this.data.vouchers.unshift(voucher);
    this.save();
  },

  get verification() { return this.data.verification; },
  get invitationCodes() { return this.data.invitationCodes; },
  get invitedBy() { return this.data.invitedBy; },

  setVerificationStatus(type, status) {
    if (this.data.verification[type]) {
      this.data.verification[type].status = status;
      this.save();
    }
  },

  generateInvitationCodes(count) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = 'FF' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().slice(-2);
      codes.push({
        code: code,
        used: false,
        createdAt: new Date().toLocaleDateString(),
        usedBy: null
      });
    }
    this.data.invitationCodes.push(...codes);
    this.save();
  }
};

// 兼容旧代码的全局引用
let appState = Store.data;

// 所有 mock 数据定义完成后，初始化 Store（从 localStorage 加载持久化数据）
Store.init();