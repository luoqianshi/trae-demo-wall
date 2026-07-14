/* 孩子端底部导航 */
(function() {
  if (document.getElementById('childNavBar')) return;

  var navHTML = '<div class="child-nav-bar" id="childNavBar" style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E8DED0;display:flex;padding:6px 0 8px;z-index:100;">' +
    '<a class="child-nav-item" data-nav="home" onclick="ChildNav.go(\'child_home.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">🌟</span>推荐</a>' +
    '<a class="child-nav-item" data-nav="chat" onclick="ChildNav.go(\'child_chat.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">💬</span>小安</a>' +
    '<a class="child-nav-item" data-nav="books" onclick="ChildNav.go(\'library.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">📚</span>我的书</a>' +
    '<a class="child-nav-item" data-nav="me" onclick="ChildNav.go(\'me.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">👤</span>我</a>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', navHTML);

  window.ChildNav = {
    go: function(url) {
      if (url === 'library.html' || url === 'html/library.html') {
        localStorage.setItem('sishu_library_from', 'child');
      }
      if (url === 'me.html' || url === 'html/me.html') {
        localStorage.setItem('sishu_me_from', 'child');
      }
      navigateTo(url, 'child');
      ChildNav.highlight(url);
    },
    highlight: function(url) {
      var items = document.querySelectorAll('.child-nav-item');
      items.forEach(function(item) { item.style.color = '#8B7355'; });
      var map = {
        'child_home.html': 'home', 'html/child_home.html': 'home',
        'child_chat.html': 'chat', 'html/child_chat.html': 'chat',
        'library.html': 'books', 'html/library.html': 'books',
        'book_reader_full.html': 'books', 'html/book_reader_full.html': 'books',
        'me.html': 'me', 'html/me.html': 'me'
      };
      var key = map[url] || 'home';
      var active = document.querySelector('[data-nav="' + key + '"]');
      if (active) active.style.color = '#FF9800';
    },
    openReader: function(bookId) {
      console.log('[孩子端导航] 打开绘本阅读器 | bookId:', bookId);
      if (typeof showBookDemoToast === 'function') {
        showBookDemoToast();
      } else if (typeof openBookReader === 'function') {
        openBookReader(bookId);
      } else {
        console.warn('[孩子端导航] showBookDemoToast 函数未定义');
      }
    }
  };

  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1);
  ChildNav.highlight(page);
})();