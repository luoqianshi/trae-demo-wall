// miniprogram/utils/request.js
// 统一封装云函数调用入口（当前为本地 mock 实现）
// 未来接入微信云开发时，只需把 mockCall 替换为 wx.cloud.callFunction 即可

const mock = require('./mock.js');

function mockCall(name, params) {
  // 本地模拟云函数的实现（从 mock.js 中查找同名方法）
  return new Promise((resolve) => {
    const fn = mock[name];
    setTimeout(() => {
      try {
        if (typeof fn === 'function') {
          resolve(fn(params));
        } else {
          resolve({ code: -1, msg: '云函数 ' + name + ' 未实现' });
        }
      } catch (e) {
        resolve({ code: -1, msg: e.message || '系统异常' });
      }
    }, 80); // 80ms 模拟网络延迟
  });
}

// 通用调用入口
function call(name, params) {
  return mockCall(name, params).then(res => {
    if (res && res.code === 0) {
      return res.data;
    }
    wx.showToast({ title: (res && res.msg) || '请求失败', icon: 'none' });
    return Promise.reject(res || {});
  });
}

module.exports = { call, mockCall };
