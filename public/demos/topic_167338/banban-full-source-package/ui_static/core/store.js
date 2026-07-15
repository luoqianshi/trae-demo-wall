/* ================================================================
 * Banban Core — Store  v1.0
 * 客户端公共缓存：按ID索引的实体存储 + 派生查询
 *
 * 所有页面共享同一份数据，禁止各页面维护自己的任务数组
 * ================================================================ */

const BanbanStore = (() => {
  'use strict';

  const DM = window.DataModel || BanbanDataModel;

  // ===== 内部存储（按ID索引的 Map）=====
  const _nodes = new Map();
  const _relations = new Map();
  const _scheduleBlocks = new Map();
  const _habitInstances = new Map();
  const _focusSessions = new Map();
  const _events = new Map();
  const _planVersions = new Map();

  // 变更标记（用于脏检查）
  let _changeCount = 0;

  // ================================================================
  // Node 操作
  // ================================================================
  function getNode(id) {
    return _nodes.get(id) || null;
  }

  function getAllNodes() {
    return Array.from(_nodes.values());
  }

  function getNodesByKind(kind) {
    return Array.from(_nodes.values()).filter(n => n.kind === kind);
  }

  function getNodesByDomain(domainId) {
    return Array.from(_nodes.values()).filter(n => n.domain_id === domainId);
  }

  function getActiveActions() {
    return Array.from(_nodes.values()).filter(
      n => n.kind === 'action' && n.phase !== 'completed' && n.phase !== 'archived'
    );
  }

  function _putNode(node) {
    const updated = { ...node, updated_at: DM.nowISO() };
    _nodes.set(node.id, updated);
    _changeCount++;
    return updated;
  }

  function _deleteNode(id) {
    const existed = _nodes.has(id);
    if (existed) {
      _nodes.delete(id);
      _changeCount++;
    }
    return existed;
  }

  // ================================================================
  // Relation 操作
  // ================================================================
  function getRelation(id) {
    return _relations.get(id) || null;
  }

  function getAllRelations() {
    return Array.from(_relations.values());
  }

  function getRelationsForNode(nodeId) {
    return Array.from(_relations.values()).filter(
      r => r.source_node_id === nodeId || r.target_node_id === nodeId
    );
  }

  function getChildNodes(parentId, relationType = 'belongs_to') {
    const childIds = Array.from(_relations.values())
      .filter(r => r.target_node_id === parentId && r.relation_type === relationType)
      .sort((a, b) => a.order - b.order)
      .map(r => r.source_node_id);
    return childIds.map(id => _nodes.get(id)).filter(Boolean);
  }

  function getParentNodes(childId, relationType = 'belongs_to') {
    const parentIds = Array.from(_relations.values())
      .filter(r => r.source_node_id === childId && r.relation_type === relationType)
      .map(r => r.target_node_id);
    return parentIds.map(id => _nodes.get(id)).filter(Boolean);
  }

  function _putRelation(rel) {
    const updated = { ...rel, updated_at: DM.nowISO() };
    _relations.set(rel.id, updated);
    _changeCount++;
    return updated;
  }

  function _deleteRelation(id) {
    const existed = _relations.has(id);
    if (existed) {
      _relations.delete(id);
      _changeCount++;
    }
    return existed;
  }

  // ================================================================
  // ScheduleBlock 操作
  // ================================================================
  function getScheduleBlock(id) {
    return _scheduleBlocks.get(id) || null;
  }

  function getAllScheduleBlocks() {
    return Array.from(_scheduleBlocks.values());
  }

  function getScheduleBlocksByDate(date) {
    return Array.from(_scheduleBlocks.values())
      .filter(b => b.date === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function getScheduleBlocksByDateRange(startDate, endDate) {
    return Array.from(_scheduleBlocks.values())
      .filter(b => b.date >= startDate && b.date <= endDate)
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  }

  function getScheduleBlocksForNode(nodeId) {
    return Array.from(_scheduleBlocks.values())
      .filter(b => b.node_id === nodeId)
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  }

  function _putScheduleBlock(block) {
    const updated = { ...block, updated_at: DM.nowISO() };
    _scheduleBlocks.set(block.id, updated);
    _changeCount++;
    return updated;
  }

  function _deleteScheduleBlock(id) {
    const existed = _scheduleBlocks.has(id);
    if (existed) {
      _scheduleBlocks.delete(id);
      _changeCount++;
    }
    return existed;
  }

  // ================================================================
  // HabitInstance 操作
  // ================================================================
  function getHabitInstance(id) {
    return _habitInstances.get(id) || null;
  }

  function getHabitInstances(habitNodeId, startDate, endDate) {
    let list = Array.from(_habitInstances.values());
    if (habitNodeId) {
      list = list.filter(h => h.habit_node_id === habitNodeId);
    }
    if (startDate) {
      list = list.filter(h => h.date >= startDate);
    }
    if (endDate) {
      list = list.filter(h => h.date <= endDate);
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }

  function getTodayHabitInstances(date) {
    const d = date || DM.todayStr();
    return Array.from(_habitInstances.values())
      .filter(h => h.date === d)
      .sort((a, b) => (a.planned_time || '').localeCompare(b.planned_time || ''));
  }

  function _putHabitInstance(inst) {
    const updated = { ...inst, updated_at: DM.nowISO() };
    _habitInstances.set(inst.id, updated);
    _changeCount++;
    return updated;
  }

  function _deleteHabitInstance(id) {
    const existed = _habitInstances.has(id);
    if (existed) {
      _habitInstances.delete(id);
      _changeCount++;
    }
    return existed;
  }

  // ================================================================
  // FocusSession 操作
  // ================================================================
  function getFocusSession(id) {
    return _focusSessions.get(id) || null;
  }

  function getActiveFocusSession() {
    return Array.from(_focusSessions.values())
      .find(f => f.status === 'active' || f.status === 'paused') || null;
  }

  function getFocusSessionsByDate(date) {
    return Array.from(_focusSessions.values())
      .filter(f => f.start_time.slice(0, 10) === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function getFocusSessionsForNode(nodeId) {
    return Array.from(_focusSessions.values())
      .filter(f => f.node_id === nodeId)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function _putFocusSession(session) {
    const updated = { ...session, updated_at: DM.nowISO() };
    _focusSessions.set(session.id, updated);
    _changeCount++;
    return updated;
  }

  function _deleteFocusSession(id) {
    const existed = _focusSessions.has(id);
    if (existed) {
      _focusSessions.delete(id);
      _changeCount++;
    }
    return existed;
  }

  // ================================================================
  // ActivityEvent 操作
  // ================================================================
  function getEvent(id) {
    return _events.get(id) || null;
  }

  function getEventsByType(eventType) {
    return Array.from(_events.values())
      .filter(e => e.event_type === eventType)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  function getEventsByEntity(entityType, entityId) {
    return Array.from(_events.values())
      .filter(e => e.entity_type === entityType && e.entity_id === entityId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  function getRecentEvents(limit) {
    return Array.from(_events.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit || 50);
  }

  function _putEvent(event) {
    _events.set(event.id, event);
    _changeCount++;
    return event;
  }

  // ================================================================
  // PlanVersion 操作
  // ================================================================
  function getPlanVersion(id) {
    return _planVersions.get(id) || null;
  }

  function getPlanVersionsByType(planType, status) {
    let list = Array.from(_planVersions.values())
      .filter(p => p.plan_type === planType);
    if (status) {
      list = list.filter(p => p.status === status);
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  function getCurrentDraft(planType, date) {
    return Array.from(_planVersions.values())
      .filter(p => p.plan_type === planType && p.status === 'draft')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
  }

  function _putPlanVersion(pv) {
    const updated = { ...pv, updated_at: DM.nowISO() };
    _planVersions.set(pv.id, updated);
    _changeCount++;
    return updated;
  }

  // ================================================================
  // 派生查询：今日计划（含节点信息）
  // ================================================================
  function getTodayPlan(date) {
    const d = date || DM.todayStr();
    const blocks = getScheduleBlocksByDate(d);

    // 构造带节点信息的列表
    const items = blocks.map(block => {
      const node = getNode(block.node_id);
      return { block, node };
    }).filter(item => item.node || item.block.block_type === 'rest' || item.block.block_type === 'meal');

    // 统计
    const stats = {
      total_blocks: blocks.length,
      total_minutes: blocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0),
      completed: blocks.filter(b => b.status === 'completed').length,
      in_progress: blocks.filter(b => b.status === 'in_progress').length,
      by_type: {},
    };

    blocks.forEach(b => {
      stats.by_type[b.block_type] = (stats.by_type[b.block_type] || 0) + (b.duration_minutes || 0);
    });

    return { date: d, items, blocks, stats };
  }

  // ================================================================
  // 派生查询：周统计
  // ================================================================
  function getWeekStats(startDate, endDate) {
    const blocks = getScheduleBlocksByDateRange(startDate, endDate);
    const focus = getFocusSessionsByDate(startDate); // 简化，实际应按日期范围查

    const totalScheduled = blocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    const completedBlocks = blocks.filter(b => b.status === 'completed');
    const completedMinutes = completedBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    const completionRate = totalScheduled > 0 ? Math.round(completedMinutes / totalScheduled * 100) : 0;

    // 实际专注时长（从 FocusSession 计算）
    let actualFocusMinutes = 0;
    Array.from(_focusSessions.values()).forEach(f => {
      if (f.status === 'completed' && f.start_time.slice(0, 10) >= startDate && f.start_time.slice(0, 10) <= endDate) {
        actualFocusMinutes += f.duration_minutes || 0;
      }
    });

    // 领域分布
    const domainStats = {};
    blocks.forEach(b => {
      const node = getNode(b.node_id);
      if (node) {
        const d = node.domain_id || 'general';
        if (!domainStats[d]) domainStats[d] = { minutes: 0, count: 0 };
        domainStats[d].minutes += b.duration_minutes || 0;
        domainStats[d].count++;
      }
    });

    return {
      start_date: startDate,
      end_date: endDate,
      total_scheduled_minutes: totalScheduled,
      completed_minutes: completedMinutes,
      completion_rate: completionRate,
      actual_focus_minutes: actualFocusMinutes,
      total_blocks: blocks.length,
      completed_blocks: completedBlocks.length,
      domain_stats: domainStats,
    };
  }

  // ================================================================
  // 批量加载 / 导出
  // ================================================================
  function hydrate(data) {
    if (data.nodes) {
      _nodes.clear();
      data.nodes.forEach(n => _nodes.set(n.id, n));
    }
    if (data.relations) {
      _relations.clear();
      data.relations.forEach(r => _relations.set(r.id, r));
    }
    if (data.schedule_blocks) {
      _scheduleBlocks.clear();
      data.schedule_blocks.forEach(b => _scheduleBlocks.set(b.id, b));
    }
    if (data.habit_instances) {
      _habitInstances.clear();
      data.habit_instances.forEach(h => _habitInstances.set(h.id, h));
    }
    if (data.focus_sessions) {
      _focusSessions.clear();
      data.focus_sessions.forEach(f => _focusSessions.set(f.id, f));
    }
    if (data.events) {
      _events.clear();
      data.events.forEach(e => _events.set(e.id, e));
    }
    if (data.plan_versions) {
      _planVersions.clear();
      data.plan_versions.forEach(p => _planVersions.set(p.id, p));
    }

    _changeCount++;

    // 发布 hydrated 事件
    if (window.EventBus) {
      window.EventBus.emit(window.EventBus.EVENTS.STORE_HYDRATED, { data });
    }
  }

  function dump() {
    return {
      nodes: Array.from(_nodes.values()),
      relations: Array.from(_relations.values()),
      schedule_blocks: Array.from(_scheduleBlocks.values()),
      habit_instances: Array.from(_habitInstances.values()),
      focus_sessions: Array.from(_focusSessions.values()),
      events: Array.from(_events.values()),
      plan_versions: Array.from(_planVersions.values()),
    };
  }

  function reset() {
    _nodes.clear();
    _relations.clear();
    _scheduleBlocks.clear();
    _habitInstances.clear();
    _focusSessions.clear();
    _events.clear();
    _planVersions.clear();
    _changeCount++;
  }

  // ================================================================
  // 公开 API
  // ================================================================
  return {
    // ===== 读取 =====
    // Node
    getNode,
    getAllNodes,
    getNodesByKind,
    getNodesByDomain,
    getActiveActions,

    // Relation
    getRelation,
    getAllRelations,
    getRelationsForNode,
    getChildNodes,
    getParentNodes,

    // ScheduleBlock
    getScheduleBlock,
    getAllScheduleBlocks,
    getScheduleBlocksByDate,
    getScheduleBlocksByDateRange,
    getScheduleBlocksForNode,

    // HabitInstance
    getHabitInstance,
    getHabitInstances,
    getTodayHabitInstances,

    // FocusSession
    getFocusSession,
    getActiveFocusSession,
    getFocusSessionsByDate,
    getFocusSessionsForNode,

    // ActivityEvent
    getEvent,
    getEventsByType,
    getEventsByEntity,
    getRecentEvents,

    // PlanVersion
    getPlanVersion,
    getPlanVersionsByType,
    getCurrentDraft,

    // ===== 派生查询 =====
    getTodayPlan,
    getWeekStats,

    // ===== 内部写入（仅 commands 调用）=====
    _putNode,
    _deleteNode,
    _putRelation,
    _deleteRelation,
    _putScheduleBlock,
    _deleteScheduleBlock,
    _putHabitInstance,
    _deleteHabitInstance,
    _putFocusSession,
    _deleteFocusSession,
    _putEvent,
    _putPlanVersion,

    // ===== 批量操作 =====
    hydrate,
    dump,
    reset,

    // ===== 工具 =====
    get changeCount() { return _changeCount; },
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.BanbanStore = BanbanStore;
  window.Store = BanbanStore;
}
