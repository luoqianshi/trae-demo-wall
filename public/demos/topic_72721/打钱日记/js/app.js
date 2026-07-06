/* ===== Data ===== */
let employeeName = '';
let employeeDept = '';
let employeeDate = '';
let events = [
  { name: '嘉年华巡演 · 洛阳站', city: '洛阳', date: '2025-07-20', items: [
    { type: '🎫 门票', amount: 1280, split: { buddy: '小美', paid: 640 } }, { type: '🚄 交通', amount: 420 },
    { type: '🏨 住宿', amount: 350, split: { buddy: '小美', paid: 175 } }, { type: '🍜 餐饮', amount: 85 }
  ]},
  { name: '嘉年华巡演 · 上海站', city: '上海', date: '2025-08-15', items: [
    { type: '🎫 门票', amount: 1580, split: { buddy: '阿杰', paid: 790 } }, { type: '🚄 交通', amount: 800, split: { buddy: '阿杰', paid: 400 } }
  ]},
  { name: '新专辑购买', city: '线上', date: '2025-06-01', items: [
    { type: '📦 实体专辑', amount: 189, split: { buddy: '小美', paid: 95 } }, { type: '📦 数字专辑', amount: 25 },
    { type: '🛍️ 应援棒', amount: 68 }
  ]}
];
/* City distance table (approx km between major cities) */
const cityDistances = {
  '北京':{ '上海':1213,'洛阳':780,'广州':1888,'成都':1518,'深圳':1944,'杭州':1200,'南京':1000,'武汉':1100,'西安':1083,'重庆':1462 },
  '上海':{ '北京':1213,'洛阳':820,'广州':1213,'成都':1600,'深圳':1270,'杭州':170,'南京':300,'武汉':700,'西安':1300,'重庆':1500 },
  '洛阳':{ '北京':780,'上海':820,'广州':1300,'成都':850,'西安':350,'武汉':600,'杭州':900,'南京':750 },
  '广州':{ '北京':1888,'上海':1213,'深圳':140,'成都':1500,'武汉':960,'杭州':1200,'南京':1120 },
  '成都':{ '北京':1518,'上海':1600,'重庆':270,'西安':660,'武汉':950,'广州':1500 },
  '深圳':{ '北京':1944,'上海':1270,'广州':140,'成都':1600,'杭州':1300 },
  '杭州':{ '上海':170,'北京':1200,'南京':280,'武汉':750,'广州':1200 },
  '南京':{ '北京':1000,'上海':300,'杭州':280,'武汉':530,'西安':1050 },
  '武汉':{ '北京':1100,'上海':700,'广州':960,'成都':950,'西安':720 },
  '西安':{ '北京':1083,'上海':1300,'洛阳':350,'成都':660,'重庆':620 },
  '重庆':{ '北京':1462,'上海':1500,'成都':270,'西安':620 }
};

/* ===== Page Navigation ===== */
function showPage(pageId) {
  // Hide annual overlay specifically
  if (pageId !== 'page-annual') {
    document.getElementById('page-annual').classList.remove('active');
  }
  // Hide onboard when switching to tab pages
  document.querySelectorAll('.page').forEach(p => {
    if (p.id !== 'page-annual') p.classList.remove('active');
  });
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    if (target.id !== 'page-annual') target.scrollTop = 0;
  }
  // Update tab highlight
  document.querySelectorAll('.tab-item').forEach(t => {
    t.classList.toggle('active', t.dataset.page === pageId);
  });
  // Hide fab on non-ledger pages
  document.querySelector('.fab').style.display = (pageId === 'page-ledger') ? 'flex' : 'none';
  // Render data on page enter
  if (pageId === 'page-ledger') renderEvents();
  if (pageId === 'page-kpi') renderKPI();
  if (pageId === 'page-persona') renderPersona();
  if (pageId === 'page-annual') renderAnnual();
  // Animate cards
  setTimeout(() => observeCards(), 100);
}

/* ===== Toast ===== */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.transform = 'translateX(-50%) translateY(0)';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(-120px)'; }, 3000);
}

/* ===== Card Enter Animation ===== */
function observeCards() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.card-anim:not(.visible)').forEach(el => observer.observe(el));
}

/* ===== Animate Number ===== */
function animateNumber(el, from, to, duration, prefix = '', suffix = '') {
  const start = performance.now();
  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(from + (to - from) * eased).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ===== Onboard Step Form ===== */
let currentStep = 1;
const totalSteps = 4;
function stepOnboard(dir) {
  const next = currentStep + dir;
  if (next < 1 || next > totalSteps) return;
  // Validate current step before going forward
  if (dir > 0) {
    if (currentStep === 1 && !document.getElementById('idol-name').value.trim()) {
      showToast('⚠️ 请输入员工姓名（偶像名字）'); return;
    }
    if (currentStep === 2 && !document.getElementById('idol-dept').value) {
      showToast('⚠️ 请选择所属部门'); return;
    }
    if (currentStep === 3) {
      if (!document.getElementById('idol-date').value) { showToast('⚠️ 请选择入职日期'); return; }
      if (!document.getElementById('idol-role').value) { showToast('⚠️ 请选择您的职位'); return; }
    }
  }
  currentStep = next;
  // Update steps visibility
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelector('.form-step[data-step="' + currentStep + '"]').classList.add('active');
  // Update dots
  document.querySelectorAll('.step-dot').forEach(d => {
    const s = parseInt(d.dataset.step);
    d.classList.remove('active', 'done');
    if (s === currentStep) d.classList.add('active');
    else if (s < currentStep) d.classList.add('done');
  });
  // Update lines
  document.querySelectorAll('.step-line').forEach((l, i) => {
    l.classList.toggle('done', i < currentStep - 1);
  });
  // Update buttons
  document.getElementById('step-back').style.display = currentStep > 1 ? 'block' : 'none';
  document.getElementById('step-next').style.display = currentStep < totalSteps ? 'block' : 'none';
  document.getElementById('step-submit').style.display = currentStep === totalSteps ? 'block' : 'none';
}
function resetOnboardSteps() {
  currentStep = 1;
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelector('.form-step[data-step="1"]').classList.add('active');
  document.querySelectorAll('.step-dot').forEach(d => {
    d.classList.remove('active', 'done');
    if (d.dataset.step === '1') d.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach(l => l.classList.remove('done'));
  document.getElementById('step-back').style.display = 'none';
  document.getElementById('step-next').style.display = 'block';
  document.getElementById('step-submit').style.display = 'none';
}
function submitOnboard() {
  const name = document.getElementById('idol-name').value.trim();
  const dept = document.getElementById('idol-dept').value;
  const date = document.getElementById('idol-date').value;
  const role = document.getElementById('idol-role').value;
  if (!name) { showToast('⚠️ 请输入员工姓名（偶像名字）'); currentStep = 1; stepOnboard(0); return; }
  if (!dept) { showToast('⚠️ 请选择所属部门'); currentStep = 2; stepOnboard(0); return; }
  if (!date) { showToast('⚠️ 请选择入职日期'); currentStep = 3; stepOnboard(0); return; }
  if (!role) { showToast('⚠️ 请选择您的职位'); currentStep = 3; stepOnboard(0); return; }
  employeeName = name; employeeDept = dept; employeeDate = date;
  document.getElementById('current-employee').textContent = name;
  resetOnboardSteps();
  showPage('page-ledger');
  setTimeout(() => showToast(`🎉 员工 ${name} 已成功入职打钱娱乐集团！`), 300);
}

/* ===== Compute Stats ===== */
function computeStats() {
  let totalCount = 0, totalAmount = 0;
  const typeAmounts = {};
  events.forEach(evt => evt.items.forEach(item => {
    totalCount++; totalAmount += item.amount;
    const cat = categorize(item.type);
    typeAmounts[cat] = (typeAmounts[cat] || 0) + item.amount;
  }));
  return { totalCount, totalAmount, typeAmounts, eventCount: events.length };
}
function categorize(type) {
  if (type.includes('门票')) return '门票';
  if (type.includes('交通')) return '交通';
  if (type.includes('住宿')) return '住宿';
  if (type.includes('周边') || type.includes('应援') || type.includes('专辑')) return '周边';
  if (type.includes('餐饮')) return '餐饮';
  return '其他';
}

/* ===== Render Events ===== */
function renderEvents() {
  const container = document.getElementById('events-container');
  let totalCount = 0, totalAmount = 0;
  const colors = ['var(--coral)', 'var(--purple)', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
  const buddyColors = ['#667eea', '#f093fb', '#4ecdc4', '#ff6b6b', '#ffa07a', '#87ceeb'];
  let html = '';
  events.forEach((evt, ei) => {
    const total = evt.items.reduce((s, i) => s + i.amount, 0);
    totalCount += evt.items.length; totalAmount += total;
    // Collect split items in this event
    const splitItems = evt.items.filter(i => i.split);
    const hasSplit = splitItems.length > 0;
    html += `<div class="event-card card-anim">
      <div class="event-card-inner" style="border-left-color:${colors[ei % colors.length]}">
        <div class="event-name">${evt.name}</div>
        <div class="event-meta"><span>📅 ${evt.date}</span><span class="event-city">${evt.city}</span></div>
        <div class="expense-list">`;
    evt.items.forEach((item, ii) => {
      html += `<div class="expense-item"><span class="expense-type"><span class="icon">${item.type.substring(0,2)}</span>${item.type.substring(3)}</span>`;
      if (item.split) {
        const ci = buddyColors[getBuddyColorIndex(item.split.buddy) % buddyColors.length];
        html += `<span class="expense-amount">¥${item.amount.toLocaleString()} <span class="split-badge">👫 ${item.split.buddy} 出 ¥${item.split.paid.toLocaleString()}</span></span>`;
      } else {
        html += `<span class="expense-amount">¥${item.amount.toLocaleString()}</span>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
    // Split summary section
    if (hasSplit) {
      const splitTotal = splitItems.reduce((s, i) => s + i.split.paid, 0);
      const mySplitTotal = splitItems.reduce((s, i) => s + (i.amount - i.split.paid), 0);
      html += `<div class="split-section">
        <div class="split-section-title">👫 拼单明细</div>`;
      splitItems.forEach(item => {
        const ci = buddyColors[getBuddyColorIndex(item.split.buddy) % buddyColors.length];
        html += `<div class="split-detail">
          <div class="split-tag"><span class="split-avatar" style="background:${ci}">${item.split.buddy.charAt(0)}</span><span>${item.split.buddy}</span></div>
          <div class="split-detail-info">${item.type.substring(3)} · AA各出 ¥${(item.amount/2).toLocaleString()}</div>
          <div class="split-detail-paid">出 ¥${item.split.paid.toLocaleString()}</div>
        </div>`;
      });
      html += `<div style="text-align:right;margin-top:10px;font-size:12px;color:var(--gray-dark);">搭子累计出资 <span style="color:var(--coral);font-weight:700;">¥${splitTotal.toLocaleString()}</span> · 你实际支出 <span style="color:var(--deep-purple);font-weight:700;">¥${mySplitTotal.toLocaleString()}</span></div></div>`;
    }
    html += `<div class="event-total"><span class="event-total-label">本活动总投资</span><span class="event-total-amount">¥${total.toLocaleString()}</span></div></div></div>`;
  });
  container.innerHTML = html;
  document.getElementById('total-amount').textContent = '¥' + totalAmount.toLocaleString();
  document.getElementById('total-count').textContent = '共 ' + totalCount + ' 笔';
  document.getElementById('total-events').textContent = events.length + ' 个活动';
  // Render buddy ranking
  renderBuddies();
}

/* ===== Add Expense ===== */
function toggleAddForm() {
  document.getElementById('add-overlay').classList.toggle('active');
  document.getElementById('add-sheet').classList.toggle('active');
}
let splitEnabled = false;
function toggleSplit() {
  splitEnabled = !splitEnabled;
  document.getElementById('split-toggle').classList.toggle('active', splitEnabled);
  document.getElementById('split-fields').classList.toggle('active', splitEnabled);
}
function addExpense() {
  const eventName = document.getElementById('add-event').value.trim();
  const city = document.getElementById('add-city').value.trim();
  const date = document.getElementById('add-date').value;
  const type = document.getElementById('add-type').value;
  const amount = parseInt(document.getElementById('add-amount').value);
  if (!eventName) { showToast('⚠️ 请输入活动名称'); return; }
  if (!amount || amount <= 0) { showToast('⚠️ 请输入有效金额'); return; }
  // Build item with optional split info
  const item = { type, amount };
  if (splitEnabled) {
    const buddyName = document.getElementById('split-buddy-name').value.trim();
    const buddyPaid = parseInt(document.getElementById('split-buddy-amount').value);
    if (buddyName && buddyPaid > 0) {
      item.split = { buddy: buddyName, paid: buddyPaid };
    }
  }
  let existing = events.find(e => e.name === eventName);
  if (existing) existing.items.push(item);
  else events.push({ name: eventName, city: city || '未填写', date: date || new Date().toISOString().split('T')[0], items: [item] });
  // Reset form
  document.getElementById('add-event').value = '';
  document.getElementById('add-city').value = '';
  document.getElementById('add-date').value = '';
  document.getElementById('add-amount').value = '';
  document.getElementById('split-buddy-name').value = '';
  document.getElementById('split-buddy-amount').value = '';
  if (splitEnabled) toggleSplit();
  toggleAddForm(); renderEvents();
  const splitMsg = item.split ? `（${item.split.buddy} 出 ¥${item.split.paid.toLocaleString()}）` : '';
  showToast(`✅ 已记录 ${type.substring(3)} ¥${amount.toLocaleString()} ${splitMsg}`);
}
/* ===== Buddy Color Index ===== */
const _buddyColorMap = {};
function getBuddyColorIndex(name) {
  if (!(name in _buddyColorMap)) _buddyColorMap[name] = Object.keys(_buddyColorMap).length;
  return _buddyColorMap[name];
}
/* ===== Render Buddy Ranking ===== */
function renderBuddies() {
  const buddyData = {};
  const buddyEvents = {};
  events.forEach(evt => {
    evt.items.forEach(item => {
      if (item.split) {
        const b = item.split.buddy;
        if (!buddyData[b]) buddyData[b] = { totalPaid: 0, totalShared: 0, count: 0, events: new Set() };
        buddyData[b].totalPaid += item.split.paid;
        buddyData[b].totalShared += item.amount;
        buddyData[b].count++;
        buddyData[b].events.add(evt.name);
      }
    });
  });
  const buddies = Object.keys(buddyData).map(name => {
    const d = buddyData[name];
    const payRatio = d.totalPaid / d.totalShared; // how much they actually paid vs total shared cost
    const punctuality = Math.min(100, Math.round(payRatio * 100)); // 100 = perfect AA
    const loyalty = Math.min(100, d.events.size * 25); // more events = more loyal
    const generosity = Math.min(100, Math.round((d.totalPaid / (d.totalShared || 1)) * 100));
    const score = Math.round(punctuality * 0.4 + loyalty * 0.3 + generosity * 0.3);
    return { name, totalPaid: d.totalPaid, totalShared: d.totalShared, count: d.count, eventCount: d.events.size, score, punctuality, loyalty };
  }).sort((a, b) => b.score - a.score);

  const container = document.getElementById('buddy-list');
  const countEl = document.getElementById('buddy-count');
  countEl.textContent = buddies.length + ' 位搭子';

  if (buddies.length === 0) {
    container.innerHTML = `<div class="buddy-empty">👫 还没有追星搭子<br>添加消费时开启「拼单」记录搭子信息<br>系统会自动为你评分筛选优质搭子！</div>`;
    return;
  }
  const buddyColors = ['#667eea', '#f093fb', '#4ecdc4', '#ff6b6b', '#ffa07a', '#87ceeb'];
  const labels = ['', '最佳拍档', '靠谱队友', '值得继续', '有待观察'];
  let html = '';
  buddies.forEach((b, i) => {
    const ci = buddyColors[getBuddyColorIndex(b.name) % buddyColors.length];
    const rankClass = i < 3 ? `r${i+1}` : 'r4';
    const label = i < labels.length - 1 ? labels[i + 1] : '有待观察';
    html += `<div class="buddy-item">
      <div class="buddy-rank ${rankClass}">${i+1}</div>
      <div class="buddy-avatar" style="background:${ci}">${b.name.charAt(0)}</div>
      <div class="buddy-info">
        <div class="buddy-name">${b.name}${label ? ' · <span style="font-size:11px;color:var(--coral);">' + label + '</span>' : ''}</div>
        <div class="buddy-stats">拼单 ${b.count} 次 · ${b.eventCount} 个活动 · 累计出 ¥${b.totalPaid.toLocaleString()}</div>
      </div>
      <div class="buddy-score-wrap">
        <div class="buddy-score">${b.score}</div>
        <div class="buddy-score-label">搭子分</div>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

/* ===== Render KPI ===== */
function renderKPI() {
  const stats = computeStats();
  const empName = employeeName || '未命名';
  const dept = employeeDept || '未分配';
  let tenure = '--';
  if (employeeDate) {
    const m = Math.floor((Date.now() - new Date(employeeDate).getTime()) / (1000*60*60*24*30));
    const y = Math.floor(m/12), r = m%12;
    tenure = y > 0 ? `${y}年${r}月` : `${m}月`;
  }
  const wid = empName !== '未命名' ? 'DQ-' + (Math.abs(empName.charCodeAt(0)*137+empName.length*31)%10000).toString().padStart(4,'0') : '--';
  document.getElementById('kpi-emp-info').textContent = `员工：${empName} | 工号：${wid} | 部门：${dept}事业部 | 在职：${tenure}`;
  // Animate stats
  animateNumber(document.getElementById('kpi-total-amount'), 0, stats.totalAmount, 1000, '¥');
  document.getElementById('kpi-total-count').textContent = stats.totalCount + ' 笔';
  document.getElementById('kpi-total-events').textContent = stats.eventCount + ' 个';
  // Score ring animation — JS-driven for cross-browser compatibility
  const circumference = 2 * Math.PI * 80; // ~502.65
  const score = Math.min(100, Math.round(40 + stats.totalAmount / 200 + stats.eventCount * 5 + (stats.typeAmounts['门票'] ? 10 : 0)));
  const circle = document.getElementById('score-circle');
  circle.style.setProperty('stroke-dasharray', '0 ' + circumference + 'px');
  void circle.offsetWidth;
  setTimeout(() => {
    const dashVal = (score / 100 * circumference) + 'px ' + circumference + 'px';
    circle.style.setProperty('stroke-dasharray', dashVal);
  }, 100);
  animateNumber(document.getElementById('score-number'), 0, score, 1200);
  // Dimensions
  const dims = [
    { icon:'📅', name:'营业频率', score:85, comment:'本月发博 12 条，直播 2 次，营业积极' },
    { icon:'💕', name:'情绪回报', score:92, comment:'投资人满意度极高，多次表示"值了"' },
    { icon:'💰', name:'性价比', score:65, comment:'演唱会票价偏高，周边定价超出行业均值' },
    { icon:'💡', name:'创新能力', score:78, comment:'本季度推出新专辑，但曲风变化不大' },
    { icon:'🤝', name:'粉丝维护', score:90, comment:'互动频繁，宠粉行为突出，投资人忠诚度高' }
  ];
  let dh = '';
  dims.forEach(d => {
    dh += `<div class="dimension-item"><div class="dim-header"><span class="dim-left"><span class="dim-icon">${d.icon}</span>${d.name}</span><span class="dim-score">${d.score}分</span></div><div class="dim-bar-bg"><div class="dim-bar-fill" style="--target-pct:${d.score}%"></div></div><div class="dim-comment">${d.comment}</div></div>`;
  });
  document.getElementById('dimensions-container').innerHTML = dh;
  setTimeout(() => document.querySelectorAll('.dim-bar-fill').forEach(b => b.classList.add('animate')), 200);
  // AI Review
  let review = '';
  if (stats.totalAmount > 5000) review = '该员工吸金能力极强，但请注意控制投资节奏，建议设立月度预算上限。从ROI角度看，门票投入产出比最高，建议将周边消费控制在总投资的20%以内。综合来看，该员工具备高成长性，维持"买入"评级。';
  else if (stats.totalAmount >= 2000) review = '该员工表现稳健，营业频率稳定，情绪价值输出能力强。投资结构较为合理，覆盖门票、周边、交通等多个品类。建议持续关注其后续动态，适时加仓。当前维持"持有"评级。';
  else review = '该员工处于培育期，投资规模尚小，但潜力可期。建议加大投资力度，重点关注其成长潜力。可优先选择门票类高回报项目进行试水，逐步建立投资组合。当前给予"观望"评级。';
  document.getElementById('ai-review-text').textContent = review;
}

/* ===== Render Persona ===== */
function renderPersona() {
  const stats = computeStats();
  const total = stats.totalAmount || 1;
  const pct = {};
  Object.keys(stats.typeAmounts).forEach(k => { pct[k] = stats.typeAmounts[k] / total * 100; });
  let tag = '全能型投资人', desc = '你的消费分布在各个品类，没有明显偏好。你是那种理性与感性并存的追星人——既能前排打call，也能精打细算。在你的追星哲学里，全面参与才是真爱。';
  if ((pct['门票']||0) > 50) { tag = '演唱会特种兵'; desc = '你的消费 60% 集中在演唱会门票和交通上，周边很少买。你是那个周五晚起飞、周一早打卡的狠人。追星对你来说不是消费，是必要的精神出差。'; }
  else if ((pct['周边']||0) > 50) { tag = '周边收藏控'; desc = '你对周边完全没有抵抗力，官方出品必入。家里有一面墙是专门留给偶像的。你认为"不买周边算什么追星"，每一件周边都是你爱的证明。'; }
  else if ((pct['交通']||0) > 40) { tag = '追风少年'; desc = '你在交通上的花费占比极高，不是在追星就是在追星的路上。高铁是你的第二客厅，机票是你的收藏品。你的追星足迹比很多人旅行还要广。'; }
  else if ((pct['住宿']||0) > 30) { tag = '精致追星族'; desc = '你对住宿品质有要求，演唱会一定住好酒店。你相信追星也是一种生活方式，住宿体验不能将就。你在酒店大堂偶遇偶像的概率，比你想象的要高。'; }
  else if ((pct['餐饮']||0) > 30) { tag = '干饭追星人'; desc = '你在追星路上的餐饮花费惊人，打卡偶像同款餐厅是你的必修课。你说"追星不忘干饭"，美食和偶像缺一不可。你的朋友圈一半是演唱会，一半是美食。'; }
  document.getElementById('persona-tag').textContent = tag;
  document.getElementById('persona-desc').textContent = desc;
  let topType='演唱会', maxAmt=0;
  Object.keys(stats.typeAmounts).forEach(k => { if(stats.typeAmounts[k]>maxAmt){maxAmt=stats.typeAmounts[k];topType=k;} });
  const avg = stats.totalCount > 0 ? Math.round(stats.totalAmount/stats.totalCount) : 0;
  const rank = Math.floor(Math.random()*30+5);
  const flag = (Math.random()*8+1).toFixed(1);
  const ps = [
    { icon:'🎯', value:topType, label:'消费偏好 TOP1' },
    { icon:'💵', value:'¥'+avg.toLocaleString(), label:'单笔平均投资' },
    { icon:'🏅', value:'TOP '+rank+'%', label:'同粉丝排名' },
    { icon:'🚩', value:flag+'%', label:'"最后一次"Flag 率' }
  ];
  document.getElementById('persona-stats').innerHTML = ps.map(s => `<div class="p-stat-card card-anim"><span class="p-stat-icon">${s.icon}</span><div class="p-stat-value">${s.value}</div><div class="p-stat-label">${s.label}</div></div>`).join('');
}

/* ===== Render Annual Report ===== */
function renderAnnual() {
  const stats = computeStats();
  const empName = employeeName || '你的偶像';
  // Sort events by date
  const sorted = [...events].sort((a,b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0] || {};
  const firstTotal = first.items ? first.items.reduce((s,i)=>s+i.amount,0) : 0;
  // Find most expensive single item
  let maxItem = { amount:0, name:'', eventName:'' };
  events.forEach(e => e.items.forEach(i => { if(i.amount > maxItem.amount) maxItem = { amount:i.amount, name:i.type.substring(3), eventName:e.name }; }));
  // Cities
  const cities = [...new Set(events.filter(e=>e.city!=='线上').map(e=>e.city))];
  // Calculate approximate distance
  let totalDist = 0;
  for (let i = 1; i < cities.length; i++) {
    const d = getDistance(cities[i-1], cities[i]);
    totalDist += d;
  }
  // Persona
  const total = stats.totalAmount || 1;
  const pct = {};
  Object.keys(stats.typeAmounts).forEach(k => { pct[k] = stats.typeAmounts[k]/total*100; });
  let personaTag = '全能型投资人';
  if ((pct['门票']||0)>50) personaTag = '演唱会特种兵';
  else if ((pct['周边']||0)>50) personaTag = '周边收藏控';
  else if ((pct['交通']||0)>40) personaTag = '追风少年';
  else if ((pct['住宿']||0)>30) personaTag = '精致追星族';
  else if ((pct['餐饮']||0)>30) personaTag = '干饭追星人';
  // Fill data
  document.getElementById('ar-name').textContent = empName;
  document.getElementById('ar-tea').textContent = `相当于 ${Math.round(stats.totalAmount / 30)} 杯奶茶 🧋`;
  document.getElementById('ar-first-date').textContent = first.date || '2024 年 3 月 15 日';
  document.getElementById('ar-first-name').textContent = (first.name || '首场演唱会');
  document.getElementById('ar-max-amount').textContent = '¥' + maxItem.amount.toLocaleString();
  document.getElementById('ar-max-name').textContent = maxItem.eventName || '--';
  document.getElementById('ar-city-count').textContent = cities.length;
  document.getElementById('ar-city-list').innerHTML = cities.map(c => `<span class="city-tag">${c}</span>`).join('');
  document.getElementById('ar-distance').textContent = `飞行了 ${totalDist > 0 ? totalDist.toLocaleString() : 'XXX'} 公里 ✈️`;
  document.getElementById('ar-persona').textContent = personaTag;
  // Reset scroll
  const scroller = document.getElementById('annual-scroll');
  scroller.scrollTop = 0;
  // Animate numbers after slides become visible
  setTimeout(() => {
    const totalEl = document.getElementById('ar-total');
    if (totalEl) animateNumber(totalEl, 0, stats.totalAmount, 1500, '¥');
    const firstAmtEl = document.getElementById('ar-first-amount');
    if (firstAmtEl) animateNumber(firstAmtEl, 0, firstTotal, 1000, '¥');
    const maxAmtEl = document.getElementById('ar-max-amount');
    if (maxAmtEl) animateNumber(maxAmtEl, 0, maxItem.amount, 1000, '¥');
  }, 600);
  // Observe slides for fade-in
  observeSlides();
}
function getDistance(c1, c2) {
  if (c1 === c2) return 0;
  const table = cityDistances[c1];
  if (table && table[c2]) return table[c2];
  const table2 = cityDistances[c2];
  if (table2 && table2[c1]) return table2[c1];
  return Math.floor(Math.random() * 800 + 400);
}
function observeSlides() {
  // Clean up previous observers to prevent duplicate triggers
  if (observeSlides._observer) observeSlides._observer.disconnect();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.3 });
  document.querySelectorAll('.annual-snap').forEach(s => { s.classList.remove('visible'); observer.observe(s); });
  observeSlides._observer = observer;
}

/* ===== Floating Emojis ===== */
function createFloatingEmojis() {
  const c = document.getElementById('emoji-container');
  const emojis = ['🎤','💎','🎫','✨','💃','🌟','🎭','🎵','❤️','🏆','📸','🍿'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'floating-emoji';
    s.textContent = emojis[i];
    s.style.left = Math.random()*100+'%';
    s.style.fontSize = (20+Math.random()*20)+'px';
    s.style.animationDuration = (8+Math.random()*12)+'s';
    s.style.animationDelay = (Math.random()*10)+'s';
    c.appendChild(s);
  }
}

/* ===== Init ===== */
createFloatingEmojis();
renderEvents();
observeCards();
// Hide fab initially
document.querySelector('.fab').style.display = 'none';
