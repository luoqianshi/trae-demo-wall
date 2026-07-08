/**
 * 主应用逻辑 App
 */

// 数字递增动画函数
function animateNumber(element, newValue, duration = 600) {
  const currentValue = parseFloat(element.textContent) || 0;
  const startTime = performance.now();
  const isDecimal = newValue.toString().includes('.');

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeProgress = 1 - Math.pow(1 - progress, 2);
    const current = currentValue + (newValue - currentValue) * easeProgress;

    element.textContent = isDecimal ? current.toFixed(1) : Math.round(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// 页面切换
function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageName).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${pageName}"]`);
  if (nav) nav.classList.add('active');

  // 刷新页面数据
  if (pageName === 'dashboard') renderDashboard();
  if (pageName === 'tasks') renderTasks();
  if (pageName === 'schedule') renderSchedule();
  if (pageName === 'focus') renderFocusRecords();
  if (pageName === 'review') renderReview();
}

// Toast 提示
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// 确认对话框
let confirmCallback = null;
function showConfirmDialog(title, message, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-dialog').classList.add('show');
  confirmCallback = callback;
}

function hideConfirmDialog() {
  document.getElementById('confirm-dialog').classList.remove('show');
  confirmCallback = null;
}

function handleConfirm() {
  if (confirmCallback) {
    confirmCallback();
  }
  hideConfirmDialog();
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initData();
  renderSubjectGrid();
  renderTemplates();
  renderDashboard();
  renderTasks();
  renderSchedule();
  renderFocusRecords();
  renderReview();
  updateFocusDisplay();
});
