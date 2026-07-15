/* ================================================================
 * Banban Core — Command Bus  v1.0
 * 统一命令系统：所有状态变更都通过命令执行
 *
 * 设计原则：
 *   - 可追溯：每个命令产生 ActivityEvent
 *   - 可撤销：命令支持 undo/redo
 *   - 可批量：多个命令可合并执行
 *   - 事件驱动：命令执行后发布事件，各视图自动同步
 * ================================================================ */

const BanbanCommandBus = (() => {
  'use strict';

  const DM = window.DataModel || BanbanDataModel;
  const Store = window.Store || BanbanStore;
  const EventBus = window.EventBus || BanbanEventBus;
  const EV = EventBus ? EventBus.EVENTS : {};

  // ===== 命令类型常量 =====
  const COMMANDS = {
    // 节点操作
    CREATE_NODE: 'CREATE_NODE',
    UPDATE_NODE: 'UPDATE_NODE',
    DELETE_NODE: 'DELETE_NODE',
    COMPLETE_NODE: 'COMPLETE_NODE',
    UNCOMPLETE_NODE: 'UNCOMPLETE_NODE',
    MOVE_NODE_CANVAS: 'MOVE_NODE_CANVAS',
    CONVERT_NODE: 'CONVERT_NODE',

    // 关系操作
    CREATE_RELATION: 'CREATE_RELATION',
    DELETE_RELATION: 'DELETE_RELATION',

    // 日程操作
    SCHEDULE_ACTION: 'SCHEDULE_ACTION',
    MOVE_SCHEDULE_BLOCK: 'MOVE_SCHEDULE_BLOCK',
    RESIZE_SCHEDULE_BLOCK: 'RESIZE_SCHEDULE_BLOCK',
    DELETE_SCHEDULE_BLOCK: 'DELETE_SCHEDULE_BLOCK',
    COMPLETE_SCHEDULE_BLOCK: 'COMPLETE_SCHEDULE_BLOCK',

    // 专注会话
    START_FOCUS: 'START_FOCUS',
    PAUSE_FOCUS: 'PAUSE_FOCUS',
    RESUME_FOCUS: 'RESUME_FOCUS',
    COMPLETE_FOCUS: 'COMPLETE_FOCUS',
    CANCEL_FOCUS: 'CANCEL_FOCUS',

    // 习惯
    COMPLETE_HABIT: 'COMPLETE_HABIT',
    SKIP_HABIT: 'SKIP_HABIT',

    // 计划版本
    APPLY_PLAN: 'APPLY_PLAN',
    UNDO_PLAN: 'UNDO_PLAN',
  };

  // ===== 撤销/重做栈 =====
  const _undoStack = [];
  const _redoStack = [];
  const MAX_UNDO = 50;

  // ================================================================
  // 命令处理器
  // ================================================================
  const _handlers = {};

  function register(type, handler) {
    _handlers[type] = handler;
  }

  // ===== 1. CREATE_NODE =====
  register(COMMANDS.CREATE_NODE, {
    execute(payload) {
      const node = DM.createNode(payload);
      Store._putNode(node);

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'node.created',
        entityType: 'node',
        entityId: node.id,
        payload: { node },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.NODE_CREATED, { node });
      return node;
    },
    undo(beforeState) {
      Store._deleteNode(beforeState.node.id);
      EventBus.emit(EV.NODE_DELETED, { id: beforeState.node.id });
    },
    captureBefore() {
      return null;
    },
  });

  // ===== 2. UPDATE_NODE =====
  register(COMMANDS.UPDATE_NODE, {
    execute(payload) {
      const { nodeId, updates, expected_version } = payload;
      const oldNode = Store.getNode(nodeId);
      if (!oldNode) throw new Error(`Node not found: ${nodeId}`);

      // 乐观锁检查：如果指定了期望版本，必须匹配
      if (expected_version != null && oldNode.version !== expected_version) {
        throw new Error(
          `版本冲突：期望版本 ${expected_version}，当前版本 ${oldNode.version}。` +
          `数据可能已被修改，请刷新后重试。`
        );
      }

      const newNode = {
        ...oldNode,
        ...updates,
        version: oldNode.version + 1,
      };
      Store._putNode(newNode);

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'node.updated',
        entityType: 'node',
        entityId: nodeId,
        payload: { old: oldNode, new: newNode, updates },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.NODE_UPDATED, { node: newNode, oldNode });
      return newNode;
    },
    undo(beforeState) {
      Store._putNode(beforeState.oldNode);
      EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
    },
    captureBefore(payload) {
      const oldNode = Store.getNode(payload.nodeId);
      return { oldNode };
    },
  });

  // ===== 3. DELETE_NODE =====
  register(COMMANDS.DELETE_NODE, {
    execute(payload) {
      const { nodeId } = payload;
      const node = Store.getNode(nodeId);
      if (!node) return false;

      Store._deleteNode(nodeId);

      // 同时删除相关关系
      const relations = Store.getRelationsForNode(nodeId);
      relations.forEach(r => Store._deleteRelation(r.id));

      // 删除相关日程块
      Store.getAllScheduleBlocks().forEach(b => {
        if (b.node_id === nodeId) Store._deleteScheduleBlock(b.id);
      });

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'node.deleted',
        entityType: 'node',
        entityId: nodeId,
        payload: { node },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.NODE_DELETED, { id: nodeId, node });
      return true;
    },
    undo(beforeState) {
      Store._putNode(beforeState.node);
      // 恢复关系
      (beforeState.relations || []).forEach(r => Store._putRelation(r));
      // 恢复日程块
      (beforeState.blocks || []).forEach(b => Store._putScheduleBlock(b));
      EventBus.emit(EV.NODE_CREATED, { node: beforeState.node });
    },
    captureBefore(payload) {
      const node = Store.getNode(payload.nodeId);
      const relations = Store.getRelationsForNode(payload.nodeId);
      const blocks = Store.getScheduleBlocksForNode(payload.nodeId);
      return { node, relations, blocks };
    },
  });

  // ===== 4. COMPLETE_NODE =====
  register(COMMANDS.COMPLETE_NODE, {
    execute(payload) {
      const { nodeId, expected_version } = payload;
      const oldNode = Store.getNode(nodeId);
      if (!oldNode) throw new Error(`Node not found: ${nodeId}`);

      // 乐观锁检查
      if (expected_version != null && oldNode.version !== expected_version) {
        throw new Error(
          `版本冲突：期望版本 ${expected_version}，当前版本 ${oldNode.version}。` +
          `节点可能已被修改，请刷新后重试。`
        );
      }

      const newNode = {
        ...oldNode,
        phase: 'completed',
        commitment: 'active',
        actual_end: DM.nowISO(),
        version: oldNode.version + 1,
      };
      Store._putNode(newNode);

      // 同时更新今日的日程块
      const today = DM.todayStr();
      Store.getScheduleBlocksForNode(nodeId).forEach(block => {
        if (block.date === today && block.status !== 'completed') {
          const updated = { ...block, status: 'completed', version: block.version + 1 };
          Store._putScheduleBlock(updated);
          EventBus.emit(EV.SCHEDULE_UPDATED, { block: updated, oldBlock: block });
        }
      });

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'node.completed',
        entityType: 'node',
        entityId: nodeId,
        payload: { old: oldNode, new: newNode },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.NODE_UPDATED, { node: newNode, oldNode });
      EventBus.emit(EV.NODE_COMPLETED, { node: newNode });
      return newNode;
    },
    undo(beforeState) {
      Store._putNode(beforeState.oldNode);
      // 恢复日程块状态
      (beforeState.oldBlocks || []).forEach(b => Store._putScheduleBlock(b));
      EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
    },
    captureBefore(payload) {
      const oldNode = Store.getNode(payload.nodeId);
      const today = DM.todayStr();
      const oldBlocks = Store.getScheduleBlocksForNode(payload.nodeId)
        .filter(b => b.date === today);
      return { oldNode, oldBlocks: oldBlocks.map(b => ({ ...b })) };
    },
  });

  // ===== 5. MOVE_NODE_CANVAS =====
  register(COMMANDS.MOVE_NODE_CANVAS, {
    execute(payload) {
      const { nodeId, x, y, zIndex } = payload;
      const oldNode = Store.getNode(nodeId);
      if (!oldNode) return null;

      const newNode = {
        ...oldNode,
        layout: {
          ...oldNode.layout,
          x: x != null ? x : oldNode.layout.x,
          y: y != null ? y : oldNode.layout.y,
          z_index: zIndex != null ? zIndex : oldNode.layout.z_index,
        },
        version: oldNode.version + 1,
      };
      Store._putNode(newNode);
      EventBus.emit(EV.NODE_MOVED, { node: newNode, oldNode });
      EventBus.emit(EV.NODE_UPDATED, { node: newNode, oldNode });
      return newNode;
    },
    undo(beforeState) {
      Store._putNode(beforeState.oldNode);
      EventBus.emit(EV.NODE_MOVED, { node: beforeState.oldNode });
      EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
    },
    captureBefore(payload) {
      const oldNode = Store.getNode(payload.nodeId);
      return { oldNode };
    },
  });

  // ===== 6. CREATE_RELATION =====
  register(COMMANDS.CREATE_RELATION, {
    execute(payload) {
      const rel = DM.createRelation(payload);
      Store._putRelation(rel);
      EventBus.emit(EV.RELATION_CREATED, { relation: rel });
      return rel;
    },
    undo(beforeState) {
      Store._deleteRelation(beforeState.relation.id);
      EventBus.emit(EV.RELATION_DELETED, { id: beforeState.relation.id });
    },
    captureBefore() { return null; },
  });

  // ===== 7. DELETE_RELATION =====
  register(COMMANDS.DELETE_RELATION, {
    execute(payload) {
      const { relationId } = payload;
      const rel = Store.getRelation(relationId);
      if (!rel) return false;
      Store._deleteRelation(relationId);
      EventBus.emit(EV.RELATION_DELETED, { id: relationId, relation: rel });
      return true;
    },
    undo(beforeState) {
      Store._putRelation(beforeState.relation);
      EventBus.emit(EV.RELATION_CREATED, { relation: beforeState.relation });
    },
    captureBefore(payload) {
      return { relation: Store.getRelation(payload.relationId) };
    },
  });

  // ===== 8. SCHEDULE_ACTION — 将行动加入日程 =====
  register(COMMANDS.SCHEDULE_ACTION, {
    execute(payload) {
      const { nodeId, date, startTime, endTime, blockType, isFixed, priority } = payload;

      // 创建日程块
      const block = DM.createScheduleBlock({
        nodeId,
        date: date || DM.todayStr(),
        startTime,
        endTime,
        block_type: blockType || 'work',
        is_fixed: isFixed || false,
        priority: priority || 3,
      });
      Store._putScheduleBlock(block);

      // 更新节点状态
      const node = Store.getNode(nodeId);
      let newNode = null;
      let oldNode = null;
      if (node) {
        oldNode = node;
        newNode = {
          ...node,
          phase: node.phase === 'completed' ? 'completed' : 'planned',
          commitment: 'scheduled',
          scheduled_start: `${block.date}T${block.start_time}:00`,
          scheduled_end: `${block.date}T${block.end_time}:00`,
          duration_minutes: block.duration_minutes,
          version: node.version + 1,
        };
        Store._putNode(newNode);
        EventBus.emit(EV.NODE_UPDATED, { node: newNode, oldNode });
      }

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'schedule.created',
        entityType: 'schedule_block',
        entityId: block.id,
        payload: { block, node: newNode },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.SCHEDULE_CREATED, { block, node: newNode });
      return { block, node: newNode };
    },
    undo(beforeState) {
      Store._deleteScheduleBlock(beforeState.block.id);
      if (beforeState.oldNode) {
        Store._putNode(beforeState.oldNode);
        EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
      }
      EventBus.emit(EV.SCHEDULE_DELETED, { id: beforeState.block.id });
    },
    captureBefore(payload) {
      const node = Store.getNode(payload.nodeId);
      return { oldNode: node ? { ...node } : null };
    },
  });

  // ===== 9. MOVE_SCHEDULE_BLOCK =====
  register(COMMANDS.MOVE_SCHEDULE_BLOCK, {
    execute(payload) {
      const { blockId, newDate, newStartTime, newEndTime, expected_version } = payload;
      const oldBlock = Store.getScheduleBlock(blockId);
      if (!oldBlock) throw new Error(`ScheduleBlock not found: ${blockId}`);

      // 乐观锁检查
      if (expected_version != null && oldBlock.version !== expected_version) {
        throw new Error(
          `版本冲突：期望版本 ${expected_version}，当前版本 ${oldBlock.version}。` +
          `日程块可能已被修改，请刷新后重试。`
        );
      }

      const newBlock = {
        ...oldBlock,
        date: newDate || oldBlock.date,
        start_time: newStartTime || oldBlock.start_time,
        end_time: newEndTime || oldBlock.end_time,
        duration_minutes: newEndTime
          ? DM.timeToMinutes(newEndTime) - DM.timeToMinutes(newStartTime || oldBlock.start_time)
          : oldBlock.duration_minutes,
        version: oldBlock.version + 1,
      };
      Store._putScheduleBlock(newBlock);

      // 更新节点的计划时间
      const node = Store.getNode(newBlock.node_id);
      if (node) {
        const newNode = {
          ...node,
          scheduled_start: `${newBlock.date}T${newBlock.start_time}:00`,
          scheduled_end: `${newBlock.date}T${newBlock.end_time}:00`,
          duration_minutes: newBlock.duration_minutes,
          version: node.version + 1,
        };
        Store._putNode(newNode);
        EventBus.emit(EV.NODE_UPDATED, { node: newNode, oldNode: node });
      }

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'schedule.moved',
        entityType: 'schedule_block',
        entityId: blockId,
        payload: { old: oldBlock, new: newBlock },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.SCHEDULE_MOVED, { block: newBlock, oldBlock });
      EventBus.emit(EV.SCHEDULE_UPDATED, { block: newBlock, oldBlock });
      return newBlock;
    },
    undo(beforeState) {
      Store._putScheduleBlock(beforeState.oldBlock);
      if (beforeState.oldNode) {
        Store._putNode(beforeState.oldNode);
        EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
      }
      EventBus.emit(EV.SCHEDULE_MOVED, { block: beforeState.oldBlock });
      EventBus.emit(EV.SCHEDULE_UPDATED, { block: beforeState.oldBlock });
    },
    captureBefore(payload) {
      const oldBlock = Store.getScheduleBlock(payload.blockId);
      const node = oldBlock ? Store.getNode(oldBlock.node_id) : null;
      return { oldBlock, oldNode: node ? { ...node } : null };
    },
  });

  // ===== 10. DELETE_SCHEDULE_BLOCK =====
  register(COMMANDS.DELETE_SCHEDULE_BLOCK, {
    execute(payload) {
      const { blockId } = payload;
      const block = Store.getScheduleBlock(blockId);
      if (!block) return false;
      Store._deleteScheduleBlock(blockId);
      EventBus.emit(EV.SCHEDULE_DELETED, { id: blockId, block });
      return true;
    },
    undo(beforeState) {
      Store._putScheduleBlock(beforeState.block);
      EventBus.emit(EV.SCHEDULE_CREATED, { block: beforeState.block });
    },
    captureBefore(payload) {
      return { block: Store.getScheduleBlock(payload.blockId) };
    },
  });

  // ===== 11. START_FOCUS — 开始专注 =====
  register(COMMANDS.START_FOCUS, {
    execute(payload) {
      const { nodeId, scheduleBlockId } = payload;

      // 检查是否已有进行中的专注
      const active = Store.getActiveFocusSession();
      if (active) {
        throw new Error('已有进行中的专注会话，请先结束当前专注');
      }

      const session = DM.createFocusSession({
        nodeId,
        scheduleBlockId,
      });
      Store._putFocusSession(session);

      // 更新日程块状态
      if (scheduleBlockId) {
        const block = Store.getScheduleBlock(scheduleBlockId);
        if (block) {
          const updated = { ...block, status: 'in_progress', version: block.version + 1 };
          Store._putScheduleBlock(updated);
          EventBus.emit(EV.SCHEDULE_UPDATED, { block: updated, oldBlock: block });
        }
      }

      // 更新节点状态
      if (nodeId) {
        const node = Store.getNode(nodeId);
        if (node) {
          const updated = {
            ...node,
            phase: 'active',
            actual_start: session.start_time,
            version: node.version + 1,
          };
          Store._putNode(updated);
          EventBus.emit(EV.NODE_UPDATED, { node: updated, oldNode: node });
        }
      }

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'focus.started',
        entityType: 'focus_session',
        entityId: session.id,
        payload: { session },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.FOCUS_STARTED, { session, nodeId, scheduleBlockId });
      return session;
    },
    undo(beforeState) {
      Store._deleteFocusSession(beforeState.session.id);
      if (beforeState.oldBlock) {
        Store._putScheduleBlock(beforeState.oldBlock);
        EventBus.emit(EV.SCHEDULE_UPDATED, { block: beforeState.oldBlock });
      }
      if (beforeState.oldNode) {
        Store._putNode(beforeState.oldNode);
        EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
      }
      EventBus.emit(EV.FOCUS_CANCELLED, { id: beforeState.session.id });
    },
    captureBefore(payload) {
      const oldBlock = payload.scheduleBlockId ? Store.getScheduleBlock(payload.scheduleBlockId) : null;
      const oldNode = payload.nodeId ? Store.getNode(payload.nodeId) : null;
      return {
        oldBlock: oldBlock ? { ...oldBlock } : null,
        oldNode: oldNode ? { ...oldNode } : null,
      };
    },
  });

  // ===== 12. COMPLETE_FOCUS — 完成专注 =====
  register(COMMANDS.COMPLETE_FOCUS, {
    execute(payload) {
      const { sessionId, focusScore, interruptions } = payload;
      const oldSession = Store.getFocusSession(sessionId);
      if (!oldSession) throw new Error(`Focus session not found: ${sessionId}`);

      const now = DM.nowISO();
      const start = new Date(oldSession.start_time);
      const end = new Date(now);
      const durMin = Math.max(1, Math.round((end - start) / 60000));

      const newSession = {
        ...oldSession,
        end_time: now,
        duration_minutes: durMin,
        status: 'completed',
        focus_score: focusScore != null ? focusScore : null,
        interruptions: interruptions || oldSession.interruptions || 0,
        version: oldSession.version + 1,
      };
      Store._putFocusSession(newSession);

      // 更新日程块状态
      if (newSession.schedule_block_id) {
        const block = Store.getScheduleBlock(newSession.schedule_block_id);
        if (block && block.status !== 'completed') {
          const updated = { ...block, status: 'completed', version: block.version + 1 };
          Store._putScheduleBlock(updated);
          EventBus.emit(EV.SCHEDULE_UPDATED, { block: updated, oldBlock: block });
        }
      }

      // 更新节点状态
      if (newSession.node_id) {
        const node = Store.getNode(newSession.node_id);
        if (node) {
          const updated = {
            ...node,
            phase: 'completed',
            actual_end: now,
            version: node.version + 1,
          };
          Store._putNode(updated);
          EventBus.emit(EV.NODE_UPDATED, { node: updated, oldNode: node });
          EventBus.emit(EV.NODE_COMPLETED, { node: updated });
        }
      }

      // 记录事件
      const evt = DM.createActivityEvent({
        eventType: 'focus.completed',
        entityType: 'focus_session',
        entityId: sessionId,
        payload: { session: newSession },
      });
      Store._putEvent(evt);

      EventBus.emit(EV.FOCUS_COMPLETED, { session: newSession });
      return newSession;
    },
    undo(beforeState) {
      Store._putFocusSession(beforeState.oldSession);
      if (beforeState.oldBlock) {
        Store._putScheduleBlock(beforeState.oldBlock);
        EventBus.emit(EV.SCHEDULE_UPDATED, { block: beforeState.oldBlock });
      }
      if (beforeState.oldNode) {
        Store._putNode(beforeState.oldNode);
        EventBus.emit(EV.NODE_UPDATED, { node: beforeState.oldNode });
      }
    },
    captureBefore(payload) {
      const oldSession = Store.getFocusSession(payload.sessionId);
      const oldBlock = oldSession?.schedule_block_id ? Store.getScheduleBlock(oldSession.schedule_block_id) : null;
      const oldNode = oldSession?.node_id ? Store.getNode(oldSession.node_id) : null;
      return {
        oldSession,
        oldBlock: oldBlock ? { ...oldBlock } : null,
        oldNode: oldNode ? { ...oldNode } : null,
      };
    },
  });

  // ===== 13. COMPLETE_HABIT — 完成习惯 =====
  register(COMMANDS.COMPLETE_HABIT, {
    execute(payload) {
      const { instanceId } = payload;
      const oldInst = Store.getHabitInstance(instanceId);
      if (!oldInst) throw new Error(`Habit instance not found: ${instanceId}`);

      const newInst = {
        ...oldInst,
        status: 'done',
        completed_at: DM.nowISO(),
        version: oldInst.version + 1,
      };
      Store._putHabitInstance(newInst);

      EventBus.emit(EV.HABIT_INSTANCE_COMPLETED, { instance: newInst });
      EventBus.emit(EV.HABIT_INSTANCE_UPDATED, { instance: newInst, oldInstance: oldInst });
      return newInst;
    },
    undo(beforeState) {
      Store._putHabitInstance(beforeState.oldInstance);
      EventBus.emit(EV.HABIT_INSTANCE_UPDATED, { instance: beforeState.oldInstance });
    },
    captureBefore(payload) {
      return { oldInstance: Store.getHabitInstance(payload.instanceId) };
    },
  });

  // ================================================================
  // 命令执行器
  // ================================================================
  function execute(command) {
    const { type, payload } = command;
    const handler = _handlers[type];
    if (!handler) {
      console.warn(`[CommandBus] 未知命令: ${type}`);
      return null;
    }

    // 捕获执行前状态（用于撤销）
    const beforeState = handler.captureBefore ? handler.captureBefore(payload) : null;

    // 执行命令
    const result = handler.execute(payload);

    // 推入撤销栈
    _undoStack.push({ command, beforeState, result });
    if (_undoStack.length > MAX_UNDO) _undoStack.shift();
    _redoStack.length = 0; // 清空重做栈

    return result;
  }

  // 批量执行
  function executeBatch(commands) {
    if (!EventBus) {
      return commands.map(cmd => execute(cmd));
    }

    let results;
    EventBus.batch(() => {
      results = commands.map(cmd => execute(cmd));
    });
    return results;
  }

  // 撤销
  function undo() {
    const entry = _undoStack.pop();
    if (!entry) return false;

    const handler = _handlers[entry.command.type];
    if (handler?.undo) {
      handler.undo(entry.beforeState, entry.result);
    }

    _redoStack.push(entry);
    return true;
  }

  // 重做
  function redo() {
    const entry = _redoStack.pop();
    if (!entry) return false;

    const result = execute(entry.command);
    // execute 会自动推入 undoStack 并清空 redoStack
    // 所以这里不需要额外处理
    return result;
  }

  // 撤销栈状态
  function canUndo() {
    return _undoStack.length > 0;
  }

  function canRedo() {
    return _redoStack.length > 0;
  }

  // ================================================================
  // 公开 API
  // ================================================================
  return {
    COMMANDS,
    execute,
    executeBatch,
    undo,
    redo,
    canUndo,
    canRedo,
    register,

    // 便捷方法
    createNode: (payload) => execute({ type: COMMANDS.CREATE_NODE, payload }),
    updateNode: (nodeId, updates, expected_version) =>
      execute({ type: COMMANDS.UPDATE_NODE, payload: { nodeId, updates, expected_version } }),
    deleteNode: (nodeId) => execute({ type: COMMANDS.DELETE_NODE, payload: { nodeId } }),
    completeNode: (nodeId, expected_version) =>
      execute({ type: COMMANDS.COMPLETE_NODE, payload: { nodeId, expected_version } }),
    moveNode: (nodeId, x, y) => execute({ type: COMMANDS.MOVE_NODE_CANVAS, payload: { nodeId, x, y } }),

    scheduleAction: (payload) => execute({ type: COMMANDS.SCHEDULE_ACTION, payload }),
    moveScheduleBlock: (blockId, newDate, newStartTime, newEndTime, expected_version) =>
      execute({ type: COMMANDS.MOVE_SCHEDULE_BLOCK, payload: { blockId, newDate, newStartTime, newEndTime, expected_version } }),
    deleteScheduleBlock: (blockId) => execute({ type: COMMANDS.DELETE_SCHEDULE_BLOCK, payload: { blockId } }),

    startFocus: (nodeId, scheduleBlockId) =>
      execute({ type: COMMANDS.START_FOCUS, payload: { nodeId, scheduleBlockId } }),
    completeFocus: (sessionId) => execute({ type: COMMANDS.COMPLETE_FOCUS, payload: { sessionId } }),

    createRelation: (payload) => execute({ type: COMMANDS.CREATE_RELATION, payload }),
    deleteRelation: (relationId) => execute({ type: COMMANDS.DELETE_RELATION, payload: { relationId } }),

    completeHabit: (instanceId) => execute({ type: COMMANDS.COMPLETE_HABIT, payload: { instanceId } }),
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.BanbanCommandBus = BanbanCommandBus;
  window.CommandBus = BanbanCommandBus;
}
