/* =============================================
   灵感坊 — 共享交互脚本
   提供：Toast 轻提示 / Modal 信息弹窗 / 返回顶部 / Footer 链接处理
   用法：页面引入本文件后，调用 InspiroHub.init() 即可
   ============================================= */
(function (window, document) {
  'use strict';

  var InspiroHub = {};

  /* ── 读取主题变量（兼容各页 :root token） ── */
  function v(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ───────────────────────────────────────────
     0. 全局基础样式注入（焦点态 / 光标 / 滚动）
     ─────────────────────────────────────────── */
  InspiroHub.initBaseStyles = function () {
    if (document.getElementById('app-base-style')) return;
    var css = document.createElement('style');
    css.id = 'app-base-style';
    css.textContent = [
      'html { scroll-behavior: smooth; }',
      'button:not(:disabled) { cursor: pointer; }',
      'button:disabled { cursor: not-allowed; }',
      'a, [role="button"], [role="option"], [role="listbox"] { cursor: pointer; }',
      ':focus-visible { outline: 2px solid var(--color-primary, #10B981); outline-offset: 2px; border-radius: 4px; }',
      'textarea:focus, input[type="text"]:focus, input[type="email"]:focus, input:not([type]):focus { border-color: var(--color-primary, #10B981) !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.15) !important; }',
      'img { -webkit-user-drag: none; user-select: none; }'
    ].join('\n');
    document.head.appendChild(css);
  };

  /* ───────────────────────────────────────────
     1. Toast 轻提示
     ─────────────────────────────────────────── */
  var toastTimer;
  InspiroHub.toast = function (message, duration) {
    duration = duration || 2200;
    var toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = [
        'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
        'padding:10px 20px', 'border-radius:8px', 'font-size:14px', 'font-weight:500',
        'color:#fff', 'background:#111827', 'z-index:9999',
        'opacity:0', 'pointer-events:none', 'transition:opacity 200ms ease',
        'box-shadow:0 4px 16px rgba(0,0,0,0.12)', 'max-width:90vw', 'text-align:center'
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.style.opacity = '0'; }, duration);
  };

  /* ───────────────────────────────────────────
     2. Modal 信息弹窗
     ─────────────────────────────────────────── */
  InspiroHub.modal = function (opts) {
    opts = opts || {};
    // 移除已有
    var existing = document.getElementById('app-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'app-modal-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(17,24,39,0.45)',
      'z-index:9998', 'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'opacity:0', 'transition:opacity 200ms ease',
      '-webkit-backdrop-filter:blur(2px)', 'backdrop-filter:blur(2px)'
    ].join(';');

    var dialog = document.createElement('div');
    var border = v('--color-border') || '#E5E7EB';
    var primary = v('--color-primary') || '#10B981';
    var textPrimary = v('--color-text-primary') || '#111827';
    var textSecondary = v('--color-text-secondary') || '#6B7280';
    dialog.style.cssText = [
      'background:#fff', 'border-radius:16px', 'max-width:480px', 'width:100%',
      'max-height:85vh', 'overflow-y:auto', 'box-shadow:0 20px 60px rgba(0,0,0,0.2)',
      'transform:translateY(12px) scale(0.98)', 'transition:transform 220ms ease'
    ].join(';');

    var html = '';
    // Header
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid ' + border + ';">';
    html += '<h3 style="font-size:18px;font-weight:600;color:' + textPrimary + ';margin:0;">' + escapeHtml(opts.title || '提示') + '</h3>';
    html += '<button data-modal-close style="background:none;border:none;cursor:pointer;padding:4px;color:' + textSecondary + ';line-height:0;border-radius:6px;transition:background 150ms ease;" aria-label="关闭">';
    html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    html += '</button>';
    html += '</div>';
    // Body
    html += '<div style="padding:24px;color:' + textSecondary + ';font-size:14px;line-height:1.6;">' + (opts.body || '') + '</div>';
    // Footer actions
    if (opts.actions && opts.actions.length) {
      html += '<div style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid ' + border + ';">';
      opts.actions.forEach(function (act, i) {
        var isPrimary = act.primary;
        var style = isPrimary
          ? 'background:' + primary + ';color:#fff;border:none;'
          : 'background:#fff;color:' + textSecondary + ';border:1px solid ' + border + ';';
        html += '<button data-action="' + i + '" style="' + style + 'padding:8px 18px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:opacity 150ms ease;">' + escapeHtml(act.label) + '</button>';
      });
      html += '</div>';
    }
    dialog.innerHTML = html;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 显示动画
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
      dialog.style.transform = 'translateY(0) scale(1)';
    });

    function close() {
      overlay.style.opacity = '0';
      dialog.style.transform = 'translateY(12px) scale(0.98)';
      setTimeout(function () { overlay.remove(); }, 220);
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-modal-close]').addEventListener('click', close);
    var btns = overlay.querySelectorAll('[data-action]');
    btns.forEach(function (btn) {
      btn.addEventListener('mouseenter', function () { btn.style.opacity = '0.85'; });
      btn.addEventListener('mouseleave', function () { btn.style.opacity = '1'; });
      btn.addEventListener('click', function () {
        var idx = Number(btn.getAttribute('data-action'));
        var act = opts.actions[idx];
        if (act && typeof act.onClick === 'function') {
          if (act.onClick() !== false) close();
        } else {
          close();
        }
      });
    });
    // ESC 关闭
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    return { close: close };
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ───────────────────────────────────────────
     3. Footer 链接内容（信息弹窗）
     ─────────────────────────────────────────── */
  var FOOTER_CONTENT = {
    'about': {
      title: '关于灵感坊',
      body: '<p>灵感坊是一个 AI 对话创意共享平台，致力于让每一次 AI 对话的价值不再随窗口关闭而消失。</p><p style="margin-top:12px;">在这里，你可以发现全球创作者分享的优质 AI 对话，基于任何对话进行接力创作，系统化管理你的 AI 对话资产。</p><p style="margin-top:12px;color:#9CA3AF;font-size:12px;">已有 50,000+ 创作者加入。</p>'
    },
    'privacy': {
      title: '隐私政策',
      body: '<p>我们尊重并保护每一位用户的隐私：</p><ul style="margin:12px 0;padding-left:20px;line-height:1.8;"><li>仅收集为提供服务所必需的最少信息</li><li>不会在未经你同意的情况下向第三方共享你的个人数据</li><li>你可随时查看、修改或删除你的个人信息</li><li>采用加密传输与存储保障数据安全</li></ul><p style="color:#9CA3AF;font-size:12px;">本页为演示内容，详细政策以正式版为准。</p>'
    },
    'terms': {
      title: '使用条款',
      body: '<p>使用灵感坊即表示你同意以下条款：</p><ul style="margin:12px 0;padding-left:20px;line-height:1.8;"><li>分享的内容须为原创或已获授权</li><li>禁止发布违法、侵权或有害信息</li><li>尊重其他创作者的劳动成果</li><li>平台保留对违规内容进行处理的权利</li></ul><p style="color:#9CA3AF;font-size:12px;">本页为演示内容，完整条款以正式版为准。</p>'
    },
    'help': {
      title: '帮助中心',
      body: '<p>常见问题与使用指引：</p><ul style="margin:12px 0;padding-left:20px;line-height:1.8;"><li><strong>如何分享对话？</strong> 点击右上角"开始分享"进入创作空间</li><li><strong>如何接力创作？</strong> 在对话详情页点击"开始接力"即可基于原文继续</li><li><strong>如何管理我的内容？</strong> 进入"创作者中心"查看分享、点赞与草稿</li><li><strong>如何搜索？</strong> 在"发现"页使用搜索框或分类筛选</li></ul>'
    },
    'guide': {
      title: '使用指南',
      body: '<p>三步开启你的 AI 灵感之旅：</p><ol style="margin:12px 0;padding-left:20px;line-height:1.8;"><li>分享你的 AI 对话，或直接在平台创建</li><li>在"发现"页按分类浏览、搜索优质内容</li><li>点击"开始接力"在优质对话基础上二次创作</li></ol><p style="margin-top:12px;color:#9CA3AF;font-size:12px;">详细图文教程即将上线。</p>'
    },
    'contact': {
      title: '联系我们',
      body: '<p>有任何问题或合作意向，欢迎通过以下方式联系：</p><ul style="margin:12px 0;padding-left:20px;line-height:1.8;"><li>邮箱：hello@inspirationhub.demo</li><li>客服时间：工作日 9:00–18:00</li><li>反馈渠道：在任意页面提交你的建议</li></ul>'
    },
    'community': {
      title: '社区规范',
      body: '<p>我们希望打造一个友善、有价值的创作者社区：</p><ul style="margin:12px 0;padding-left:20px;line-height:1.8;"><li>友善交流，尊重不同观点</li><li>鼓励原创，反对抄袭与搬运</li><li>分享有实质价值的内容，避免低质量灌水</li><li>积极互动，为优质内容点赞与接力</li></ul>'
    },
    'ranking': {
      title: '排行榜',
      body: '<p>排行榜功能正在开发中，即将上线：</p><ul style="margin:12px 0;padding-left:20px;line-height:1.8;"><li>本周热门对话 TOP 100</li><li>月度优秀创作者榜单</li><li>最受接力对话排行</li></ul><p style="margin-top:12px;color:#9CA3AF;font-size:12px;">敬请期待。</p>'
    }
  };

  /* ───────────────────────────────────────────
     4. Footer 链接拦截
     ─────────────────────────────────────────── */
  InspiroHub.initFooterLinks = function () {
    document.querySelectorAll('[data-footer-link]').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var key = el.getAttribute('data-footer-link');
        var content = FOOTER_CONTENT[key];
        if (content) {
          InspiroHub.modal({ title: content.title, body: content.body, actions: [{ label: '知道了', primary: true }] });
        } else {
          InspiroHub.toast('该功能正在开发中');
        }
      });
    });
  };

  /* ───────────────────────────────────────────
     5. 返回顶部按钮（自动注入）
     ─────────────────────────────────────────── */
  InspiroHub.initBackToTop = function () {
    if (document.getElementById('app-back-top')) return;
    var primary = v('--color-primary') || '#10B981';
    var btn = document.createElement('button');
    btn.id = 'app-back-top';
    btn.setAttribute('aria-label', '返回顶部');
    btn.style.cssText = [
      'position:fixed', 'right:24px', 'bottom:24px', 'width:44px', 'height:44px',
      'border-radius:50%', 'background:' + primary, 'color:#fff', 'border:none',
      'cursor:pointer', 'z-index:900', 'display:flex', 'align-items:center', 'justify-content:center',
      'box-shadow:0 4px 16px rgba(16,185,129,0.3)', 'opacity:0', 'pointer-events:none',
      'transition:opacity 250ms ease, transform 250ms ease', 'transform:translateY(8px)'
    ].join(';');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    btn.addEventListener('mouseenter', function () { btn.style.transform = 'translateY(0) scale(1.08)'; });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = window.scrollY > 400 ? 'translateY(0) scale(1)' : 'translateY(8px) scale(1)';
    });

    window.addEventListener('scroll', function () {
      var show = window.scrollY > 400;
      btn.style.opacity = show ? '1' : '0';
      btn.style.pointerEvents = show ? 'auto' : 'none';
      btn.style.transform = show ? 'translateY(0) scale(1)' : 'translateY(8px) scale(1)';
    }, { passive: true });
  };

  /* ───────────────────────────────────────────
     6. 平滑锚点滚动（用于 index.html 的"了解更多"）
     ─────────────────────────────────────────── */
  InspiroHub.initSmoothAnchor = function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      a.addEventListener('click', function (e) {
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  /* ───────────────────────────────────────────
     7. 自定义下拉框组件（替换原生 select，统一样式）
     用法：给 <select> 加 class="custom-select"，
           InspiroHub.enhanceSelects() 会原地增强
     ─────────────────────────────────────────── */
  var _csStyleInjected = false;
  function injectCustomSelectStyle() {
    if (_csStyleInjected) return;
    _csStyleInjected = true;
    var css = document.createElement('style');
    css.textContent = [
      '.cs-wrap{position:relative;display:inline-block}',
      '.cs-trigger{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;cursor:pointer;background:#fff;border:1px solid var(--color-border,#E5E7EB);color:var(--color-text-secondary,#6B7280);padding:6px 12px;border-radius:9999px;outline:none;transition:border-color 150ms ease,box-shadow 150ms ease;white-space:nowrap}',
      '.cs-trigger:hover{border-color:#D1D5DB}',
      '.cs-trigger.open{border-color:var(--color-primary,#10B981);box-shadow:0 0 0 3px rgba(16,185,129,0.15)}',
      '.cs-trigger .cs-label{pointer-events:none}',
      '.cs-trigger .cs-arrow{transition:transform 200ms ease;flex-shrink:0}',
      '.cs-trigger.open .cs-arrow{transform:rotate(180deg)}',
      '.cs-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:100%;background:#fff;border:1px solid var(--color-border,#E5E7EB);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.12);padding:6px;z-index:9000;opacity:0;transform:translateY(-6px) scale(0.98);pointer-events:none;transition:opacity 180ms ease,transform 180ms ease;transform-origin:top right;max-height:280px;overflow-y:auto}',
      '.cs-menu.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}',
      '.cs-option{padding:8px 12px;border-radius:8px;font-size:13px;color:var(--color-text-secondary,#6B7280);cursor:pointer;transition:background 120ms ease,color 120ms ease;white-space:nowrap;display:flex;align-items:center;gap:8px}',
      '.cs-option:hover{background:var(--color-primary-50,#ECFDF5);color:var(--color-primary-700,#047857)}',
      '.cs-option.active{color:var(--color-primary,#10B981);font-weight:600;background:var(--color-primary-50,#ECFDF5)}',
      '.cs-option .cs-check{opacity:0;flex-shrink:0}',
      '.cs-option.active .cs-check{opacity:1}',
      '.cs-menu::-webkit-scrollbar{width:6px}',
      '.cs-menu::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:9999px}',
      '.cs-wrap.cs-rect .cs-trigger{border-radius:8px;padding:6px 30px 6px 12px;position:relative}',
      '.cs-wrap.cs-rect .cs-trigger .cs-arrow{position:absolute;right:10px;top:50%;transform:translateY(-50%)}',
      '.cs-wrap.cs-rect .cs-trigger.open .cs-arrow{transform:translateY(-50%) rotate(180deg)}'
    ].join('\n');
    document.head.appendChild(css);
  }

  InspiroHub.enhanceSelects = function (root) {
    root = root || document;
    var selects = root.querySelectorAll('select.custom-select');
    if (!selects.length) return;
    injectCustomSelectStyle();

    // 关闭所有打开的菜单（除指定外）
    function closeAllMenus(except) {
      document.querySelectorAll('.cs-wrap').forEach(function (wrap) {
        if (wrap !== except) {
          var trig = wrap.querySelector('.cs-trigger');
          var menu = wrap.querySelector('.cs-menu');
          if (trig) trig.classList.remove('open');
          if (menu) menu.classList.remove('open');
        }
      });
    }

    selects.forEach(function (sel) {
      // 避免重复增强
      if (sel.dataset.enhanced === '1') return;
      sel.dataset.enhanced = '1';

      var options = Array.from(sel.querySelectorAll('option'));
      var selectedVal = sel.value || options[0].value;

      var wrap = document.createElement('div');
      wrap.className = 'cs-wrap' + (sel.dataset.csRect === '1' ? ' cs-rect' : '');
      wrap.style.width = sel.style.width || '';

      var trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'cs-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');

      var label = document.createElement('span');
      label.className = 'cs-label';
      trigger.appendChild(label);

      var arrowSvg = '<svg class="cs-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
      trigger.insertAdjacentHTML('beforeend', arrowSvg);

      var menu = document.createElement('div');
      menu.className = 'cs-menu';
      menu.setAttribute('role', 'listbox');

      var checkSvg = '<svg class="cs-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

      function updateLabel(val) {
        var opt = options.find(function (o) { return o.value === val; });
        if (opt) label.textContent = opt.textContent;
      }

      options.forEach(function (opt) {
        var item = document.createElement('div');
        item.className = 'cs-option' + (opt.value === selectedVal ? ' active' : '');
        item.setAttribute('role', 'option');
        item.dataset.value = opt.value;
        item.innerHTML = '<span>' + escapeHtml(opt.textContent) + '</span>' + checkSvg;
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          selectedVal = opt.value;
          sel.value = selectedVal;
          updateLabel(selectedVal);
          menu.querySelectorAll('.cs-option').forEach(function (o) { o.classList.remove('active'); });
          item.classList.add('active');
          closeMenu();
          // 触发原生 change 事件
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        });
        menu.appendChild(item);
      });

      updateLabel(selectedVal);

      function openMenu() {
        closeAllMenus(wrap);
        trigger.classList.add('open');
        menu.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      function closeMenu() {
        trigger.classList.remove('open');
        menu.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      function toggleMenu() {
        if (trigger.classList.contains('open')) closeMenu(); else openMenu();
      }

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
      });

      wrap.appendChild(trigger);
      wrap.appendChild(menu);
      sel.style.display = 'none';
      sel.parentNode.insertBefore(wrap, sel.nextSibling);

      // 外部点击关闭
      document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target)) closeMenu();
      });
      // ESC 关闭
      wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
    });
  };

  /* ───────────────────────────────────────────
     8. 一键初始化
     ─────────────────────────────────────────── */
  InspiroHub.init = function () {
    InspiroHub.initBaseStyles();
    InspiroHub.initFooterLinks();
    InspiroHub.initBackToTop();
    InspiroHub.initSmoothAnchor();
    InspiroHub.enhanceSelects();
  };

  // DOMContentLoaded 自动初始化（页面也可手动调用）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', InspiroHub.init);
  } else {
    InspiroHub.init();
  }

  window.InspiroHub = InspiroHub;
})(window, document);
