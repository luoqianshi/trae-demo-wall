const App = {
    currentUser: null,
    currentTheme: 'dark',
    sidebarCollapsed: false,

    init: function() {
        this.loadTheme();
        this.bindEvents();
        this.loadUser();
    },

    bindEvents: function() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bindSidebarToggle();
            this.bindThemeToggle();
            this.bindModalEvents();
            this.bindNavigation();
        });
    },

    loadTheme: function() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    },

    loadUser: function() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUserInfo();
        }
    },

    updateUserInfo: function() {
        if (this.currentUser) {
            const userName = document.querySelector('.user-name');
            const userAvatar = document.querySelector('.user-avatar');
            if (userName) userName.textContent = this.currentUser.name;
            if (userAvatar) userAvatar.textContent = this.currentUser.name.charAt(0);
        }
    },

    bindSidebarToggle: function() {
        const toggleBtn = document.querySelector('.toggle-sidebar');
        const sidebar = document.querySelector('.sidebar');
        
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                this.sidebarCollapsed = !this.sidebarCollapsed;
            });
        }
    },

    bindThemeToggle: function() {
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                localStorage.setItem('theme', this.currentTheme);
                themeBtn.innerHTML = this.currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            });
        }
    },

    bindModalEvents: function() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay);
                }
            });
            
            overlay.querySelector('.modal-close')?.addEventListener('click', () => {
                this.closeModal(overlay);
            });
        });
    },

    openModal: function(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    closeModal: function(overlay) {
        overlay.classList.remove('active');
    },

    bindNavigation: function() {
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    this.scrollToSection(href);
                }
            });
        });
    },

    scrollToSection: function(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    },

    login: function(username, password) {
        const mockUsers = [
            { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
            { username: 'user', password: 'user123', name: '企业用户', role: 'enterprise' },
            { username: 'supervisor', password: 'supervisor123', name: '监管人员', role: 'supervisor' }
        ];

        const user = mockUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    },

    logout: function() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    showToast: function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8'};
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    formatDate: function(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

const AuditData = {
    questions: [],
    scoreConfig: {},
    laws: [],
    auditRecords: [],

    loadQuestions: async function() {
        const response = await fetch('data/question.json');
        this.questions = await response.json();
        return this.questions;
    },

    loadScoreConfig: async function() {
        const response = await fetch('data/score.json');
        this.scoreConfig = await response.json();
        return this.scoreConfig;
    },

    loadLaws: async function() {
        const response = await fetch('data/laws.json');
        this.laws = await response.json();
        return this.laws;
    },

    saveAuditRecord: function(record) {
        this.auditRecords.push(record);
        localStorage.setItem('auditRecords', JSON.stringify(this.auditRecords));
    },

    getAuditRecords: function() {
        const saved = localStorage.getItem('auditRecords');
        return saved ? JSON.parse(saved) : [];
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});