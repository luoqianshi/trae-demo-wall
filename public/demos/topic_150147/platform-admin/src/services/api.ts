import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getInstitutions: (params?: any) => api.get('/admin/institutions', { params }),
  approveInstitution: (id: number, status: string) => api.put(`/admin/institutions/${id}/approve`, { status }),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
};

export const enterpriseAPI = {
  list: (params?: any) => api.get('/enterprise', { params }),
  approve: (id: number, status: string) => api.put(`/enterprise/${id}/approve`, { status }),
};

export const achievementAPI = {
  getStats: () => api.get('/achievement/stats'),
};

export const adminOPCAPI = {
  getOpcStats: () => api.get('/admin/opc-stats'),
};

export default api;