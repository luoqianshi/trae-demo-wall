const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

function getToken() {
  return localStorage.getItem('linkhood_token') || '';
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.message || `请求失败 (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

const authAPI = {
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
  submitAuth: (body) => api('/auth/auth-record', { method: 'POST', body: JSON.stringify(body) }),
  myAuths: () => api('/auth/auth-records'),
};

const circleAPI = {
  list: (params) => api('/circles' + (params ? '?' + new URLSearchParams(params) : '')),
  get: (id) => api(`/circles/${id}`),
  join: (id, body) => api(`/circles/${id}/join`, { method: 'POST', body: JSON.stringify(body) }),
  joined: () => api('/circles/joined'),
};

const needAPI = {
  list: (params) => api('/needs?' + new URLSearchParams(params)),
  get: (id) => api(`/needs/${id}`),
  create: (body) => api('/needs', { method: 'POST', body: JSON.stringify(body) }),
  boost: (id) => api(`/needs/${id}/boost`, { method: 'POST' }),
  comment: (id, body) => api(`/needs/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
};

const orderAPI = {
  list: (params) => api('/orders?' + new URLSearchParams(params)),
  get: (id) => api(`/orders/${id}`),
  create: (body) => api('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id, body) => api(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
};

const activityAPI = {
  list: (params) => api('/activities?' + new URLSearchParams(params)),
  get: (id) => api(`/activities/${id}`),
  create: (body) => api('/activities', { method: 'POST', body: JSON.stringify(body) }),
  enroll: (id) => api(`/activities/${id}/enroll`, { method: 'POST' }),
};

const feedbackAPI = {
  list: (params) => api('/feedbacks?' + new URLSearchParams(params)),
  create: (body) => api('/feedbacks', { method: 'POST', body: JSON.stringify(body) }),
  boost: (id) => api(`/feedbacks/${id}/boost`, { method: 'POST' }),
};

const userAPI = {
  profile: () => api('/users/profile'),
  updateProfile: (body) => api('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

window.apiClient = { auth: authAPI, circles: circleAPI, needs: needAPI, orders: orderAPI, activities: activityAPI, feedbacks: feedbackAPI, users: userAPI };
