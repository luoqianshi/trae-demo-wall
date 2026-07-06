document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const view = this.dataset.view;
            UI.switchView(view);
        });
    });

    document.getElementById('btn-logout').addEventListener('click', function() {
        if (confirm('确定要退出登录吗？')) {
            Auth.logout();
        }
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.querySelectorAll('.auth-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            document.getElementById(tabName + '-form').classList.add('active');
        });
    });

    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        Auth.handleLogin(e);
    });

    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        Auth.handleRegister(e);
    });

    document.getElementById('modal-container').addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('modal-overlay')) {
            UI.closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            UI.closeModal();
        }
    });

    Auth.checkSession();
});
