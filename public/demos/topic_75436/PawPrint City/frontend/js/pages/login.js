// 爪印城市 - 登录注册页
Router.register('login', (params) => {
  const isRegister = params.mode === 'register';
  return `
    <div class="login-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">${isRegister ? '注册' : '登录'}</span>
      </div>
      <div class="login-container">
        <div class="login-logo">🐾</div>
        <div class="login-title">爪印城市</div>
        <div class="login-subtitle">宠物友好，城市更温暖</div>
        <div class="login-form">
          <div class="form-group">
            <label>手机号 <span class="required">*</span></label>
            <input class="form-input" id="login-phone" type="tel" placeholder="请输入手机号" value="138****8888" />
          </div>
          <div class="form-group">
            <label>密码 <span class="required">*</span></label>
            <input class="form-input" id="login-password" type="password" placeholder="请输入密码" value="123456" />
          </div>
          ${isRegister ? `
          <div class="form-group">
            <label>昵称 <span class="required">*</span></label>
            <input class="form-input" id="login-username" type="text" placeholder="给自己起个名字" />
          </div>` : ''}
          <button class="btn btn-primary btn-block mt-16" id="login-submit-btn">
            ${isRegister ? '注册' : '登录'}
          </button>
          <div class="login-toggle" id="login-toggle">
            ${isRegister ? '已有账号？<span class="link">去登录</span>' : '没有账号？<span class="link">去注册</span>'}
          </div>
        </div>
      </div>
    </div>
  `;
});

function init_login(params) {
  const isRegister = params.mode === 'register';

  document.getElementById('login-submit-btn').addEventListener('click', async () => {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!phone || !password) {
      showToast('请填写手机号和密码');
      return;
    }

    let res;
    if (isRegister) {
      const username = document.getElementById('login-username').value.trim();
      if (!username) {
        showToast('请填写昵称');
        return;
      }
      res = await api.register({ username, phone, password });
    } else {
      res = await api.login({ phone, password });
    }

    if (res.code === 200) {
      // 保存登录状态
      const user = res.data;
      storeAuth({
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        phone: user.phone
      });
      showToast(res.msg);
      setTimeout(() => {
        Router.navigate('profile');
      }, 500);
    } else {
      showToast(res.msg);
    }
  });

  document.getElementById('login-toggle').addEventListener('click', () => {
    Router.navigate('login', { mode: isRegister ? 'login' : 'register' });
  });
}

// 认证状态管理
function storeAuth(user) {
  localStorage.setItem('pawprint_user', JSON.stringify(user));
}

function getAuth() {
  const data = localStorage.getItem('pawprint_user');
  return data ? JSON.parse(data) : null;
}

function clearAuth() {
  localStorage.removeItem('pawprint_user');
}