const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');
const { generatePlan, extractHealthConditions } = require('../services/planGenerator');

const router = express.Router();

router.use(auth);

/**
 * POST /api/v1/plans/generate
 * AI生成30天方案（测试版：基于规则的简单生成）
 */
router.post('/generate', (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户档案
    let profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    if (!profile) {
      // 尝试从BMI指标推断基础信息，自动创建profile
      const bmiMetric = db.prepare("SELECT value FROM health_metrics WHERE user_id = ? AND metric_type = 'bmi' ORDER BY created_at DESC LIMIT 1").get(userId);
      let height = 170, weight = 65, gender = 'male', age = 35;
      if (bmiMetric) {
        const bmiValue = (function(v) { try { return typeof v === 'string' ? JSON.parse(v) : v } catch(e) { return v } })(bmiMetric.value);
        if (bmiValue.height) height = bmiValue.height;
        if (bmiValue.weight) weight = bmiValue.weight;
      }
      // 创建默认profile
      db.prepare('INSERT INTO user_profiles (user_id, height, weight, gender, age) VALUES (?, ?, ?, ?, ?)')
        .run(userId, height, weight, gender, age);
      profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
      console.log('[Plan] 自动创建用户profile:', profile);
    }

    // 获取体检指标
    const allMetrics = db.prepare(
      'SELECT metric_type, value FROM health_metrics WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    const metricsByType = {};
    for (const m of allMetrics) {
      const parsedValue = (function(v) { try { return typeof v === 'string' ? JSON.parse(v) : v } catch(e) { return v } })(m.value);
      if (!metricsByType[m.metric_type]) {
        metricsByType[m.metric_type] = parsedValue;
      }
    }

    // 提取健康条件
    const healthConditions = extractHealthConditions(metricsByType);

    // 生成30天方案
    const planData = generatePlan(profile, healthConditions);

    // 计算plan_month (当前月份)
    const now = new Date();
    const planMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 检查是否已有当月方案，先清除旧方案
    const existingPlans = db.prepare(
      "SELECT id FROM daily_plans WHERE user_id = ? AND plan_month = ?"
    ).all(userId, planMonth);

    if (existingPlans.length > 0) {
      // 先清除当月旧方案的所有关联数据
      const planIds = existingPlans.map(p => p.id);
      const oldItems = db.prepare(`SELECT id FROM plan_items WHERE plan_id IN (${planIds.join(',')})`).all();
      if (oldItems.length > 0) {
        const itemIds = oldItems.map(i => i.id);
        db.prepare(`DELETE FROM tracking_records WHERE plan_item_id IN (${itemIds.join(',')})`).run();
      }
      db.prepare(`DELETE FROM plan_items WHERE plan_id IN (${planIds.join(',')})`).run();
      db.prepare(`DELETE FROM daily_plans WHERE user_id = ? AND plan_month = ?`).run(userId, planMonth);
    }

    // 保存方案到数据库
    const insertPlan = db.prepare(
      'INSERT INTO daily_plans (user_id, plan_date, plan_month, status) VALUES (?, ?, ?, ?)'
    );

    const insertItem = db.prepare(
      'INSERT INTO plan_items (plan_id, item_type, content, time_slot, is_custom) VALUES (?, ?, ?, ?, ?)'
    );

    const insertMany = db.transaction((days) => {
      const planIds = [];
      for (const day of days) {
        const planResult = insertPlan.run(userId, day.date, planMonth, 'draft');
        const planId = planResult.lastInsertRowid;
        planIds.push(planId);

        for (const item of day.items) {
          insertItem.run(planId, item.item_type, item.content, item.time_slot, item.is_custom);
        }
      }
      return planIds;
    });

    const planIds = insertMany(planData);

    res.status(201).json({
      code: 0,
      message: '方案生成成功',
      data: {
        plan_month: planMonth,
        days_count: planData.length,
        plan_ids: planIds,
        preview: planData.slice(0, 3) // 返回前3天预览
      }
    });
  } catch (err) {
    console.error('[Plan] 生成方案失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/plans/current
 * 获取当前月度方案
 */
router.get('/current', (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    const now = new Date();
    const planMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const plans = db.prepare(
      'SELECT * FROM daily_plans WHERE user_id = ? AND plan_month = ? ORDER BY plan_date ASC'
    ).all(userId, planMonth);

    if (plans.length === 0) {
      return res.json({
        code: 0,
        message: '暂无当月方案',
        data: { plan_month: planMonth, plans: [], total_days: 0, status: null }
      });
    }

    // 获取所有plan_items
    const planIds = plans.map(p => p.id);
    const allItems = db.prepare(
      `SELECT * FROM plan_items WHERE plan_id IN (${planIds.join(',')}) ORDER BY plan_id, id`
    ).all();

    // 获取tracking状态
    const trackingRecords = db.prepare(
      `SELECT * FROM tracking_records WHERE plan_item_id IN (${allItems.map(i => i.id).join(',')})`
    ).all();
    const trackingMap = {};
    for (const tr of trackingRecords) {
      trackingMap[tr.plan_item_id] = tr;
    }

    // 组装数据
    const plansWithItems = plans.map(plan => {
      const items = allItems
        .filter(item => item.plan_id === plan.id)
        .map(item => ({
          ...item,
          content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content,
          tracking_status: trackingMap[item.id] ? trackingMap[item.id].status : 'pending'
        }));
      return { ...plan, items };
    });

    // 总体状态
    const overallStatus = plans[0].status;
    const completedDays = plans.filter(p => {
      const items = allItems.filter(i => i.plan_id === p.id);
      return items.every(i => trackingMap[i.id] && trackingMap[i.id].status === 'done');
    }).length;

    res.json({
      code: 0,
      message: 'ok',
      data: {
        plan_month: planMonth,
        status: overallStatus,
        total_days: plans.length,
        completed_days: completedDays,
        plans: plansWithItems
      }
    });
  } catch (err) {
    console.error('[Plan] 获取当前方案失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * PUT /api/v1/plans/items/:id
 * 修改方案项
 */
router.put('/items/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.id);
    const { item_type, content, time_slot } = req.body;

    // 验证方案项属于当前用户
    const item = db.prepare(`
      SELECT pi.* FROM plan_items pi
      JOIN daily_plans dp ON pi.plan_id = dp.id
      WHERE pi.id = ? AND dp.user_id = ?
    `).get(itemId, userId);

    if (!item) {
      return res.status(404).json({ code: 404, message: '方案项不存在', data: null });
    }

    // 更新
    db.prepare(`
      UPDATE plan_items SET
        item_type = COALESCE(?, item_type),
        content = COALESCE(?, content),
        time_slot = COALESCE(?, time_slot),
        is_custom = 1
      WHERE id = ?
    `).run(
      item_type || null,
      content ? (typeof content === 'object' ? JSON.stringify(content) : content) : null,
      time_slot || null,
      itemId
    );

    const updated = db.prepare('SELECT * FROM plan_items WHERE id = ?').get(itemId);
    updated.content = typeof updated.content === 'string' ? JSON.parse(updated.content) : updated.content;

    res.json({
      code: 0,
      message: '方案项修改成功',
      data: updated
    });
  } catch (err) {
    console.error('[Plan] 修改方案项失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * POST /api/v1/plans/confirm
 * 确认方案
 */
router.post('/confirm', (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.body;

    const now = new Date();
    const planMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 将所有draft方案更新为confirmed
    const result = db.prepare(
      "UPDATE daily_plans SET status = 'confirmed' WHERE user_id = ? AND plan_month = ? AND status = 'draft'"
    ).run(userId, planMonth);

    if (result.changes === 0) {
      return res.status(400).json({ code: 400, message: '没有待确认的方案', data: null });
    }

    // 确认方案奖励积分
    db.prepare('INSERT INTO point_records (user_id, points, event_type) VALUES (?, ?, ?)')
      .run(userId, 5, 'confirm_plan');

    res.json({
      code: 0,
      message: '方案确认成功',
      data: {
        plan_month: planMonth,
        confirmed_days: result.changes
      }
    });
  } catch (err) {
    console.error('[Plan] 确认方案失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
