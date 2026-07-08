/**
 * 智学通 Demo V3.0 - 核心应用逻辑
 * AI成长任务系统 · BKT算法 · Ebbinghaus遗忘曲线 · RPG成长地图
 */

// ===== 全局状态 =====
var App = {
  // 知识点掌握度 (BKT 模拟)
  knowledgePoints: {
    '函数与导数': { mastery: 75, total: 120, correct: 90, subject: '数学' },
    '解析几何':   { mastery: 42, total: 80,  correct: 34, subject: '数学' },
    '立体几何':   { mastery: 58, total: 65,  correct: 38, subject: '数学' },
    '概率统计':   { mastery: 68, total: 70,  correct: 48, subject: '数学' },
    '数列':       { mastery: 82, total: 55,  correct: 45, subject: '数学' },
    '三角函数':   { mastery: 71, total: 48,  correct: 34, subject: '数学' },
    '不等式':     { mastery: 55, total: 40,  correct: 22, subject: '数学' },
    '向量':       { mastery: 63, total: 35,  correct: 22, subject: '数学' }
  },

  // 学习统计
  stats: {
    totalQuestions: 486,
    todayQuestions: 156,
    weekAccuracy: 78,
    totalAccuracy: 76,
    streakDays: 23,
    masteredPoints: 15
  },

  // 错题本
  wrongQuestions: [],

  // 复习任务
  reviewTasks: [],

  // 刷题/任务状态
  quiz: {
    active: false,
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    startTime: 0,
    timerInterval: null,
    mode: 'adaptive',      // adaptive | weak | review | challenge | task
    taskKp: null,          // V3.0: 当前任务知识点
    taskTotal: 5,          // V3.0: 任务题目数
    startMastery: 0,       // V3.0: 任务开始前掌握度（结果页用）
    startScore: 92         // V3.0: 任务开始前预测分数
  },

  // 图表实例
  charts: {}
};

// ===== 题库 =====
var QuestionBank = [
  // 函数与导数
  { id: 1, kp: '函数与导数', difficulty: 2, question: '函数 f(x) = x³ - 3x + 1 的极小值为？', options: ['-1', '0', '1', '-2'], answer: 0, explanation: 'f\'(x) = 3x² - 3 = 0，解得 x = ±1。f\'\'(1) = 6 > 0，故 x=1 为极小值点，f(1) = 1 - 3 + 1 = -1。' },
  { id: 2, kp: '函数与导数', difficulty: 3, question: '若 f(x) = ln(x) - ax 在 x=1 处取极大值，则 a = ？', options: ['0', '1', 'e', '1/e'], answer: 1, explanation: 'f\'(x) = 1/x - a，f\'(1) = 1 - a = 0，故 a = 1。验证 f\'\'(1) = -1 < 0，确为极大值。' },
  { id: 3, kp: '函数与导数', difficulty: 2, question: '函数 y = e^x 在 x=0 处的切线方程为？', options: ['y = x + 1', 'y = x', 'y = 1', 'y = x - 1'], answer: 0, explanation: 'y\' = e^x，k = y\'(0) = 1。切点 (0, 1)，切线方程：y - 1 = 1(x - 0)，即 y = x + 1。' },
  { id: 4, kp: '函数与导数', difficulty: 1, question: '函数 f(x) = 2x² - 4x 的单调递增区间为？', options: ['(-∞, 1)', '(1, +∞)', '(-∞, 2)', '(2, +∞)'], answer: 1, explanation: 'f\'(x) = 4x - 4 = 4(x-1)，当 x > 1 时 f\'(x) > 0，故单调递增区间为 (1, +∞)。' },

  // 解析几何
  { id: 5, kp: '解析几何', difficulty: 2, question: '椭圆 x²/4 + y²/9 = 1 的焦点坐标为？', options: ['(±2, 0)', '(±√5, 0)', '(0, ±√5)', '(0, ±2)'], answer: 2, explanation: 'a²=9, b²=4，c²=a²-b²=5。焦点在 y 轴上，坐标为 (0, ±√5)。' },
  { id: 6, kp: '解析几何', difficulty: 3, question: '双曲线 x²/9 - y²/16 = 1 的渐近线方程为？', options: ['y = ±(3/4)x', 'y = ±(4/3)x', 'y = ±(3/5)x', 'y = ±(4/5)x'], answer: 1, explanation: 'a²=9, b²=16，渐近线 y = ±(b/a)x = ±(4/3)x。' },
  { id: 7, kp: '解析几何', difficulty: 2, question: '抛物线 y² = 8x 的焦点到准线的距离为？', options: ['2', '4', '6', '8'], answer: 1, explanation: '2p = 8，p = 4。焦点到准线距离为 p = 4。' },
  { id: 8, kp: '解析几何', difficulty: 1, question: '圆 (x-1)² + (y+2)² = 9 的圆心和半径为？', options: ['(1,-2), 3', '(1,2), 3', '(-1,2), 9', '(1,-2), 9'], answer: 0, explanation: '标准方程 (x-a)² + (y-b)² = r²，圆心 (a,b) = (1,-2)，半径 r = 3。' },

  // 立体几何
  { id: 9, kp: '立体几何', difficulty: 2, question: '正方体 ABCD-A₁B₁C₁D₁ 中，异面直线 AB 与 B₁C₁ 所成角为？', options: ['30°', '45°', '60°', '90°'], answer: 3, explanation: 'AB 与 B₁C₁ 互相垂直。将 B₁C₁ 平移至 BC₁，则 AB ⊥ BC₁（因为 AB ⊥ 面 BCC₁B₁），所成角为 90°。' },
  { id: 10, kp: '立体几何', difficulty: 3, question: '球的体积为 36π，则球的半径为？', options: ['2', '3', '4', '6'], answer: 1, explanation: 'V = (4/3)πr³ = 36π，r³ = 27，r = 3。' },
  { id: 11, kp: '立体几何', difficulty: 2, question: '圆锥的底面半径为 3，高为 4，则母线长为？', options: ['3', '4', '5', '6'], answer: 2, explanation: '母线 l = √(r² + h²) = √(9 + 16) = √25 = 5。' },

  // 概率统计
  { id: 12, kp: '概率统计', difficulty: 1, question: '掷两枚骰子，点数之和为 7 的概率为？', options: ['1/6', '1/8', '1/12', '1/4'], answer: 0, explanation: '总结果 36 种，和为 7 的组合有 (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) 共 6 种，P = 6/36 = 1/6。' },
  { id: 13, kp: '概率统计', difficulty: 2, question: '数据 2,4,4,5,6,8 的中位数为？', options: ['4', '4.5', '5', '5.5'], answer: 1, explanation: '共 6 个数据，中位数为第 3、4 个数据的平均值：(4+5)/2 = 4.5。' },
  { id: 14, kp: '概率统计', difficulty: 2, question: '正态分布 N(μ, σ²) 中，σ 表示？', options: ['均值', '方差', '标准差', '中位数'], answer: 2, explanation: '在 N(μ, σ²) 中，μ 是均值，σ² 是方差，σ 是标准差。' },

  // 数列
  { id: 15, kp: '数列', difficulty: 1, question: '等差数列 2,5,8,11,... 的第 10 项为？', options: ['29', '30', '31', '32'], answer: 0, explanation: 'a₁=2, d=3, a₁₀ = a₁ + 9d = 2 + 27 = 29。' },
  { id: 16, kp: '数列', difficulty: 2, question: '等比数列首项为 1，公比为 2，前 5 项和为？', options: ['15', '31', '32', '63'], answer: 1, explanation: 'S₅ = a₁(qⁿ-1)/(q-1) = 1×(2⁵-1)/(2-1) = 31。' },
  { id: 17, kp: '数列', difficulty: 3, question: '数列 {aₙ} 满足 a₁=1, aₙ₊₁ = 2aₙ+1，则 a₄ = ？', options: ['7', '15', '31', '63'], answer: 1, explanation: 'a₁=1, a₂=2×1+1=3, a₃=2×3+1=7, a₄=2×7+1=15。' },

  // 三角函数
  { id: 18, kp: '三角函数', difficulty: 1, question: 'sin30° + cos60° 的值为？', options: ['1/2', '1', '√3/2', '0'], answer: 1, explanation: 'sin30° = 1/2, cos60° = 1/2, 所以 sin30° + cos60° = 1/2 + 1/2 = 1。' },
  { id: 19, kp: '三角函数', difficulty: 2, question: '函数 y = sin(2x) 的最小正周期为？', options: ['π/2', 'π', '2π', '4π'], answer: 1, explanation: 'T = 2π/ω = 2π/2 = π。' },

  // 不等式
  { id: 20, kp: '不等式', difficulty: 2, question: '不等式 x² - 5x + 6 < 0 的解集为？', options: ['(-∞, 2)∪(3, +∞)', '(2, 3)', '(-∞, 3)', '(2, +∞)'], answer: 1, explanation: 'x²-5x+6=(x-2)(x-3)<0，解集为 (2, 3)。' },

  // 向量
  { id: 21, kp: '向量', difficulty: 1, question: '向量 a=(1,2), b=(3,1)，则 a·b = ？', options: ['3', '5', '7', '6'], answer: 1, explanation: 'a·b = 1×3 + 2×1 = 5。' },
  { id: 22, kp: '向量', difficulty: 2, question: '向量 a=(1,2) 的模 |a| 为？', options: ['√3', '√5', '3', '5'], answer: 1, explanation: '|a| = √(1² + 2²) = √5。' }
];

// ===== 初始错题数据（含AI归因） =====
var initialWrongQuestions = [
  { id: 101, questionId: 5, kp: '解析几何', question: '椭圆 x²/4 + y²/9 = 1 的焦点坐标为？', wrongAnswer: '(±2, 0)', correctAnswer: '(0, ±√5)', time: '2026-06-17', status: 'pending', reviewCount: 0, cause: '焦点位置判断' },
  { id: 102, questionId: 6, kp: '解析几何', question: '双曲线 x²/9 - y²/16 = 1 的渐近线方程为？', wrongAnswer: 'y = ±(3/4)x', correctAnswer: 'y = ±(4/3)x', time: '2026-06-17', status: 'pending', reviewCount: 0, cause: '公式混淆' },
  { id: 103, questionId: 9, kp: '立体几何', question: '正方体中异面直线 AB 与 B₁C₁ 所成角为？', wrongAnswer: '45°', correctAnswer: '90°', time: '2026-06-16', status: 'pending', reviewCount: 1, cause: '空间想象不足' },
  { id: 104, questionId: 2, kp: '函数与导数', question: '若 f(x) = ln(x) - ax 在 x=1 处取极大值，则 a = ？', wrongAnswer: '0', correctAnswer: '1', time: '2026-06-16', status: 'pending', reviewCount: 0, cause: '极值条件遗漏' },
  { id: 105, questionId: 17, kp: '数列', question: 'a₁=1, aₙ₊₁ = 2aₙ+1，则 a₄ = ？', wrongAnswer: '7', correctAnswer: '15', time: '2026-06-15', status: 'pending', reviewCount: 1, cause: '递推计算错误' },
  { id: 106, questionId: 20, kp: '不等式', question: '不等式 x² - 5x + 6 < 0 的解集为？', wrongAnswer: '(-∞, 2)∪(3, +∞)', correctAnswer: '(2, 3)', time: '2026-06-15', status: 'pending', reviewCount: 0, cause: '不等号方向混淆' },
  { id: 107, questionId: 10, kp: '立体几何', question: '球的体积为 36π，则球的半径为？', wrongAnswer: '2', correctAnswer: '3', time: '2026-06-14', status: 'mastered', reviewCount: 3, cause: '公式记忆' },
  { id: 108, questionId: 13, kp: '概率统计', question: '数据 2,4,4,5,6,8 的中位数为？', wrongAnswer: '4', correctAnswer: '4.5', time: '2026-06-14', status: 'mastered', reviewCount: 2, cause: '中位数定义' }
];

// ===== 初始复习任务 =====
var initialReviewTasks = [
  { id: 1, kp: '解析几何', questionCount: 5, reviewDay: '今天', interval: '第1次复习', status: 'pending', urgency: 'high' },
  { id: 2, kp: '函数与导数', questionCount: 3, reviewDay: '今天', interval: '第2次复习', status: 'pending', urgency: 'medium' },
  { id: 3, kp: '立体几何', questionCount: 4, reviewDay: '今天', interval: '第3次复习', status: 'pending', urgency: 'medium' },
  { id: 4, kp: '数列', questionCount: 3, reviewDay: '明天', interval: '第1次复习', status: 'upcoming', urgency: 'low' },
  { id: 5, kp: '概率统计', questionCount: 2, reviewDay: '后天', interval: '第2次复习', status: 'upcoming', urgency: 'low' },
  { id: 6, kp: '三角函数', questionCount: 4, reviewDay: '3天后', interval: '第4次复习', status: 'upcoming', urgency: 'low' }
];

// ===== BKT 算法模拟 =====
function bktUpdate(kpName, isCorrect) {
  var kp = App.knowledgePoints[kpName];
  if (!kp) return;

  // BKT 参数
  var pKnown = kp.mastery / 100;     // 当前掌握概率
  var pTransit = 0.1;                 // 学习迁移概率
  var pSlip = 0.1;                    // 失误概率
  var pGuess = 0.2;                   // 猜对概率

  var pCorrectGivenKnown = (1 - pSlip);
  var pCorrectGivenUnknown = pGuess;

  if (isCorrect) {
    // 答对：后验概率更新
    var pKnownGivenCorrect = (pKnown * pCorrectGivenKnown) /
      (pKnown * pCorrectGivenKnown + (1 - pKnown) * pCorrectGivenUnknown);
    // 加入学习迁移
    pKnown = pKnownGivenCorrect + (1 - pKnownGivenCorrect) * pTransit;
  } else {
    // 答错：后验概率更新
    var pKnownGivenWrong = (pKnown * pSlip) /
      (pKnown * pSlip + (1 - pKnown) * (1 - pGuess));
    pKnown = pKnownGivenWrong + (1 - pKnownGivenWrong) * pTransit;
  }

  // 限制范围
  pKnown = Math.max(0.05, Math.min(0.98, pKnown));
  kp.mastery = Math.round(pKnown * 100);
  kp.total++;

  if (isCorrect) {
    kp.correct++;
  }
}

// ===== 自适应出题算法 =====
function selectQuestions(mode, taskKp) {
  var pool = QuestionBank.slice();
  var selected = [];

  if (mode === 'task' && taskKp) {
    // V3.0 任务模式：选择指定知识点的题目
    pool = pool.filter(function(q) { return q.kp === taskKp; });
    // 如果该知识点题目不足，从相近知识点补充
    if (pool.length < App.quiz.taskTotal) {
      var used = pool.map(function(q) { return q.id; });
      var extra = QuestionBank.filter(function(q) { return used.indexOf(q.id) === -1; });
      extra = shuffleArray(extra);
      pool = pool.concat(extra.slice(0, App.quiz.taskTotal - pool.length));
    }
    pool = shuffleArray(pool);
    return pool.slice(0, App.quiz.taskTotal);
  }

  if (mode === 'weak') {
    // 薄弱点突破：选择掌握度最低的知识点题目
    var sortedKps = Object.keys(App.knowledgePoints).sort(function(a, b) {
      return App.knowledgePoints[a].mastery - App.knowledgePoints[b].mastery;
    });
    var weakKps = sortedKps.slice(0, 3);
    pool = pool.filter(function(q) { return weakKps.indexOf(q.kp) !== -1; });
  } else if (mode === 'review') {
    // 复习模式：选择掌握度 55-85 的知识点
    pool = pool.filter(function(q) {
      var m = App.knowledgePoints[q.kp].mastery;
      return m >= 55 && m <= 85;
    });
  } else if (mode === 'challenge') {
    // 挑战模式：选择掌握度较高的知识点，难度较高的题
    pool = pool.filter(function(q) {
      return App.knowledgePoints[q.kp].mastery >= 60 && q.difficulty >= 2;
    });
  } else {
    // 自适应模式：优先推送掌握度 60% 左右的题目（最近发展区）
    pool.sort(function(a, b) {
      var diffA = Math.abs(App.knowledgePoints[a.kp].mastery - 60);
      var diffB = Math.abs(App.knowledgePoints[b.kp].mastery - 60);
      return diffA - diffB;
    });
  }

  // 打乱并选取
  pool = shuffleArray(pool);
  selected = pool.slice(0, 10);

  // 如果不足 10 题，补充其他题目
  if (selected.length < 10) {
    var usedIds = selected.map(function(q) { return q.id; });
    var extra2 = QuestionBank.filter(function(q) { return usedIds.indexOf(q.id) === -1; });
    extra2 = shuffleArray(extra2);
    selected = selected.concat(extra2.slice(0, 10 - selected.length));
  }

  return selected;
}

function shuffleArray(arr) {
  var result = arr.slice();
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

// ===== 页面切换 =====
function switchPage(pageName, tabEl) {
  // 切换页面
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }
  document.getElementById('page-' + pageName).classList.add('active');

  // 切换 tab
  var tabs = document.querySelectorAll('.tab-item');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.remove('active');
  }
  if (tabEl) tabEl.classList.add('active');

  // 切换状态栏颜色（有彩色头部的页面用深色状态栏）
  var statusBar = document.getElementById('statusBar');
  if (pageName === 'home' || pageName === 'roadmap' || pageName === 'review' || pageName === 'wrong' || pageName === 'profile') {
    statusBar.classList.add('dark');
  } else {
    statusBar.classList.remove('dark');
  }

  // 滚动到顶部
  document.getElementById('contentArea').scrollTop = 0;

  // 页面初始化
  if (pageName === 'home') initHomePage();
  if (pageName === 'roadmap') initRoadmapPage();
  if (pageName === 'quiz') initQuizPage();
  if (pageName === 'wrong') initWrongPage();
  if (pageName === 'review') initReviewPage();
  if (pageName === 'profile') initProfilePage();
}

// ===== 首页：AI学习战略官 V3.0 =====
function initHomePage() {
  renderRadarChart();
}

function renderRadarChart() {
  var container = document.getElementById('chart-radar');
  if (!container) return;

  if (App.charts.radar) App.charts.radar.dispose();

  App.charts.radar = echarts.init(container, null, { renderer: 'svg' });

  var kpNames = Object.keys(App.knowledgePoints);
  var values = kpNames.map(function(k) { return App.knowledgePoints[k].mastery; });

  App.charts.radar.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    radar: {
      indicator: kpNames.map(function(k) { return { name: k, max: 100 }; }),
      shape: 'polygon',
      splitNumber: 4,
      radius: '65%',
      axisName: { color: '#6366F1', fontSize: 10 },
      splitLine: { lineStyle: { color: '#E0E7FF' } },
      splitArea: { areaStyle: { color: ['#FFFFFF', '#EEF2FF'] } },
      axisLine: { lineStyle: { color: '#E0E7FF' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '掌握度',
        lineStyle: { width: 2, color: '#4F46E5' },
        itemStyle: { color: '#4F46E5' },
        areaStyle: { color: 'rgba(79,70,229,0.2)' }
      }]
    }]
  });
}

// ===== 成长地图页：RPG成长地图 V3.0 =====
function initRoadmapPage() {
  renderRPGMap();
}

function renderRPGMap() {
  var container = document.getElementById('rpgMap');
  if (!container) return;

  // RPG节点数据：目标在顶部，从弱到强排列
  var nodes = [
    { name: '解析几何',   mastery: 42, status: 'current', estDays: '7天',  estGain: '+8~12分', rate: '83%' },
    { name: '不等式',     mastery: 55, status: 'pending', estDays: '4天',  estGain: '+4分',    rate: '78%' },
    { name: '立体几何',   mastery: 58, status: 'pending', estDays: '6天',  estGain: '+5分',    rate: '75%' },
    { name: '向量',       mastery: 63, status: 'pending', estDays: '5天',  estGain: '+3分',    rate: '80%' },
    { name: '概率统计',   mastery: 68, status: 'done',    estDays: '-',    estGain: '+4分',    rate: '88%' },
    { name: '三角函数',   mastery: 71, status: 'done',    estDays: '-',    estGain: '+2分',    rate: '90%' },
    { name: '函数与导数', mastery: 75, status: 'done',    estDays: '-',    estGain: '+3分',    rate: '95%' },
    { name: '数列',       mastery: 82, status: 'done',    estDays: '-',    estGain: '+2分',    rate: '92%' }
  ];

  var statusText = { done: '已掌握', current: '推荐突破', pending: '待突破' };
  var barColor = { done: 'var(--success)', current: 'var(--warning)', pending: 'var(--muted-light)' };

  var html = '';

  // 顶部目标
  html += '<div class="rpg-goal">' +
    '<div class="rpg-goal-icon">🏆</div>' +
    '<div class="rpg-goal-title">数学 120+</div>' +
    '<div class="rpg-goal-sub">当前预测 101 · 还差 19 分</div>' +
  '</div>';

  // 节点（从弱到强，current在最上方）
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var dotContent = n.status === 'done'
      ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
      : (n.status === 'current'
        ? '<svg viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'
        : (i + 1));

    html += '<div class="rpg-node ' + n.status + '">' +
      '<div class="rpg-node-dot">' + dotContent + '</div>' +
      '<div class="rpg-node-content">' +
        '<div class="rpg-node-name">' +
          '<span>' + n.name + '</span>' +
          '<span class="rpg-node-badge">' + statusText[n.status] + '</span>' +
        '</div>' +
        '<div class="rpg-node-bar"><div class="rpg-node-bar-fill" style="width:' + n.mastery + '%;background:' + barColor[n.status] + ';"></div></div>' +
        '<div class="rpg-node-stats">' +
          '<span class="rpg-node-stat">掌握度 <strong>' + n.mastery + '%</strong></span>';

    if (n.status !== 'done') {
      html += '<span class="rpg-node-stat"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>预计 <strong>' + n.estDays + '</strong></span>';
    }

    html += '<span class="rpg-node-stat gain"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>收益 <strong>' + n.estGain + '</strong></span>';

    if (n.status !== 'done') {
      html += '<span class="rpg-node-stat rate"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>成功率 <strong>' + n.rate + '</strong></span>';
    }

    html += '</div>';

    // 当前推荐突破的节点添加按钮
    if (n.status === 'current') {
      html += '<button class="rpg-break-btn" onclick="startTask(\'' + n.name + '\',\'weak\')">' +
        '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '开始突破' +
      '</button>';
    }

    html += '</div></div>';
  }

  container.innerHTML = html;
}

// ===== 刷题页：任务逻辑 V3.0 =====
function initQuizPage() {
  // 如果不在刷题中，显示开始界面
  if (!App.quiz.active) {
    document.getElementById('quizStartScreen').style.display = 'block';
    document.getElementById('quizPlayScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'none';
    renderQuizOverview();
  }
}

function renderQuizOverview() {
  var container = document.getElementById('quizOverview');
  if (!container) return;
  var sorted = Object.keys(App.knowledgePoints).sort(function(a, b) {
    return App.knowledgePoints[a].mastery - App.knowledgePoints[b].mastery;
  });

  var html = '';
  for (var i = 0; i < sorted.length; i++) {
    var name = sorted[i];
    var kp = App.knowledgePoints[name];
    var color = kp.mastery < 50 ? 'var(--danger)' : (kp.mastery < 70 ? 'var(--warning)' : 'var(--success)');
    var label = kp.mastery < 50 ? '薄弱' : (kp.mastery < 70 ? '提升中' : '已掌握');
    html += '<div class="kp-item">' +
      '<span class="kp-name">' + name + '</span>' +
      '<span style="font-size:11px;color:' + color + ';width:50px;">' + label + '</span>' +
      '<div class="kp-bar"><div class="kp-bar-fill" style="width:' + kp.mastery + '%;background:' + color + '"></div></div>' +
      '<span class="kp-value" style="color:' + color + '">' + kp.mastery + '%</span>' +
      '</div>';
  }
  container.innerHTML = html;
}

// V3.0: 启动任务（从首页/路线图调用）
function startTask(kpName, mode) {
  App.quiz.mode = mode || 'weak';
  App.quiz.taskKp = kpName;
  App.quiz.taskTotal = 5;

  // 更新任务标题和副标题
  var taskTitle = document.getElementById('taskTitle');
  var taskSub = document.getElementById('taskSub');
  if (taskTitle) taskTitle.textContent = kpName + '突破';
  if (taskSub) {
    var kp = App.knowledgePoints[kpName];
    if (kp) {
      taskSub.textContent = '当前掌握度 ' + kp.mastery + '% · AI智能生成任务';
    }
  }

  // 导航到刷题页（tab索引: 0=首页, 1=成长地图, 2=任务, 3=错题, 4=复习, 5=成长）
  switchPage('quiz', document.querySelectorAll('.tab-item')[2]);
}

function beginQuiz() {
  App.quiz.active = true;

  // V3.0: 如果有任务知识点，使用任务模式出题
  if (App.quiz.taskKp) {
    App.quiz.questions = selectQuestions('task', App.quiz.taskKp);
  } else {
    App.quiz.questions = selectQuestions(App.quiz.mode);
  }

  App.quiz.currentIndex = 0;
  App.quiz.correctCount = 0;
  App.quiz.startTime = Date.now();

  // 记录任务开始前的掌握度（结果页展示用）
  if (App.quiz.taskKp && App.knowledgePoints[App.quiz.taskKp]) {
    App.quiz.startMastery = App.knowledgePoints[App.quiz.taskKp].mastery;
  }

  document.getElementById('quizStartScreen').style.display = 'none';
  document.getElementById('quizPlayScreen').style.display = 'block';
  document.getElementById('quizResultScreen').style.display = 'none';

  // 启动计时器
  if (App.quiz.timerInterval) clearInterval(App.quiz.timerInterval);
  App.quiz.timerInterval = setInterval(updateTimer, 1000);

  renderQuestion();
}

function updateTimer() {
  var elapsed = Math.floor((Date.now() - App.quiz.startTime) / 1000);
  var min = Math.floor(elapsed / 60).toString().padStart(2, '0');
  var sec = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById('quizTimer').textContent = min + ':' + sec;
}

// ===== 渲染题目（含AI推荐理由 + 任务进度条） =====
function renderQuestion() {
  var q = App.quiz.questions[App.quiz.currentIndex];
  if (!q) return;

  var total = App.quiz.questions.length;
  var progressText = '任务进度 ' + (App.quiz.currentIndex + 1) + ' / ' + total;
  document.getElementById('quizProgressText').textContent = progressText;

  // V3.0: 更新任务进度条
  var progressBar = document.getElementById('taskProgressBar');
  if (progressBar) {
    var progress = (App.quiz.currentIndex / total) * 100;
    progressBar.style.width = progress + '%';
  }

  var kp = App.knowledgePoints[q.kp];
  var difficultyText = q.difficulty === 1 ? '简单' : (q.difficulty === 2 ? '中等' : '较难');

  // 判断是否在最近发展区（掌握度 50-70%）
  var inZPD = kp.mastery >= 50 && kp.mastery <= 70;
  var zpdText = inZPD ? '位于最近发展区，提分效率最高' : '巩固训练，强化记忆';
  var expectedGain = inZPD ? '+3%' : '+1%';

  // AI推荐理由面板
  var aiReasonHtml = '<div class="ai-reason">' +
    '<div class="ai-reason-title">' +
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
      'AI推荐理由' +
    '</div>' +
    '<div class="ai-reason-grid">' +
      '<div class="ai-reason-item">掌握度<strong>' + kp.mastery + '%</strong></div>' +
      '<div class="ai-reason-item">难度<strong>' + difficultyText + '</strong></div>' +
      '<div class="ai-reason-zone">' +
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>' +
        zpdText +
      '</div>' +
      '<div class="ai-reason-gain">预计掌握度提升 <strong>' + expectedGain + '</strong></div>' +
    '</div>' +
  '</div>';

  var html = aiReasonHtml +
    '<div class="quiz-question-card">' +
      '<div class="quiz-meta">' +
        '<span class="quiz-tag difficulty">难度: ' + difficultyText + '</span>' +
        '<span class="quiz-tag kp">' + q.kp + '</span>' +
        '<span class="quiz-tag mastery">掌握度: ' + kp.mastery + '%</span>' +
      '</div>' +
      '<div class="quiz-question">' + q.question + '</div>' +
      '<div class="quiz-options" id="quizOptions">';

  var letters = ['A', 'B', 'C', 'D'];
  for (var i = 0; i < q.options.length; i++) {
    html += '<div class="quiz-option" onclick="selectAnswer(' + i + ')" data-index="' + i + '">' +
      '<span class="option-letter">' + letters[i] + '</span>' +
      '<span>' + q.options[i] + '</span>' +
    '</div>';
  }

  html += '</div>' +
    '<div class="quiz-explanation" id="quizExplanation">' +
      '<h5><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> 解析</h5>' +
      '<p>' + q.explanation + '</p>' +
    '</div>' +
  '</div>';

  document.getElementById('quizBody').innerHTML = html;
}

var selectedAnswer = -1;
var answered = false;

function selectAnswer(index) {
  if (answered) return;
  answered = true;
  selectedAnswer = index;

  var q = App.quiz.questions[App.quiz.currentIndex];
  var isCorrect = index === q.answer;

  // 标记选项
  var options = document.querySelectorAll('.quiz-option');
  for (var i = 0; i < options.length; i++) {
    options[i].classList.add('disabled');
    if (i === q.answer) {
      options[i].classList.add('correct');
    } else if (i === index && !isCorrect) {
      options[i].classList.add('wrong');
    }
  }

  // 显示解析
  document.getElementById('quizExplanation').classList.add('show');

  // 更新 BKT
  var oldMastery = App.knowledgePoints[q.kp].mastery;
  bktUpdate(q.kp, isCorrect);
  var newMastery = App.knowledgePoints[q.kp].mastery;
  var change = newMastery - oldMastery;

  // 更新统计
  App.stats.totalQuestions++;
  App.stats.todayQuestions++;
  if (isCorrect) {
    App.quiz.correctCount++;
  } else {
    // 添加到错题本
    addWrongQuestion(q, q.options[index]);
  }

  // 显示反馈
  showFeedback(isCorrect, q.kp, oldMastery, newMastery, change);
}

// ===== 答题反馈（含AI学习建议） =====
function showFeedback(isCorrect, kpName, oldMastery, newMastery, change) {
  var existing = document.querySelector('.quiz-feedback');
  if (existing) existing.remove();

  var feedback = document.createElement('div');
  feedback.className = 'quiz-feedback show';

  var title = isCorrect ? '回答正确' : '回答错误';
  var titleClass = isCorrect ? 'correct' : 'wrong';
  var changeText = change >= 0 ? '+' + change + '%' : change + '%';
  var changeColor = change >= 0 ? 'var(--success)' : 'var(--danger)';

  var iconSvg = isCorrect
    ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // AI学习建议（根据答题情况和掌握度生成）
  var aiAdvice = '';
  if (isCorrect) {
    if (newMastery >= 80) {
      aiAdvice = '已基本掌握该知识点，建议挑战更高难度的题目以巩固优势。';
    } else if (newMastery >= 60) {
      aiAdvice = '答对啦！该知识点正在突破中，继续保持，预计再练3-5题即可稳固掌握。';
    } else {
      aiAdvice = '答对啦！该知识点仍有较大提升空间，建议结合错题本进行专项复习。';
    }
  } else {
    if (oldMastery >= 70) {
      aiAdvice = '偶尔失误，可能是计算或审题问题。建议回顾解题步骤，注意细节。';
    } else if (oldMastery >= 50) {
      aiAdvice = '存在知识漏洞，已将此题加入错题本。建议查看AI归因分析，针对性补强。';
    } else {
      aiAdvice = '该知识点掌握不足，已加入错题本。建议先复习基础概念，再重新挑战。';
    }
  }

  feedback.innerHTML =
    '<div class="feedback-header">' +
      '<div class="feedback-icon-wrap ' + titleClass + '">' + iconSvg + '</div>' +
      '<span class="feedback-title ' + titleClass + '">' + title + '</span>' +
    '</div>' +
    '<div class="feedback-mastery">' +
      '<div class="feedback-mastery-icon"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>' +
      '<span class="feedback-mastery-text">' + kpName + ' 掌握度：' + oldMastery + '% → ' + newMastery + '%</span>' +
      '<span class="feedback-mastery-value" style="color:' + changeColor + '">' + changeText + '</span>' +
    '</div>' +
    '<div class="feedback-ai">' +
      '<div class="feedback-ai-label">AI学习建议</div>' +
      '<div class="feedback-ai-text">' + aiAdvice + '</div>' +
    '</div>' +
    '<button class="quiz-next-btn" onclick="nextQuestion()">' +
      (App.quiz.currentIndex + 1 >= App.quiz.questions.length ? '查看任务结果' : '下一题') +
    '</button>';

  document.getElementById('page-quiz').appendChild(feedback);
}

function nextQuestion() {
  // 移除反馈
  var feedback = document.querySelector('.quiz-feedback');
  if (feedback) feedback.remove();

  answered = false;
  selectedAnswer = -1;

  App.quiz.currentIndex++;

  // V3.0: 更新任务进度条
  var total = App.quiz.questions.length;
  var progressBar = document.getElementById('taskProgressBar');
  if (progressBar) {
    var progress = (App.quiz.currentIndex / total) * 100;
    progressBar.style.width = progress + '%';
  }

  if (App.quiz.currentIndex >= App.quiz.questions.length) {
    // 任务完成，进度条满
    if (progressBar) progressBar.style.width = '100%';
    finishQuiz();
  } else {
    renderQuestion();
  }
}

// ===== 任务完成页 V3.0 =====
function finishQuiz() {
  App.quiz.active = false;
  clearInterval(App.quiz.timerInterval);

  var total = App.quiz.questions.length;
  var correct = App.quiz.correctCount;
  var accuracy = Math.round((correct / total) * 100);
  var elapsed = Math.floor((Date.now() - App.quiz.startTime) / 1000);
  var min = Math.floor(elapsed / 60);
  var sec = elapsed % 60;

  // 更新正确率
  App.stats.totalAccuracy = Math.round((App.stats.totalAccuracy * (total - 1) + accuracy) / total);
  App.stats.weekAccuracy = Math.round((App.stats.weekAccuracy * (total - 1) + accuracy) / total);

  document.getElementById('quizPlayScreen').style.display = 'none';
  var resultScreen = document.getElementById('quizResultScreen');
  resultScreen.style.display = 'block';

  // V3.0: 计算掌握度变化和成绩预测
  var kpName = App.quiz.taskKp || (App.quiz.questions[0] ? App.quiz.questions[0].kp : '数学');
  var endMastery = App.knowledgePoints[kpName] ? App.knowledgePoints[kpName].mastery : 0;
  var startMastery = App.quiz.startMastery || Math.max(0, endMastery - 5);
  var masteryChange = endMastery - startMastery;

  var startScore = App.quiz.startScore || 92;
  var scoreGain = Math.max(0, Math.round((masteryChange / 100) * 30));
  if (scoreGain < 1 && correct > 0) scoreGain = 2;
  if (correct === 0) scoreGain = 0;
  var endScore = startScore + scoreGain;

  // V3.0: 任务完成界面（成长感设计）
  resultScreen.innerHTML =
    '<div class="task-complete">' +
      '<div class="task-complete-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
      '<h3>' + kpName + '专项完成</h3>' +
      '<div class="task-complete-sub">恭喜完成今日提分任务</div>' +
      '<div class="task-result-card">' +
        '<div class="task-result-row"><span class="task-result-label">掌握度变化</span><span class="task-result-value success">' + startMastery + '% → ' + endMastery + '%</span></div>' +
        '<div class="task-result-row"><span class="task-result-label">预计成绩</span><span class="task-result-value gold">' + startScore + ' → ' + endScore + '</span></div>' +
        '<div class="task-result-row"><span class="task-result-label">答题正确率</span><span class="task-result-value">' + accuracy + '%</span></div>' +
        '<div class="task-result-row"><span class="task-result-label">用时</span><span class="task-result-value">' + min + '分' + sec + '秒</span></div>' +
      '</div>' +
      '<div class="summary-stats">' +
        '<div class="summary-stat"><div class="summary-stat-num" style="color:var(--primary)">' + total + '</div><div class="summary-stat-label">总题数</div></div>' +
        '<div class="summary-stat"><div class="summary-stat-num" style="color:var(--success)">' + correct + '</div><div class="summary-stat-label">答对</div></div>' +
        '<div class="summary-stat"><div class="summary-stat-num" style="color:var(--danger)">' + (total - correct) + '</div><div class="summary-stat-label">答错</div></div>' +
      '</div>' +
      '<button class="task-start-btn" onclick="resetTask()">' +
        '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' +
        '再来一组' +
      '</button>' +
      '<div style="margin-top:12px;"><button class="quiz-next-btn" style="background:var(--bg);color:var(--ink);border:1px solid var(--rule);box-shadow:none;" onclick="switchPage(\'home\', document.querySelectorAll(\'.tab-item\')[0])">返回首页</button></div>' +
    '</div>';
}

// V3.0: 重置任务状态，回到开始界面
function resetTask() {
  App.quiz.taskKp = null;
  App.quiz.startMastery = 0;
  initQuizPage();
}

function exitQuiz() {
  if (confirm('确定要退出本次任务吗？进度将不会保存。')) {
    App.quiz.active = false;
    clearInterval(App.quiz.timerInterval);
    // 重置进度条
    var progressBar = document.getElementById('taskProgressBar');
    if (progressBar) progressBar.style.width = '0%';
    initQuizPage();
  }
}

// ===== 错题本：AI错题诊断 =====
function initWrongPage() {
  App.wrongQuestions = initialWrongQuestions.slice();
  renderWrongList('all');
}

function renderWrongList(filter) {
  var container = document.getElementById('wrongList');
  var list = App.wrongQuestions;

  if (filter !== 'all') {
    list = list.filter(function(q) { return q.kp === filter; });
  }

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><p>暂无错题，继续保持</p></div>';
    return;
  }

  var html = '';
  for (var i = 0; i < list.length; i++) {
    var q = list[i];
    var statusClass = q.status === 'mastered' ? 'done' : 'pending';
    var statusText = q.status === 'mastered' ? '已攻克' : '待复习';
    var statusBg = q.status === 'mastered' ? 'var(--success-light)' : 'var(--warning-light)';
    var statusColor = q.status === 'mastered' ? 'var(--success)' : 'var(--warning)';
    var causeText = q.cause || '知识漏洞';

    html += '<div class="wrong-item" onclick="reviewWrongQuestion(' + q.id + ')">' +
      '<div class="wrong-item-question">' + (i + 1) + '. ' + q.question + '</div>' +
      '<div class="wrong-item-meta">' +
        '<span class="wrong-item-kp">' + q.kp + '</span>' +
        '<span class="wrong-item-cause">' + causeText + '</span>' +
        '<span class="wrong-item-status" style="background:' + statusBg + ';color:' + statusColor + ';">' + statusText + '</span>' +
      '</div>' +
      '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
        '<span style="font-size:12px;color:var(--danger);font-weight:600;">✗ ' + q.wrongAnswer + '</span>' +
        '<span style="font-size:12px;color:var(--muted);">→</span>' +
        '<span style="font-size:12px;color:var(--success);font-weight:600;">✓ ' + q.correctAnswer + '</span>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;
}

function filterWrong(kp, el) {
  var chips = document.querySelectorAll('#wrongFilter .subject-chip');
  for (var i = 0; i < chips.length; i++) chips[i].classList.remove('active');
  el.classList.add('active');
  renderWrongList(kp);
}

function reviewWrongQuestion(id) {
  var q = App.wrongQuestions.find(function(w) { return w.id === id; });
  if (!q) return;

  if (q.status === 'mastered') {
    showToast('该错题已攻克');
    return;
  }

  // 标记为已复习
  q.reviewCount++;
  if (q.reviewCount >= 2) {
    q.status = 'mastered';
    showToast('错题已攻克，掌握度提升');
  } else {
    showToast('已复习 ' + q.reviewCount + ' 次，再复习 ' + (2 - q.reviewCount) + ' 次即可攻克');
  }
  renderWrongList('all');
}

function addWrongQuestion(question, wrongAnswer) {
  var id = Date.now();
  // 根据知识点推断错误归因
  var causeMap = {
    '函数与导数': '导数应用',
    '解析几何': '公式应用',
    '立体几何': '空间想象',
    '概率统计': '概念理解',
    '数列': '递推计算',
    '三角函数': '公式记忆',
    '不等式': '解法选择',
    '向量': '坐标运算'
  };

  App.wrongQuestions.unshift({
    id: id,
    questionId: question.id,
    kp: question.kp,
    question: question.question,
    wrongAnswer: wrongAnswer,
    correctAnswer: question.options[question.answer],
    time: '2026-06-18',
    status: 'pending',
    reviewCount: 0,
    cause: causeMap[question.kp] || '知识漏洞'
  });
}

// ===== 复习页：AI预测 =====
function initReviewPage() {
  App.reviewTasks = initialReviewTasks.slice();
  renderReviewTasks();
  renderForgettingCurve();
  renderFutureReviews();
}

function renderReviewTasks() {
  var container = document.getElementById('reviewTaskList');
  var todayTasks = App.reviewTasks.filter(function(t) { return t.reviewDay === '今天'; });

  if (todayTasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><p>今日复习任务已完成</p></div>';
    return;
  }

  var html = '';
  for (var i = 0; i < todayTasks.length; i++) {
    var t = todayTasks[i];
    var iconBg = t.urgency === 'high' ? 'var(--danger-light)' : 'var(--warning-light)';
    var iconColor = t.urgency === 'high' ? 'var(--danger)' : 'var(--warning)';
    var iconSvg = t.urgency === 'high'
      ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>'
      : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    html += '<div class="review-task">' +
      '<div class="review-task-icon" style="background:' + iconBg + ';">' + iconSvg.replace('<svg ', '<svg style="stroke:' + iconColor + ';" ') + '</div>' +
      '<div class="review-task-body">' +
        '<h4>' + t.kp + '</h4>' +
        '<p>' + t.interval + ' · ' + t.questionCount + ' 题</p>' +
      '</div>' +
      '<button class="review-task-btn pending" onclick="completeReview(' + t.id + ', this)">去复习</button>' +
    '</div>';
  }
  container.innerHTML = html;
}

function completeReview(id, btn) {
  var task = App.reviewTasks.find(function(t) { return t.id === id; });
  if (task) {
    task.status = 'done';
    btn.classList.remove('pending');
    btn.classList.add('done');
    btn.textContent = '已完成';
    showToast('复习任务完成');
  }
}

function renderFutureReviews() {
  var container = document.getElementById('futureReviewList');
  var future = App.reviewTasks.filter(function(t) { return t.reviewDay !== '今天'; });

  if (future.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:16px;">暂无未来复习计划</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < future.length; i++) {
    var t = future[i];
    html += '<div class="review-task">' +
      '<div class="review-task-icon" style="background:var(--accent-light);"><svg viewBox="0 0 24 24" style="stroke:var(--accent);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>' +
      '<div class="review-task-body">' +
        '<h4>' + t.kp + '</h4>' +
        '<p>' + t.reviewDay + ' · ' + t.interval + ' · ' + t.questionCount + ' 题</p>' +
      '</div>' +
      '<span style="font-size:12px;color:var(--muted);font-weight:600;">' + t.reviewDay + '</span>' +
    '</div>';
  }
  container.innerHTML = html;
}

function renderForgettingCurve() {
  var container = document.getElementById('chart-forgetting');
  if (!container) return;

  if (App.charts.forgetting) App.charts.forgetting.dispose();
  App.charts.forgetting = echarts.init(container, null, { renderer: 'svg' });

  App.charts.forgetting.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    grid: { left: '3%', right: '5%', top: '10%', bottom: '15%', containLabel: true },
    legend: { data: ['自然遗忘', '智能复习后'], bottom: 0, textStyle: { fontSize: 10, color: '#6366F1' } },
    xAxis: {
      type: 'category',
      data: ['当天', '1天', '2天', '4天', '7天', '15天', '30天'],
      axisLine: { lineStyle: { color: '#E0E7FF' } },
      axisLabel: { color: '#6366F1', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { lineStyle: { color: '#E0E7FF' } },
      axisLabel: { color: '#6366F1', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#E0E7FF', type: 'dashed' } }
    },
    series: [
      {
        name: '自然遗忘',
        type: 'line',
        data: [100, 55, 45, 38, 32, 28, 25],
        smooth: true,
        lineStyle: { width: 2, color: '#A5B4FC' },
        itemStyle: { color: '#A5B4FC' },
        areaStyle: { color: 'rgba(165,180,252,0.15)' }
      },
      {
        name: '智能复习后',
        type: 'line',
        data: [100, 85, 78, 82, 88, 92, 90],
        smooth: true,
        lineStyle: { width: 2, color: '#4F46E5' },
        itemStyle: { color: '#4F46E5' },
        areaStyle: { color: 'rgba(79,70,229,0.15)' },
        markPoint: {
          data: [
            { coord: [1, 85], symbolSize: 28, itemStyle: { color: '#06B6D4' }, label: { fontSize: 9, color: '#fff', formatter: '复习1' } },
            { coord: [3, 82], symbolSize: 28, itemStyle: { color: '#06B6D4' }, label: { fontSize: 9, color: '#fff', formatter: '复习2' } },
            { coord: [5, 92], symbolSize: 28, itemStyle: { color: '#06B6D4' }, label: { fontSize: 9, color: '#fff', formatter: '复习3' } }
          ]
        }
      }
    ]
  });
}

// ===== 成长中心 V3.0 =====
function initProfilePage() {
  var elTotal = document.getElementById('profileTotal');
  var elAcc = document.getElementById('profileAccuracy');
  var elStreak = document.getElementById('profileStreak');
  var elMastered = document.getElementById('profileMastered');

  if (elTotal) elTotal.textContent = App.stats.totalQuestions;
  if (elAcc) elAcc.textContent = App.stats.totalAccuracy + '%';
  if (elStreak) elStreak.textContent = App.stats.streakDays;

  if (elMastered) {
    var mastered = 0;
    for (var kp in App.knowledgePoints) {
      if (App.knowledgePoints[kp].mastery >= 80) mastered++;
    }
    elMastered.textContent = mastered;
  }
}

// ===== Toast =====
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 2000);
}

// ===== 时钟 =====
function updateClock() {
  var now = new Date();
  var h = now.getHours().toString().padStart(2, '0');
  var m = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('statusTime').textContent = h + ':' + m;
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  updateClock();
  setInterval(updateClock, 60000);
  initHomePage();
});

// 窗口resize时重绘图表
window.addEventListener('resize', function() {
  for (var key in App.charts) {
    if (App.charts[key]) App.charts[key].resize();
  }
});
