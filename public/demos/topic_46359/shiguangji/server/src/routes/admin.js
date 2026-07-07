// 管理员路由模块
// 提供系统管理功能，需要管理员权限

const express = require('express');
const db = require('../database');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要登录认证 + 管理员权限
router.use(authRequired, adminRequired);

/**
 * GET /users - 获取所有用户列表（不含密码）
 * 返回: { success, data: [users] }
 */
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at ASC'
    ).all();

    const formatted = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.created_at
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /stats - 获取系统统计
 * 返回: { success, data: { userCount, totalRecords, userRecords: [...] } }
 */
router.get('/stats', (req, res) => {
  try {
    // 用户总数
    const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get();

    // 总记录数
    const totalRecordsRow = db.prepare('SELECT COUNT(*) as count FROM records').get();

    // 各用户记录数
    const userRecordsRows = db.prepare(`
      SELECT u.id, u.username, u.role, COUNT(r.id) as recordCount
      FROM users u
      LEFT JOIN records r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY recordCount DESC
    `).all();

    const userRecords = userRecordsRows.map((row) => ({
      id: row.id,
      username: row.username,
      role: row.role,
      recordCount: row.recordCount
    }));

    // 计算标签统计和平均评分
    const allRecords = db.prepare('SELECT tags, rating FROM records').all();
    const tagCount = {};
    let ratingSum = 0;
    let ratingCount = 0;
    allRecords.forEach((row) => {
      let tags = row.tags;
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch (e) { tags = []; }
      }
      if (Array.isArray(tags)) {
        tags.forEach((tag) => { tagCount[tag] = (tagCount[tag] || 0) + 1; });
      }
      if (row.rating && row.rating > 0) {
        ratingSum += row.rating;
        ratingCount++;
      }
    });

    const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '0.0';

    res.json({
      success: true,
      data: {
        userCount: userCountRow.count,
        recordCount: totalRecordsRow.count,
        totalRecords: totalRecordsRow.count,
        tagCount,
        avgRating,
        userRecords
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /records - 获取所有用户的记录（带用户名）
 * 返回: { success, data: [records] }
 */
router.get('/records', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.*, u.username
      FROM records r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all();

    const records = rows.map((row) => {
      let tags = row.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [];
        }
      }
      if (!Array.isArray(tags)) tags = [];
      return {
        id: row.id,
        userId: row.user_id,
        username: row.username,
        dishName: row.dish_name,
        imagePath: row.image_path,
        emoji: row.emoji,
        date: row.date,
        mealType: row.meal_type,
        tags,
        difficulty: row.difficulty,
        cookTime: row.cook_time,
        calories: row.calories,
        notes: row.notes,
        rating: row.rating,
        createdAt: row.created_at
      };
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /users/:id - 删除用户（同时删除其所有记录）
 * 不能删除 admin 账号
 * 返回: { success, message }
 */
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 查询用户是否存在
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能删除 admin 账号
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '不能删除管理员账号'
      });
    }

    // 使用事务删除用户及其所有记录
    const deleteRecords = db.prepare('DELETE FROM records WHERE user_id = ?');
    const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

    const transaction = db.transaction(() => {
      deleteRecords.run(id);
      deleteUser.run(id);
    });

    transaction();

    res.json({
      success: true,
      message: `用户 ${user.username} 及其所有记录已删除`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
