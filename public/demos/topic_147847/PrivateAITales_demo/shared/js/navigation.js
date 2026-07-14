/* ===== 导航逻辑 ===== */

/* 检测当前页面属于哪个终端 */
function getEndpoint() {
  var path = window.location.pathname || '';
  var href = window.location.href || '';
  if (path.indexOf('child_') !== -1 || path.indexOf('book_reader') !== -1) return 'child';
  if (href.indexOf('child_') !== -1 || href.indexOf('book_reader') !== -1) return 'child';
  return 'parent';
}

function openBookReader(bookId) {
  showBookDemoToast();
}

function showBookDemoToast() {
  var existing = document.getElementById('bookDemoToast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'bookDemoToast';
  toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;padding:20px 28px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);text-align:center;max-width:280px;animation:toastFadeIn 0.3s ease-out;';
  toast.innerHTML = '<div style="font-size:36px;margin-bottom:8px;">📖</div>' +
    '<div style="font-size:16px;font-weight:700;color:#5D4037;margin-bottom:4px;">DEMO 演示</div>' +
    '<div style="font-size:13px;color:#8D6E63;line-height:1.6;">Demo 暂不提供绘本内容<br>正式产品将包含完整绘本阅读体验</div>';
  document.body.appendChild(toast);
  var style = document.getElementById('bookDemoToastStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'bookDemoToastStyle';
    style.textContent = '@keyframes toastFadeIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }';
    document.head.appendChild(style);
  }
  setTimeout(function() {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
  }, 2000);
}

function navigateTo(url, endpoint) {
  var ep = endpoint || getEndpoint();
  if (window.parent && window.parent !== window) {
    // 在 iframe 中，通过 postMessage 通知父页面导航
    var fullUrl = url;
    if (!url.startsWith('html/') && !url.startsWith('http')) {
      fullUrl = 'html/' + url;
    }
    window.parent.postMessage({ type: 'navigate', url: fullUrl, endpoint: ep }, '*');
  } else {
    // 直接浏览时，使用相对路径
    window.location.href = url;
  }
}

function goBack() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'goBack' }, '*');
  } else {
    window.history.back();
  }
}

/* ===== 底部导航栏（统一App主菜单） ===== */
var TAB_CONFIG = {
  unified: [
    { icon: '👨‍🏫', label: '孔先生', url: 'parent_chat.html', key: 'kong' },
    { icon: '💬', label: '小安', url: 'child_chat.html', key: 'xiaoan' },
    { icon: '📚', label: '书房', url: 'library.html', key: 'library' },
    { icon: '✏️', label: '创作', url: 'parent_create.html', key: 'create' },
    { icon: '👤', label: '我', url: 'parent_home.html', key: 'me' }
  ],
  parent: [
    { icon: '👨‍🏫', label: '孔先生', url: 'parent_chat.html', key: 'kong' },
    { icon: '📚', label: '书房', url: 'library.html', key: 'library' },
    { icon: '✏️', label: '创作', url: 'parent_create.html', key: 'create' },
    { icon: '👤', label: '我', url: 'parent_home.html', key: 'me' }
  ],
  child: [
    { icon: '🌟', label: '推荐', url: 'child_home.html', key: 'home' },
    { icon: '💬', label: '小安', url: 'child_chat.html', key: 'chat' },
    { icon: '📚', label: '我的书', url: 'library.html', key: 'books' },
    { icon: '👤', label: '我', url: 'child_home.html', key: 'me' }
  ]
};

function renderTabBar(role, activeKey) {
  var tabs = TAB_CONFIG[role] || TAB_CONFIG.parent;
  var html = '<div class="tab-bar">';
  tabs.forEach(function(tab) {
    var isActive = tab.key === activeKey ? ' active' : '';
    var onClick = 'navigateTo(\'' + tab.url + '\')';
    html += '<div class="tab-item' + isActive + '" onclick="' + onClick + '">' +
      '<div class="tab-icon">' + tab.icon + '</div>' +
      '<div class="tab-label">' + tab.label + '</div>' +
      '</div>';
  });
  html += '</div>';
  return html;
}

function mountTabBar(role, activeKey) {
  var existing = document.querySelector('.tab-bar');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.innerHTML = renderTabBar(role, activeKey);
  document.body.appendChild(div.firstChild);
}

/* 监听来自父页面的导航消息 */
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'navigate' && e.data.url) {
    window.location.href = e.data.url;
  }
});