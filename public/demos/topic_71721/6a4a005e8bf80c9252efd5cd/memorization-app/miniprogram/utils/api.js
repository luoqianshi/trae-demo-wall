/**
 * API 请求封装
 */
const app = getApp();

const BASE = app ? app.globalData.baseUrl : 'http://localhost:3000';

function request(options) {
  const { url, method = 'GET', data = {} } = options;
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'x-user-token': app ? app.globalData.token : '',
      },
      success(res) {
        if (res.statusCode === 401) {
          // 未登录
          wx.removeStorageSync('token');
          wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('未登录'));
          return;
        }
        if (res.data && res.data.code === 0) {
          resolve(res.data.data);
        } else {
          wx.showToast({ title: (res.data && res.data.msg) || '请求失败', icon: 'none' });
          reject(res.data);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      },
    });
  });
}

const api = {
  // ===== 认证 =====
  testLogin: (nickname) => request({ url: '/api/auth/test-login', method: 'POST', data: { nickname } }),
  login: (openid, nickname, avatar) => request({ url: '/api/auth/login', method: 'POST', data: { openid, nickname, avatar } }),

  // ===== 用户 =====
  getUserInfo: () => request({ url: '/api/user/info' }),
  updateSettings: (semester, learn_per_week) => request({ url: '/api/user/settings', method: 'POST', data: { semester, learn_per_week } }),

  // ===== 学科与内容 =====
  getSubjects: () => request({ url: '/api/subjects' }),
  getContents: (semester, subject) => request({ url: '/api/contents', data: { semester, subject } }),
  getContent: (id) => request({ url: `/api/contents/${id}` }),

  // ===== 学习与复习 =====
  learn: (content_id, learn_date) => request({ url: '/api/learn', method: 'POST', data: { content_id, learn_date } }),
  getTodayReview: () => request({ url: '/api/review/today' }),
  finishReview: (record_id, read_count) => request({ url: '/api/review/finish', method: 'POST', data: { record_id, read_count } }),
  getLearnList: () => request({ url: '/api/learn/list' }),

  // ===== 统计 =====
  getStats: () => request({ url: '/api/stats' }),
};

module.exports = api;
