(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;
  var NodeCard = global.TT.EventNodeCard;
  var Theme = global.TT.ThemeAdapter;

  var ROW_HEIGHT = 56;

  function TimelineColumn(timelineId, mountTarget, timeMapper) {
    Emitter.call(this);

    if (!timelineId || !mountTarget) {
      throw new Error('TimelineColumn: timelineId and mountTarget are required');
    }

    this._timelineId = timelineId;
    this._target = mountTarget;
    this._timeMapper = timeMapper || null;
    this._el = null;
    this._cards = [];
    this._unsubscribers = [];

    this._build();
    this._loadData();
    this._listen();
  }

  TimelineColumn.prototype = Object.create(Emitter.prototype);
  TimelineColumn.prototype.constructor = TimelineColumn;

  TimelineColumn.create = function (timelineId, mountTarget, timeMapper) {
    return new TimelineColumn(timelineId, mountTarget, timeMapper);
  };

  TimelineColumn.prototype._build = function () {
    var el = document.createElement('div');
    el.setAttribute('data-role', 'timeline-column');
    el.setAttribute('data-timeline-id', this._timelineId);

    Theme.applyColumnTheme(el, 'main');

    var header = document.createElement('div');
    header.setAttribute('data-role', 'column-header');

    var title = document.createElement('div');
    title.setAttribute('data-role', 'column-title');

    var meta = document.createElement('span');
    meta.setAttribute('data-role', 'column-meta');

    var closeBtn = document.createElement('button');
    closeBtn.setAttribute('data-role', 'column-close');
    closeBtn.setAttribute('type', 'button');
    closeBtn.textContent = '×';
    closeBtn.style.display = 'none';

    header.appendChild(title);
    header.appendChild(meta);
    header.appendChild(closeBtn);

    var body = document.createElement('div');
    body.setAttribute('data-role', 'column-body');

    el.appendChild(header);
    el.appendChild(body);

    this._target.appendChild(el);
    this._el = el;
    this._headerEl = header;
    this._titleEl = title;
    this._metaEl = meta;
    this._closeBtn = closeBtn;
    this._bodyEl = body;

    var self = this;
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      self.emit('header:close', { timelineId: self._timelineId });
    });
  };

  TimelineColumn.prototype._loadData = function () {
    var store = global.TT.DataStore.getInstance();
    var timeline = store.getTimeline(this._timelineId);

    if (!timeline) {
      this._titleEl.textContent = this._timelineId + ' (not found)';
      return;
    }

    this._titleEl.textContent = timeline.title || timeline.id;
    this._metaEl.textContent = (timeline.nodes || []).length + ' 个事件';

    this._clearCards();

    var self = this;
    var sorted = (timeline.nodes || []).slice().sort(function (a, b) {
      return (a.time || '').localeCompare(b.time || '');
    });

    sorted.forEach(function (entry, index) {
      var nodeData = store.getNode(entry.nodeId);
      if (!nodeData) return;

      var outRelCount = 0;
      (entry.relations || []).forEach(function (rel) {
        if (rel.direction === '→' || rel.direction === 'out') {
          var tgtTl = rel.targetTimelineId || self._timelineId;
          if (tgtTl !== self._timelineId) {
            outRelCount++;
          }
        }
      });

      var cardData = {
        id: entry.nodeId,
        title: nodeData.title || entry.title,
        summary: nodeData.summary || '',
        startTime: nodeData.startTime || entry.time || '',
        importance: nodeData.importance || entry.importance || 'minor',
        relationCount: outRelCount,
        tags: nodeData.tags ? (Array.isArray(nodeData.tags) ? nodeData.tags : Object.keys(nodeData.tags)) : []
      };

      var card = NodeCard.create(cardData);
      self._cards.push(card);

      var cardEl = card.getElement();

      // 统一时间映射：卡片中心锚定到精确 Y 坐标
      // hover 展开时高度变化以中心对称扩展，不影响中心点位置
      if (self._timeMapper) {
        var y = self._timeMapper(entry.time);
        cardEl.style.position = 'absolute';
        cardEl.style.top = y + 'px';
        cardEl.style.left = '18px';
        cardEl.style.right = '18px';
        cardEl.style.transform = 'translateY(-50%)';
      }

      card.on('select', function (ev) {
        self.emit('node:selected', {
          nodeId: ev.nodeId,
          timelineId: self._timelineId,
          nodeEl: ev.nodeEl
        });
      });

      card.on('relation:click', function (ev) {
        self.emit('node:relation-click', {
          nodeId: ev.nodeId,
          timelineId: self._timelineId,
          nodeEl: ev.nodeEl
        });
      });

      card.on('hover', function () {
        self.emit('node:hover', { timelineId: self._timelineId });
      });

      card.on('dblclick', function (ev) {
        self.emit('node:dblclick', {
          nodeId: ev.nodeId,
          timelineId: self._timelineId,
          nodeEl: ev.nodeEl
        });
      });

      self._bodyEl.appendChild(cardEl);
    });

    // 绝对定位模式下，根据最后一个节点位置设置 body 高度
    if (this._timeMapper && sorted.length > 0) {
      var lastTime = sorted[sorted.length - 1].time;
      var lastY = this._timeMapper(lastTime);
      this._bodyEl.style.height = (lastY + 60) + 'px';
    }
  };

  TimelineColumn.prototype._clearCards = function () {
    for (var i = 0; i < this._cards.length; i++) {
      this._cards[i].destroy();
    }
    this._cards = [];
  };

  TimelineColumn.prototype._listen = function () {
    var store = global.TT.DataStore.getInstance();
    var self = this;

    var u1 = store.on('timeline:changed', function (ev) {
      if (ev.timelineId === self._timelineId) {
        self._loadData();
      }
    });
    this._unsubscribers.push(u1);

    var u2 = store.on('node:changed', function (ev) {
      for (var i = 0; i < self._cards.length; i++) {
        if (self._cards[i]._data && self._cards[i]._data.id === ev.nodeId) {
          var updated = store.getNode(ev.nodeId);
          if (updated) {
            var tl = store.getTimeline(self._timelineId);
            var outCount = 0;
            if (tl) {
              var nodeEntry = null;
              for (var j = 0; j < (tl.nodes || []).length; j++) {
                if (tl.nodes[j].nodeId === ev.nodeId) { nodeEntry = tl.nodes[j]; break; }
              }
              if (nodeEntry) {
                (nodeEntry.relations || []).forEach(function (rel) {
                  if (rel.direction === '→' || rel.direction === 'out') {
                    var tgtTl2 = rel.targetTimelineId || self._timelineId;
                    if (tgtTl2 !== self._timelineId) outCount++;
                  }
                });
              }
            }
            self._cards[i].update({
              title: updated.title,
              summary: updated.summary,
              importance: updated.importance,
              relationCount: outCount
            });
          }
          break;
        }
      }
    });
    this._unsubscribers.push(u2);

    var u3 = store.on('node:created', function () {
      self._loadData();
    });
    this._unsubscribers.push(u3);
  };

  TimelineColumn.prototype.refresh = function () {
    this._loadData();
  };

  // 重新定位所有卡片（布局变化时调用，不重建卡片避免闪烁）
  TimelineColumn.prototype.repositionCards = function () {
    if (!this._timeMapper) return;
    for (var i = 0; i < this._cards.length; i++) {
      var card = this._cards[i];
      var cardEl = card.getElement();
      var time = card._data && card._data.startTime;
      if (!time) continue;
      var y = this._timeMapper(time);
      cardEl.style.top = y + 'px';
    }
  };

  TimelineColumn.prototype.getElement = function () {
    return this._el;
  };

  TimelineColumn.prototype.setColumnType = function (type) {
    Theme.applyColumnTheme(this._el, type);
    if (this._closeBtn) {
      if (type === 'main') {
        this._closeBtn.style.display = 'none';
      } else {
        this._closeBtn.style.display = '';
      }
    }
  };

  TimelineColumn.prototype.destroy = function () {
    for (var i = 0; i < this._unsubscribers.length; i++) {
      this._unsubscribers[i]();
    }
    this._unsubscribers = [];

    this._clearCards();

    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._bodyEl = null;
    this._titleEl = null;
    this._headerEl = null;

    Emitter.prototype.destroy.call(this);
  };

  global.TT.TimelineColumn = TimelineColumn;

})(window);
