// 情绪记录控制器
const { pool } = require('../config/database');

// 情绪类型映射
const MOOD_TYPE_MAP = {
  happy: { name: '开心', score: 90, color: '#FFB400' },
  calm: { name: '平静', score: 70, color: '#4ECDC4' },
  anxious: { name: '焦虑', score: 40, color: '#FF8B5C' },
  sad: { name: '难过', score: 25, color: '#5B9BD5' },
  angry: { name: '愤怒', score: 20, color: '#FF6B6B' },
  tired: { name: '疲惫', score: 35, color: '#A78BFA' }
};

/**
 * 记录情绪
 * POST /api/mood/record
 * body: { user_id, mood_type, note }
 */
async function recordMood(req, res) {
  try {
    const { user_id, mood_type, note = '' } = req.body;

    if (!mood_type || !MOOD_TYPE_MAP[mood_type]) {
      return res.status(400).json({ code: 400, message: '无效的情绪类型' });
    }

    const userId = user_id || 1;
    const moodInfo = MOOD_TYPE_MAP[mood_type];
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已经记录过
    const [existing] = await pool.query(
      'SELECT id FROM mood_records WHERE user_id = ? AND record_date = ?',
      [userId, today]
    );

    if (existing.length > 0) {
      // 更新今天的记录
      await pool.query(
        'UPDATE mood_records SET mood_type = ?, mood_score = ?, note = ? WHERE id = ?',
        [mood_type, moodInfo.score, note, existing[0].id]
      );
    } else {
      // 插入新记录
      await pool.query(
        'INSERT INTO mood_records (user_id, mood_type, mood_score, note, record_date) VALUES (?, ?, ?, ?, ?)',
        [userId, mood_type, moodInfo.score, note, today]
      );
    }

    res.json({
      code: 0,
      message: '情绪记录成功',
      data: { mood_type, mood_score: moodInfo.score, mood_name: moodInfo.name }
    });
  } catch (error) {
    console.error('记录情绪失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

/**
 * 获取情绪趋势（最近N天）
 * GET /api/mood/trend?user_id=1&days=7
 */
async function getMoodTrend(req, res) {
  try {
    const userId = req.query.user_id || 1;
    const days = parseInt(req.query.days) || 7;

    const [rows] = await pool.query(
      `SELECT record_date, mood_type, mood_score, note
       FROM mood_records
       WHERE user_id = ?
         AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY record_date ASC`,
      [userId, days]
    );

    // 补全缺失的日期（用null填充）
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = rows.find(r => {
        const recordDate = r.record_date instanceof Date ? r.record_date.toISOString().split('T')[0] : String(r.record_date);
        return recordDate === dateStr;
      });
      result.push({
        date: dateStr,
        mood_type: record ? record.mood_type : null,
        mood_score: record ? record.mood_score : null,
        mood_name: record && MOOD_TYPE_MAP[record.mood_type] ? MOOD_TYPE_MAP[record.mood_type].name : null,
        note: record ? record.note : null
      });
    }

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    console.error('获取情绪趋势失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

/**
 * 获取情绪统计（情绪分布）
 * GET /api/mood/stats?user_id=1
 */
async function getMoodStats(req, res) {
  try {
    const userId = req.query.user_id || 1;
    const [rows] = await pool.query(
      `SELECT mood_type, COUNT(*) as count, AVG(mood_score) as avg_score
       FROM mood_records
       WHERE user_id = ?
       GROUP BY mood_type`,
      [userId]
    );

    // 合并情绪名称
    const result = rows.map(r => ({
      mood_type: r.mood_type,
      mood_name: MOOD_TYPE_MAP[r.mood_type] ? MOOD_TYPE_MAP[r.mood_type].name : r.mood_type,
      count: r.count,
      avg_score: Math.round(r.avg_score)
    }));

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    console.error('获取情绪统计失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

module.exports = { recordMood, getMoodTrend, getMoodStats, MOOD_TYPE_MAP };
