// ========== 选中管理器 ==========
// 负责悬停高亮、点击选中、选中框、手柄、浮层工具条、面包屑导航
class SelectionManager {
  constructor(eventBus, iframeManager, annotator, undoRedo) {
    this.bus = eventBus;
    this.iframe = iframeManager;
    this.annotator = annotator;
    this.undoRedo = undoRedo;

    this.overlay = null;
    this.hoverBox = null;
    this.hoverLabel = null;
    this.selectBox = null;
    this.floatToolbar = null;
    this.breadcrumb = null;

    this.selectedElement = null;
    this.hoveredElement = null;
    this.isDragging = false;
    this.isEditing = false;

    // 拖拽缩放状态
    this.isResizing = false;
    this.resizeHandle = null;       // 当前拖拽的手柄方向
    this.resizeStartX = 0;
    this.resizeStartY = 0;
    this.resizeStartWidth = 0;
    this.resizeStartHeight = 0;
    this.resizeStartRect = null;
    this.minSize = 20;              // 最小尺寸约束

    // 节流
    this.mousemoveTimer = null;
    this.lastMouseMove = 0;
    this.throttleMs = 50;

    this._init();
  }

  _init() {
    this.overlay = document.getElementById('overlay');
    this.hoverBox = document.getElementById('hoverBox');
    this.hoverLabel = document.getElementById('hoverLabel');
    this.selectBox = document.getElementById('selectBox');
    this.floatToolbar = document.getElementById('floatToolbar');
    this.breadcrumb = document.getElementById('breadcrumb');

    // 绑定覆盖层事件
    this.overlay.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.overlay.addEventListener('click', (e) => this._onClick(e));
    this.overlay.addEventListener('dblclick', (e) => this._onDblClick(e));
    document.addEventListener('keydown', (e) => this._onKeyDown(e));

    // 滚轮事件转发到外层 canvas-container（overlay 拦截了 wheel 事件）
    this.overlay.addEventListener('wheel', (e) => {
      const canvasContainer = document.querySelector('.canvas-container');
      if (canvasContainer) {
        canvasContainer.scrollTop += e.deltaY;
        canvasContainer.scrollLeft += e.deltaX;
      }
      e.preventDefault();
    }, { passive: false });

    // 监听 iframe 滚动（备用：如果 iframe 仍有内部滚动）
    this.bus.on('iframe-loaded', () => {
      const win = this.iframe.getWindow();
      if (win) {
        win.addEventListener('scroll', () => this._updateSelectionBox());
      }
      // iframe 加载后监听外层容器滚动，更新选中框
      const canvasContainer = document.querySelector('.canvas-container');
      if (canvasContainer && !this._canvasScrollBound) {
        this._canvasScrollBound = true;
        canvasContainer.addEventListener('scroll', () => {
          if (this.selectedElement) this._updateSelectionBox();
        });
      }
    });

    // 浮层工具条按钮
    this._initFloatToolbar();

    // 拖拽缩放手柄
    this._initResizeHandles();

    // 监听撤销/重做后刷新选中框
    this.bus.on('history-changed', () => {
      if (this.selectedElement) {
        this._updateSelectionBox();
      }
    });
  }

  _initFloatToolbar() {
    if (!this.floatToolbar) return;

    const buttons = this.floatToolbar.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        this._executeToolbarAction(action);
      });
    });
  }

  _initResizeHandles() {
    if (!this.selectBox) return;

    const handles = this.selectBox.querySelectorAll('.handle');
    handles.forEach(handle => {
      // 从 class 提取方向: handle-nw, handle-n, handle-ne, handle-e, handle-se, handle-s, handle-sw, handle-w
      const cls = Array.from(handle.classList).find(c => c.startsWith('handle-'));
      if (!cls) return;
      const direction = cls.replace('handle-', '');

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._startResize(direction, e);
      });
    });
  }

  _startResize(direction, e) {
    if (!this.selectedElement) return;

    this.isResizing = true;
    this.resizeHandle = direction;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;

    const rect = this.selectedElement.getBoundingClientRect();
    this.resizeStartWidth = rect.width;
    this.resizeStartHeight = rect.height;
    this.resizeStartRect = rect;

    // 获取父容器宽度用于百分比计算
    const parent = this.selectedElement.parentNode;
    const win = this.iframe.getWindow();
    this.parentWidth = 0;
    if (parent && win) {
      this.parentWidth = parent.getBoundingClientRect().width;
    }

    // 保存原始尺寸用于撤销
    this.oldWidth = this.selectedElement.style.width || '';
    this.oldHeight = this.selectedElement.style.height || '';

    // 监听全局移动和释放
    this._resizeMouseMove = (e) => this._onResizeMouseMove(e);
    this._resizeMouseUp = (e) => this._onResizeMouseUp(e);

    document.addEventListener('mousemove', this._resizeMouseMove);
    document.addEventListener('mouseup', this._resizeMouseUp);

    // 隐藏悬停框
    if (this.hoverBox) this.hoverBox.style.display = 'none';
  }

  _onResizeMouseMove(e) {
    if (!this.isResizing || !this.selectedElement) return;

    const dx = e.clientX - this.resizeStartX;
    const dy = e.clientY - this.resizeStartY;

    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;
    const dir = this.resizeHandle;

    // 根据手柄方向计算新尺寸
    if (dir.includes('e')) {
      newWidth = this.resizeStartWidth + dx;
    }
    if (dir.includes('w')) {
      newWidth = this.resizeStartWidth - dx;
    }
    if (dir.includes('s')) {
      newHeight = this.resizeStartHeight + dy;
    }
    if (dir.includes('n')) {
      newHeight = this.resizeStartHeight - dy;
    }

    // 最小尺寸约束
    newWidth = Math.max(this.minSize, newWidth);
    newHeight = Math.max(this.minSize, newHeight);

    // 智能单位转换：如果父容器宽度已知且宽度接近父容器宽度，用百分比
    const widthValue = this._smartUnit(newWidth, this.parentWidth, 'width');
    const heightValue = Math.round(newHeight) + 'px';

    // 应用样式
    if (dir.includes('e') || dir.includes('w')) {
      this.selectedElement.style.width = widthValue;
    }
    if (dir.includes('n') || dir.includes('s')) {
      this.selectedElement.style.height = heightValue;
    }

    // 实时更新选中框
    this._updateSelectionBox();

    // 发射样式变更事件
    this.bus.emit('style-changed', {
      element: this.selectedElement,
      prop: dir.includes('n') || dir.includes('s') ? 'height' : 'width',
      value: dir.includes('n') || dir.includes('s') ? heightValue : widthValue
    });
  }

  _smartUnit(pxValue, parentSize, dimension) {
    // 如果父容器宽度已知，且元素宽度 >= 父容器 60%，用百分比
    if (parentSize && parentSize > 0 && dimension === 'width') {
      const ratio = pxValue / parentSize;
      if (ratio >= 0.6) {
        return Math.round(ratio * 100) + '%';
      }
    }
    // 默认用 px
    return Math.round(pxValue) + 'px';
  }

  _onResizeMouseUp(e) {
    document.removeEventListener('mousemove', this._resizeMouseMove);
    document.removeEventListener('mouseup', this._resizeMouseUp);

    if (!this.isResizing || !this.selectedElement) {
      this.isResizing = false;
      this.resizeHandle = null;
      return;
    }

    const element = this.selectedElement;
    const newWidth = element.style.width;
    const newHeight = element.style.height;
    const oldWidth = this.oldWidth;
    const oldHeight = this.oldHeight;

    // 提交事务
    this.undoRedo.push({
      type: 'resize',
      forward: () => {
        element.style.width = newWidth;
        element.style.height = newHeight;
      },
      backward: () => {
        element.style.width = oldWidth;
        element.style.height = oldHeight;
      }
    });

    this.isResizing = false;
    this.resizeHandle = null;
    this._updateSelectionBox();
  }

  _executeToolbarAction(action) {
    if (!this.selectedElement) return;

    switch (action) {
      case 'delete':
        this._deleteElement();
        break;
      case 'duplicate':
        this._duplicateElement();
        break;
      case 'move-up':
        this._moveUp();
        break;
      case 'move-down':
        this._moveDown();
        break;
      case 'free-move':
        this._toggleFreePosition();
        break;
      case 'ai':
        this.bus.emit('ai-assistant-requested', { element: this.selectedElement });
        break;
    }
  }

  _deleteElement() {
    const el = this.selectedElement;
    if (!el) return;

    // 大元素删除确认：子元素超过 3 个或文本超过 200 字符
    const childCount = el.querySelectorAll('*').length;
    const textLength = (el.textContent || '').trim().length;
    if (childCount > 3 || textLength > 200) {
      if (!window.confirm(`确认删除此元素？（包含 ${childCount} 个子元素）`)) {
        return;
      }
    }

    const parent = el.parentNode;
    const nextSibling = el.nextSibling;
    const eid = el.getAttribute('data-eid');

    // 存储元素用于撤销
    const savedEl = el.cloneNode(true);

    // 执行删除
    parent.removeChild(el);

    // 提交事务
    this.undoRedo.push({
      type: 'delete',
      forward: () => {
        const current = this.annotator.getElementByEID(eid);
        if (current) current.parentNode.removeChild(current);
      },
      backward: () => {
        parent.insertBefore(savedEl, nextSibling);
      }
    });

    // 选中相邻元素
    if (nextSibling && nextSibling.nodeType === 1) {
      this.select(nextSibling);
    } else if (parent.children.length > 0) {
      this.select(parent.lastElementChild);
    } else {
      this.deselect();
    }

    this.bus.emit('element-deleted', { eid });
  }

  // 递归重新标注子树（用于复制元素后消除 eid 冲突）
  _reannotateSubtree(element) {
    // 清除自身旧 eid
    element.removeAttribute('data-eid');
    element.removeAttribute('data-type');
    // 重新标注
    this.annotator.annotateElement(element);

    // 递归处理子元素
    const children = element.querySelectorAll('*');
    children.forEach(child => {
      // 跳过非可视元素
      const tag = child.tagName.toLowerCase();
      if (['script', 'style', 'meta', 'link', 'head', 'title', 'base', 'noscript', 'template'].includes(tag)) return;
      if (child.hasAttribute('data-editor-injected')) return;

      // 清除旧 eid 并重新标注
      child.removeAttribute('data-eid');
      child.removeAttribute('data-type');
      this.annotator.annotateElement(child);
    });
  }

  _duplicateElement() {
    const el = this.selectedElement;
    if (!el) return;

    const clone = el.cloneNode(true);
    // 递归重新标注克隆元素及其所有子元素
    this._reannotateSubtree(clone);

    const parent = el.parentNode;
    const refNode = el.nextSibling;
    parent.insertBefore(clone, refNode);

    this.undoRedo.push({
      type: 'duplicate',
      forward: () => {
        if (!clone.isConnected) {
          parent.insertBefore(clone, refNode);
        }
      },
      backward: () => {
        if (clone.isConnected) {
          clone.remove();
        }
      }
    });

    this.select(clone);
    const newEid = clone.getAttribute('data-eid');
    this.bus.emit('element-added', { eid: newEid, element: clone });
  }

  _moveUp() {
    const el = this.selectedElement;
    if (!el) return;
    const prev = el.previousElementSibling;
    if (!prev) return;

    const parent = el.parentNode;
    // 当前顺序: prev, el → 目标顺序: el, prev
    parent.insertBefore(el, prev);

    this.undoRedo.push({
      type: 'reorder',
      forward: () => {
        // redo: 再次把 el 移到 prev 前面
        if (prev.isConnected && el.isConnected) {
          parent.insertBefore(el, prev);
        }
      },
      backward: () => {
        // undo: 恢复 prev 在 el 前面
        if (prev.isConnected && el.isConnected) {
          parent.insertBefore(prev, el);
        }
      }
    });

    this._updateSelectionBox();
  }

  _moveDown() {
    const el = this.selectedElement;
    if (!el) return;
    const next = el.nextElementSibling;
    if (!next) return;

    const parent = el.parentNode;
    // 当前顺序: el, next → 目标顺序: next, el
    parent.insertBefore(next, el);

    this.undoRedo.push({
      type: 'reorder',
      forward: () => {
        // redo: 再次把 next 移到 el 前面
        if (next.isConnected && el.isConnected) {
          parent.insertBefore(next, el);
        }
      },
      backward: () => {
        // undo: 恢复 el 在 next 前面
        if (next.isConnected && el.isConnected) {
          parent.insertBefore(el, next);
        }
      }
    });

    this._updateSelectionBox();
  }

  // 切换自由定位模式（position: absolute / static）
  _toggleFreePosition() {
    const el = this.selectedElement;
    if (!el) return;

    const win = this.iframe.getWindow();
    const cs = win ? win.getComputedStyle(el) : null;
    const isAbsolute = el.style.position === 'absolute';

    if (isAbsolute) {
      // 切回流式布局
      const oldLeft = el.style.left;
      const oldTop = el.style.top;
      const oldPosition = el.style.position;

      el.style.position = '';
      el.style.left = '';
      el.style.top = '';

      this.undoRedo.push({
        type: 'toggle-free-position-off',
        forward: () => {
          el.style.position = '';
          el.style.left = '';
          el.style.top = '';
        },
        backward: () => {
          el.style.position = oldPosition;
          el.style.left = oldLeft;
          el.style.top = oldTop;
        }
      });

      this.bus.emit('style-changed', { element: el, prop: 'position', value: 'static' });
    } else {
      // 切到自由定位：使用 offsetLeft/offsetTop 获取布局位置
      const left = el.offsetLeft;
      const top = el.offsetTop;
      const width = el.offsetWidth;

      const oldPosition = el.style.position;
      const oldLeft = el.style.left;
      const oldTop = el.style.top;
      const oldWidth = el.style.width;

      el.style.position = 'absolute';
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.width = width + 'px';

      this.undoRedo.push({
        type: 'toggle-free-position-on',
        forward: () => {
          el.style.position = 'absolute';
          el.style.left = left + 'px';
          el.style.top = top + 'px';
          el.style.width = width + 'px';
        },
        backward: () => {
          el.style.position = oldPosition;
          el.style.left = oldLeft || '';
          el.style.top = oldTop || '';
          el.style.width = oldWidth || '';
        }
      });

      this.bus.emit('style-changed', { element: el, prop: 'position', value: 'absolute' });
    }

    this._updateSelectionBox();
    this.bus.emit('element-selected', { element: el });
  }

  // 鼠标移动 — 悬停检测
  _onMouseMove(e) {
    const now = Date.now();
    if (now - this.lastMouseMove < this.throttleMs) return;
    this.lastMouseMove = now;

    // 如果正在编辑或拖拽或缩放，不处理悬停
    if (this.isEditing || this.isDragging || this.isResizing) return;

    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = this.iframe.elementFromPoint(x, y);
    if (!element || element === this.hoveredElement) return;

    // 跳过 body/html
    if (element.tagName === 'HTML' || element.tagName === 'BODY') {
      this.hoverBox.style.display = 'none';
      this.hoverLabel.style.display = 'none';
      return;
    }

    this.hoveredElement = element;
    this._updateHoverBox(element);

    // 发射悬停事件
    this.bus.emit('element-hovered', { element });
  }

  _updateHoverBox(element) {
    const rect = element.getBoundingClientRect();
    const iframeRect = this.iframe.iframe.getBoundingClientRect();

    this.hoverBox.style.display = 'block';
    this.hoverBox.style.left = rect.left + 'px';
    this.hoverBox.style.top = rect.top + 'px';
    this.hoverBox.style.width = rect.width + 'px';
    this.hoverBox.style.height = rect.height + 'px';

    // 更新标签
    const tag = element.tagName.toLowerCase();
    const cls = element.className ? '.' + element.className.split(' ')[0] : '';
    const eid = element.getAttribute('data-eid') || '';

    this.hoverLabel.style.display = 'block';
    this.hoverLabel.style.left = rect.left + 'px';
    this.hoverLabel.style.top = (rect.top - 20) + 'px';
    this.hoverLabel.textContent = `${tag}${cls}`;
  }

  // 点击选中
  _onClick(e) {
    if (this.isEditing) return;

    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = this.iframe.elementFromPoint(x, y);
    if (!element) {
      this.deselect();
      return;
    }

    // 跳过 body/html
    if (element.tagName === 'HTML' || element.tagName === 'BODY') {
      this.deselect();
      return;
    }

    // 智能向上寻祖：如果是纯文本或内联元素，找到最近的块级祖先
    const target = this._findSelectableAncestor(element);
    this.select(target);
  }

  _findSelectableAncestor(element) {
    let el = element;
    const inlineTags = ['span', 'a', 'strong', 'em', 'b', 'i', 'u', 'small', 'sub', 'sup', 'code', 'mark'];
    const textOnly = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3;

    // 如果是纯文本内联元素，向上找到块级
    while (el && el.parentNode) {
      const tag = el.tagName.toLowerCase();
      if (!inlineTags.includes(tag) && tag !== 'text') {
        return el;
      }
      el = el.parentNode;
    }

    return element;
  }

  // 双击 — 内联编辑
  _onDblClick(e) {
    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = this.iframe.elementFromPoint(x, y);
    if (!element) return;

    // 检查是否是可编辑文本元素
    const editableTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'li', 'label'];
    const tag = element.tagName.toLowerCase();

    if (editableTags.includes(tag)) {
      this.bus.emit('inline-edit-start', { element });
    }
  }

  // 选中元素
  select(element) {
    if (!element) return;

    this.selectedElement = element;
    this._updateSelectionBox();
    this._updateBreadcrumb();
    this._updateFloatToolbar();

    // 发射选中事件
    const eid = element.getAttribute('data-eid');
    const type = this.annotator.getElementType(element);
    this.bus.emit('element-selected', { element, eid, type });
  }

  // 取消选中
  deselect() {
    this.selectedElement = null;
    if (this.selectBox) this.selectBox.style.display = 'none';
    if (this.floatToolbar) this.floatToolbar.style.display = 'none';
    this._clearBreadcrumb();
    this.bus.emit('element-deselected');
  }

  // 更新选中框位置
  _updateSelectionBox() {
    if (!this.selectedElement || !this.selectBox) return;

    const rect = this.selectedElement.getBoundingClientRect();
    const iframeRect = this.iframe.iframe.getBoundingClientRect();

    this.selectBox.style.display = 'block';
    this.selectBox.style.left = rect.left + 'px';
    this.selectBox.style.top = rect.top + 'px';
    this.selectBox.style.width = rect.width + 'px';
    this.selectBox.style.height = rect.height + 'px';

    // 更新手柄位置（通过 CSS 已自动定位）
    // 更新浮层工具条位置
    this._updateFloatToolbar();
  }

  // 更新浮层工具条
  _updateFloatToolbar() {
    if (!this.floatToolbar || !this.selectedElement) return;

    const rect = this.selectedElement.getBoundingClientRect();
    let top = rect.top - 40;

    // 边缘翻转：如果太靠上，放下面
    if (top < 0) {
      top = rect.bottom + 8;
    }

    this.floatToolbar.style.display = 'flex';
    this.floatToolbar.style.top = top + 'px';
    this.floatToolbar.style.left = (rect.left + rect.width / 2) + 'px';
    this.floatToolbar.style.transform = 'translateX(-50%)';

    // 高亮自由定位按钮
    const freeMoveBtn = this.floatToolbar.querySelector('[data-action="free-move"]');
    if (freeMoveBtn) {
      const isAbsolute = this.selectedElement.style.position === 'absolute';
      freeMoveBtn.classList.toggle('active', isAbsolute);
    }
  }

  // 更新面包屑导航
  _updateBreadcrumb() {
    if (!this.breadcrumb || !this.selectedElement) return;

    this.breadcrumb.innerHTML = '';
    const chain = [];
    let el = this.selectedElement;

    while (el && el.tagName !== 'HTML') {
      const tag = el.tagName.toLowerCase();
      const cls = el.className ? el.className.split(' ')[0] : '';
      chain.unshift({ tag, cls, element: el });
      el = el.parentNode;
    }

    chain.forEach((item, i) => {
      const crumb = document.createElement('span');
      crumb.className = 'breadcrumb-item';
      if (i === chain.length - 1) crumb.classList.add('current');
      crumb.textContent = item.tag + (item.cls ? '.' + item.cls : '');
      crumb.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select(item.element);
      });
      this.breadcrumb.appendChild(crumb);

      if (i < chain.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-sep';
        sep.textContent = '›';
        this.breadcrumb.appendChild(sep);
      }
    });
  }

  _clearBreadcrumb() {
    if (this.breadcrumb) this.breadcrumb.innerHTML = '';
  }

  // 键盘事件
  _onKeyDown(e) {
    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undoRedo.undo();
      return;
    }
    // Ctrl+Shift+Z 或 Ctrl+Y 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.undoRedo.redo();
      return;
    }
    // Delete 删除
    if (e.key === 'Delete' && this.selectedElement && !this.isEditing) {
      e.preventDefault();
      this._deleteElement();
      return;
    }
    // Ctrl+I — AI 助手
    if ((e.ctrlKey || e.metaKey) && e.key === 'i' && this.selectedElement) {
      e.preventDefault();
      this.bus.emit('ai-assistant-requested', { element: this.selectedElement });
      return;
    }
    // Esc 取消选中
    if (e.key === 'Escape') {
      if (this.isEditing) {
        this.bus.emit('inline-edit-end');
      } else {
        this.deselect();
      }
      return;
    }
  }

  setEditingState(editing) {
    this.isEditing = editing;
    if (editing) {
      if (this.hoverBox) this.hoverBox.style.display = 'none';
      if (this.selectBox) this.selectBox.style.display = 'none';
      if (this.floatToolbar) this.floatToolbar.style.display = 'none';
    } else {
      if (this.selectedElement) {
        this._updateSelectionBox();
      }
    }
  }

  getSelectedElement() {
    return this.selectedElement;
  }
}
