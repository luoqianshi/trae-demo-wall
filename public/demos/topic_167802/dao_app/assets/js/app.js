/* 启动入口 */
(function (App) {
  'use strict';

  function tickClock() {
    var el = document.getElementById('sbTime');
    if (!el) return;
    var d = new Date();
    el.textContent = App.pad(d.getHours()) + ':' + App.pad(d.getMinutes());
  }

  function boot() {
    App.Store.load();

    // 注册所有页面（各 page 文件已把 register 逻辑挂到 App.Pages 上）
    Object.keys(App.Pages || {}).forEach(function (name) {
      App.Router.register(name, App.Pages[name]);
    });

    tickClock();
    setInterval(tickClock, 15000);

    App.Router.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.App);
