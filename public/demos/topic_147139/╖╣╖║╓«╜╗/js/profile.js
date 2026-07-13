/**
 * 饭泛之交 - Profile 个人中心
 * 模块化拆分自单文件原型
 */

// ==================== PROFILE ====================
function renderProfile() {
  if(Store.user) {
    document.getElementById('profile-name').textContent = Store.user.name;
    document.getElementById('profile-id').textContent = 'ID: 88' + Store.user.phone.slice(-6);
    document.getElementById('profile-avatar').textContent = Store.user.avatar || '😊';
  }
  document.getElementById('stat-meals').textContent = Store.data.mealHistory.length;
  animateCounter('stat-score', Store.creditScore);
  const list = document.getElementById('history-list');
  if(Store.data.mealHistory.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🍽️</div><div class="empty-state-text">还没有约饭记录</div><div class="empty-state-hint">快去匹配一个饭搭子吧！</div></div>';
  } else {
    list.innerHTML = Store.data.mealHistory.map(h => {
      const flowSteps = [
        {label:'已确认', icon:'✅', color:'var(--coral)'},
        {label:'已认证', icon:'🤳', color:'var(--coral)'},
        {label:'已签到', icon:'📍', color:'var(--coral)'},
        {label:'已完成', icon:'🎉', color:'var(--green)'}
      ];
      const currentStep = h.flowStep || 0;
      const statusLabel = h.reviewed ? '已评价' : flowSteps[currentStep].label;
      const statusClass = h.reviewed ? 'status-done' : 'status-pending';
      let actionBtn = '';
      if(!h.reviewed) {
        if(currentStep === 0) {
          actionBtn = `<button class="btn btn-primary btn-sm" onclick="advanceMealFlow(${h.id})">🤳 赴约前认证</button>`;
        } else if(currentStep === 1) {
          actionBtn = `<button class="btn btn-primary btn-sm" onclick="advanceMealFlow(${h.id})">📍 到店签到</button>`;
        } else if(currentStep === 2) {
          actionBtn = `<button class="btn btn-primary btn-sm" onclick="advanceMealFlow(${h.id})">✅ 完成约饭</button>`;
        } else if(currentStep === 3) {
          actionBtn = `<button class="btn btn-primary btn-sm" onclick="openReview(${h.id})">🌟 去评价</button>`;
        }
      } else {
        actionBtn = '<span class="text-xs text-muted">已评价</span>';
      }
      return `
      <div class="history-card">
        <div class="history-img">${h.avatar}</div>
        <div class="history-info">
          <div class="history-title">与 ${h.name} 的约饭</div>
          <div class="history-meta">${h.restaurant} · ${h.time}</div>
          <span class="history-status ${statusClass}">${statusLabel}</span>
          ${actionBtn}
        </div>
      </div>
    `;
    }).join('');
  }
  renderProfileBadges();
  // Update menu arrows with status
  const v = Store.verification;
  const verifiedCount = Object.values(v).filter(item => item.status === 'verified').length;
  document.getElementById('verify-arrow').innerHTML = verifiedCount + '/5 ›';
  const availableCodes = Store.invitationCodes.filter(c => !c.used).length;
  document.getElementById('invite-arrow').innerHTML = availableCodes + '个可用 ›';
  document.getElementById('credit-arrow').innerHTML = Store.creditScore + '分 ›';
  document.getElementById('posts-arrow').innerHTML = Store.posts.length + '条 ›';
  document.getElementById('vouchers-arrow').innerHTML = Store.vouchers.length + '张 ›';
}

function renderProfileBadges() {
  const container = document.getElementById('profile-badges');
  if(!container) return;
  const v = Store.verification;
  const badges = [];
  if(v.basic.status === 'verified') badges.push('<span class="tag" style="background:var(--green-light);color:var(--green);">📱 基础✅</span>');
  if(v.realname.status === 'verified') badges.push('<span class="tag" style="background:var(--green-light);color:var(--green);">🪪 实名✅</span>');
  if(v.face.status === 'verified') badges.push('<span class="tag" style="background:var(--green-light);color:var(--green);">🤳 人脸✅</span>');
  if(v.education.status === 'verified') badges.push('<span class="tag" style="background:var(--green-light);color:var(--green);">🎓 学历✅</span>');
  if(v.profession.status === 'verified') badges.push('<span class="tag" style="background:var(--green-light);color:var(--green);">💼 职业✅</span>');
  if(badges.length === 0) badges.push('<span class="text-xs text-muted">尚未完成任何认证</span>');
  container.innerHTML = badges.join('');
}