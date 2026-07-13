(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var TAG_IMAGE_PROMPTS = {
    '里程碑': 'futuristic%20tech%20milestone%2C%20glowing%20achievement%20marker%2C%20deep%20space%20background%2C%20amber%20orange%20light%2C%20cinematic%2C%20abstract',
    '融资': 'financial%20growth%2C%20golden%20rising%20chart%2C%20digital%20currency%2C%20tech%20business%2C%20warm%20yellow%20glow%2C%20abstract',
    '产品发布': 'futuristic%20product%20launch%2C%20glowing%20UI%20interface%2C%20new%20tech%20device%2C%20blue%20accent%20light%2C%20modern%20showcase%2C%20abstract',
    '技术': 'neural%20network%20circuit%2C%20AI%20brain%2C%20green%20tech%20glow%2C%20code%20matrix%2C%20digital%20infrastructure%2C%20abstract',
    '市场': 'market%20data%20visualization%2C%20purple%20violet%20charts%2C%20competitive%20landscape%2C%20business%20analytics%2C%20abstract',
    '合规': 'security%20shield%20checkmark%2C%20cyan%20teal%20glow%2C%20digital%20verification%2C%20legal%20compliance%2C%20abstract',
    '团队': 'diverse%20team%20silhouettes%2C%20pink%20magenta%20light%2C%20collaboration%2C%20modern%20office%2C%20people%20connection%2C%20abstract',
    '增长': 'rocket%20launch%20upward%2C%20exponential%20growth%20curve%2C%20red%20orange%20fire%2C%20user%20increase%2C%20abstract',
    '战略': 'strategic%20roadmap%2C%20chess%20strategy%2C%20compass%20navigation%2C%20brown%20gold%20path%2C%20planning%2C%20abstract',
    '政策': 'scales%20of%20justice%2C%20law%20document%2C%20blue%20grey%20government%2C%20policy%20framework%2C%20abstract',
    'default': 'abstract%20technology%20background%2C%20dark%20blue%20purple%20gradient%2C%20glowing%20particles%2C%20futuristic%2C%20minimal'
  };

  var HERO_BG_PROMPT = 'editorial%20tech%20photography%2C%20warm%20paper%20texture%2C%20soft%20amber%20light%2C%20abstract%20network%20lines%2C%20minimal%20elegant%2C%20magazine%20cover';

  var TAG_COLORS = {
    '里程碑': '#d97757', '融资': '#c4854b', '产品发布': '#6a9bcc',
    '技术': '#788c5d', '市场': '#9b7dc4', '合规': '#56a5a5',
    '团队': '#d4759b', '增长': '#d97757', '战略': '#c4854b',
    '政策': '#7a8fb0', 'default': '#d97757'
  };

  var NAV_ITEMS = [
    { key: 'home', label: '首页', active: true },
    { key: 'news', label: '事件', active: false },
    { key: 'about', label: '关于', active: false }
  ];

  var AUTHOR_NAMES = ['玄宁', '李谋', '洪雨晗', '林亿', '王飞', '张玥玥', '钟文'];
  var AUTHOR_COLORS = ['#5b7a9a', '#9a6a5a', '#7a6a9a', '#5a8a7a', '#9a7a5a', '#b05a7a', '#7a9a5a'];

  function getImageUrl(prompt, size) {
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + prompt + '&image_size=' + (size || 'landscape_4_3');
  }

  function getTagImageUrl(tag) {
    var prompt = TAG_IMAGE_PROMPTS[tag] || TAG_IMAGE_PROMPTS['default'];
    return getImageUrl(prompt, 'landscape_4_3');
  }

  function NewsView(container) {
    Emitter.call(this);
    this._container = container;
    this._el = null;
    this._build();
  }

  NewsView.prototype = Object.create(Emitter.prototype);
  NewsView.prototype.constructor = NewsView;

  NewsView.create = function (container) {
    return new NewsView(container);
  };

  NewsView.prototype._build = function () {
    var root = document.createElement('div');
    root.setAttribute('data-role', 'news-view');
    root.style.display = 'none';

    root.innerHTML =
      '<header data-role="news-topbar">' +
        '<div data-role="news-topbar-left">' +
          '<div data-role="news-logo">' +
            '<div data-role="news-logo-mark"></div>' +
            '<span data-role="news-logo-text">事刻</span>' +
          '</div>' +
          '<nav data-role="news-nav">' +
            NAV_ITEMS.map(function (item) {
              return '<span data-role="news-nav-item" data-key="' + item.key + '"' + (item.active ? ' data-active="true"' : '') + '>' + item.label + '</span>';
            }).join('') +
          '</nav>' +
        '</div>' +
        '<div data-role="news-topbar-right">' +
          '<div data-role="news-search">' +
            '<span data-role="news-search-icon">⌕</span>' +
            '<input data-role="news-search-input" type="text" placeholder="搜索事件、节点、标签">' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<main data-role="news-main">' +
        '<div data-role="news-hero">' +
          '<div data-role="news-hero-featured" data-node-id="">' +
            '<div data-role="news-hero-image"></div>' +
            '<div data-role="news-hero-overlay"></div>' +
            '<div data-role="news-hero-content"></div>' +
          '</div>' +
          '<div data-role="news-hero-subcards"></div>' +
        '</div>' +
        '<div data-role="news-section-title">最新报道</div>' +
        '<div data-role="news-content">' +
          '<div data-role="news-feed"></div>' +
          '<aside data-role="news-sidebar">' +
            '<div data-role="news-sidebar-section">' +
              '<div data-role="news-sidebar-header">' +
                '<span data-role="news-sidebar-title">最新事件</span>' +
                '<span data-role="news-sidebar-more">全部 ›</span>' +
              '</div>' +
              '<div data-role="news-latest-list"></div>' +
            '</div>' +
            '<div data-role="news-sidebar-section">' +
              '<div data-role="news-sidebar-header">' +
                '<span data-role="news-sidebar-title">热门标签</span>' +
              '</div>' +
              '<div data-role="news-tag-cloud"></div>' +
            '</div>' +
            '<div data-role="news-sidebar-section">' +
              '<div data-role="news-sidebar-header">' +
                '<span data-role="news-sidebar-title">事刻热榜</span>' +
                '<span data-role="news-sidebar-more">›</span>' +
              '</div>' +
              '<div data-role="news-hot-list"></div>' +
            '</div>' +
          '</aside>' +
        '</div>' +
        '<footer data-role="news-footer">' +
          '<div data-role="news-footer-left">' +
            '<span>© 2024 事刻 Narrative Engine</span>' +
            '<span data-role="news-footer-link">关于我们</span>' +
            '<span data-role="news-footer-link">工作机会</span>' +
            '<span data-role="news-footer-link">合作伙伴</span>' +
          '</div>' +
          '<span>多维叙事 · 事件成网</span>' +
        '</footer>' +
      '</main>';

    this._el = root;
    this._container.appendChild(root);
    this._bindEvents();
  };

  NewsView.prototype._bindEvents = function () {
    var self = this;

    this._el.addEventListener('click', function (e) {
      var nodeEl = e.target.closest('[data-node-id]');
      if (nodeEl && nodeEl.hasAttribute('data-node-id')) {
        var nodeId = nodeEl.getAttribute('data-node-id');
        if (nodeId && nodeId !== '') {
          self.emit('article:click', { nodeId: nodeId });
        }
        return;
      }

      var navItem = e.target.closest('[data-role="news-nav-item"]');
      if (navItem) {
        var key = navItem.getAttribute('data-key');
        if (key === 'home') {
          self.emit('home:click', {});
        } else if (key === 'about') {
          self.emit('enter:about', {});
        }
        return;
      }

      var logoEl = e.target.closest('[data-role="news-logo"]');
      if (logoEl) {
        self.emit('home:click', {});
        return;
      }
    });
  };

  NewsView.prototype.renderFeed = function () {
    var store = global.TT.DataStore.getInstance();
    var allNodes = store.getAllNodes();
    var sorted = this._sortNodesByTime(allNodes, true);

    this._renderHero(sorted);
    this._renderSubCards(sorted);
    this._renderFeedList(sorted);
    this._renderLatestList(sorted);
    this._renderTagCloud(allNodes);
    this._renderHotList(sorted);
  };

  NewsView.prototype._renderHero = function (sorted) {
    var featuredEl = this._el.querySelector('[data-role="news-hero-featured"]');
    var contentEl = this._el.querySelector('[data-role="news-hero-content"]');
    var imageEl = this._el.querySelector('[data-role="news-hero-image"]');
    if (!featuredEl || !sorted.length) return;

    var featured = sorted[0];
    var tag = (featured.tags && featured.tags[0]) ? featured.tags[0] : '';
    var tagColor = TAG_COLORS[tag] || TAG_COLORS.default;
    var summary = featured.summary || '';
    if (summary && !/[。.!?！？]$/.test(summary)) summary += '。';
    if (summary.length > 90) summary = summary.slice(0, 90) + '…';

    featuredEl.setAttribute('data-node-id', featured.id || '');

    if (imageEl) {
      imageEl.style.backgroundImage = 'url(' + getImageUrl(HERO_BG_PROMPT, 'landscape_16_9') + ')';
    }

    contentEl.innerHTML =
      '<span data-role="news-hero-tag" style="color:' + tagColor + ';">' + this._escape(tag || '精选') + '</span>' +
      '<h2 data-role="news-hero-title">' + this._escape(featured.title) + '</h2>' +
      '<p data-role="news-hero-summary">' + this._escape(summary) + '</p>' +
      '<div data-role="news-hero-meta">' +
        '<span>' + this._formatDate(featured.startTime) + '</span>' +
        '<span data-role="news-hero-meta-dot"></span>' +
        '<span>' + this._escape(tag || '事件') + '</span>' +
      '</div>';
  };

  NewsView.prototype._renderSubCards = function (sorted) {
    var container = this._el.querySelector('[data-role="news-hero-subcards"]');
    if (!container) return;

    var subNodes = sorted.slice(1, 4);
    var html = subNodes.map(function (n) {
      var tag = (n.tags && n.tags[0]) ? n.tags[0] : '事件';
      var tagColor = TAG_COLORS[tag] || TAG_COLORS.default;
      var title = n.title || '';
      if (title.length > 38) title = title.slice(0, 38) + '…';
      return '<div data-role="news-hero-subcard" data-node-id="' + n.id + '">' +
        '<span data-role="news-hero-subcard-tag" style="color:' + tagColor + ';">' + tag + '</span>' +
        '<div data-role="news-hero-subcard-title">' + title + '</div>' +
        '<div data-role="news-hero-subcard-time">' + this._formatDate(n.startTime) + '</div>' +
      '</div>';
    }, this).join('');

    container.innerHTML = html;
  };

  NewsView.prototype._renderFeedList = function (sorted) {
    var container = this._el.querySelector('[data-role="news-feed"]');
    if (!container) return;

    var feedNodes = sorted.slice(3);
    var html = feedNodes.map(function (n, idx) {
      var tag = (n.tags && n.tags[0]) ? n.tags[0] : '事件';
      var tagColor = TAG_COLORS[tag] || TAG_COLORS.default;
      var summary = n.summary || '';
      if (summary.length > 85) summary = summary.slice(0, 85) + '…';
      var isFeatured = idx === 0;
      var thumbImg = getTagImageUrl(tag);

      return '<article data-role="news-feed-item" data-node-id="' + n.id + '"' + (isFeatured ? ' data-featured="true"' : '') + '>' +
        '<div data-role="news-feed-thumb" style="background-image:url(' + thumbImg + ');">' +
          '<span data-role="news-feed-thumb-tag" style="color:' + tagColor + ';">' + tag + '</span>' +
        '</div>' +
        '<div data-role="news-feed-body">' +
          '<h3 data-role="news-feed-title">' + this._escape(n.title) + '</h3>' +
          '<p data-role="news-feed-summary">' + this._escape(summary) + '</p>' +
          '<div data-role="news-feed-meta">' +
            '<span>' + this._formatDate(n.startTime) + '</span>' +
            '<span data-role="news-feed-meta-dot"></span>' +
            '<span>' + this._escape(tag) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }, this).join('');

    container.innerHTML = html;
  };

  NewsView.prototype._renderLatestList = function (sorted) {
    var container = this._el.querySelector('[data-role="news-latest-list"]');
    if (!container) return;

    var items = sorted.slice(0, 5);
    var html = items.map(function (n, idx) {
      var num = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      var title = n.title || '';
      if (title.length > 34) title = title.slice(0, 34) + '…';
      return '<div data-role="news-latest-item" data-node-id="' + n.id + '">' +
        '<span data-role="news-latest-num">' + num + '</span>' +
        '<div data-role="news-latest-info">' +
          '<div data-role="news-latest-time">' + this._formatDate(n.startTime) + '</div>' +
          '<div data-role="news-latest-title">' + this._escape(title) + '</div>' +
        '</div>' +
      '</div>';
    }, this).join('');

    container.innerHTML = html;
  };

  NewsView.prototype._renderTagCloud = function (allNodes) {
    var container = this._el.querySelector('[data-role="news-tag-cloud"]');
    if (!container) return;

    var counts = {};
    allNodes.forEach(function (n) {
      var tags = n.tags || [];
      if (!Array.isArray(tags)) tags = Object.keys(tags);
      tags.forEach(function (t) {
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    var sortedTags = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    }).slice(0, 12);

    var html = sortedTags.map(function (tag) {
      return '<span data-role="news-tag-chip">' + tag + ' <span style="opacity:0.6;">' + counts[tag] + '</span></span>';
    }).join('');

    container.innerHTML = html;
  };

  NewsView.prototype._renderHotList = function (sorted) {
    var container = this._el.querySelector('[data-role="news-hot-list"]');
    if (!container) return;

    var importanceOrder = { breakthrough: 0, important: 1, minor: 2 };
    var hotNodes = sorted.slice().sort(function (a, b) {
      var ia = importanceOrder[a.importance] !== undefined ? importanceOrder[a.importance] : 2;
      var ib = importanceOrder[b.importance] !== undefined ? importanceOrder[b.importance] : 2;
      if (ia !== ib) return ia - ib;
      return (b.startTime || '').localeCompare(a.startTime || '');
    }).slice(0, 6);

    var html = hotNodes.map(function (n, idx) {
      var num = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      var title = n.title || '';
      if (title.length > 34) title = title.slice(0, 34) + '…';
      return '<div data-role="news-hot-item" data-node-id="' + n.id + '">' +
        '<span data-role="news-hot-num">' + num + '</span>' +
        '<span data-role="news-hot-title">' + this._escape(title) + '</span>' +
      '</div>';
    }, this).join('');

    container.innerHTML = html;
  };

  NewsView.prototype._sortNodesByTime = function (nodes, desc) {
    var arr = Array.isArray(nodes) ? nodes.slice() : Object.keys(nodes).map(function (id) { return nodes[id]; });
    arr.sort(function (a, b) {
      var ta = a.startTime || '0000';
      var tb = b.startTime || '0000';
      return desc ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });
    return arr;
  };

  NewsView.prototype._formatDate = function (timeStr) {
    if (!timeStr) return '';
    var parts = timeStr.split('-');
    if (parts.length < 3) return timeStr;
    return parts[0] + '年' + parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
  };

  NewsView.prototype._escape = function (s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(s));
    return div.innerHTML;
  };

  NewsView.prototype.getElement = function () {
    return this._el;
  };

  NewsView.prototype.show = function () {
    if (this._el) this._el.style.display = '';
  };

  NewsView.prototype.hide = function () {
    if (this._el) this._el.style.display = 'none';
  };

  NewsView.prototype.destroy = function () {
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT = global.TT || {};
  global.TT.NewsView = NewsView;

})(window);
