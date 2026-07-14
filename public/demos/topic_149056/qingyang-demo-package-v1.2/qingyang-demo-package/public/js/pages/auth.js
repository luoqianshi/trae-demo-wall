const authPage = {
  currentTab: 'login',

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-container no-nav">
        <div class="auth-logo">🍃</div>
        <div class="auth-title">轻养助手</div>
        <div class="auth-subtitle">科学养生，轻松健康</div>
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab ${this.currentTab === 'login' ? 'active' : ''}" data-tab="login">登录</button>
            <button class="auth-tab ${this.currentTab === 'register' ? 'active' : ''}" data-tab="register">注册</button>
          </div>
          <div class="auth-hint">⚠️ 测试版本，手机号无需验证码</div>
          <form id="auth-form" novalidate>
            ${this.currentTab === 'register' ? `
              <div class="form-group">
                <label class="form-label">手机号</label>
                <input class="form-input" type="tel" id="auth-phone" placeholder="请输入手机号" maxlength="11" autocomplete="tel">
                <div class="form-error" id="error-phone"></div>
              </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">登录名</label>
              <input class="form-input" type="text" id="auth-username" placeholder="请输入登录名" autocomplete="username">
              <div class="form-error" id="error-username"></div>
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="password-wrapper">
                <input class="form-input" type="password" id="auth-password" placeholder="请输入密码" autocomplete="${this.currentTab === 'register' ? 'new-password' : 'current-password'}">
                <button type="button" class="toggle-password" id="toggle-password" title="显示/隐藏密码">👁</button>
              </div>
              <div class="form-error" id="error-password"></div>
            </div>
            ${this.currentTab === 'register' ? `
              <div class="form-group">
                <label class="form-label">确认密码</label>
                <input class="form-input" type="password" id="auth-confirm" placeholder="请再次输入密码" autocomplete="new-password">
                <div class="form-error" id="error-confirm"></div>
              </div>
            ` : ''}
            <button type="submit" class="btn btn-primary btn-block" id="auth-submit">
              ${this.currentTab === 'login' ? '登录' : '注册'}
            </button>
          </form>
          <button class="btn btn-secondary btn-block auth-guest-btn" id="guest-btn">游客浏览</button>
        </div>
      </div>
    `;
    this.bindEvents();
  },

  lastRegisteredName: '',

  bindEvents() {
    // Tab切换
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });

    // 密码可见性切换
    const toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pwdInput = document.getElementById('auth-password');
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          toggleBtn.textContent = '🙈';
        } else {
          pwdInput.type = 'password';
          toggleBtn.textContent = '👁';
        }
      });
    }

    // 表单提交
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.currentTab === 'login') {
        await this.handleLogin();
      } else {
        await this.handleRegister();
      }
    });

    // 游客浏览
    document.getElementById('guest-btn').addEventListener('click', () => {
      localStorage.setItem('guestMode', 'true');
      window.location.hash = '#/';
    });
  },

  clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));
  },

  setError(field, message) {
    const group = document.getElementById(field)?.closest('.form-group');
    const errorEl = document.getElementById(`error-${field.replace('auth-', '')}`);
    if (group) group.classList.add('error');
    if (errorEl) errorEl.textContent = message;
  },

  validate() {
    this.clearErrors();
    let valid = true;

    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!username) {
      this.setError('auth-username', '请输入登录名');
      valid = false;
    } else if (username.length < 2) {
      this.setError('auth-username', '登录名至少2个字符');
      valid = false;
    }

    if (!password) {
      this.setError('auth-password', '请输入密码');
      valid = false;
    } else if (password.length < 6) {
      this.setError('auth-password', '密码至少6个字符');
      valid = false;
    }

    if (this.currentTab === 'register') {
      const phone = document.getElementById('auth-phone').value.trim();
      const confirm = document.getElementById('auth-confirm').value;

      if (!phone) {
        this.setError('auth-phone', '请输入手机号');
        valid = false;
      } else if (!/^1\d{10}$/.test(phone)) {
        this.setError('auth-phone', '请输入正确的手机号');
        valid = false;
      }

      if (!confirm) {
        this.setError('auth-confirm', '请确认密码');
        valid = false;
      } else if (confirm !== password) {
        this.setError('auth-confirm', '两次密码不一致');
        valid = false;
      }
    }

    return valid;
  },

  async handleLogin() {
    if (!this.validate()) return;

    const btn = document.getElementById('auth-submit');
    btn.disabled = true;
    btn.textContent = '登录中...';

    try {
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value;
      console.log('[Auth] 正在登录，用户名:', username);

      const result = await api.login({
        login_name: username,
        phone: /^1\d{10}$/.test(username) ? username : undefined,
        password: password,
      });

      console.log('[Auth] 登录响应:', result);

      if (result.code === 0) {
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        localStorage.setItem('userId', result.data.user.id);
        localStorage.setItem('userInfo', JSON.stringify(result.data.user));
        localStorage.removeItem('guestMode');

        // 检查是否需要完善信息
        if (result.data.needsOnboarding) {
          window.location.hash = '#/onboarding';
        } else {
          window.location.hash = '#/';
        }
      } else {
        console.error('[Auth] 登录失败:', result.code, result.message);
        const msg = result.message || '登录失败';
        if (typeof showToast === 'function') {
          showToast(msg, 'error');
        } else {
          alert(msg);
        }
      }
    } catch (err) {
      console.error('[Auth] 登录异常:', err);
      const msg = '网络错误，请检查服务器是否运行后重试';
      if (typeof showToast === 'function') {
        showToast(msg, 'error');
      } else {
        alert(msg);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = '登录';
    }
  },

  async handleRegister() {
    if (!this.validate()) return;

    const btn = document.getElementById('auth-submit');
    btn.disabled = true;
    btn.textContent = '注册中...';

    try {
      const result = await api.register({
        phone: document.getElementById('auth-phone').value.trim(),
        login_name: document.getElementById('auth-username').value.trim(),
        password: document.getElementById('auth-password').value,
      });

      if (result.code === 0) {
        this.lastRegisteredName = document.getElementById('auth-username').value.trim();
        showToast('注册成功，请登录', 'success');
        this.currentTab = 'login';
        this.render();
        // 自动填充登录名
        const loginInput = document.getElementById('auth-username');
        if (loginInput && this.lastRegisteredName) {
          loginInput.value = this.lastRegisteredName;
        }
      } else {
        showToast(result.message || '注册失败', 'error');
      }
    } catch (err) {
      showToast('网络错误，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '注册';
    }
  }
};
