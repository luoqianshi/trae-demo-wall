/* ================================================================
 * Banban Core — Data Model  v1.0
 * 7大核心实体的数据模型定义 + 工厂函数
 *
 * 实体列表：
 *   Node          - 统一节点（goal/action/habit/note/question）
 *   Relation      - 节点之间的关系
 *   ScheduleBlock - 日程时间块
 *   HabitInstance - 习惯实例（每日）
 *   FocusSession  - 专注会话
 *   ActivityEvent - 活动事件（数据总线）
 *   PlanVersion   - 计划版本（含AI草案）
 * ================================================================ */

const BanbanDataModel = (() => {
  'use strict';

  // ===== 辅助函数 =====
  function generateId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ================================================================
  // 1. Node — 统一节点
  // ================================================================
  function createNode({ kind, title, ...overrides }) {
    const now = nowISO();
    return {
      id: generateId('node'),
      kind,                          // goal | action | habit | note | question
      title: title || '未命名',
      description: '',
      content: '',                   // 富文本内容/笔记详情

      // 状态机
      phase: 'candidate',            // candidate | confirmed | planned | active | completed | archived
      commitment: 'observed',        // observed | interested | intended | committed | scheduled | active
      priority: 3,                   // 1-5

      // 分类
      domain_id: 'general',          // work | study | life | health | interest | general
      tags: [],

      // 时间
      scheduled_start: null,         // ISO
      scheduled_end: null,           // ISO
      duration_minutes: null,
      actual_start: null,
      actual_end: null,
      due_date: null,                // 截止日期

      // 习惯特有（kind=habit）
      habit_config: kind === 'habit' ? {
        frequency: 'daily',          // daily | weekly | monthly
        days_of_week: [],            // [1,3,5] 周一三五
        target_count: 1,             // 每期目标次数
        streak_count: 0,             // 当前连续天数
        reminder_time: null,         // 提醒时间 HH:mm
      } : null,

      // 目标特有（kind=goal）
      goal_config: kind === 'goal' ? {
        progress: 0,                 // 0-100
        deadline: null,
        milestone: false,
      } : null,

      // 画布布局
      layout: {
        x: 0,
        y: 0,
        width: 200,
        height: 80,
        z_index: 1,
        is_pinned: false,
        collapsed: false,
        canvas_id: 'default',
      },

      // 版本控制
      version: 1,
      updated_at: now,
      created_at: now,

      // 来源
      source: 'manual',              // manual | ai | import
      ai_confidence: 1.0,
      parent_id: null,               // 从哪个节点转换/派生
      origins: [],

      ...overrides,
    };
  }

  // ================================================================
  // 2. Relation — 节点关系
  // ================================================================
  function createRelation({ sourceNodeId, targetNodeId, relationType, ...overrides }) {
    const now = nowISO();
    return {
      id: generateId('rel'),
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      relation_type: relationType || 'belongs_to',  // belongs_to | decomposes_to | depends_on | supports | conflicts_with | reference
      weight: 1.0,
      confirmed: true,
      created_by: 'user',            // user | ai | system
      order: 0,
      version: 1,
      updated_at: now,
      created_at: now,
      ...overrides,
    };
  }

  // ================================================================
  // 3. ScheduleBlock — 日程时间块
  // ================================================================
  function createScheduleBlock({ nodeId, date, startTime, endTime, ...overrides }) {
    const now = nowISO();
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const duration = endMin - startMin;

    return {
      id: generateId('sched'),
      node_id: nodeId || null,
      habit_instance_id: null,
      date: date || todayStr(),
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration > 0 ? duration : 60,

      block_type: 'work',            // work | meeting | rest | meal | exercise | commute | focus | routine
      is_fixed: false,               // 固定时间不可移动
      priority: 3,

      // 状态
      status: 'scheduled',           // scheduled | in_progress | completed | skipped | cancelled

      location: '',
      notes: '',

      // 来源
      source: 'manual',              // manual | ai | import
      plan_version_id: null,

      version: 1,
      updated_at: now,
      created_at: now,
      ...overrides,
    };
  }

  // ================================================================
  // 4. HabitInstance — 习惯实例（每日）
  // ================================================================
  function createHabitInstance({ habitNodeId, date, ...overrides }) {
    const now = nowISO();
    return {
      id: generateId('habit_inst'),
      habit_node_id: habitNodeId,
      date: date || todayStr(),
      status: 'pending',             // pending | done | skipped | failed
      completed_at: null,
      value: 0,                      // 数值型习惯的值
      note: '',
      planned_time: null,            // 计划时间 HH:mm
      actual_minutes: 0,
      version: 1,
      updated_at: now,
      created_at: now,
      ...overrides,
    };
  }

  // ================================================================
  // 5. FocusSession — 专注会话
  // ================================================================
  function createFocusSession({ nodeId, scheduleBlockId, ...overrides }) {
    const now = nowISO();
    return {
      id: generateId('focus'),
      node_id: nodeId || null,
      schedule_block_id: scheduleBlockId || null,

      start_time: now,
      end_time: null,
      duration_minutes: 0,

      status: 'active',              // active | paused | completed | cancelled

      // 专注数据
      focus_score: null,             // 0-100
      interruptions: 0,
      pause_count: 0,
      total_paused_seconds: 0,

      // 番茄钟
      pomodoro_cycle: 0,             // 当前第几个番茄
      pomodoro_total: 4,

      version: 1,
      updated_at: now,
      created_at: now,
      ...overrides,
    };
  }

  // ================================================================
  // 6. ActivityEvent — 活动事件（数据总线）
  // ================================================================
  function createActivityEvent({ eventType, entityType, entityId, payload, ...overrides }) {
    const now = nowISO();
    return {
      id: generateId('evt'),
      event_type: eventType,
      entity_type: entityType,       // node | relation | schedule_block | focus_session | habit_instance | plan_version
      entity_id: entityId,

      timestamp: now,
      payload: payload || {},

      user_id: 'local',
      source: 'user',                // user | ai | system

      created_at: now,
      ...overrides,
    };
  }

  // ================================================================
  // 7. PlanVersion — 计划版本（含AI草案）
  // ================================================================
  function createPlanVersion({ planType, dateRange, ...overrides }) {
    const now = nowISO();
    return {
      id: generateId('plan_ver'),
      plan_type: planType || 'daily',   // daily | weekly | custom
      date_range: dateRange || { start: todayStr(), end: todayStr() },
      version_number: 1,
      parent_version_id: null,

      // 快照
      snapshot: {
        schedule_blocks: [],
        nodes: [],
        relations: [],
        habit_instances: [],
      },

      // AI相关
      ai_draft: false,
      ai_prompt: '',
      ai_reasoning: '',
      ai_options: [],                  // 多方案时的选项列表

      status: 'draft',                 // draft | proposed | confirmed | applied | archived

      version: 1,
      updated_at: now,
      created_at: now,
      ...overrides,
    };
  }

  // ================================================================
  // 公开 API
  // ================================================================
  return {
    // 工厂函数
    createNode,
    createRelation,
    createScheduleBlock,
    createHabitInstance,
    createFocusSession,
    createActivityEvent,
    createPlanVersion,

    // 辅助函数
    generateId,
    nowISO,
    timeToMinutes,
    minutesToTime,
    todayStr,
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.BanbanDataModel = BanbanDataModel;
  // 简写别名
  window.DataModel = BanbanDataModel;
}
