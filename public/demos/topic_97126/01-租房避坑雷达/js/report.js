/* ========================================
   报告页脚本 - report.html 专属
   ======================================== */

/* 打开弹窗 */
function openModal() {
  document.getElementById('modalOverlay').classList.add('show');
}

/* 关闭弹窗 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('riskTitle').value = '';
  document.getElementById('riskDesc').value = '';
}

/* 保存风险记录 */
function saveRiskItem() {
  const title = document.getElementById('riskTitle').value.trim();
  const desc = document.getElementById('riskDesc').value.trim();
  const level = document.getElementById('riskLevel').value;
  if (!title) { showToast('请输入风险名称'); return; }
  const levelNames = { 'level-high': '高风险', 'level-mid': '中风险', 'level-low': '安全' };
  const items = JSON.parse(localStorage.getItem('customRiskItems') || '[]');
  items.push({ title, desc, level, levelName: levelNames[level], id: Date.now() });
  localStorage.setItem('customRiskItems', JSON.stringify(items));
  closeModal();
  renderRiskItems();
  showToast('风险记录已添加');
}

/* 渲染自定义风险记录 */
function renderRiskItems() {
  const existing = document.getElementById('customRiskItems');
  if (existing) existing.remove();
  const items = JSON.parse(localStorage.getItem('customRiskItems') || '[]');
  if (items.length === 0) return;
  const container = document.createElement('div');
  container.id = 'customRiskItems';
  container.innerHTML = '<div class="section-title">我的风险记录</div><div class="report-card"><div class="risk-list"></div></div>';
  const list = container.querySelector('.risk-list');
  const dotColors = { 'level-high': 'var(--danger)', 'level-mid': 'var(--warn)', 'level-low': 'var(--safe)' };
  const levelStyles = {
    'level-high': 'background:rgba(251,113,133,0.15);color:var(--danger)',
    'level-mid': 'background:rgba(251,191,36,0.15);color:var(--warn)',
    'level-low': 'background:rgba(52,211,153,0.15);color:var(--safe)'
  };
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'risk-item';
    el.innerHTML = '<div class="risk-dot" style="background:' + dotColors[item.level] + '"></div><div class="risk-text">' + item.title + (item.desc ? ' — ' + item.desc : '') + '</div><span class="risk-level" style="' + levelStyles[item.level] + '">' + item.levelName + '</span>';
    list.appendChild(el);
  });
  const btn = document.querySelector('.btn-primary');
  btn.parentNode.insertBefore(container, btn);
}

/* 初始化 */
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  bindRipple('.btn-primary, .btn-secondary, .tab-item, .nav-back, .risk-item');
  renderRiskItems();
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
});
