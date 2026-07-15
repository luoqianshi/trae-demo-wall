/* UI 组件：Toast / Modal / 境界提升庆祝 */
(function (App) {
  'use strict';
  var h = App.h;

  function toast(msg, ms) {
    var wrap = document.getElementById('toastWrap');
    var t = h('.toast', { text: msg });
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, ms || 1800);
  }

  function modal(title, contentNode, opts) {
    opts = opts || {};
    var root = document.getElementById('modalRoot');
    App.clear(root);
    var closeBtn = h('button.modal-close', { text: '×', onclick: closeModal });
    var box = h('.modal', {}, [
      closeBtn,
      h('.modal-title', { text: title }),
      contentNode
    ]);
    root.appendChild(box);
    root.classList.add('open');
    root.onclick = function (e) { if (e.target === root) closeModal(); };
    return box;
  }

  function closeModal() {
    var root = document.getElementById('modalRoot');
    root.classList.remove('open');
    App.clear(root);
  }

  // 境界提升庆祝
  function celebrate(realm) {
    var screen = document.querySelector('.phone-screen');
    var node = h('.celebrate', {}, [
      h('.burst', {}, [
        h('.ring', { text: realm.name }),
        h('h3', { text: '境界突破！' }),
        h('p', { text: realm.name + ' · ' + realm.sub })
      ])
    ]);
    node.onclick = function () { if (node.parentNode) node.parentNode.removeChild(node); };
    screen.appendChild(node);
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 2600);
  }

  // 进度条组件
  function progress(pct) {
    var bar = h('.progress', {}, [h('i')]);
    setTimeout(function () { bar.firstChild.style.width = Math.round(pct * 100) + '%'; }, 60);
    return bar;
  }

  // 加载中气泡（返回节点 + stop 方法）
  function spinner(text) {
    return h('.row', { style: { gap: '0.5rem', color: 'var(--muted)' } }, [
      h('span', { html: '<span class="dot-spin">◍</span>' }),
      h('span', { text: text || '推演中…' })
    ]);
  }

  App.UI = {
    toast: toast, modal: modal, closeModal: closeModal,
    celebrate: celebrate, progress: progress, spinner: spinner
  };
})(window.App);
