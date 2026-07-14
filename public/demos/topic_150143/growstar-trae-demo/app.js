/* ============================================
   成长星 GrowStar - 核心逻辑
   ============================================ */

// ---------- 初始数据 ----------
const INITIAL_DATA = {
  child: {
    id: 'child-001',
    name: '小星',
    age: 8
  },
  coinBalance: 128,
  aiGoalPlan: null,
  aiWeeklyReport: null,
  goals: [
    {
      id: 'goal-001',
      name: '钢琴比赛',
      daysLeft: 20,
      progress: 65,
      icon: 'icon-piano.png',
      keyResults: [
        { id: 'kr-001', name: '曲目完整', progress: 80 },
        { id: 'kr-002', name: '节奏稳定', progress: 50 },
        { id: 'kr-003', name: '模拟演出', progress: 0 }
      ]
    },
    {
      id: 'goal-002',
      name: '读完一本书',
      daysLeft: 7,
      progress: 70,
      icon: 'icon-reading.png',
      keyResults: []
    }
  ],
  tasks: [
    {
      id: 'task-001',
      name: '练琴 30 分钟',
      type: '成长任务',
      coin: 3,
      needConfirm: true,
      status: 'todo',
      icon: 'icon-piano.png'
    },
    {
      id: 'task-002',
      name: '阅读一章故事',
      type: '成长任务',
      coin: 2,
      needConfirm: false,
      status: 'todo',
      icon: 'icon-reading.png'
    },
    {
      id: 'task-003',
      name: '整理书桌',
      type: '责任任务',
      coin: 1,
      needConfirm: false,
      status: 'self_done',
      icon: 'icon-tidy.png'
    }
  ],
  transactions: [
    { id: 'tx-001', title: '完成任务：整理书包', amount: 1, time: '今天 10:30' },
    { id: 'tx-002', title: '完成任务：阅读一章故事', amount: 2, time: '昨天 20:15' },
    { id: 'tx-003', title: '完成任务：练琴 30 分钟', amount: 3, time: '昨天 18:00' },
    { id: 'tx-004', title: '家长即时奖励', amount: 5, time: '前天 21:30' }
  ],
  records: [
    { id: 'rec-001', title: '完成任务：阅读一章故事', content: '今天读了《小王子》的第三章，学到了很多。', time: '今天 20:15' },
    { id: 'rec-002', title: '完成任务：练琴 30 分钟', content: '慢速练习了B段，节奏比昨天稳了。', time: '昨天 18:00' },
    { id: 'rec-003', title: '每日复盘', content: '今天最有价值的事是坚持练琴，虽然有点累但是很有收获。', time: '昨天 22:00' }
  ],
  parentPin: '1234'
};

// localStorage Keys
const STORAGE_KEYS = {
  DATA: 'growstar_demo_data',
  SESSION: 'growstar_session'
};

// ---------- 全局状态 ----------
let appData = {};
let session = {
  account: null,     // 'parent' | 'child'
  view: null,         // 'parent_view' | 'child_view'
  lastPage: null,     // 上次访问的页面 id，用于刷新恢复
  loginTime: null,    // 登录时间戳，用于会话过期判断
  pendingTaskId: null // 当前待确认的任务 ID
};
let currentPage = null;

// ============================================
//   数据层 - Data Layer
// ============================================

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DATA);
    if (saved) {
      appData = JSON.parse(saved);
    } else {
      appData = deepClone(INITIAL_DATA);
      saveData();
    }
  } catch (e) {
    console.error('加载数据失败:', e);
    appData = deepClone(INITIAL_DATA);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(appData));
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

function resetData() {
  appData = deepClone(INITIAL_DATA);
  saveData();
}

// ============================================
//   Session 层 - 会话管理
// ============================================

// 会话过期时间：24 小时
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// 过渡页面：刷新后不应恢复这些页面（依赖临时状态如 pendingTaskId）
const TRANSIENT_PAGES = ['pin-input', 'confirm-detail'];

function loadSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    // 会话过期检查
    if (parsed.loginTime && (Date.now() - parsed.loginTime > SESSION_TIMEOUT)) {
      console.log('[Session] 会话已过期，清除');
      clearSession();
      return;
    }

    session.account = parsed.account || null;
    session.view = parsed.view || null;
    session.lastPage = parsed.lastPage || null;
    session.loginTime = parsed.loginTime || null;
    session.pendingTaskId = parsed.pendingTaskId || null;
  } catch (e) {
    console.error('[Session] 加载会话失败:', e);
  }
}

function saveSession(account, view) {
  session.account = account;
  session.view = view;
  session.loginTime = Date.now();
  persistSession();
}

function persistSession() {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
      account: session.account,
      view: session.view,
      lastPage: session.lastPage,
      loginTime: session.loginTime,
      pendingTaskId: session.pendingTaskId
    }));
  } catch (e) {
    console.error('[Session] 持久化会话失败:', e);
  }
}

function updateSessionPage() {
  session.lastPage = currentPage;
  if (hasValidSession()) {
    persistSession();
  }
}

function clearSession() {
  session.account = null;
  session.view = null;
  session.lastPage = null;
  session.loginTime = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.error('[Session] 清除会话失败:', e);
  }
}

function hasValidSession() {
  return !!(session.account && session.view);
}

function isParentAccount() {
  return session.account === 'parent';
}

function isChildView() {
  return session.view === 'child_view';
}

function isParentView() {
  return isParentAccount() && !isChildView();
}

function getDefaultPage() {
  if (isParentView()) {
    return 'parent-dashboard';
  }
  return 'child-today';
}

// 导航权限守卫：根据当前 session 状态判断是否可访问目标页面
function canAccessPage(pageId) {
  if (!pageId) return false;

  // 过渡页面只在运行时可达，刷新后不可恢复
  if (TRANSIENT_PAGES.includes(pageId) && !currentPage) {
    return false;
  }

  if (isParentView()) {
    // 家长视角：可访问所有家长页面 + 确认详情
    return pageId.startsWith('parent-') || pageId === 'confirm-detail';
  } else if (isParentAccount() && isChildView()) {
    // 家长账号 + 孩子视角：AI助手页面仅限家长视角访问
    if (pageId === 'parent-ai-goal') return false;
    // 家长账号 + 孩子视角：可访问孩子页面 + PIN 验证（返回家长）
    return pageId.startsWith('child-') || pageId === 'pin-input';
  } else {
    // 孩子账号：仅孩子页面
    return pageId.startsWith('child-');
  }
}

// ============================================
//   视图层 - 页面导航与渲染
// ============================================

function showLoginPage() {
  document.getElementById('page-login').classList.add('active');
  document.getElementById('page-login').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-login').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
}

function navigateTo(pageId) {
  if (hasValidSession() && !canAccessPage(pageId)) {
    pageId = getDefaultPage();
  }

  const allPages = document.querySelectorAll('.page-content');
  allPages.forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const target = document.getElementById(`page-${pageId}`);
  if (!target) {
    return;
  }

  target.style.display = 'block';
  requestAnimationFrame(() => {
    target.classList.add('active');
  });

  currentPage = pageId;
  updateSessionPage();  // 持久化当前页面到 session
  updateHeader(pageId);
  updateBottomNav(pageId);
  refreshPage(pageId);
}

function updateHeader(pageId) {
  const header = document.getElementById('app-header');
  const titleEl = document.getElementById('header-title');
  const leftEl = document.getElementById('header-left');
  const rightEl = document.getElementById('header-right');
  const leftText = document.getElementById('header-left-text');

  const isChildPage = pageId.startsWith('child-');
  header.classList.toggle('child-theme', isChildPage);

  const titleMap = {
    'parent-dashboard': '总览',
    'parent-goals': '目标管理',
    'parent-pending': '待确认',
    'parent-rules': '规则设置',
    'parent-me': '我的',
    'parent-records': '成长记录',
    'parent-reflection': '成长复盘',
    'parent-wallet': '成长账户',
    'parent-ai-goal': 'AI 成长助手',
    'child-today': '今日',
    'child-goals': '我的目标',
    'child-records': '成长记录',
    'child-me': '我的',
    'child-wallet': '成长账户',
    'pin-input': '家长验证',
    'confirm-detail': '确认任务'
  };
  titleEl.textContent = titleMap[pageId] || '成长星';

  const pagesWithBack = [
    'parent-goals', 'parent-pending', 'parent-rules',
    'parent-records', 'parent-reflection', 'parent-wallet',
    'parent-ai-goal',
    'child-goals', 'child-records', 'child-wallet',
    'pin-input', 'confirm-detail'
  ];
  const showBack = pagesWithBack.includes(pageId);
  leftEl.style.visibility = showBack ? 'visible' : 'hidden';
  leftEl.classList.toggle('no-back', !showBack);
  leftText.textContent = '返回';

  rightEl.innerHTML = '';
  if (pageId === 'parent-dashboard' || pageId === 'parent-pending') {
    rightEl.innerHTML = `
      <div class="header-coin">
        <img src="assets/growth-coin.png" alt="成长币">
        <span id="header-balance">${appData.coinBalance}</span>
      </div>
    `;
  } else if (pageId === 'child-today') {
    rightEl.innerHTML = `
      <div class="header-coin">
        <img src="assets/growth-coin.png" alt="成长币">
        <span id="header-balance">${appData.coinBalance}</span>
      </div>
    `;
  }
}

function updateBottomNav(pageId) {
  const parentNav = document.getElementById('nav-parent');
  const childNav = document.getElementById('nav-child');

  const isParentMain = ['parent-dashboard', 'parent-goals', 'parent-rules', 'parent-me'].includes(pageId);
  const isChildMain = ['child-today', 'child-goals', 'child-records', 'child-me'].includes(pageId);

  parentNav.classList.toggle('hidden', !isParentMain);
  childNav.classList.toggle('hidden', !isChildMain);

  if (isParentMain) {
    parentNav.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });
  }
  if (isChildMain) {
    childNav.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });
  }
}

function goBack() {
  const backMap = {
    'parent-goals': 'parent-dashboard',
    'parent-pending': 'parent-dashboard',
    'parent-rules': 'parent-dashboard',
    'parent-records': 'parent-me',
    'parent-reflection': 'parent-me',
    'parent-wallet': 'parent-me',
    'parent-ai-goal': 'parent-dashboard',
    'child-goals': 'child-today',
    'child-records': 'child-today',
    'child-wallet': 'child-me',
    'pin-input': 'child-me',
    'confirm-detail': 'parent-pending'
  };

  const target = backMap[currentPage];
  if (target) {
    navigateTo(target);
  }
}

// ============================================
//   渲染层 - 各页面内容
// ============================================

function refreshPage(pageId) {
  switch (pageId) {
    case 'parent-dashboard':
      renderParentDashboard();
      break;
    case 'parent-pending':
      renderPendingList();
      break;
    case 'parent-wallet':
      renderWallet('ledger-list');
      break;
    case 'parent-records':
      renderRecords('records-list');
      break;
    case 'parent-reflection':
      renderReflection();
      break;
    case 'parent-ai-goal':
      renderAiGoalPage();
      break;
    case 'child-today':
      renderChildToday();
      break;
    case 'child-me':
      renderChildMe();
      break;
    case 'child-wallet':
      renderWallet('child-ledger-list');
      break;
    case 'child-records':
      renderRecords('child-records-list');
      break;
  }
  updateAllCoinBalances();
}

function updateAllCoinBalances() {
  const balance = appData.coinBalance;
  const els = ['wallet-balance', 'child-wallet-balance', 'header-balance'];
  els.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = balance;
  });
}

function renderParentDashboard() {
  const completed = appData.tasks.filter(
    t => t.status === 'self_done' || t.status === 'confirmed'
  ).length;
  const total = appData.tasks.length;
  document.getElementById('parent-progress').textContent = `${completed}/${total}`;

  const pending = appData.tasks.filter(t => t.status === 'submitted').length;
  document.getElementById('parent-pending-count').textContent = pending;

  renderTaskList('parent-task-list');
}

function renderTaskList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = appData.tasks.map(task => {
    let actionBtn = '';

    if (task.status === 'todo') {
      if (task.needConfirm) {
        actionBtn = `<button class="task-btn primary" onclick="app.submitTask('${task.id}')">提交确认</button>`;
      } else {
        actionBtn = `<button class="task-btn primary" onclick="app.completeTask('${task.id}')">完成</button>`;
      }
    } else if (task.status === 'submitted') {
      actionBtn = '<span class="task-status submitted">待确认</span>';
    } else if (task.status === 'returned') {
      actionBtn = `<div class="returned-info"><span class="task-status returned">需补充</span><span class="returned-hint">家长退回，需要补充说明</span></div><button class="task-btn secondary" onclick="app.submitTask('${task.id}')">补充提交</button>`;
    } else {
      actionBtn = '<span class="task-status done">已完成</span>';
    }

    return `
      <div class="task-card">
        <div class="task-icon">
          <img src="assets/${task.icon}" alt="${task.name}">
        </div>
        <div class="task-info">
          <h3>${task.name}</h3>
          <p>${task.type} · +${task.coin} 成长币</p>
        </div>
        <div class="task-action">${actionBtn}</div>
      </div>
    `;
  }).join('');
}

function renderPendingList() {
  const container = document.getElementById('pending-list');
  const empty = document.getElementById('pending-empty');
  const tasks = appData.tasks.filter(t => t.status === 'submitted');

  if (tasks.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  container.innerHTML = tasks.map(task => `
    <div class="pending-card" onclick="app.showConfirmDetail('${task.id}')">
      <h3>${task.name}</h3>
      <p>${task.type} · 需要确认 · +${task.coin} 成长币</p>
      <div class="pending-actions">
        <button class="pending-btn approve" onclick="event.stopPropagation(); app.confirmTask('${task.id}', 'approve')">通过 +${task.coin}</button>
        <button class="pending-btn no-reward" onclick="event.stopPropagation(); app.confirmTask('${task.id}', 'no_reward')">不发币</button>
        <button class="pending-btn return" onclick="event.stopPropagation(); app.confirmTask('${task.id}', 'return')">退回补充</button>
      </div>
    </div>
  `).join('');
}

function renderChildToday() {
  renderTaskList('child-task-list');
}

function renderChildMe() {
  const isParentInChildView = isParentAccount() && isChildView();
  const btn = document.getElementById('btn-back-to-parent');
  const roleText = document.getElementById('child-role-text');

  if (btn) {
    btn.style.display = isParentInChildView ? 'flex' : 'none';
  }
  if (roleText) {
    roleText.textContent = isParentInChildView ? '家长账号 · 孩子视角' : '孩子账号';
  }
}

function renderWallet(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = appData.transactions.map(tx => `
    <div class="ledger-item">
      <div class="ledger-info">
        <h4>${tx.title}</h4>
        <p>${tx.time}</p>
      </div>
      <div class="ledger-amount">+${tx.amount}</div>
    </div>
  `).join('');
}

function renderRecords(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = appData.records.map(rec => `
    <div class="record-card">
      <h3>${rec.title}</h3>
      <p>${rec.content}</p>
      <span class="time">${rec.time}</span>
    </div>
  `).join('');
}

function renderReflection() {
  const container = document.getElementById('reflection-list');
  const empty = document.getElementById('reflection-empty');
  
  const reflections = appData.records.filter(r => 
    r.title.includes('复盘') || r.title.includes('确认') || r.title.includes('退回')
  );

  if (reflections.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  container.innerHTML = reflections.map(rec => `
    <div class="reflection-card">
      <h3>${rec.title}</h3>
      <div class="reflection-content">${rec.content}</div>
      <span class="time">${rec.time}</span>
    </div>
  `).join('');
}

function renderAiGoalPage() {
  const input = document.getElementById('ai-goal-input');
  const resultSection = document.getElementById('ai-goal-result');
  const weeklyCard = document.getElementById('ai-weekly-card');

  if (input && appData.aiGoalPlan) {
    input.value = appData.aiGoalPlan.input;
  }

  if (resultSection && appData.aiGoalPlan) {
    resultSection.style.display = 'block';
    document.getElementById('ai-goal-summary').textContent = appData.aiGoalPlan.summary;
    document.getElementById('ai-stage-list').innerHTML = appData.aiGoalPlan.stages.map(s => 
      `<li>${s}</li>`
    ).join('');
    document.getElementById('ai-today-text').textContent = appData.aiGoalPlan.todayAction;
  } else if (resultSection) {
    resultSection.style.display = 'none';
  }

  if (weeklyCard && appData.aiWeeklyReport) {
    weeklyCard.style.display = 'block';
    document.getElementById('ai-weekly-title').textContent = appData.aiWeeklyReport.title;
    document.getElementById('ai-weekly-balance').textContent = appData.aiWeeklyReport.balance;
    document.getElementById('ai-weekly-completed').textContent = appData.aiWeeklyReport.completedTasks;
    document.getElementById('ai-weekly-pending').textContent = appData.aiWeeklyReport.pendingTasks;
    document.getElementById('ai-weekly-transactions').textContent = appData.aiWeeklyReport.transactionCount;
    document.getElementById('ai-weekly-records').textContent = appData.aiWeeklyReport.recordsCount;
    document.getElementById('ai-weekly-highlights').innerHTML = appData.aiWeeklyReport.highlights.map(h => 
      `<li>${h}</li>`
    ).join('');
    document.getElementById('ai-weekly-concerns').innerHTML = appData.aiWeeklyReport.concerns.map(c => 
      `<li>${c}</li>`
    ).join('');
    document.getElementById('ai-weekly-suggestions').innerHTML = appData.aiWeeklyReport.suggestions.map(s => 
      `<li>${s}</li>`
    ).join('');
  } else if (weeklyCard) {
    weeklyCard.style.display = 'none';
  }
}

function parseDuration(text) {
  const weekMatch = text.match(/(\d+)\s*周/);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;
  
  const monthMatch = text.match(/(\d+)\s*个月/);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;
  
  const dayMatch = text.match(/(\d+)\s*天/);
  if (dayMatch) return parseInt(dayMatch[1]);
  
  return 30;
}

function generateDynamicStages(totalDays, type) {
  const stages = [];
  const stageCount = Math.min(4, Math.ceil(totalDays / 7));
  
  const stageInfo = {
    piano: {
      prefix: ['基础练习', '技巧提升', '完整演奏', '模拟演练'],
      suffix: ['慢速练习曲目，纠正手型', '分段练习，攻克难点', '连贯演奏，控制节奏', '录像回看，调整细节']
    },
    reading: {
      prefix: ['预热期', '深度阅读', '知识整理', '成果输出'],
      suffix: ['选择书籍，制定阅读计划', '每日阅读，记录笔记', '整理要点，绘制思维导图', '写读后感，分享心得']
    },
    math: {
      prefix: ['基础复习', '专项突破', '综合训练', '错题回顾'],
      suffix: ['梳理知识点，查漏补缺', '针对薄弱环节进行强化练习', '做模拟题，提升解题速度', '整理错题，总结规律']
    },
    english: {
      prefix: ['词汇积累', '语法巩固', '听说训练', '综合应用'],
      suffix: ['每天背诵单词，复习旧词', '学习语法规则，做配套练习', '跟读模仿，练习口语表达', '阅读短文，写小作文']
    },
    exam: {
      prefix: ['计划制定', '全面复习', '专题突破', '模拟冲刺'],
      suffix: ['分析考纲，制定复习计划', '按科目系统复习，做笔记', '针对重点难点进行强化', '做模拟试卷，调整状态']
    },
    default: {
      prefix: ['准备期', '实践期', '提升期', '成果期'],
      suffix: ['明确目标，收集资料', '按计划执行，记录进度', '总结经验，优化方法', '展示成果，总结反思']
    }
  };
  
  const info = stageInfo[type] || stageInfo.default;
  const daysPerStage = Math.ceil(totalDays / stageCount);
  
  let startDay = 1;
  for (let i = 0; i < stageCount; i++) {
    const endDay = Math.min(startDay + daysPerStage - 1, totalDays);
    const stageIndex = Math.min(i, info.prefix.length - 1);
    stages.push(`第${i + 1}阶段：${info.prefix[stageIndex]}（第${startDay}-${endDay}天）- ${info.suffix[stageIndex]}`);
    startDay = endDay + 1;
  }
  
  return stages;
}

function generateGoalPlan(inputText) {
  const input = document.getElementById('ai-goal-input');
  const text = inputText || (input ? input.value.trim() : '');
  
  if (!text) {
    showToast('请输入成长目标');
    return;
  }

  const totalDays = parseDuration(text);
  
  const typePatterns = [
    { type: 'piano', pattern: /钢琴|练琴|演奏|考级/ },
    { type: 'reading', pattern: /读完|读一本|书|阅读|读书|故事|绘本/ },
    { type: 'math', pattern: /数学|计算|奥数|作业/ },
    { type: 'english', pattern: /英语|单词|口语|听力/ },
    { type: 'exam', pattern: /考试|期末|期中|竞赛/ }
  ];
  
  let goalType = 'default';
  for (const { type, pattern } of typePatterns) {
    if (pattern.test(text)) {
      goalType = type;
      break;
    }
  }

  const typeNames = {
    piano: '钢琴学习',
    reading: '阅读成长',
    math: '数学学习',
    english: '英语学习',
    exam: '考试准备',
    default: '成长'
  };
  
  const summary = `${typeNames[goalType]}目标：${text}`;
  const stages = generateDynamicStages(totalDays, goalType);
  
  const todayActions = {
    piano: '今天先慢速练习曲目前半部分，重点注意手型和指法，录制视频以便回看纠正。',
    reading: '今天先选择一本感兴趣的书，设定每天的阅读时间，准备好笔记本记录要点。',
    math: '今天先复习基础概念，整理错题本，找出最需要加强的知识点。',
    english: '今天先制定单词背诵计划，选择一本合适的英语绘本或文章开始阅读。',
    exam: '今天先分析考试范围和要求，制定详细的复习计划表。',
    default: '今天先明确目标的具体内容，制定初步的行动计划。'
  };
  const todayAction = todayActions[goalType];

  appData.aiGoalPlan = {
    input: text,
    summary,
    stages,
    todayAction,
    generatedAt: Date.now()
  };

  saveData();
  showToast('目标计划已生成');
  renderAiGoalPage();
}

function generateWeeklyReport() {
  const completedTasks = appData.tasks.filter(
    t => t.status === 'self_done' || t.status === 'confirmed'
  ).length;
  const pendingTasks = appData.tasks.filter(t => t.status === 'submitted').length;
  const returnedTasks = appData.tasks.filter(t => t.status === 'returned').length;
  const totalTasks = appData.tasks.length;
  const balance = appData.coinBalance;
  const transactionCount = appData.transactions.length;
  const recordsCount = appData.records.length;

  const highlights = [];
  const concerns = [];
  const suggestions = [];

  if (completedTasks > 0) {
    highlights.push(`本周已完成 ${completedTasks} 项任务，继续保持！`);
  }
  if (pendingTasks === 0 && completedTasks > 0) {
    highlights.push('所有提交的任务都已获得家长确认，效率很高！');
  }
  if (balance >= 130) {
    highlights.push(`成长币余额达到 ${balance}，表现优秀！`);
  }
  if (transactionCount > 2) {
    highlights.push('本周有多次成长币收入，任务完成度不错。');
  }
  if (recordsCount > 3) {
    highlights.push('成长记录丰富，复盘意识很强！');
  }

  if (pendingTasks > 0) {
    concerns.push(`还有 ${pendingTasks} 项任务待家长确认，记得及时关注反馈。`);
  }
  if (returnedTasks > 0) {
    concerns.push(`有 ${returnedTasks} 项任务需要补充说明，请尽快修改后重新提交。`);
  }
  if (completedTasks < totalTasks) {
    const todoCount = appData.tasks.filter(t => t.status === 'todo').length;
    concerns.push(`还有 ${todoCount} 项任务待完成，继续加油！`);
  }
  if (balance < 128) {
    concerns.push(`当前成长币余额 ${balance}，可以尝试完成更多任务。`);
  }

  suggestions.push('建议每天固定时间完成任务，养成好习惯。');
  suggestions.push('完成任务后及时记录心得，有助于成长复盘。');
  suggestions.push('设定一个小目标，逐步积累，持续进步。');

  appData.aiWeeklyReport = {
    title: '本周成长周报',
    balance,
    completedTasks,
    pendingTasks,
    totalTasks,
    transactionCount,
    recordsCount,
    highlights,
    concerns,
    suggestions,
    generatedAt: Date.now()
  };

  saveData();
  showToast('成长周报已生成');
  renderAiGoalPage();
}

// ============================================
//   业务层 - 任务操作
// ============================================

function completeTask(taskId) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'todo') return;

  task.status = 'self_done';

  if (task.coin > 0) {
    appData.coinBalance += task.coin;
    appData.transactions.unshift({
      id: `tx-${Date.now()}`,
      title: `完成任务：${task.name}`,
      amount: task.coin,
      time: '刚刚'
    });
  }

  appData.records.unshift({
    id: `rec-${Date.now()}`,
    title: `完成任务：${task.name}`,
    content: '任务已完成，继续加油！',
    time: '刚刚'
  });

  saveData();
  showToast(`任务完成！成长币 +${task.coin}`);
  refreshPage(currentPage);
}

function submitTask(taskId) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (task.status === 'todo' || task.status === 'returned') {
    task.status = 'submitted';

    appData.records.unshift({
      id: `rec-${Date.now()}`,
      title: `提交任务：${task.name}`,
      content: '已提交，等待家长确认',
      time: '刚刚'
    });

    saveData();
    showToast('已提交，等待家长确认');
    refreshPage(currentPage);
  }
}

function confirmTask(taskId, action) {
  const task = appData.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'submitted') return;

  if (action === 'approve') {
    task.status = 'confirmed';
    appData.coinBalance += task.coin;
    appData.transactions.unshift({
      id: `tx-${Date.now()}`,
      title: `家长确认：${task.name}`,
      amount: task.coin,
      time: '刚刚'
    });
    appData.records.unshift({
      id: `rec-${Date.now()}`,
      title: `任务确认通过：${task.name}`,
      content: `家长确认通过，获得 ${task.coin} 成长币`,
      time: '刚刚'
    });
    showToast(`确认通过！成长币 +${task.coin}`);
  } else if (action === 'no_reward') {
    task.status = 'confirmed';
    appData.records.unshift({
      id: `rec-${Date.now()}`,
      title: `任务确认：${task.name}`,
      content: '家长确认完成，本次不发放成长币',
      time: '刚刚'
    });
    showToast('确认完成，不发放成长币');
  } else if (action === 'return') {
    task.status = 'returned';
    appData.records.unshift({
      id: `rec-${Date.now()}`,
      title: `任务退回：${task.name}`,
      content: '家长退回任务，需要补充说明',
      time: '刚刚'
    });
    showToast('已退回，等待孩子补充');
  }

  saveData();
  refreshPage(currentPage);
}

function showConfirmDetail(taskId) {
  session.pendingTaskId = taskId;
  const task = appData.tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('confirm-task-name').textContent = task.name;

  const approveBtn = document.querySelector('.confirm-btn.approve span');
  if (approveBtn) {
    approveBtn.textContent = `通过 +${task.coin} 成长币`;
  }

  navigateTo('confirm-detail');
}

// ============================================
//   业务层 - 视角切换
// ============================================

function enterChildView() {
  if (!isParentAccount()) return;
  saveSession('parent', 'child_view');
  navigateTo('child-today');
  showToast('已进入孩子视角');
}

function showPinInput() {
  navigateTo('pin-input');
  const input = document.getElementById('pin-input');
  if (input) {
    input.value = '';
  }
}

function addPin(digit) {
  const input = document.getElementById('pin-input');
  if (!input) return;
  if (input.value.length < 4) {
    input.value += digit;
    if (input.value.length === 4) {
      verifyPin();
    }
  }
}

function clearPin() {
  const input = document.getElementById('pin-input');
  if (input) {
    input.value = '';
  }
}

function verifyPin() {
  const input = document.getElementById('pin-input');
  if (!input) return;
  const pin = input.value;

  if (pin === appData.parentPin) {
    saveSession('parent', 'parent_view');
    navigateTo('parent-dashboard');
    showToast('验证通过，返回家长界面');
    input.value = '';
  } else {
    showToast('口令错误，请重试');
    input.value = '';
  }
}

function cancelPin() {
  navigateTo('child-me');
}

// ============================================
//   工具函数
// ============================================

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 250);
  }, 1800);
}

// ============================================
//   公共 API - app 对象
// ============================================

const app = {
  login: function(role) {
    if (role === 'parent') {
      saveSession('parent', 'parent_view');
      showMainApp();
      navigateTo('parent-dashboard');
    } else if (role === 'child') {
      saveSession('child', 'child_view');
      showMainApp();
      navigateTo('child-today');
    }
  },

  logout: function() {
    if (confirm('确定要退出登录吗？')) {
      clearSession();
      showLoginPage();
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      showToast('已退出登录');
    }
  },

  goTo: function(pageId) {
    navigateTo(pageId);
  },

  goBack: function() {
    goBack();
  },

  enterChildView: function() {
    enterChildView();
  },

  showPinInput: function() {
    showPinInput();
  },

  addPin: function(digit) {
    addPin(digit);
  },

  clearPin: function() {
    clearPin();
  },

  verifyPin: function() {
    verifyPin();
  },

  cancelPin: function() {
    cancelPin();
  },

  completeTask: function(taskId) {
    completeTask(taskId);
  },

  submitTask: function(taskId) {
    submitTask(taskId);
  },

  confirmTask: function(taskId, action) {
    confirmTask(taskId, action);
  },

  showConfirmDetail: function(taskId) {
    showConfirmDetail(taskId);
  },

  approveTask: function() {
    if (session.pendingTaskId) {
      confirmTask(session.pendingTaskId, 'approve');
      session.pendingTaskId = null;
      persistSession();
      navigateTo('parent-pending');
    }
  },

  rejectTask: function() {
    if (session.pendingTaskId) {
      confirmTask(session.pendingTaskId, 'no_reward');
      session.pendingTaskId = null;
      persistSession();
      navigateTo('parent-pending');
    }
  },

  returnTask: function() {
    if (session.pendingTaskId) {
      confirmTask(session.pendingTaskId, 'return');
      session.pendingTaskId = null;
      persistSession();
      navigateTo('parent-pending');
    }
  },

  switchView: function(view) {
    const tabs = document.querySelectorAll('.view-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (view === 'day') {
      tabs[0].classList.add('active');
      showToast('已切换到日视图');
    } else {
      tabs[1].classList.add('active');
      showToast('周视图开发中');
    }
  },

  generateGoalPlan: function(inputText) {
    generateGoalPlan(inputText);
  },

  generateWeeklyReport: function() {
    generateWeeklyReport();
  },

  resetDemo: function() {
    if (confirm('确定要重置所有演示数据吗？')) {
      resetData();
      clearSession();
      showLoginPage();
      showToast('演示数据已重置');
    }
  }
};

// ============================================
//   初始化
// ============================================

function init() {
  loadData();
  loadSession();

  if (hasValidSession()) {
    showMainApp();
    // 恢复上次页面，过渡页（pin-input/confirm-detail）不恢复
    let startPage = session.lastPage;
    if (!startPage || TRANSIENT_PAGES.includes(startPage) || !canAccessPage(startPage)) {
      startPage = getDefaultPage();
    }
    navigateTo(startPage);
  } else {
    showLoginPage();
  }
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('keydown', function(e) {
  if (currentPage !== 'pin-input') return;
  
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    addPin(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    const input = document.getElementById('pin-input');
    if (input) {
      input.value = input.value.slice(0, -1);
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    verifyPin();
  }
});
