/**
 * 本草灵枢 · 用户认证模块
 * 基于 localStorage 的前端模拟认证系统
 * 生产环境需替换为后端 API + JWT
 */
const Auth = (() => {
  const STORAGE_KEY = 'tcm_auth';
  const USERS_KEY = 'tcm_users';

  // ===== 内部工具 =====

  // 简单哈希（生产环境用 bcrypt）
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  // 获取用户列表
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  // 保存用户列表
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // 获取当前会话
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  // 保存会话
  function saveSession(session, remember) {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }

  // 清除会话
  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // 生成 token
  function generateToken() {
    return 'tk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
  }

  // ===== 初始化默认用户 =====
  function initDefaultUsers() {
    const users = getUsers();
    if (users.length === 0) {
      saveUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@bencao.cn',
          passwordHash: simpleHash('admin123'),
          avatar: '管',
          role: '管理员',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          username: '访客',
          email: 'guest@bencao.cn',
          passwordHash: simpleHash('123456'),
          avatar: '客',
          role: '普通用户',
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }

  initDefaultUsers();

  // ===== 公开 API =====
  return {
    /**
     * 用户登录
     * @param {string} username - 用户名或邮箱
     * @param {string} password - 密码
     * @param {boolean} remember - 是否记住登录
     * @returns {{ success: boolean, message: string, field?: string }}
     */
    login(username, password, remember = false) {
      const users = getUsers();
      const pwdHash = simpleHash(password);

      // 支持用户名或邮箱登录
      const user = users.find(u =>
        u.username === username || u.email === username
      );

      if (!user) {
        return { success: false, message: '用户不存在', field: 'username' };
      }

      if (user.passwordHash !== pwdHash) {
        return { success: false, message: '密码错误', field: 'password' };
      }

      const session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(),
        loginAt: new Date().toISOString()
      };

      saveSession(session, remember);
      return { success: true, message: '登录成功' };
    },

    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @returns {{ success: boolean, message: string, field?: string }}
     */
    register(username, email, password) {
      const users = getUsers();

      // 检查用户名重复
      if (users.some(u => u.username === username)) {
        return { success: false, message: '用户名已被注册', field: 'username' };
      }

      // 检查邮箱重复
      if (users.some(u => u.email === email)) {
        return { success: false, message: '邮箱已被注册', field: 'email' };
      }

      const newUser = {
        id: users.length + 1,
        username,
        email,
        passwordHash: simpleHash(password),
        avatar: username.charAt(0),
        role: '普通用户',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);

      // 自动登录
      const session = {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
        token: generateToken(),
        loginAt: new Date().toISOString()
      };

      saveSession(session, false);
      return { success: true, message: '注册成功' };
    },

    /**
     * 退出登录
     */
    logout() {
      clearSession();
    },

    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
      return !!(getSession() || (() => {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); }
        catch { return null; }
      })());
    },

    /**
     * 获取当前用户信息
     * @returns {object|null}
     */
    getCurrentUser() {
      return getSession() || (() => {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); }
        catch { return null; }
      })();
    },

    /**
     * 更新导航栏用户状态
     * 在各页面调用以渲染登录按钮或用户头像
     */
    updateNavUI() {
      const container = document.getElementById('authNavSlot');
      if (!container) return;

      const user = this.getCurrentUser();
      if (user) {
        container.innerHTML = `
          <div class="relative" id="userMenuWrap">
            <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-tcm-border hover:border-tcm-primary transition-colors" onclick="Auth.toggleUserMenu()">
              <div class="w-7 h-7 rounded-md bg-tcm-primary flex items-center justify-center text-tcm-paper font-serif text-sm font-bold">${user.avatar}</div>
              <span class="text-sm text-tcm-ink font-medium hidden sm:inline">${user.username}</span>
              <svg class="w-3.5 h-3.5 text-tcm-inkLight" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div class="absolute right-0 top-full mt-2 w-48 bg-tcm-paper border border-tcm-border rounded-xl shadow-xl py-2 z-50 hidden" id="userMenu">
              <div class="px-4 py-2 border-b border-tcm-border/50">
                <p class="text-sm font-medium text-tcm-ink">${user.username}</p>
                <p class="text-xs text-tcm-inkLight">${user.email}</p>
              </div>
              <a href="#" class="flex items-center gap-2 px-4 py-2.5 text-sm text-tcm-inkLight hover:text-tcm-primary hover:bg-tcm-primary/5 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                个人中心
              </a>
              <a href="#" class="flex items-center gap-2 px-4 py-2.5 text-sm text-tcm-inkLight hover:text-tcm-primary hover:bg-tcm-primary/5 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                设置
              </a>
              <div class="border-t border-tcm-border/50 my-1"></div>
              <button onclick="Auth.logout();window.location.href='index.html'" class="flex items-center gap-2 px-4 py-2.5 text-sm text-tcm-accent hover:bg-tcm-accent/5 transition-colors w-full text-left">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                退出登录
              </button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <a href="login.html" class="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-tcm-primary text-white hover:bg-tcm-primaryDark transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            登录
          </a>
        `;
      }
    },

    /**
     * 切换用户下拉菜单
     */
    toggleUserMenu() {
      const menu = document.getElementById('userMenu');
      if (menu) menu.classList.toggle('hidden');
    }
  };
})();

// 点击页面其他区域关闭用户菜单
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('userMenuWrap');
  const menu = document.getElementById('userMenu');
  if (wrap && menu && !wrap.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

// 页面加载时自动更新导航栏
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavUI();
});
