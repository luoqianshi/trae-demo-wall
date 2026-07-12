// ========== 事务栈 — 撤销/重做 ==========
// 基于操作指令模式（Transaction），记录正向和反向操作
class UndoRedoManager {
  constructor(eventBus) {
    this.bus = eventBus;
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = 1000;
    this.debounceTimer = null;
    this.debounceDelay = 500;
    this.pendingTransaction = null;
  }

  // 推入一个事务
  push(transaction) {
    // 如果有 pending 事务且类型相同，合并
    if (this.pendingTransaction && transaction.type === this.pendingTransaction.type) {
      this.pendingTransaction.forward = transaction.forward;
      this.pendingTransaction.after = transaction.after;
      return;
    }

    // 提交之前的 pending
    this._flushPending();

    this.undoStack.push(transaction);
    this.redoStack = [];

    // 内存管理
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    this.bus.emit('history-changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  // 延迟推入（用于连续字符输入合并）
  pushDebounced(transaction) {
    this.pendingTransaction = transaction;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this._flushPending();
    }, this.debounceDelay);
  }

  _flushPending() {
    if (this.pendingTransaction) {
      this.undoStack.push(this.pendingTransaction);
      this.redoStack = [];
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
      this.pendingTransaction = null;
      this.bus.emit('history-changed', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    }
  }

  undo() {
    this._flushPending();
    if (this.undoStack.length === 0) return;

    const transaction = this.undoStack.pop();
    try {
      transaction.backward();
      this.redoStack.push(transaction);
    } catch (e) {
      console.error('[UndoRedo] undo error:', e);
    }

    this.bus.emit('history-changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const transaction = this.redoStack.pop();
    try {
      transaction.forward();
      this.undoStack.push(transaction);
    } catch (e) {
      console.error('[UndoRedo] redo error:', e);
    }

    this.bus.emit('history-changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  canUndo() {
    return this.undoStack.length > 0 || this.pendingTransaction !== null;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.pendingTransaction = null;
    this.bus.emit('history-changed', {
      canUndo: false,
      canRedo: false
    });
  }
}
