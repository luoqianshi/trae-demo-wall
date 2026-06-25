/*!
 * 共创显影 CoCreate Mirror · insights 深度阅读渲染
 * 纯 Vanilla JS，无第三方依赖
 * 依赖：assets/styles.css 中的设计 token（CSS 变量）
 *
 * 职责：
 *  1. fetch assets/sample.json，读取 insights + timeline
 *  2. 把每条洞察渲染为「长读」section（大序号 / 标题 / 首字下沉正文 / 引文）
 *  3. 按固定映射把 timeline 节点作为引文附在洞察右下角
 *  4. Hero「开始阅读」平滑滚动 + 顶部阅读进度条
 */
(function () {
  'use strict';

  /* ============================================================
   *  引文映射：insights[i] → timeline 索引
   *  - 洞察 0 → timeline[1]（第 2 轮，人对 AI 提案的反馈）
   *  - 洞察 1 → timeline[4]（第 5 轮，AI 承认局限的反思）
   *  - 洞察 2 → timeline[6]（第 7 轮，AI 把限制转化为定位）
   *  - 洞察 3 → timeline[7]（第 8 轮，共同落定）
   *  超出映射范围的洞察（容错）引文留空。
   * ============================================================ */
  var QUOTE_MAP = [1, 4, 6, 7];

  var SPEAKER_LABEL = {
    human: '人',
    ai: 'AI',
    both: '共创'
  };

  /* 引文正文最大字数 */
  var QUOTE_MAX_LEN = 80;

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

  /* 超长截断 + 省略号 */
  function truncate(s, n) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  /* ============================================================
   *  入口
   * ============================================================ */
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    setupShare();
    setupStartReading();
    var data = await loadData();
    if (!data) return; // 错误已展示
    var insights = Array.isArray(data.insights) ? data.insights : [];
    var timeline = Array.isArray(data.timeline) ? data.timeline : [];
    renderHeroCount(insights.length);
    renderInsights(insights, timeline);
    setupProgress();
  }

  /* ============================================================
   *  数据加载 + 错误处理
   * ============================================================ */
  async function loadData() {
    try {
      var res = await fetch('assets/sample.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (!data || !Array.isArray(data.insights)) {
        throw new Error('数据格式不正确：缺少 insights 字段');
      }
      return data;
    } catch (err) {
      showError(err);
      return null;
    }
  }

  function showError(err) {
    var list = $('insights-list');
    if (!list) return;
    list.innerHTML =
      '<div class="error-box">' +
        '<div class="error-box__icon" aria-hidden="true">⚠</div>' +
        '<h3 class="error-box__title">洞察数据加载失败</h3>' +
        '<p class="error-box__desc">无法读取 <code>assets/sample.json</code>，请确认文件存在且 JSON 格式正确。</p>' +
        '<p class="error-box__detail">' + escapeHtml(err.message || String(err)) + '</p>' +
        '<a class="btn btn-secondary" href="index.html">← 返回首页</a>' +
      '</div>';
  }

  /* ============================================================
   *  Hero 计数（自动适配洞察数量）
   * ============================================================ */
  function renderHeroCount(n) {
    if ($('hero-count'))   $('hero-count').textContent   = String(n);
    if ($('hero-count-2')) $('hero-count-2').textContent = String(n);
  }

  /* ============================================================
   *  渲染洞察主体
   * ============================================================ */
  function renderInsights(insights, timeline) {
    var list = $('insights-list');
    list.innerHTML = '';

    insights.forEach(function (it, i) {
      var section = document.createElement('section');
      section.className = 'insight';
      section.id = 'insight-' + i;
      section.setAttribute('aria-label', '洞察 ' + (i + 1));

      var num = String(i + 1).padStart(2, '0');
      var bodyHtml = renderBody(it.body);
      var quoteHtml = renderQuote(i, timeline);

      section.innerHTML =
        '<div class="insight__inner">' +
          '<div class="insight__num" aria-hidden="true">' + num + '</div>' +
          '<h2 class="insight__title">' + escapeHtml(it.title || '') + '</h2>' +
          '<div class="insight__body">' + bodyHtml + '</div>' +
          quoteHtml +
        '</div>';

      list.appendChild(section);
    });
  }

  /* 正文增强：首段抽出来加首字下沉 + 稍大字号；后续段落正常 */
  function renderBody(body) {
    var paras = String(body || '').split(/\n+/).map(function (p) {
      return p.trim();
    }).filter(Boolean);
    if (!paras.length) return '';

    var html = renderLead(paras[0]);
    for (var i = 1; i < paras.length; i++) {
      html += '<p class="insight__p">' + escapeHtml(paras[i]) + '</p>';
    }
    return html;
  }

  /* 首段：把第一个「字母」（CJK / 字母数字）包成 drop-cap，规避前导标点 */
  function renderLead(text) {
    var s = String(text || '');
    var m = s.match(/[\u4e00-\u9fff\u3400-\u4dbfA-Za-z0-9]/);
    if (!m) {
      return '<p class="insight__lead">' + escapeHtml(s) + '</p>';
    }
    var idx = m.index;
    var before = s.slice(0, idx);
    var ch = s.charAt(idx);
    var after = s.slice(idx + 1);
    return '<p class="insight__lead">' +
      escapeHtml(before) +
      '<span class="drop-cap">' + escapeHtml(ch) + '</span>' +
      escapeHtml(after) +
    '</p>';
  }

  /* ============================================================
   *  引文：按映射取 timeline 节点
   * ============================================================ */
  function renderQuote(insightIndex, timeline) {
    var tlIndex = QUOTE_MAP[insightIndex];
    if (tlIndex == null || !timeline[tlIndex]) return '';

    var node = timeline[tlIndex];
    var speaker = SPEAKER_LABEL[node.speaker] || '协作';
    var round = tlIndex + 1;
    var text = truncate(node.content, QUOTE_MAX_LEN);

    return '<blockquote class="insight__quote">' +
      '<p class="insight__quote-text">「' + escapeHtml(text) + '」</p>' +
      '<cite class="insight__quote-cite">——节选自第 ' + round + ' 轮 · ' +
        escapeHtml(speaker) + '</cite>' +
    '</blockquote>';
  }

  /* ============================================================
   *  Hero「开始阅读」平滑滚动到第 1 条洞察
   * ============================================================ */
  function setupStartReading() {
    var btn = $('start-reading');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var first = document.querySelector('.insight');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ============================================================
   *  阅读进度条：滚入洞察区显示，按比例填充，滚出隐藏
   * ============================================================ */
  function setupProgress() {
    var bar = $('progress-bar');
    var fill = $('progress-fill');
    var list = $('insights-list');
    if (!bar || !fill || !list) return;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = list.getBoundingClientRect();
      var vh = window.innerHeight;
      var scrollable = list.offsetHeight - vh;

      // 列表比视口还短：不显示进度条
      if (scrollable <= 0) {
        bar.classList.remove('progress-bar--show');
        return;
      }

      var scrolled = -rect.top;            // 列表顶部已滚出视口顶部的距离
      var ratio = scrolled / scrollable;   // 0 ~ 1+

      // 进入阅读区（0 < ratio < 1）才显示
      var show = ratio > 0 && ratio < 1;
      bar.classList.toggle('progress-bar--show', show);
      if (show) {
        var clamped = Math.min(1, Math.max(0, ratio));
        fill.style.width = (clamped * 100) + '%';
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ============================================================
   *  分享按钮（占位） + Toast
   * ============================================================ */
  function setupShare() {
    [$('share-btn'), $('share-outro-btn')].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        showToast('分享功能开发中，敬请期待');
      });
    });
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
