(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var CURVE_OFFSET = 70;
  var SAME_COL_PAD = 36;

  function ConnectionLayer(stageEl, getZoomFn) {
    Emitter.call(this);

    this._stageEl = stageEl;
    this._getZoom = getZoomFn || (function () { return 1; });
    this._svgEl = null;
    this._gEl = null;
    this._instanceId = 'cl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
    this._unsubscribers = [];
    this._focusChainMap = null;
    this._previewChainMap = null;
    this._previewPair = null;
    this._hoveredHit = null;

    this._build();
    this._bindSvgEvents();
    this._listen();
  }

  ConnectionLayer.prototype = Object.create(Emitter.prototype);
  ConnectionLayer.prototype.constructor = ConnectionLayer;

  ConnectionLayer.create = function (stageEl, getZoomFn) {
    return new ConnectionLayer(stageEl, getZoomFn);
  };

  ConnectionLayer.prototype._build = function () {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-role', 'connection-layer');
    svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;';

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    var markerId = this._instanceId + '-arrow';
    var arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    arrowMarker.setAttribute('id', markerId);
    arrowMarker.setAttribute('viewBox', '0 0 8 8');
    arrowMarker.setAttribute('refX', '7');
    arrowMarker.setAttribute('refY', '4');
    arrowMarker.setAttribute('markerWidth', '5');
    arrowMarker.setAttribute('markerHeight', '5');
    arrowMarker.setAttribute('markerUnits', 'userSpaceOnUse');
    arrowMarker.setAttribute('orient', 'auto');
    var arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowPath.setAttribute('d', 'M1 1 L7 4 L1 7 Z');
    arrowPath.setAttribute('fill', 'var(--conn-arrow, #ccc)');
    arrowPath.classList.add('tt-conn-arrow');
    arrowMarker.appendChild(arrowPath);
    defs.appendChild(arrowMarker);
    this._markerId = markerId;

    svg.appendChild(defs);

    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);
    this._gEl = g;

    this._stageEl.appendChild(svg);
    this._svgEl = svg;

    var self = this;
    requestAnimationFrame(function () { self.render(); });
  };

  ConnectionLayer.prototype._bindSvgEvents = function () {
    var self = this;
    var svg = this._svgEl;
    this._hoveredHit = null;
    this._mouseX = 0;
    this._mouseY = 0;
    this._mouseInSvg = false;

    function getConnFromEl(el) {
      while (el && el !== svg) {
        if (el.getAttribute && el.getAttribute('data-role') === 'connection-hit') {
          return {
            type: 'connection',
            hitEl: el,
            sourceNodeId: el.getAttribute('data-source'),
            targetNodeId: el.getAttribute('data-target'),
            sourceTimelineId: el.getAttribute('data-source-tl'),
            targetTimelineId: el.getAttribute('data-target-tl'),
            direction: el.getAttribute('data-direction')
          };
        }
        if (el.getAttribute && (el.getAttribute('data-role') === 'connection-expand-hit' || el.getAttribute('data-role') === 'connection-expand-dot')) {
          return {
            type: 'expand',
            hitEl: el,
            sourceNodeId: el.getAttribute('data-source'),
            targetTimelineId: el.getAttribute('data-target-tl')
          };
        }
        el = el.parentNode;
      }
      return null;
    }

    function hitTest(clientX, clientY) {
      var el = document.elementFromPoint(clientX, clientY);
      if (!el) return null;
      var conn = getConnFromEl(el);
      if (conn) return conn;
      while (el && el !== document.body) {
        if (el === svg) return null;
        if (el.getAttribute && el.getAttribute('data-role') === 'connection-hit') {
          return getConnFromEl(el);
        }
        el = el.parentNode;
      }
      return null;
    }

    function updateHover(clientX, clientY) {
      var conn = hitTest(clientX, clientY);
      var newHit = conn ? conn.hitEl : null;

      if (newHit !== self._hoveredHit) {
        if (self._hoveredHit && !newHit) {
          self._hoveredHit = null;
          self.emit('connection:leave', {});
        }
        if (conn && conn.type === 'connection' && newHit) {
          self._hoveredHit = newHit;
          self.emit('connection:hover', conn);
        }
      }
    }

    svg.addEventListener('mousemove', function (e) {
      self._mouseX = e.clientX;
      self._mouseY = e.clientY;
      self._mouseInSvg = true;
      updateHover(e.clientX, e.clientY);
    });

    svg.addEventListener('mouseleave', function () {
      self._mouseInSvg = false;
      if (self._hoveredHit) {
        self._hoveredHit = null;
        self.emit('connection:leave', {});
      }
    });

    svg.addEventListener('click', function (e) {
      var conn = hitTest(e.clientX, e.clientY);
      if (!conn) return;
      e.stopPropagation();
      if (conn.type === 'connection') {
        self.emit('connection:click', conn);
      } else if (conn.type === 'expand') {
        self.emit('connection:expand', {
          sourceNodeId: conn.sourceNodeId,
          targetTimelineId: conn.targetTimelineId
        });
      }
    });
  };

  ConnectionLayer.prototype.refreshHover = function () {
    if (this._mouseInSvg && this._mouseX !== undefined) {
      var evt = new MouseEvent('mousemove', { clientX: this._mouseX, clientY: this._mouseY });
      this._svgEl.dispatchEvent(evt);
    }
  };

  ConnectionLayer.prototype._getLocalRect = function (el) {
    var zoom = this._getZoom();
    if (zoom <= 0) zoom = 1;
    var r = el.getBoundingClientRect();
    var sr = this._stageEl.getBoundingClientRect();
    return {
      left:   (r.left - sr.left) / zoom,
      top:    (r.top - sr.top) / zoom,
      width:  r.width / zoom,
      height: r.height / zoom,
      right:  (r.right - sr.left) / zoom,
      bottom: (r.bottom - sr.top) / zoom
    };
  };

  ConnectionLayer.prototype._findCard = function (nodeId, timelineId) {
    var col = this._stageEl.querySelector(
      '[data-role="timeline-column"][data-timeline-id="' + timelineId + '"]'
    );
    if (!col) return null;
    return col.querySelector('[data-role="node-card"][data-node-id="' + nodeId + '"]');
  };

  ConnectionLayer.prototype._gatherConnections = function () {
    var store = global.TT.DataStore.getInstance();
    var timelines = store.getAllTimelines();
    var seen = new Set();
    var list = [];

    for (var ti = 0; ti < timelines.length; ti++) {
      var tl = timelines[ti];
      var nodes = tl.nodes || [];
      for (var ni = 0; ni < nodes.length; ni++) {
        var tn = nodes[ni];
        var rels = tn.relations || [];
        for (var ri = 0; ri < rels.length; ri++) {
          var rel = rels[ri];
          if (!rel.direction || rel.direction === 'none') continue;

          var srcNodeId, tgtNodeId, srcTlId, tgtTlId, connDir;

          if (rel.direction === '→' || rel.direction === 'out') {
            srcNodeId = tn.nodeId;
            tgtNodeId = rel.targetNodeId;
            srcTlId = tl.id;
            tgtTlId = rel.targetTimelineId || tl.id;
            connDir = 'out';
          } else if (rel.direction === '←' || rel.direction === 'in') {
            srcNodeId = rel.targetNodeId;
            tgtNodeId = tn.nodeId;
            srcTlId = rel.targetTimelineId || tl.id;
            tgtTlId = tl.id;
            connDir = 'out';
          } else {
            srcNodeId = tn.nodeId;
            tgtNodeId = rel.targetNodeId;
            srcTlId = tl.id;
            tgtTlId = rel.targetTimelineId || tl.id;
            connDir = rel.direction;
          }

          if (tgtTlId === srcTlId) continue;

          var connKey = srcNodeId + '||' + tgtNodeId + '||' + srcTlId + '||' + tgtTlId;
          if (seen.has(connKey)) continue;
          seen.add(connKey);

          list.push({
            srcNodeId: srcNodeId,
            srcTlId: srcTlId,
            tgtNodeId: tgtNodeId,
            tgtTlId: tgtTlId,
            label: rel.label || '',
            direction: connDir
          });
        }
      }
    }

    return list;
  };

  ConnectionLayer.prototype.render = function () {
    var g = this._gEl;

    while (g.firstChild) g.removeChild(g.firstChild);
    this._hoveredHit = null;

    var connections = this._gatherConnections();
    var self = this;

    connections.forEach(function (conn) {
      var srcEl = self._findCard(conn.srcNodeId, conn.srcTlId);
      var tgtEl = self._findCard(conn.tgtNodeId, conn.tgtTlId);

      if (!srcEl) return;

      if (!tgtEl) return;

      var s = self._getLocalRect(srcEl);
      var t = self._getLocalRect(tgtEl);
      var sameCol = conn.srcTlId === conn.tgtTlId;

      var scx = s.left + s.width / 2;
      var scy = s.top + s.height / 2;
      var tcx = t.left + t.width / 2;
      var tcy = t.top + t.height / 2;

      var start, end, cpSign;

      if (sameCol) {
        start = { x: s.right, y: scy };
        end   = { x: t.right, y: tcy };
        cpSign = 1;
      } else if (scx <= tcx) {
        start = { x: s.right, y: scy };
        end   = { x: t.left,  y: tcy };
        cpSign = 1;
      } else {
        start = { x: s.left,  y: scy };
        end   = { x: t.right, y: tcy };
        cpSign = -1;
      }

      var dx = Math.abs(end.x - start.x);
      var dy = Math.abs(end.y - start.y);
      var offset;
      if (sameCol) {
        offset = SAME_COL_PAD;
      } else {
        var ratio = dy / Math.max(dx, 1);
        var curveStrength = Math.min(1, ratio * 0.8);
        offset = Math.max(8, dx * 0.25 + dx * 0.25 * curveStrength);
        offset = Math.min(offset, CURVE_OFFSET, dx * 0.5 + 10);
      }

      var cp1x = start.x + cpSign * offset;
      var cp1y = start.y;
      var cp2x = end.x - cpSign * offset;
      var cp2y = end.y;

      var d = 'M ' + start.x + ' ' + start.y +
              ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + end.x + ' ' + end.y;

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'var(--conn-line, rgba(200,200,200,0.5))');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('data-role', 'connection-line');
      path.setAttribute('data-source', conn.srcNodeId);
      path.setAttribute('data-target', conn.tgtNodeId);
      path.style.pointerEvents = 'none';

      if (conn.direction === 'out') {
        path.setAttribute('marker-end', 'url(#' + self._markerId + ')');
      } else if (conn.direction === 'in') {
        path.setAttribute('marker-start', 'url(#' + self._markerId + ')');
      }

      var activeMap = self._focusChainMap;
      if (!activeMap && self._previewChainMap) {
        activeMap = self._previewChainMap;
      }
      if (!activeMap && self._previewPair) {
        activeMap = {};
        activeMap[self._previewPair.source] = true;
        activeMap[self._previewPair.target] = true;
      }
      if (activeMap) {
        if (activeMap[conn.srcNodeId] && activeMap[conn.tgtNodeId]) {
          path.classList.add('tt-focus-line-highlight');
        } else {
          path.classList.add('tt-focus-hide');
        }
      }

      g.appendChild(path);

      var hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitPath.setAttribute('d', d);
      hitPath.setAttribute('stroke', 'transparent');
      hitPath.setAttribute('stroke-width', '14');
      hitPath.setAttribute('fill', 'none');
      hitPath.setAttribute('data-role', 'connection-hit');
      hitPath.setAttribute('data-source', conn.srcNodeId);
      hitPath.setAttribute('data-target', conn.tgtNodeId);
      hitPath.setAttribute('data-source-tl', conn.srcTlId);
      hitPath.setAttribute('data-target-tl', conn.tgtTlId);
      hitPath.setAttribute('data-direction', conn.direction);
      hitPath.style.pointerEvents = 'stroke';
      hitPath.style.cursor = 'pointer';
      hitPath.style.opacity = '1';

      g.appendChild(hitPath);

      if (conn.label) {
        var midX = (start.x + end.x) / 2;
        var midY = (start.y + end.y) / 2;

        var labelLen = conn.label.length;
        var labelW = Math.max(28, labelLen * 10 + 10);
        var labelH = 16;

        var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', midX - labelW / 2);
        bg.setAttribute('y', midY - labelH / 2);
        bg.setAttribute('width', labelW);
        bg.setAttribute('height', labelH);
        bg.setAttribute('rx', '3');
        bg.setAttribute('fill', 'var(--conn-label-bg, rgba(255,255,255,0.9))');
        bg.setAttribute('stroke', 'var(--conn-label-border, #ddd)');
        bg.setAttribute('stroke-width', '0.5');
        bg.setAttribute('data-role', 'connection-label-bg');
        bg.setAttribute('data-source', conn.srcNodeId);
        bg.setAttribute('data-target', conn.tgtNodeId);
        bg.style.pointerEvents = 'none';

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY + 3.5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'var(--conn-label-text, #999)');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-family', 'inherit');
        text.setAttribute('data-role', 'connection-label-text');
        text.setAttribute('data-source', conn.srcNodeId);
        text.setAttribute('data-target', conn.tgtNodeId);
        text.style.pointerEvents = 'none';
        text.textContent = conn.label;

        if (activeMap) {
          if (activeMap[conn.srcNodeId] && activeMap[conn.tgtNodeId]) {
            bg.classList.add('tt-focus-line-highlight');
            text.classList.add('tt-focus-line-highlight');
          } else {
            bg.classList.add('tt-focus-hide');
            text.classList.add('tt-focus-hide');
          }
        }

        g.appendChild(bg);
        g.appendChild(text);
      }
    });

    var self = this;
    requestAnimationFrame(function () { self.refreshHover(); });
  };

  ConnectionLayer.prototype._listen = function () {
    var store = global.TT.DataStore.getInstance();
    var self = this;

    var u1 = store.on('timeline:changed', function () {
      requestAnimationFrame(function () { self.render(); });
    });
    this._unsubscribers.push(u1);

    var u2 = store.on('node:changed', function () {
      requestAnimationFrame(function () { self.render(); });
    });
    this._unsubscribers.push(u2);

    var u3 = store.on('data:loaded', function () {
      requestAnimationFrame(function () { self.render(); });
    });
    this._unsubscribers.push(u3);
  };

  ConnectionLayer.prototype.setFocusChain = function (chainMap) {
    this._focusChainMap = chainMap;
    this.render();
  };

  ConnectionLayer.prototype.setPreviewChain = function (chainMap) {
    if (this._focusChainMap) return;
    this._previewChainMap = chainMap || null;

    var allPaths = this._gEl ? this._gEl.querySelectorAll('path[data-role="connection-line"], rect[data-role="connection-label-bg"], text[data-role="connection-label-text"]') : [];
    for (var i = 0; i < allPaths.length; i++) {
      var el = allPaths[i];
      var src = el.getAttribute('data-source');
      var tgt = el.getAttribute('data-target');
      if (!chainMap) {
        el.classList.remove('tt-focus-hide', 'tt-focus-line-highlight');
      } else if (chainMap[src] && chainMap[tgt]) {
        el.classList.add('tt-focus-line-highlight');
        el.classList.remove('tt-focus-hide');
      } else {
        el.classList.add('tt-focus-hide');
        el.classList.remove('tt-focus-line-highlight');
      }
    }
  };

  ConnectionLayer.prototype.setPreviewPair = function (sourceNodeId, targetNodeId) {
    if (this._focusChainMap) return;
    this._previewPair = (sourceNodeId && targetNodeId) ? { source: sourceNodeId, target: targetNodeId } : null;

    var self = this;
    var pp = this._previewPair;

    function applyClass(el) {
      var src = el.getAttribute('data-source');
      var tgt = el.getAttribute('data-target');
      var isMatch = pp && ((src === pp.source && tgt === pp.target) || (src === pp.target && tgt === pp.source));
      if (isMatch) {
        el.classList.add('tt-focus-line-highlight');
        el.classList.remove('tt-focus-hide');
      } else {
        el.classList.add('tt-focus-hide');
        el.classList.remove('tt-focus-line-highlight');
      }
    }

    var allEls = this._gEl ? this._gEl.querySelectorAll('path[data-role="connection-line"], rect[data-role="connection-label-bg"], text[data-role="connection-label-text"]') : [];
    for (var i = 0; i < allEls.length; i++) {
      applyClass(allEls[i]);
    }
  };

  ConnectionLayer.prototype.destroy = function () {
    for (var i = 0; i < this._unsubscribers.length; i++) {
      this._unsubscribers[i]();
    }
    this._unsubscribers = [];

    if (this._svgEl && this._svgEl.parentNode) {
      this._svgEl.parentNode.removeChild(this._svgEl);
    }
    this._svgEl = null;
    this._gEl = null;

    Emitter.prototype.destroy.call(this);
  };

  global.TT.ConnectionLayer = ConnectionLayer;

})(window);
