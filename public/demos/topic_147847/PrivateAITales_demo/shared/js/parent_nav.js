/* 家长端底部导航 */
(function() {
  if (document.getElementById('parentNavBar')) return;

  var navHTML = '<div class="parent-nav-bar" id="parentNavBar" style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E8DED0;display:flex;padding:6px 0 8px;z-index:100;">' +
    '<a class="parent-nav-item" data-nav="home" onclick="ParentNav.go(\'parent_home.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">🏛️</span>AI私塾</a>' +
    '<a class="parent-nav-item" data-nav="kong" onclick="ParentNav.go(\'parent_chat.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">👨‍🏫</span>孔先生</a>' +
    '<a class="parent-nav-item" data-nav="library" onclick="ParentNav.go(\'library.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">📚</span>书房</a>' +
    '<a class="parent-nav-item" data-nav="create" onclick="ParentNav.go(\'parent_create.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">✏️</span>创作</a>' +
    '<a class="parent-nav-item" data-nav="me" onclick="ParentNav.go(\'me.html\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 0;color:#8B7355;font-size:10px;font-weight:600;text-decoration:none;">' +
    '<span style="font-size:20px;">👤</span>我</a>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', navHTML);

  window.ParentNav = {
    go: function(url) {
      if (url === 'library.html' || url === 'html/library.html') {
        localStorage.setItem('sishu_library_from', 'parent');
      }
      if (url === 'me.html' || url === 'html/me.html') {
        localStorage.setItem('sishu_me_from', 'parent');
      }
      navigateTo(url, 'parent');
      ParentNav.highlight(url);
    },
    highlight: function(url) {
      var items = document.querySelectorAll('.parent-nav-item');
      items.forEach(function(item) { item.style.color = '#8B7355'; });
      var map = {
        'parent_home.html': 'home', 'parent_chat.html': 'kong',
        'library.html': 'library', 'html/library.html': 'library',
        'bookstore.html': 'library', 'html/bookstore.html': 'library',
        'parent_create.html': 'create', 'html/parent_create.html': 'create',
        'on_boarding.html': 'home', 'html/on_boarding.html': 'home',
        'me.html': 'me', 'html/me.html': 'me'
      };
      var key = map[url] || 'home';
      var active = document.querySelector('[data-nav="' + key + '"]');
      if (active) active.style.color = '#8B5E3C';
    }
  };

  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1);
  ParentNav.highlight(page);
})();