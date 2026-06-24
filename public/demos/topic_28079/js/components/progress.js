/* ============================================================
 * progress.js  进度条组件（用于暴力穷举等耗时任务）
 * 提供 setProgress(percent, text)、updateInfo({current, speed}) 等方法
 * ============================================================ */
(function (global) {
  'use strict';

  function bind(wrapperSel) {
    var wrap = typeof wrapperSel === 'string' ? document.querySelector(wrapperSel) : wrapperSel;
    if (!wrap) return null;
    var fill = wrap.querySelector('#crypto-progress-fill') || wrap.querySelector('.progress-fill');
    var text = wrap.querySelector('#crypto-progress-text');
    var pct = wrap.querySelector('#crypto-progress-pct');
    var cur = wrap.querySelector('#crypto-current');
    var spd = wrap.querySelector('#crypto-speed');
    function setProgress(percent, t) {
      percent = Math.max(0, Math.min(100, percent));
      if (fill) fill.style.width = percent.toFixed(2) + '%';
      if (pct) pct.textContent = percent.toFixed(2) + '%';
      if (text && t) text.textContent = t;
    }
    function setInfo(c, s) {
      if (cur) cur.textContent = c != null ? String(c) : '-';
      if (spd) spd.textContent = s != null ? String(s) : '0';
    }
    function show() { wrap.classList.remove('hidden'); }
    function hide() { wrap.classList.add('hidden'); }
    return { setProgress: setProgress, setInfo: setInfo, show: show, hide: hide };
  }

  global.__PROGRESS = { bind: bind };
})(window);
