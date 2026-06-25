/*!
 * 共创显影 CoCreate Mirror · 协作显影卡
 * -----------------------------------------------------------
 * 对外接口（挂载到 window.CCCard）：
 *   CCCard.build(data)            → 构建显影卡 DOM 元素（800×800）
 *   CCCard.exportCard(el, name)   → 导出 PNG（按需加载 html2canvas）
 *   CCCard.showToast(msg)         → 轻提示 toast
 *
 * 依赖：html2canvas 1.4.1（仅在调用 exportCard 时动态注入）
 */
(function (global) {
  'use strict';

  /* ============================================================
   *  节点类型映射（与 timeline.js 保持一致）
   * ============================================================ */
  var TYPE_META = {
    propose:  { label: '提案', abbr: 'P', color: '#3B6CB5' },
    feedback: { label: '反馈', abbr: 'F', color: '#7C8DB5' },
    reflect:  { label: '反思', abbr: 'R', color: '#E8913A' },
    adjust:   { label: '调整', abbr: 'A', color: '#6AAD8E' },
    ship:     { label: '落地', abbr: 'S', color: '#3B6CB5', ring: true }
  };

  var STYLE_ID = 'cocreate-card-styles';

  /* ============================================================
   *  小工具
   * ============================================================ */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ============================================================
   *  注入卡片样式（全局唯一一次）
   * ============================================================ */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CARD_CSS;
    document.head.appendChild(el);
  }

  /* ============================================================
   *  构建缩略时间轴 HTML
   * ============================================================ */
  function buildMiniTimeline(timeline) {
    if (!timeline.length) return '';
    var parts = [];
    timeline.forEach(function (node, i) {
      var t = TYPE_META[node.type] || TYPE_META.propose;
      var isKey = !!node.isKeyMoment;
      var isShip = node.type === 'ship';
      var dotCls = 'sc-tl-dot';
      if (isKey) dotCls += ' sc-tl-dot--key';
      if (isShip) dotCls += ' sc-tl-dot--ship';

      parts.push(
        '<div class="sc-tl-node">' +
          '<span class="' + dotCls + '" style="--c:' + t.color + '"></span>' +
          '<span class="sc-tl-abbr" style="--c:' + t.color + '">' + t.abbr + '</span>' +
        '</div>'
      );
      if (i < timeline.length - 1) {
        parts.push('<span class="sc-tl-line"></span>');
      }
    });
    return '<div class="sc-tl">' + parts.join('') + '</div>';
  }

  /* ============================================================
   *  构建完整显影卡 DOM
   *  数据来源：sample.json 的 meta + timeline
   * ============================================================ */
  function buildShareCard(data) {
    injectStyles();

    var meta = (data && data.meta) || {};
    var stats = meta.stats || {};
    var timeline = Array.isArray(data && data.timeline) ? data.timeline : [];

    /* —— 取第一个 isKeyMoment 节点的 moment（最显著转折）—— */
    var keyMoment = '';
    for (var i = 0; i < timeline.length; i++) {
      if (timeline[i].isKeyMoment && timeline[i].moment) {
        keyMoment = timeline[i].moment;
        break;
      }
    }

    /* —— 统计行 —— */
    var statsParts = [];
    if (stats.rounds != null)            statsParts.push(stats.rounds + ' 轮');
    if (stats.proposalsRejected != null) statsParts.push(stats.proposalsRejected + ' 个被打回方向');
    if (stats.keyTurningPoints != null)  statsParts.push(stats.keyTurningPoints + ' 个关键转折');
    var statsLine = statsParts.join(' · ');

    var card = document.createElement('div');
    card.className = 'sc-card';
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', '协作显影卡：' + (meta.title || ''));
    card.innerHTML =
      '<div class="sc-logo">' +
        '<span class="sc-logo-icon">☉</span>' +
        '<span class="sc-logo-cn">共创显影</span>' +
        '<span class="sc-logo-sep">·</span>' +
        '<span class="sc-logo-en">CoCreate Mirror</span>' +
      '</div>' +
      '<h1 class="sc-title">' + escapeHtml(meta.title || '未命名样本') + '</h1>' +
      '<p class="sc-subtitle">' + escapeHtml(meta.subtitle || '') + '</p>' +
      '<div class="sc-divider"></div>' +
      '<p class="sc-stats">' + escapeHtml(statsLine) + '</p>' +
      buildMiniTimeline(timeline) +
      '<div class="sc-divider"></div>' +
      '<div class="sc-moment-label">⚡ 最关键的那一刻</div>' +
      '<div class="sc-moment-quote">"' + escapeHtml(keyMoment) + '"</div>' +
      '<div class="sc-divider sc-divider--push"></div>' +
      '<p class="sc-slogan">把每一次人 × AI 协作<br>变成可回溯的「显影线」</p>' +
      '<div class="sc-watermark">Made with TRAE · 共创显影</div>';
    return card;
  }

  /* ============================================================
   *  html2canvas 按需加载（动态 script 注入）
   * ============================================================ */
  var h2cPromise = null;

  function loadHtml2Canvas() {
    if (h2cPromise) return h2cPromise;
    if (global.html2canvas) {
      h2cPromise = Promise.resolve(global.html2canvas);
      return h2cPromise;
    }
    h2cPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = function () { resolve(global.html2canvas); };
      s.onerror = function () {
        h2cPromise = null; /* 允许后续重试 */
        reject(new Error('html2canvas 加载失败'));
      };
      document.head.appendChild(s);
    });
    return h2cPromise;
  }

  /* ============================================================
   *  导出 PNG
   *  scale: 2  →  实际输出 1600×1600
   * ============================================================ */
  function exportCard(cardEl, filename) {
    /* 确保字体已加载，避免 html2canvas 渲染时缺字 */
    var fontReady = (global.document && document.fonts && document.fonts.ready)
      ? document.fonts.ready
      : Promise.resolve();

    return fontReady
      .then(function () { return loadHtml2Canvas(); })
      .then(function (h2c) {
        return h2c(cardEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false
        });
      })
      .then(function (canvas) {
        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('toBlob 失败')); return; }
            triggerDownload(blob, filename || 'cocreate-card.png');
            resolve();
          }, 'image/png');
        });
      });
  }

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  /* ============================================================
   *  Toast 轻提示
   * ============================================================ */
  function showToast(msg) {
    var t = document.getElementById('cc-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cc-toast';
      t.className = 'cc-toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('cc-toast--show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () {
      t.classList.remove('cc-toast--show');
    }, 2600);
  }

  /* ============================================================
   *  卡片 CSS（800×800 固定画布）
   * ============================================================ */
  var CARD_CSS = [
    '/* —— 显影卡画布 —— */',
    '.sc-card {',
    '  width: 800px; height: 800px;',
    '  background: #FFFFFF;',
    '  border: 1px solid #E5E8EE;',
    '  border-radius: 16px;',
    '  padding: 48px 56px;',
    '  display: flex; flex-direction: column;',
    '  font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont,',
    '               "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;',
    '  color: #1D2939;',
    '  box-sizing: border-box;',
    '  position: relative; overflow: hidden;',
    '  flex-shrink: 0;',
    '  line-height: 1.5;',
    '}',
    '',
    '/* —— Logo 行 —— */',
    '.sc-logo {',
    '  display: flex; align-items: center; gap: 6px;',
    '  font-size: 15px; font-weight: 500;',
    '  margin-bottom: 32px;',
    '}',
    '.sc-logo-icon { font-size: 20px; color: #3B6CB5; line-height: 1; }',
    '.sc-logo-cn  { color: #1D2939; letter-spacing: 0.02em; }',
    '.sc-logo-sep { color: #C0C7D2; margin: 0 1px; }',
    '.sc-logo-en  { color: #6B7A90; font-weight: 400; font-size: 14px; }',
    '',
    '/* —— 主标题 —— */',
    '.sc-title {',
    '  font-size: 30px; font-weight: 600; line-height: 1.35;',
    '  color: #1D2939; margin-bottom: 10px;',
    '  letter-spacing: -0.01em;',
    '}',
    '',
    '/* —— 副标题 —— */',
    '.sc-subtitle { font-size: 14px; color: #6B7A90; line-height: 1.5; }',
    '',
    '/* —— 分割线 —— */',
    '.sc-divider { height: 1px; background: #E5E8EE; margin: 24px 0; border: none; }',
    '.sc-divider--push { margin-top: auto; }',
    '',
    '/* —— 统计行 —— */',
    '.sc-stats { font-size: 13px; color: #6B7A90; letter-spacing: 0.02em; }',
    '',
    '/* —— 缩略时间轴 —— */',
    '.sc-tl {',
    '  display: flex; align-items: flex-start; justify-content: center;',
    '  margin-top: 18px; padding: 0 4px;',
    '}',
    '.sc-tl-node {',
    '  display: flex; flex-direction: column; align-items: center;',
    '  gap: 8px; flex-shrink: 0; position: relative; z-index: 1;',
    '}',
    '.sc-tl-dot {',
    '  width: 12px; height: 12px; border-radius: 50%;',
    '  background: var(--c, #3B6CB5);',
    '}',
    '.sc-tl-dot--key {',
    '  box-shadow: 0 0 0 4px rgba(232, 145, 58, 0.2);',
    '}',
    '.sc-tl-dot--ship {',
    '  box-shadow: inset 0 0 0 2px #FFFFFF, 0 0 0 2px var(--c, #3B6CB5);',
    '}',
    '.sc-tl-abbr {',
    '  font-size: 11px; font-weight: 600;',
    '  color: var(--c, #6B7A90); letter-spacing: 0.05em; line-height: 1;',
    '}',
    '.sc-tl-line {',
    '  flex: 1 1 0; height: 2px; background: #E5E8EE;',
    '  margin-top: 5px; min-width: 16px;',
    '}',
    '',
    '/* —— 关键 moment —— */',
    '.sc-moment-label {',
    '  font-size: 14px; font-weight: 600; color: #E8913A;',
    '  margin-bottom: 14px; letter-spacing: 0.02em;',
    '}',
    '.sc-moment-quote {',
    '  border-left: 3px solid #E8913A;',
    '  padding-left: 16px;',
    '  font-size: 24px; font-weight: 500; font-style: italic;',
    '  line-height: 1.5; color: #1D2939;',
    '}',
    '',
    '/* —— Slogan —— */',
    '.sc-slogan { font-size: 16px; color: #6B7A90; line-height: 1.65; }',
    '',
    '/* —— Watermark —— */',
    '.sc-watermark {',
    '  margin-top: 20px;',
    '  font-size: 11px; color: #C0C7D2;',
    '  text-align: left; letter-spacing: 0.03em;',
    '}',
    '',
    '/* —— Toast —— */',
    '.cc-toast {',
    '  position: fixed; bottom: 32px; left: 50%;',
    '  transform: translateX(-50%) translateY(20px);',
    '  background: #1D2939; color: #fff;',
    '  padding: 10px 22px; border-radius: 10px;',
    '  font-size: 0.88rem; opacity: 0; pointer-events: none;',
    '  transition: opacity .2s, transform .2s; z-index: 9999;',
    '  font-family: "Noto Sans SC", -apple-system, sans-serif;',
    '}',
    '.cc-toast--show { opacity: 1; transform: translateX(-50%) translateY(0); }'
  ].join('\n');

  /* ============================================================
   *  挂载到全局
   * ============================================================ */
  global.CCCard = {
    build: buildShareCard,
    exportCard: exportCard,
    showToast: showToast
  };
})(window);
