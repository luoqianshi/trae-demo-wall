/**
 * 饭泛之交 - Meal 约饭与匹配
 * 模块化拆分自单文件原型
 */

// ==================== MEAL ====================
function switchMealMode(mode) {
  document.querySelectorAll('.meal-mode').forEach(m => m.classList.remove('active'));
  if(typeof event !== 'undefined' && event && event.target) {
    event.target.classList.add('active');
  } else {
    document.querySelector('.meal-mode[onclick*="' + mode + '"]')?.classList.add('active');
  }
  document.querySelectorAll('.meal-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('meal-'+mode).classList.add('active');
}

function toggleChip(el) { el.classList.toggle('selected'); }
function selectOneChip(el) {
  const parent = el.parentElement;
  parent.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// ==================== TAG INPUT ====================
const tagInputData = { 'must-eat': [], 'avoid': [] };

function addTagFromInput(event, type) {
  if(event.key === 'Enter') {
    event.preventDefault();
    const input = document.getElementById(type + '-input');
    const value = input.value.trim();
    if(!value) return;
    if(tagInputData[type].includes(value)) { showToast('已经添加过了'); return; }
    if(value.length > 20) { showToast('太长了，精简一下'); return; }
    tagInputData[type].push(value);
    input.value = '';
    renderTags(type);
  }
}

function renderTags(type) {
  const container = document.getElementById(type + '-tags');
  container.innerHTML = tagInputData[type].map((tag, i) => 
    `<span class="tag-item">${tag}<span class="tag-remove" onclick="removeTag('${type}', ${i})">✕</span></span>`
  ).join('');
}

function removeTag(type, index) {
  tagInputData[type].splice(index, 1);
  renderTags(type);
}

// ==================== MATCH FORM VALIDATION ====================
function collectMatchFormData() {
  const getSelected = (containerId) => {
    const container = document.getElementById(containerId);
    if(!container) return [];
    return Array.from(container.querySelectorAll('.filter-chip.selected')).map(c => c.textContent.trim());
  };

  return {
    cuisine: getSelected('cuisine-chips'),
    time: getSelected('time-chips'),
    budget: getSelected('budget-chips'),
    allergy: getSelected('allergy-chips'),
    vibe: getSelected('vibe-chips'),
    // behavior chips: selected = 允许该行为; unselected = 禁止该行为
    allowedBehaviors: getSelected('behavior-chips'),
    forbiddenBehaviors: Array.from(document.querySelectorAll('#behavior-chips .filter-chip:not(.selected)')).map(c => c.textContent.trim()),
    mustEat: tagInputData['must-eat'] || [],
    topics: getSelected('topic-chips'),
    avoid: tagInputData['avoid'] || []
  };
}

function validateMatchForm() {
  const data = collectMatchFormData();
  const missing = [];
  
  if(data.cuisine.length === 0) missing.push('饭店类型');
  if(data.time.length === 0) missing.push('时间段');
  if(data.budget.length === 0) missing.push('预算范围');
  if(data.allergy.length === 0) missing.push('忌口');
  if(data.vibe.length === 0) missing.push('用餐氛围');
  // 餐桌行为底线：只要用户看过即可，不需要选具体的（默认已有禁止项）
  
  const hintEl = document.getElementById('match-validation-hint');
  
  if(missing.length > 0) {
    hintEl.textContent = '⚠️ 请先完成必选项：' + missing.join('、');
    // Scroll to first missing
    const firstMissing = missing[0];
    const fieldMap = {
      '饭店类型': 'cuisine-chips',
      '时间段': 'time-chips',
      '预算范围': 'budget-chips',
      '忌口': 'allergy-chips',
      '用餐氛围': 'vibe-chips'
    };
    const target = document.getElementById(fieldMap[firstMissing]);
    if(target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return null;
  }
  
  hintEl.textContent = '';
  return data;
}

function startQuickMatch() {
  // Validate form
  const formData = validateMatchForm();
  if(!formData) {
    showToast('请先完成必选项');
    return;
  }
  
  document.getElementById('quick-match-form').style.display = 'none';
  document.getElementById('quick-match-process').style.display = 'block';
  document.getElementById('quick-match-result').style.display = 'none';

  // Reset algo steps
  for(let i = 0; i < 4; i++) {
    document.getElementById('algo-status-' + i).textContent = '⏳';
    document.querySelector(`.algo-step[data-step="${i}"]`).classList.remove('active', 'done');
  }

  // Build dynamic step descriptions based on form data
  const cuisineText = formData.cuisine[0] || '美食';
  const vibeText = formData.vibe[0] || '普通聊天';
  const allergyText = formData.allergy[0] || '无忌口';
  const behaviorText = formData.forbiddenBehaviors.length > 0 
    ? '排除' + formData.forbiddenBehaviors.length + '项不兼容行为' 
    : '无行为限制';
  const topicsText = formData.topics.length > 0 
    ? '匹配' + formData.topics.length + '个共同话题' 
    : '通用社交匹配';
  
  const stepDescs = [
    [`筛选${cuisineText}+${formData.time[0] || '时段'}+${formData.budget[0] || '预算'}的候选用户...`, `找到 ${1200 + Math.floor(Math.random()*200)} 名候选用户`],
    [`计算口味向量，${allergyText}，${behaviorText}...`, `匹配到 ${30 + Math.floor(Math.random()*20)} 名高相似度用户`],
    [`分析${vibeText}偏好，${topicsText}...`, `深度匹配 ${10 + Math.floor(Math.random()*8)} 名灵魂契合用户`],
    ['预测约饭成功概率，生成最终推荐...', '为你锁定最佳饭搭子！']
  ];
  const statusTexts = [
    '正在筛选候选用户...',
    '正在计算口味偏好向量...',
    '正在分析社交风格...',
    '正在预测约饭成功率...'
  ];

  let step = 0;
  function runStep() {
    if(step > 0) {
      // Mark previous as done
      document.querySelector(`.algo-step[data-step="${step-1}"]`).classList.remove('active');
      document.querySelector(`.algo-step[data-step="${step-1}"]`).classList.add('done');
      document.getElementById('algo-status-' + (step-1)).textContent = '✅';
      document.getElementById('algo-desc-' + (step-1)).textContent = stepDescs[step-1][1];
    }
    if(step < 4) {
      document.querySelector(`.algo-step[data-step="${step}"]`).classList.add('active');
      document.getElementById('match-status-text').innerHTML = statusTexts[step] + '<span class="matching-dots"></span>';
      step++;
      setTimeout(runStep, 900);
    } else {
      // Show result - use MockAPI for potential no-match
      MockAPI.runMatch({})
        .then(res => {
          document.getElementById('quick-match-process').style.display = 'none';
          if(res.noMatch) {
            // No match found - show empty state
            document.getElementById('quick-match-result').style.display = 'block';
            document.getElementById('quick-match-result').innerHTML = `
              <div class="empty-state" style="padding:30px;">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">${res.reason}</div>
                <button class="btn btn-secondary btn-sm mt-3" onclick="resetQuickMatch()">🔄 重新筛选</button>
              </div>
            `;
          } else {
            document.getElementById('quick-match-result').style.display = 'block';
            const p = res.match;
            document.getElementById('qm-avatar').textContent = p.avatar;
            document.getElementById('qm-name').textContent = p.name;
            document.getElementById('qm-meta').textContent = p.tags.join(' · ');
            document.querySelector('.match-score-badge').textContent = p.score + '匹配';
            document.getElementById('qm-reason').textContent = p.reason;
            document.getElementById('qm-tags').innerHTML = p.tags.map(t => `<span class="tag active">${t}</span>`).join('');
          }
        });
    }
  }
  runStep();
}

function resetQuickMatch() {
  document.getElementById('quick-match-form').style.display = 'block';
  document.getElementById('quick-match-process').style.display = 'none';
  document.getElementById('quick-match-result').style.display = 'none';
}

function confirmMatch() {
  const name = document.getElementById('qm-name').textContent;
  const avatar = document.getElementById('qm-avatar').textContent;
  const formData = collectMatchFormData();
  const cuisine = formData.cuisine[0] || '美食';
  // Show escrow payment modal first
  pendingMatchData = { name: name, avatar: avatar, cuisine: cuisine, formData: formData };
  document.getElementById('pay-status-area').innerHTML = '';
  document.getElementById('pay-confirm-btn').style.display = 'block';
  document.getElementById('pay-confirm-btn').textContent = '确认预授权冻结';
  document.getElementById('pay-modal').classList.add('active');
}

let pendingMatchData = null;

function confirmEscrowPay() {
  const btn = document.getElementById('pay-confirm-btn');
  btn.textContent = '正在冻结...';
  btn.disabled = true;
  MockAPI.escrowPay(58)
    .then(res => {
      btn.textContent = '✅ 预授权冻结成功';
      document.getElementById('pay-status-area').innerHTML = '<div class="pay-status-badge frozen" style="margin-top:12px;">❄️ ¥58.00 已冻结</div>';
      btn.disabled = false;
      btn.onclick = function() {
        document.getElementById('pay-modal').classList.remove('active');
        btn.onclick = confirmEscrowPay;
        btn.textContent = '确认预授权冻结';
        btn.disabled = false;
        Store.addMeal({
          id: Date.now(),
          name: pendingMatchData.name,
          avatar: pendingMatchData.avatar,
          restaurant: pendingMatchData.cuisine + '餐厅',
          time: '今天 18:30',
          status: 'confirmed',
          reviewed: false,
          flowStep: 0,
          payment: { amount: 58, status: 'frozen', frozenAt: new Date().toLocaleString(), txnId: res.transactionId }
        });
        showToast('🎉 约饭成功！预授权¥58已冻结');
        mockChats.unshift({avatar:pendingMatchData.avatar,name:pendingMatchData.name,preview:'太棒了！我们晚上见～',time:'刚刚',unread:1});
        Store.save();
        pendingMatchData = null;
        setTimeout(() => switchTab('chat'), 600);
      };
    })
    .catch(err => {
      showToast('❌ 支付失败：' + err.message);
      btn.textContent = '重试预授权';
      btn.disabled = false;
    });
}

function publishPost() {
  const title = document.getElementById('post-title').value.trim();
  if(!title || title.length < 4) { showToast('标题至少4个字符'); return; }
  if(title.length > 30) { showToast('标题不能超过30个字符'); return; }
  const location = document.getElementById('post-location').value || '待定';
  const time = document.getElementById('post-time').value || '待定';
  const people = Array.from(document.querySelectorAll('#meal-post .filter-chip.selected')).map(c => c.textContent).join('') || '3-4人';
  const desc = document.getElementById('post-desc').value || '';
  
  // Show loading
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : document.querySelector('#meal-post .btn-primary');
  btn.disabled = true;
  btn.textContent = '发布中...';
  
  MockAPI.publishPost({ title, location, time, people, desc })
    .then(res => {
      Store.addPost({
        id: res.postId,
        title: title,
        location: location,
        time: time,
        people: people,
        desc: desc,
        createdAt: new Date().toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),
        status: 'open'
      });
      simulateIncomingApplications(res.postId, title);
      showToast('🎉 邀约发布成功！等待饭友报名...');
      document.getElementById('post-title').value = '';
      document.getElementById('post-location').value = '';
      document.getElementById('post-time').value = '';
      document.getElementById('post-desc').value = '';
      btn.disabled = false;
      btn.textContent = '发布邀约';
    })
    .catch(err => {
      showToast('❌ 发布失败：' + err.message);
      btn.disabled = false;
      btn.textContent = '发布邀约';
    });
}

const mockApplicantPool = [
  {avatar:'👩',name:'甜筒小姐',meta:'25岁 · 设计师 · 朝阳区',tags:['ENFP','火锅控','美食博主'],score:'95%',reason:'你们都爱火锅，她还是朝阳区美食探店达人'},
  {avatar:'👨',name:'火锅侠',meta:'28岁 · 程序员 · 海淀区',tags:['INTJ','无辣不欢','单身'],score:'92%',reason:'程序员的严谨加上对辣的执着，约饭靠谱度满分'},
  {avatar:'👩‍🦰',name:'吃货小当家',meta:'24岁 · 运营 · 望京',tags:['ESFP','甜品控','探店达人'],score:'90%',reason:'社交达人，有她在饭局永远不会冷场'},
  {avatar:'🧑',name:'老饕',meta:'30岁 · 编辑 · 东城区',tags:['INFP','私房菜','安静'],score:'88%',reason:'资深美食编辑，能带你发现隐藏好店'}
];

function simulateIncomingApplications(postId, title) {
  // Generate 2-3 random applications after 3 seconds
  setTimeout(() => {
    const count = 2 + Math.floor(Math.random() * 2);
    const shuffled = [...mockApplicantPool].sort(() => Math.random() - 0.5);
    for(let i = 0; i < count; i++) {
      const a = shuffled[i];
      Store.addApplication(postId, {
        ...a,
        id: Date.now() + i,
        message: ['很想一起约饭！我超喜欢吃这家！','时间很合适，期待见面～','看到你的帖子就心动了，报名！'][i % 3],
        appliedAt: '刚刚'
      });
    }
    showToast('📢 你的邀约收到 ' + count + ' 个报名！');
  }, 3000);
}

function renderPostsPage() {
  const container = document.getElementById('posts-list-container');
  const posts = Store.posts;
  if(posts.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-text">还没有发布过邀约</div><div class="empty-state-hint">去"约饭"页面发一个吧！</div></div>';
    return;
  }
  container.innerHTML = posts.map(p => {
    const apps = Store.postApplications[p.id] || [];
    const newApps = apps.filter(a => !a.status).length;
    return `
      <div class="history-card" style="margin-bottom:12px;">
        <div class="history-info">
          <div class="history-title">${p.title}</div>
          <div class="history-meta">📍 ${p.location} · ⏰ ${p.time} · 👥 ${p.people}</div>
          ${p.desc ? `<div class="text-xs text-muted" style="margin-top:4px;">${p.desc}</div>` : ''}
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            <span class="history-status ${p.status==='open'?'status-pending':'status-done'}">${p.status==='open'?'招募中':'已结束'}</span>
            <span class="text-xs text-muted">${apps.length}人报名</span>
            ${newApps > 0 ? `<span class="chat-badge">${newApps}</span>` : ''}
          </div>
          ${apps.length > 0 ? `<button class="btn btn-primary btn-sm mt-2" onclick="viewApplications(${p.id})">查看报名</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  // Update profile arrow
  document.getElementById('posts-arrow').innerHTML = posts.length + '条 ›';
}

function viewApplications(postId) {
  const apps = Store.postApplications[postId] || [];
  const post = Store.posts.find(p => p.id === postId);
  const container = document.getElementById('applicant-detail-content');
  container.innerHTML = `
    <h3 class="text-center font-bold" style="font-size:16px;margin-bottom:4px;">📢 ${post ? post.title : '邀约报名'}</h3>
    <p class="text-center text-light text-sm mb-3">${apps.length}人报名</p>
    <div id="applicants-list">
      ${apps.map((a, idx) => `
        <div class="applicant-card">
          <div class="applicant-avatar">${a.avatar}</div>
          <div class="applicant-info">
            <div class="applicant-name">${a.name} <span style="font-size:12px;color:var(--coral);font-weight:700;">${a.score}</span></div>
            <div class="applicant-meta">${a.meta}</div>
            <div class="applicant-tags">${a.tags.map(t => `<span class="applicant-tag">${t}</span>`).join('')}</div>
            <div class="text-xs text-muted" style="margin-top:4px;font-style:italic;">"${a.message}"</div>
          </div>
          <div class="applicant-actions">
            ${a.status === 'accepted' ? '<span class="text-xs font-bold" style="color:var(--green);">✅ 已确认</span>' :
              a.status === 'rejected' ? '<span class="text-xs text-muted">已拒绝</span>' :
              `<button class="applicant-btn accept" onclick="acceptApplicant(${postId}, ${a.id})">确认</button>
               <button class="applicant-btn reject" onclick="rejectApplicant(${postId}, ${a.id})">拒绝</button>`}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('applicant-modal').classList.add('active');
}

function acceptApplicant(postId, applicantId) {
  const apps = Store.data.postApplications[postId];
  if(!apps) return;
  const app = apps.find(a => a.id === applicantId);
  if(app) {
    app.status = 'accepted';
    Store.save();
    // Create meal and chat
    Store.addMeal({
      id: Date.now(),
      name: app.name,
      avatar: app.avatar,
      restaurant: Store.posts.find(p => p.id === postId)?.location || '餐厅',
      time: Store.posts.find(p => p.id === postId)?.time || '待定',
      status: 'confirmed',
      reviewed: false,
      flowStep: 0,
      payment: { amount: 58, status: 'frozen', frozenAt: new Date().toLocaleString() }
    });
    mockChats.unshift({avatar:app.avatar,name:app.name,preview:'很高兴能一起约饭！期待见面～',time:'刚刚',unread:1});
    Store.save();
    showToast('🎉 已确认 ' + app.name + ' 的报名！');
    // Mark other applicants as rejected
    apps.forEach(a => { if(a.id !== applicantId && !a.status) a.status = 'rejected'; });
    Store.save();
    // Close modal and re-render
    document.getElementById('applicant-modal').classList.remove('active');
    renderPostsPage();
  }
}

function rejectApplicant(postId, applicantId) {
  const apps = Store.data.postApplications[postId];
  if(!apps) return;
  const app = apps.find(a => a.id === applicantId);
  if(app) {
    app.status = 'rejected';
    Store.save();
    showToast('已拒绝该报名');
    viewApplications(postId);
    renderPostsPage();
  }
}

// ==================== CREDIT SCORE PAGE ====================
function renderCreditPage() {
  const score = Store.creditScore;
  animateCounter('credit-score-display', score);
  // Determine tier
  let tier, tierDesc;
  if(score >= 150) { tier = '🏆 钻石饭友'; tierDesc = '你是饭泛之交的顶级美食家！'; }
  else if(score >= 120) { tier = '🥇 黄金饭友'; tierDesc = '美食达人的称号非你莫属'; }
  else if(score >= 100) { tier = '🥈 白银饭友'; tierDesc = '继续保持，更多约饭等你解锁'; }
  else if(score >= 80) { tier = '🥉 青铜饭友'; tierDesc = '完成更多约饭和认证可提升等级'; }
  else { tier = '⚠️ 观察中'; tierDesc = '信用分较低，请避免爽约行为'; }
  document.getElementById('credit-tier-badge').textContent = tier;
  document.getElementById('credit-tier-desc').textContent = tierDesc;
  // Render history
  const history = Store.creditHistory;
  const list = document.getElementById('credit-history-list');
  if(history.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无变动记录</div></div>';
  } else {
    list.innerHTML = history.map(h => `
      <div class="credit-history-item">
        <div class="credit-history-delta ${h.delta > 0 ? 'plus' : 'minus'}">${h.delta > 0 ? '+' : ''}${h.delta}</div>
        <div class="credit-history-info">
          <div class="credit-history-reason">${h.reason}</div>
          <div class="credit-history-time">${h.time}</div>
        </div>
        <div class="credit-history-score">${h.score}分</div>
      </div>
    `).join('');
  }
  // Update profile arrow
  document.getElementById('credit-arrow').innerHTML = score + '分 ›';
}

// ==================== VOUCHERS PAGE ====================
function renderVouchersPage() {
  const container = document.getElementById('vouchers-container');
  const vouchers = Store.vouchers;
  if(vouchers.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎫</div><div class="empty-state-text">还没有优惠券</div><div class="empty-state-hint">如果对方爽约，预授权金额将自动转为代金券</div></div>';
  } else {
    container.innerHTML = vouchers.map(v => `
      <div class="voucher-card">
        <div class="voucher-amount">¥${v.amount}<small> 代金券</small></div>
        <div class="voucher-desc">${v.reason}</div>
        <div class="voucher-meta">📅 ${v.createdAt} · ${v.expiry} · 📍 ${v.restaurant}</div>
      </div>
    `).join('');
  }
  document.getElementById('vouchers-arrow').innerHTML = vouchers.length + '张 ›';
}

function renderEvents() {
  const container = document.getElementById('event-list');
  if(!container) return;
  container.innerHTML = mockEvents.map(e => `
    <div class="event-card">
      <div class="event-img">${e.emoji}</div>
      <div class="event-title">${e.title}</div>
      <div class="event-meta">⏰ ${e.time} · 📍 ${e.loc}</div>
      <div class="event-footer">
        <div class="event-price">${e.price}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="text-xs text-muted">${e.joined}/${e.total}人</span>
          <button class="btn btn-primary btn-sm" onclick="joinEvent('${e.title}')">报名</button>
        </div>
      </div>
    </div>
  `).join('');
}

function joinEvent(title) {
  showToast('🎉 报名「'+title+'」成功！');
}