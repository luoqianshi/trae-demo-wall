const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

/**
 * POST /api/v1/tracking/feedback
 * 提交每日反馈
 */
router.post('/feedback', (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // [{ plan_item_id, status: 'done'|'skip'|'fail', reason: '' }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ code: 400, message: '请提供反馈数据', data: null });
    }

    const upsert = db.prepare(`
      INSERT INTO tracking_records (user_id, plan_item_id, track_date, status, reason)
      VALUES (?, ?, CURRENT_DATE, ?, ?)
      ON CONFLICT(user_id, plan_item_id, track_date) DO UPDATE SET
        status = excluded.status,
        reason = excluded.reason
    `);

    // 注意：SQLite需要唯一约束才能使用ON CONFLICT，这里我们用DELETE+INSERT代替
    const insert = db.prepare(
      'INSERT INTO tracking_records (user_id, plan_item_id, track_date, status, reason) VALUES (?, ?, CURRENT_DATE, ?, ?)'
    );

    const results = [];
    const trackMany = db.transaction((feedbackItems) => {
      let doneCount = 0;
      for (const item of feedbackItems) {
        // 先删除已有的今日记录
        db.prepare(
          'DELETE FROM tracking_records WHERE user_id = ? AND plan_item_id = ? AND track_date = CURRENT_DATE'
        ).run(userId, item.plan_item_id);

        const result = insert.run(
          userId,
          item.plan_item_id,
          item.status || 'pending',
          item.reason || ''
        );

        results.push({
          plan_item_id: item.plan_item_id,
          status: item.status,
          tracking_id: result.lastInsertRowid
        });

        if (item.status === 'done') doneCount++;
      }

      // 完成反馈奖励积分（每完成一项+1分，上限5分/天）
      if (doneCount > 0) {
        const points = Math.min(doneCount, 5);
        db.prepare('INSERT INTO point_records (user_id, points, event_type) VALUES (?, ?, ?)')
          .run(userId, points, 'daily_feedback');
      }
    });

    trackMany(items);

    res.json({
      code: 0,
      message: '反馈提交成功',
      data: { count: results.length, items: results }
    });
  } catch (err) {
    console.error('[Tracking] 提交反馈失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/tracking/today
 * 获取今日待办
 */
router.get('/today', (req, res) => {
  try {
    const userId = req.user.id;

    // 获取今天的日期对应的方案
    const today = new Date().toISOString().split('T')[0];
    const plan = db.prepare(
      'SELECT * FROM daily_plans WHERE user_id = ? AND plan_date = ?'
    ).get(userId, today);

    if (!plan) {
      return res.json({
        code: 0,
        message: '今日暂无方案',
        data: { date: today, items: [], total: 0, completed: 0 }
      });
    }

    // 获取方案条目
    const planItems = db.prepare(
      'SELECT * FROM plan_items WHERE plan_id = ? ORDER BY time_slot ASC'
    ).all(plan.id);

    // 获取今日追踪记录
    const trackings = {};
    const records = db.prepare(
      'SELECT * FROM tracking_records WHERE user_id = ? AND track_date = ?'
    ).all(userId, today);
    for (const r of records) {
      trackings[r.plan_item_id] = r;
    }

    const items = planItems.map(item => ({
      id: item.id,
      item_type: item.item_type,
      content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content,
      time_slot: item.time_slot,
      is_custom: item.is_custom,
      tracking: trackings[item.id] || { status: 'pending', reason: '' }
    }));

    const completed = items.filter(i => i.tracking.status === 'done').length;

    res.json({
      code: 0,
      message: 'ok',
      data: {
        date: today,
        plan_id: plan.id,
        plan_status: plan.status,
        total: items.length,
        completed,
        items
      }
    });
  } catch (err) {
    console.error('[Tracking] 获取今日待办失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/tracking/weekly
 * 获取周度报告
 */
router.get('/weekly', (req, res) => {
  try {
    const userId = req.user.id;

    // 获取本周日期范围
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 周日=7
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    // 获取本周方案
    const plans = db.prepare(
      'SELECT * FROM daily_plans WHERE user_id = ? AND plan_date BETWEEN ? AND ? ORDER BY plan_date ASC'
    ).all(userId, mondayStr, sundayStr);

    // 获取本周追踪记录
    const planIds = plans.map(p => p.id);
    const trackingRecords = planIds.length > 0
      ? db.prepare(`
        SELECT tr.* FROM tracking_records tr
        JOIN plan_items pi ON tr.plan_item_id = pi.id
        WHERE pi.plan_id IN (${planIds.join(',')})
        AND tr.track_date BETWEEN ? AND ?
      `).all(userId, mondayStr, sundayStr)
      : [];

    // 统计
    let totalItems = 0;
    let completedItems = 0;
    let skippedItems = 0;
    let failedItems = 0;

    const planIdsForItems = plans.length > 0 ? plans.map(p => p.id) : [0];
    const allItems = db.prepare(
      `SELECT pi.*, dp.plan_date FROM plan_items pi
       JOIN daily_plans dp ON pi.plan_id = dp.id
       WHERE dp.id IN (${planIdsForItems.join(',')})`
    ).all();

    totalItems = allItems.length;

    for (const record of trackingRecords) {
      if (record.status === 'done') completedItems++;
      else if (record.status === 'skip') skippedItems++;
      else if (record.status === 'fail') failedItems++;
    }

    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // 按天统计
    const dailyStats = plans.map(plan => {
      const dayItems = db.prepare('SELECT id FROM plan_items WHERE plan_id = ?').all(plan.id);
      const dayTrackings = db.prepare(`
        SELECT * FROM tracking_records
        WHERE plan_item_id IN (${dayItems.map(i => i.id).join(',') || '0'})
        AND track_date = ?
      `).all(plan.plan_date);

      const dayTotal = dayItems.length;
      const dayCompleted = dayTrackings.filter(t => t.status === 'done').length;

      return {
        date: plan.plan_date,
        total: dayTotal,
        completed: dayCompleted,
        rate: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0
      };
    });

    // 按类型统计
    const typeStats = {};
    for (const item of allItems) {
      if (!typeStats[item.item_type]) {
        typeStats[item.item_type] = { total: 0, completed: 0 };
      }
      typeStats[item.item_type].total++;
    }
    for (const record of trackingRecords) {
      const item = allItems.find(i => i.id === record.plan_item_id);
      if (item && record.status === 'done') {
        typeStats[item.item_type].completed++;
      }
    }

    res.json({
      code: 0,
      message: 'ok',
      data: {
        week_start: mondayStr,
        week_end: sundayStr,
        summary: {
          total_days: plans.length,
          total_items,
          completed_items: completedItems,
          skipped_items: skippedItems,
          failed_items: failedItems,
          completion_rate: completionRate
        },
        daily_stats: dailyStats,
        type_stats: typeStats
      }
    });
  } catch (err) {
    console.error('[Tracking] 获取周度报告失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
