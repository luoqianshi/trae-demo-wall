/**
 * 超星泛雅（学习通）OAuth登录模块
 * 处理超星授权登录全流程
 */
(function() {
  'use strict';

  var CHAOXING_API = '/api/chaoxing';

  /**
   * 发起超星登录
   * @param {string} role - 预期角色 teacher/student
   */
  window.startChaoxingLogin = function(role) {
    // 获取授权URL
    fetch(CHAOXING_API + '/auth-url?role=' + (role || ''))
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.success && result.data.authUrl) {
          // 保存state到sessionStorage用于回调校验
          sessionStorage.setItem('cx_state', result.data.state);
          sessionStorage.setItem('cx_role', role || '');
          // 跳转到超星授权页
          window.location.href = result.data.authUrl;
        } else {
          alert('获取超星授权链接失败');
        }
      })
      .catch(function(err) {
        console.error('超星登录失败:', err);
        alert('超星登录服务暂时不可用');
      });
  };

  /**
   * 处理超星回调（在callback.html中调用）
   * @param {string} code - 授权码
   * @param {string} state - 状态码
   */
  window.handleChaoxingCallback = function(code, state) {
    var savedState = sessionStorage.getItem('cx_state');

    // 可选：校验state防止CSRF
    if (savedState && savedState !== state) {
      console.warn('State不匹配，可能存在安全风险');
    }

    return fetch(CHAOXING_API + '/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, state: state })
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      if (result.success && result.data.token) {
        // 保存Token
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_info', JSON.stringify(result.data.user));
        // 清理sessionStorage
        sessionStorage.removeItem('cx_state');
        sessionStorage.removeItem('cx_role');
        return { success: true, user: result.data.user };
      } else {
        throw new Error(result.message || '登录失败');
      }
    });
  };

  /**
   * 获取当前登录用户信息
   */
  window.getCurrentUser = function() {
    var token = localStorage.getItem('auth_token');
    if (!token) return null;

    return fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      if (result.success) {
        localStorage.setItem('user_info', JSON.stringify(result.data));
        return result.data;
      }
      return null;
    })
    .catch(function() { return null; });
  };

  /**
   * 退出登录
   */
  window.logout = function() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    window.location.reload();
  };

})();
