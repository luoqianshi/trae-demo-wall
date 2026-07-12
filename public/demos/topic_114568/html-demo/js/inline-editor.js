// ========== 内联文字编辑 ==========
// 双击文本元素 → contenteditable="plaintext-only" + 粘贴消毒 + 回车拦截
class InlineEditor {
  constructor(eventBus, iframeManager, undoRedo) {
    this.bus = eventBus;
    this.iframe = iframeManager;
    this.undoRedo = undoRedo;
    this.editingElement = null;
    this.originalText = '';
    this.isComposing = false;

    this._init();
  }

  _init() {
    this.bus.on('inline-edit-start', ({ element }) => this.startEdit(element));
    this.bus.on('inline-edit-end', () => this.endEdit());
  }

  startEdit(element) {
    if (this.editingElement) {
      this.endEdit();
    }

    this.editingElement = element;
    this.originalText = element.textContent;
    this.isComposing = false;

    // 启用 contenteditable plaintext-only
    element.setAttribute('contenteditable', 'plaintext-only');
    element.focus();

    // 选中全部文字
    const doc = this.iframe.getDocument();
    const range = doc.createRange();
    range.selectNodeContents(element);
    const sel = doc.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // 绑定事件
    this._bindEvents(element);

    this.bus.emit('editing-state-changed', { editing: true });
  }

  endEdit() {
    if (!this.editingElement) return;

    const element = this.editingElement;
    const newText = element.textContent;

    // 移除 contenteditable
    element.removeAttribute('contenteditable');

    // 解绑事件
    this._unbindEvents(element);

    // 如果内容变了，提交事务
    if (newText !== this.originalText) {
      const oldText = this.originalText;
      const eid = element.getAttribute('data-eid');

      this.undoRedo.pushDebounced({
        type: 'edit-text',
        forward: () => {
          element.textContent = newText;
        },
        backward: () => {
          element.textContent = oldText;
        }
      });
    }

    this.editingElement = null;
    this.originalText = '';
    this.bus.emit('editing-state-changed', { editing: false });
  }

  _bindEvents(element) {
    // 粘贴消毒
    this._pasteHandler = (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      const doc = this.iframe.getDocument();
      const sel = doc.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(doc.createTextNode(text));
        range.collapse(false);
      }
    };

    // 回车拦截
    this._keyDownHandler = (e) => {
      if (this.isComposing) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        this.endEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // 恢复原始文本
        element.textContent = this.originalText;
        this.endEdit();
      }
    };

    // 失焦提交
    this._blurHandler = () => {
      this.endEdit();
    };

    // 中文输入法
    this._compositionStartHandler = () => {
      this.isComposing = true;
    };

    this._compositionEndHandler = () => {
      this.isComposing = false;
    };

    element.addEventListener('paste', this._pasteHandler);
    element.addEventListener('keydown', this._keyDownHandler);
    element.addEventListener('blur', this._blurHandler);
    element.addEventListener('compositionstart', this._compositionStartHandler);
    element.addEventListener('compositionend', this._compositionEndHandler);
  }

  _unbindEvents(element) {
    element.removeEventListener('paste', this._pasteHandler);
    element.removeEventListener('keydown', this._keyDownHandler);
    element.removeEventListener('blur', this._blurHandler);
    element.removeEventListener('compositionstart', this._compositionStartHandler);
    element.removeEventListener('compositionend', this._compositionEndHandler);
  }
}
