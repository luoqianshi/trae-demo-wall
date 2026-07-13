/**
 * 饭泛之交 - App 初始化
 * 模块化拆分自单文件原型
 */

// ==================== INIT ====================
renderHome();
renderRank('recommend');
renderEvents();
renderChatList();

// Initialize scroll reveal after a short delay
setTimeout(initScrollReveal, 500);

// 会话恢复：如果用户已登录，跳过启动页直接进入首页
function restoreSession() {
  if (Store.isLoggedIn && Store.user) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('bottom-nav').style.display = 'flex';
    switchTab(Store.data.currentTab || 'home');
    showToast('欢迎回来，' + Store.user.name + ' 👋');
  }
}

// 页面加载后稍延迟恢复会话（等loader动画结束）
setTimeout(restoreSession, 1400);

// Show demo FAB when logged in
function showDemoFab() {
  const fab = document.getElementById('demo-fab');
  const panel = document.getElementById('demo-panel');
  if (Store.isLoggedIn) {
    fab.style.display = 'flex';
    panel.style.display = 'block';
  } else {
    fab.style.display = 'none';
    panel.style.display = 'none';
    panel.classList.remove('active');
    fab.classList.remove('active');
  }
}
// Check on load and after login
setTimeout(showDemoFab, 1500);
setInterval(showDemoFab, 2000);

// Re-init scroll reveal when switching tabs
const originalSwitchTab = switchTab;
switchTab = function(tab) {
  originalSwitchTab(tab);
  setTimeout(initScrollReveal, 100);
};

// Close modal on backdrop click
document.getElementById('review-modal').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('active');
});
document.getElementById('face-modal').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('active');
});
document.getElementById('pay-modal').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('active');
});
document.getElementById('applicant-modal').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('active');
});