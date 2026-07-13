(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  var PANEL_WIDTH = 640;
  var PANEL_HEIGHT = 800;
  var TRANSITION_MS = 400;

  // 重要性对应的强调色
  var ACCENT_COLORS = {
    breakthrough: '#E8E6E1',
    important: '#E8936F',
    minor: '#565453'
  };

  function NodeDetail() {
    Emitter.call(this);
    this._el = null;
    this._sourceEl = null;
    this._sourceParent = null;
    this._sourceNextSibling = null;
    this._savedStyles = null;
    this._data = null;
    this._open = false;
    this._closing = false;
    this._build();
    this._bindEvents();
  }

  NodeDetail.prototype = Object.create(Emitter.prototype);
  NodeDetail.prototype.constructor = NodeDetail;

  NodeDetail.create = function () {
    return new NodeDetail();
  };

  NodeDetail.prototype._build = function () {
    var el = document.createElement('div');
    el.setAttribute('data-role', 'node-detail-overlay');
    el.style.cssText = 'position:fixed;inset:0;z-index:1000;pointer-events:none;';

    var mask = document.createElement('div');
    mask.setAttribute('data-role', 'node-detail-mask');
    mask.style.cssText =
      'position:absolute;inset:0;background:rgba(0,0,0,0);' +
      'transition:background ' + TRANSITION_MS + 'ms ease;pointer-events:none;';
    el.appendChild(mask);

    document.body.appendChild(el);
    this._el = el;
    this._maskEl = mask;
  };

  NodeDetail.prototype._bindEvents = function () {
    var self = this;
    this._maskEl.addEventListener('click', function () { self.close(); });
    this._keyHandler = function (e) {
      if (e.key === 'Escape' && self._open && !self._closing) self.close();
    };
    window.addEventListener('keydown', this._keyHandler);
  };

  NodeDetail.prototype._saveStyles = function (el) {
    var snapshot = {};
    var props = ['position','left','top','right','bottom','width','height',
      'margin','padding','transform','transition','box-shadow','border-radius',
      'opacity','z-index','pointer-events','overflow','display','flex-direction',
      'background','border'];
    for (var i = 0; i < props.length; i++) {
      snapshot[props[i]] = el.style.getPropertyValue(props[i]);
    }
    return snapshot;
  };

  NodeDetail.prototype._restoreStyles = function (el, snapshot) {
    var props = Object.keys(snapshot);
    for (var i = 0; i < props.length; i++) {
      if (snapshot[props[i]] === '') {
        el.style.removeProperty(props[i]);
      } else {
        el.style.setProperty(props[i], snapshot[props[i]]);
      }
    }
  };

  NodeDetail.prototype.open = function (nodeData, sourceEl) {
    if (this._open) return;
    this._open = true;
    this._data = nodeData;
    this._sourceEl = sourceEl;

    this._savedStyles = this._saveStyles(sourceEl);
    this._savedHTML = sourceEl.innerHTML;
    this._sourceParent = sourceEl.parentNode;
    this._sourceNextSibling = sourceEl.nextSibling;

    var rect = sourceEl.getBoundingClientRect();

    sourceEl.parentNode.removeChild(sourceEl);
    document.body.appendChild(sourceEl);

    sourceEl.style.position = 'fixed';
    sourceEl.style.left = rect.left + 'px';
    sourceEl.style.top = rect.top + 'px';
    sourceEl.style.right = 'auto';
    sourceEl.style.bottom = 'auto';
    sourceEl.style.width = rect.width + 'px';
    sourceEl.style.height = rect.height + 'px';
    sourceEl.style.margin = '0';
    sourceEl.style.transform = 'none';
    sourceEl.style.zIndex = '1001';
    sourceEl.style.pointerEvents = 'auto';
    sourceEl.style.overflow = 'hidden';
    sourceEl.style.background = '#1E1D1C';

    void sourceEl.offsetHeight;

    sourceEl.style.transition =
      'width ' + TRANSITION_MS + 'ms cubic-bezier(0.16,1,0.3,1),' +
      'height ' + TRANSITION_MS + 'ms cubic-bezier(0.16,1,0.3,1),' +
      'left ' + TRANSITION_MS + 'ms cubic-bezier(0.16,1,0.3,1),' +
      'top ' + TRANSITION_MS + 'ms cubic-bezier(0.16,1,0.3,1),' +
      'box-shadow ' + TRANSITION_MS + 'ms ease,' +
      'border-radius ' + TRANSITION_MS + 'ms ease';

    this._maskEl.style.pointerEvents = 'auto';
    this._maskEl.style.background = 'rgba(0,0,0,0.6)';

    var targetLeft = (window.innerWidth - PANEL_WIDTH) / 2;
    var targetTop = (window.innerHeight - PANEL_HEIGHT) / 2;
    if (targetTop < 16) targetTop = 16;

    var self = this;
    requestAnimationFrame(function () {
      sourceEl.style.left = targetLeft + 'px';
      sourceEl.style.top = targetTop + 'px';
      sourceEl.style.width = PANEL_WIDTH + 'px';
      sourceEl.style.height = PANEL_HEIGHT + 'px';
      sourceEl.style.boxShadow = '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,230,225,0.06)';
      sourceEl.style.borderRadius = '20px';

      setTimeout(function () {
        self._injectDetailContent(sourceEl, nodeData);
      }, TRANSITION_MS * 0.4);
    });

    this.emit('open', { nodeId: nodeData.id });
  };

  NodeDetail.prototype._injectDetailContent = function (cardEl, data) {
    var self = this;

    // 隐藏原有卡片元素
    var expand = cardEl.querySelector('[data-role="node-expand"]');
    var relDot = cardEl.querySelector('[data-role="node-relations"]');
    var impRing = cardEl.querySelector('[data-role="node-importance"]');
    if (expand) { expand.style.transition = 'opacity 0.15s ease'; expand.style.opacity = '0'; }
    if (relDot) { relDot.style.transition = 'opacity 0.15s ease'; relDot.style.opacity = '0'; }
    if (impRing) { impRing.style.transition = 'opacity 0.15s ease'; impRing.style.opacity = '0'; }

    setTimeout(function () {
      if (expand) expand.style.display = 'none';

      // 复用 EventDetailView 的 article 结构（不含 CTA）
      var EventDetailView = global.TT.EventDetailView;
      var articleHtml = EventDetailView
        ? EventDetailView.buildArticleHTML(data.id, false)
        : '';

      cardEl.style.display = 'flex';
      cardEl.style.flexDirection = 'column';
      cardEl.style.padding = '0';
      cardEl.style.border = 'none';
      cardEl.style.background = '#fff';
      cardEl.style.overflow = 'hidden';

      // 用 detail-view 容器包裹 article，复用 detail.css 样式
      var wrapper = document.createElement('div');
      wrapper.setAttribute('data-role', 'detail-view');
      wrapper.style.cssText = 'width:100%;height:100%;overflow-y:auto;background:#fff;';
      wrapper.innerHTML = articleHtml;
      cardEl.innerHTML = '';
      cardEl.appendChild(wrapper);

      // 关闭按钮
      var closeBtn = document.createElement('button');
      closeBtn.setAttribute('data-role', 'node-detail-close');
      closeBtn.style.cssText =
        'position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;' +
        'color:#fff;font-size:26px;cursor:pointer;padding:4px 10px;' +
        'line-height:1;border-radius:8px;opacity:0;transition:opacity 0.25s ease;z-index:10;' +
        'backdrop-filter:blur(4px);';
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', function () { self.close(); });
      cardEl.appendChild(closeBtn);

      requestAnimationFrame(function () {
        closeBtn.style.opacity = '1';
      });
    }, 100);
  };

  NodeDetail.prototype.close = function () {
    if (!this._open || this._closing) return;
    this._closing = true;

    var cardEl = this._sourceEl;
    if (!cardEl) { this._reset(); return; }

    // 淡出内容
    var wrapper = cardEl.querySelector('[data-role="detail-view"]');
    var closeBtn = cardEl.querySelector('[data-role="node-detail-close"]');
    if (wrapper) { wrapper.style.transition = 'opacity 0.12s ease'; wrapper.style.opacity = '0'; }
    if (closeBtn) { closeBtn.style.transition = 'opacity 0.1s ease'; closeBtn.style.opacity = '0'; }

    var self = this;
    setTimeout(function () {
      // 恢复原始卡片 HTML
      cardEl.innerHTML = self._savedHTML;
      cardEl.style.display = '';
      cardEl.style.flexDirection = '';
      cardEl.style.background = '';
      cardEl.style.border = '';
      cardEl.style.padding = '';
      cardEl.style.overflow = '';

      // 计算原位置
      var parent = self._sourceParent;
      var parentRect = parent.getBoundingClientRect();
      var savedTop = parseFloat(self._savedStyles.top) || 0;
      var savedLeft = parseFloat(self._savedStyles.left) || 0;
      var originalWidth = parentRect.width - 36;
      var originalHeight = 44;
      var targetTop = parentRect.top + savedTop - originalHeight / 2;
      var targetLeft = parentRect.left + savedLeft;

      cardEl.style.left = targetLeft + 'px';
      cardEl.style.top = targetTop + 'px';
      cardEl.style.width = originalWidth + 'px';
      cardEl.style.height = originalHeight + 'px';
      cardEl.style.padding = self._savedStyles.padding || '';
      cardEl.style.boxShadow = '';
      cardEl.style.borderRadius = '';
      cardEl.style.transform = 'none';
      cardEl.style.overflow = '';

      self._maskEl.style.background = 'rgba(0,0,0,0)';

      setTimeout(function () {
        self._reset();
      }, TRANSITION_MS);
    }, 180);
  };

  NodeDetail.prototype._reset = function () {
    var cardEl = this._sourceEl;
    if (cardEl && this._sourceParent) {
      if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
      this._restoreStyles(cardEl, this._savedStyles);
      if (this._sourceNextSibling) {
        this._sourceParent.insertBefore(cardEl, this._sourceNextSibling);
      } else {
        this._sourceParent.appendChild(cardEl);
      }
    }

    this._maskEl.style.pointerEvents = 'none';
    this._open = false;
    this._closing = false;
    this._sourceEl = null;
    this._sourceParent = null;
    this._sourceNextSibling = null;
    this._savedStyles = null;
    this.emit('close', {});
  };

  NodeDetail.prototype.isOpen = function () { return this._open; };

  NodeDetail.prototype.destroy = function () {
    window.removeEventListener('keydown', this._keyHandler);
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
    this._sourceEl = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT.NodeDetail = NodeDetail;

})(window);
