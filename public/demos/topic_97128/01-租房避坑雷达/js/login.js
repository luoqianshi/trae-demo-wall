/* ========================================
   登录页脚本 - 页面专属
   ======================================== */

/* 元素抖动动画 */
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
}

/* 登录处理 */
function handleLogin(e) {
  createRipple(e);
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const userVal = username.value.trim();
  const passVal = password.value.trim();

  if (!userVal) {
    showToast('请输入账号');
    shakeElement(username);
    username.focus();
    return;
  }
  if (!passVal) {
    showToast('请输入密码');
    shakeElement(password);
    password.focus();
    return;
  }

  const btn = e.currentTarget;
  btn.innerHTML = '<span class="loading"></span> 登录中...';
  btn.disabled = true;

  setTimeout(() => {
    localStorage.setItem('loggedIn', 'true');
    showToast('登录成功');
    setTimeout(() => {
      window.location.href = 'pages/home.html';
    }, 1000);
  }, 1500);
}

/* 第三方登录处理 */
function handleSocialLogin(e, type) {
  createRipple(e);
  const names = { wechat: '微信', alipay: '支付宝', qq: 'QQ' };
  showToast(`${names[type]}登录功能开发中`);
}

/* 初始化绑定 */
document.addEventListener('DOMContentLoaded', () => {
  const primaryBtns = document.querySelectorAll('.btn-primary, .social-btn, .btn-secondary');
  primaryBtns.forEach(btn => {
    btn.addEventListener('mousedown', createRipple);
  });

  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.click();
      }
    });
  });
});
