/**
 * 行动力 — 行为设计助手
 * 应用主逻辑
 */

// ===== 数据存储 =====
const Storage = {
  get(key) { try { return JSON.parse(localStorage.getItem('am_' + key)) || null; } catch(e) { return null; } },
  set(key, val) { localStorage.setItem('am_' + key, JSON.stringify(val)); },
  has(key) { return localStorage.getItem('am_' + key) !== null; }
};

// ===== 应用状态 =====
let currentPage = 'welcome';
let wizardStep = 1;
let wizardData = {};
let diagnosisAnswers = [];
let currentDiagnosisQ = 0;

// ===== 初始化 =====
function init() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  document.getElementById('greeting').textContent = greet + ' 👋';
  document.getElementById('today-date').textContent = formatDate(new Date());
}

function formatDate(d) {
  const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${days[d.getDay()]}`;
}

function startApp() {
  document.getElementById('page-welcome').classList.remove('active');
  goToPage('home');
  document.getElementById('bottom-nav').style.display = 'flex';
}

// ===== 页面路由 =====
function goToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  currentPage = page;

  // 理论页不显示底部导航高亮（用户还需要回去）
  if (page === 'welcome') {
    document.getElementById('bottom-nav').style.display = 'none';
  } else {
    document.getElementById('bottom-nav').style.display = 'flex';
    document.querySelectorAll('.bottom-nav .nav-item').forEach((btn, i) => {
      btn.classList.toggle('active', (page === 'home' && i === 0) || (page === 'profile' && i === 2));
    });
  }

  if (page === 'home') renderHome();
  if (page === 'profile') renderProfile();
}

function goBack() {
  if (currentPage === 'wizard') { goToPage('home'); }
  else if (currentPage === 'diagnosis') { goToPage('wizard'); }
  else if (currentPage === 'report') { goToPage('diagnosis'); }
  else if (currentPage === 'detail') { goToPage('home'); }
  else if (currentPage === 'theory') { goToPage('profile'); }
  else { goToPage('home'); }
}

function goToTheory() {
  goToPage('theory');
}

// ===== 首页渲染 =====
function renderHome() {
  const habits = Storage.get('habits') || [];
  const today = new Date().toDateString();

  const todayHabits = habits.filter(h => !isCheckedToday(h, today));
  document.getElementById('today-count').textContent = todayHabits.length;
  const allBtn = document.getElementById('check-all-btn');
  allBtn.classList.toggle('done', todayHabits.length === 0 && habits.length > 0);

  const list = document.getElementById('habit-list');
  if (habits.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <p>还没有习惯，创建一个微习惯开始吧</p>
        <button class="btn-primary" onclick="goToWizard()" style="max-width:200px;margin:0 auto;">创建第一个习惯</button>
      </div>`;
    return;
  }

  list.innerHTML = habits.map((h, i) => {
    const checked = isCheckedToday(h, today);
    const currentStreak = calcStreak(h);
    return `
      <div class="habit-card" onclick="openDetail(${i})">
        <div class="check-circle ${checked ? 'checked' : ''}" onclick="event.stopPropagation();toggleCheck(${i})">
          ${checked ? '✓' : ''}
        </div>
        <div class="habit-info">
          <div class="habit-title">${h.microBehavior}</div>
          <div class="habit-meta">${checked ? '今日已完成' : '点击打卡'}</div>
        </div>
        ${currentStreak > 0 ? `<div class="streak-badge"><span class="fire">🔥</span>${currentStreak}</div>` : ''}
      </div>`;
  }).join('');
}

function isCheckedToday(habit, todayStr) {
  if (!habit.checkins) return false;
  return habit.checkins.some(c => new Date(c.date).toDateString() === todayStr);
}

// 计算连续打卡天数（从昨天开始往前推）
function calcStreak(habit) {
  if (!habit.checkins || habit.checkins.length === 0) return 0;
  const sorted = habit.checkins.map(c => new Date(c.date).toDateString()).sort();
  const unique = [...new Set(sorted)].reverse(); // 去重、最新在前
  const today = new Date().toDateString();
  // 如果今天和昨天都没打卡，streak=0
  if (unique[0] !== today && unique[0] !== yesterdayStr()) return 0;
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < unique.length; i++) {
    const expected = new Date(now);
    expected.setDate(expected.getDate() - i);
    if (unique[i] === expected.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

function toggleCheck(index) {
  const habits = Storage.get('habits') || [];
  const h = habits[index];
  const today = new Date().toDateString();
  if (isCheckedToday(h, today)) return; // 已打卡，不可取消

  h.checkins = h.checkins || [];
  h.checkins.push({ date: new Date().toISOString(), mood: 5 });
  h.streak = calcStreak(h);
  h.total = (h.total || 0) + 1;
  showCelebrate(h);
  checkAchievements(h);

  Storage.set('habits', habits);
  renderHome();
}

function checkAllToday() {
  const habits = Storage.get('habits') || [];
  const today = new Date().toDateString();
  let changed = false;
  habits.forEach(h => {
    if (!isCheckedToday(h, today)) {
      h.checkins = h.checkins || [];
      h.checkins.push({ date: new Date().toISOString(), mood: 5 });
      h.streak = calcStreak(h);
      h.total = (h.total || 0) + 1;
      changed = true;
    }
  });
  if (changed) {
    Storage.set('habits', habits);
    showCelebrate({microBehavior:'全部习惯'});
    checkAchievements();
    renderHome();
  }
}

// ===== 庆祝弹窗 =====
function showCelebrate(habit) {
  const msgs = ['太棒了！','做得好！','你真厉害！','继续保持！','又近了一步！'];
  const emojis = ['🎉','✨','🌟','💪','🔥'];
  const i = Math.floor(Math.random() * msgs.length);
  document.getElementById('celebrate-emoji').textContent = emojis[i];
  document.getElementById('celebrate-title').textContent = msgs[i];
  document.getElementById('celebrate-text').textContent = `「${habit.microBehavior}」已完成！`;
  document.getElementById('celebrate-overlay').classList.add('active');

  const overlay = document.getElementById('celebrate-overlay');
  // 清理旧 confetti
  overlay.querySelectorAll('.confetti-piece').forEach(c => c.remove());
  for (let j = 0; j < 20; j++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = ['#E07A5F','#81B29A','#F2CC8F','#9B8AA5','#A8DADC'][Math.floor(Math.random()*5)];
    c.style.animationDelay = Math.random() * 2 + 's';
    c.style.animationDuration = (2 + Math.random() * 2) + 's';
    overlay.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

function closeCelebrate() {
  document.getElementById('celebrate-overlay').classList.remove('active');
}

// ===== 新建习惯向导 =====
function goToWizard() {
  wizardStep = 1;
  wizardData = {};
  diagnosisAnswers = [];
  currentDiagnosisQ = 0;
  document.querySelectorAll('.wizard-content').forEach((el, i) => { el.style.display = i === 0 ? 'block' : 'none'; });
  updateWizardProgress();
  document.getElementById('goal-input').value = '';
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  goToPage('wizard');
}

function updateWizardProgress() {
  document.querySelectorAll('.wizard-progress .dot').forEach((d, i) => {
    d.classList.toggle('active', i < wizardStep);
  });
}

function wizardNext(step) {
  if (step === 1) {
    const val = document.getElementById('goal-input').value.trim();
    if (!val) { shakeInput(document.getElementById('goal-input')); return; }
    wizardData.goal = val;
  }
  if (step === 2) {
    if (!wizardData.diagnoseChoice) { shakeInput(document.querySelector('.option-card')); return; }
    if (wizardData.diagnoseChoice === 'diagnose') {
      goToPage('diagnosis');
      startDiagnosis();
      return;
    }
    // skip: 使用PlanMatcher自动生成方案
    wizardData.diagnosis = generateAutoDiagnosis(wizardData.goal);
  }
  if (step === 3) {
    if (!wizardData.selectedMicro) { shakeInput(document.getElementById('micro-options')); return; }
  }

  document.getElementById('wizard-step-' + step).style.display = 'none';
  wizardStep = step + 1;
  updateWizardProgress();

  if (step === 2) {
    renderMicroOptions();
    document.getElementById('wizard-step-3').style.display = 'block';
  } else if (step === 3) {
    const rec = wizardData.selectedPlan;
    document.getElementById('created-summary').innerHTML =
      `<strong style="font-size:18px;color:var(--accent);">「${wizardData.selectedMicro}」</strong><br><br>` +
      `原始目标：${wizardData.goal}<br>` +
      `诊断结果：${wizardData.diagnosis.barrierText}`;
    document.getElementById('first-task').textContent = wizardData.selectedMicro;
    document.getElementById('wizard-step-4').style.display = 'block';
  } else {
    document.getElementById('wizard-step-' + (step + 1)).style.display = 'block';
  }
}

function selectOption(card, value) {
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  wizardData.diagnoseChoice = value;
}

function shakeInput(el) {
  el.style.animation = 'shake 0.4s';
  setTimeout(() => el.style.animation = '', 400);
}

// ===== 诊断逻辑 =====
const diagnosisQuestions = [
  {
    icon: '🔥', text: '你有多想做这件事？',
    options: [
      { text: '非常想，做梦都在想', score: {m:9,a:0,p:0} },
      { text: '挺想的，但经常忘', score: {m:6,a:0,p:0} },
      { text: '一般，可做可不做', score: {m:4,a:0,p:0} },
      { text: '不太想，只是"觉得应该做"', score: {m:2,a:0,p:0} }
    ]
  },
  {
    icon: '⚡', text: '做这件事对你来说有多容易？',
    options: [
      { text: '超级简单，随手就能做', score: {m:0,a:9,p:0} },
      { text: '有点麻烦，但还能应付', score: {m:0,a:6,p:0} },
      { text: '挺难的，需要专门安排', score: {m:0,a:4,p:0} },
      { text: '非常难，一想就头大', score: {m:0,a:2,p:0} }
    ]
  },
  {
    icon: '⏰', text: '你有没有固定的提醒或触发点？',
    options: [
      { text: '有，每天固定时间/场景都会想起', score: {m:0,a:0,p:9} },
      { text: '偶尔能想起来', score: {m:0,a:0,p:6} },
      { text: '很少，总是事后才想起', score: {m:0,a:0,p:3} },
      { text: '完全没有，完全靠随缘', score: {m:0,a:0,p:1} }
    ]
  }
];

function startDiagnosis() {
  currentDiagnosisQ = 0;
  diagnosisAnswers = [];
  showQuestion(0);
}

function showQuestion(idx) {
  const q = diagnosisQuestions[idx];
  document.getElementById('q-icon').textContent = q.icon;
  document.getElementById('q-text').textContent = q.text;
  document.getElementById('q-options').innerHTML = q.options.map((opt, i) =>
    `<button class="q-option" onclick="answerQuestion(${i})">${opt.text}</button>`
  ).join('');
}

function answerQuestion(optIdx) {
  diagnosisAnswers.push(diagnosisQuestions[currentDiagnosisQ].options[optIdx].score);
  currentDiagnosisQ++;
  if (currentDiagnosisQ < diagnosisQuestions.length) {
    showQuestion(currentDiagnosisQ);
  } else {
    generateReport();
  }
}

function generateReport() {
  const scores = diagnosisAnswers.reduce((acc, s) => {
    acc.m += s.m; acc.a += s.a; acc.p += s.p;
    return acc;
  }, {m:0,a:0,p:0});

  const minScore = Math.min(scores.m, scores.a, scores.p);
  const minTen = Math.round(minScore / 9 * 10); // 换算成10分制
  let barrier, barrierText, insight;
  if (minTen >= 8) {
    barrier = 'none';
    barrierText = '状态不错 — 三个维度都比较充足';
    insight = '你的动机、能力和提示都达到了不错的水平。坚持下去的关键是保持一致性，建议设置固定提醒让行为自动化。';
  } else if (scores.m === minScore) {
    barrier = 'motivation';
    barrierText = '动机不足 — 你内心其实没那么想做这件事';
    insight = '你的动机得分相对偏低。很多人失败不是因为懒，而是因为目标不是真正渴望的，而是"觉得应该做"。建议：重新审视这个目标对你的真正意义，或者把它和更深层的需求联系起来。';
  } else if (scores.a === minScore) {
    barrier = 'ability';
    barrierText = '能力不足 — 这件事对你来说太难了';
    insight = '你的能力得分相对偏低。这是最可控的杠杆！福格博士说"让行为变简单是行为设计的核心策略"。建议：把目标缩小到"不可能失败"的程度，比如"每天读1页书"而不是"每天读1小时"。';
  } else {
    barrier = 'prompt';
    barrierText = '提示缺失 — 你总是想不起来做';
    insight = '你的提示得分相对偏低。行为发生的必要条件是"在正确的时间收到提醒"。建议：把新习惯锚定在一个已有习惯之后，比如"刷完牙后做10个深蹲"，或者设置一个显眼的环境线索。';
  }

  wizardData.diagnosis = { scores, barrier, barrierText, insight };

  // 每题最高9分，映射到10分制显示
  document.getElementById('bar-m').style.height = (scores.m / 9 * 100) + '%';
  document.getElementById('bar-a').style.height = (scores.a / 9 * 100) + '%';
  document.getElementById('bar-p').style.height = (scores.p / 9 * 100) + '%';
  document.getElementById('val-m').textContent = Math.round(scores.m / 9 * 10) + '/10';
  document.getElementById('val-a').textContent = Math.round(scores.a / 9 * 10) + '/10';
  document.getElementById('val-p').textContent = Math.round(scores.p / 9 * 10) + '/10';
  document.getElementById('insight-title').textContent = '💡 ' + barrierText;
  document.getElementById('insight-text').textContent = insight;

  goToPage('report');
}

function generateAutoDiagnosis(goal) {
  // 使用PlanMatcher进行智能匹配
  const category = PlanMatcher.matchCategory(goal);
  if (!category) {
    return { barrier:'ability', barrierText:'能力可能不足 — 目标可能过大', insight:'建议缩小行为规模，从最小版本开始。' };
  }
  // 默认假设能力不足（最常见的情况）
  return { barrier:'ability', barrierText:`能力可能不足 — 「${category}」类目标通常难度过高`, insight:'建议从微习惯开始，逐步建立能力。' };
}

function goToWizardStep3() {
  renderMicroOptions();
  goToPage('wizard');
  document.querySelectorAll('.wizard-content').forEach((el, i) => {
    el.style.display = i === 2 ? 'block' : 'none';
  });
  wizardStep = 3;
  updateWizardProgress();
}

function renderMicroOptions() {
  const goal = wizardData.goal;
  const barrier = wizardData.diagnosis.barrier === 'none' ? 'ability' : wizardData.diagnosis.barrier;

  // 使用PlanMatcher生成3个难度级别的方案
  const category = PlanMatcher.matchCategory(goal);
  const easy = PlanMatcher.getPlan(category, barrier, 'easy');
  const medium = PlanMatcher.getPlan(category, barrier, 'medium');
  const standard = PlanMatcher.getPlan(category, barrier, 'standard');

  // 兜底：未匹配到分类时提供通用默认方案
  const defaults = {
    easy:   { behavior: `想一下「${goal}」`, anchor: '每天固定时间', environment: '把相关物品放在显眼位置', celebrate: '为想起它而庆祝' },
    medium: { behavior: `做1分钟「${goal}」`, anchor: '每天固定时间', environment: '提前准备好所需物品', celebrate: '完成后的自我肯定' },
    standard:{ behavior: `做5分钟「${goal}」`, anchor: '每天固定时间', environment: '设置提醒闹钟', celebrate: '记录今天的进步' }
  };

  const plans = [
    { ...(easy   || defaults.easy),   level: '极简版', tag: 'easy',   icon: '🌱' },
    { ...(medium || defaults.medium), level: '轻松版', tag: 'medium', icon: '✨' },
    { ...(standard|| defaults.standard),level: '标准版', tag: 'standard', icon: '🚀' }
  ];

  wizardData.plans = plans;

  const container = document.getElementById('micro-options');
  container.innerHTML = plans.map((plan, i) => `
    <div class="option-card" onclick="selectMicro(this, '${plan.behavior.replace(/'/g, "\\'")}', ${i})">
      <div class="option-icon">${plan.icon}</div>
      <div class="option-text">
        <h4>${plan.behavior}</h4>
        <p>${plan.level} · ${plan.anchor}</p>
      </div>
      <div class="check-mark">✓</div>
    </div>
  `).join('');
}

function selectMicro(card, behavior, planIndex) {
  document.querySelectorAll('#micro-options .option-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  wizardData.selectedMicro = behavior;
  wizardData.selectedPlan = wizardData.plans[planIndex];
}

function finishWizard() {
  const habits = Storage.get('habits') || [];
  const plan = wizardData.selectedPlan;
  if (!plan) { goToPage('home'); return; }
  habits.push({
    id: Date.now(),
    goal: wizardData.goal,
    microBehavior: wizardData.selectedMicro,
    diagnosis: wizardData.diagnosis,
    plan: {
      behavior: plan.behavior,
      anchor: plan.anchor,
      environment: plan.environment,
      celebrate: plan.celebrate,
      level: plan.level
    },
    streak: 0,
    total: 0,
    checkins: [],
    createdAt: new Date().toISOString(),
    icon: plan.icon || '🎯'
  });
  Storage.set('habits', habits);
  goToPage('home');
}

// ===== 习惯详情 =====
let currentDetailIndex = -1;

function openDetail(index) {
  currentDetailIndex = index;
  const habits = Storage.get('habits') || [];
  const h = habits[index];
  document.getElementById('detail-title').textContent = h.goal;
  document.getElementById('detail-micro').textContent = h.microBehavior;
  document.getElementById('detail-streak').textContent = calcStreak(h);
  document.getElementById('detail-icon').textContent = h.icon || '🎯';

  // 显示方案详情
  const planSection = document.getElementById('detail-plan');
  if (h.plan && planSection) {
    planSection.innerHTML = `
      <div class="plan-card">
        <div class="plan-tag">${h.plan.level || '微习惯方案'}</div>
        <div class="plan-behavior">${h.plan.behavior}</div>
        <div class="plan-detail">
          <strong>📍 锚点：</strong>${h.plan.anchor}<br>
          <strong>🎨 环境：</strong>${h.plan.environment}<br>
          <strong>🎉 庆祝：</strong>${h.plan.celebrate}
        </div>
      </div>
    `;
  }

  const today = new Date().toDateString();
  const checked = isCheckedToday(h, today);
  const btn = document.getElementById('detail-check-btn');
  btn.textContent = checked ? '今日已完成' : '今日打卡';
  btn.style.background = checked ? 'var(--green)' : '';
  btn.disabled = checked; // 已打卡后禁用按钮

  renderCalendar(h);
  goToPage('detail');
}

function renderCalendar(habit) {
  const grid = document.getElementById('calendar-grid');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const checkinDays = (habit.checkins || []).map(c => new Date(c.date).getDate());

  let html = ['日','一','二','三','四','五','六'].map(d => `<div class="cal-header">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const done = checkinDays.includes(d);
    const isToday = d === today;
    html += `<div class="cal-day ${done ? 'done' : ''} ${isToday ? 'today' : ''}">${d}</div>`;
  }
  grid.innerHTML = html;
}

function checkInFromDetail() {
  if (currentDetailIndex >= 0) {
    toggleCheck(currentDetailIndex);
    openDetail(currentDetailIndex);
  }
}

// ===== 我的页面 =====
function renderProfile() {
  const habits = Storage.get('habits') || [];
  let totalCheckins = 0;
  let maxStreak = 0;
  habits.forEach(h => {
    totalCheckins += h.total || 0;
    maxStreak = Math.max(maxStreak, calcStreak(h));
  });

  document.getElementById('stat-habits').textContent = habits.length;
  document.getElementById('stat-total').textContent = totalCheckins;
  document.getElementById('stat-max').textContent = maxStreak;

  const achievements = [
    { id:'first', icon:'🌱', title:'初次行动', desc:'完成第一次打卡', unlocked: totalCheckins >= 1 },
    { id:'streak3', icon:'🔥', title:'三连击', desc:'连续打卡3天', unlocked: maxStreak >= 3 },
    { id:'streak7', icon:'⚡', title:'一周战士', desc:'连续打卡7天', unlocked: maxStreak >= 7 },
    { id:'streak21', icon:'👑', title:'习惯养成', desc:'连续打卡21天', unlocked: maxStreak >= 21 },
    { id:'total10', icon:'💎', title:'十次行动', desc:'累计打卡10次', unlocked: totalCheckins >= 10 },
    { id:'total50', icon:'🏆', title:'五十次行动', desc:'累计打卡50次', unlocked: totalCheckins >= 50 }
  ];

  document.getElementById('achievement-list').innerHTML = achievements.map(a => `
    <div class="achievement-item ${a.unlocked ? 'unlocked' : ''}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-info">
        <h4>${a.title}</h4>
        <p>${a.desc}</p>
      </div>
      <div class="ach-status">${a.unlocked ? '已解锁' : '未解锁'}</div>
    </div>
  `).join('');

  const firstDay = Storage.get('firstDay');
  if (firstDay) {
    const days = Math.ceil((new Date() - new Date(firstDay)) / (1000*60*60*24));
    document.getElementById('profile-days').textContent = days;
  } else if (habits.length > 0) {
    Storage.set('firstDay', new Date().toISOString());
    document.getElementById('profile-days').textContent = 1;
  } else {
    document.getElementById('profile-days').textContent = 0;
  }
}

function checkAchievements(habit) {
  // 检查是否触发成就里程碑
  if (!habit) return;
  const total = habit.total || 0;
  const streak = habit.streak || 0;
  const milestones = [
    { total: 1, msg: '初次行动！你迈出了改变的第一步 🌱' },
    { total: 10, msg: '累计十次打卡！你已经坚持得不错了 💎' },
    { total: 50, msg: '累计五十次打卡！你是一个真正的行动者 🏆' },
    { streak: 3, msg: '连续三天！习惯正在形成 🔥' },
    { streak: 7, msg: '连续一周！你已经超越了大多数人 ⚡' },
    { streak: 21, msg: '连续21天！习惯正式养成 👑' }
  ];
  const unlocked = Storage.get('unlocked') || [];
  for (const m of milestones) {
    const key = (m.total ? 't' + m.total : '') + (m.streak ? 's' + m.streak : '');
    if (((m.total && total === m.total) || (m.streak && streak === m.streak)) && !unlocked.includes(key)) {
      unlocked.push(key);
      Storage.set('unlocked', unlocked);
      setTimeout(() => {
        showAchievementToast(m.msg);
      }, 1500);
    }
  }
}

function showAchievementToast(msg) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  toast.querySelector('p').textContent = msg;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 3500);
}

// ===== 启动 =====
init();
