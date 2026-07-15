/* 通用工具 */
(function (App) {
  'use strict';

  // 极简元素创建 h('div.card', {onclick}, [children | string])
  function h(tag, attrs, children) {
    // 解析 tag.class#id
    var cls = [];
    var id = null;
    var name = tag.replace(/[.#][^.#]+/g, function (m) {
      if (m[0] === '.') cls.push(m.slice(1));
      else id = m.slice(1);
      return '';
    });
    var el = document.createElement(name || 'div');
    if (cls.length) el.className = cls.join(' ');
    if (id) el.id = id;
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k)) continue;
        var v = attrs[k];
        if (v == null) continue;
        if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'class') el.className += ' ' + v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'style' && typeof v === 'object') {
          for (var s in v) el.style[s] = v[s];
        } else {
          el.setAttribute(k, v);
        }
      }
    }
    append(el, children);
    return el;
  }

  function append(el, children) {
    if (children == null) return;
    if (Array.isArray(children)) {
      children.forEach(function (c) { append(el, c); });
    } else if (typeof children === 'string' || typeof children === 'number') {
      el.appendChild(document.createTextNode(String(children)));
    } else if (children instanceof Node) {
      el.appendChild(children);
    }
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  // 模拟异步（网络/AI 思考）
  function delay(ms) {
    return new Promise(function (res) { setTimeout(res, ms == null ? (200 + Math.random() * 500) : ms); });
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // 基于种子的伪随机（保证同样输入得到同样结果，如八字）
  function seededRandom(seedStr) {
    var seed = 0;
    for (var i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    return function () {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtTime(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  App.h = h;
  App.clear = clear;
  App.delay = delay;
  App.pick = pick;
  App.seededRandom = seededRandom;
  App.pad = pad;
  App.fmtTime = fmtTime;
})(window.App);
