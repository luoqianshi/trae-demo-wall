// 用户控制器
const { pool } = require('../config/database');

// Demo默认用户ID（Demo阶段免密登录，使用默认用户）
const DEFAULT_USER_ID = 1;

/**
 * 用户登录（Demo阶段：免密登录，直接返回默认用户）
 * POST /api/user/login
 */
async function login(req, res) {
  try {
    const { username = 'demo' } = req.body;
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar FROM users WHERE username = ?',
      [username]
    );

    if (rows.length > 0) {
      // 更新最后登录时间
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [rows[0].id]);
      res.json({ code: 0, message: '登录成功', data: rows[0] });
    } else {
      // 创建新用户
      const [result] = await pool.query(
        'INSERT INTO users (username, nickname, avatar) VALUES (?, ?, ?)',
        [username, username, '&#127795;']
      );
      res.json({
        code: 0,
        message: '注册并登录成功',
        data: { id: result.insertId, username, nickname: username, avatar: '&#127795;' }
      });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

/**
 * 获取当前用户信息
 * GET /api/user/info
 */
async function getUserInfo(req, res) {
  try {
    const userId = req.query.user_id || DEFAULT_USER_ID;
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({ code: 0, message: 'success', data: rows[0] });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

module.exports = { login, getUserInfo, DEFAULT_USER_ID };
