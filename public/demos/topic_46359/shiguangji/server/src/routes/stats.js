// 统计路由模块
// 提供当前用户的美食记录统计数据

const express = require('express');
const db = require('../database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要登录认证
router.use(authRequired);

/**
 * GET / - 获取当前用户的统计数据
 * 返回: { success, data: { total, tagCount, mealTypeCount, difficultyCount, monthlyCount, avgRating } }
 */
router.get('/', (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. 总记录数
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM records WHERE user_id = ?').get(userId);
    const total = totalRow.total;

    // 2. 标签统计（从 tags JSON 字段中聚合）
    const tagRows = db.prepare('SELECT tags FROM records WHERE user_id = ?').all(userId);
    const tagCount = {};
    tagRows.forEach((row) => {
      let tags = row.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [];
        }
      }
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    // 3. 餐次统计
    const mealTypeRows = db.prepare(
      'SELECT meal_type as mealType, COUNT(*) as count FROM records WHERE user_id = ? GROUP BY meal_type'
    ).all(userId);
    const mealTypeCount = {};
    mealTypeRows.forEach((row) => {
      mealTypeCount[row.mealType] = row.count;
    });

    // 4. 难度统计
    const difficultyRows = db.prepare(
      'SELECT difficulty, COUNT(*) as count FROM records WHERE user_id = ? GROUP BY difficulty'
    ).all(userId);
    const difficultyCount = {};
    difficultyRows.forEach((row) => {
      difficultyCount[row.difficulty] = row.count;
    });

    // 5. 月度统计（按年月分组）
    const monthlyRows = db.prepare(`
      SELECT substr(date, 1, 7) as month, COUNT(*) as count
      FROM records
      WHERE user_id = ?
      GROUP BY substr(date, 1, 7)
      ORDER BY month DESC
    `).all(userId);
    const monthlyCount = {};
    monthlyRows.forEach((row) => {
      monthlyCount[row.month] = row.count;
    });

    // 6. 平均评分
    const ratingRow = db.prepare(
      'SELECT AVG(rating) as avgRating FROM records WHERE user_id = ? AND rating > 0'
    ).get(userId);
    const avgRating = ratingRow.avgRating ? Math.round(ratingRow.avgRating * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        total,
        tagCount,
        mealTypeCount,
        difficultyCount,
        monthlyCount,
        avgRating
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
