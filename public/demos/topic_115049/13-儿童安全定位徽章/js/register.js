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
const form = document.getElementById('registerForm');
const nicknameInput = document.getElementById('nickname');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const agreeCheckbox = document.getElementById('agree');
const nicknameError = document.getElementById('nicknameError');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const agreeError = document.getElementById('agreeError');
const registerBtn = document.getElementById('registerBtn');
const btnText = registerBtn.querySelector('.btn-text');

/* 获取已注册用户列表 */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  } catch (e) {
    return [];
  }
}

/* 保存用户列表 */
function saveUsers(users) {
  localStorage.setItem('registeredUsers', JSON.stringify(users));
}

/* 验证昵称 */
function validateNickname() {
  const val = nicknameInput.value.trim();
  if (!val) {
    nicknameInput.classList.add('is-error');
    nicknameError.textContent = '请输入昵称';
    nicknameError.classList.add('show');
    return false;
  }
  if (val.length < 2) {
    nicknameInput.classList.add('is-error');
    nicknameError.textContent = '昵称至少 2 个字符';
    nicknameError.classList.add('show');
    return false;
  }
  if (val.length > 20) {
    nicknameInput.classList.add('is-error');
    nicknameError.textContent = '昵称最多 20 个字符';
    nicknameError.classList.add('show');
    return false;
  }
  nicknameInput.classList.remove('is-error');
  nicknameError.classList.remove('show');
  return true;
}

/* 验证手机号 */
function validateUsername() {
  const val = usernameInput.value.trim();
  if (!val) {
    usernameInput.classList.add('is-error');
    usernameError.textContent = '请输入手机号';
    usernameError.classList.add('show');
    return false;
  }
  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(val)) {
    usernameInput.classList.add('is-error');
    usernameError.textContent = '请输入正确的手机号';
    usernameError.classList.add('show');
    return false;
  }
  /* 检查是否已注册 */
  const users = getUsers();
  if (users.some(u => u.username === val)) {
    usernameInput.classList.add('is-error');
    usernameError.textContent = '该手机号已注册';
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
  if (val.length > 20) {
    passwordInput.classList.add('is-error');
    passwordError.textContent = '密码长度最多 20 位';
    passwordError.classList.add('show');
    return false;
  }
  passwordInput.classList.remove('is-error');
  passwordError.classList.remove('show');
  /* 如果确认密码已填写，同步验证 */
  if (confirmPasswordInput.value) {
    validateConfirmPassword();
  }
  return true;
}

/* 验证确认密码 */
function validateConfirmPassword() {
  const val = confirmPasswordInput.value;
  const pwd = passwordInput.value;
  if (!val) {
    confirmPasswordInput.classList.add('is-error');
    confirmPasswordError.textContent = '请再次输入密码';
    confirmPasswordError.classList.add('show');
    return false;
  }
  if (val !== pwd) {
    confirmPasswordInput.classList.add('is-error');
    confirmPasswordError.textContent = '两次密码输入不一致';
    confirmPasswordError.classList.add('show');
    return false;
  }
  confirmPasswordInput.classList.remove('is-error');
  confirmPasswordError.classList.remove('show');
  return true;
}

/* 验证协议勾选 */
function validateAgree() {
  if (!agreeCheckbox.checked) {
    agreeError.textContent = '请阅读并同意用户协议和隐私政策';
    agreeError.classList.add('show');
    return false;
  }
  agreeError.classList.remove('show');
  return true;
}

/* 失焦验证 */
nicknameInput.addEventListener('blur', validateNickname);
usernameInput.addEventListener('blur', validateUsername);
passwordInput.addEventListener('blur', validatePassword);
confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
agreeCheckbox.addEventListener('change', validateAgree);

/* 输入时清除错误态 */
nicknameInput.addEventListener('input', () => {
  if (nicknameInput.classList.contains('is-error')) {
    nicknameInput.classList.remove('is-error');
    nicknameError.classList.remove('show');
  }
});

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

confirmPasswordInput.addEventListener('input', () => {
  if (confirmPasswordInput.classList.contains('is-error')) {
    confirmPasswordInput.classList.remove('is-error');
    confirmPasswordError.classList.remove('show');
  }
});

/* ===== 注册提交 ===== */
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const isNickValid = validateNickname();
  const isUserValid = validateUsername();
  const isPwdValid = validatePassword();
  const isConfirmValid = validateConfirmPassword();
  const isAgreeValid = validateAgree();

  if (!isNickValid || !isUserValid || !isPwdValid || !isConfirmValid || !isAgreeValid) {
    return;
  }

  /* 模拟注册加载 */
  registerBtn.classList.add('is-loading');
  registerBtn.disabled = true;

  setTimeout(() => {
    const nickname = nicknameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    /* 保存到 localStorage */
    const users = getUsers();
    users.push({ nickname, username, password, createdAt: Date.now() });
    saveUsers(users);

    /* 设置登录状态 */
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('nickname', nickname);

    registerBtn.classList.remove('is-loading');
    registerBtn.disabled = false;

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

/* ===== 用户协议链接 ===== */
document.querySelectorAll('.register-tip a[href="#"], .remember a[href="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const text = link.textContent;
    showToast('📖 ' + text + ' - 请阅读相关条款', 'info');
  });
});

/* ===== 第三方注册按钮 ===== */
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
