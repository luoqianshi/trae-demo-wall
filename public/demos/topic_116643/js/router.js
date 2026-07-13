/**
 * 简单路由管理
 * 用于页面跳转和导航状态管理
 */

// 动态计算项目根路径（兼容 file:// 与 http://，以及 Windows 反斜杠）
function getProjectBaseUrl() {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    let src = scripts[i].src || '';
    src = src.replace(/\\/g, '/');
    const idx = src.indexOf('/js/router.js');
    if (idx > -1) {
      return src.substring(0, idx);
    }
  }
  // 兜底：从当前页面路径向上回退到项目根（pages/xxx/xxx.html -> 根目录）
  let href = window.location.href.replace(/\\/g, '/');
  const lastSlash = href.lastIndexOf('/');
  const secondLastSlash = href.lastIndexOf('/', lastSlash - 1);
  const thirdLastSlash = href.lastIndexOf('/', secondLastSlash - 1);
  if (thirdLastSlash > -1) {
    return href.substring(0, thirdLastSlash);
  }
  return '.';
}

const BASE_URL = getProjectBaseUrl();

const Router = {
  currentPage: 'index',

  // 跳转到指定页面（使用相对路径，兼容 file:// 协议直接打开）
  navigateTo(page, params) {
    const pageMap = {
      'index': BASE_URL + '/pages/index/index.html',
      'calculate': BASE_URL + '/pages/calculate/calculate.html',
      'news': BASE_URL + '/pages/news/news.html',
      'mine': BASE_URL + '/pages/mine/mine.html',
      'login': BASE_URL + '/pages/login/login.html',
      'userInfo': BASE_URL + '/pages/userInfo/userInfo.html',
      'setting': BASE_URL + '/pages/setting/setting.html',
      'records': BASE_URL + '/pages/records/records.html',
      'favorites': BASE_URL + '/pages/favorites/favorites.html',
      'newsDetail': BASE_URL + '/pages/newsDetail/newsDetail.html'
    };

    const url = pageMap[page];
    if (!url) return;

    if (params) {
      const query = Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
      window.location.href = url + '?' + query;
    } else {
      window.location.href = url;
    }
  },

  // 返回上一页
  goBack() {
    window.history.back();
  },

  // 获取URL参数
  getParams() {
    const params = {};
    const search = window.location.search.substring(1);
    if (search) {
      search.split('&').forEach(pair => {
        const [k, v] = pair.split('=', 2);
        params[k] = decodeURIComponent(v || '');
      });
    }
    return params;
  },

  // 切换底部Tab
  switchTab(tab) {
    const tabMap = {
      'index': BASE_URL + '/pages/index/index.html',
      'calculate': BASE_URL + '/pages/calculate/calculate.html',
      'news': BASE_URL + '/pages/news/news.html',
      'mine': BASE_URL + '/pages/mine/mine.html'
    };
    const url = tabMap[tab];
    if (url) {
      window.location.href = url;
    }
  }
};

// 全局Toast
function showToast(msg, duration) {
  duration = duration || 2000;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// 全局确认弹窗
function showConfirm(title, desc, onConfirm) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  var content = document.createElement('div');
  content.className = 'modal-content';
  var titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  var descEl = document.createElement('div');
  descEl.className = 'modal-desc';
  descEl.textContent = desc;
  var actions = document.createElement('div');
  actions.className = 'modal-actions';
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = '取消';
  cancelBtn.onclick = function() { overlay.remove(); };
  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger';
  confirmBtn.textContent = '确认';
  confirmBtn.onclick = function() {
    overlay.remove();
    if (onConfirm) onConfirm();
  };
  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  content.appendChild(titleEl);
  content.appendChild(descEl);
  content.appendChild(actions);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };
}

// 格式化金额
function formatMoney(num) {
  return '¥ ' + Math.round(num).toLocaleString('zh-CN');
}

// 复制文本到剪贴板（含降级方案）
function copyToClipboard(text, onSuccess, onFail) {
  onSuccess = onSuccess || function() { showToast('已复制到剪贴板'); };
  onFail = onFail || function() { showToast('复制失败，请手动复制'); };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(onFail);
  } else {
    var input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.setAttribute('readonly', '');
    document.body.appendChild(input);
    input.select();
    try {
      if (document.execCommand('copy')) {
        onSuccess();
      } else {
        onFail();
      }
    } catch (e) {
      onFail();
    }
    document.body.removeChild(input);
  }
}

// 格式化金额带万元
function formatMoneySmart(num) {
  const rounded = Math.round(num);
  if (rounded >= 10000) {
    return '¥ ' + rounded.toLocaleString('zh-CN') + ' (' + (rounded / 10000).toFixed(2) + '万元)';
  }
  return '¥ ' + rounded.toLocaleString('zh-CN');
}

// 渲染底部导航（兼容 file:// 协议，fetch 失败时使用内置兜底）
function renderBottomNav(containerId, currentPage) {
  const fallbackHtml = `
    <div class="bottom-nav" id="bottomNav">
      <div class="nav-item" data-page="index" onclick="Router.switchTab('index')"><div class="nav-icon">🏠</div><span>首页</span></div>
      <div class="nav-item" data-page="calculate" onclick="Router.switchTab('calculate')"><div class="nav-icon">🧮</div><span>税费测算</span></div>
      <div class="nav-item" data-page="news" onclick="Router.switchTab('news')"><div class="nav-icon">📰</div><span>政策资讯</span></div>
      <div class="nav-item" data-page="mine" onclick="Router.switchTab('mine')"><div class="nav-icon">👤</div><span>我的</span></div>
    </div>
  `;
  const container = document.getElementById(containerId);
  if (!container) return;

  fetch(BASE_URL + '/components/bottomNav.html')
    .then(r => r.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = fallbackHtml;
    })
    .finally(() => {
      const items = container.querySelectorAll('.nav-item');
      items.forEach(function(item) {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === currentPage) {
          item.classList.add('active');
        }
      });
    });
}

// 登录拦截检查
function requireLogin(callback) {
  if (!Storage.isLoggedIn()) {
    Router.navigateTo('login', { redirect: window.location.href });
    return false;
  }
  if (callback) callback();
  return true;
}