(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;
  var Theme = global.TT.ThemeAdapter;

  function EventNodeCard(data) {
    Emitter.call(this);
    this._data = data;
    this._el = null;
    this._importance = data.importance || 'minor';
    this._relationCount = data.relationCount || 0;
    this._build();
  }

  EventNodeCard.prototype = Object.create(Emitter.prototype);
  EventNodeCard.prototype.constructor = EventNodeCard;

  EventNodeCard.create = function (data) {
    return new EventNodeCard(data);
  };

  EventNodeCard.prototype._build = function () {
    var el = document.createElement('div');
    el.setAttribute('data-role', 'node-card');
    el.setAttribute('data-node-id', this._data.id);
    el.setAttribute('data-time', this._data.startTime || '');

    var isMajor = this._importance === 'breakthrough';
    var themeState = {
      mode: 'view'
    };

    Theme.applyNodeTheme(el, { importance: this._importance }, themeState);
    el.classList.add('tt-card--' + (isMajor ? 'major' : 'normal'));

    // 左侧边线中间：关联数量提示
    var relDot = document.createElement('span');
    relDot.setAttribute('data-role', 'node-relations');
    relDot.className = 'tt-rel-dot';
    if (this._relationCount > 0) {
      relDot.textContent = this._relationCount;
    } else {
      relDot.classList.add('tt-rel-dot--empty');
      relDot.textContent = '0';
    }
    el.appendChild(relDot);

    // 右侧边线中间：重要性圆环
    var ring = document.createElement('span');
    ring.setAttribute('data-role', 'node-importance');
    ring.className = 'tt-imp-ring tt-imp-ring--' + this._importance;
    el.appendChild(ring);

    var header = document.createElement('div');
    header.setAttribute('data-role', 'node-header');

    var title = document.createElement('span');
    title.setAttribute('data-role', 'node-title');
    title.className = 'tt-node-title';
    title.textContent = this._data.title;
    header.appendChild(title);

    el.appendChild(header);

    var expand = document.createElement('div');
    expand.setAttribute('data-role', 'node-expand');
    expand.className = 'tt-node-expand';

    if (this._data.summary) {
      var desc = document.createElement('p');
      desc.setAttribute('data-role', 'node-desc');
      desc.className = 'tt-node-desc';
      desc.textContent = this._data.summary;
      expand.appendChild(desc);
    }

    var meta = document.createElement('div');
    meta.setAttribute('data-role', 'node-meta');
    meta.className = 'tt-node-meta';

    if (this._data.startTime) {
      var date = document.createElement('span');
      date.setAttribute('data-role', 'node-date');
      date.className = 'tt-node-date';
      date.textContent = this._data.startTime;
      meta.appendChild(date);
    }

    if (this._data.tags && this._data.tags.length > 0) {
      var tags = document.createElement('div');
      tags.setAttribute('data-role', 'node-tags');
      tags.className = 'tt-node-tags';
      this._data.tags.forEach(function (t) {
        var tag = document.createElement('span');
        tag.className = 'tt-tag tt-tag--' + t;
        tag.textContent = t;
        if (t === '产品发布') tag.classList.add('tt-tag--product');
        else if (t === '融资') tag.classList.add('tt-tag--funding');
        else if (t === '战略') tag.classList.add('tt-tag--strategy');
        else if (t === '政策' || t === '合规') tag.classList.add('tt-tag--policy');
        else if (t.indexOf('v') === 0) tag.classList.add('tt-tag--version');
        tags.appendChild(tag);
      });
      meta.appendChild(tags);
    }

    expand.appendChild(meta);
    el.appendChild(expand);

    this._bindEvents(el);
    this._el = el;
  };

  EventNodeCard.prototype._bindEvents = function (el) {
    var self = this;

    el.addEventListener('click', function () {
      self.emit('select', { nodeId: self._data.id, nodeEl: el });
    });

    el.addEventListener('dblclick', function () {
      self.emit('dblclick', { nodeId: self._data.id, nodeEl: el });
    });

    // 关联圆点：独立点击，阻止冒泡，不触发卡片 select
    var relDot = el.querySelector('[data-role="node-relations"]');
    if (relDot) {
      relDot.style.cursor = 'pointer';
      relDot.addEventListener('click', function (e) {
        e.stopPropagation();
        self.emit('relation:click', { nodeId: self._data.id, nodeEl: el });
      });
    }

    el.addEventListener('mouseenter', function () {
      self.emit('hover', { nodeId: self._data.id, nodeEl: el, active: true });
    });

    el.addEventListener('mouseleave', function () {
      self.emit('hover', { nodeId: self._data.id, nodeEl: el, active: false });
    });
  };

  EventNodeCard.prototype.getElement = function () {
    return this._el;
  };

  EventNodeCard.prototype.update = function (changes) {
    var self = this;
    Object.keys(changes).forEach(function (key) {
      self._data[key] = changes[key];
    });

    if (changes.title) {
      this._el.querySelector('[data-role="node-title"]').textContent = changes.title;
    }
    if (changes.summary) {
      this._el.querySelector('[data-role="node-desc"]').textContent = changes.summary;
    }
    if (changes.importance) {
      this._importance = changes.importance;
      var ring = this._el.querySelector('[data-role="node-importance"]');
      ring.className = 'tt-imp-ring tt-imp-ring--' + this._importance;
      Theme.applyNodeTheme(this._el, { importance: this._importance }, { mode: 'view' });
      var isMajor = this._importance === 'breakthrough';
      this._el.classList.toggle('tt-card--major', isMajor);
      this._el.classList.toggle('tt-card--normal', !isMajor);
    }
    if (changes.relationCount !== undefined) {
      this._relationCount = changes.relationCount;
      var relEl = this._el.querySelector('[data-role="node-relations"]');
      relEl.textContent = this._relationCount;
      relEl.classList.toggle('tt-rel-dot--empty', this._relationCount === 0);
    }
  };

  EventNodeCard.prototype.destroy = function () {
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._data = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT.EventNodeCard = EventNodeCard;

})(window);
