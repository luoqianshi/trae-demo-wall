/**
 * 食光机 - 登录/注册页逻辑
 */

(async function () {
  // 如果已登录，跳转到时光轴
  if (API.isLoggedIn()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        window.location.href = 'timeline.html';
        return;
      }
    } catch (err) {
      // token无效，继续显示登录页
    }
  }

  // 渲染导航栏
  await renderNav('home');

  // 绑定事件
  bindEvents();
})();

/**
 * 绑定所有事件
 */
function bindEvents() {
  // 标签切换
  document.querySelectorAll('.auth-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchMode(tab.dataset.mode);
    });
  });

  // 登录按钮
  document.getElementById('loginBtn').addEventListener('click', handleLogin);

  // 注册按钮
  document.getElementById('registerBtn').addEventListener('click', handleRegister);

  // 回车提交
  document.getElementById('loginPassword').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('registerConfirm').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleRegister();
  });

  // 输入时清除错误
  document.querySelectorAll('.form-input').forEach(function (input) {
    input.addEventListener('input', function () {
      const errorEl = input.parentElement.querySelector('.form-error');
      if (errorEl) errorEl.classList.remove('show');
    });
  });
}

/**
 * 切换登录/注册模式
 */
function switchMode(mode) {
  document.querySelectorAll('.auth-tab').forEach(function (tab) {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  document.getElementById('loginForm').style.display = mode === 'login' ? '' : 'none';
  document.getElementById('registerForm').style.display = mode === 'register' ? '' : 'none';

  // 清除所有错误
  document.querySelectorAll('.form-error').forEach(function (el) {
    el.classList.remove('show');
  });
}

/**
 * 显示表单错误
 */
function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

/**
 * 处理登录
 */
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  // 验证
  let hasError = false;
  if (!username) {
    showFieldError('loginUsername', '请输入用户名');
    hasError = true;
  }
  if (!password) {
    showFieldError('loginPassword', '请输入密码');
    hasError = true;
  }
  if (hasError) return;

  const btn = document.getElementById('loginBtn');
  const originalText = btn.textContent;
  btn.textContent = '登录中...';
  btn.disabled = true;

  try {
    const res = await API.login(username, password);
    if (res.success && res.data) {
      API.setToken(res.data.token);
      showToast('登录成功，欢迎回来！', 'success');
      setTimeout(function () {
        window.location.href = 'timeline.html';
      }, 800);
    } else {
      showToast(res.message || '登录失败', 'error');
    }
  } catch (err) {
    showToast(err.message || '登录失败，请检查用户名和密码', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

/**
 * 处理注册
 */
async function handleRegister() {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirm').value;

  // 验证
  let hasError = false;
  if (!username) {
    showFieldError('registerUsername', '请输入用户名');
    hasError = true;
  } else if (username.length < 3 || username.length > 20) {
    showFieldError('registerUsername', '用户名长度3-20位');
    hasError = true;
  }
  if (!password) {
    showFieldError('registerPassword', '请输入密码');
    hasError = true;
  } else if (password.length < 6) {
    showFieldError('registerPassword', '密码至少6位');
    hasError = true;
  }
  if (!confirm) {
    showFieldError('registerConfirm', '请确认密码');
    hasError = true;
  } else if (password !== confirm) {
    showFieldError('registerConfirm', '两次密码不一致');
    hasError = true;
  }
  if (hasError) return;

  const btn = document.getElementById('registerBtn');
  const originalText = btn.textContent;
  btn.textContent = '注册中...';
  btn.disabled = true;

  try {
    const res = await API.register(username, password);
    if (res.success && res.data) {
      API.setToken(res.data.token);
      showToast('注册成功，欢迎加入食光机！', 'success');
      setTimeout(function () {
        window.location.href = 'timeline.html';
      }, 800);
    } else {
      showToast(res.message || '注册失败', 'error');
    }
  } catch (err) {
    showToast(err.message || '注册失败，请稍后重试', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
