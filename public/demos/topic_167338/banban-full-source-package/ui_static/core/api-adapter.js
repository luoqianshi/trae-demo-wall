/* ================================================================
 * Banban Core — API Adapter  v1.0
 * API适配器：后端数据 ↔ 前端数据模型 转换
 *
 * 职责：
 *   1. 从后端加载初始数据
 *   2. 后端数据格式 → 前端数据模型 转换
 *   3. 本地存储持久化（离线降级）
 *   4. 增量同步（预留）
 * ================================================================ */

const BanbanAPIAdapter = (() => {
  'use strict';

  const DM = window.DataModel || BanbanDataModel;
  const Store = window.Store || BanbanStore;
  const EventBus = window.EventBus || BanbanEventBus;
  const EV = EventBus ? EventBus.EVENTS : {};

  const STORAGE_KEY = 'banban_store_v1';
  let _saveTimer = null;

  // ================================================================
  // 1. 初始数据加载
  // ================================================================

  async function loadInitialData(forceRefresh = false) {
    // 强制刷新时，优先从后端加载
    if (forceRefresh) {
      try {
        const serverData = await loadFromServer();
        if (serverData) {
          Store.hydrate(serverData);
          saveToLocalStorage(); // 缓存到本地
          return { source: 'server', data: serverData };
        }
      } catch (e) {
        console.warn('[APIAdapter] 从服务器加载失败:', e.message);
      }
      // 强制刷新失败时，仍然回退到本地
    }
    
    // 非强制刷新时，优先尝试从后端加载
    if (!forceRefresh) {
      try {
        const serverData = await loadFromServer();
        if (serverData) {
          Store.hydrate(serverData);
          saveToLocalStorage(); // 缓存到本地
          return { source: 'server', data: serverData };
        }
      } catch (e) {
        console.warn('[APIAdapter] 从服务器加载失败:', e.message);
      }
    }

    // 降级：从本地存储加载
    const localData = loadFromLocalStorage();
    if (localData) {
      Store.hydrate(localData);
      return { source: 'local', data: localData };
    }

    // 都没有：使用示例数据初始化
    const demoData = generateDemoData();
    Store.hydrate(demoData);
    saveToLocalStorage();
    return { source: 'demo', data: demoData };
  }

  // ================================================================
  // 2. 后端 API 加载
  // ================================================================

  async function loadFromServer() {
    // 尝试调用后端 API
    // 如果后端不可用，返回 null
    try {
      // 尝试多个端点（都是 GET 方法）
      const endpoints = [
        '/api/canvas',           // 画布数据（nodes, relations, groups）
        '/api/tasks?date=today', // 今日任务
        '/api/plan/today',       // 今日计划
      ];

      const results = await Promise.allSettled(
        endpoints.map(url => fetch(url).then(r => r.ok ? r.json() : null))
      );

      const data = {
        nodes: [],
        relations: [],
        schedule_blocks: [],
        habit_instances: [],
        focus_sessions: [],
        events: [],
        plan_versions: [],
      };

      let hasData = false;

      results.forEach((result, i) => {
        if (result.status !== 'fulfilled' || !result.value) return;
        const val = result.value;

        // 画布数据格式（/api/canvas）
        if (val.nodes && Array.isArray(val.nodes)) {
          data.nodes = data.nodes.concat(normalizeNodes(val.nodes));
          hasData = true;
        }
        if (val.relations && Array.isArray(val.relations)) {
          data.relations = data.relations.concat(normalizeRelations(val.relations));
          hasData = true;
        }

        // 任务数据格式（/api/tasks?date=today）
        if (val.tasks && Array.isArray(val.tasks)) {
          data.schedule_blocks = data.schedule_blocks.concat(normalizeScheduleBlocks(val.tasks));
          hasData = true;
        }

        // 计划数据格式（/api/plan/today）
        if (val.plan && val.plan.tasks && Array.isArray(val.plan.tasks)) {
          data.schedule_blocks = data.schedule_blocks.concat(normalizeScheduleBlocks(val.plan.tasks));
          hasData = true;
        }
        if (val.commitments && Array.isArray(val.commitments)) {
          data.schedule_blocks = data.schedule_blocks.concat(normalizeScheduleBlocks(val.commitments));
          hasData = true;
        }
      });

      return hasData ? data : null;
    } catch (e) {
      console.warn('[APIAdapter] 服务器请求失败:', e);
      return null;
    }
  }

  // ================================================================
  // 3. 数据格式转换（后端 → 前端模型）
  // ================================================================

  function normalizeNodes(serverNodes) {
    return serverNodes.map(n => ({
      id: n.id || n.nodeId || DM.generateId('node'),
      kind: n.kind || n.type || n.category || 'action',
      title: n.title || n.name || n.content || '未命名',
      description: n.description || n.detail || '',
      content: n.content || n.description || '',
      phase: n.phase || n.executionStatus || n.status || 'confirmed',
      commitment: n.commitment || n.confirmationStatus || 'observed',
      priority: n.priority || 3,
      domain_id: n.domain_id || n.domain || n.category || 'general',
      tags: n.tags || [],
      scheduled_start: n.scheduled_start || n.scheduledStart || null,
      scheduled_end: n.scheduled_end || n.scheduledEnd || null,
      duration_minutes: n.duration_minutes || n.duration || n.estimatedMinutes || null,
      actual_start: n.actual_start || n.actualStart || null,
      actual_end: n.actual_end || n.actualEnd || null,
      due_date: n.due_date || n.deadline || null,
      habit_config: n.habit_config || n.habitConfig || null,
      goal_config: n.goal_config || n.goalConfig || null,
      layout: {
        x: n.x || n.layout?.x || 0,
        y: n.y || n.layout?.y || 0,
        width: n.width || n.layout?.width || 200,
        height: n.height || n.layout?.height || 80,
        z_index: n.z_index || n.layout?.z_index || 1,
        is_pinned: n.is_pinned || n.isPinned || n.layout?.is_pinned || false,
        collapsed: n.collapsed || n.layout?.collapsed || false,
        canvas_id: n.canvas_id || n.layout?.canvas_id || 'default',
      },
      version: n.version || 1,
      updated_at: n.updated_at || n.updatedAt || DM.nowISO(),
      created_at: n.created_at || n.createdAt || DM.nowISO(),
      source: n.source || 'manual',
      ai_confidence: n.ai_confidence || n.confidence || 1.0,
      parent_id: n.parent_id || n.parentId || null,
      origins: n.origins || [],
    }));
  }

  function normalizeRelations(serverRelations) {
    return serverRelations.map(r => ({
      id: r.id || DM.generateId('rel'),
      source_node_id: r.source_node_id || r.sourceId || r.from,
      target_node_id: r.target_node_id || r.targetId || r.to,
      relation_type: r.relation_type || r.type || r.relation || 'belongs_to',
      weight: r.weight || 1.0,
      confirmed: r.confirmed !== false,
      created_by: r.created_by || r.createdBy || 'user',
      order: r.order || 0,
      version: r.version || 1,
      updated_at: r.updated_at || DM.nowISO(),
      created_at: r.created_at || DM.nowISO(),
    }));
  }

  function normalizeScheduleBlocks(serverBlocks) {
    const today = DM.todayStr();
    return serverBlocks.map(b => {
      let date = b.date || today;
      let startTime = b.start_time || b.startTime || b.time || b.scheduled_start || '09:00';
      let endTime = b.end_time || b.endTime || b.scheduled_end;
      let duration = b.duration_minutes || b.duration || b.planned_minutes || b.scheduled_duration || 60;

      // 如果 scheduled_start 是时间戳（数字或数字字符串）
      if ((typeof startTime === 'number' || (typeof startTime === 'string' && /^\d+$/.test(startTime))) && Number(startTime) > 1000000000000) {
        const d = new Date(Number(startTime));
        date = d.toISOString().slice(0, 10);
        startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      // 如果只有 start_time 和 duration，计算 end_time
      if (!endTime && duration) {
        const startMin = DM.timeToMinutes(startTime);
        endTime = DM.minutesToTime(startMin + duration);
      }

      // 如果 start_time 是 ISO 格式
      if (startTime && typeof startTime === 'string' && startTime.includes('T')) {
        const d = new Date(startTime);
        date = d.toISOString().slice(0, 10);
        startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      return {
        id: b.id || DM.generateId('sched'),
        node_id: b.node_id || b.nodeId || b.taskId || b.actionId || b.origin_node_id || null,
        habit_instance_id: b.habit_instance_id || null,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        block_type: b.block_type || b.type || b.category || 'work',
        is_fixed: b.is_fixed || b.fixed || false,
        priority: b.priority || 3,
        status: b.status || 'scheduled',
        location: b.location || '',
        notes: b.notes || b.note || '',
        source: b.source || 'manual',
        plan_version_id: b.plan_version_id || null,
        version: b.version || 1,
        title: b.title || b.name || '',
        updated_at: b.updated_at || DM.nowISO(),
        created_at: b.created_at || DM.nowISO(),
      };
    });
  }

  // ================================================================
  // 4. 本地存储持久化
  // ================================================================

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      console.log(`[APIAdapter] 从本地存储加载: ${data.nodes?.length || 0} 个节点, ${data.schedule_blocks?.length || 0} 个日程块`);
      return data;
    } catch (e) {
      console.warn('[APIAdapter] 本地存储读取失败:', e);
      return null;
    }
  }

  function saveToLocalStorage() {
    // debounce 保存
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      try {
        const data = Store.dump();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('[APIAdapter] 本地存储保存失败:', e);
      }
    }, 500);
  }

  // 订阅所有变更事件，自动保存
  function setupAutoSave() {
    if (!EventBus) return;

    const saveEvents = [
      EV.NODE_CREATED, EV.NODE_UPDATED, EV.NODE_DELETED,
      EV.RELATION_CREATED, EV.RELATION_DELETED,
      EV.SCHEDULE_CREATED, EV.SCHEDULE_UPDATED, EV.SCHEDULE_DELETED, EV.SCHEDULE_MOVED,
      EV.FOCUS_STARTED, EV.FOCUS_COMPLETED,
      EV.HABIT_INSTANCE_COMPLETED,
      EV.PLAN_APPLIED,
      EV.BATCH_ENDED,
    ];

    saveEvents.forEach(evt => {
      EventBus.on(evt, () => saveToLocalStorage());
    });
  }

  // ================================================================
  // 5. 示例数据（首次使用时初始化）
  // ================================================================

  function generateDemoData() {
    const today = DM.todayStr();
    const nodes = [];
    const relations = [];
    const scheduleBlocks = [];

    // 示例目标
    const goal1 = DM.createNode({
      kind: 'goal',
      title: '完成产品设计文档',
      domain_id: 'work',
      phase: 'active',
      commitment: 'committed',
      priority: 1,
      layout: { x: 100, y: 100, z_index: 1, is_pinned: false, canvas_id: 'default', width: 220, height: 90, collapsed: false },
    });
    nodes.push(goal1);

    // 示例行动
    const actions = [
      { title: '整理比赛提交截图', domain: 'work', duration: 45, time: '10:00', x: 80, y: 260 },
      { title: '撰写设计方案', domain: 'work', duration: 90, time: '11:00', x: 340, y: 240 },
      { title: '产品评审会议', domain: 'work', duration: 60, time: '14:00', x: 580, y: 200 },
      { title: '阅读技术文章', domain: 'study', duration: 30, time: '16:00', x: 350, y: 380 },
      { title: '健身房锻炼', domain: 'health', duration: 60, time: '19:00', x: 620, y: 380 },
      { title: '整理房间', domain: 'life', duration: 45, time: null, x: 100, y: 420 },
      { title: '每日英语', domain: 'study', duration: 20, time: null, x: 80, y: 520 },
    ];

    const actionNodes = actions.map(a => {
      const node = DM.createNode({
        kind: 'action',
        title: a.title,
        domain_id: a.domain,
        phase: a.time ? 'planned' : 'candidate',
        commitment: a.time ? 'scheduled' : 'intended',
        duration_minutes: a.duration,
        priority: 3,
        layout: { x: a.x, y: a.y, z_index: 1, is_pinned: false, canvas_id: 'default', width: 200, height: 72, collapsed: false },
      });
      nodes.push(node);

      // 目标-行动关系（前三个属于 goal1）
      if (nodes.length <= 4) {
        const rel = DM.createRelation({
          sourceNodeId: node.id,
          targetNodeId: goal1.id,
          relationType: 'belongs_to',
        });
        relations.push(rel);
      }

      // 有时间的创建日程块
      if (a.time) {
        const startMin = DM.timeToMinutes(a.time);
        const endMin = startMin + a.duration;
        const block = DM.createScheduleBlock({
          nodeId: node.id,
          date: today,
          startTime: a.time,
          endTime: DM.minutesToTime(endMin),
          block_type: a.domain === 'work' ? 'work' : a.domain,
          status: 'scheduled',
        });
        scheduleBlocks.push(block);
      }

      return node;
    });

    // 示例习惯
    const habit1 = DM.createNode({
      kind: 'habit',
      title: '晨间冥想',
      domain_id: 'health',
      phase: 'active',
      commitment: 'committed',
      habit_config: {
        frequency: 'daily',
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
        target_count: 1,
        streak_count: 7,
        reminder_time: '07:00',
      },
      layout: { x: 600, y: 100, z_index: 1, is_pinned: false, canvas_id: 'default', width: 200, height: 80, collapsed: false },
    });
    nodes.push(habit1);

    // 午餐和休息块
    const lunchBlock = DM.createScheduleBlock({
      nodeId: null,
      date: today,
      startTime: '12:30',
      endTime: '13:30',
      block_type: 'meal',
      is_fixed: true,
      status: 'scheduled',
    });
    scheduleBlocks.push(lunchBlock);

    return {
      nodes,
      relations,
      schedule_blocks: scheduleBlocks,
      habit_instances: [],
      focus_sessions: [],
      events: [],
      plan_versions: [],
    };
  }

  // ================================================================
  // 6. 与后端同步（预留）
  // ================================================================

  async function pushChanges() {
    // 将本地变更推送到后端
    // 实际实现需根据后端 API 设计
    console.log('[APIAdapter] pushChanges - 待实现');
  }

  async function pullChanges() {
    // 从后端拉取最新数据
    console.log('[APIAdapter] pullChanges - 待实现');
  }

  // ================================================================
  // 公开 API
  // ================================================================
  return {
    // 初始化
    loadInitialData,
    setupAutoSave,

    // 本地存储
    loadFromLocalStorage,
    saveToLocalStorage,

    // 数据转换
    normalizeNodes,
    normalizeRelations,
    normalizeScheduleBlocks,

    // 同步（预留）
    pushChanges,
    pullChanges,

    // 工具
    STORAGE_KEY,
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.BanbanAPIAdapter = BanbanAPIAdapter;
  window.APIAdapter = BanbanAPIAdapter;
}
