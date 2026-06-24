/*!
 * 共创显影 CoCreate Mirror · replay 时间轴渲染
 * 纯 Vanilla JS，无第三方依赖
 * 依赖：assets/styles.css 中的设计 token（CSS 变量）
 */
(function () {
  'use strict';

  /* ============================================================
   *  元信息映射：type / speaker → 文案、缩写、颜色
   * ============================================================ */
  var TYPE_META = {
    propose:  { label: '提案', abbr: 'P', color: '#3B6CB5' },
    feedback: { label: '反馈', abbr: 'F', color: '#7C8DB5' },
    reflect:  { label: '反思', abbr: 'R', color: '#E8913A' },
    adjust:   { label: '调整', abbr: 'A', color: '#6AAD8E' },
    ship:     { label: '落地', abbr: 'S', color: '#3B6CB5', ring: true }
  };

  var SPEAKER_META = {
    human: { label: '人',   cls: 'speaker--human' },
    ai:    { label: 'AI',   cls: 'speaker--ai' },
    both:  { label: '共创', cls: 'speaker--both' }
  };

  /* ============================================================
   *  状态
   * ============================================================ */
  var state = { data: null, timeline: [], currentIndex: 0 };

  /* ============================================================
   *  小工具
   * ============================================================ */
  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ============================================================
   *  入口
   * ============================================================ */
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    setupShare();
    var data = await loadData();
    if (!data) return; // 错误已展示
    state.data = data;
    state.timeline = Array.isArray(data.timeline) ? data.timeline : [];
    renderMeta(data.meta || {});
    renderTimeline();
    renderInsights(Array.isArray(data.insights) ? data.insights : []);
    if (state.timeline.length) selectNode(0, false);
  }

  /* ============================================================
   *  数据加载 + 错误处理
   * ============================================================ */
  async function loadData() {
    try {
      var res = await fetch('assets/sample.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (!data || !Array.isArray(data.timeline)) {
        throw new Error('数据格式不正确：缺少 timeline 字段');
      }
      return data;
    } catch (err) {
      showError(err);
      return null;
    }
  }

  function showError(err) {
    var root = $('replay-root');
    if (!root) return;
    root.innerHTML =
      '<div class="error-box">' +
        '<div class="error-box__icon" aria-hidden="true">⚠</div>' +
        '<h3 class="error-box__title">样本数据加载失败</h3>' +
        '<p class="error-box__desc">无法读取 <code>assets/sample.json</code>，请确认文件存在且 JSON 格式正确。</p>' +
        '<p class="error-box__detail">' + escapeHtml(err.message || String(err)) + '</p>' +
        '<a class="btn btn-secondary" href="index.html">← 返回首页</a>' +
      '</div>';
  }

  /* ============================================================
   *  渲染：meta（标题 / 副标题 / 上下文 / 统计）
   * ============================================================ */
  function renderMeta(meta) {
    $('sample-title').textContent = meta.title || '未命名样本';
    $('sample-subtitle').textContent = meta.subtitle || '';
    if ($('sample-context')) $('sample-context').textContent = meta.context || '';

    var s = meta.stats || {};
    var items = [
      { value: s.rounds,            label: '轮对话' },
      { value: s.proposalsRejected, label: '被打回方向' },
      { value: s.keyTurningPoints,  label: '关键转折点' },
      { value: s.finalOutcome,      label: '最终成果', isText: true }
    ].filter(function (it) {
      return it.value !== undefined && it.value !== null && it.value !== '';
    });

    $('sample-stats').innerHTML = items.map(function (it) {
      return '<div class="stat">' +
        '<div class="stat__value' + (it.isText ? ' stat__value--text' : '') + '">' +
          escapeHtml(String(it.value)) + '</div>' +
        '<div class="stat__label">' + escapeHtml(it.label) + '</div>' +
      '</div>';
    }).join('');
  }

  /* ============================================================
   *  渲染：横向时间轴
   * ============================================================ */
  function renderTimeline() {
    var track = $('tl-track');
    track.innerHTML = '';

    state.timeline.forEach(function (node, i) {
      var t = TYPE_META[node.type] || TYPE_META.propose;
      var isKey = !!node.isKeyMoment;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tl-node' +
        (isKey ? ' tl-node--key' : '') +
        (node.type === 'ship' ? ' tl-node--ship' : '');
      btn.dataset.index = String(i);
      btn.style.setProperty('--node-color', t.color);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('aria-label',
        '第 ' + (i + 1) + ' 轮 · ' + t.label + '：' + (node.title || ''));

      btn.innerHTML =
        '<span class="tl-node__num">' + (i + 1) + '</span>' +
        '<span class="tl-node__dotwrap"><span class="tl-node__dot"></span></span>' +
        '<span class="tl-node__abbr">' + t.abbr + '</span>' +
        '<span class="tl-node__title">' + escapeHtml(node.title || '') + '</span>' +
        '<span class="tl-node__tooltip" role="tooltip">' + escapeHtml(node.title || '') + '</span>';

      btn.addEventListener('click', function () { selectNode(i, true); });
      track.appendChild(btn);
    });

    track.addEventListener('keydown', onTrackKeydown);
  }

  /* 键盘 ← → 在节点间切换 */
  function onTrackKeydown(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var idx = state.currentIndex;
    if (e.key === 'ArrowLeft')  idx = Math.max(0, idx - 1);
    else                        idx = Math.min(state.timeline.length - 1, idx + 1);
    if (idx !== state.currentIndex) {
      e.preventDefault();
      selectNode(idx, true);
      var nodes = document.querySelectorAll('.tl-node');
      if (nodes[idx]) nodes[idx].focus();
    }
  }

  function selectNode(i, scroll) {
    state.currentIndex = i;
    var nodes = document.querySelectorAll('.tl-node');
    nodes.forEach(function (n, idx) {
      var active = idx === i;
      n.classList.toggle('tl-node--active', active);
      n.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    renderDetail(state.timeline[i], i);

    // 移动端：点击节点后滚动到详情面板
    if (scroll && window.matchMedia('(max-width: 640px)').matches) {
      var panel = $('detail-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ============================================================
   *  渲染：节点详情面板
   * ============================================================ */
  function renderDetail(node, i) {
    var panel = $('detail-panel');
    if (!node) { panel.innerHTML = ''; return; }

    var t = TYPE_META[node.type] || TYPE_META.propose;
    var sp = SPEAKER_META[node.speaker] || SPEAKER_META.ai;
    var isKey = !!node.isKeyMoment;
    var tags = Array.isArray(node.tags) ? node.tags : [];
    var total = state.timeline.length;
    var atFirst = i <= 0;
    var atLast = i >= total - 1;

    panel.innerHTML =
      '<div class="detail__top">' +
        '<div class="detail__labels">' +
          '<span class="badge badge--type" style="--node-color:' + t.color + '">' + t.label + '</span>' +
          '<span class="badge badge--round">第 ' + (i + 1) + ' 轮</span>' +
          '<span class="badge badge--speaker ' + sp.cls + '">' + sp.label + '</span>' +
        '</div>' +
        '<div class="detail__nav">' +
          '<button type="button" class="detail__nav-btn" id="prev-btn"' + (atFirst ? ' disabled' : '') + '>← 上一轮</button>' +
          '<span class="detail__nav-pos">' + (i + 1) + ' / ' + total + '</span>' +
          '<button type="button" class="detail__nav-btn" id="next-btn"' + (atLast ? ' disabled' : '') + '>下一轮 →</button>' +
        '</div>' +
      '</div>' +
      '<h2 class="detail__title">' + escapeHtml(node.title || '') + '</h2>' +
      '<p class="detail__summary">' + escapeHtml(node.summary || '') + '</p>' +
      (isKey ?
        '<div class="detail__moment">' +
          '<span class="moment-tag">关键转折</span>' +
          '<p class="detail__moment-text">' + escapeHtml(node.moment || '') + '</p>' +
        '</div>' : '') +
      '<div class="detail__content-wrap">' +
        '<div class="detail__content" id="detail-content" data-collapsed="true">' +
          escapeHtml(node.content || '') +
        '</div>' +
        '<button type="button" class="detail__toggle" id="detail-toggle" aria-expanded="false" aria-controls="detail-content">' +
          '<span class="detail__toggle-text">展开完整对话</span>' +
          '<span class="detail__toggle-icon" aria-hidden="true">▾</span>' +
        '</button>' +
      '</div>' +
      (tags.length ?
        '<div class="detail__tags">' + tags.map(function (tg) {
          return '<span class="tag">' + escapeHtml(tg) + '</span>';
        }).join('') + '</div>' : '');

    // 折叠 / 展开完整对话
    var toggle = $('detail-toggle');
    var content = $('detail-content');
    if (toggle && content) {
      toggle.addEventListener('click', function () {
        var collapsed = content.getAttribute('data-collapsed') === 'true';
        content.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
        toggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
        toggle.querySelector('.detail__toggle-text').textContent = collapsed ? '收起对话' : '展开完整对话';
        toggle.querySelector('.detail__toggle-icon').textContent = collapsed ? '▴' : '▾';
      });
    }

    // 上一轮 / 下一轮
    var prev = $('prev-btn');
    var next = $('next-btn');
    if (prev) prev.addEventListener('click', function () {
      if (state.currentIndex > 0) selectNode(state.currentIndex - 1, true);
    });
    if (next) next.addEventListener('click', function () {
      if (state.currentIndex < total - 1) selectNode(state.currentIndex + 1, true);
    });
  }

  /* ============================================================
   *  渲染：底部洞察卡片
   * ============================================================ */
  function renderInsights(insights) {
    var wrap = $('insights-grid');
    if (!insights.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = insights.map(function (it, i) {
      return '<article class="insight-card">' +
        '<div class="insight-card__num">' + String(i + 1).padStart(2, '0') + '</div>' +
        '<h3 class="insight-card__title">' + escapeHtml(it.title || '') + '</h3>' +
        '<p class="insight-card__body">' + escapeHtml(it.body || '') + '</p>' +
      '</article>';
    }).join('');
  }

  /* ============================================================
   *  分享按钮 → 弹出显影卡模态层
   * ============================================================ */
  function setupShare() {
    var btn = $('share-btn');
    if (!btn) return;

    var modal = $('share-modal');
    var mount = $('modal-card-mount');
    var downloadBtn = $('modal-download-btn');
    var cardEl = null;

    /* —— 打开模态 —— */
    function openModal() {
      if (!state.data) { showToast('数据尚未加载完成'); return; }

      /* 构建卡片并插入 */
      cardEl = CCCard.build(state.data);
      mount.innerHTML = '';
      mount.appendChild(cardEl);

      modal.classList.add('share-modal--open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      /* 焦点管理 */
      if (downloadBtn) downloadBtn.focus();
    }

    /* —— 关闭模态 —— */
    function closeModal() {
      modal.classList.remove('share-modal--open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      btn.focus();
    }

    /* —— 分享按钮点击 —— */
    btn.addEventListener('click', openModal);

    /* —— 背景点击 / 取消按钮关闭 —— */
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-share-close')) closeModal();
    });

    /* —— ESC 键关闭 —— */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('share-modal--open')) {
        closeModal();
      }
    });

    /* —— 下载 PNG —— */
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        if (!cardEl) return;
        var orig = downloadBtn.textContent;
        downloadBtn.disabled = true;
        downloadBtn.textContent = '导出中…';

        CCCard.exportCard(cardEl, '共创显影卡.png')
          .then(function () {
            CCCard.showToast('已保存到本地');
          })
          .catch(function () {
            CCCard.showToast('导出失败，请重试或截屏保存');
          })
          .then(function () {
            downloadBtn.disabled = false;
            downloadBtn.textContent = orig;
          });
      });
    }
  }

  function showToast(msg) {
    var t = $('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('toast--show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('toast--show'); }, 2200);
  }
})();
