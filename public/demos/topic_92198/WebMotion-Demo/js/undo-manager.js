/**
 * WebMotion - 撤销/重做管理器
 * 记录项目状态历史，支持 Ctrl+Z / Ctrl+Y 操作
 *
 * 设计要点：
 * - 每个状态都是整个项目数据（scenes 数组）的深拷贝，互不影响
 * - undoStack 保存"可回退到的历史状态"，redoStack 保存"可重做的状态"
 * - push() 带防抖：500ms 内推送相同状态（JSON 字符串比对）会被忽略，
 *   避免高频输入（如拖拽、连续按键）产生大量冗余历史
 * - 栈容量上限 MAX_SIZE = 30，超出时丢弃最旧的状态
 */
const UndoManager = (function() {
  const MAX_SIZE = 30;       // 单个栈最大容量
  const DEBOUNCE_MS = 500;   // 防抖时间窗口（毫秒）

  let undoStack = [];        // 撤销栈：保存历史状态
  let redoStack = [];        // 重做栈：保存被撤销的状态
  let lastPushTime = 0;      // 上一次 push 的时间戳
  let lastPushJson = '';     // 上一次 push 的状态 JSON 字符串

  /**
   * 深拷贝工具：通过 JSON 序列化/反序列化实现
   * 注意：无法拷贝函数、undefined、Symbol、循环引用对象
   * 对于纯数据的项目状态（scenes/elements）完全适用
   *
   * @param {*} data - 待拷贝的数据
   * @returns {*} 深拷贝结果
   */
  function snapshot(data) {
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * 将一个状态压入撤销栈
   * - 500ms 内推送与上次相同的状态会被忽略（防抖）
   * - 压栈后清空重做栈（新操作分支后，旧的重做路径失效）
   * - 超过 MAX_SIZE 时丢弃栈底最旧的状态
   *
   * @param {*} state - 要保存的项目状态（通常是变更前的快照）
   * @returns {boolean} 是否真正压入栈中（false 表示被防抖跳过）
   */
  function push(state) {
    // 空状态不入栈
    if (state === null || state === undefined) {
      return false;
    }

    const now = Date.now();
    let json;
    try {
      json = JSON.stringify(state);
    } catch (e) {
      // 含循环引用等无法序列化的数据，直接跳过
      console.error('UndoManager.push: 状态序列化失败', e);
      return false;
    }

    // 防抖：时间窗口内且内容相同则跳过
    if (now - lastPushTime < DEBOUNCE_MS && json === lastPushJson) {
      return false;
    }

    lastPushTime = now;
    lastPushJson = json;

    // 压入深拷贝，避免外部引用后续被修改污染历史
    undoStack.push(snapshot(state));

    // 容量限制：丢弃最旧的状态
    if (undoStack.length > MAX_SIZE) {
      undoStack.shift();
    }

    // 新操作产生后，重做栈失效
    redoStack = [];

    return true;
  }

  /**
   * 撤销：弹出撤销栈顶状态作为要恢复的目标，
   * 同时把当前状态压入重做栈
   *
   * @param {*} currentState - 当前项目状态（撤销前的状态，用于重做）
   * @returns {*|null} 要恢复到的历史状态；无法撤销时返回 null
   */
  function undo(currentState) {
    if (undoStack.length === 0) {
      return null;
    }

    // 当前状态进入重做栈（深拷贝，避免后续修改污染）
    if (currentState !== null && currentState !== undefined) {
      redoStack.push(snapshot(currentState));
      if (redoStack.length > MAX_SIZE) {
        redoStack.shift();
      }
    }

    // 弹出最近一次保存的历史状态作为恢复目标
    return undoStack.pop();
  }

  /**
   * 重做：弹出重做栈顶状态作为要恢复的目标，
   * 同时把当前状态压入撤销栈
   *
   * @param {*} currentState - 当前项目状态（重做前的状态，用于再次撤销）
   * @returns {*|null} 要恢复到的状态；无法重做时返回 null
   */
  function redo(currentState) {
    if (redoStack.length === 0) {
      return null;
    }

    // 当前状态进入撤销栈（深拷贝，避免后续修改污染）
    if (currentState !== null && currentState !== undefined) {
      undoStack.push(snapshot(currentState));
      if (undoStack.length > MAX_SIZE) {
        undoStack.shift();
      }
    }

    // 弹出最近一次被撤销的状态作为恢复目标
    return redoStack.pop();
  }

  /**
   * 是否可撤销
   * @returns {boolean}
   */
  function canUndo() {
    return undoStack.length > 0;
  }

  /**
   * 是否可重做
   * @returns {boolean}
   */
  function canRedo() {
    return redoStack.length > 0;
  }

  /**
   * 清空撤销栈与重做栈，并重置防抖计时
   */
  function clear() {
    undoStack = [];
    redoStack = [];
    lastPushTime = 0;
    lastPushJson = '';
  }

  /**
   * 获取当前栈状态摘要，用于刷新工具栏按钮的可用性
   * @returns {{canUndo: boolean, canRedo: boolean, undoCount: number, redoCount: number}}
   */
  function getState() {
    return {
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      undoCount: undoStack.length,
      redoCount: redoStack.length
    };
  }

  return { push, undo, redo, canUndo, canRedo, clear, getState, snapshot };
})();
