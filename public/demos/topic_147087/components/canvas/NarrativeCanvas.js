(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var MIN_ZOOM = 0.5;
  var MAX_ZOOM = 1.5;
  var ZOOM_STEP = 0.1;

  function NarrativeCanvas(mountTarget) {
    Emitter.call(this);

    if (!mountTarget) {
      throw new Error('NarrativeCanvas: mountTarget is required');
    }

    this._target = mountTarget;
    this._el = null;
    this._stageEl = null;
    this._columns = {};
    this._columnOrder = [];
    this._mainTlId = null;
    this._connectionLayer = null;
    this._timeAxis = null;
    this._zoom = 1;
    this._unsubscribers = [];
    this._focusMode = null;
    this._focusCompressTimes = null;

    this._build();
    this._bindEvents();
    this._listen();
  }

  NarrativeCanvas.prototype = Object.create(Emitter.prototype);
  NarrativeCanvas.prototype.constructor = NarrativeCanvas;

  NarrativeCanvas.create = function (mountTarget) {
    return new NarrativeCanvas(mountTarget);
  };

  NarrativeCanvas.prototype._build = function () {
    var el = document.createElement('div');
    el.setAttribute('data-role', 'narrative-canvas');

    var stage = document.createElement('div');
    stage.setAttribute('data-role', 'canvas-stage');

    el.appendChild(stage);

    this._target.appendChild(el);
    this._el = el;
    this._stageEl = stage;

    this._focusMode = global.TT.FocusMode.create(this._el, this._stageEl);

    var self = this;
    this._focusMode.on('enter', function (ev) {
      var chainMap = {};
      ev.chain.forEach(function (id) { chainMap[id] = true; });
      if (self._connectionLayer) {
        self._connectionLayer.setPreviewChain(null);
        self._connectionLayer.setPreviewPair(null);
        self._connectionLayer.setFocusChain(chainMap);
      }
      if (self._timeAxis) {
        self._timeAxis.setPreviewChain(null);
        self._timeAxis.setFocusChain(chainMap);
      }
      self.setFocusCompress(ev.chain);
    });
    this._focusMode.on('exit', function () {
      if (self._connectionLayer) self._connectionLayer.setFocusChain(null);
      if (self._timeAxis) self._timeAxis.setFocusChain(null);
      self.clearFocusCompress();
    });

    this._applyTransform();
  };

  NarrativeCanvas.prototype._applyTransform = function () {
    this._stageEl.style.transform = 'scale(' + this._zoom + ')';
  };

  NarrativeCanvas.prototype._bindEvents = function () {
    var self = this;

    // 滚动时重绘连线和时间轴（位置跟随滚动变化）
    this._el.addEventListener('scroll', function () {
      self._refreshOverlays();
    });

    window.addEventListener('resize', function () {
      self._refreshOverlays();
    });
  };

  NarrativeCanvas.prototype._listen = function () {
    var store = global.TT.DataStore.getInstance();
    var self = this;

    var u1 = store.on('timeline:changed', function () {
      self.emit('canvas:dirty', {});
    });
    this._unsubscribers.push(u1);
  };

  NarrativeCanvas.prototype.addColumn = function (timelineId, type) {
    var colType = type || 'main';

    // 主列必须先于列创建设置 _mainTlId，否则 timeMapper 返回 0
    if (colType === 'main' && !this._mainTlId) {
      this._mainTlId = timelineId;
      this._ensureOverlays();
    }

    var ColumnCtor = global.TT.TimelineColumn;
    var self = this;
    var column = ColumnCtor.create(timelineId, this._stageEl, function (time) {
      return self._getTimeY(time);
    });
    column.setColumnType(colType);

    this._columns[timelineId] = { instance: column, type: colType };
    this._columnOrder.push(timelineId);

    this._invalidateLayout();
    this._repositionAllCards();
    this._refreshOverlays();

    column.on('node:selected', function (ev) {
      self.emit('node:selected', {
        nodeId: ev.nodeId,
        timelineId: ev.timelineId,
        nodeEl: ev.nodeEl
      });
    });

    column.on('node:relation-click', function (ev) {
      self.emit('node:relation-click', {
        nodeId: ev.nodeId,
        timelineId: ev.timelineId,
        nodeEl: ev.nodeEl
      });
    });

    column.on('header:close', function (ev) {
      self.emit('column:close', { timelineId: ev.timelineId });
    });

    // hover 只放大当前节点，其他节点不动；连线/时间轴跟随重绘
    column.on('node:hover', function () {
      self._scheduleOverlayRefresh(300);
    });

    this.emit('column:added', { timelineId: timelineId, type: colType });
    return column;
  };

  // 统一时间映射：所有列共享的 time→Y 函数
  // 区间行高动态计算：若某区间内分布了分支节点，自动拉开该区间行高
  // 分支节点在区间内按时间排序后均匀分布（避免时间密集导致拥挤）
  NarrativeCanvas.prototype._getTimeY = function (timeStr) {
    var ROW_HEIGHT = 64; // 无分支区间的紧凑行高
    var MIN_NODE_GAP = 56; // 节点间最小间距（卡片高 44 + 12 间隙）
    var TOP_OFFSET = 44;
    if (!this._mainTlId) return TOP_OFFSET;

    var layout = this._getLayout();
    if (!layout) return TOP_OFFSET;

    var mainNodes = layout.mainNodes;
    var targetTime = this._parseDate(timeStr);

    // 精确匹配主列节点
    for (var i = 0; i < mainNodes.length; i++) {
      if (mainNodes[i].time === timeStr) {
        return layout.nodeYs[i];
      }
    }

    // 分支节点：找到所属区间
    var prevIdx = -1;
    var nextIdx = -1;
    for (var j = 0; j < mainNodes.length; j++) {
      var t = this._parseDate(mainNodes[j].time);
      if (t < targetTime) prevIdx = j;
      if (t > targetTime && nextIdx === -1) { nextIdx = j; break; }
    }

    if (prevIdx >= 0 && nextIdx >= 0) {
      var isFocusT = !!this._focusCompressTimes;
      var prevY = layout.nodeYs[prevIdx];
      var nextY = layout.nodeYs[nextIdx];

      if (isFocusT) {
        var isChainNode = !!this._focusCompressTimes[timeStr];
        var chainBT = layout.gapChainTimes[prevIdx];
        var nonChainBT = layout.gapNonChainTimes[prevIdx];

        if (isChainNode) {
          var cpos = -1;
          for (var cp = 0; cp < chainBT.length; cp++) {
            if (chainBT[cp] === timeStr) { cpos = cp; break; }
          }
          if (cpos === -1) cpos = 0;
          var ctotal = chainBT.length + 1;
          var cstep = (nextY - prevY) / ctotal;
          return prevY + (cpos + 1) * cstep;
        } else {
          var ncpos = -1;
          for (var ncp = 0; ncp < nonChainBT.length; ncp++) {
            if (nonChainBT[ncp] === timeStr) { ncpos = ncp; break; }
          }
          if (ncpos === -1) ncpos = 0;
          return prevY + 2 + ncpos * 5;
        }
      }

      var gapBranchTimes = layout.gapBranchTimes[prevIdx];
      var posInGap = -1;
      for (var p = 0; p < gapBranchTimes.length; p++) {
        if (gapBranchTimes[p] === timeStr) { posInGap = p; break; }
      }
      if (posInGap === -1) posInGap = 0;

      var total = gapBranchTimes.length + 1;
      var step = (nextY - prevY) / total;
      return prevY + (posInGap + 1) * step;
    } else if (prevIdx >= 0) {
      var isFocusTail = !!this._focusCompressTimes;
      if (isFocusTail) {
        var isChainTail = !!this._focusCompressTimes[timeStr];
        if (isChainTail) {
          var tailChainT = layout.tailChainTimes;
          var tcp = -1;
          for (var tci = 0; tci < tailChainT.length; tci++) {
            if (tailChainT[tci] === timeStr) { tcp = tci; break; }
          }
          if (tcp === -1) tcp = 0;
          var tailStep = 50;
          return layout.nodeYs[prevIdx] + (tcp + 1) * tailStep;
        } else {
          var tailNonChainT = layout.tailNonChainTimes;
          var tncp = -1;
          for (var tnci = 0; tnci < tailNonChainT.length; tnci++) {
            if (tailNonChainT[tnci] === timeStr) { tncp = tnci; break; }
          }
          var lastChainTailY = layout.nodeYs[prevIdx];
          if (layout.tailChainTimes.length > 0) {
            lastChainTailY += (layout.tailChainTimes.length + 1) * 50;
          } else {
            lastChainTailY += 6;
          }
          return lastChainTailY + tncp * 2;
        }
      }

      var tailBranchTimes = layout.tailBranchTimes;
      var tailPos = -1;
      for (var tp = 0; tp < tailBranchTimes.length; tp++) {
        if (tailBranchTimes[tp] === timeStr) { tailPos = tp; break; }
      }
      if (tailPos === -1) tailPos = 0;
      return layout.nodeYs[prevIdx] + (tailPos + 1) * MIN_NODE_GAP;
    } else if (nextIdx >= 0) {
      var compressPre = !!this._focusCompressTimes;
      if (compressPre) return TOP_OFFSET;
      return Math.max(TOP_OFFSET, layout.nodeYs[nextIdx] - MIN_NODE_GAP);
    }
    return TOP_OFFSET;
  };

  // 构建全局布局：计算每个主列节点的 Y 和每个区间的行高
  // 缓存结果，仅在数据变化时重建
  NarrativeCanvas.prototype._getLayout = function () {
    if (this._layoutCache) return this._layoutCache;

    var ROW_HEIGHT = 64;
    var MIN_NODE_GAP = 56;
    var TOP_OFFSET = 44;

    var store = global.TT.DataStore.getInstance();
    var mainTl = store.getTimeline(this._mainTlId);
    if (!mainTl) return null;

    var mainNodes = (mainTl.nodes || []).slice().sort(function (a, b) {
      return (a.time || '').localeCompare(b.time || '');
    });
    if (mainNodes.length === 0) return null;

    // 收集所有已显示列的节点（不含主列）
    var branchNodes = [];
    var self = this;
    this._columnOrder.forEach(function (id) {
      if (id === self._mainTlId) return;
      var tl = store.getTimeline(id);
      if (!tl) return;
      (tl.nodes || []).forEach(function (n) {
        branchNodes.push({ time: n.time, timeMs: self._parseDate(n.time) });
      });
    });

    var isFocus = !!this._focusCompressTimes;
    var F_ROW = 48;
    var F_GAP = 50;
    var F_COMPRESS = 12;

    var gapChainTimes = [];
    var gapNonChainTimes = [];

    for (var i = 0; i < mainNodes.length - 1; i++) {
      var prevTime = this._parseDate(mainNodes[i].time);
      var nextTime = this._parseDate(mainNodes[i + 1].time);
      var chainInGap = {};
      var nonChainInGap = {};
      for (var k = 0; k < branchNodes.length; k++) {
        var bt = branchNodes[k].timeMs;
        if (bt > prevTime && bt < nextTime) {
          if (isFocus && this._focusCompressTimes[branchNodes[k].time]) {
            chainInGap[branchNodes[k].time] = true;
          } else if (isFocus) {
            nonChainInGap[branchNodes[k].time] = true;
          } else {
            chainInGap[branchNodes[k].time] = true;
          }
        }
      }
      gapChainTimes.push(Object.keys(chainInGap).sort());
      gapNonChainTimes.push(Object.keys(nonChainInGap).sort());
    }

    var gapBranchTimes = [];
    var gapHeights = [];
    for (var g = 0; g < gapChainTimes.length; g++) {
      var allInGap = gapChainTimes[g].concat(gapNonChainTimes[g]).sort();
      gapBranchTimes.push(allInGap);

      var n = allInGap.length;
      var needed = (n + 1) * MIN_NODE_GAP;
      gapHeights.push(Math.max(ROW_HEIGHT, needed));
    }

    if (isFocus) {
      for (var c = 0; c < gapHeights.length; c++) {
        var leftInChain = !!this._focusCompressTimes[mainNodes[c].time];
        var rightInChain = !!this._focusCompressTimes[mainNodes[c + 1].time];
        var cn = gapChainTimes[c].length;
        var isChainGap = leftInChain || rightInChain || cn > 0;
        if (!isChainGap) {
          gapHeights[c] = F_COMPRESS;
        } else {
          var chainNeeded = (cn + 1) * F_GAP;
          gapHeights[c] = Math.max(F_ROW, chainNeeded);
        }
      }
    }

    var tailTimesMap = {};
    var tailChainMap = {};
    var tailNonChainMap = {};
    var lastMainTime = this._parseDate(mainNodes[mainNodes.length - 1].time);
    for (var b2 = 0; b2 < branchNodes.length; b2++) {
      if (branchNodes[b2].timeMs > lastMainTime) {
        tailTimesMap[branchNodes[b2].time] = true;
        if (isFocus && this._focusCompressTimes[branchNodes[b2].time]) {
          tailChainMap[branchNodes[b2].time] = true;
        } else if (isFocus) {
          tailNonChainMap[branchNodes[b2].time] = true;
        } else {
          tailChainMap[branchNodes[b2].time] = true;
        }
      }
    }
    var tailBranchTimes = Object.keys(tailTimesMap).sort();
    var tailChainTimes = Object.keys(tailChainMap).sort();
    var tailNonChainTimes = Object.keys(tailNonChainMap).sort();
    var gapAfterLast;
    if (isFocus) {
      var lastMainInChain = !!this._focusCompressTimes[mainNodes[mainNodes.length - 1].time];
      if (!lastMainInChain && tailChainTimes.length === 0) {
        gapAfterLast = F_COMPRESS;
      } else {
        gapAfterLast = Math.max(F_ROW, (tailChainTimes.length + 1) * F_GAP);
      }
    } else {
      gapAfterLast = Math.max(MIN_NODE_GAP, (tailBranchTimes.length + 1) * MIN_NODE_GAP);
    }

    var nodeYs = [];
    var y = TOP_OFFSET;
    nodeYs.push(y);
    for (var h = 0; h < gapHeights.length; h++) {
      y += gapHeights[h];
      nodeYs.push(y);
    }

    this._layoutCache = {
      mainNodes: mainNodes,
      nodeYs: nodeYs,
      gapHeights: gapHeights,
      gapBranchTimes: gapBranchTimes,
      gapChainTimes: gapChainTimes,
      gapNonChainTimes: gapNonChainTimes,
      tailBranchTimes: tailBranchTimes,
      tailChainTimes: tailChainTimes,
      tailNonChainTimes: tailNonChainTimes,
      gapAfterLast: gapAfterLast
    };
    return this._layoutCache;
  };

  // 布局缓存失效
  NarrativeCanvas.prototype._invalidateLayout = function () {
    this._layoutCache = null;
  };

  // 重新定位所有列的卡片（布局变化后调用）
  NarrativeCanvas.prototype._repositionAllCards = function () {
    var self = this;
    var maxHeight = 0;
    this._columnOrder.forEach(function (id) {
      var entry = self._columns[id];
      if (entry && entry.instance) {
        var col = entry.instance;
        col.repositionCards();

        var bodyEl = col._bodyEl;
        if (bodyEl) {
          var cards = bodyEl.querySelectorAll('[data-role="node-card"]');
          var maxCardBottom = 0;
          cards.forEach(function (card) {
            var top = parseFloat(card.style.top) || 0;
            var h = card.offsetHeight || 44;
            var bottom = top + h / 2 + 30;
            if (bottom > maxCardBottom) maxCardBottom = bottom;
          });
          bodyEl.style.height = Math.max(maxCardBottom, 100) + 'px';
          var bh = bodyEl.offsetHeight;
          if (bh > maxHeight) maxHeight = bh;
        }
      }
    });
    var headerH = 52;
    var bottomPad = Math.max(0, (this._el.clientHeight || 600) / 2 - 40);
    this._stageEl.style.height = (maxHeight + headerH + 40 + bottomPad) + 'px';
  };

  NarrativeCanvas.prototype._parseDate = function (str) {
    if (!str) return 0;
    return new Date(str + 'T00:00:00').getTime();
  };

  // hover 期间持续重绘连线和时间轴（跟随 transform 放大效果）
  // 不再重新对齐分支列——所有节点位置已由 _getTimeY 固定
  NarrativeCanvas.prototype._scheduleOverlayRefresh = function (durationMs) {
    if (this._overlayRefreshTimer) return;

    var self = this;
    var start = performance.now();

    function frame(now) {
      self._refreshOverlays();
      if (now - start < durationMs) {
        self._overlayRefreshTimer = requestAnimationFrame(frame);
      } else {
        self._overlayRefreshTimer = null;
      }
    }

    this._overlayRefreshTimer = requestAnimationFrame(frame);
  };

  NarrativeCanvas.prototype._refreshOverlays = function () {
    if (this._connectionLayer) this._connectionLayer.render();
    if (this._timeAxis) this._timeAxis.render();
  };

  NarrativeCanvas.prototype._ensureOverlays = function () {
    if (this._connectionLayer) return;

    var self = this;
    this._connectionLayer = global.TT.ConnectionLayer.create(this._stageEl, function () {
      return self._zoom;
    });

    this._timeAxis = global.TT.TimeAxis.create(this._stageEl, this._mainTlId, function () {
      return self._zoom;
    });

    // 连线 hover 预览焦点，click 进入焦点模式
    this._connectionLayer.on('connection:hover', function (ev) {
      if (self._focusMode && !self._focusMode.isActive()) {
        var chainMap = self._focusMode.preview(ev.sourceNodeId, ev.targetNodeId);
        if (self._connectionLayer) self._connectionLayer.setPreviewChain(chainMap);
        if (self._timeAxis) self._timeAxis.setPreviewChain(chainMap);
      }
    });
    this._connectionLayer.on('connection:leave', function () {
      if (self._focusMode && !self._focusMode.isActive()) {
        self._focusMode.endPreview();
        if (self._connectionLayer) self._connectionLayer.setPreviewChain(null);
        if (self._timeAxis) self._timeAxis.setPreviewChain(null);
      }
    });
    this._connectionLayer.on('connection:click', function (ev) {
      self.enterFocusMode(ev.sourceNodeId, ev.targetNodeId, ev.direction);
    });

    this._connectionLayer.on('connection:expand', function (ev) {
      self.emit('connection:expand', ev);
    });
  };

  NarrativeCanvas.prototype.removeColumn = function (timelineId) {
    var entry = this._columns[timelineId];
    if (!entry) return;

    entry.instance.destroy();
    delete this._columns[timelineId];
    this._columnOrder = this._columnOrder.filter(function (id) {
      return id !== timelineId;
    });

    this._invalidateLayout();
    this._repositionAllCards();
    this._refreshOverlays();

    this.emit('column:removed', { timelineId: timelineId });
  };

  NarrativeCanvas.prototype.getColumn = function (timelineId) {
    var entry = this._columns[timelineId];
    return entry ? entry.instance : null;
  };

  NarrativeCanvas.prototype.getZoom = function () {
    return this._zoom;
  };

  NarrativeCanvas.prototype.setZoom = function (level) {
    var target = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
    if (target === this._zoom) return;
    this._zoom = target;
    this._applyTransform();
    this._refreshOverlays();
    this.emit('zoom:changed', { zoom: this._zoom });
  };

  NarrativeCanvas.prototype.zoomIn = function () {
    this.setZoom(this._zoom + ZOOM_STEP * 2);
  };

  NarrativeCanvas.prototype.zoomOut = function () {
    this.setZoom(this._zoom - ZOOM_STEP * 2);
  };

  NarrativeCanvas.prototype.setFocusCompress = function (chainIds) {
    var chainMap = {};
    chainIds.forEach(function (id) { chainMap[id] = true; });

    var store = global.TT.DataStore.getInstance();
    var times = {};

    var allTimelines = store.getAllTimelines();
    for (var ti = 0; ti < allTimelines.length; ti++) {
      var tl = allTimelines[ti];
      var nodes = tl.nodes || [];
      for (var ni = 0; ni < nodes.length; ni++) {
        if (chainMap[nodes[ni].nodeId]) {
          times[nodes[ni].time] = true;
        }
      }
    }

    this._focusCompressTimes = times;
    this._invalidateLayout();
    this._repositionAllCards();
    this._refreshOverlays();
  };

  NarrativeCanvas.prototype.clearFocusCompress = function () {
    this._focusCompressTimes = null;
    this._invalidateLayout();
    this._repositionAllCards();
    this._refreshOverlays();
  };

  NarrativeCanvas.prototype.enterFocusMode = function (nodeId, targetNodeId, direction) {
    if (this._focusMode) this._focusMode.enter(nodeId, targetNodeId, direction);
  };

  NarrativeCanvas.prototype.exitFocusMode = function () {
    if (this._focusMode) this._focusMode.exit();
  };

  NarrativeCanvas.prototype.isFocusMode = function () {
    return this._focusMode ? this._focusMode.isActive() : false;
  };

  NarrativeCanvas.prototype.zoomToFit = function () {
    if (this._columnOrder.length === 0) return;
    var totalWidth = 0;
    var self = this;
    this._columnOrder.forEach(function (id) {
      var col = self._columns[id];
      if (col && col.instance.getElement()) {
        totalWidth += col.instance.getElement().offsetWidth;
      }
    });
    if (totalWidth === 0) return;
    var fitZoom = this._el.clientWidth / totalWidth;
    this.setZoom(Math.max(MIN_ZOOM, Math.min(1, fitZoom)));
  };

  NarrativeCanvas.prototype.getElement = function () {
    return this._el;
  };

  NarrativeCanvas.prototype.destroy = function () {
    for (var i = 0; i < this._unsubscribers.length; i++) {
      this._unsubscribers[i]();
    }
    this._unsubscribers = [];

    if (this._connectionLayer) {
      this._connectionLayer.destroy();
      this._connectionLayer = null;
    }

    if (this._timeAxis) {
      this._timeAxis.destroy();
      this._timeAxis = null;
    }

    var self = this;
    this._columnOrder.forEach(function (id) {
      var entry = self._columns[id];
      if (entry) entry.instance.destroy();
    });
    this._columns = {};
    this._columnOrder = [];

    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._stageEl = null;

    Emitter.prototype.destroy.call(this);
  };

  global.TT.NarrativeCanvas = NarrativeCanvas;

})(window);
