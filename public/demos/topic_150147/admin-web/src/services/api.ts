import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token刷新队列
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // 401自动刷新token（非刷新请求本身）
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const res = await axios.post('/api/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const newToken = res.data.data.token;
        localStorage.setItem('token', newToken);
        isRefreshing = false;
        onRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

// ========== 认证 ==========
export const authAPI = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  register: (username: string, password: string, realName?: string, role?: string, phone?: string) =>
    api.post('/auth/register', { username, password, realName, role, phone }),
  getProfile: () => api.get('/auth/profile'),
  getStats: () => api.get('/auth/stats'),
};

// ========== 公开任务 ==========
export const taskAPI = {
  list: (params?: any) => api.get('/tasks', { params }),
  detail: (id: number) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  getMy: () => api.get('/tasks/my'),
  getHot: () => api.get('/tasks/hot/recommended'),
};

// ========== 收藏 ==========
export const favoriteAPI = {
  list: () => api.get('/favorites'),
  add: (taskId: number) => api.post(`/favorites/${taskId}`),
  remove: (taskId: number) => api.delete(`/favorites/${taskId}`),
  check: (taskIds: number[]) => api.post('/favorites/check', { taskIds }),
};

// ========== 评论 ==========
export const ratingAPI = {
  getByTask: (taskId: number) => api.get(`/ratings/task/${taskId}`),
  getMy: (taskId: number) => api.get(`/ratings/task/${taskId}/my`),
  rate: (taskId: number, score: number) => api.post(`/ratings/task/${taskId}`, { score }),
};

export const commentAPI = {
  getByTask: (taskId: number, page = 1, pageSize = 10) => api.get(`/comments/task/${taskId}`, { params: { page, pageSize } }),
  add: (taskId: number, content: string) => api.post(`/comments/task/${taskId}`, { content }),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

// ========== 作品提交 ==========
export const submissionAPI = {
  submit: (taskId: number, data: any) => api.post(`/submissions/tasks/${taskId}/submit`, data),
  getByTask: (taskId: number) => api.get(`/submissions/tasks/${taskId}/submissions`),
  getMy: (page?: number, pageSize?: number) =>
    api.get('/submissions/my', { params: { page, pageSize } }),
  evaluate: (id: number, data: any) => api.post(`/submissions/${id}/evaluate`, data),
  getPendingCount: () => api.get('/submissions/pending-count'),
};

// ========== 上传 ==========
export const uploadAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ========== 学习进度 ==========
export const progressAPI = {
  start: (taskId: number, totalSteps?: number) =>
    api.post('/progress/start', { taskId, totalSteps }),
  update: (taskId: number, currentStep: number) =>
    api.put(`/progress/${taskId}`, { currentStep }),
  complete: (taskId: number) =>
    api.put(`/progress/${taskId}/complete`),
  getMy: () => api.get('/progress/my'),
  getByTask: (taskId: number) => api.get(`/progress/${taskId}`),
};

// ========== 管理员 ==========
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  listUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  listTasks: (params?: any) => api.get('/admin/tasks', { params }),
  updateTask: (id: number, data: any) => api.put(`/admin/tasks/${id}`, data),
  deleteTask: (id: number) => api.delete(`/admin/tasks/${id}`),
  listSubmissions: (params?: any) => api.get('/admin/submissions', { params }),
  evaluate: (id: number, data: any) => api.post(`/admin/submissions/${id}/evaluate`, data),
};

export default api;