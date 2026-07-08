// utils/request.js — 微信小程序请求封装

const BASE_URL = 'https://api.timecapsule.app';
// devMode 默认值（与 app.js 中的 devMode 保持一致，以便 getApp() 未就绪时也能走 mock）
const DEFAULT_DEV_MODE = true;

/**
 * 把对象转为 URL query string
 */
function toQueryString(params) {
  if (!params) return '';
  return '?' + Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
}

/**
 * 通用请求方法
 * @param {string} method  - GET | POST | PUT | DELETE
 * @param {string} url     - 接口路径，如 /api/capsules
 * @param {object} data    - GET 时拼 query string，POST/PUT 时作 body
 * @param {object} options - { showLoading, timeout }
 * @returns {Promise}
 */
function request(method, url, data, options = {}) {
  const { showLoading = false, timeout = 15000 } = options;
  const app = getApp();
  const token = app ? app.globalData.token : wx.getStorageSync('token');
  // 关键：app 未就绪（如 onLaunch 早期）时，走默认 devMode，避免发起真实网络请求超时
  const devMode = app ? app.devMode : DEFAULT_DEV_MODE;

  if (showLoading) {
    wx.showLoading({ title: '加载中...', mask: true });
  }

  // 演示模式：用 mock 数据，不发起真实请求
  if (devMode) {
    const { mockRequest } = require('./mock');
    return mockRequest(method, url, data)
      .then(res => {
        if (showLoading) wx.hideLoading();
        if (res.code === 0) return res.data;
        throw { code: res.code, message: res.message };
      })
      .catch(err => {
        if (showLoading) wx.hideLoading();
        throw err;
      });
  }

  // GET: 参数拼到 URL；POST/PUT: 参数放入 body
  const isGet = method === 'GET' || method === 'DELETE';
  const finalUrl = isGet && data ? BASE_URL + url + toQueryString(data) : BASE_URL + url;

  return new Promise((resolve, reject) => {
    wx.request({
      url: finalUrl,
      method,
      timeout,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? 'Bearer ' + token : ''
      },
      data: isGet ? undefined : data,  // GET 不传 body
      success(res) {
        if (showLoading) wx.hideLoading();

        if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          const app = getApp();
          if (app) {
            app.globalData.token = '';
            app.globalData.isLoggedIn = false;
          }
          wx.reLaunch({ url: '/pages/index/index' });
          reject({ code: 401, message: '登录已过期，请重新登录' });
          return;
        }

        if (res.data.code === 0) {
          resolve(res.data.data);
        } else {
          reject({ code: res.data.code, message: res.data.message || '请求失败' });
        }
      },
      fail(err) {
        if (showLoading) wx.hideLoading();
        reject({ code: -1, message: '网络异常，请检查网络连接' });
      }
    });
  });
}

/**
 * 文件上传
 * @param {string} filePath  - 本地文件路径
 * @param {object} formData  - 附加表单数据
 * @returns {Promise}
 */
function upload(filePath, formData = {}) {
  const app = getApp();
  const token = app ? app.globalData.token : wx.getStorageSync('token');

  return new Promise((resolve, reject) => {
    const task = wx.uploadFile({
      url: BASE_URL + '/api/photos/upload',
      filePath,
      name: 'file',
      formData,
      header: {
        Authorization: token ? 'Bearer ' + token : ''
      },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) resolve(data.data);
          else reject(data);
        } catch (e) {
          reject({ code: -1, message: '解析响应失败' });
        }
      },
      fail() {
        reject({ code: -1, message: '上传失败' });
      }
    });

    // 返回 task 以支持 onProgressUpdate
    return task;
  });
}

module.exports = { request, upload };
