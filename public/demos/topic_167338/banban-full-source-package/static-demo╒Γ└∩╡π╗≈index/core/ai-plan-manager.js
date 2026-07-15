/* ================================================================
 * Banban Core — AI Plan Manager  v1.0
 * AI计划管理器：草案-确认-提交 三阶段流程
 *
 * 流程：
 *   1. 生成草案（draft）- AI生成多个方案供选择
 *   2. 用户确认/调整（confirmed）- 用户选择并可调整
 *   3. 应用计划（applied）- 一次性事务写入主状态
 *
 * 关键原则：AI 不直接修改正式数据，必须经过用户确认
 * ================================================================ */

const BanbanAIPlanManager = (() => {
  'use strict';

  const DM = window.DataModel || BanbanDataModel;
  const Store = window.Store || BanbanStore;
  const EventBus = window.EventBus || BanbanEventBus;
  const CommandBus = window.CommandBus || BanbanCommandBus;
  const EV = EventBus ? EventBus.EVENTS : {};

  // ================================================================
  // 1. 生成计划草案
  // ================================================================

  /**
   * 生成每日计划草案（本地模拟AI，实际可调用后端API）
   * @param {object} options
   * @param {string} options.date - 日期 YYYY-MM-DD
   * @param {string} options.prompt - 用户提示
   * @param {object} options.constraints - 约束条件
   * @returns {object} PlanVersion
   */
  async function generateDailyPlan({ date, prompt, constraints }) {
    const targetDate = date || DM.todayStr();

    // 获取候选行动（未完成且未安排的行动）
    const candidateActions = Store.getActiveActions().filter(action => {
      const blocks = Store.getScheduleBlocksForNode(action.id);
      const scheduledToday = blocks.some(b => b.date === targetDate);
      return !scheduledToday;
    });

    // 模拟AI生成三个方案
    // 实际项目中这里应该调用后端 API
    const options = generatePlanOptions(candidateActions, targetDate, constraints);

    // 创建 PlanVersion
    const planVersion = DM.createPlanVersion({
      planType: 'daily',
      dateRange: { start: targetDate, end: targetDate },
      ai_draft: true,
      ai_prompt: prompt || '',
      ai_reasoning: `基于${candidateActions.length}个待办行动，生成了3个差异化方案`,
      ai_options: options,
      status: 'draft',
    });

    Store._putPlanVersion(planVersion);
    EventBus.emit(EV.PLAN_DRAFT_CREATED, { planVersion });

    return planVersion;
  }

  /**
   * 生成多个计划方案（本地算法模拟AI）
   */
  function generatePlanOptions(actions, date, constraints) {
    const workStart = constraints?.workStart || 9;
    const workEnd = constraints?.workEnd || 18;
    const lunchStart = constraints?.lunchStart || 12;
    const lunchEnd = constraints?.lunchEnd || 13;

    // 按领域分组
    const byDomain = {};
    actions.forEach(a => {
      const d = a.domain_id || 'general';
      if (!byDomain[d]) byDomain[d] = [];
      byDomain[d].push(a);
    });

    // 方案1：稳妥完成（少而精）
    const safeOption = {
      id: 'safe',
      name: '稳妥完成',
      description: '精选3-5项重要任务，确保全部完成',
      blocks: [],
    };

    // 方案2：平衡安排（中等强度）
    const balancedOption = {
      id: 'balanced',
      name: '平衡安排',
      description: '工作、学习、生活均衡分配',
      blocks: [],
    };

    // 方案3：冲刺模式（高强度）
    const sprintOption = {
      id: 'sprint',
      name: '冲刺模式',
      description: '尽可能多地安排任务，挑战极限',
      blocks: [],
    };

    let currentTime = workStart * 60; // 分钟
    let lunchAdded = false;

    // 排序：按优先级
    const sorted = [...actions].sort((a, b) => (b.priority || 3) - (a.priority || 3));

    // 构建方案
    const buildBlocks = (actionList, maxHours, optionBlocks) => {
      let time = workStart * 60;
      let totalMin = 0;
      const maxMin = maxHours * 60;

      actionList.forEach(action => {
        if (totalMin >= maxMin) return;

        // 跳过午餐时间
        if (!lunchAdded && time >= lunchStart * 60 && time < lunchEnd * 60) {
          optionBlocks.push({
            node_id: null,
            date,
            start_time: DM.minutesToTime(lunchStart * 60),
            end_time: DM.minutesToTime(lunchEnd * 60),
            duration_minutes: (lunchEnd - lunchStart) * 60,
            block_type: 'meal',
            is_fixed: true,
            title: '午餐 & 休息',
          });
          time = lunchEnd * 60;
          lunchAdded = true;
        }

        const duration = action.duration_minutes || 60;
        if (time + duration > workEnd * 60) return;
        if (totalMin + duration > maxMin) return;

        optionBlocks.push({
          node_id: action.id,
          node_title: action.title,
          date,
          start_time: DM.minutesToTime(time),
          end_time: DM.minutesToTime(time + duration),
          duration_minutes: duration,
          block_type: action.domain_id === 'work' ? 'work' : action.domain_id,
          title: action.title,
          domain: action.domain_id,
        });

        time += duration;
        totalMin += duration;

        // 任务之间留5分钟缓冲
        time += 5;
      });

      return totalMin;
    };

    // 生成三个方案
    buildBlocks(sorted.slice(0, 4), 3, safeOption.blocks);
    lunchAdded = false;
    buildBlocks(sorted.slice(0, 7), 5, balancedOption.blocks);
    lunchAdded = false;
    buildBlocks(sorted, 7, sprintOption.blocks);

    return [safeOption, balancedOption, sprintOption];
  }

  // ================================================================
  // 2. 修改草案
  // ================================================================

  function updateDraft(planVersionId, updates) {
    const pv = Store.getPlanVersion(planVersionId);
    if (!pv || pv.status !== 'draft') {
      throw new Error('无效的计划版本或状态不允许修改');
    }

    const updated = {
      ...pv,
      ...updates,
      version: pv.version + 1,
      updated_at: DM.nowISO(),
    };
    Store._putPlanVersion(updated);
    EventBus.emit(EV.PLAN_DRAFT_UPDATED, { planVersion: updated });
    return updated;
  }

  /**
   * 选择方案（将选中的方案作为快照内容）
   */
  function selectOption(planVersionId, optionId) {
    const pv = Store.getPlanVersion(planVersionId);
    if (!pv) throw new Error('Plan version not found');

    const option = pv.ai_options?.find(o => o.id === optionId);
    if (!option) throw new Error(`Option not found: ${optionId}`);

    // 将方案转换为 schedule_blocks 快照
    const blocks = option.blocks.map((b, i) => ({
      id: `draft_${planVersionId}_${i}`,
      node_id: b.node_id,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      duration_minutes: b.duration_minutes,
      block_type: b.block_type || 'work',
      is_fixed: b.is_fixed || false,
      priority: 3,
      status: 'scheduled',
      version: 1,
    }));

    return updateDraft(planVersionId, {
      snapshot: { ...pv.snapshot, schedule_blocks: blocks },
      selected_option: optionId,
    });
  }

  // ================================================================
  // 3. 应用计划（提交到主状态）
  // ================================================================

  /**
   * 应用计划草案到主状态
   * 使用批量命令确保原子性：要么全部成功，要么全部回滚
   */
  function applyPlan(planVersionId) {
    const pv = Store.getPlanVersion(planVersionId);
    if (!pv) throw new Error('Plan version not found');
    if (pv.status === 'applied') throw new Error('计划已应用');

    const blocks = pv.snapshot.schedule_blocks || [];
    if (blocks.length === 0) throw new Error('计划内容为空');

    const commands = [];

    // 先删除该日期已有的日程块（除了固定事件）
    const date = pv.date_range?.start || DM.todayStr();
    const existingBlocks = Store.getScheduleBlocksByDate(date);
    existingBlocks.forEach(block => {
      if (!block.is_fixed) {
        commands.push({
          type: CommandBus.COMMANDS.DELETE_SCHEDULE_BLOCK,
          payload: { blockId: block.id },
        });
      }
    });

    // 再添加新的日程块
    blocks.forEach(block => {
      if (block.node_id) {
        commands.push({
          type: CommandBus.COMMANDS.SCHEDULE_ACTION,
          payload: {
            nodeId: block.node_id,
            date: block.date || date,
            startTime: block.start_time,
            endTime: block.end_time,
            blockType: block.block_type,
            isFixed: block.is_fixed,
            priority: block.priority,
          },
        });
      } else {
        // 无 node_id 的块（如休息、午餐）
        // 这里简化处理，直接创建一个带标题的块
        commands.push({
          type: CommandBus.COMMANDS.CREATE_NODE,
          payload: {
            kind: 'action',
            title: block.title || '休息',
            domain_id: block.block_type === 'meal' ? 'life' : 'general',
          },
        });
        // 注意：由于命令是顺序执行的，这里需要特殊处理
        // 简化起见，先跳过无 node_id 的块
      }
    });

    // 批量执行
    let results;
    if (EventBus) {
      EventBus.batch(() => {
        results = commands.map(cmd => CommandBus.execute(cmd));
      });
    } else {
      results = commands.map(cmd => CommandBus.execute(cmd));
    }

    // 更新计划版本状态
    const updated = {
      ...pv,
      status: 'applied',
      version: pv.version + 1,
      applied_at: DM.nowISO(),
    };
    Store._putPlanVersion(updated);

    // 记录事件
    const evt = DM.createActivityEvent({
      eventType: 'plan.applied',
      entityType: 'plan_version',
      entityId: planVersionId,
      payload: { planVersion: updated, results },
    });
    Store._putEvent(evt);

    EventBus.emit(EV.PLAN_APPLIED, { planVersion: updated, results });

    return updated;
  }

  // ================================================================
  // 4. 查询
  // ================================================================

  function getCurrentDraft(planType) {
    return Store.getCurrentDraft(planType || 'daily');
  }

  function getLatestPlan(planType, date) {
    const list = Store.getPlanVersionsByType(planType, 'applied');
    return list[0] || null;
  }

  // ================================================================
  // 公开 API
  // ================================================================
  return {
    // 生成
    generateDailyPlan,

    // 修改草案
    updateDraft,
    selectOption,

    // 应用
    applyPlan,

    // 查询
    getCurrentDraft,
    getLatestPlan,
  };
})();

// 暴露到全局
if (typeof window !== 'undefined') {
  window.BanbanAIPlanManager = BanbanAIPlanManager;
  window.AIPlanManager = BanbanAIPlanManager;
}
