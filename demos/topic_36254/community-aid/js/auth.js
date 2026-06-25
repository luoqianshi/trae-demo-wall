// 登录/注册模块
window.CommunityAidAuth = (function() {
  var mode = 'login'; // 'login' or 'register'

  // 初始化：绑定事件并更新UI
  function init() {
    var loginBtn = document.getElementById('login-btn');
    var logoutBtn = document.getElementById('logout-btn');
    var loginForm = document.getElementById('login-form');
    var loginModal = document.getElementById('login-modal');
    var closeBtn = loginModal ? loginModal.querySelector('.modal-close') : null;
    var registerSwitchBtn = document.getElementById('register-switch-btn');

    // 绑定事件
    if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (loginForm) loginForm.addEventListener('submit', function(e) {
      if (mode === 'login') {
        handleLogin(e);
      } else {
        handleRegister(e);
      }
    });
    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    if (registerSwitchBtn) registerSwitchBtn.addEventListener('click', toggleMode);

    // 点击弹窗外部关闭
    if (loginModal) {
      loginModal.addEventListener('click', function(e) {
        if (e.target === loginModal) closeLoginModal();
      });
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && loginModal && loginModal.classList.contains('show')) {
        closeLoginModal();
      }
    });

    // 初始化UI状态
    updateUI();
  }

  // 切换登录/注册模式
  function toggleMode() {
    var title = document.getElementById('login-modal-title');
    var desc = document.getElementById('login-modal-desc');
    var submitBtn = document.getElementById('login-submit-btn');
    var switchBtn = document.getElementById('register-switch-btn');
    var usernameInput = document.getElementById('login-username');

    if (mode === 'login') {
      mode = 'register';
      if (title) title.textContent = '用户注册';
      if (desc) desc.textContent = '输入用户名注册，已有账号可直接登录';
      if (submitBtn) submitBtn.textContent = '注册';
      if (switchBtn) switchBtn.textContent = '已有账号？去登录';
    } else {
      mode = 'login';
      if (title) title.textContent = '用户登录';
      if (desc) desc.textContent = '输入用户名即可快速登录体验';
      if (submitBtn) submitBtn.textContent = '登录';
      if (switchBtn) switchBtn.textContent = '注册新用户';
    }
    if (usernameInput) {
      usernameInput.value = '';
      usernameInput.focus();
    }
  }

  // 登录处理
  function handleLogin(event) {
    event.preventDefault();
    var usernameInput = document.getElementById('login-username');
    if (!usernameInput) return;
    var username = usernameInput.value.trim();

    if (!username) {
      CommunityAidUI.showToast('请输入用户名');
      usernameInput.focus();
      return;
    }

    // 检查是否已注册
    if (!CommunityAidData.isUserRegistered(username)) {
      CommunityAidUI.showToast('该用户名未注册，请先注册');
      usernameInput.focus();
      return;
    }

    CommunityAidData.setUser(username);
    closeLoginModal();
    usernameInput.value = '';
    updateUI();
    CommunityAidUI.showToast('登录成功，欢迎您，' + username + '！');
  }

  // 注册处理
  function handleRegister(event) {
    event.preventDefault();
    var usernameInput = document.getElementById('login-username');
    if (!usernameInput) return;
    var username = usernameInput.value.trim();

    if (!username) {
      CommunityAidUI.showToast('请输入用户名');
      usernameInput.focus();
      return;
    }

    if (username.length < 2) {
      CommunityAidUI.showToast('用户名至少需要2个字');
      usernameInput.focus();
      return;
    }

    // 尝试注册
    var result = CommunityAidData.registerUser(username);
    if (!result.success) {
      CommunityAidUI.showToast(result.message);
      usernameInput.focus();
      return;
    }

    // 注册成功，自动登录
    CommunityAidData.setUser(username);
    closeLoginModal();
    usernameInput.value = '';
    updateUI();
    CommunityAidUI.showToast('注册成功！欢迎您，' + username + '！');
  }

  // 退出登录
  function logout() {
    CommunityAidData.clearUser();
    updateUI();
    CommunityAidUI.showToast('已退出登录');
  }

  // 根据登录状态更新UI
  function updateUI() {
    var userName = document.getElementById('user-name');
    var logoutBtn = document.getElementById('logout-btn');
    var loginBtn = document.getElementById('login-btn');
    var navCenterBtn = document.getElementById('nav-center-btn');

    if (CommunityAidData.isLoggedIn()) {
      var user = CommunityAidData.getUser();
      if (userName) {
        userName.textContent = '您好，' + (user ? user.username : '');
        userName.style.display = 'block';
      }
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (navCenterBtn) navCenterBtn.style.display = 'block';
      if (loginBtn) loginBtn.style.display = 'none';
    } else {
      if (userName) userName.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (navCenterBtn) navCenterBtn.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'block';
    }
  }

  // 打开登录弹窗（默认登录模式）
  function openLoginModal() {
    // 重置为登录模式
    if (mode !== 'login') {
      toggleMode();
    }
    CommunityAidUI.openModal('login-modal');
    setTimeout(function() {
      var usernameInput = document.getElementById('login-username');
      if (usernameInput) usernameInput.focus();
    }, 100);
  }

  // 关闭登录弹窗
  function closeLoginModal() {
    CommunityAidUI.closeModal('login-modal');
    var usernameInput = document.getElementById('login-username');
    if (usernameInput) usernameInput.value = '';
  }

  return {
    init: init,
    handleLogin: handleLogin,
    handleRegister: handleRegister,
    logout: logout,
    updateUI: updateUI,
    openLoginModal: openLoginModal,
    closeLoginModal: closeLoginModal
  };
})();