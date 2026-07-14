const API_BASE = 'http://localhost:3000/api/v1';

window.api = {
  // ========== 核心请求封装 ==========
  async request(path, options = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, { ...options, headers });
    const data = await res.json();

    // Token过期自动刷新
    if (data.code === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
        return fetch(API_BASE + path, { ...options, headers }).then(r => r.json());
      }
    }
    return data;
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (data.code === 0) {
        localStorage.setItem('accessToken', data.data.accessToken);
        return true;
      }
      return false;
    } catch { return false; }
  },

  // ========== 认证 ==========
  register: (body) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // ========== 健康信息 ==========
  updateProfile: (body) => api.request('/health/profile', { method: 'PUT', body: JSON.stringify(body) }),
  submitMetrics: (body) => api.request('/health/metrics', { method: 'POST', body: JSON.stringify(body) }),
  getSummary: () => api.request('/health/summary'),

  // ========== 方案 ==========
  generatePlan: () => api.request('/plans/generate', { method: 'POST' }),
  getCurrentPlan: () => api.request('/plans/current'),
  updatePlanItem: (id, body) => api.request(`/plans/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  confirmPlan: () => api.request('/plans/confirm', { method: 'POST' }),

  // ========== 追踪 ==========
  submitFeedback: (body) => api.request('/tracking/feedback', { method: 'POST', body: JSON.stringify(body) }),
  getTodayTasks: () => api.request('/tracking/today'),
  getWeeklyReport: () => api.request('/tracking/weekly'),

  // ========== 社区 ==========
  createProfile: (body) => api.request('/community/profiles', { method: 'POST', body: JSON.stringify(body) }),
  getPosts: () => api.request('/community/posts'),
  createPost: (body) => api.request('/community/posts', { method: 'POST', body: JSON.stringify(body) }),
  addComment: (postId, body) => api.request(`/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(body) }),

  // ========== 成就 ==========
  getScore: () => api.request('/achievements/score'),
  getLeaderboard: () => api.request('/achievements/leaderboard'),
};
