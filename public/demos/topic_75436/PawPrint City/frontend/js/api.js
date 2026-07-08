// 爪印城市 - API请求层
const API_BASE = 'http://localhost:3000/api';

// 全局 Loading 控制
let loadingCount = 0;
function showLoading() {
  loadingCount++;
  const el = document.getElementById('loading');
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }
}

const api = {
  async request(url, options = {}) {
    const showLoadingFlag = options.showLoading !== false;
    try {
      if (showLoadingFlag) showLoading();
      const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
      };
      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const res = await fetch(`${API_BASE}${url}`, config);
      if (!res.ok) {
        throw new Error(`请求失败：${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('API 请求错误:', err);
      // 返回友好的错误结构
      return { code: 500, msg: '网络异常，请稍后重试', data: null, error: err.message };
    } finally {
      if (showLoadingFlag) hideLoading();
    }
  },

  // 场所模块
  getPlaces(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/places${query ? '?' + query : ''}`);
  },

  getPlaceDetail(id) {
    return this.request(`/places/${id}`);
  },

  verifyPlace(id, data) {
    return this.request(`/places/${id}/verify`, { method: 'POST', body: data });
  },

  reportPlace(id, data) {
    return this.request(`/places/${id}/report`, { method: 'POST', body: data });
  },

  // 商家模块
  submitMerchantApply(data) {
    return this.request('/merchant/apply', { method: 'POST', body: data });
  },

  getMerchantApply(id) {
    return this.request(`/merchant/apply/${id}`);
  },

  // 用户模块
  getFavorites() {
    return this.request('/user/favorites');
  },

  toggleFavorite(placeId, action) {
    return this.request('/user/favorites', {
      method: 'POST',
      body: { placeId, action }
    });
  },

  getUserVerifies() {
    return this.request('/user/verifies');
  },

  getUserApplies() {
    return this.request('/user/applies');
  },

  // 用户认证
  register(data) {
    return this.request('/auth/register', { method: 'POST', body: data });
  },
  login(data) {
    return this.request('/auth/login', { method: 'POST', body: data });
  },
  getUserProfile(userId) {
    return this.request(`/auth/profile?userId=${userId || ''}`);
  },

  // 评论评分
  getComments(placeId) {
    return this.request(`/places/${placeId}/comments`);
  },
  submitComment(placeId, data) {
    return this.request(`/places/${placeId}/comments`, { method: 'POST', body: data });
  },

  // 宠物档案
  getPets(userId) {
    return this.request(`/pets?userId=${userId || ''}`);
  },
  addPet(data) {
    return this.request('/pets', { method: 'POST', body: data });
  },
  deletePet(petId, userId) {
    return this.request(`/pets/${petId}?userId=${userId || ''}`, { method: 'DELETE' });
  },

  // 城市
  getCities() {
    return this.request('/cities');
  }
};