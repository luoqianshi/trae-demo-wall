const Auth = {
    showLogin() {
        document.getElementById('auth-view').style.display = 'flex';
        document.getElementById('main-view').style.display = 'none';
        document.getElementById('login-form').classList.add('active');
        document.getElementById('register-form').classList.remove('active');

        const tabs = document.querySelectorAll('.auth-tab');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    },

    showRegister() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');

        const tabs = document.querySelectorAll('.auth-tab');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const messageEl = document.getElementById('login-message');

        if (!username || !password) {
            messageEl.className = 'auth-message error';
            messageEl.textContent = '请输入用户名和密码';
            return;
        }

        const result = Storage.loginUser(username, password);
        messageEl.className = 'auth-message ' + (result.success ? 'success' : 'error');
        messageEl.textContent = result.message;

        if (result.success) {
            setTimeout(() => {
                this.onLoginSuccess(username);
            }, 500);
        }
    },

    handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const password2 = document.getElementById('register-password2').value;
        const messageEl = document.getElementById('register-message');

        if (username.length < 3) {
            messageEl.className = 'auth-message error';
            messageEl.textContent = '用户名至少需要3个字符';
            return;
        }

        if (!email.includes('@')) {
            messageEl.className = 'auth-message error';
            messageEl.textContent = '请输入有效的邮箱';
            return;
        }

        if (password.length < 6) {
            messageEl.className = 'auth-message error';
            messageEl.textContent = '密码至少需要6位';
            return;
        }

        if (password !== password2) {
            messageEl.className = 'auth-message error';
            messageEl.textContent = '两次输入的密码不一致';
            return;
        }

        const result = Storage.registerUser(username, email, password);
        messageEl.className = 'auth-message ' + (result.success ? 'success' : 'error');
        messageEl.textContent = result.message;

        if (result.success) {
            setTimeout(() => {
                Storage.loginUser(username, password);
                this.onLoginSuccess(username);
            }, 800);
        }
    },

    onLoginSuccess(username) {
        document.getElementById('auth-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'block';

        document.getElementById('sidebar-username').textContent = username;
        document.getElementById('sidebar-avatar').textContent = username.charAt(0).toUpperCase();

        const user = Storage.getUserData(username);
        if (user) {
            document.getElementById('stat-streak').textContent = user.progress.streak || 0;
            document.getElementById('stat-xp').textContent = user.stats.totalXP || 0;
            document.getElementById('stat-today').textContent = user.progress.todayLessons || 0;
            document.getElementById('sidebar-level').textContent = `Lv.${user.stats.level}`;
        }

        UI.showToast(`欢迎回来，${username}！`, 'success');
        Dashboard.render();
    },

    logout() {
        Storage.clearCurrentUser();
        document.getElementById('auth-view').style.display = 'flex';
        document.getElementById('main-view').style.display = 'none';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-message').textContent = '';
        UI.showToast('已退出登录', 'info');
    },

    checkSession() {
        const username = Storage.getCurrentUser();
        if (username) {
            const user = Storage.getUserData(username);
            if (user) {
                this.onLoginSuccess(username);
                return true;
            }
        }
        this.showLogin();
        return false;
    }
};
