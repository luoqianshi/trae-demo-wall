(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  function TimeAxis(stageEl, mainTimelineId, getZoomFn) {
    Emitter.call(this);

    this._stageEl = stageEl;
    this._mainTlId = mainTimelineId;
    this._getZoom = getZoomFn || (function () { return 1; });
    this._el = null;
    this._tickEls = [];
    this._unsubscribers = [];
    this._focusChainMap = null;
    this._previewChainMap = null;

    this._build();
    this._listen();
  }

  TimeAxis.prototype = Object.create(Emitter.prototype);
  TimeAxis.prototype.constructor = TimeAxis;

  TimeAxis.create = function (stageEl, mainTimelineId, getZoomFn) {
    return new TimeAxis(stageEl, mainTimelineId, getZoomFn);
  };

  TimeAxis.prototype._build = function () {
    var el = document.createElement('div');
    el.setAttribute('data-role', 'time-axis');
    el.style.cssText = 'flex-shrink:0;width:64px;position:relative;';

    this._stageEl.insertBefore(el, this._stageEl.firstChild);
    this._el = el;

    var self = this;
    requestAnimationFrame(function () { self.render(); });
  };

  // 收集所有已显示列的时间点
  TimeAxis.prototype._gatherUniqueTimes = function () {
    var store = global.TT.DataStore.getInstance();
    var columns = this._stageEl.querySelectorAll('[data-role="timeline-column"]');
    var times = [];

    columns.forEach(function (col) {
      var tlId = col.getAttribute('data-timeline-id');
      var tl = store.getTimeline(tlId);
      if (!tl) return;
      (tl.nodes || []).forEach(function (tn) {
        if (tn.time) times.push(tn.time);
      });
    });

    var unique = times.filter(function (t, i, arr) { return arr.indexOf(t) === i; });
    unique.sort();
    return unique;
  };

  // 按时间找到对应的卡片（跨列查找，以靠前的列优先）
  TimeAxis.prototype._getCardMidYFromTime = function (timeStr) {
    var columns = this._stageEl.querySelectorAll('[data-role="timeline-column"]');
    for (var i = 0; i < columns.length; i++) {
      var card = columns[i].querySelector('[data-role="node-card"][data-time="' + timeStr + '"]');
      if (card) return this._getCardMidY(card);
    }
    return null;
  };

  TimeAxis.prototype._getCardMidY = function (card) {
    if (!card) return null;
    var zoom = this._getZoom();
    if (zoom <= 0) zoom = 1;
    var cardRect = card.getBoundingClientRect();
    var colRect = card.closest('[data-role="timeline-column"]').getBoundingClientRect();
    return (cardRect.top + cardRect.height / 2 - colRect.top) / zoom;
  };

  TimeAxis.prototype.render = function () {
    var el = this._el;
    while (el.firstChild) el.removeChild(el.firstChild);
    this._tickEls = [];

    var times = this._gatherUniqueTimes();
    if (times.length === 0) return;

    var self = this;
    times.forEach(function (timeStr) {
      var midY = self._getCardMidYFromTime(timeStr);
      if (midY === null) return;

      var dateStr = timeStr || '';
      var parts = dateStr.split('-');
      var displayDate = parts.length >= 2 ? parts[0] + '.' + parts[1] : dateStr;

      var tick = document.createElement('div');
      tick.setAttribute('data-role', 'time-tick');
      tick.setAttribute('data-time', timeStr);

      var dot = document.createElement('div');
      dot.setAttribute('data-role', 'time-dot');

      var label = document.createElement('span');
      label.setAttribute('data-role', 'time-label');
      label.textContent = displayDate;

      tick.appendChild(dot);
      tick.appendChild(label);
      el.appendChild(tick);
      self._tickEls.push(tick);

      tick.style.position = 'absolute';
      tick.style.left = '8px';
      tick.style.top = midY + 'px';
    });

    if (this._focusChainMap) {
      this._applyChainClasses(this._focusChainMap);
    } else if (this._previewChainMap) {
      this._applyChainClasses(this._previewChainMap);
    }
  };

  TimeAxis.prototype._buildTimeSetFromChain = function (chainMap) {
    var store = global.TT.DataStore.getInstance();
    var times = {};
    if (!chainMap) return times;
    var nodeIds = Object.keys(chainMap);
    for (var i = 0; i < nodeIds.length; i++) {
      var node = store.getNode(nodeIds[i]);
      if (node && node.startTime) {
        times[node.startTime] = true;
      }
    }
    return times;
  };

  TimeAxis.prototype._applyChainClasses = function (chainMap) {
    var timeSet = this._buildTimeSetFromChain(chainMap);
    var ticks = this._el ? this._el.querySelectorAll('[data-role="time-tick"]') : [];
    for (var i = 0; i < ticks.length; i++) {
      var tick = ticks[i];
      var t = tick.getAttribute('data-time');
      if (timeSet[t]) {
        tick.classList.remove('tt-focus-dim');
        tick.classList.add('tt-focus-highlight');
      } else {
        tick.classList.remove('tt-focus-highlight');
        tick.classList.add('tt-focus-dim');
      }
    }
  };

  TimeAxis.prototype._clearChainClasses = function () {
    var ticks = this._el ? this._el.querySelectorAll('[data-role="time-tick"]') : [];
    for (var i = 0; i < ticks.length; i++) {
      ticks[i].classList.remove('tt-focus-dim', 'tt-focus-highlight');
    }
  };

  TimeAxis.prototype.setFocusChain = function (chainMap) {
    this._focusChainMap = chainMap || null;
    this._previewChainMap = null;
    if (this._focusChainMap) {
      this._applyChainClasses(this._focusChainMap);
    } else {
      this._clearChainClasses();
    }
  };

  TimeAxis.prototype.setPreviewChain = function (chainMap) {
    if (this._focusChainMap) return;
    this._previewChainMap = chainMap || null;
    if (this._previewChainMap) {
      this._applyChainClasses(this._previewChainMap);
    } else {
      this._clearChainClasses();
    }
  };

  TimeAxis.prototype._listen = function () {
    var store = global.TT.DataStore.getInstance();
    var self = this;

    var u1 = store.on('timeline:changed', function () {
      requestAnimationFrame(function () { self.render(); });
    });
    this._unsubscribers.push(u1);

    var u2 = store.on('data:loaded', function () {
      requestAnimationFrame(function () { self.render(); });
    });
    this._unsubscribers.push(u2);
  };

  TimeAxis.prototype.getElement = function () {
    return this._el;
  };

  TimeAxis.prototype.destroy = function () {
    for (var i = 0; i < this._unsubscribers.length; i++) {
      this._unsubscribers[i]();
    }
    this._unsubscribers = [];

    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._tickEls = [];

    Emitter.prototype.destroy.call(this);
  };

  global.TT.TimeAxis = TimeAxis;

})(window);
