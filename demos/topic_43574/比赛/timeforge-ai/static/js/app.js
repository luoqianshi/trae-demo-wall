/**
 * TimeForge X - 主应用脚本
 * 全局功能：用户管理、工具函数、事件处理
 */
(function() {
  'use strict';

  // =============================================
  // 全局状态
  // =============================================
  window.TimeForge = {
    token: localStorage.getItem('timeforge_token'),
    user: JSON.parse(localStorage.getItem('timeforge_user') || 'null'),
    apiBase: window.location.origin,

    // 获取用户
    getUser() { return this.user; },

    // 设置用户
    setUser(user) {
      this.user = user;
      localStorage.setItem('timeforge_user', JSON.stringify(user));
    },

    // 设置token
    setToken(token) {
      this.token = token;
      localStorage.setItem('timeforge_token', token);
    },

    // 清除认证
    clearAuth() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('timeforge_token');
      localStorage.removeItem('timeforge_user');
    },

    // 是否已登录
    isLoggedIn() { return !!this.token; },

    // API请求头
    getHeaders() {
      const headers = { 'Content-Type': 'application/json' };
      if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
      return headers;
    },

    // GET请求
    async get(url) {
      try {
        const res = await fetch(this.apiBase + url, { headers: this.getHeaders() });
        return await res.json();
      } catch (e) {
        console.error('API GET Error:', e);
        return { success: false, message: '网络请求失败' };
      }
    },

    // POST请求
    async post(url, data) {
      try {
        const res = await fetch(this.apiBase + url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (e) {
        console.error('API POST Error:', e);
        return { success: false, message: '网络请求失败' };
      }
    },

    // Toast通知
    showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `toast-custom ${type}`;
      toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>${message}`;
      container.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
    },

    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '--';
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    },

    // 格式化相对时间
    timeAgo(dateStr) {
      if (!dateStr) return '';
      const now = new Date();
      const then = new Date(dateStr);
      const diff = Math.floor((now - then) / 1000);
      if (diff < 60) return '刚刚';
      if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
      if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
      if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
      return then.toLocaleDateString('zh-CN');
    },

    // 获取等级名称
    getLevelName(level) {
      if (level <= 5) return '青铜';
      if (level <= 10) return '白银';
      if (level <= 15) return '黄金';
      if (level <= 20) return '铂金';
      if (level <= 25) return '钻石';
      if (level <= 30) return '大师';
      return '王者';
    },

    // 获取等级CSS类名
    getLevelClass(level) {
      if (level <= 5) return 'bronze';
      if (level <= 10) return 'silver';
      if (level <= 15) return 'gold';
      if (level <= 20) return 'platinum';
      if (level <= 25) return 'diamond';
      return 'master';
    },

    // 获取风险等级CSS类名
    getRiskClass(risk) {
      if (risk === '红色' || risk === 'high') return 'danger';
      if (risk === '黄色' || risk === 'medium') return 'warning';
      return 'success';
    },

    // 加载用户信息到顶部栏
    async loadUserInfo() {
      const userName = document.getElementById('userName');
      const userLevel = document.getElementById('userLevel');
      const userAvatar = document.getElementById('userAvatar');

      if (this.user) {
        if (userName) userName.textContent = this.user.username;
        if (userLevel) userLevel.textContent = `Lv.${this.user.level} ${this.user.level_name}`;
        if (userAvatar) userAvatar.textContent = this.user.username.charAt(0).toUpperCase();
      }

      if (this.isLoggedIn()) {
        try {
          const res = await this.get('/api/auth/me');
          if (res.success && res.user) {
            this.setUser(res.user);
            if (userName) userName.textContent = res.user.username;
            if (userLevel) userLevel.textContent = `Lv.${res.user.level} ${res.user.level_name}`;
            if (userAvatar) userAvatar.textContent = res.user.username.charAt(0).toUpperCase();
          }
        } catch (e) { /* ignore */ }
      }
    },
  };

  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', () => {
    window.TimeForge.loadUserInfo();
  });
})();