(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var FAMILY_META = {
    'tl-demo-main': {
      desc: '从创立到独角兽，追踪星辰科技四年间的关键转折与里程碑。',
      accent: '#d97757'
    },
    'tl-demo-tech': {
      desc: '微服务、生成引擎、大模型训练，看技术底座如何支撑产品演进。',
      accent: '#6a9bcc'
    },
    'tl-demo-market': {
      desc: '价格战、并购案、监管收紧，四年市场洗牌如何走到终局。',
      accent: '#9b7dc4'
    },
    'tl-demo-team': {
      desc: '从三人创始到二百人团队，组织扩张与激励如何跟上增长。',
      accent: '#788c5d'
    },
    'tl-demo-policy': {
      desc: 'AI生成内容新规出台，合规审计与水印系统如何落地。',
      accent: '#56a5a5'
    },
    'tl-demo-growth': {
      desc: '从首批用户到千万用户，增长曲线背后的关键节点。',
      accent: '#c4854b'
    }
  };

  var TAG_COLORS = {
    '里程碑': '#d97757', '融资': '#c4854b', '产品发布': '#6a9bcc',
    '技术': '#788c5d', '市场': '#9b7dc4', '合规': '#56a5a5',
    '团队': '#d4759b', '增长': '#d97757', '战略': '#c4854b',
    '政策': '#7a8fb0', 'default': '#d97757'
  };

  function LandingView(container) {
    Emitter.call(this);
    this._container = container;
    this._el = null;
    this._canvas = null;
    this._ctx = null;
    this._animationId = null;
    this._particles = [];
    this._build();
  }

  LandingView.prototype = Object.create(Emitter.prototype);
  LandingView.prototype.constructor = LandingView;

  LandingView.create = function (container) {
    return new LandingView(container);
  };

  LandingView.prototype._build = function () {
    var root = document.createElement('div');
    root.setAttribute('data-role', 'landing-view');
    root.style.display = 'none';

    root.innerHTML =
      '<canvas data-role="landing-canvas"></canvas>' +
      '<div data-role="landing-vignette"></div>' +
      '<header data-role="landing-header">' +
        '<div data-role="landing-logo">' +
          '<div data-role="landing-logo-mark"></div>' +
          '<span data-role="landing-logo-text">事刻</span>' +
        '</div>' +
        '<nav data-role="landing-nav">' +
          '<span data-role="landing-nav-item" data-action="news">事件</span>' +
          '<span data-role="landing-nav-item" data-action="about">关于</span>' +
        '</nav>' +
      '</header>' +
      '<section data-role="landing-hero">' +
        '<div data-role="landing-hero-text">' +
          '<span data-role="landing-eyebrow">Narrative Engine</span>' +
          '<h1 data-role="landing-title"><span>事刻</span></h1>' +
          '<p data-role="landing-subtitle">把事件连成线，让时间开口说话。在多维叙事网络中，看见因果、版本、组织与市场如何交织成一幅完整图景。</p>' +
          '<div data-role="landing-hero-actions">' +
            '<button data-role="landing-primary-btn" data-action="news">' +
              '浏览事件' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div data-role="landing-spotlight">' +
          '<div data-role="spotlight-header">精选节点</div>' +
          '<div data-role="spotlight-list"></div>' +
        '</div>' +
      '</section>' +
      '<section data-role="landing-features">' +
        '<div data-role="features-header">' +
          '<span data-role="features-eyebrow">Why 事刻</span>' +
          '<h2 data-role="features-title">不只是时间线，而是事件演化的叙事引擎</h2>' +
        '</div>' +
        '<div data-role="features-grid">' +
          '<div data-role="feature-card">' +
            '<div data-role="feature-icon" style="color:#d97757;">◉</div>' +
            '<h3 data-role="feature-card-title">全局唯一节点</h3>' +
            '<p data-role="feature-card-desc">每个事件都是独立节点，一次创建、多处引用，避免信息在多条时间线中重复与割裂。</p>' +
          '</div>' +
          '<div data-role="feature-card">' +
            '<div data-role="feature-icon" style="color:#6a9bcc;">↔</div>' +
            '<h3 data-role="feature-card-title">跨线关系网络</h3>' +
            '<p data-role="feature-card-desc">事件之间不仅有先后，更有因果、支撑、催化等关系，连线即叙事，点击即聚焦。</p>' +
          '</div>' +
          '<div data-role="feature-card">' +
            '<div data-role="feature-icon" style="color:#788c5d;">◎</div>' +
            '<h3 data-role="feature-card-title">多维事件线</h3>' +
            '<p data-role="feature-card-desc">技术、融资、市场、团队、合规……同一段历史可以按不同维度展开，自由切换视角。</p>' +
          '</div>' +
          '<div data-role="feature-card">' +
            '<div data-role="feature-icon" style="color:#9b7dc4;">✦</div>' +
            '<h3 data-role="feature-card-title">协作共创</h3>' +
            '<p data-role="feature-card-desc">在统一规则框架下，创作者可以因热爱或收益共同完善事件库，让叙事持续生长。</p>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section data-role="landing-bottom">' +
        '<div data-role="landing-families"></div>' +
      '</section>';

    this._el = root;
    this._container.appendChild(root);
    this._setupCanvas();
    this._bindEvents();
  };

  LandingView.prototype._setupCanvas = function () {
    var canvas = this._el.querySelector('[data-role="landing-canvas"]');
    if (!canvas) return;
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._resizeCanvas();
    this._initParticles();
    this._startAnimation();

    var self = this;
    window.addEventListener('resize', function () {
      self._resizeCanvas();
      self._initParticles();
    });
  };

  LandingView.prototype._resizeCanvas = function () {
    if (!this._canvas) return;
    var dpr = window.devicePixelRatio || 1;
    this._canvas.width = window.innerWidth * dpr;
    this._canvas.height = window.innerHeight * dpr;
    this._canvas.style.width = window.innerWidth + 'px';
    this._canvas.style.height = window.innerHeight + 'px';
    if (this._ctx) this._ctx.scale(dpr, dpr);
  };

  LandingView.prototype._initParticles = function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var count = Math.min(120, Math.floor((w * h) / 14000));
    this._particles = [];

    for (var i = 0; i < count; i++) {
      this._particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.4 + 0.15
      });
    }
  };

  LandingView.prototype._startAnimation = function () {
    var self = this;
    function loop() {
      self._drawParticles();
      self._animationId = requestAnimationFrame(loop);
    }
    loop();
  };

  LandingView.prototype._drawParticles = function () {
    if (!this._ctx || !this._canvas) return;
    var ctx = this._ctx;
    var w = window.innerWidth;
    var h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    var accent = '#d97757';
    var secondary = '#6a9bcc';
    var muted = '#b0aea5';

    for (var i = 0; i < this._particles.length; i++) {
      var p = this._particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = muted;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    var connectDist = 150;
    var maxConnections = 4;

    for (var a = 0; a < this._particles.length; a++) {
      var pa = this._particles[a];
      var connections = 0;
      for (var b = a + 1; b < this._particles.length; b++) {
        if (connections >= maxConnections) break;
        var pb = this._particles[b];
        var dx = pa.x - pb.x;
        var dy = pa.y - pb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectDist) {
          var opacity = (1 - dist / connectDist) * 0.22;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = accent;
          ctx.globalAlpha = opacity;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          connections++;
        }
      }
    }

    ctx.globalAlpha = 1;
  };

  LandingView.prototype._stopAnimation = function () {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  };

  LandingView.prototype.render = function () {
    this._renderFamilies();
    this._renderSpotlight();
  };

  LandingView.prototype._renderFamilies = function () {
    var store = global.TT.DataStore.getInstance();
    var timelines = store.getAllTimelines();
    var container = this._el.querySelector('[data-role="landing-families"]');
    if (!container) return;

    var html = timelines.map(function (tl) {
      var meta = FAMILY_META[tl.id] || { desc: '探索这条时间线中的事件网络。', accent: '#d97757' };
      var count = (tl.nodes || []).length;
      var start = count ? tl.nodes[0].time : '';
      var end = count ? tl.nodes[count - 1].time : '';
      var range = start && end ? start.slice(0, 4) + '–' + end.slice(0, 4) : '';

      return '<div data-role="landing-family-card" data-timeline-id="' + tl.id + '">' +
        '<div data-role="family-meta">Timeline · ' + range + '</div>' +
        '<div data-role="family-title">' + tl.title + '</div>' +
        '<div data-role="family-desc">' + meta.desc + '</div>' +
        '<div data-role="family-stats">' +
          '<span data-role="family-dot" style="background:' + meta.accent + ';"></span>' +
          '<span>' + count + ' 个节点</span>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  };

  LandingView.prototype._renderSpotlight = function () {
    var store = global.TT.DataStore.getInstance();
    var allNodes = store.getAllNodes();
    var sorted = allNodes.slice().sort(function (a, b) {
      var ta = a.startTime || '0000';
      var tb = b.startTime || '0000';
      return tb.localeCompare(ta);
    });

    var spotlight = [];
    var importanceOrder = { breakthrough: 0, important: 1, minor: 2 };
    var sortedByImportance = allNodes.slice().sort(function (a, b) {
      var ia = importanceOrder[a.importance] !== undefined ? importanceOrder[a.importance] : 2;
      var ib = importanceOrder[b.importance] !== undefined ? importanceOrder[b.importance] : 2;
      return ia - ib;
    });

    for (var i = 0; i < sortedByImportance.length && spotlight.length < 4; i++) {
      var n = sortedByImportance[i];
      if (n.importance === 'breakthrough' || n.importance === 'important') {
        spotlight.push(n);
      }
    }

    var container = this._el.querySelector('[data-role="spotlight-list"]');
    if (!container) return;

    var html = spotlight.map(function (n) {
      var tag = (n.tags && n.tags[0]) ? n.tags[0] : '事件';
      var tagColor = TAG_COLORS[tag] || TAG_COLORS.default;
      return '<div data-role="spotlight-item" data-node-id="' + n.id + '">' +
        '<div data-role="spotlight-time">' + (n.startTime || '') + '</div>' +
        '<div data-role="spotlight-title">' + n.title + '</div>' +
        '<span data-role="spotlight-tag" style="background:' + tagColor + '15;color:' + tagColor + ';">' + tag + '</span>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  };

  LandingView.prototype._bindEvents = function () {
    var self = this;

    this._el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (btn) {
        var action = btn.getAttribute('data-action');
        if (action === 'news') {
          self.emit('enter:news');
        } else if (action === 'about') {
          self.emit('enter:about');
        }
        return;
      }

      var card = e.target.closest('[data-timeline-id]');
      if (card) {
        self.emit('enter:news');
        return;
      }

      var item = e.target.closest('[data-node-id]');
      if (item) {
        self.emit('node:click', { nodeId: item.getAttribute('data-node-id') });
      }
    });
  };

  LandingView.prototype.show = function () {
    if (this._el) {
      this._el.style.display = '';
      this._startAnimation();
    }
  };

  LandingView.prototype.hide = function () {
    if (this._el) {
      this._el.style.display = 'none';
      this._stopAnimation();
    }
  };

  LandingView.prototype.destroy = function () {
    this._stopAnimation();
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._canvas = null;
    this._ctx = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT = global.TT || {};
  global.TT.LandingView = LandingView;

})(window);
