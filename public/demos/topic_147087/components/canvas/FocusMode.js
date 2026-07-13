(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var DIM_OPACITY = '0.18';
  var BLUR_PX = '3px';

  function FocusMode(canvasEl, stageEl) {
    Emitter.call(this);
    this._canvasEl = canvasEl;
    this._stageEl = stageEl;
    this._active = false;
    this._centerNodeId = null;
    this._tipEl = null;
    this._clickHandler = null;
    this._keyHandler = null;
    this._mainTlId = null;
  }

  FocusMode.prototype = Object.create(Emitter.prototype);
  FocusMode.prototype.constructor = FocusMode;

  FocusMode.create = function (canvasEl, stageEl) {
    return new FocusMode(canvasEl, stageEl);
  };

  FocusMode.prototype._buildGraph = function () {
    var store = global.TT.DataStore.getInstance();
    var downstream = {};
    var nodeInfo = {};
    var tlNodeCounts = {};

    var timelines = store.getAllTimelines();

    for (var ti = 0; ti < timelines.length; ti++) {
      var tl = timelines[ti];
      var nodes = tl.nodes || [];
      tlNodeCounts[tl.id] = nodes.length;
      for (var ni = 0; ni < nodes.length; ni++) {
        var tn = nodes[ni];
        nodeInfo[tn.nodeId] = { timelineId: tl.id, time: tn.time };
        if (!downstream[tn.nodeId]) downstream[tn.nodeId] = {};
      }
    }

    var mainId = null;
    var maxCount = 0;
    var tlIds = Object.keys(tlNodeCounts);
    for (var ci = 0; ci < tlIds.length; ci++) {
      if (tlNodeCounts[tlIds[ci]] > maxCount) {
        maxCount = tlNodeCounts[tlIds[ci]];
        mainId = tlIds[ci];
      }
    }
    this._mainTlId = mainId;

    for (var ti2 = 0; ti2 < timelines.length; ti2++) {
      var tl2 = timelines[ti2];
      var nodes2 = tl2.nodes || [];
      for (var ni2 = 0; ni2 < nodes2.length; ni2++) {
        var tn2 = nodes2[ni2];
        var rels2 = tn2.relations || [];
        for (var ri2 = 0; ri2 < rels2.length; ri2++) {
          var rel2 = rels2[ri2];
          if (!rel2.direction || rel2.direction === 'none') continue;
          var tgtTlId2 = rel2.targetTimelineId || tl2.id;
          if (tgtTlId2 === tl2.id) continue;

          var fromId2, toId2;
          if (rel2.direction === '→' || rel2.direction === 'out') {
            fromId2 = tn2.nodeId;
            toId2 = rel2.targetNodeId;
          } else if (rel2.direction === '←' || rel2.direction === 'in') {
            fromId2 = rel2.targetNodeId;
            toId2 = tn2.nodeId;
          } else {
            continue;
          }

          if (!downstream[fromId2]) downstream[fromId2] = {};
          downstream[fromId2][toId2] = true;
        }
      }
    }

    var upstream = {};
    var allFrom = Object.keys(downstream);
    for (var fi = 0; fi < allFrom.length; fi++) {
      var from = allFrom[fi];
      var tos = Object.keys(downstream[from]);
      for (var ti3 = 0; ti3 < tos.length; ti3++) {
        var to = tos[ti3];
        if (!upstream[to]) upstream[to] = {};
        upstream[to][from] = true;
      }
    }

    return { downstream: downstream, upstream: upstream, nodeInfo: nodeInfo };
  };

  FocusMode.prototype._bfs = function (startIds, adj) {
    var visited = {};
    var queue = [];
    for (var i = 0; i < startIds.length; i++) {
      if (startIds[i] && !visited[startIds[i]]) {
        visited[startIds[i]] = true;
        queue.push(startIds[i]);
      }
    }
    while (queue.length > 0) {
      var cur = queue.shift();
      var neighbors = adj[cur];
      if (!neighbors) continue;
      var nids = Object.keys(neighbors);
      for (var j = 0; j < nids.length; j++) {
        if (!visited[nids[j]]) {
          visited[nids[j]] = true;
          queue.push(nids[j]);
        }
      }
    }
    return visited;
  };

  FocusMode.prototype._bfsBidirectional = function (startIds, downstream, upstream) {
    var visited = {};
    var queue = [];
    for (var i = 0; i < startIds.length; i++) {
      if (startIds[i] && !visited[startIds[i]]) {
        visited[startIds[i]] = true;
        queue.push(startIds[i]);
      }
    }
    while (queue.length > 0) {
      var cur = queue.shift();
      var ds = downstream[cur];
      if (ds) {
        var dsKeys = Object.keys(ds);
        for (var d = 0; d < dsKeys.length; d++) {
          if (!visited[dsKeys[d]]) {
            visited[dsKeys[d]] = true;
            queue.push(dsKeys[d]);
          }
        }
      }
      var us = upstream[cur];
      if (us) {
        var usKeys = Object.keys(us);
        for (var u = 0; u < usKeys.length; u++) {
          if (!visited[usKeys[u]]) {
            visited[usKeys[u]] = true;
            queue.push(usKeys[u]);
          }
        }
      }
    }
    return visited;
  };

  FocusMode.prototype._collectChain = function (centerNodeId) {
    var graph = this._buildGraph();
    var chain = this._bfsBidirectional([centerNodeId], graph.downstream, graph.upstream);
    return Object.keys(chain);
  };

  FocusMode.prototype._collectPath = function (sourceNodeId, targetNodeId, direction) {
    var graph = this._buildGraph();
    var chain = this._bfsBidirectional([sourceNodeId, targetNodeId], graph.downstream, graph.upstream);
    return Object.keys(chain);
  };

  FocusMode.prototype.enter = function (centerNodeId, pathTargetNodeId, direction) {
    this.endPreview();
    if (this._active) this.exit();
    this._active = true;
    this._centerNodeId = centerNodeId;

    var chainIds;
    if (pathTargetNodeId) {
      chainIds = this._collectPath(centerNodeId, pathTargetNodeId, direction);
    } else {
      chainIds = this._collectChain(centerNodeId);
    }
    var chainMap = {};
    chainIds.forEach(function (id) { chainMap[id] = true; });

    var cards = this._stageEl.querySelectorAll('[data-role="node-card"]');
    cards.forEach(function (card) {
      var nid = card.getAttribute('data-node-id');
      if (chainMap[nid]) {
        card.classList.remove('tt-focus-dim');
        card.classList.add('tt-focus-highlight');
      } else {
        card.classList.remove('tt-focus-highlight');
        card.classList.add('tt-focus-dim');
      }
    });

    var columns = this._stageEl.querySelectorAll('[data-role="timeline-column"]');
    columns.forEach(function (col) {
      var colCards = col.querySelectorAll('[data-role="node-card"]');
      var hasChain = false;
      for (var i = 0; i < colCards.length; i++) {
        if (chainMap[colCards[i].getAttribute('data-node-id')]) {
          hasChain = true;
          break;
        }
      }
      if (hasChain) {
        col.classList.remove('tt-focus-dim');
      } else {
        col.classList.add('tt-focus-dim');
      }
    });

    this._showTip();
    this._bindExitEvents();

    this.emit('enter', { centerNodeId: centerNodeId, chain: chainIds });
  };

  FocusMode.prototype.exit = function () {
    if (!this._active) return;
    this._active = false;
    this._centerNodeId = null;

    var allDim = this._stageEl.querySelectorAll('.tt-focus-dim');
    allDim.forEach(function (el) { el.classList.remove('tt-focus-dim'); });

    var allHighlight = this._stageEl.querySelectorAll('.tt-focus-highlight');
    allHighlight.forEach(function (el) { el.classList.remove('tt-focus-highlight'); });

    this._hideTip();
    this._unbindExitEvents();

    this.emit('exit', {});
  };

  FocusMode.prototype._showTip = function () {
    if (this._tipEl) return;

    var isLight = document.body.querySelector('[data-theme="light"], [data-role="canvas-view"]');
    var tipBg = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(30,29,28,0.95)';
    var tipBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(232,230,225,0.1)';
    var tipColor = isLight ? '#666' : '#8A8880';
    var tipXColor = isLight ? '#aaa' : '#565453';
    var dotColor = isLight ? '#ff5a3c' : '#E8936F';

    var tip = document.createElement('div');
    tip.setAttribute('data-role', 'focus-mode-tip');
    tip.style.cssText =
      'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
      'z-index:2000;padding:10px 24px;border-radius:10px;' +
      'background:' + tipBg + ';border:1px solid ' + tipBorder + ';' +
      'color:' + tipColor + ';font-size:13px;letter-spacing:0.3px;' +
      'display:flex;align-items:center;gap:10px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,' + (isLight ? '0.1' : '0.5') + ');' +
      (isLight ? 'backdrop-filter:blur(8px);' : '') +
      'animation:focusTipIn 0.3s ease;';

    var dot = document.createElement('span');
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + dotColor + ';';
    tip.appendChild(dot);

    var text = document.createElement('span');
    text.textContent = '事件脉络 · 点击空白处或按 ESC 查看全图';
    tip.appendChild(text);

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText =
      'background:none;border:none;color:' + tipXColor + ';font-size:18px;cursor:pointer;' +
      'padding:0 4px;margin-left:4px;line-height:1;';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', this.exit.bind(this));
    tip.appendChild(closeBtn);

    document.body.appendChild(tip);
    this._tipEl = tip;
  };

  FocusMode.prototype._hideTip = function () {
    if (!this._tipEl) return;
    this._tipEl.style.animation = 'focusTipOut 0.2s ease forwards';
    var el = this._tipEl;
    this._tipEl = null;
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 220);
  };

  FocusMode.prototype._bindExitEvents = function () {
    var self = this;

    this._clickHandler = function (e) {
      var interactive = e.target.closest(
        '[data-role="node-card"],' +
        '[data-role="focus-mode-tip"],' +
        '[data-role="connection-hit"],' +
        '[data-role="column-close"],' +
        '[data-role="node-relations"],' +
        'button'
      );
      if (!interactive) {
        self.exit();
      }
    };

    this._keyHandler = function (e) {
      if (e.key === 'Escape') {
        self.exit();
      }
    };

    setTimeout(function () {
      self._canvasEl.addEventListener('click', self._clickHandler, true);
      window.addEventListener('keydown', self._keyHandler);
    }, 50);
  };

  FocusMode.prototype._unbindExitEvents = function () {
    if (this._clickHandler) {
      this._canvasEl.removeEventListener('click', this._clickHandler, true);
      this._clickHandler = null;
    }
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  };

  FocusMode.prototype.preview = function (sourceNodeId, targetNodeId) {
    if (this._active) return null;

    var chainIds = this._collectPath(sourceNodeId, targetNodeId, 'out');
    var chainMap = {};
    chainIds.forEach(function (id) { chainMap[id] = true; });
    this._previewChainMap = chainMap;

    var cards = this._stageEl.querySelectorAll('[data-role="node-card"]');
    cards.forEach(function (card) {
      var nid = card.getAttribute('data-node-id');
      if (chainMap[nid]) {
        card.classList.remove('tt-focus-dim');
        card.classList.add('tt-focus-highlight');
      } else {
        card.classList.remove('tt-focus-highlight');
        card.classList.add('tt-focus-dim');
      }
    });

    var columns = this._stageEl.querySelectorAll('[data-role="timeline-column"]');
    columns.forEach(function (col) {
      var colCards = col.querySelectorAll('[data-role="node-card"]');
      var hasChain = false;
      for (var i = 0; i < colCards.length; i++) {
        if (chainMap[colCards[i].getAttribute('data-node-id')]) {
          hasChain = true;
          break;
        }
      }
      if (hasChain) {
        col.classList.remove('tt-focus-dim');
      } else {
        col.classList.add('tt-focus-dim');
      }
    });

    return chainMap;
  };

  FocusMode.prototype.getPreviewChainMap = function () {
    return this._previewChainMap || null;
  };

  FocusMode.prototype.endPreview = function () {
    if (this._active) return;
    this._previewChainMap = null;

    var allDim = this._stageEl.querySelectorAll('.tt-focus-dim');
    for (var i = allDim.length - 1; i >= 0; i--) {
      allDim[i].classList.remove('tt-focus-dim');
    }
    var allHighlight = this._stageEl.querySelectorAll('.tt-focus-highlight');
    for (var j = allHighlight.length - 1; j >= 0; j--) {
      allHighlight[j].classList.remove('tt-focus-highlight');
    }
  };

  FocusMode.prototype.isActive = function () {
    return this._active;
  };

  FocusMode.prototype.destroy = function () {
    this.exit();
    this._canvasEl = null;
    this._stageEl = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT.FocusMode = FocusMode;

})(window);
