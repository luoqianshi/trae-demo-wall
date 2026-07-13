(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var TAG_COLORS = {
    '里程碑': '#ff5a3c', '融资': '#e5a645', '产品发布': '#5b9bd5',
    '技术': '#70ad6c', '市场': '#9b7dc4', '合规': '#56a5a5',
    '团队': '#d4759b', '增长': '#ff5a3c', '战略': '#c4895a',
    '政策': '#7a8fb0', 'default': '#ff5a3c'
  };

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

  var DETAIL_HERO_PROMPT = 'dark%20matter%20museum%2C%20deep%20space%20nebula%2C%20glowing%20cosmic%20web%2C%20dramatic%20lighting%2C%20cinematic%2C%20abstract%20tech%20hero';

  function getImageUrl(prompt, size) {
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + prompt + '&image_size=' + (size || 'landscape_4_3');
  }

  function getTagImageUrl(tag) {
    var prompt = TAG_IMAGE_PROMPTS[tag] || TAG_IMAGE_PROMPTS['default'];
    return getImageUrl(prompt, 'landscape_4_3');
  }

  var IMPORTANCE_LABELS = {
    'breakthrough': '里程碑事件',
    'important': '重要事件',
    'minor': '动态'
  };

  var AUTHOR_NAMES = ['玄宁', '李谋', '洪雨晗', '林亿', '王飞', '张玥玥', '钟文'];
  var AUTHOR_COLORS = ['#5b7a9a', '#9a6a5a', '#7a6a9a', '#5a8a7a', '#9a7a5a', '#b05a7a', '#7a9a5a'];

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(s));
    return div.innerHTML;
  }

  function formatDate(timeStr) {
    if (!timeStr) return '';
    var parts = timeStr.split('-');
    if (parts.length < 3) return timeStr;
    return parts[0] + '年' + parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
  }

  function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function buildContentHtml(node) {
    var content = node.content || node.summary || '';
    var paragraphs = content.split(/\n\n|\n/).filter(function (p) { return p.trim().length > 0; });
    if (paragraphs.length < 3) {
      paragraphs = [
        node.summary || '',
        '这是时间长河中的一个关键节点，它的发生与前后诸多事件相互关联，共同构成了我们所见证的历史脉络。每一个节点都不是孤立存在的，它们在时间的长河中彼此呼应、相互影响。',
        '技术演进、市场变化、政策调整、团队成长——这些看似独立的线索，在时间的编织下形成了错综复杂的因果网络。当我们站在更高的维度审视，就能看到隐藏在事件背后的叙事逻辑。',
        '事刻以时间线为骨架，以关联关系为脉络，将碎片化的信息重新组织成可交互的叙事地图。在这里，你不仅能看到单个事件的全貌，更能理解它在整个故事中的位置与意义。',
        '点击下方「查看事件线脉络」按钮，进入沉浸式叙事视图，探索事件之间的深层联系。'
      ];
    }
    var html = '';
    paragraphs.forEach(function (p, i) {
      if (i === 0) html += '<p data-role="detail-lead">' + p + '</p>';
      else html += '<p>' + p + '</p>';
    });
    html += '<blockquote data-role="detail-quote">' +
      '<span data-role="quote-mark">"</span>' +
      '在时间的坐标系中，每一个事件都是一个坐标点，而事刻帮你把这些点连成线。' +
      '</blockquote>';
    return html;
  }

  // 静态方法：构建 article HTML（可复用于详情页和弹窗）
  EventDetailView.buildArticleHTML = function (nodeId, includeCTA) {
    var store = global.TT.DataStore.getInstance();
    var node = store.getNode(nodeId);
    if (!node) return '';

    var tag = (node.tags && node.tags[0]) ? node.tags[0] : '';
    var tagColor = TAG_COLORS[tag] || TAG_COLORS.default;
    var badgeLabel = IMPORTANCE_LABELS[node.importance] || '事件';

    var tagsHtml = '';
    if (node.tags) {
      var tagList = Array.isArray(node.tags) ? node.tags : Object.keys(node.tags);
      tagsHtml = tagList.map(function (t) {
        var tc = TAG_COLORS[t] || TAG_COLORS.default;
        return '<span data-role="detail-tag" style="background:' + tc + '15;color:' + tc + ';">#' + escapeHtml(t) + '</span>';
      }).join('');
    }

    var contentHtml = buildContentHtml(node);
    var dateStr = formatDate(node.startTime);
    var authorIdx = hashCode(node.id || '') % AUTHOR_NAMES.length;
    var authorName = AUTHOR_NAMES[authorIdx];
    var authorColor = AUTHOR_COLORS[authorIdx];

    var heroImgUrl = getImageUrl(DETAIL_HERO_PROMPT, 'landscape_16_9');

    var html =
      '<article data-role="detail-article">' +
        '<div data-role="detail-hero" style="background-image:url(' + heroImgUrl + ');background-size:cover;background-position:center;">' +
          '<div data-role="detail-hero-overlay" style="position:absolute;inset:0;background:linear-gradient(135deg,' + tagColor + 'dd 0%,' + tagColor + '66 50%,rgba(10,10,20,0.85) 100%);"></div>' +
          '<div data-role="detail-hero-content">' +
            '<span data-role="detail-hero-badge" style="background:rgba(255,255,255,0.2);backdrop-filter:blur(4px);">' + badgeLabel + '</span>' +
            '<h1 data-role="detail-title">' + escapeHtml(node.title) + '</h1>' +
            '<p data-role="detail-summary">' + escapeHtml(node.summary || '') + '</p>' +
            '<div data-role="detail-meta">' +
              '<span data-role="detail-author-avatar" style="background:' + authorColor + ';">' + authorName.charAt(0) + '</span>' +
              '<span data-role="detail-author-name">' + authorName + '</span>' +
              '<span data-role="detail-dot">·</span>' +
              '<span data-role="detail-time">' + dateStr + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div data-role="detail-body">' +
          '<div data-role="detail-tags">' + tagsHtml + '</div>' +
          '<div data-role="detail-content">' + contentHtml + '</div>';

    if (includeCTA) {
      html +=
          '<div data-role="detail-cta-section">' +
            '<div data-role="cta-hint">想了解这个事件在完整叙事中的位置？</div>' +
            '<button data-role="detail-timeline-btn">' +
              '<span data-role="cta-icon">◉</span>' +
              '查看事件线脉络 →' +
            '</button>' +
            '<div data-role="cta-desc">以时间为轴，以关系为线，探索事件之间的深层联系</div>' +
          '</div>';
    }

    html +=
        '</div>' +
      '</article>';

    return html;
  };

  var TOP_NAV_ITEMS = [
    { key: 'home', label: '首页' },
    { key: 'news', label: '事件' },
    { key: 'canvas', label: '星图' }
  ];

  function EventDetailView(container) {
    Emitter.call(this);
    this._container = container;
    this._el = null;
    this._nodeId = null;
    this._build();
  }

  EventDetailView.prototype = Object.create(Emitter.prototype);
  EventDetailView.prototype.constructor = EventDetailView;

  EventDetailView.create = function (container) {
    return new EventDetailView(container);
  };

  EventDetailView.prototype._build = function () {
    var root = document.createElement('div');
    root.setAttribute('data-role', 'detail-view');
    root.style.display = 'none';
    this._el = root;
    this._container.appendChild(root);
    this._bindEvents();
  };

  EventDetailView.prototype.show = function (nodeId) {
    this._nodeId = nodeId;
    this._render();
    this._el.style.display = '';
    window.scrollTo(0, 0);
  };

  EventDetailView.prototype.hide = function () {
    this._el.style.display = 'none';
    this._nodeId = null;
  };

  EventDetailView.prototype._render = function () {
    var self = this;
    var store = global.TT.DataStore.getInstance();
    var node = store.getNode(this._nodeId);
    if (!node) {
      this._el.innerHTML = '<div style="padding:80px;text-align:center;color:#888;">事件不存在</div>';
      return;
    }

    var allNodes = store.getAllNodes();
    var sorted = Object.keys(allNodes).map(function (id) { return allNodes[id]; })
      .filter(function (n) { return n.id !== self._nodeId; })
      .sort(function (a, b) { return (b.startTime || '').localeCompare(a.startTime || ''); });
    var related = sorted.slice(0, 3);
    var latest = sorted.slice(0, 5);

    var articleHtml = EventDetailView.buildArticleHTML(this._nodeId, true);

    var relatedHtml = related.map(function (n, idx) {
      var rTag = (n.tags && n.tags[0]) ? n.tags[0] : '';
      var rColor = TAG_COLORS[rTag] || TAG_COLORS.default;
      var rThumb = getTagImageUrl(rTag);
      return '<div data-role="related-item" data-node-id="' + n.id + '">' +
        '<div data-role="related-thumb" style="background-image:url(' + rThumb + ');background-size:cover;background-position:center;"></div>' +
        '<div data-role="related-info">' +
          '<h4 data-role="related-item-title">' + self._escape(n.title) + '</h4>' +
          '<span data-role="related-item-meta">' + self._formatDate(n.startTime) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    var latestHtml = latest.map(function (n, idx) {
      var title = n.title || '';
      if (title.length > 22) title = title.slice(0, 22) + '…';
      var dotColor = idx === 0 ? '#ff5a3c' : '#ccc';
      var timeLabel = self._formatTimeShort(n.startTime);
      return '<div data-role="latest-item" data-node-id="' + n.id + '">' +
        '<span data-role="latest-dot" style="background:' + dotColor + ';"></span>' +
        '<div data-role="latest-info">' +
          '<div data-role="latest-time">' + timeLabel + '</div>' +
          '<div data-role="latest-title">' + self._escape(title) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var hotHtml = sorted.slice(0, 6).map(function (n, idx) {
      var title = n.title || '';
      if (title.length > 18) title = title.slice(0, 18) + '…';
      var numColor = idx < 3 ? '#ff5a3c' : '#999';
      var num = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      return '<div data-role="hot-item" data-node-id="' + n.id + '">' +
        '<span data-role="hot-num" style="color:' + numColor + ';">' + num + '</span>' +
        '<span data-role="hot-title">' + self._escape(title) + '</span>' +
      '</div>';
    }).join('');

    var dateStr = formatDate(node.startTime);
    var authorIdx = hashCode(node.id || '') % AUTHOR_NAMES.length;
    var authorName = AUTHOR_NAMES[authorIdx];
    var authorColor = AUTHOR_COLORS[authorIdx];

    this._el.innerHTML =
      '<div data-role="app-root">' +
        '<header data-role="top-nav">' + this._renderTopNav() + '</header>' +
        '<div data-role="body-wrap">' +
          '<main data-role="main-content">' +
            '<div data-role="detail-breadcrumb">' +
              '<a data-role="breadcrumb-back" href="javascript:;">← 返回首页</a>' +
            '</div>' +
            articleHtml +
            '<section data-role="related-section">' +
              '<h3 data-role="related-header">相关推荐</h3>' +
              '<div data-role="related-list">' + relatedHtml + '</div>' +
            '</section>' +
          '</main>' +
          '<aside data-role="right-sidebar">' +
            '<div data-role="right-widget">' +
              '<div data-role="widget-header">' +
                '<h4 data-role="widget-title">最新事件</h4>' +
              '</div>' +
              '<div data-role="latest-list">' + latestHtml + '</div>' +
            '</div>' +
            '<div data-role="right-widget">' +
              '<div data-role="widget-header">' +
                '<h4 data-role="widget-title">事刻热榜</h4>' +
              '</div>' +
              '<div data-role="hot-list">' + hotHtml + '</div>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>';

    this._bindDetailEvents();
  };

  EventDetailView.prototype._renderTopNav = function () {
    return '' +
      '<div data-role="top-logo" data-key="home">' +
        '<span data-role="top-logo-mark"></span>' +
        '<span data-role="top-logo-text">事刻</span>' +
      '</div>' +
      '<nav data-role="top-tabs">' +
        TOP_NAV_ITEMS.map(function (item) {
          return '<div data-role="top-tab" data-key="' + item.key + '">' + item.label + '</div>';
        }).join('') +
      '</nav>';
  };

  EventDetailView.prototype._buildContent = function (node) {
    var content = node.content || node.summary || '';
    var paragraphs = content.split(/\n\n|\n/).filter(function (p) { return p.trim().length > 0; });
    if (paragraphs.length < 3) {
      paragraphs = [
        node.summary || '',
        '这是时间长河中的一个关键节点，它的发生与前后诸多事件相互关联，共同构成了我们所见证的历史脉络。每一个节点都不是孤立存在的，它们在时间的长河中彼此呼应、相互影响。',
        '技术演进、市场变化、政策调整、团队成长——这些看似独立的线索，在时间的编织下形成了错综复杂的因果网络。当我们站在更高的维度审视，就能看到隐藏在事件背后的叙事逻辑。',
        '事刻以时间线为骨架，以关联关系为脉络，将碎片化的信息重新组织成可交互的叙事地图。在这里，你不仅能看到单个事件的全貌，更能理解它在整个故事中的位置与意义。',
        '点击下方「查看事件线脉络」按钮，进入沉浸式叙事视图，探索事件之间的深层联系。'
      ];
    }

    var html = '';
    paragraphs.forEach(function (p, i) {
      if (i === 0) {
        html += '<p data-role="detail-lead">' + p + '</p>';
      } else {
        html += '<p>' + p + '</p>';
      }
    });

    html += '<blockquote data-role="detail-quote">' +
      '<span data-role="quote-mark">"</span>' +
      '在时间的坐标系中，每一个事件都是一个坐标点，而事刻帮你把这些点连成线。' +
      '</blockquote>';

    return html;
  };

  EventDetailView.prototype._bindEvents = function () {
    var self = this;
    this._el.addEventListener('click', function (e) {
      var backLink = e.target.closest('[data-role="breadcrumb-back"]');
      if (backLink) {
        e.preventDefault();
        self.emit('back', {});
        return;
      }
      var ctaBtn = e.target.closest('[data-role="detail-timeline-btn"]');
      if (ctaBtn) {
        self.emit('timeline:click', { nodeId: self._nodeId });
        return;
      }
      var relatedItem = e.target.closest('[data-role="related-item"]');
      if (relatedItem) {
        var rid = relatedItem.getAttribute('data-node-id');
        if (rid) {
          self.emit('article:click', { nodeId: rid });
          self.show(rid);
        }
        return;
      }
      var latestItem = e.target.closest('[data-role="latest-item"],[data-role="hot-item"]');
      if (latestItem) {
        var lid = latestItem.getAttribute('data-node-id');
        if (lid && lid !== self._nodeId) {
          self.emit('article:click', { nodeId: lid });
          self.show(lid);
        }
      }
      var sidebarItem = e.target.closest('[data-role="sidebar-item"]');
      if (sidebarItem) {
        var key = sidebarItem.getAttribute('data-key');
        if (key === 'news' || key === 'home') {
          self.emit('back', {});
        }
      }
      var topTab = e.target.closest('[data-role="top-tab"],[data-role="top-logo"]');
      if (topTab) {
        var tkey = topTab.getAttribute('data-key');
        if (tkey === 'home' || tkey === 'news') {
          self.emit('back', {});
        } else if (tkey === 'canvas') {
          self.emit('canvas:click', { nodeId: self._nodeId });
        }
      }
    });
  };

  EventDetailView.prototype._bindDetailEvents = function () {
  };

  EventDetailView.prototype._formatDate = function (timeStr) {
    if (!timeStr) return '';
    var parts = timeStr.split('-');
    if (parts.length < 3) return timeStr;
    return parts[0] + '年' + parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
  };

  EventDetailView.prototype._formatTimeShort = function (timeStr) {
    if (!timeStr) return '';
    var now = new Date();
    var d = new Date(timeStr);
    var diffMs = now - d;
    var days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return '今天';
    if (days < 30) return days + '天前';
    if (days < 365) return Math.floor(days / 30) + '个月前';
    return Math.floor(days / 365) + '年前';
  };

  EventDetailView.prototype._hashCode = function (str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  EventDetailView.prototype._escape = function (s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(s));
    return div.innerHTML;
  };

  EventDetailView.prototype.getElement = function () {
    return this._el;
  };

  EventDetailView.prototype.destroy = function () {
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT = global.TT || {};
  global.TT.EventDetailView = EventDetailView;

})(window);
