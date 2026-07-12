// ========== 布局安全检测 ==========
// 检测 flex/grid 容器内的操作风险，显示警告
class LayoutDetector {
  constructor(eventBus, iframeManager) {
    this.bus = eventBus;
    this.iframe = iframeManager;
    this.warningTimeout = null;
    this.warningEl = null;
    this._init();
  }

  _init() {
    // 创建警告提示元素
    this.warningEl = document.createElement('div');
    this.warningEl.className = 'layout-warning';
    this.warningEl.style.cssText = `
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      background: var(--bg-elevated, #2a2724); color: var(--warning, #c4a96a);
      border: 1px solid var(--border-strong, #4a4540); border-radius: 6px;
      padding: 8px 16px; font-size: 12px; z-index: 1000; display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px;
    `;
    document.body.appendChild(this.warningEl);

    // 监听样式变更
    this.bus.on('style-changed', ({ element, prop, value }) => {
      this._checkStyle(element, prop, value);
    });
  }

  _checkStyle(element, prop, value) {
    // 检查 position 修改
    if (prop === 'position' && value !== 'static' && value !== 'relative') {
      const parent = element.parentNode;
      if (parent) {
        const parentDisplay = this._getParentDisplay(parent);
        if (parentDisplay === 'flex' || parentDisplay === 'grid') {
          this._showWarning(`此元素在 ${parentDisplay} 容器内，修改 position 为 ${value} 可能脱离布局流`);
        }
      }
    }

    // 检查 transform
    if (prop === 'transform' && value && value !== 'none') {
      const parent = element.parentNode;
      if (parent) {
        const parentDisplay = this._getParentDisplay(parent);
        if (parentDisplay === 'flex' || parentDisplay === 'grid') {
          this._showWarning(`此元素在 ${parentDisplay} 容器内，添加 transform 可能影响布局`);
        }
      }
    }

    // 检查 float
    if (prop === 'float' && value !== 'none') {
      this._showWarning('float 在现代布局中已不推荐使用，可能导致布局问题');
    }
  }

  _getParentDisplay(parent) {
    const win = this.iframe.getWindow();
    if (!win) return 'block';
    try {
      return win.getComputedStyle(parent).display;
    } catch (e) {
      return 'block';
    }
  }

  _showWarning(message) {
    if (!this.warningEl) return;
    this.warningEl.textContent = '⚠ ' + message;
    this.warningEl.style.display = 'block';

    clearTimeout(this.warningTimeout);
    this.warningTimeout = setTimeout(() => {
      this.warningEl.style.display = 'none';
    }, 4000);
  }

  // 获取元素的布局信息
  getLayoutInfo(element) {
    const win = this.iframe.getWindow();
    if (!win || !element) return null;

    try {
      const cs = win.getComputedStyle(element);
      const parent = element.parentNode;
      const parentCs = parent ? win.getComputedStyle(parent) : null;

      return {
        display: cs.display,
        position: cs.position,
        parentDisplay: parentCs ? parentCs.display : 'block',
        isFlexChild: parentCs ? (parentCs.display === 'flex' || parentCs.display === 'inline-flex') : false,
        isGridChild: parentCs ? (parentCs.display === 'grid' || parentCs.display === 'inline-grid') : false,
        hasTransform: cs.transform !== 'none',
        zIndex: cs.zIndex,
      };
    } catch (e) {
      return null;
    }
  }
}
