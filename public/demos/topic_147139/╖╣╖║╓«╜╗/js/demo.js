/**
 * 饭泛之交 - Demo 演示增强
 * 体验账号 / 引导模式 / 演示控制面板 / 快捷操作
 */

// ==================== DEMO ACCOUNT ====================
function quickDemoLogin() {
  // 预填体验账号数据
  Store.user = { phone: '13800138000', name: '美食体验官', avatar: '😋' };
  Store.isLoggedIn = true;
  Store.surveyCompleted = true;
  Store.data.invitedBy = 'FFZJ2026';
  
  // 生成邀请码
  if (!Store.data.inviteCodes || Store.data.inviteCodes.length === 0) {
    Store.generateInvitationCodes(3);
  }
  
  // 设置认证状态
  Store.setVerificationStatus('basic', 'verified');
  Store.setVerificationStatus('face', 'verified');
  
  // 添加演示约饭记录（含完整流程状态）
  if (Store.data.mealHistory.length === 0) {
    Store.addMeal({
      id: 100001,
      name: '辣妹子',
      avatar: '👩',
      restaurant: '海底捞火锅（三里屯店）',
      time: '今天 18:30',
      status: 'confirmed',
      reviewed: false,
      flowStep: 0,
      payment: { amount: 58, status: 'frozen', frozenAt: '2026/7/13 15:00' }
    });
    
    Store.addMeal({
      id: 100002,
      name: '火锅侠',
      avatar: '🧑',
      restaurant: '小龙坎老火锅（望京店）',
      time: '昨天 19:00',
      status: 'done',
      reviewed: true,
      flowStep: 3,
      payment: { amount: 58, status: 'paid', paidAt: '2026/7/12 19:30' }
    });
    
    Store.addCreditScore(5, '实名认证');
    Store.addCreditScore(5, '按时赴约');
  }
  
  // 切换到首页
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('bottom-nav').style.display = 'flex';
  switchTab('home');
  showToast('🎭 已进入体验模式！数据已预填充');
  
  // 首次进入显示引导
  setTimeout(() => {
    if (!Store.data.guideShown) {
      startGuide();
      Store.data.guideShown = true;
      Store.save();
    }
  }, 1200);
}

// ==================== GUIDE MODE ====================
const guideSteps = [
  {
    target: '#bottom-nav .nav-item:nth-child(1)',
    title: '🏠 首页',
    text: '浏览美食推荐、社区动态和每日菜品灵感',
    placement: 'top'
  },
  {
    target: '#bottom-nav .nav-item:nth-child(2)',
    title: '📊 榜单',
    text: '查看热门餐厅排行，找到最火的约饭地点',
    placement: 'top'
  },
  {
    target: '#bottom-nav .nav-item:nth-child(3)',
    title: '🍜 约饭',
    text: '核心功能！AI智能匹配饭搭子，或发帖邀约',
    placement: 'top'
  },
  {
    target: '#bottom-nav .nav-item:nth-child(4)',
    title: '💬 聊天',
    text: '与匹配的饭搭子聊天，含破冰话题和表情',
    placement: 'top'
  },
  {
    target: '#bottom-nav .nav-item:nth-child(5)',
    title: '👤 我的',
    text: '信用分、身份认证、邀请码、优惠券等',
    placement: 'top'
  }
];

let guideStepIndex = 0;

function startGuide() {
  guideStepIndex = 0;
  showGuideStep();
}

function showGuideStep() {
  // Remove existing guide
  const existing = document.getElementById('guide-overlay');
  if (existing) existing.remove();
  
  if (guideStepIndex >= guideSteps.length) {
    endGuide();
    return;
  }
  
  const step = guideSteps[guideStepIndex];
  const target = document.querySelector(step.target);
  
  if (!target) {
    guideStepIndex++;
    showGuideStep();
    return;
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'guide-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;';
  
  // Create spotlight
  const rect = target.getBoundingClientRect();
  const padding = 8;
  const spotlight = document.createElement('div');
  spotlight.style.cssText = `position:absolute;top:${rect.top - padding}px;left:${rect.left - padding}px;width:${rect.width + padding * 2}px;height:${rect.height + padding * 2}px;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,0.6);pointer-events:auto;cursor:pointer;border:2px solid var(--coral);animation:guidePulse 1.5s ease infinite;`;
  spotlight.onclick = () => nextGuideStep();
  overlay.appendChild(spotlight);
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `position:absolute;left:50%;transform:translateX(-50%);background:var(--white);border-radius:16px;padding:16px 20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);max-width:300px;text-align:center;z-index:10000;pointer-events:auto;animation:tooltipBounce .4s cubic-bezier(0.34,1.56,0.64,1);`;
  tooltip.style.top = (rect.top > 200 ? rect.top - 120 : rect.bottom + 20) + 'px';
  
  tooltip.innerHTML = `
    <div style="font-size:16px;font-weight:800;color:var(--coral);margin-bottom:6px;">${step.title}</div>
    <div style="font-size:13px;color:var(--text);line-height:1.5;margin-bottom:14px;">${step.text}</div>
    <div style="display:flex;gap:8px;justify-content:center;align-items:center;">
      <span style="font-size:11px;color:var(--text-muted);">${guideStepIndex + 1} / ${guideSteps.length}</span>
      <button class="btn btn-ghost btn-sm" onclick="skipGuide()" style="font-size:12px;color:var(--text-muted);">跳过</button>
      <button class="btn btn-primary btn-sm" onclick="nextGuideStep()" style="padding:6px 20px;">${guideStepIndex < guideSteps.length - 1 ? '下一个' : '完成'}</button>
    </div>
  `;
  overlay.appendChild(tooltip);
  
  document.body.appendChild(overlay);
}

function nextGuideStep() {
  guideStepIndex++;
  showGuideStep();
}

function skipGuide() {
  const overlay = document.getElementById('guide-overlay');
  if (overlay) overlay.remove();
  showToast('💡 随时在"我的"页面可以重新查看引导');
}

function endGuide() {
  const overlay = document.getElementById('guide-overlay');
  if (overlay) overlay.remove();
  showToast('🎉 引导完成！开始探索饭泛之交吧～');
}

// ==================== DEMO CONTROL PANEL ====================
function toggleDemoPanel() {
  const panel = document.getElementById('demo-panel');
  const fab = document.getElementById('demo-fab');
  if (panel.classList.contains('active')) {
    panel.classList.remove('active');
    fab.classList.remove('active');
  } else {
    panel.classList.add('active');
    fab.classList.add('active');
  }
}

// ==================== DEMO QUICK ACTIONS ====================

// 跳转到匹配页面并自动选中菜系
function demoJumpToMatch() {
  toggleDemoPanel();
  switchTab('meal');
  switchMealMode('match');
  // Auto-select hot pot + dinner + budget + no allergy + normal chat
  const cuisineChips = document.querySelectorAll('#cuisine-chips .filter-chip');
  cuisineChips.forEach(c => c.classList.remove('selected'));
  const hotpot = Array.from(cuisineChips).find(c => c.textContent.includes('火锅'));
  if(hotpot) hotpot.classList.add('selected');
  
  const timeChips = document.querySelectorAll('#time-chips .filter-chip');
  timeChips.forEach(c => c.classList.remove('selected'));
  const dinner = Array.from(timeChips).find(c => c.textContent.includes('晚餐'));
  if(dinner) dinner.classList.add('selected');
  
  const budgetChips = document.querySelectorAll('#budget-chips .filter-chip');
  budgetChips.forEach(c => c.classList.remove('selected'));
  const budget = Array.from(budgetChips).find(c => c.textContent.includes('50-100'));
  if(budget) budget.classList.add('selected');
  
  const allergyChips = document.querySelectorAll('#allergy-chips .filter-chip');
  allergyChips.forEach(c => c.classList.remove('selected'));
  const noAllergy = Array.from(allergyChips).find(c => c.textContent.includes('无忌口'));
  if(noAllergy) noAllergy.classList.add('selected');
  
  const vibeChips = document.querySelectorAll('#vibe-chips .filter-chip');
  vibeChips.forEach(c => c.classList.remove('selected'));
  const chat = Array.from(vibeChips).find(c => c.textContent.includes('普通聊天'));
  if(chat) chat.classList.add('selected');
  
  showToast('🔥 已预选火锅+晚餐+50-100元，点击"开始AI匹配"体验');
}

// 模拟爽约（创建一条爽约记录）
function demoSimulateNoShow() {
  toggleDemoPanel();
  const frozenMeal = Store.data.mealHistory.find(h => h.payment && h.payment.status === 'frozen');
  if (!frozenMeal) {
    showToast('没有待签到的约饭记录，先去匹配一个吧！');
    return;
  }
  simulateNoShow(frozenMeal.id);
}

// 快速完成约饭流程
function demoFastComplete() {
  toggleDemoPanel();
  const meal = Store.data.mealHistory.find(h => !h.reviewed && (h.flowStep || 0) < 3);
  if (!meal) {
    showToast('没有待完成的约饭记录');
    return;
  }
  // Fast-forward through all steps
  const steps = meal.flowStep || 0;
  if (steps === 0) {
    Store.updateMeal(meal.id, { flowStep: 1 });
    showToast('⏩ 已跳过人脸认证');
  }
  const m1 = Store.data.mealHistory.find(h => h.id === meal.id);
  if ((m1.flowStep || 0) === 1) {
    Store.updateMeal(meal.id, { flowStep: 2 });
    if (m1.payment && m1.payment.status === 'frozen') {
      Store.updateMeal(meal.id, { payment: { ...m1.payment, status: 'paid', paidAt: new Date().toLocaleString() } });
      Store.addCreditScore(5, '按时赴约');
    }
    showToast('⏩ 已自动签到+扣款');
  }
  const m2 = Store.data.mealHistory.find(h => h.id === meal.id);
  if ((m2.flowStep || 0) === 2) {
    Store.updateMeal(meal.id, { flowStep: 3, status: 'done' });
    showToast('⏩ 约饭已完成，可以去评价了');
  }
  renderProfile();
}

// 添加测试帖子和报名
function demoAddTestData() {
  toggleDemoPanel();
  const postId = Date.now();
  Store.addPost({
    id: postId,
    title: '周五晚上火锅局，AA制',
    location: '海底捞三里屯店',
    time: '周五 19:00',
    people: '4人',
    desc: '寻3位火锅搭子，无辣不欢优先！',
    createdAt: '刚刚',
    status: 'open'
  });
  simulateIncomingApplications(postId, '周五晚上火锅局');
  showToast('📦 已添加测试帖子，3秒后收到报名');
  renderPostsPage();
}

// 重置所有数据
function resetAllData() {
  if (!confirm('⚠️ 确定要重置所有数据吗？\n\n这将清除：\n• 用户信息和登录状态\n• 约饭记录和聊天\n• 信用分和优惠券\n• 发帖和报名\n\n重置后将回到启动页。')) return;
  
  toggleDemoPanel();
  Store.clear();
  localStorage.removeItem('ffzj_store');
  
  document.getElementById('bottom-nav').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('splash-page').classList.add('active');
  showToast('🔄 已重置所有数据');
}

// 重新查看引导
function restartGuide() {
  toggleDemoPanel();
  startGuide();
}
