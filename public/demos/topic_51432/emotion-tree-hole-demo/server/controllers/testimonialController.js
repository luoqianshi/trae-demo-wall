// 用户见证控制器
const { pool } = require('../config/database');

/**
 * 获取用户见证列表
 * GET /api/testimonials
 */
async function getTestimonials(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_name, user_role, avatar_emoji, content, rating, usage_duration FROM testimonials WHERE is_active = 1 ORDER BY sort_order'
    );

    res.json({ code: 0, message: 'success', data: rows });
  } catch (error) {
    console.error('获取用户见证失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

module.exports = { getTestimonials };
