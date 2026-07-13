(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  function TimelineCanvasView(container) {
    Emitter.call(this);
    this._container = container;
    this._el = null;
    this._narrative = null;
    this._focusNodeId = null;
    this._active = false;
    this._build();
  }

  TimelineCanvasView.prototype = Object.create(Emitter.prototype);
  TimelineCanvasView.prototype.constructor = TimelineCanvasView;

  TimelineCanvasView.create = function (container) {
    return new TimelineCanvasView(container);
  };

  TimelineCanvasView.prototype._build = function () {
    var root = document.createElement('div');
    root.setAttribute('data-role', 'canvas-view');
    root.style.display = 'none';

    root.innerHTML =
      '<div data-role="app-root" data-theme="light">' +
        '<div data-role="canvas-header">' +
          '<div data-role="canvas-header-inner">' +
            '<div data-role="canvas-header-left">' +
              '<div data-role="canvas-logo">' +
                '<span data-role="canvas-logo-mark"></span>' +
                '<span data-role="canvas-logo-text">事刻</span>' +
              '</div>' +
              '<button data-role="canvas-back" class="canvas-btn">← 返回详情</button>' +
            '</div>' +
            '<div data-role="canvas-title-wrap">' +
              '<div data-role="canvas-title-label">叙事脉络</div>' +
              '<div data-role="canvas-title">星辰创业全历程</div>' +
            '</div>' +
            '<div data-role="canvas-actions">' +
              '<button data-role="canvas-zoom-out" title="缩小">−</button>' +
              '<button data-role="canvas-zoom-fit" class="canvas-zoom-reset" title="适配">适配</button>' +
              '<button data-role="canvas-zoom-in" title="放大">+</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div data-role="canvas-body">' +
          '<div data-role="narrative-mount"></div>' +
        '</div>' +
        '<div data-role="canvas-hint">点击节点查看详情 · 点击左侧圆点数字展开关联事件线 · 点击连线进入焦点模式</div>' +
      '</div>';

    this._container.appendChild(root);
    this._el = root;
    this._bindEvents();
  };

  TimelineCanvasView.prototype._bindEvents = function () {
    var self = this;

    var backBtn = this._el.querySelector('[data-role="canvas-back"]');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        self.emit('back', { nodeId: self._focusNodeId });
      });
    }

    var logo = this._el.querySelector('[data-role="canvas-logo"]');
    if (logo) {
      logo.addEventListener('click', function () {
        self.emit('home:click', {});
      });
    }

    var zoomIn = this._el.querySelector('[data-role="canvas-zoom-in"]');
    var zoomOut = this._el.querySelector('[data-role="canvas-zoom-out"]');
    var zoomFit = this._el.querySelector('[data-role="canvas-zoom-fit"]');

    if (zoomIn) zoomIn.addEventListener('click', function () {
      if (self._narrative) self._narrative.zoomIn();
    });
    if (zoomOut) zoomOut.addEventListener('click', function () {
      if (self._narrative) self._narrative.zoomOut();
    });
    if (zoomFit) zoomFit.addEventListener('click', function () {
      if (self._narrative) self._narrative.zoomToFit();
    });
  };

  TimelineCanvasView.prototype._setupCanvas = function () {
    if (this._narrative) return;
    var mount = this._el.querySelector('[data-role="narrative-mount"]');
    if (!mount) return;

    var NarrativeCanvas = global.TT.NarrativeCanvas;
    var store = global.TT.DataStore.getInstance();

    this._narrative = NarrativeCanvas.create(mount);
    this._visibleTlIds = [];
    this._nodeDetail = global.TT.NodeDetail.create();

    var self = this;

    this._narrative.on('node:selected', function (ev) {
      self._clearEntryHighlight();
      self._openNodeDetail(ev.nodeId, ev.nodeEl);
    });

    this._narrative.on('node:relation-click', function (ev) {
      self._expandRelations(ev.nodeId, ev.timelineId);
    });

    this._narrative.on('column:close', function (ev) {
      self._collapseColumn(ev.timelineId);
    });

    self._narrative.setZoom(1);
  };

  TimelineCanvasView.prototype._openNodeDetail = function (nodeId, nodeEl) {
    var store = global.TT.DataStore.getInstance();
    var nodeData = store.getNode(nodeId);
    if (!nodeData || !this._nodeDetail) return;

    var rels = store.getRelationsOf(nodeId);
    var relations = [];
    rels.forEach(function (r) {
      var targetNode = store.getNode(r.toNodeId);
      relations.push({
        label: r.label || '关联',
        targetNodeId: r.toNodeId,
        targetTitle: targetNode ? targetNode.title : r.toNodeId,
        direction: r.direction || 'out'
      });
    });

    var cardData = {
      id: nodeData.id,
      title: nodeData.title,
      summary: nodeData.summary,
      content: nodeData.content,
      startTime: nodeData.startTime,
      importance: nodeData.importance,
      confidence: nodeData.confidence,
      tags: nodeData.tags ? (Array.isArray(nodeData.tags) ? nodeData.tags : Object.keys(nodeData.tags)) : [],
      relationCount: relations.length,
      relations: relations,
      sources: nodeData.sources || [],
      comments: nodeData.comments || []
    };
    this._nodeDetail.open(cardData, nodeEl);
  };

  TimelineCanvasView.prototype._expandRelations = function (nodeId, timelineId) {
    var store = global.TT.DataStore.getInstance();
    var tl = store.getTimeline(timelineId);
    if (!tl) return;

    var entry = null;
    for (var i = 0; i < tl.nodes.length; i++) {
      if (tl.nodes[i].nodeId === nodeId) { entry = tl.nodes[i]; break; }
    }
    if (!entry || !entry.relations) return;

    var self = this;
    var branchTlIds = {};
    for (var j = 0; j < entry.relations.length; j++) {
      var r = entry.relations[j];
      if (r.direction !== 'out' && r.direction !== '→') continue;
      var targetTlId = r.targetTimelineId || timelineId;
      if (targetTlId !== timelineId && this._visibleTlIds.indexOf(targetTlId) === -1) {
        branchTlIds[targetTlId] = true;
      }
    }

    Object.keys(branchTlIds).forEach(function (branchId) {
      self._expandColumn(branchId);
    });
  };

  TimelineCanvasView.prototype._findNodeTimeline = function (nodeId, preferredTlId) {
    var store = global.TT.DataStore.getInstance();
    var timelines = store.getAllTimelines();
    var fallback = null;

    if (preferredTlId) {
      var preferred = store.getTimeline(preferredTlId);
      if (preferred) {
        var pn = preferred.nodes || [];
        for (var k = 0; k < pn.length; k++) {
          if (pn[k].nodeId === nodeId) return preferredTlId;
        }
      }
    }

    for (var i = 0; i < timelines.length; i++) {
      var tl = timelines[i];
      if (tl.id === 'tl-demo-main') continue;
      var nodes = tl.nodes || [];
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].nodeId === nodeId) return tl.id;
      }
    }

    for (var m = 0; m < timelines.length; m++) {
      var mainTl = timelines[m];
      if (mainTl.id !== 'tl-demo-main') continue;
      var mainNodes = mainTl.nodes || [];
      for (var n = 0; n < mainNodes.length; n++) {
        if (mainNodes[n].nodeId === nodeId) return mainTl.id;
      }
    }

    return timelines.length ? timelines[0].id : 'tl-demo-main';
  };

  TimelineCanvasView.prototype._expandColumn = function (timelineId) {
    if (!this._narrative) return;
    if (this._visibleTlIds.indexOf(timelineId) !== -1) return;
    var store = global.TT.DataStore.getInstance();
    if (!store.getTimeline(timelineId)) return;

    var isFirst = this._visibleTlIds.length === 0;
    var colType = isFirst ? 'main' : 'branch';
    this._narrative.addColumn(timelineId, colType);
    this._visibleTlIds.push(timelineId);

    var self = this;
    requestAnimationFrame(function () {
      self._narrative._repositionAllCards();
      self._narrative._refreshOverlays();
    });
  };

  TimelineCanvasView.prototype._collapseColumn = function (timelineId) {
    if (!this._narrative) return;
    var idx = this._visibleTlIds.indexOf(timelineId);
    if (idx === -1) return;
    var entry = this._narrative._columns[timelineId];
    if (entry && entry.type === 'main') return;

    this._narrative.removeColumn(timelineId);
    this._visibleTlIds.splice(idx, 1);

    var self = this;
    requestAnimationFrame(function () {
      if (self._narrative.isFocusMode()) {
        self._narrative.exitFocusMode();
      }
      self._narrative._repositionAllCards();
      self._narrative._refreshOverlays();
    });
  };

  TimelineCanvasView.prototype.show = function (nodeId, timelineId) {
    this._active = true;
    this._focusNodeId = nodeId || this._focusNodeId;

    var store = global.TT.DataStore.getInstance();
    var focusTlId = this._findNodeTimeline(this._focusNodeId, timelineId);
    var focusTl = store.getTimeline(focusTlId);

    var titleEl = this._el.querySelector('[data-role="canvas-title"]');
    if (titleEl && focusTl) titleEl.textContent = focusTl.title || '事刻叙事画布';

    this._el.style.display = 'flex';
    this._setupCanvas();

    var self = this;

    if (this._visibleTlIds.length === 0) {
      this._expandColumn(focusTlId);
    }

    requestAnimationFrame(function () {
      if (self._narrative) {
        self._narrative._repositionAllCards();
        self._narrative._refreshOverlays();
        setTimeout(function () {
          self._highlightEntryNode();
          setTimeout(function () {
            self._scrollToNode(self._focusNodeId);
          }, 200);
        }, 300);
      }
    });
  };

  TimelineCanvasView.prototype._highlightEntryNode = function () {
    var stageEl = this._narrative && this._narrative._stageEl;
    if (!stageEl || !this._focusNodeId) return;

    var cards = stageEl.querySelectorAll('[data-role="node-card"][data-node-id="' + this._focusNodeId + '"]');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.add('tt-entry-node');
    }
  };

  TimelineCanvasView.prototype._clearEntryHighlight = function () {
    var stageEl = this._narrative && this._narrative._stageEl;
    if (!stageEl) return;
    var entries = stageEl.querySelectorAll('.tt-entry-node');
    for (var i = 0; i < entries.length; i++) {
      entries[i].classList.remove('tt-entry-node');
    }
  };

  TimelineCanvasView.prototype._scrollToNode = function (nodeId) {
    if (!this._narrative || !nodeId) return;
    var scrollEl = this._narrative._el;
    var stageEl = this._narrative._stageEl;
    if (!scrollEl || !stageEl) return;

    var nodeEl = stageEl.querySelector('[data-role="node-card"][data-node-id="' + nodeId + '"]');
    if (!nodeEl) return;

    var zoom = this._narrative._zoom || 1;

    var nodeTop = 0;
    var nodeLeft = 0;
    var el = nodeEl;
    while (el && el !== stageEl) {
      nodeTop += el.offsetTop || 0;
      nodeLeft += el.offsetLeft || 0;
      el = el.offsetParent;
    }

    var nodeH = nodeEl.offsetHeight || 60;
    var nodeW = nodeEl.offsetWidth || 200;

    var targetScrollTop = (nodeTop + nodeH / 2) * zoom - scrollEl.clientHeight * 0.4;
    var targetScrollLeft = (nodeLeft + nodeW / 2) * zoom - scrollEl.clientWidth * 0.35;

    var maxScrollTop = scrollEl.scrollHeight - scrollEl.clientHeight;
    var maxScrollLeft = scrollEl.scrollWidth - scrollEl.clientWidth;

    scrollEl.scrollTop = Math.max(0, Math.min(maxScrollTop, targetScrollTop));
    scrollEl.scrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft));
  };

  TimelineCanvasView.prototype.hide = function () {
    this._active = false;
    this._el.style.display = 'none';
    this._clearEntryHighlight();
    if (this._nodeDetail) {
      if (this._nodeDetail.isOpen()) this._nodeDetail.close();
      this._nodeDetail.destroy();
      this._nodeDetail = null;
    }
    if (this._narrative) {
      if (this._narrative.isFocusMode()) {
        this._narrative.exitFocusMode();
      }
      this._narrative.destroy();
      this._narrative = null;
    }
    this._visibleTlIds = [];
  };

  TimelineCanvasView.prototype.triggerTransition = function (fromEl, callback) {
    var self = this;
    var rect = fromEl ? fromEl.getBoundingClientRect() : null;

    var overlay = document.createElement('div');
    overlay.setAttribute('data-role', 'transition-overlay');
    overlay.innerHTML = '<div data-role="transition-circle"></div>';
    document.body.appendChild(overlay);

    var circle = overlay.querySelector('[data-role="transition-circle"]');

    if (rect) {
      circle.style.left = (rect.left + rect.width / 2) + 'px';
      circle.style.top = (rect.top + rect.height / 2) + 'px';
      circle.style.width = '0px';
      circle.style.height = '0px';
    } else {
      circle.style.left = '50%';
      circle.style.top = '50%';
      circle.style.width = '0px';
      circle.style.height = '0px';
    }

    requestAnimationFrame(function () {
      overlay.setAttribute('data-active', 'true');
      var maxSize = Math.max(window.innerWidth, window.innerHeight) * 2.5;
      circle.style.width = maxSize + 'px';
      circle.style.height = maxSize + 'px';
      circle.style.transform = 'translate(-50%, -50%)';
    });

    setTimeout(function () {
      if (callback) callback();
      setTimeout(function () {
        overlay.setAttribute('data-leaving', 'true');
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 500);
      }, 200);
    }, 600);
  };

  TimelineCanvasView.prototype.destroy = function () {
    if (this._narrative) {
      this._narrative.destroy();
      this._narrative = null;
    }
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT.TimelineCanvasView = TimelineCanvasView;

})(window);
