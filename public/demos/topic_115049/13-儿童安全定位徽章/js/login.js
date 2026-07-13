/* ===== 粒子背景 ===== */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const particles = Array.from({ length: 50 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.5 + 0.5,
  dx: (Math.random() - 0.5) * 0.3,
  dy: (Math.random() - 0.5) * 0.3
}));

function drawParticles() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0 || p.x > W) p.dx *= -1;
    if (p.y < 0 || p.y > H) p.dy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ===== 表单验证 ===== */
const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const loginBtn = document.getElementById('loginBtn');
const btnText = loginBtn.querySelector('.btn-text');

/* 验证用户名 */
function validateUsername() {
  const val = usernameInput.value.trim();
  if (!val) {
    usernameInput.classList.add('is-error');
    usernameError.textContent = '请输入手机号或用户名';
    usernameError.classList.add('show');
    return false;
  }
  usernameInput.classList.remove('is-error');
  usernameError.classList.remove('show');
  return true;
}

/* 验证密码 */
function validatePassword() {
  const val = passwordInput.value;
  if (!val) {
    passwordInput.classList.add('is-error');
    passwordError.textContent = '请输入密码';
    passwordError.classList.add('show');
    return false;
  }
  if (val.length < 6) {
    passwordInput.classList.add('is-error');
    passwordError.textContent = '密码长度至少 6 位';
    passwordError.classList.add('show');
    return false;
  }
  passwordInput.classList.remove('is-error');
  passwordError.classList.remove('show');
  return true;
}

/* 失焦验证 */
usernameInput.addEventListener('blur', validateUsername);
passwordInput.addEventListener('blur', validatePassword);

/* 输入时清除错误态 */
usernameInput.addEventListener('input', () => {
  if (usernameInput.classList.contains('is-error')) {
    usernameInput.classList.remove('is-error');
    usernameError.classList.remove('show');
  }
});

passwordInput.addEventListener('input', () => {
  if (passwordInput.classList.contains('is-error')) {
    passwordInput.classList.remove('is-error');
    passwordError.classList.remove('show');
  }
});

/* 获取已注册用户列表 */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  } catch (e) {
    return [];
  }
}

/* ===== 登录提交 ===== */
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const isUserValid = validateUsername();
  const isPwdValid = validatePassword();

  if (!isUserValid || !isPwdValid) {
    return;
  }

  /* 模拟登录加载 */
  loginBtn.classList.add('is-loading');
  loginBtn.disabled = true;

  setTimeout(() => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const users = getUsers();

    /* 如果有注册用户，则验证账号密码；否则演示模式任意账号可登录 */
    if (users.length > 0) {
      const user = users.find(u => u.username === username);
      if (!user) {
        usernameInput.classList.add('is-error');
        usernameError.textContent = '该账号未注册';
        usernameError.classList.add('show');
        loginBtn.classList.remove('is-loading');
        loginBtn.disabled = false;
        return;
      }
      if (user.password !== password) {
        passwordInput.classList.add('is-error');
        passwordError.textContent = '密码错误';
        passwordError.classList.add('show');
        loginBtn.classList.remove('is-loading');
        loginBtn.disabled = false;
        return;
      }
      /* 保存昵称 */
      if (user.nickname) {
        localStorage.setItem('nickname', user.nickname);
      }
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);

    loginBtn.classList.remove('is-loading');
    loginBtn.disabled = false;

    /* 跳转到主应用 */
    window.location.href = 'pages/app.html';
  }, 1200);
});

/* ===== Toast 提示 ===== */
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = 'toast toast--' + (type || 'info');
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

/* ===== 记住我功能 ===== */
const rememberCheckbox = document.getElementById('remember');
if (rememberCheckbox) {
  const savedUsername = localStorage.getItem('rememberedUsername');
  if (savedUsername) {
    usernameInput.value = savedUsername;
    rememberCheckbox.checked = true;
  }
  
  rememberCheckbox.addEventListener('change', () => {
    if (rememberCheckbox.checked && usernameInput.value.trim()) {
      localStorage.setItem('rememberedUsername', usernameInput.value.trim());
    } else {
      localStorage.removeItem('rememberedUsername');
    }
  });
}

/* ===== 忘记密码 ===== */
const forgotLink = document.querySelector('.forgot-link');
if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('💡 请联系客服找回密码', 'info');
  });
}

/* ===== 第三方登录按钮 ===== */
document.querySelectorAll('.alt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const title = btn.getAttribute('title');
    showToast('🔄 ' + title + '开发中...', 'info');
  });
});

/* ===== 如果已登录直接跳转 ===== */
if (localStorage.getItem('isLoggedIn')) {
  window.location.href = 'pages/app.html';
}
