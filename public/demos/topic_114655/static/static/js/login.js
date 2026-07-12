// ====================================================================
//  族迹 · 登录页交互逻辑
// ====================================================================

// ---------- DOM 引用 ----------
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePwdBtn = document.getElementById('togglePwd');
const loginBtn = document.getElementById('loginBtn');
const loginSpinner = document.getElementById('loginSpinner');
const toast = document.getElementById('toast');

const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// ---------- 密码显隐切换 ----------
togglePwdBtn.addEventListener('click', function () {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePwdBtn.textContent = isPassword ? '🙈' : '👁️';
});

// ---------- 实时校验 ----------
usernameInput.addEventListener('input', function () {
  validateUsername();
});

passwordInput.addEventListener('input', function () {
  validatePassword();
});

usernameInput.addEventListener('blur', function () {
  validateUsername();
  if (usernameInput.value.trim()) {
    usernameInput.classList.toggle('success', validateUsername());
    usernameInput.classList.toggle('error', !validateUsername());
  }
});

passwordInput.addEventListener('blur', function () {
  validatePassword();
  if (passwordInput.value) {
    passwordInput.classList.toggle('success', validatePassword());
    passwordInput.classList.toggle('error', !validatePassword());
  }
});

function validateUsername() {
  const val = usernameInput.value.trim();
  if (!val) {
    usernameError.textContent = '请输入账号';
    return false;
  }
  // 支持手机号、邮箱或用户名
  if (val.length < 3) {
    usernameError.textContent = '账号至少需要 3 个字符';
    return false;
  }
  usernameError.textContent = '';
  return true;
}

function validatePassword() {
  const val = passwordInput.value;
  if (!val) {
    passwordError.textContent = '请输入密码';
    return false;
  }
  if (val.length < 6) {
    passwordError.textContent = '密码长度不能少于 6 位';
    return false;
  }
  passwordError.textContent = '';
  return true;
}

// ---------- 用户映射表（账号 → 族谱成员） ----------
const USER_MAP = {
  'admin':         { userId: 13, name: '张志强', label: '张志强（第4代·管理员）' },
  '13800138000':   { userId: 7,  name: '张建国', label: '张建国（第3代·编辑者）' },
  'test@zupu.com': { userId: 19, name: '张晓明', label: '张晓明（第5代·访客）' },
};

// 动态用户的 localStorage key（与 data.js 保持一致）
const STORAGE_KEY = 'zupu_dynamic_users';

function getDynamicUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Demo 族谱首页地址（相对路径，与 login.html 同目录）
const DEMO_URL = 'index.html';

// ---------- 表单提交 ----------
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  // 清除之前的校验状态
  usernameInput.classList.remove('error', 'success');
  passwordInput.classList.remove('error', 'success');

  const isUserValid = validateUsername();
  const isPwdValid = validatePassword();

  if (!isUserValid) usernameInput.classList.add('error');
  if (!isPwdValid) passwordInput.classList.add('error');

  if (!isUserValid || !isPwdValid) return;

  // 进入加载状态
  setLoading(true);

  // 模拟登录请求
  try {
    const result = await mockLogin(usernameInput.value.trim(), passwordInput.value);
    showToast('登录成功，正在跳转……', 'success');

    // 记住我（file:// 下 localStorage 可能不可用，需静默跳过）
    try {
      if (document.getElementById('rememberMe').checked) {
        localStorage.setItem('zupu_remember_user', usernameInput.value.trim());
      } else {
        localStorage.removeItem('zupu_remember_user');
      }
    } catch (e) { /* file:// 模式静默失败 */ }

    // 模拟跳转延迟，携带用户身份跳转到族谱 Demo
    setTimeout(() => {
      const params = new URLSearchParams();
      params.set('user', result.userId);
      params.set('name', result.name);
      params.set('token', result.token);
      if (result.familyCode) {
        params.set('family', result.familyCode);
      }
      window.location.href = DEMO_URL + '#' + params.toString();
    }, 1200);
  } catch (err) {
    showToast(err.message || '登录失败，请重试', 'error');
  } finally {
    setLoading(false);
  }
});

// ---------- Mock 登录 ----------
function mockLogin(username, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. 先查硬编码用户
      const userInfo = USER_MAP[username];
      if (userInfo && (
        (username === 'admin'         && password === 'admin123') ||
        (username === '13800138000'   && password === '123456')  ||
        (username === 'test@zupu.com' && password === '123456')
      )) {
        resolve({ token: 'mock_token_' + Date.now(), ...userInfo });
        return;
      }

      // 2. 再查动态注册用户（localStorage，由"添加子女"功能写入）
      const dynamicUsers = getDynamicUsers();
      const dynUser = dynamicUsers[username];
      if (dynUser && dynUser.password === password) {
        resolve({
          familyCode: dynUser.familyCode || "",
          token: 'mock_token_' + Date.now(),
          userId: dynUser.userId,
          name: dynUser.name,
          label: dynUser.name,
        });
        return;
      }

      reject(new Error('账号或密码错误'));
    }, 800 + Math.random() * 600);
  });
}

// ---------- Toast ----------
let toastTimer;
function showToast(message, type) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ---------- Loading ----------
function setLoading(loading) {
  if (loading) {
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
  } else {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
  }
}

// ---------- 初始化：回填记住的账号 ----------
(function init() {
  try {
    const remembered = localStorage.getItem('zupu_remember_user');
    if (remembered) {
      usernameInput.value = remembered;
      document.getElementById('rememberMe').checked = true;
      validateUsername();
      usernameInput.classList.add('success');
    }
  } catch (e) { /* file:// 模式静默失败 */ }
})();
