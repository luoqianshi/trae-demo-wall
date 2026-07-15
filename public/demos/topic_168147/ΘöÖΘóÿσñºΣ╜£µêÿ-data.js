// 错题大作战 - 模拟数据集
// 包含：错题库、知识点分类、积分/成就、商城礼物
const APP_DATA = {
  // ===== 错题库（预设 24 道真实小学错题）=====
  mistakes: [
    // ---- 数学 ----
    { id: 1, subject: '数学', topic: '乘法口诀', grade: 3, content: '8 × 7 = ?', answer: '56', options: ['54','56','58','48'], image: null, mastery: 'new', addedAt: '2026-07-08', reviewDates: [], reviewCount: 0 },
    { id: 2, subject: '数学', topic: '两位数乘法', grade: 3, content: '23 × 4 = ?', answer: '92', options: ['82','92','96','88'], image: null, mastery: 'new', addedAt: '2026-07-09', reviewDates: ['2026-07-10'], reviewCount: 1 },
    { id: 3, subject: '数学', topic: '应用题-行程', grade: 4, content: '小明每小时走 4 千米，他从家到学校走了 35 分钟，家到学校有多远？', answer: '7/3 千米（约 2.33 千米）', options: ['2 千米','7/3 千米','3 千米','4 千米'], image: null, mastery: 'reviewing', addedAt: '2026-07-06', reviewDates: ['2026-07-07','2026-07-09'], reviewCount: 2 },
    { id: 4, subject: '数学', topic: '分数基础', grade: 4, content: '把 3/4 和 2/3 通分，公分母是多少？', answer: '12', options: ['7','8','12','24'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 5, subject: '数学', topic: '面积计算', grade: 4, content: '一个长方形花园，长 12 米，宽 8 米，面积是多少平方米？', answer: '96 平方米', options: ['96','84','20','104'], image: null, mastery: 'reviewing', addedAt: '2026-07-05', reviewDates: ['2026-07-06','2026-07-08','2026-07-11'], reviewCount: 3 },
    { id: 6, subject: '数学', topic: '应用题-购物', grade: 3, content: '小红买了 3 支铅笔，每支 2 元，又买了 1 个橡皮 1 元，一共花了多少钱？', answer: '7 元', options: ['6 元','7 元','8 元','5 元'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 7, subject: '数学', topic: '除法', grade: 3, content: '72 ÷ 8 = ?', answer: '9', options: ['8','9','10','7'], image: null, mastery: 'new', addedAt: '2026-07-09', reviewDates: [], reviewCount: 0 },
    { id: 8, subject: '数学', topic: '应用题-时间', grade: 4, content: '电影下午 2:30 开始，片长 1 小时 50 分钟，电影几点结束？', answer: '4:20', options: ['4:10','4:20','4:30','3:80'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    // ---- 语文（汉字）----
    { id: 9, subject: '语文', topic: '形近字辨析', grade: 3, content: '选出正确的词语：他（ ）力地跑向终点。', answer: '努', options: ['努','怒','弩','奴'], image: null, mastery: 'new', addedAt: '2026-07-08', reviewDates: [], reviewCount: 0 },
    { id: 10, subject: '语文', topic: '多音字', grade: 3, content: '"音乐"的"乐"读什么？', answer: 'yuè', options: ['lè','yuè','yào','luò'], image: null, mastery: 'reviewing', addedAt: '2026-07-06', reviewDates: ['2026-07-07'], reviewCount: 1 },
    { id: 11, subject: '语文', topic: '成语填空', grade: 4, content: '（ ）不及待（填一个字）', answer: '迫', options: ['破','迫','泊','魄'], image: null, mastery: 'new', addedAt: '2026-07-09', reviewDates: [], reviewCount: 0 },
    { id: 12, subject: '语文', topic: '同音字辨析', grade: 3, content: '选出正确的字：花（ ）', answer: '园', options: ['园','圆','元','原'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 13, subject: '语文', topic: '部首查字', grade: 3, content: '"想"字的部首是什么？', answer: '心', options: ['木','目','心','相'], image: null, mastery: 'reviewing', addedAt: '2026-07-05', reviewDates: ['2026-07-06','2026-07-09'], reviewCount: 2 },
    { id: 14, subject: '语文', topic: '笔顺', grade: 2, content: '"山"字共有几画？', answer: '3 画', options: ['2 画','3 画','4 画','5 画'], image: null, mastery: 'mastered', addedAt: '2026-07-01', reviewDates: ['2026-07-02','2026-07-04','2026-07-07','2026-07-10'], reviewCount: 4 },
    { id: 15, subject: '语文', topic: '近义词', grade: 4, content: '"美丽"的近义词是？', answer: '漂亮', options: ['华丽','漂亮','美观','美丽'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 16, subject: '语文', topic: '反义词', grade: 3, content: '"黑暗"的反义词是？', answer: '光明', options: ['明亮','光明','白天','阳光'], image: null, mastery: 'new', addedAt: '2026-07-09', reviewDates: [], reviewCount: 0 },
    // ---- 英语（单词）----
    { id: 17, subject: '英语', topic: '颜色单词', grade: 3, content: '"绿色"的英文是什么？', answer: 'green', options: ['great','green','grey','grand'], image: null, mastery: 'new', addedAt: '2026-07-08', reviewDates: [], reviewCount: 0 },
    { id: 18, subject: '英语', topic: '动物单词', grade: 3, content: '"大象"的英文是什么？', answer: 'elephant', options: ['elephant','elegant','element','electric'], image: null, mastery: 'reviewing', addedAt: '2026-07-06', reviewDates: ['2026-07-07','2026-07-09'], reviewCount: 2 },
    { id: 19, subject: '英语', topic: '数字单词', grade: 3, content: '"十二"的英文是什么？', answer: 'twelve', options: ['twelve','twenty','two','twin'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 20, subject: '英语', topic: '食物单词', grade: 4, content: '"面包"的英文是什么？', answer: 'bread', options: ['break','bread','bride','brand'], image: null, mastery: 'new', addedAt: '2026-07-09', reviewDates: [], reviewCount: 0 },
    { id: 21, subject: '英语', topic: '日常用语', grade: 3, content: '"How are you?" 应该怎么回答？', answer: "I'm fine, thank you.", options: ['I am five.','I\'m fine, thank you.','I have five.','My name is fine.'], image: null, mastery: 'reviewing', addedAt: '2026-07-05', reviewDates: ['2026-07-06','2026-07-08'], reviewCount: 2 },
    { id: 22, subject: '英语', topic: '身体部位', grade: 3, content: '"肩膀"的英文是什么？', answer: 'shoulder', options: ['should','shoulder','soldier','sholder'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 23, subject: '英语', topic: '动词过去式', grade: 5, content: '"go" 的过去式是什么？', answer: 'went', options: ['goed','went','goes','going'], image: null, mastery: 'new', addedAt: '2026-07-10', reviewDates: [], reviewCount: 0 },
    { id: 24, subject: '英语', topic: '方位介词', grade: 4, content: '"在……旁边" 用哪个介词？', answer: 'beside', options: ['beside','behind','below','between'], image: null, mastery: 'new', addedAt: '2026-07-09', reviewDates: [], reviewCount: 0 },
  ],

  // ===== 知识点分类 =====
  topics: {
    '数学': ['乘法口诀', '两位数乘法', '应用题-行程', '分数基础', '面积计算', '应用题-购物', '除法', '应用题-时间'],
    '语文': ['形近字辨析', '多音字', '成语填空', '同音字辨析', '部首查字', '笔顺', '近义词', '反义词'],
    '英语': ['颜色单词', '动物单词', '数字单词', '食物单词', '日常用语', '身体部位', '动词过去式', '方位介词']
  },

  // ===== 等级系统 =====
  levels: [
    { level: 1, name: '太空学徒', minPoints: 0, icon: '🌟' },
    { level: 2, name: '星际学员', minPoints: 100, icon: '⭐' },
    { level: 3, name: '宇宙战士', minPoints: 300, icon: '💫' },
    { level: 4, name: '银河猎人', minPoints: 600, icon: '🚀' },
    { level: 5, name: '错题消灭王', minPoints: 1000, icon: '👑' },
  ],

  // ===== 成就系统 =====
  achievements: [
    { id: 'first_upload', name: '初次上传', desc: '第一次上传错题图片', icon: '📸', unlocked: false, condition: (s) => s.mistakes.length > 0 },
    { id: 'first_game', name: '游戏新手', desc: '完成第一次闯关游戏', icon: '🎮', unlocked: false, condition: (s) => s.stats.gamesPlayed > 0 },
    { id: 'streak_3', name: '三天坚持', desc: '连续 3 天使用', icon: '🔥', unlocked: false, condition: (s) => s.stats.streak >= 3 },
    { id: 'streak_7', name: '一周勇士', desc: '连续 7 天使用', icon: '💪', unlocked: false, condition: (s) => s.stats.streak >= 7 },
    { id: 'mistakes_10', name: '消灭十题', desc: '累计消灭 10 道错题', icon: '🎯', unlocked: false, condition: (s) => s.stats.mistakesMastered >= 10 },
    { id: 'mistakes_50', name: '错题克星', desc: '累计消灭 50 道错题', icon: '⚡', unlocked: false, condition: (s) => s.stats.mistakesMastered >= 50 },
    { id: 'math_master', name: '数学小达人', desc: '消灭 5 道数学错题', icon: '🧮', unlocked: false, condition: (s) => s.stats.subjectsMastered.数学 >= 5 },
    { id: 'chinese_master', name: '汉字小专家', desc: '消灭 5 道语文错题', icon: '📖', unlocked: false, condition: (s) => s.stats.subjectsMastered.语文 >= 5 },
    { id: 'english_master', name: '单词小能手', desc: '消灭 5 道英语错题', icon: '🔤', unlocked: false, condition: (s) => s.stats.subjectsMastered.英语 >= 5 },
    { id: 'points_500', name: '积分收藏家', desc: '累计获得 500 积分', icon: '💎', unlocked: false, condition: (s) => s.stats.totalPointsEarned >= 500 },
    { id: 'combo_5', name: '连击高手', desc: '一站到底中连击 5 题', icon: '🔥', unlocked: false, condition: (s) => s.stats.maxCombo >= 5 },
    { id: 'all_subjects', name: '全科达人', desc: '三个学科各消灭至少 3 道错题', icon: '🏆', unlocked: false, condition: (s) => s.stats.subjectsMastered.数学 >= 3 && s.stats.subjectsMastered.语文 >= 3 && s.stats.subjectsMastered.英语 >= 3 },
  ],

  // ===== 积分商城 =====
  shopItems: [
    { id: 'pencil_set', name: '铅笔套装', desc: '12 支彩色铅笔', cost: 50, icon: 'pencil', redeemed: false },
    { id: 'eraser', name: '卡通橡皮擦', desc: '水果造型的可爱橡皮', cost: 30, icon: 'gift', redeemed: false },
    { id: 'notebook', name: '故事书', desc: '一本精彩的故事书', cost: 200, icon: 'book', redeemed: false },
    { id: 'pencil_case', name: '文具盒', desc: '太空主题文具盒', cost: 150, icon: 'gift', redeemed: false },
    { id: 'crayons', name: '彩笔套装', desc: '24 色水彩笔', cost: 100, icon: 'pencil', redeemed: false },
    { id: 'backpack', name: '太空书包', desc: '限量版橡皮侠书包', cost: 500, icon: 'gift', redeemed: false },
    { id: 'sticker', name: '贴纸包', desc: '错题大作战主题贴纸', cost: 20, icon: 'star', redeemed: false },
    { id: 'bookmark', name: '书签', desc: '精美的太空书签', cost: 15, icon: 'star', redeemed: false },
  ],

  // ===== 遗忘曲线复习间隔（天）=====
  forgettingCurve: [1, 3, 7, 15, 30],

  // ===== 等级称号颜色 =====
  subjectColors: {
    '数学': { bg: '#FF9F43', text: '#fff', light: 'rgba(255,159,67,.15)' },
    '语文': { bg: '#FF6B6B', text: '#fff', light: 'rgba(255,107,107,.15)' },
    '英语': { bg: '#4D7CFF', text: '#fff', light: 'rgba(77,124,255,.15)' },
  }
};

// ===== 默认用户状态 =====
function getDefaultState() {
  return {
    user: { nickname: '', grade: 3 },
    points: 1280,
    totalPointsEarned: 1280,
    level: 3,
    mistakes: JSON.parse(JSON.stringify(APP_DATA.mistakes)),
    achievements: APP_DATA.achievements.map(a => ({ ...a })),
    shopItems: APP_DATA.shopItems.map(s => ({ ...s })),
    stats: {
      gamesPlayed: 2,
      streak: 3,
      lastActiveDate: '2026-07-13',
      mistakesMastered: 5,
      totalAnswered: 38,
      correctAnswered: 30,
      maxCombo: 4,
      subjectsMastered: { '数学': 2, '语文': 2, '英语': 1 },
      weeklyPoints: [80, 120, 60, 200, 150, 100, 180], // 最近 7 天
      dailyReviewDone: 2,
      dailyReviewTotal: 5,
    },
    reviewQueue: APP_DATA.mistakes
      .filter(m => m.mastery !== 'mastered')
      .slice(0, 5)
      .map(m => m.id),
  };
}

// ===== 存取函数 =====
function loadState() {
  try {
    const saved = localStorage.getItem('cuodazhan_state');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return getDefaultState();
}

function saveState(state) {
  try {
    localStorage.setItem('cuodazhan_state', JSON.stringify(state));
  } catch (e) {}
}

function resetState() {
  localStorage.removeItem('cuodazhan_state');
  return getDefaultState();
}