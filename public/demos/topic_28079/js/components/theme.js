/* ============================================================
 * theme.js  明暗主题切换
 * ============================================================ */
(function (global) {
  'use strict';
  var STORAGE_KEY = 'bjsd_theme';

  function apply(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add('theme-' + (theme || 'light'));
    try { localStorage.setItem(STORAGE_KEY, theme || 'light'); } catch (e) {}
  }

  function init() {
    var saved = 'light';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'light'; } catch (e) {}
    apply(saved);

    var btn = document.getElementById('btn-theme');
    if (btn) {
      btn.addEventListener('click', function () {
        var cur = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
        var next = cur === 'dark' ? 'light' : 'dark';
        apply(next);
        global.__C && global.__C.toast('已切换为' + (next === 'dark' ? '暗色' : '亮色') + '主题', '');
      });
    }
  }

  global.__THEME = { init: init, apply: apply };
  document.addEventListener('DOMContentLoaded', init);
})(window);
