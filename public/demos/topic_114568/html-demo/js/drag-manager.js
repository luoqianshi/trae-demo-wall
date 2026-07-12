// ========== 拖拽管理器 ==========
// 处理三件事：
// 1. 从左侧素材面板拖拽新元素到画布（Task 9）
// 2. 在画布内拖拽元素重新排序（Task 10 — DOM 节点重排）
// 3. 自由定位模式 — position:absolute 自由拖动（用户反馈 #4）

class DragManager {
  constructor(eventBus, iframeManager, annotator, undoRedo, elementFactory, selection) {
    this.bus = eventBus;
    this.iframe = iframeManager;
    this.annotator = annotator;
    this.undoRedo = undoRedo;
    this.factory = elementFactory;
    this.selection = selection;

    this.overlay = null;
    this.insertIndicator = null;

    // 素材面板拖拽状态
    this.draggingType = null;
    this.isMaterialDragging = false;

    // 画布内重排序状态
    this.isReordering = false;
    this.reorderElement = null;
    this.reorderStartX = 0;
    this.reorderStartY = 0;
    this.reorderOffset = { x: 0, y: 0 };

    // 自由定位状态
    this.isFreeMoving = false;
    this.freeMoveElement = null;
    this.freeMoveStartX = 0;
    this.freeMoveStartY = 0;
    this.freeMoveStartLeft = 0;
    this.freeMoveStartTop = 0;

    // 拖拽阈值
    this.dragThreshold = 5;

    this._init();
  }

  _init() {
    this.overlay = document.getElementById('overlay');
    this.insertIndicator = document.getElementById('insertIndicator');

    this._initMaterialDrag();
    this._initReorderDrag();
    this._initFreeMoveDrag();
  }

  // ==================== 素材面板 → 画布 ====================

  _initMaterialDrag() {
    const materialItems = document.querySelectorAll('.material-item[draggable="true"]');

    materialItems.forEach(item => {
      // 添加 + 徽章
      const badge = document.createElement('span');
      badge.className = 'add-badge';
      badge.textContent = '+';
      item.appendChild(badge);

      // dragstart：记录素材类型
      item.addEventListener('dragstart', (e) => {
        this.draggingType = item.getAttribute('data-add');
        this.isMaterialDragging = true;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', this.draggingType);
      });

      item.addEventListener('dragend', () => {
        this.isMaterialDragging = false;
        this.draggingType = null;
        this._hideInsertIndicator();
      });

      // 点击插入（用户反馈 #5：找不到新增插入元素的按钮）
      item.addEventListener('click', (e) => {
        // 如果是拖拽结束的 click，忽略
        if (this._justDragged) {
          this._justDragged = false;
          return;
        }
        const type = item.getAttribute('data-add');
        this._insertElementAtEnd(type);
      });
    });

    // overlay 作为 drop 目标
    if (this.overlay) {
      this.overlay.addEventListener('dragover', (e) => {
        if (!this.isMaterialDragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this._updateMaterialDropPosition(e);
      });

      this.overlay.addEventListener('drop', (e) => {
        if (!this.isMaterialDragging) return;
        e.preventDefault();
        this._justDragged = true;
        this._handleMaterialDrop(e);
      });

      this.overlay.addEventListener('dragleave', (e) => {
        if (e.target === this.overlay) {
          this._hideInsertIndicator();
        }
      });
    }
  }

  // 点击素材 → 插入到页面末尾（或选中元素后面）
  _insertElementAtEnd(type) {
    const newElement = this.factory.createElement(type);
    if (!newElement) return;

    const doc = this.iframe.getDocument();
    if (!doc) return;

    // 优先插入到选中元素后面
    const selected = this.selection.getSelectedElement();
    let parent, refNode;

    if (selected && selected !== doc.body) {
      parent = selected.parentNode;
      refNode = selected.nextSibling;
    } else {
      parent = doc.body;
      refNode = null;
    }

    parent.insertBefore(newElement, refNode);

    // 提交事务
    const insertedElement = newElement;
    const parentOfInserted = newElement.parentNode;
    const nextSibling = newElement.nextSibling;

    this.undoRedo.push({
      type: 'add-element',
      forward: () => {
        if (!insertedElement.isConnected) {
          parentOfInserted.insertBefore(insertedElement, nextSibling);
        }
      },
      backward: () => {
        if (insertedElement.isConnected) {
          insertedElement.remove();
        }
      }
    });

    // 选中新元素并滚动到可见区域
    this.selection.select(newElement);
    try { newElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) { /* iframe cross-context */ }

    this.bus.emit('element-added', { element: newElement });
  }

  // 计算拖拽位置，显示插入指示线
  _updateMaterialDropPosition(e) {
    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = this.iframe.elementFromPoint(x, y);
    if (!element || element.tagName === 'HTML' || element.tagName === 'BODY') {
      this._hideInsertIndicator();
      return;
    }

    const elRect = element.getBoundingClientRect();
    const elMid = elRect.top + elRect.height / 2;
    const insertBefore = y < (elMid - rect.top);

    this._showInsertIndicator(elRect, insertBefore, rect);
  }

  // 处理素材 drop
  _handleMaterialDrop(e) {
    const type = this.draggingType;
    if (!type) return;

    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement = this.factory.createElement(type);
    if (!newElement) return;

    const doc = this.iframe.getDocument();
    if (!doc) return;

    const targetElement = this.iframe.elementFromPoint(x, y);

    if (targetElement && targetElement.tagName !== 'HTML' && targetElement.tagName !== 'BODY') {
      const elRect = targetElement.getBoundingClientRect();
      const elMid = elRect.top + elRect.height / 2;
      const insertBefore = y < (elMid - rect.top);

      const parent = targetElement.parentNode;
      if (insertBefore) {
        parent.insertBefore(newElement, targetElement);
      } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
      }
    } else {
      doc.body.appendChild(newElement);
    }

    const insertedElement = newElement;
    const parentOfInserted = newElement.parentNode;
    const nextSibling = newElement.nextSibling;

    this.undoRedo.push({
      type: 'add-element',
      forward: () => {
        if (!insertedElement.isConnected) {
          parentOfInserted.insertBefore(insertedElement, nextSibling);
        }
      },
      backward: () => {
        if (insertedElement.isConnected) {
          insertedElement.remove();
        }
      }
    });

    this.selection.select(newElement);
    this._hideInsertIndicator();
    this.bus.emit('element-added', { element: newElement });

    this.isMaterialDragging = false;
    this.draggingType = null;
  }

  // ==================== 画布内重排序（流式布局模式） ====================

  _initReorderDrag() {
    if (!this.overlay) return;

    this.overlay.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const target = e.target;
      if (target.classList.contains('handle')) return;
      if (target.closest('.float-toolbar')) return;

      const selected = this.selection.getSelectedElement();
      if (!selected) return;

      // 如果元素是自由定位模式，交给 freeMove 处理
      if (selected.style.position === 'absolute') return;

      const rect = this.iframe.iframe.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const element = this.iframe.elementFromPoint(x, y);

      // 检查是否点击在选中元素或其子元素上（容器内点击也应触发拖拽）
      if (element === selected || selected.contains(element)) {
        this.reorderStartX = e.clientX;
        this.reorderStartY = e.clientY;
        this.reorderElement = selected;

        const elRect = selected.getBoundingClientRect();
        this.reorderOffset.x = x - elRect.left;
        this.reorderOffset.y = y - elRect.top;

        this._reorderMouseMove = (e) => this._onReorderMouseMove(e);
        this._reorderMouseUp = (e) => this._onReorderMouseUp(e);

        document.addEventListener('mousemove', this._reorderMouseMove);
        document.addEventListener('mouseup', this._reorderMouseUp);
      }
    });
  }

  _onReorderMouseMove(e) {
    if (!this.reorderElement) return;

    const dx = Math.abs(e.clientX - this.reorderStartX);
    const dy = Math.abs(e.clientY - this.reorderStartY);

    if (!this.isReordering && (dx > this.dragThreshold || dy > this.dragThreshold)) {
      this.isReordering = true;
      const selectBox = document.getElementById('selectBox');
      if (selectBox) {
        selectBox.style.opacity = '0.4';
        selectBox.style.borderStyle = 'dashed';
      }
      const hoverBox = document.getElementById('hoverBox');
      if (hoverBox) hoverBox.style.display = 'none';
    }

    if (!this.isReordering) return;

    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.reorderElement.style.pointerEvents = 'none';
    const elementBelow = this.iframe.elementFromPoint(x, y);
    this.reorderElement.style.pointerEvents = '';

    if (!elementBelow || elementBelow === this.reorderElement) {
      this._hideInsertIndicator();
      return;
    }

    if (this.reorderElement.contains(elementBelow)) {
      this._hideInsertIndicator();
      return;
    }

    const elRect = elementBelow.getBoundingClientRect();
    const elMid = elRect.top + elRect.height / 2;
    const insertBefore = y < (elMid - rect.top);

    this._showInsertIndicator(elRect, insertBefore, rect);
  }

  _onReorderMouseUp(e) {
    document.removeEventListener('mousemove', this._reorderMouseMove);
    document.removeEventListener('mouseup', this._reorderMouseUp);

    if (!this.isReordering || !this.reorderElement) {
      this.isReordering = false;
      this.reorderElement = null;
      const selectBox = document.getElementById('selectBox');
      if (selectBox) { selectBox.style.opacity = ''; selectBox.style.borderStyle = ''; }
      return;
    }

    const rect = this.iframe.iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.reorderElement.style.pointerEvents = 'none';
    const elementBelow = this.iframe.elementFromPoint(x, y);
    this.reorderElement.style.pointerEvents = '';

    const draggedElement = this.reorderElement;
    const oldParent = draggedElement.parentNode;
    const oldNextSibling = draggedElement.nextSibling;

    if (elementBelow && elementBelow !== draggedElement && !draggedElement.contains(elementBelow)) {
      const elRect = elementBelow.getBoundingClientRect();
      const elMid = elRect.top + elRect.height / 2;
      const insertBefore = y < (elMid - rect.top);

      const newParent = elementBelow.parentNode;
      let refNode = insertBefore ? elementBelow : elementBelow.nextSibling;

      if (refNode === draggedElement) {
        refNode = draggedElement.nextSibling;
      }

      if (newParent !== oldParent || refNode !== oldNextSibling) {
        newParent.insertBefore(draggedElement, refNode);

        const newRefNode = insertBefore ? elementBelow : elementBelow.nextSibling;
        this.undoRedo.push({
          type: 'reorder',
          forward: () => { newParent.insertBefore(draggedElement, newRefNode); },
          backward: () => { oldParent.insertBefore(draggedElement, oldNextSibling); }
        });

        this.selection._updateSelectionBox();
      }
    }

    const selectBox = document.getElementById('selectBox');
    if (selectBox) { selectBox.style.opacity = ''; selectBox.style.borderStyle = ''; }

    this._hideInsertIndicator();
    this.isReordering = false;
    this.reorderElement = null;
  }

  // ==================== 自由定位模式（position:absolute） ====================

  _initFreeMoveDrag() {
    if (!this.overlay) return;

    // 当选中元素是 absolute 定位时，拖拽 = 修改 top/left
    this.overlay.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const target = e.target;
      if (target.classList.contains('handle')) return;
      if (target.closest('.float-toolbar')) return;

      const selected = this.selection.getSelectedElement();
      if (!selected) return;

      // 只有 absolute 定位才走自由移动
      if (selected.style.position !== 'absolute') return;

      const rect = this.iframe.iframe.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const element = this.iframe.elementFromPoint(x, y);

      if (element === selected || selected.contains(element)) {
        this.isFreeMoving = true;
        this.freeMoveElement = selected;
        this.freeMoveStartX = e.clientX;
        this.freeMoveStartY = e.clientY;

        const win = this.iframe.getWindow();
        const cs = win ? win.getComputedStyle(selected) : null;
        this.freeMoveStartLeft = parseInt(cs?.left) || 0;
        this.freeMoveStartTop = parseInt(cs?.top) || 0;

        this._freeMoveMouseMove = (e) => this._onFreeMoveMouseMove(e);
        this._freeMoveMouseUp = (e) => this._onFreeMoveMouseUp(e);

        document.addEventListener('mousemove', this._freeMoveMouseMove);
        document.addEventListener('mouseup', this._freeMoveMouseUp);

        e.preventDefault();
      }
    });
  }

  _onFreeMoveMouseMove(e) {
    if (!this.isFreeMoving || !this.freeMoveElement) return;

    const dx = e.clientX - this.freeMoveStartX;
    const dy = e.clientY - this.freeMoveStartY;

    const newLeft = this.freeMoveStartLeft + dx;
    const newTop = this.freeMoveStartTop + dy;

    this.freeMoveElement.style.left = newLeft + 'px';
    this.freeMoveElement.style.top = newTop + 'px';

    // 实时更新选中框
    this.selection._updateSelectionBox();
  }

  _onFreeMoveMouseUp(e) {
    document.removeEventListener('mousemove', this._freeMoveMouseMove);
    document.removeEventListener('mouseup', this._freeMoveMouseUp);

    if (!this.isFreeMoving || !this.freeMoveElement) {
      this.isFreeMoving = false;
      this.freeMoveElement = null;
      return;
    }

    const element = this.freeMoveElement;
    const newLeft = element.style.left;
    const newTop = element.style.top;
    const oldLeft = this.freeMoveStartLeft + 'px';
    const oldTop = this.freeMoveStartTop + 'px';

    // 只有位置确实变了才提交
    if (newLeft !== oldLeft || newTop !== oldTop) {
      this.undoRedo.push({
        type: 'free-move',
        forward: () => {
          element.style.left = newLeft;
          element.style.top = newTop;
        },
        backward: () => {
          element.style.left = oldLeft;
          element.style.top = oldTop;
        }
      });
    }

    this.isFreeMoving = false;
    this.freeMoveElement = null;
    this.selection._updateSelectionBox();
  }

  // ==================== 插入指示线 ====================

  _showInsertIndicator(elRect, insertBefore, iframeRect) {
    if (!this.insertIndicator) return;

    const top = insertBefore ? elRect.top : elRect.bottom;
    const left = elRect.left;
    const width = elRect.width;

    this.insertIndicator.style.display = 'block';
    this.insertIndicator.style.top = (top - 1) + 'px';
    this.insertIndicator.style.left = left + 'px';
    this.insertIndicator.style.width = width + 'px';
  }

  _hideInsertIndicator() {
    if (this.insertIndicator) {
      this.insertIndicator.style.display = 'none';
    }
  }
}
