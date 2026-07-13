(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  function AboutView(container) {
    Emitter.call(this);
    this._container = container;
    this._el = null;
    this._build();
    this._bindEvents();
    this._initAnimations();
  }

  AboutView.prototype = Object.create(Emitter.prototype);
  AboutView.prototype.constructor = AboutView;

  AboutView.create = function (container) {
    return new AboutView(container);
  };

  AboutView.prototype._build = function () {
    var root = document.createElement('div');
    root.setAttribute('data-role', 'about-view');

    root.innerHTML =
      this._topbar() +
      this._introSection() +
      this._heroSection() +
      this._whySection() +
      this._eventLayerSection() +
      this._relationLayerSection() +
      this._narrativeLayerSection() +
      this._collaborationSection() +
      this._roadmapSection() +
      this._moatSection() +
      this._ctaSection() +
      this._footer();

    this._container.appendChild(root);
    this._el = root;
  };

  AboutView.prototype._topbar = function () {
    return '<header data-role="about-topbar">' +
      '<div data-role="about-topbar-left">' +
        '<div data-role="about-logo" data-nav="home">' +
          '<span data-role="about-logo-mark"></span>' +
          '<span data-role="about-logo-text">事刻</span>' +
        '</div>' +
        '<nav data-role="about-nav">' +
          '<span data-role="about-nav-item" data-nav="home">首页</span>' +
          '<span data-role="about-nav-item" data-nav="news">事件</span>' +
          '<span data-role="about-nav-item" data-active="true">关于</span>' +
        '</nav>' +
      '</div>' +
    '</header>';
  };

  AboutView.prototype._introSection = function () {
    return '<section data-role="about-intro" data-animate>' +
      '<div data-role="about-intro-inner">' +
        '<span data-role="about-intro-eyebrow">TIMETRACE · 事刻</span>' +
        '<h1 data-role="about-intro-title">让事件成为<br/>可被追溯的基础设施</h1>' +
        '<p data-role="about-intro-subtitle">事刻是一个结构化事件网络：每个事件只存一份，关系全局共享，时间线只是叙述视角。我们想让复杂真相不再被信息碎片淹没。</p>' +
        '<div data-role="about-intro-features">' +
          '<div class="about-intro-feature">' +
            '<div class="about-intro-feature-icon" style="--feature-color:#d97757">' + this._introIconSvg('library') + '</div>' +
            '<h3>全局唯一事件库</h3>' +
            '<p>同一事件不会被重复创建，所有时间线引用同一份真相。</p>' +
          '</div>' +
          '<div class="about-intro-feature">' +
            '<div class="about-intro-feature-icon" style="--feature-color:#6a9bcc">' + this._introIconSvg('network') + '</div>' +
            '<h3>共享关系网络</h3>' +
            '<p>关系不属于任何单一叙事，而是连接事件的全局图谱。</p>' +
          '</div>' +
          '<div class="about-intro-feature">' +
            '<div class="about-intro-feature-icon" style="--feature-color:#9b7dc4">' + this._introIconSvg('timeline') + '</div>' +
            '<h3>开放时间线叙事</h3>' +
            '<p>任何人都可以从事件中策展出自己的时间线与观点。</p>' +
          '</div>' +
        '</div>' +
        '<div data-role="about-intro-scroll">' +
          '<span>向下了解事刻</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="#b0aea5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>' +
        '</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._introIconSvg = function (key) {
    var svgs = {
      library: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="10" height="32" rx="2"/><rect x="21" y="14" width="10" height="26" rx="2"/><path d="M38 6v36" stroke-width="2"/></svg>',
      network: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="4"/><circle cx="34" cy="14" r="4"/><circle cx="24" cy="34" r="4"/><path d="M17 16l4 16M31 16l-4 16M18 14h12"/></svg>',
      timeline: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 24h28"/><circle cx="16" cy="24" r="3" fill="currentColor"/><circle cx="32" cy="24" r="3" fill="currentColor"/><path d="M24 14v20"/></svg>'
    };
    return svgs[key] || '';
  };

  AboutView.prototype._heroSection = function () {
    return '<section data-role="about-hero" data-animate>' +
      '<div data-role="about-hero-text">' +
        '<span data-role="about-eyebrow">三层架构</span>' +
        '<h1 data-role="about-title">事件、关系与叙事</h1>' +
        '<p data-role="about-subtitle">底层是全局唯一的事件，中层是事件之间的全局关系，顶层是每个人基于同一组事实构建的叙事视角。事刻让复杂真相从混沌中变得可追溯。</p>' +
      '</div>' +
      '<div data-role="about-hero-viz">' + this._heroSvg() + '</div>' +
    '</section>';
  };

  AboutView.prototype._heroSvg = function () {
    return '<svg viewBox="0 0 640 440" preserveAspectRatio="xMidYMid meet" data-role="about-hero-svg">' +
      '<defs>' +
        '<filter id="heroCardShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.05"/></filter>' +
        '<filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +

      /* 事件层 —— 底层规则排列的客观事实节点 */
      '<g class="about-hero-layer about-hero-layer--event">' +
        '<rect x="40" y="270" width="560" height="150" rx="10" fill="#f3f1eb" stroke="#e8e6dc" stroke-width="1.5"/>' +
        '<text x="60" y="296" font-size="12" fill="#b0aea5" font-family="Poppins, sans-serif" font-weight="600" letter-spacing="1.5">事件层 · 全局唯一事实</text>' +
        this._heroEventCards() +
      '</g>' +

      /* 关系层 —— 中层连接事实的全局关系 */
      '<g class="about-hero-layer about-hero-layer--relation">' +
        '<rect x="40" y="150" width="560" height="100" rx="10" fill="rgba(255,255,255,0.9)" stroke="#e8e6dc" stroke-width="1.5"/>' +
        '<text x="60" y="176" font-size="12" fill="#b0aea5" font-family="Poppins, sans-serif" font-weight="600" letter-spacing="1.5">关系层 · 全局连接</text>' +
        this._heroRelationNetwork() +
      '</g>' +

      /* 叙事层 —— 顶层基于同一组事实的多元叙事路径 */
      '<g class="about-hero-layer about-hero-layer--narrative">' +
        '<text x="60" y="48" font-size="12" fill="#b0aea5" font-family="Poppins, sans-serif" font-weight="600" letter-spacing="1.5">叙事层 · 多元视角</text>' +
        this._heroNarrativePaths() +
      '</g>' +
    '</svg>';
  };

  AboutView.prototype._heroEventCards = function () {
    var cards = '';
    var cols = 7;
    var rows = 2;
    var startX = 72;
    var startY = 318;
    var gapX = 76;
    var gapY = 54;
    var w = 56;
    var h = 36;
    var idx = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = startX + c * gapX;
        var y = startY + r * gapY;
        var color = idx % 5 === 0 ? '#d97757' : (idx % 4 === 0 ? '#6a9bcc' : '#9b7dc4');
        cards +=
          '<g class="about-hero-card" transform="translate(' + x + ',' + y + ')">' +
            '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="5" fill="#fff" stroke="#e8e6dc" stroke-width="1" filter="url(#heroCardShadow)"/>' +
            '<rect x="8" y="9" width="' + (w - 16) + '" height="4" rx="2" fill="#e8e6dc"/>' +
            '<rect x="8" y="18" width="' + (w - 26) + '" height="3" rx="1.5" fill="#f0ede4"/>' +
            '<circle cx="' + (w - 9) + '" cy="' + (h - 9) + '" r="3" fill="' + color + '" opacity="0.6"/>' +
          '</g>';
        idx++;
      }
    }
    return cards;
  };

  AboutView.prototype._heroRelationNetwork = function () {
    var paths = [
      /* 关系线连接事件卡片中心 */
      'M100,336 C100,260 328,260 328,336',
      'M176,336 C176,260 480,260 480,336',
      'M252,390 C252,320 556,320 556,390',
      'M328,390 C328,320 100,320 100,390',
      'M404,336 C404,260 252,260 252,336',
      'M480,390 C480,320 176,320 176,390'
    ];
    var colors = ['#d97757', '#6a9bcc', '#9b7dc4', '#d97757', '#6a9bcc', '#9b7dc4'];
    var svg = '';
    for (var i = 0; i < paths.length; i++) {
      svg += '<path class="about-hero-relation" d="' + paths[i] + '" fill="none" stroke="' + colors[i] + '" stroke-width="2" stroke-linecap="round" stroke-opacity="0.55"/>';
    }
    return svg;
  };

  AboutView.prototype._heroNarrativePaths = function () {
    /* 三条叙事流，位于叙事层区域，代表多元视角对事实的选择 */
    return '<g class="about-hero-path" opacity="0">' +
        '<path d="M80,100 C160,100 200,80 280,95 C360,110 480,90 560,100" fill="none" stroke="#d97757" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.55" filter="url(#heroGlow)"/>' +
        '<circle cx="160" cy="98" r="5" fill="#d97757"/>' +
        '<circle cx="320" cy="100" r="5" fill="#d97757"/>' +
        '<circle cx="480" cy="94" r="5" fill="#d97757"/>' +
      '</g>' +
      '<g class="about-hero-path" opacity="0">' +
        '<path d="M80,125 C140,125 220,105 300,120 C380,135 500,115 560,125" fill="none" stroke="#6a9bcc" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.5" filter="url(#heroGlow)"/>' +
        '<circle cx="200" cy="119" r="5" fill="#6a9bcc"/>' +
        '<circle cx="360" cy="124" r="5" fill="#6a9bcc"/>' +
        '<circle cx="520" cy="121" r="5" fill="#6a9bcc"/>' +
      '</g>' +
      '<g class="about-hero-path" opacity="0">' +
        '<path d="M80,75 C180,75 260,55 340,70 C420,85 500,65 560,75" fill="none" stroke="#9b7dc4" stroke-width="3.5" stroke-linecap="round" stroke-opacity="0.5" filter="url(#heroGlow)"/>' +
        '<circle cx="220" cy="72" r="5" fill="#9b7dc4"/>' +
        '<circle cx="400" cy="74" r="5" fill="#9b7dc4"/>' +
        '<circle cx="500" cy="68" r="5" fill="#9b7dc4"/>' +
      '</g>';
  };

  AboutView.prototype._whySection = function () {
    return '<section data-role="about-why" data-animate>' +
      '<div data-role="about-section-header">' +
        '<span data-role="about-section-label">01 · 问题</span>' +
        '<h2 data-role="about-section-title">信息越多，真相越难抵达</h2>' +
      '</div>' +
      '<div data-role="about-why-grid">' +
        '<div data-role="about-why-card" data-side="left">' +
          '<h3>传统的信息流</h3>' +
          '<p>事件被切割成无数篇报道，重复、矛盾、缺乏上下文。我们像在碎片中拼图，却永远拼不出完整画面。</p>' +
          this._chaosSvg() +
        '</div>' +
        '<div data-role="about-why-arrow">→</div>' +
        '<div data-role="about-why-card" data-side="right">' +
          '<h3>事刻的结构化网络</h3>' +
          '<p>每个事件只存一份，关系全局共享，时间线只是叙述视角。因果、版本、争议都能被追溯。</p>' +
          this._orderSvg() +
        '</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._chaosSvg = function () {
    return '<svg viewBox="0 0 320 200" data-role="about-why-svg">' +
      '<defs>' +
        '<filter id="chaosBlur"><feGaussianBlur stdDeviation="0.6"/></filter>' +
      '</defs>' +
      /* 杂乱的信息碎片 */
      '<g fill="#b0aea5" opacity="0.35" filter="url(#chaosBlur)">' +
        '<rect x="18" y="22" width="95" height="13" rx="3" transform="rotate(-5 65 28)"/>' +
        '<rect x="135" y="28" width="115" height="10" rx="3" transform="rotate(3 192 33)"/>' +
        '<rect x="42" y="58" width="125" height="10" rx="3" transform="rotate(-3 104 63)"/>' +
        '<rect x="195" y="55" width="88" height="13" rx="3" transform="rotate(5 239 61)"/>' +
        '<rect x="28" y="95" width="105" height="10" rx="3" transform="rotate(4 80 100)"/>' +
        '<rect x="150" y="100" width="118" height="10" rx="3" transform="rotate(-4 209 105)"/>' +
        '<rect x="65" y="135" width="92" height="10" rx="3" transform="rotate(3 111 140)"/>' +
        '<rect x="180" y="132" width="105" height="13" rx="3" transform="rotate(-3 232 138)"/>' +
      '</g>' +
      /* 重复的连接线与矛盾标记 */
      '<path d="M45,48 L125,138 M155,42 L215,118 M255,78 L95,162 M125,150 L275,82" stroke="#d97757" stroke-width="1" stroke-opacity="0.18" stroke-dasharray="4 4" fill="none"/>' +
      '<text x="160" y="188" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Lora, serif">重复 · 矛盾 · 无上下文</text>' +
    '</svg>';
  };

  AboutView.prototype._orderSvg = function () {
    return '<svg viewBox="0 0 320 200" data-role="about-why-svg">' +
      '<defs>' +
        '<filter id="orderShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.05"/></filter>' +
        '<filter id="orderBlur"><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '</defs>' +

      /* 背景：虚化的时间线列 */
      '<g stroke="#e8e6dc" stroke-width="1.5" opacity="0.4">' +
        '<line x1="70" y1="38" x2="70" y2="162"/>' +
        '<line x1="160" y1="38" x2="160" y2="162"/>' +
        '<line x1="250" y1="38" x2="250" y2="162"/>' +
      '</g>' +

      /* 背景节点（被虚化的无关节点） */
      '<g fill="#e8e6dc">' +
        '<circle cx="70" cy="145" r="5"/>' +
        '<circle cx="160" cy="125" r="5"/>' +
        '<circle cx="250" cy="55" r="5"/>' +
        '<circle cx="250" cy="145" r="5"/>' +
      '</g>' +

      /* 焦点链：高亮的关联事件 */
      '<g class="about-order-chain">' +
        /* 节点卡片 */
        '<g transform="translate(55, 45)">' +
          '<rect x="0" y="0" width="30" height="22" rx="5" fill="#fff" stroke="#d97757" stroke-width="1.5" filter="url(#orderShadow)"/>' +
          '<rect x="5" y="6" width="20" height="3" rx="1.5" fill="#e8e6dc"/>' +
          '<rect x="5" y="12" width="12" height="2" rx="1" fill="#f0ede4"/>' +
        '</g>' +
        '<g transform="translate(145, 60)">' +
          '<rect x="0" y="0" width="30" height="22" rx="5" fill="#fff" stroke="#6a9bcc" stroke-width="1.5" filter="url(#orderShadow)"/>' +
          '<rect x="5" y="6" width="20" height="3" rx="1.5" fill="#e8e6dc"/>' +
          '<rect x="5" y="12" width="12" height="2" rx="1" fill="#f0ede4"/>' +
        '</g>' +
        '<g transform="translate(235, 90)">' +
          '<rect x="0" y="0" width="30" height="22" rx="5" fill="#fff" stroke="#9b7dc4" stroke-width="1.5" filter="url(#orderShadow)"/>' +
          '<rect x="5" y="6" width="20" height="3" rx="1.5" fill="#e8e6dc"/>' +
          '<rect x="5" y="12" width="12" height="2" rx="1" fill="#f0ede4"/>' +
        '</g>' +
        /* 跨列关系线 */
        '<path d="M85,58 C110,58 120,68 145,72" fill="none" stroke="#d97757" stroke-width="2" stroke-linecap="round" marker-end="url(#orderArrow)"/>' +
        '<path d="M175,72 C200,72 210,90 235,96" fill="none" stroke="#6a9bcc" stroke-width="2" stroke-linecap="round" marker-end="url(#orderArrow)"/>' +
      '</g>' +

      /* 左侧圆点数字（产品特征） */
      '<g transform="translate(42, 56)">' +
        '<circle cx="0" cy="0" r="8" fill="#d97757"/>' +
        '<text x="0" y="3" text-anchor="middle" font-size="8" fill="#fff" font-family="Poppins, sans-serif" font-weight="600">1</text>' +
      '</g>' +
      '<g transform="translate(132, 71)">' +
        '<circle cx="0" cy="0" r="8" fill="#6a9bcc"/>' +
        '<text x="0" y="3" text-anchor="middle" font-size="8" fill="#fff" font-family="Poppins, sans-serif" font-weight="600">1</text>' +
      '</g>' +
      '<g transform="translate(222, 101)">' +
        '<circle cx="0" cy="0" r="8" fill="#9b7dc4"/>' +
        '<text x="0" y="3" text-anchor="middle" font-size="8" fill="#fff" font-family="Poppins, sans-serif" font-weight="600">1</text>' +
      '</g>' +

      /* 标签 */
      '<text x="70" y="28" text-anchor="middle" font-size="10" fill="#b0aea5" font-family="Poppins, sans-serif">主线</text>' +
      '<text x="160" y="28" text-anchor="middle" font-size="10" fill="#b0aea5" font-family="Poppins, sans-serif">市场</text>' +
      '<text x="250" y="28" text-anchor="middle" font-size="10" fill="#b0aea5" font-family="Poppins, sans-serif">技术</text>' +
      '<text x="160" y="188" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Lora, serif">唯一事件 · 全局关系 · 焦点模式</text>' +

      '<defs>' +
        '<marker id="orderArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#d97757"/></marker>' +
      '</defs>' +
    '</svg>';
  };

  AboutView.prototype._eventLayerSection = function () {
    return '<section data-role="about-layer-section" data-animate>' +
      '<div data-role="about-layer-content">' +
        '<span data-role="about-section-label">02 · 事件层</span>' +
        '<h2 data-role="about-section-title">一个事件，只存一份</h2>' +
        '<p data-role="about-section-desc">在事刻的数据模型中，事件是全局唯一的客观事实。它包含时间、标题、摘要、标签、重要性和置信度。无论它出现在多少条时间线中，源头始终只有一份。</p>' +
        '<ul data-role="about-layer-features">' +
          '<li><b>全局唯一性</b> —— 同一事件不会被重复创建</li>' +
          '<li><b>置信度评分</b> —— AI 评估来源可信度，社区可质疑与验证</li>' +
          '<li><b>生命周期状态</b> —— upcoming / ongoing / concluded / uncertain</li>' +
        '</ul>' +
      '</div>' +
      '<div data-role="about-layer-media">' +
        this._eventUniquenessSvg() +
        '<div data-role="about-layer-badge" style="--badge-color:#d97757">EVENT</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._eventUniquenessSvg = function () {
    return '<svg viewBox="0 0 520 360" preserveAspectRatio="xMidYMid meet" data-role="about-layer-svg">' +
      '<defs>' +
        '<filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.06"/></filter>' +
      '</defs>' +

      /* 三条时间线标签 */
      '<g class="about-uni-timeline" transform="translate(40, 30)">' +
        '<rect x="0" y="0" width="110" height="30" rx="15" fill="#f3f1eb" stroke="#e8e6dc"/>' +
        '<text x="55" y="20" text-anchor="middle" font-size="11" fill="#6b6960" font-family="Poppins, sans-serif" font-weight="500">创业历程</text>' +
      '</g>' +
      '<g class="about-uni-timeline" transform="translate(205, 30)">' +
        '<rect x="0" y="0" width="110" height="30" rx="15" fill="#f3f1eb" stroke="#e8e6dc"/>' +
        '<text x="55" y="20" text-anchor="middle" font-size="11" fill="#6b6960" font-family="Poppins, sans-serif" font-weight="500">技术演进</text>' +
      '</g>' +
      '<g class="about-uni-timeline" transform="translate(370, 30)">' +
        '<rect x="0" y="0" width="110" height="30" rx="15" fill="#f3f1eb" stroke="#e8e6dc"/>' +
        '<text x="55" y="20" text-anchor="middle" font-size="11" fill="#6b6960" font-family="Poppins, sans-serif" font-weight="500">市场变化</text>' +
      '</g>' +

      /* 三条时间线中，原本可能被重复记录的相似事件 */
      '<g class="about-uni-source" transform="translate(40, 75)">' +
        '<rect x="0" y="0" width="110" height="58" rx="10" fill="#fff" stroke="#e8e6dc" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<rect x="10" y="10" width="60" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="10" y="20" width="85" height="5" rx="2.5" fill="#d97757" opacity="0.2"/>' +
        '<text x="10" y="42" font-size="9" fill="#b0aea5" font-family="Lora, serif">2023-09-20</text>' +
        '<text x="10" y="54" font-size="9" fill="#b0aea5" font-family="Lora, serif">融资</text>' +
      '</g>' +
      '<g class="about-uni-source" transform="translate(205, 75)">' +
        '<rect x="0" y="0" width="110" height="58" rx="10" fill="#fff" stroke="#e8e6dc" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<rect x="10" y="10" width="60" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="10" y="20" width="80" height="5" rx="2.5" fill="#6a9bcc" opacity="0.2"/>' +
        '<text x="10" y="42" font-size="9" fill="#b0aea5" font-family="Lora, serif">2023-09-19</text>' +
        '<text x="10" y="54" font-size="9" fill="#b0aea5" font-family="Lora, serif">B轮</text>' +
      '</g>' +
      '<g class="about-uni-source" transform="translate(370, 75)">' +
        '<rect x="0" y="0" width="110" height="58" rx="10" fill="#fff" stroke="#e8e6dc" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<rect x="10" y="10" width="60" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="10" y="20" width="75" height="5" rx="2.5" fill="#9b7dc4" opacity="0.2"/>' +
        '<text x="10" y="42" font-size="9" fill="#b0aea5" font-family="Lora, serif">2023-09-20</text>' +
        '<text x="10" y="54" font-size="9" fill="#b0aea5" font-family="Lora, serif">融资</text>' +
      '</g>' +

      /* 汇聚箭头：表示去重/合并过程 */
      '<path class="about-uni-merge" d="M95,133 L95,165 L220,200" fill="none" stroke="#d97757" stroke-width="1.5" stroke-opacity="0.5" stroke-dasharray="5 3" marker-end="url(#uniArrow)"/>' +
      '<path class="about-uni-merge" d="M260,133 L260,180 L260,200" fill="none" stroke="#6a9bcc" stroke-width="1.5" stroke-opacity="0.5" stroke-dasharray="5 3" marker-end="url(#uniArrow)"/>' +
      '<path class="about-uni-merge" d="M425,133 L425,165 L300,200" fill="none" stroke="#9b7dc4" stroke-width="1.5" stroke-opacity="0.5" stroke-dasharray="5 3" marker-end="url(#uniArrow)"/>' +

      /* 去重逻辑标签 */
      '<g class="about-uni-logic" transform="translate(186, 150)">' +
        '<rect x="0" y="0" width="148" height="30" rx="15" fill="#fff" stroke="#d97757" stroke-width="1.5"/>' +
        '<text x="74" y="19" text-anchor="middle" font-size="10" fill="#d97757" font-family="Poppins, sans-serif" font-weight="600">时间 + 关键词 → 合并</text>' +
      '</g>' +

      /* 中心事件卡片：全局唯一 */
      '<g class="about-uni-card" transform="translate(110, 205)">' +
        '<rect x="0" y="0" width="300" height="130" rx="16" fill="#fff" stroke="#d97757" stroke-width="2" filter="url(#cardShadow)"/>' +
        '<rect x="20" y="18" width="40" height="7" rx="3.5" fill="#d97757" opacity="0.25"/>' +
        '<text x="20" y="55" font-size="18" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">完成 B 轮融资</text>' +
        '<text x="20" y="82" font-size="13" fill="#6b6960" font-family="Lora, serif">2023-09-20 · 融资</text>' +
        '<g transform="translate(20, 98)">' +
          '<rect x="0" y="0" width="52" height="22" rx="11" fill="#f3f1eb"/>' +
          '<text x="26" y="15" text-anchor="middle" font-size="10" fill="#6b6960" font-family="Poppins, sans-serif">里程碑</text>' +
        '</g>' +
        '<g transform="translate(82, 98)">' +
          '<rect x="0" y="0" width="52" height="22" rx="11" fill="#f3f1eb"/>' +
          '<text x="26" y="15" text-anchor="middle" font-size="10" fill="#6b6960" font-family="Poppins, sans-serif">高置信</text>' +
        '</g>' +
        '<text x="20" y="152" font-size="11" fill="#b0aea5" font-family="Lora, serif" font-style="italic">全局唯一 ID：event-ft-series-b</text>' +
      '</g>' +

      /* 唯一性强调光环 */
      '<circle class="about-uni-ring" cx="260" cy="270" r="78" fill="none" stroke="#d97757" stroke-width="1.5" stroke-opacity="0.15" stroke-dasharray="8 6"/>' +

      '<defs>' +
        '<marker id="uniArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#d97757"/></marker>' +
      '</defs>' +
    '</svg>';
  };

  AboutView.prototype._relationLayerSection = function () {
    return '<section data-role="about-layer-section" data-role-variant="reverse" data-animate>' +
      '<div data-role="about-layer-media">' +
        this._relationGlobalSvg() +
        '<div data-role="about-layer-badge" style="--badge-color:#6a9bcc">RELATION</div>' +
      '</div>' +
      '<div data-role="about-layer-content">' +
        '<span data-role="about-section-label">03 · 关系层</span>' +
        '<h2 data-role="about-section-title">关系不属于任何一条时间线</h2>' +
        '<p data-role="about-section-desc">关系是事件与事件之间的全局连接。我们把它简化为三种方向 + 五种标签，让用户三分钟上手，同时让系统保留完整语义。</p>' +
        '<div data-role="about-relation-tags">' +
          '<span class="about-tag" data-tag="causal">causal 因果</span>' +
          '<span class="about-tag" data-tag="contextual">contextual 背景</span>' +
          '<span class="about-tag" data-tag="sequential">sequential 时序</span>' +
          '<span class="about-tag" data-tag="contradictory">contradictory 争议</span>' +
          '<span class="about-tag" data-tag="version">version_of 版本</span>' +
        '</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._relationGlobalSvg = function () {
    return '<svg viewBox="0 0 520 360" preserveAspectRatio="xMidYMid meet" data-role="about-layer-svg">' +
      '<defs>' +
        '<filter id="relShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.05"/></filter>' +
      '</defs>' +

      /* 三条时间线列（叙事层），半透明背景 */
      '<g stroke="#e8e6dc" stroke-width="2" opacity="0.5">' +
        '<line x1="120" y1="70" x2="120" y2="290"/>' +
        '<line x1="260" y1="70" x2="260" y2="290"/>' +
        '<line x1="400" y1="70" x2="400" y2="290"/>' +
      '</g>' +
      '<text x="120" y="320" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Poppins, sans-serif">融资线</text>' +
      '<text x="260" y="320" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Poppins, sans-serif">技术线</text>' +
      '<text x="400" y="320" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Poppins, sans-serif">主线</text>' +

      /* 关系层：独立的横向带状区域 */
      '<rect class="about-rel-band" x="50" y="130" width="420" height="100" rx="12" fill="rgba(255,255,255,0.85)" stroke="#6a9bcc" stroke-width="1.5" stroke-dasharray="6 4"/>' +
      '<text x="260" y="152" text-anchor="middle" font-size="11" fill="#6a9bcc" font-family="Poppins, sans-serif" font-weight="600" letter-spacing="1">关系层（全局共享）</text>' +

      /* 事件节点 */
      '<g class="about-rel-node" transform="translate(120, 110)">' +
        '<circle r="18" fill="#fff" stroke="#d97757" stroke-width="2.5" filter="url(#relShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="9" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">B轮</text>' +
      '</g>' +
      '<g class="about-rel-node" transform="translate(260, 240)">' +
        '<circle r="18" fill="#fff" stroke="#6a9bcc" stroke-width="2.5" filter="url(#relShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="9" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">训练</text>' +
      '</g>' +
      '<g class="about-rel-node" transform="translate(400, 110)">' +
        '<circle r="18" fill="#fff" stroke="#9b7dc4" stroke-width="2.5" filter="url(#relShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="9" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">V3.0</text>' +
      '</g>' +

      /* 全局关系线：从节点出发，经过关系层，再到达另一节点 */
      '<path class="about-rel-line" d="M136,110 C170,110 200,150 242,180" fill="none" stroke="#d97757" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path class="about-rel-line" d="M278,240 C310,240 340,200 384,160" fill="none" stroke="#6a9bcc" stroke-width="2.5" stroke-linecap="round"/>' +

      /* 关系标签（浮在关系层内） */
      '<g class="about-rel-label" transform="translate(170, 175)">' +
        '<rect x="0" y="0" width="80" height="26" rx="13" fill="#fff" stroke="#d97757" stroke-width="1.5" filter="url(#relShadow)"/>' +
        '<text x="40" y="17" text-anchor="middle" font-size="10" fill="#d97757" font-family="Poppins, sans-serif" font-weight="600">支撑训练</text>' +
      '</g>' +
      '<g class="about-rel-label" transform="translate(300, 155)">' +
        '<rect x="0" y="0" width="80" height="26" rx="13" fill="#fff" stroke="#6a9bcc" stroke-width="1.5" filter="url(#relShadow)"/>' +
        '<text x="40" y="17" text-anchor="middle" font-size="10" fill="#6a9bcc" font-family="Poppins, sans-serif" font-weight="600">成本优化</text>' +
      '</g>' +

      /* 说明：关系不属于任何时间线 */
      '<text x="260" y="55" text-anchor="middle" font-size="13" fill="#6b6960" font-family="Lora, serif">关系独立存在于全局，不隶属于某条时间线</text>' +
      '<text x="260" y="75" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Lora, serif">被所有叙事视角共同引用</text>' +
    '</svg>';
  };

  AboutView.prototype._narrativeLayerSection = function () {
    return '<section data-role="about-layer-section" data-animate>' +
      '<div data-role="about-layer-content">' +
        '<span data-role="about-section-label">04 · 叙事层</span>' +
        '<h2 data-role="about-section-title">叙事有视角，真相有约束</h2>' +
        '<p data-role="about-section-desc">时间线是策展人对事实的组织和诠释，但事件本身不被改写。我们用置信度、来源快照与版本关系，给主观叙事套上客观约束，让它始终能追溯到可验证的事实。</p>' +
        '<ul data-role="about-layer-features">' +
          '<li><b>私有草稿</b> —— 创作阶段完全自由，一键发布</li>' +
          '<li><b>来源快照</b> —— 网页会失效，但证据不会</li>' +
          '<li><b>版本关系</b> —— 不同说法可以并列，但都指向同一事件</li>' +
        '</ul>' +
      '</div>' +
      '<div data-role="about-layer-media">' +
        this._narrativeMultiSvg() +
        '<div data-role="about-layer-badge" style="--badge-color:#9b7dc4">TIMELINE</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._narrativeMultiSvg = function () {
    return '<svg viewBox="0 0 520 360" preserveAspectRatio="xMidYMid meet" data-role="about-layer-svg">' +
      '<defs>' +
        '<filter id="narShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.06"/></filter>' +
        '<filter id="narCoreGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +

      /* 标题：不同视角，同一事实 */
      '<text x="260" y="36" text-anchor="middle" font-size="13" fill="#6b6960" font-family="Lora, serif">不同视角都会回到同一事实</text>' +

      /* 三条叙事路径，以不同顺序经过中心事实 */
      /* 红色：创业历程视角 */
      '<path class="about-nar-line" d="M70,110 C120,110 160,150 200,170" fill="none" stroke="#d97757" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" marker-end="url(#narArrow)"/>' +
      '<path class="about-nar-line" d="M320,170 C360,190 400,230 450,230" fill="none" stroke="#d97757" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" marker-end="url(#narArrow)"/>' +

      /* 蓝色：技术演进视角 */
      '<path class="about-nar-line" d="M70,260 C120,260 160,210 200,190" fill="none" stroke="#6a9bcc" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" marker-end="url(#narArrow)"/>' +
      '<path class="about-nar-line" d="M320,190 C360,170 400,120 450,120" fill="none" stroke="#6a9bcc" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" marker-end="url(#narArrow)"/>' +

      /* 紫色：市场变化视角 */
      '<path class="about-nar-line" d="M200,80 C200,110 200,130 200,150" fill="none" stroke="#9b7dc4" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" marker-end="url(#narArrow)"/>' +
      '<path class="about-nar-line" d="M320,170 C360,170 400,170 450,170" fill="none" stroke="#9b7dc4" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.55" marker-end="url(#narArrow)"/>' +

      /* 左侧外围事件 */
      '<g class="about-nar-node" transform="translate(40, 95)">' +
        '<rect x="0" y="0" width="60" height="34" rx="8" fill="#fff" stroke="#d97757" stroke-width="1.5" filter="url(#narShadow)"/>' +
        '<rect x="8" y="8" width="30" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="8" y="16" width="20" height="3" rx="1.5" fill="#f0ede4"/>' +
      '</g>' +
      '<g class="about-nar-node" transform="translate(40, 245)">' +
        '<rect x="0" y="0" width="60" height="34" rx="8" fill="#fff" stroke="#6a9bcc" stroke-width="1.5" filter="url(#narShadow)"/>' +
        '<rect x="8" y="8" width="30" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="8" y="16" width="20" height="3" rx="1.5" fill="#f0ede4"/>' +
      '</g>' +

      /* 上方外围事件 */
      '<g class="about-nar-node" transform="translate(170, 40)">' +
        '<rect x="0" y="0" width="60" height="34" rx="8" fill="#fff" stroke="#9b7dc4" stroke-width="1.5" filter="url(#narShadow)"/>' +
        '<rect x="8" y="8" width="30" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="8" y="16" width="20" height="3" rx="1.5" fill="#f0ede4"/>' +
      '</g>' +

      /* 右侧外围事件 */
      '<g class="about-nar-node" transform="translate(420, 105)">' +
        '<rect x="0" y="0" width="60" height="34" rx="8" fill="#fff" stroke="#6a9bcc" stroke-width="1.5" filter="url(#narShadow)"/>' +
        '<rect x="8" y="8" width="30" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="8" y="16" width="20" height="3" rx="1.5" fill="#f0ede4"/>' +
      '</g>' +
      '<g class="about-nar-node" transform="translate(420, 215)">' +
        '<rect x="0" y="0" width="60" height="34" rx="8" fill="#fff" stroke="#d97757" stroke-width="1.5" filter="url(#narShadow)"/>' +
        '<rect x="8" y="8" width="30" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="8" y="16" width="20" height="3" rx="1.5" fill="#f0ede4"/>' +
      '</g>' +
      '<g class="about-nar-node" transform="translate(420, 155)">' +
        '<rect x="0" y="0" width="60" height="34" rx="8" fill="#fff" stroke="#9b7dc4" stroke-width="1.5" filter="url(#narShadow)"/>' +
        '<rect x="8" y="8" width="30" height="4" rx="2" fill="#e8e6dc"/>' +
        '<rect x="8" y="16" width="20" height="3" rx="1.5" fill="#f0ede4"/>' +
      '</g>' +

      /* 中心事实：三条路径交汇于此 */
      '<g class="about-nar-core" transform="translate(200, 150)">' +
        '<rect x="0" y="0" width="120" height="70" rx="14" fill="#fff" stroke="#d97757" stroke-width="2.5" filter="url(#narCoreGlow)"/>' +
        '<rect x="16" y="14" width="44" height="7" rx="3.5" fill="#d97757" opacity="0.25"/>' +
        '<text x="16" y="46" font-size="14" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">产品发布</text>' +
        '<text x="16" y="62" font-size="10" fill="#6b6960" font-family="Lora, serif">同一事实 · 多重视角</text>' +
      '</g>' +

      /* 视角标签 */
      '<g class="about-nar-view" transform="translate(35, 310)">' +
        '<rect x="0" y="0" width="120" height="28" rx="14" fill="#fff" stroke="#d97757" stroke-width="1.5"/>' +
        '<text x="60" y="18" text-anchor="middle" font-size="10" fill="#d97757" font-family="Poppins, sans-serif" font-weight="600">创业历程视角</text>' +
      '</g>' +
      '<g class="about-nar-view" transform="translate(200, 310)">' +
        '<rect x="0" y="0" width="120" height="28" rx="14" fill="#fff" stroke="#6a9bcc" stroke-width="1.5"/>' +
        '<text x="60" y="18" text-anchor="middle" font-size="10" fill="#6a9bcc" font-family="Poppins, sans-serif" font-weight="600">技术演进视角</text>' +
      '</g>' +
      '<g class="about-nar-view" transform="translate(365, 310)">' +
        '<rect x="0" y="0" width="120" height="28" rx="14" fill="#fff" stroke="#9b7dc4" stroke-width="1.5"/>' +
        '<text x="60" y="18" text-anchor="middle" font-size="10" fill="#9b7dc4" font-family="Poppins, sans-serif" font-weight="600">市场变化视角</text>' +
      '</g>' +

      '<defs>' +
        '<marker id="narArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#b0aea5"/></marker>' +
      '</defs>' +
    '</svg>';
  };

  AboutView.prototype._collaborationSection = function () {
    return '<section data-role="about-collab" data-animate>' +
      '<div data-role="about-section-header">' +
        '<span data-role="about-section-label">05 · 协作生态</span>' +
        '<h2 data-role="about-section-title">四种角色，共同建造</h2>' +
      '</div>' +
      '<div data-role="about-collab-grid">' +
        this._roleCard('curator', '策展人', 'Curator', '创建时间线、编辑事件与关系、设置可见性。是叙事的发起者与维护者。', '#d97757') +
        this._roleCard('contributor', '贡献者', 'Contributor', '在策展人授权下提交修改建议，审核后合并。像 Wikipedia 编辑者一样协作。', '#6a9bcc') +
        this._roleCard('verifier', '验证者', 'Verifier', '覆写置信度、标记事件状态、检查来源快照。事实核查员角色。', '#788c5d') +
        this._roleCard('subscriber', '订阅者', 'Subscriber', '浏览、评论、提出疑问、订阅通知。读者也可以成为未来的策展人。', '#c4854b') +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._roleCard = function (key, name, en, desc, color) {
    return '<div class="about-role-card" data-role="' + key + '">' +
      '<div class="about-role-icon" style="--role-color:' + color + '">' + this._roleIconSvg(key, color) + '</div>' +
      '<h3>' + name + '</h3>' +
      '<span class="about-role-en">' + en + '</span>' +
      '<p>' + desc + '</p>' +
    '</div>';
  };

  AboutView.prototype._roleIconSvg = function (key, color) {
    var svgs = {
      curator: '<svg viewBox="0 0 48 48"><circle cx="24" cy="16" r="7" fill="none" stroke="' + color + '" stroke-width="2"/><path d="M12,42 C12,32 18,28 24,28 C30,28 36,32 36,42" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/></svg>',
      contributor: '<svg viewBox="0 0 48 48"><path d="M14,24 L22,32 L36,16" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="24" r="18" fill="none" stroke="' + color + '" stroke-width="2"/></svg>',
      verifier: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="none" stroke="' + color + '" stroke-width="2"/><path d="M24,14 L24,24 L32,30" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      subscriber: '<svg viewBox="0 0 48 48"><path d="M24,10 L26,20 L38,20 L28,28 L32,40 L24,32 L14,40 L18,28 L8,20 L20,20 Z" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/></svg>'
    };
    return svgs[key] || '';
  };

  AboutView.prototype._roadmapSection = function () {
    return '<section data-role="about-roadmap" data-animate>' +
      '<div data-role="about-section-header">' +
        '<span data-role="about-section-label">06 · 路线图</span>' +
        '<h2 data-role="about-section-title">从工具到基础设施</h2>' +
      '</div>' +
      '<div data-role="about-roadmap-viz">' + this._roadmapSvg() + '</div>' +
    '</section>';
  };

  AboutView.prototype._roadmapSvg = function () {
    return '<svg viewBox="0 0 800 240" preserveAspectRatio="xMidYMid meet" data-role="about-roadmap-svg">' +
      '<defs>' +
        '<linearGradient id="roadGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#d97757" stop-opacity="0.35"/><stop offset="100%" stop-color="#9b7dc4" stop-opacity="0.85"/></linearGradient>' +
      '</defs>' +

      /* 主时间轴 */
      '<line class="about-road-axis" x1="100" y1="120" x2="700" y2="120" stroke="#e8e6dc" stroke-width="4" stroke-linecap="round"/>' +

      /* 节点 1：Phase 1 工具期 */
      '<g class="about-road-node" transform="translate(200, 120)">' +
        '<circle r="16" fill="#fff" stroke="#d97757" stroke-width="3"/>' +
        '<circle r="7" fill="#d97757"/>' +
        '<text y="-42" text-anchor="middle" font-size="13" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">Phase 1</text>' +
        '<text y="-24" text-anchor="middle" font-size="12" fill="#6b6960" font-family="Lora, serif">工具期</text>' +
        '<text y="44" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Lora, serif">事件 CRUD · 关系模型</text>' +
      '</g>' +

      /* 节点 2：Phase 2 平台期 */
      '<g class="about-road-node" transform="translate(400, 120)">' +
        '<circle r="16" fill="#fff" stroke="#6a9bcc" stroke-width="3"/>' +
        '<circle r="7" fill="#6a9bcc"/>' +
        '<text y="-42" text-anchor="middle" font-size="13" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">Phase 2</text>' +
        '<text y="-24" text-anchor="middle" font-size="12" fill="#6b6960" font-family="Lora, serif">平台期</text>' +
        '<text y="44" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Lora, serif">Fork/Merge · 来源快照</text>' +
      '</g>' +

      /* 节点 3：Phase 3 生态期 */
      '<g class="about-road-node" transform="translate(600, 120)">' +
        '<circle r="16" fill="#fff" stroke="#9b7dc4" stroke-width="3"/>' +
        '<circle r="7" fill="#9b7dc4"/>' +
        '<text y="-42" text-anchor="middle" font-size="13" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">Phase 3</text>' +
        '<text y="-24" text-anchor="middle" font-size="12" fill="#6b6960" font-family="Lora, serif">生态期</text>' +
        '<text y="44" text-anchor="middle" font-size="11" fill="#b0aea5" font-family="Lora, serif">图查询 API · 企业部署</text>' +
      '</g>' +

      /* 进度高亮：当前处于 Phase 1 */
      '<line class="about-road-progress" x1="100" y1="120" x2="200" y2="120" stroke="url(#roadGradient)" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';
  };

  AboutView.prototype._moatSection = function () {
    return '<section data-role="about-moat" data-animate>' +
      '<div data-role="about-section-header">' +
        '<span data-role="about-section-label">07 · 护城河</span>' +
        '<h2 data-role="about-section-title">整合，才是不可替代性</h2>' +
      '</div>' +
      '<div data-role="about-moat-grid">' +
        this._moatCard('network', '事件网络可视化', '星图、时间轴、焦点模式，多视角探索同一组数据', '#d97757') +
        this._moatCard('model', '简化关系模型', '3 方向 + 5 标签，降低认知门槛，保留语义精度', '#6a9bcc') +
        this._moatCard('track', 'Track 层级结构', '主线-支线可导航，复杂叙事也能清晰呈现', '#9b7dc4') +
        this._moatCard('cross', 'CrossRef 类型化', '跨叙事跳转语义清晰，同一事件的多重视角可对比', '#788c5d') +
        this._moatCard('trust', '置信度 + 社群打分', 'AI 初判与人工验证结合，可信度来自可追溯证据链', '#c4854b') +
        this._moatCard('snapshot', '来源快照抗衰减', '网页会失效，但证据快照不会，确保长期可验证', '#56a5a5') +
      '</div>' +
      '<div data-role="about-enterprise">' +
        '<h3>企业级复杂追踪</h3>' +
        '<p>从纷杂线索中定位关键节点，层层剥开事件之间的关联。</p>' +
        '<div data-role="about-enterprise-viz">' + this._enterpriseTrackerSvg() + '</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._moatCard = function (key, title, desc, color) {
    return '<div class="about-moat-card" data-moat="' + key + '">' +
      '<div class="about-moat-icon" style="--moat-color:' + color + '">' + this._moatIconSvg(key, color) + '</div>' +
      '<h3>' + title + '</h3>' +
      '<p>' + desc + '</p>' +
    '</div>';
  };

  AboutView.prototype._moatIconSvg = function (key, color) {
    var svgs = {
      network:
        '<svg viewBox="0 0 48 48" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="14" cy="14" r="4"/>' +
          '<circle cx="34" cy="14" r="4"/>' +
          '<circle cx="24" cy="34" r="4"/>' +
          '<path d="M17,16 L21,30" stroke-width="1.5"/>' +
          '<path d="M31,16 L27,30" stroke-width="1.5"/>' +
          '<path d="M15,14 H33" stroke-width="1.5"/>' +
        '</svg>',
      model:
        '<svg viewBox="0 0 48 48" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="24" cy="11" r="3.5"/>' +
          '<circle cx="12" cy="36" r="3.5"/>' +
          '<circle cx="36" cy="36" r="3.5"/>' +
          '<path d="M22,14 L14,32" stroke-width="1.5"/>' +
          '<path d="M26,14 L34,32" stroke-width="1.5"/>' +
          '<path d="M15,36 H33" stroke-width="1.5"/>' +
          '<path d="M20,25 H28" stroke-width="1.5"/>' +
        '</svg>',
      track:
        '<svg viewBox="0 0 48 48" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M10,12 H38"/>' +
          '<path d="M10,20 H32" opacity="0.7"/>' +
          '<path d="M10,28 H26" opacity="0.5"/>' +
          '<path d="M10,36 H20" opacity="0.3"/>' +
          '<circle cx="36" cy="20" r="3" fill="' + color + '" opacity="0.7"/>' +
          '<circle cx="30" cy="28" r="3" fill="' + color + '" opacity="0.5"/>' +
          '<circle cx="24" cy="36" r="3" fill="' + color + '" opacity="0.3"/>' +
        '</svg>',
      cross:
        '<svg viewBox="0 0 48 48" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="7" y="10" width="14" height="28" rx="3"/>' +
          '<rect x="27" y="10" width="14" height="28" rx="3"/>' +
          '<path d="M21,18 L27,18" stroke-width="1.5"/>' +
          '<path d="M21,30 L27,30" stroke-width="1.5"/>' +
          '<circle cx="24" cy="24" r="2" fill="' + color + '"/>' +
        '</svg>',
      trust:
        '<svg viewBox="0 0 48 48" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M24,8 L30,11 V20 C30,28 24,34 24,34 C24,34 18,28 18,20 V11 L24,8 Z"/>' +
          '<path d="M21,20 L23,23 L28,17" stroke-width="1.5"/>' +
        '</svg>',
      snapshot:
        '<svg viewBox="0 0 48 48" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="7" y="11" width="34" height="26" rx="3"/>' +
          '<path d="M7,18 H41" stroke-width="1" opacity="0.5"/>' +
          '<circle cx="14" cy="15" r="2" fill="' + color + '"/>' +
          '<path d="M12,33 L17,27 L23,33 L30,24 L36,33" stroke-width="1.5"/>' +
          '<path d="M32,11 V16 H37" stroke-width="1.5"/>' +
        '</svg>'
    };
    return svgs[key] || '';
  };

  AboutView.prototype._enterpriseTrackerSvg = function () {
    return '<svg viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid meet" data-role="about-enterprise-svg">' +
      '<defs>' +
        '<filter id="entShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.05"/></filter>' +
        '<filter id="entGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +

      /* 背景：淡淡的网格 */
      '<g stroke="#e8e6dc" stroke-width="1" opacity="0.4">' +
        '<line x1="100" y1="80" x2="900" y2="80"/>' +
        '<line x1="100" y1="230" x2="900" y2="230"/>' +
        '<line x1="100" y1="380" x2="900" y2="380"/>' +
      '</g>' +

      /* 复杂底网：所有节点之间的弱连接 */
      '<g stroke="#e8e6dc" stroke-width="1" stroke-opacity="0.45" fill="none">' +
        '<path d="M500,230 L220,130"/>' +
        '<path d="M500,230 L780,130"/>' +
        '<path d="M500,230 L170,300"/>' +
        '<path d="M500,230 L830,300"/>' +
        '<path d="M500,230 L500,80"/>' +
        '<path d="M220,130 L120,80"/>' +
        '<path d="M220,130 L300,60"/>' +
        '<path d="M780,130 L880,80"/>' +
        '<path d="M780,130 L700,60"/>' +
        '<path d="M170,300 L80,360"/>' +
        '<path d="M170,300 L280,380"/>' +
        '<path d="M830,300 L920,360"/>' +
        '<path d="M830,300 L720,380"/>' +
        '<path d="M500,80 L400,60"/>' +
        '<path d="M500,80 L600,60"/>' +
        /* 交叉连接，体现复杂性 */
        '<path d="M220,130 L830,300"/>' +
        '<path d="M780,130 L170,300"/>' +
        '<path d="M500,80 L720,380"/>' +
        '<path d="M300,60 L600,60"/>' +
      '</g>' +

      /* 抽丝剥茧高亮路径：中心 → 投融资 → 投资方 → 竞品 → 价格战 → 供应链 → 代工厂 */
      '<path class="about-ent-track" d="M500,230 C420,230 260,260 170,300 C140,315 120,335 110,360" fill="none" stroke="#d97757" stroke-width="3" stroke-linecap="round" filter="url(#entGlow)"/>' +
      '<path class="about-ent-track" d="M170,300 C220,220 300,160 220,130 C180,110 150,85 140,70" fill="none" stroke="#d97757" stroke-width="3" stroke-linecap="round" filter="url(#entGlow)"/>' +
      '<path class="about-ent-track" d="M220,130 C260,120 320,95 300,60" fill="none" stroke="#d97757" stroke-width="3" stroke-linecap="round" filter="url(#entGlow)"/>' +
      '<path class="about-ent-track" d="M300,60 C420,60 620,70 700,60 C740,55 770,90 780,130" fill="none" stroke="#d97757" stroke-width="3" stroke-linecap="round" filter="url(#entGlow)"/>' +

      /* 中心：调查主体 */
      '<g class="about-ent-core" transform="translate(500, 230)">' +
        '<circle r="38" fill="#fff" stroke="#d97757" stroke-width="3" filter="url(#entShadow)"/>' +
        '<circle r="28" fill="none" stroke="#d97757" stroke-width="1.5" stroke-opacity="0.2" stroke-dasharray="5 4"/>' +
        '<text y="4" text-anchor="middle" font-size="12" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">调查主体</text>' +
      '</g>' +

      /* 竞品分支 */
      '<g class="about-ent-node" transform="translate(220, 130)">' +
        '<circle r="24" fill="#fff" stroke="#6a9bcc" stroke-width="2" filter="url(#entShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="10" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">竞品动态</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(120, 80)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#6a9bcc" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#6a9bcc" font-family="Poppins, sans-serif" font-weight="600">新品发布</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(300, 60)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#6a9bcc" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#6a9bcc" font-family="Poppins, sans-serif" font-weight="600">价格战</text>' +
      '</g>' +

      /* 供应链分支 */
      '<g class="about-ent-node" transform="translate(780, 130)">' +
        '<circle r="24" fill="#fff" stroke="#788c5d" stroke-width="2" filter="url(#entShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="10" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">供应链</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(700, 60)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#788c5d" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#788c5d" font-family="Poppins, sans-serif" font-weight="600">上游厂商</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(880, 80)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#788c5d" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#788c5d" font-family="Poppins, sans-serif" font-weight="600">代工厂</text>' +
      '</g>' +

      /* 投融资分支 */
      '<g class="about-ent-node" transform="translate(170, 300)">' +
        '<circle r="24" fill="#fff" stroke="#9b7dc4" stroke-width="2" filter="url(#entShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="10" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">投融资</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(80, 360)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#9b7dc4" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#9b7dc4" font-family="Poppins, sans-serif" font-weight="600">融资轮次</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(280, 380)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#9b7dc4" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#9b7dc4" font-family="Poppins, sans-serif" font-weight="600">投资方</text>' +
      '</g>' +

      /* 合规分支 */
      '<g class="about-ent-node" transform="translate(830, 300)">' +
        '<circle r="24" fill="#fff" stroke="#c4854b" stroke-width="2" filter="url(#entShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="10" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">合规审计</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(920, 360)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#c4854b" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#c4854b" font-family="Poppins, sans-serif" font-weight="600">诉讼</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(720, 380)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#c4854b" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#c4854b" font-family="Poppins, sans-serif" font-weight="600">监管</text>' +
      '</g>' +

      /* 舆情分支 */
      '<g class="about-ent-node" transform="translate(500, 80)">' +
        '<circle r="24" fill="#fff" stroke="#56a5a5" stroke-width="2" filter="url(#entShadow)"/>' +
        '<text y="4" text-anchor="middle" font-size="10" fill="#141413" font-family="Poppins, sans-serif" font-weight="600">舆情监测</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(400, 60)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#56a5a5" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#56a5a5" font-family="Poppins, sans-serif" font-weight="600">媒体报道</text>' +
      '</g>' +
      '<g class="about-ent-sub" transform="translate(600, 60)">' +
        '<rect x="0" y="0" width="76" height="30" rx="8" fill="#fff" stroke="#56a5a5" stroke-width="1.5"/>' +
        '<text x="38" y="19" text-anchor="middle" font-size="9" fill="#56a5a5" font-family="Poppins, sans-serif" font-weight="600">关键人物</text>' +
      '</g>' +

      /* 追踪脉冲点 */
      '<circle class="about-ent-pulse" r="5" fill="#d97757" filter="url(#entGlow)">' +
        '<animateMotion dur="3.5s" repeatCount="indefinite" path="M500,230 C420,230 260,260 170,300 C140,315 120,335 110,360 M170,300 C220,220 300,160 220,130 C180,110 150,85 140,70 M220,130 C260,120 320,95 300,60 M300,60 C420,60 620,70 700,60 C740,55 770,90 780,130"/>' +
      '</circle>' +

      '<text x="500" y="430" text-anchor="middle" font-size="12" fill="#b0aea5" font-family="Lora, serif">一条线索，可穿透多个分支</text>' +
    '</svg>';
  };

  AboutView.prototype._ctaSection = function () {
    return '<section data-role="about-cta" data-animate>' +
      '<div data-role="about-cta-inner">' +
        '<h2>开始探索时间的地层</h2>' +
        '<p>从一条事件线开始，看见被时间掩埋的关联。</p>' +
        '<div data-role="about-cta-actions">' +
          '<button data-role="about-cta-primary" data-nav="news">浏览事件</button>' +
          '<button data-role="about-cta-secondary" data-nav="home">返回首页</button>' +
        '</div>' +
      '</div>' +
    '</section>';
  };

  AboutView.prototype._footer = function () {
    return '<footer data-role="about-footer">' +
      '<div data-role="about-footer-inner">' +
        '<span>© 2026 事刻 TimeTrace</span>' +
        '<span>在规则中共同创造</span>' +
      '</div>' +
    '</footer>';
  };

  AboutView.prototype._bindEvents = function () {
    var self = this;
    this._el.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        var target = nav.getAttribute('data-nav');
        self.emit('navigate', { target: target });
      }
    });
  };

  AboutView.prototype._initAnimations = function () {
    var self = this;
    var animated = this._el.querySelectorAll('[data-animate]');

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      animated.forEach(function (el) { observer.observe(el); });
    } else {
      animated.forEach(function (el) { el.classList.add('is-visible'); });
    }
  };

  global.TT.AboutView = AboutView;

})(window);
