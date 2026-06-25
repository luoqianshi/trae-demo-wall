// ============================================================================
// js/baidu-push.js
// 百度搜索资源平台 - 自动推送 + 主动推送工具
// 文档: https://ziyuan.baidu.com/linksubmit/index
//
// 用法:
//   1. 把这个文件 <script src="js/baidu-push.js"></script> 引入到 index.html
//      (放在 js/app.js 后面即可,自动推送立即生效,无需任何配置)
//   2. (可选) 想在发新内容后立即推送给百度?
//      在百度站长平台 → 链接提交 → 主动推送 拿到你的 API 地址,
//      填到下方 BAIDU_PUSH_API,部署后浏览器控制台执行:
//          pushToBaidu()                          // 推送当前页
//          pushToBaidu('https://px.yerpx.com/')   // 推送指定页
//          pushToBaidu(['url1', 'url2'])          // 批量推送
// ============================================================================

(function() {
  'use strict';

  // ===== 1. 自动推送(零配置,真实用户访问页面时自动提交当前 URL) =====
  function autoPush() {
    if (typeof window === 'undefined') return;
    try {
      var bp = document.createElement('script');
      var curProtocol = window.location.protocol.split(':')[0];
      if (curProtocol === 'https') {
        bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
      } else {
        bp.src = 'http://push.zhanzhang.baidu.com/push.js';
      }
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(bp, s);
    } catch (e) { /* 静默失败,不影响主功能 */ }
  }

  // ===== 2. 主动推送 API(可选,需要 token) =====
  // 在百度站长平台 → 链接提交 → 主动推送 页面获取你的专属 API 地址
  // 格式示例: https://data.zz.baidu.com/urls?site=https://px.yerpx.com&token=xxxxxxxx
  //
  // ⚠️ 保持空字符串 = 禁用主动推送,只用自动推送(也够用了)
  // 填入真实地址 = 启用主动推送,可在浏览器控制台调用 pushToBaidu(url)
  var BAIDU_PUSH_API = '';

  /**
   * 主动推送 URL 到百度(需要先配置 BAIDU_PUSH_API)
   * @param {string|string[]} [urls] - URL 字符串、URL 数组,或留空推送当前页
   * @returns {Promise}
   */
  window.pushToBaidu = function(urls) {
    var urlList = Array.isArray(urls) ? urls : (urls ? [urls] : [window.location.href]);

    if (!BAIDU_PUSH_API || BAIDU_PUSH_API.indexOf('token=') < 0) {
      console.warn('[百度推送] API 未配置。在 js/baidu-push.js 里设置 BAIDU_PUSH_API 后才可用。');
      console.info('[百度推送] 自动推送仍在工作(无需配置),真实用户访问即自动提交。');
      console.info('[百度推送] 获取 token: 百度站长平台 → 链接提交 → 主动推送');
      return Promise.reject(new Error('API not configured'));
    }

    console.log('[百度推送] 正在推送 ' + urlList.length + ' 个 URL...');

    return fetch(BAIDU_PUSH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: urlList.join('\n')
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        console.error('[百度推送] 失败: ' + (data.message || data.error));
      } else {
        console.log('[百度推送] ✓ 成功 - 成功 ' + data.success + ' 条,当天剩余配额 ' + data.remain);
      }
      return data;
    })
    .catch(function(err) {
      console.error('[百度推送] 网络错误: ' + err);
      throw err;
    });
  };

  // ===== 启动自动推送 =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoPush);
  } else {
    autoPush();
  }
})();
