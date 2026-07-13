/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

function navigateTo(pagePath, params) {
  // 处理相对路径中的 ../ 前缀，确保从当前目录正确跳转
  let target = pagePath;
  if (params) {
    const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    target = target + '?' + query;
  }
  window.location.href = target;
}

// 兼容旧版 onclick 直接赋值 window.location 的写法
function navTo(pagePath) {
  window.location.href = pagePath;
}

function getUrlParam(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

function goBack() {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.history.back();
  }
}

function openFamilyView() {
  navigateTo('../family/family_home.html');
}

function openMyView() {
  navigateTo('../me/me_home.html');
}

// 获取当前页面相对于根目录的路径前缀
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/me/')) return '../';
  if (path.includes('/family/')) return '../';
  if (path.includes('/common/')) return '';
  return '';
}

// ===== 设计师 P0 修复：iframe 内页面加载后向父页面报告自己的路径 =====
// file:// 协议下父页面无法访问 iframe.contentWindow.location（跨域 origin "null"）
// 改为 iframe 主动 postMessage 报告，父页面收到后更新 infoBar
(function reportPageToParent() {
  try {
    if (window.parent && window.parent !== window) {
      // 提取相对路径：从 pathname 中找 html/ 开始的部分
      var path = window.location.pathname;
      var match = path.match(/html[\/\\].*\.html/i);
      var relativeSrc = match ? match[0].replace(/\\/g, '/') : '';
      window.parent.postMessage({
        type: 'silvercare_page_change',
        src: relativeSrc
      }, '*');
    }
  } catch (e) {
    // 跨域时静默降级
  }
})();