/* ========================================
   验房清单页 - 页面专属脚本
   ======================================== */

/* 切换检查项状态 */
function toggleCheck(el) {
  el.classList.toggle('checked');
  const total = document.querySelectorAll('.check-item').length;
  const checked = document.querySelectorAll('.check-item.checked').length;
  const progress = (checked / total) * 100;
  document.getElementById('progress').style.width = progress + '%';
  document.getElementById('progressText').textContent = checked + '/' + total + ' 项已检查';
}

/* 打开添加弹窗 */
function openModal() {
  document.getElementById('modalOverlay').classList.add('show');
}

/* 关闭添加弹窗 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemDesc').value = '';
}

/* 保存自定义检查项 */
function saveCheckItem() {
  const title = document.getElementById('itemTitle').value.trim();
  const desc = document.getElementById('itemDesc').value.trim();
  const risk = document.getElementById('itemRisk').value;
  if (!title) { showToast('请输入检查项名称'); return; }
  const riskNames = { 'risk-high': '高风险', 'risk-mid': '中风险', 'risk-low': '低风险' };
  const items = JSON.parse(localStorage.getItem('customCheckItems') || '[]');
  items.push({ title, desc, risk, riskName: riskNames[risk], id: Date.now() });
  localStorage.setItem('customCheckItems', JSON.stringify(items));
  closeModal();
  renderCustomItems();
  showToast('检查项已添加');
}

/* 渲染自定义检查项 */
function renderCustomItems() {
  const existing = document.getElementById('customCheckItems');
  if (existing) existing.remove();
  const items = JSON.parse(localStorage.getItem('customCheckItems') || '[]');
  if (items.length === 0) return;
  const container = document.createElement('div');
  container.id = 'customCheckItems';
  container.innerHTML = '<div class="section-title">我的检查项</div>';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'check-item';
    el.onclick = function() { toggleCheck(this); };
    el.innerHTML = '<div class="check-box"></div><div class="check-content"><div class="check-title">' + item.title + '</div><div class="check-desc">' + item.desc + '</div><span class="risk-tag ' + item.risk + '">' + item.riskName + '</span></div>';
    container.appendChild(el);
  });
  const btn = document.querySelector('.btn-primary');
  btn.parentNode.insertBefore(container, btn);
}

/* 初始化 */
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  const total = document.querySelectorAll('.check-item').length;
  const checked = document.querySelectorAll('.check-item.checked').length;
  document.getElementById('progress').style.width = (checked / total * 100) + '%';
  document.getElementById('progressText').textContent = checked + '/' + total + ' 项已检查';

  renderCustomItems();
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

  bindRipple('.check-item, .btn-primary, .tab-item, .nav-back');
});
