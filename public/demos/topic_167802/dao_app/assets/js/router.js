/* Hash 路由 + 底部导航 */
(function (App) {
  'use strict';
  var h = App.h;

  // 路由表：name -> { title, tab, render(params), back }
  var routes = {};
  // 底部 Tab：山医命相卜五方向横向等距；洞天为核心，悬浮在正中「命」上方
  var TABS = [
    { route: 'mountain',   ico: '山' },
    { route: 'medicine',   ico: '医' },
    { route: 'destiny',    ico: '命' },
    { route: 'face',       ico: '相' },
    { route: 'divination', ico: '卜' }
  ];

  function register(name, def) { routes[name] = def; }

  function parseHash() {
    var hash = location.hash.replace(/^#\/?/, '');
    var parts = hash.split('?');
    var name = parts[0] || 'home';
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (kv) {
        var p = kv.split('=');
        params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    return { name: name, params: params };
  }

  function go(name, params) {
    var q = '';
    if (params) {
      q = '?' + Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
    }
    location.hash = '#/' + name + q;
  }

  function current() { return parseHash(); }

  function render() {
    var r = parseHash();
    var def = routes[r.name] || routes.home;
    var view = document.getElementById('view');
    var appbar = document.getElementById('appbar');
    var sbTitle = document.getElementById('sbTitle');

    // App Bar
    App.clear(appbar);
    if (def.back) {
      appbar.appendChild(h('button.ab-back', { html: '‹', onclick: function () {
        if (typeof def.back === 'string') go(def.back); else history.back();
      }}));
    }
    appbar.appendChild(h('span.ab-title', { text: def.title || '' }));
    if (def.sub) appbar.appendChild(h('span.ab-sub', { text: typeof def.sub === 'function' ? def.sub() : def.sub }));
    // 右上角齿轮 → 设置/我的（设置页自身不再重复显示）
    if (r.name !== 'profile') {
      appbar.appendChild(h('button.ab-gear', { html: '⚙', title: '设置', onclick: function () { go('profile'); } }));
    }
    if (sbTitle) sbTitle.textContent = def.title || '凡人修仙';

    // 内容
    App.clear(view);
    view.scrollTop = 0;
    view.classList.remove('view-fade');
    void view.offsetWidth; // reflow 触发动画
    view.classList.add('view-fade');
    var node = def.render ? def.render(r.params) : h('div', { text: '空页面' });
    if (node) view.appendChild(node);

    renderTabs(def.tab || r.name);
  }

  function renderTabs(activeTab) {
    var bar = document.getElementById('tabbar');
    App.clear(bar);
    TABS.forEach(function (t) {
      var active = t.route === activeTab;
      var btn = h('button.tab' + (active ? '.active' : ''), {
        onclick: function () { go(t.route); }
      }, [
        h('span.tab-ico', { text: t.ico })
      ]);
      bar.appendChild(btn);
    });
    // 洞天核心：悬浮在正中「命」上方，不占格位、不显示文字
    var coreActive = activeTab === 'home';
    bar.appendChild(h('button.tab-core' + (coreActive ? ' active' : ''), {
      title: '洞天',
      onclick: function () { go('home'); }
    }, [ h('span.core-circle', { text: '☯' }) ]));
  }

  function start() {
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/home';
    else render();
  }

  App.Router = {
    register: register, go: go, render: render, start: start, current: current, TABS: TABS
  };
})(window.App);
