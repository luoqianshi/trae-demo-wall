/**
 * 食光机 - API 客户端模块
 * 负责所有与后端的 HTTP 通信
 * Base URL: /api (同源，前端由后端Express服务)
 */
const API = (function () {
  const BASE = '/api';

  /** 获取存储的 JWT token */
  function getToken() { return localStorage.getItem('token'); }

  /** 存储 JWT token */
  function setToken(t) { localStorage.setItem('token', t); }

  /** 移除 JWT token */
  function removeToken() { localStorage.removeItem('token'); }

  /** 判断是否已登录 */
  function isLoggedIn() { return !!getToken(); }

  /**
   * 通用请求方法
   * @param {string} path - API路径（不含/api前缀）
   * @param {object} options - fetch选项
   * @returns {Promise<object>} 响应数据
   */
  async function request(path, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(BASE + path, { ...options, headers });
    } catch (err) {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      throw new Error('服务器响应格式错误');
    }

    if (!res.ok) {
      // 401 未授权 - 清除token
      if (res.status === 401) {
        removeToken();
      }
      throw new Error(data.message || '请求失败 (' + res.status + ')');
    }

    return data;
  }

  /**
   * 构建查询字符串
   * @param {object} params - 参数对象
   * @returns {string} 查询字符串（不含前导?）
   */
  function buildQuery(params) {
    const parts = [];
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
      }
    }
    return parts.join('&');
  }

  return {
    // ===== 认证 =====
    register: function (username, password) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    },

    login: function (username, password) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    },

    getMe: function () {
      return request('/auth/me');
    },

    // ===== 记录 =====
    getRecords: function (params) {
      let query = '';
      if (params) {
        if (typeof params === 'string') {
          query = params;
        } else {
          query = buildQuery(params);
        }
      }
      return request('/records' + (query ? '?' + query : ''));
    },

    getRecord: function (id) {
      return request('/records/' + id);
    },

    createRecord: function (data) {
      return request('/records', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateRecord: function (id, data) {
      return request('/records/' + id, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteRecord: function (id) {
      return request('/records/' + id, {
        method: 'DELETE'
      });
    },

    // ===== AI =====
    recognizeImage: function (formData) {
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      // 注意：multipart/form-data 不需要手动设置 Content-Type，
      // 浏览器会自动设置带 boundary 的 Content-Type
      return fetch(BASE + '/ai/recognize', {
        method: 'POST',
        headers: headers,
        body: formData
      }).then(function (r) {
        return r.json();
      });
    },

    getRecommendations: function () {
      return request('/ai/recommend');
    },

    getTags: function () {
      return request('/ai/tags');
    },

    // ===== 统计 =====
    getStats: function () {
      return request('/stats');
    },

    // ===== 管理后台 =====
    admin: {
      getUsers: function () {
        return request('/admin/users');
      },
      getStats: function () {
        return request('/admin/stats');
      },
      getRecords: function () {
        return request('/admin/records');
      },
      deleteUser: function (id) {
        return request('/admin/users/' + id, { method: 'DELETE' });
      }
    },

    // ===== 社区 =====
    community: {
      // 获取动态流（分页）
      getFeed: function (page, limit) {
        page = page || 1;
        limit = limit || 10;
        return request('/community/feed?page=' + page + '&limit=' + limit);
      },
      // 获取热门帖子
      getHot: function () {
        return request('/community/hot');
      },
      // 发布帖子
      createPost: function (data) {
        return request('/community/posts', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      // 获取帖子详情
      getPost: function (id) {
        return request('/community/posts/' + id);
      },
      // 删除帖子
      deletePost: function (id) {
        return request('/community/posts/' + id, { method: 'DELETE' });
      },
      // 获取帖子的评论列表
      getComments: function (postId) {
        return request('/community/posts/' + postId + '/comments');
      },
      // 发表评论
      addComment: function (postId, content) {
        return request('/community/posts/' + postId + '/comments', {
          method: 'POST',
          body: JSON.stringify({ content: content })
        });
      },
      // 删除评论
      deleteComment: function (id) {
        return request('/community/comments/' + id, { method: 'DELETE' });
      },
      // 点赞 / 取消点赞
      toggleLike: function (postId) {
        return request('/community/posts/' + postId + '/like', { method: 'POST' });
      },
      // 关注用户
      follow: function (userId) {
        return request('/community/follow/' + userId, { method: 'POST' });
      },
      // 取消关注
      unfollow: function (userId) {
        return request('/community/follow/' + userId, { method: 'DELETE' });
      },
      // 获取指定用户的帖子
      getUserPosts: function (userId) {
        return request('/community/users/' + userId + '/posts');
      },
      // 获取当前用户社区资料
      getProfile: function () {
        return request('/community/profile');
      }
    },

    // ===== Token 管理 =====
    getToken: getToken,
    setToken: setToken,
    removeToken: removeToken,
    isLoggedIn: isLoggedIn
  };
})();
