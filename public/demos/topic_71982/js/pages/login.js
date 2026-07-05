/**
 * 登录页面模块
 * 处理用户登录验证，支持测试账号登录
 */
const LoginPage = {
  /**
   * 渲染登录页面HTML
   * @returns {string} 登录页面HTML字符串
   */
  render() {
    return `
      <div class="page page--login">
        <!-- 登录页背景区域 -->
        <div class="login-bg">
          <div class="login-bg__circle login-bg__circle--1"></div>
          <div class="login-bg__circle login-bg__circle--2"></div>
          <div class="login-bg__circle login-bg__circle--3"></div>
        </div>

        <div class="login-container">
          <!-- 应用Logo区域 -->
          <div class="login-logo">
            <div class="login-logo__icon">
              <svg viewBox="0 0 64 64" width="64" height="64" fill="none">
                <!-- 房子轮廓 -->
                <path d="M32 8 L56 28 L56 56 L8 56 L8 28 Z" fill="var(--primary-lighter)" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"/>
                <!-- 屋顶 -->
                <path d="M32 8 L56 28 L8 28 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"/>
                <!-- 爱心 -->
                <path d="M32 44 C32 44 20 36 20 28 C20 22 26 20 32 26 C38 20 44 22 44 28 C44 36 32 44 32 44Z" fill="var(--danger)" opacity="0.9"/>
                <!-- 门 -->
                <rect x="27" y="40" width="10" height="16" rx="1" fill="var(--primary)" opacity="0.6"/>
              </svg>
            </div>
            <h1 class="login-logo__title">家护手记</h1>
            <p class="login-logo__subtitle">家庭健康管理助手</p>
          </div>

          <!-- 登录表单 -->
          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label class="form-label" for="username">用户名</label>
              <input 
                type="text" 
                class="form-input" 
                id="username" 
                name="username" 
                placeholder="请输入用户名" 
                autocomplete="username"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="password">密码</label>
              <input 
                type="password" 
                class="form-input" 
                id="password" 
                name="password" 
                placeholder="请输入密码" 
                autocomplete="current-password"
                required
              />
            </div>
            <button type="submit" class="btn btn--primary btn--block mt-md">
              登 录
            </button>
          </form>

          <!-- 测试账号提示 -->
          <div class="login-hint">
            <p class="login-hint__text">测试账号 test001 / 123456</p>
          </div>
        </div>
      </div>

      <style>
        /* 登录页专属样式 */
        .page--login {
          background: linear-gradient(135deg, #E8F5E9 0%, #FFF3E0 50%, #E8F5E9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding-bottom: 0;
        }

        /* 背景装饰圆 */
        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .login-bg__circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.15;
        }
        .login-bg__circle--1 {
          width: 200px;
          height: 200px;
          background: var(--primary);
          top: -60px;
          right: -40px;
        }
        .login-bg__circle--2 {
          width: 150px;
          height: 150px;
          background: var(--secondary);
          bottom: 80px;
          left: -30px;
        }
        .login-bg__circle--3 {
          width: 100px;
          height: 100px;
          background: var(--primary-light);
          top: 40%;
          right: -20px;
        }

        /* 登录容器 */
        .login-container {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: var(--spacing-lg);
          max-width: 400px;
          margin: 0 auto;
        }

        /* Logo区域 */
        .login-logo {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }
        .login-logo__icon {
          margin-bottom: var(--spacing-md);
        }
        .login-logo__title {
          font-size: var(--font-size-xxl);
          font-weight: var(--font-weight-semibold);
          color: var(--primary-dark);
          margin-bottom: var(--spacing-xs);
        }
        .login-logo__subtitle {
          font-size: var(--font-size-sm);
          color: var(--text-hint);
        }

        /* 登录表单 */
        .login-form {
          background: var(--bg-primary);
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-md);
        }

        /* 测试提示 */
        .login-hint {
          text-align: center;
          margin-top: var(--spacing-lg);
        }
        .login-hint__text {
          font-size: var(--font-size-xs);
          color: var(--text-hint);
          background: var(--bg-primary);
          display: inline-block;
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-lg);
        }
      </style>
    `;
  },

  /**
   * 初始化登录页事件绑定
   */
  init() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    // 绑定表单提交事件
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      // 输入校验
      if (!username) {
        Toast.warning('请输入用户名');
        return;
      }
      if (!password) {
        Toast.warning('请输入密码');
        return;
      }

      // 从Storage中查找匹配的用户
      const users = Storage.getAll(Storage.KEYS.USERS) || [];
      const matchedUser = users.find(
        (u) => u.username === username && u.password === password
      );

      if (matchedUser) {
        // 登录成功：保存当前用户对象到Storage
        Storage.setCurrentUser(matchedUser);

        // 如果用户有家庭组，设置第一个为当前组
        const groups = Storage.getAll(Storage.KEYS.GROUPS) || [];
        const userGroups = groups.filter((g) =>
          g.members && g.members.includes(matchedUser.id)
        );
        if (userGroups.length > 0) {
          Storage.setCurrentGroup(userGroups[0]);
        }

        Toast.success('登录成功');
        // 跳转到首页
        window.location.hash = '#/home';
      } else {
        // 登录失败
        Toast.error('用户名或密码错误');
      }
    });
  }
};
