// 成就控制器
const { pool } = require('../config/database');

/**
 * 获取用户成就列表（含进度）
 * GET /api/achievements?user_id=1
 */
async function getUserAchievements(req, res) {
  try {
    const userId = req.query.user_id || 1;

    // 1. 获取所有启用的成就
    const [achievements] = await pool.query(
      'SELECT id, code, name, description, icon, condition_type, condition_value, sort_order FROM achievements WHERE is_active = 1 ORDER BY sort_order'
    );

    // 2. 获取用户成就进度
    const [userAch] = await pool.query(
      'SELECT id, achievement_id, status, progress, unlocked_at FROM user_achievements WHERE user_id = ?',
      [userId]
    );

    // 3. 计算实际进度（实时统计）
    const [chatStats] = await pool.query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND sender = "user"',
      [userId]
    );
    const [artStats] = await pool.query(
      'SELECT COUNT(*) as count FROM artworks WHERE user_id = ?',
      [userId]
    );
    const [moodStats] = await pool.query(
      `SELECT COUNT(DISTINCT record_date) as streak
       FROM mood_records
       WHERE user_id = ?
         AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    const actualProgress = {
      chat_count: chatStats[0].count,
      art_count: artStats[0].count,
      mood_streak: moodStats[0].streak
    };

    // 4. 组装结果并同步进度到数据库
    const result = [];
    for (const ach of achievements) {
      const currentProgress = actualProgress[ach.condition_type] || 0;
      let status = 'locked';
      if (currentProgress >= ach.condition_value) {
        status = 'unlocked';
      } else if (currentProgress > 0) {
        status = 'in_progress';
      }

      // 查找是否已有记录
      const existing = userAch.find(u => u.achievement_id === ach.id);
      const unlockedAt = existing ? existing.unlocked_at : null;

      // 同步更新到数据库
      if (existing) {
        const newStatus = status === 'unlocked' && existing.status !== 'unlocked' ? 'unlocked' : status;
        const newUnlockedAt = status === 'unlocked' ? (existing.unlocked_at || new Date()) : null;
        try {
          await pool.query(
            'UPDATE user_achievements SET status = ?, progress = ?, unlocked_at = ? WHERE id = ?',
            [newStatus, currentProgress, newUnlockedAt, existing.id]
          );
        } catch (e) {
          console.error('更新成就进度失败:', e.message);
        }
      } else {
        // 首次创建记录
        try {
          await pool.query(
            'INSERT INTO user_achievements (user_id, achievement_id, status, progress, unlocked_at) VALUES (?, ?, ?, ?, ?)',
            [userId, ach.id, status, currentProgress, status === 'unlocked' ? new Date() : null]
          );
        } catch (e) {
          // 已存在则忽略
        }
      }

      result.push({
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        condition_type: ach.condition_type,
        condition_value: ach.condition_value,
        current_progress: currentProgress,
        status: status,
        unlocked_at: unlockedAt,
        progress_percent: Math.min(100, Math.round((currentProgress / ach.condition_value) * 100))
      });
    }

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    console.error('获取用户成就失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

module.exports = { getUserAchievements };
