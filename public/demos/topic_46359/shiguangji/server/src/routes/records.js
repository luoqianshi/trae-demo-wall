// 美食记录路由模块
// 提供记录的增删改查功能，确保用户只能操作自己的记录

const express = require('express');
const db = require('../database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要登录认证
router.use(authRequired);

/**
 * 将数据库记录行的 tags 字段（JSON 字符串）解析为数组
 * 并将字段名转换为驼峰格式返回给前端
 * @param {object} row - 数据库记录行
 * @returns {object} 转换后的记录对象
 */
function formatRecord(row) {
  if (!row) return null;
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
}

/**
 * GET / - 获取当前用户的所有记录
 * 支持查询参数: keyword, tag, mealType
 * 返回: { success, data: [records] }
 */
router.get('/', (req, res) => {
  try {
    const { keyword, tag, mealType } = req.query;
    const userId = req.user.userId;

    // 动态构建查询条件
    let sql = 'SELECT * FROM records WHERE user_id = ?';
    const params = [userId];

    // 关键词搜索（菜名或备注）
    if (keyword) {
      sql += ' AND (dish_name LIKE ? OR notes LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 餐次筛选
    if (mealType) {
      sql += ' AND meal_type = ?';
      params.push(mealType);
    }

    // 标签筛选（tags 字段为 JSON 字符串，使用 LIKE 匹配）
    if (tag) {
      sql += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    // 按日期降序排列
    sql += ' ORDER BY date DESC, created_at DESC';

    const rows = db.prepare(sql).all(...params);
    const records = rows.map(formatRecord);

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
 * GET /:id - 获取单条记录
 * 返回: { success, data: record }
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 确保用户只能查询自己的记录
    const row = db.prepare('SELECT * FROM records WHERE id = ? AND user_id = ?').get(id, userId);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或无权访问'
      });
    }

    res.json({
      success: true,
      data: formatRecord(row)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST / - 创建记录
 * body: { dishName, imagePath, emoji, date, mealType, tags, difficulty, cookTime, calories, notes, rating }
 * 返回: { success, data: record }
 */
router.post('/', (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      dishName,
      imagePath,
      emoji,
      date,
      mealType,
      tags,
      difficulty,
      cookTime,
      calories,
      notes,
      rating
    } = req.body;

    // 校验必填字段
    if (!dishName || !date) {
      return res.status(400).json({
        success: false,
        message: '菜品名称和日期不能为空'
      });
    }

    // 将 tags 数组转为 JSON 字符串存储
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    const result = db.prepare(`
      INSERT INTO records (
        user_id, dish_name, image_path, emoji, date, meal_type,
        tags, difficulty, cook_time, calories, notes, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      dishName,
      imagePath || null,
      emoji || '🍽️',
      date,
      mealType || 'dinner',
      tagsJson,
      difficulty || 'easy',
      Number(cookTime) || 0,
      Number(calories) || 0,
      notes || '',
      Number(rating) || 0
    );

    // 查询并返回新创建的记录
    const newRow = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: formatRecord(newRow)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /:id - 更新记录
 * 返回: { success, data: record }
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 确保记录存在且属于当前用户
    const existing = db.prepare('SELECT * FROM records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或无权访问'
      });
    }

    const {
      dishName,
      imagePath,
      emoji,
      date,
      mealType,
      tags,
      difficulty,
      cookTime,
      calories,
      notes,
      rating
    } = req.body;

    // 将 tags 数组转为 JSON 字符串存储
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : existing.tags;

    db.prepare(`
      UPDATE records SET
        dish_name = ?,
        image_path = ?,
        emoji = ?,
        date = ?,
        meal_type = ?,
        tags = ?,
        difficulty = ?,
        cook_time = ?,
        calories = ?,
        notes = ?,
        rating = ?
      WHERE id = ? AND user_id = ?
    `).run(
      dishName !== undefined ? dishName : existing.dish_name,
      imagePath !== undefined ? imagePath : existing.image_path,
      emoji !== undefined ? emoji : existing.emoji,
      date !== undefined ? date : existing.date,
      mealType !== undefined ? mealType : existing.meal_type,
      tagsJson,
      difficulty !== undefined ? difficulty : existing.difficulty,
      cookTime !== undefined ? Number(cookTime) : existing.cook_time,
      calories !== undefined ? Number(calories) : existing.calories,
      notes !== undefined ? notes : existing.notes,
      rating !== undefined ? Number(rating) : existing.rating,
      id,
      userId
    );

    // 查询并返回更新后的记录
    const updatedRow = db.prepare('SELECT * FROM records WHERE id = ?').get(id);

    res.json({
      success: true,
      data: formatRecord(updatedRow)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /:id - 删除记录
 * 返回: { success, message }
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 确保记录存在且属于当前用户
    const existing = db.prepare('SELECT * FROM records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或无权访问'
      });
    }

    db.prepare('DELETE FROM records WHERE id = ? AND user_id = ?').run(id, userId);

    res.json({
      success: true,
      message: '记录已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
