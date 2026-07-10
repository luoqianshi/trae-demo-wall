/* ========================================
   公共脚本 - 所有页面共享
   ======================================== */

/* 涟漪动画 */
function createRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top = (e.clientY - rect.top) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

/* Toast 提示 */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/* 页面跳转 */
function goPage(url) {
  window.location.href = url;
}

/* 登录验证 */
function checkLogin() {
  if (!localStorage.getItem('loggedIn')) {
    window.location.href = (typeof LOGIN_PATH !== 'undefined') ? LOGIN_PATH : '../login.html';
  }
}

/* 绑定涟漪动画 */
function bindRipple(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('mousedown', createRipple);
  });
}
