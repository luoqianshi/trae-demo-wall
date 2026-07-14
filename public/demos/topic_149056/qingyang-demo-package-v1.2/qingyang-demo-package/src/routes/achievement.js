const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

/**
 * GET /api/v1/achievements/score
 * 获取当前积分
 */
router.get('/score', (req, res) => {
  try {
    const userId = req.user.id;

    // 计算总积分
    const totalResult = db.prepare(
      'SELECT COALESCE(SUM(points), 0) as total_score FROM point_records WHERE user_id = ?'
    ).get(userId);

    // 获取积分明细（最近20条）
    const recentRecords = db.prepare(
      'SELECT * FROM point_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);

    // 按事件类型统计
    const typeStats = db.prepare(`
      SELECT event_type, SUM(points) as total, COUNT(*) as count
      FROM point_records WHERE user_id = ?
      GROUP BY event_type ORDER BY total DESC
    `).all(userId);

    // 事件类型中文映射
    const eventTypeMap = {
      register: '注册奖励',
      confirm_plan: '确认方案',
      daily_feedback: '每日反馈',
      post: '发布帖子',
      comment: '发表评论',
      weekly_complete: '周度完成奖励'
    };

    res.json({
      code: 0,
      message: 'ok',
      data: {
        total_score: totalResult.total_score,
        recent_records: recentRecords,
        type_stats: typeStats.map(ts => ({
          event_type: ts.event_type,
          event_name: eventTypeMap[ts.event_type] || ts.event_type,
          total: ts.total,
          count: ts.count
        }))
      }
    });
  } catch (err) {
    console.error('[Achievement] 获取积分失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/achievements/leaderboard
 * 积分排行榜
 */
router.get('/leaderboard', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userId = req.user.id;
    const limitVal = Math.min(parseInt(limit), 100);

    // 获取排行榜
    const leaderboard = db.prepare(`
      SELECT u.id, u.login_name, u.phone, cp.nickname as community_nickname,
             SUM(pr.points) as total_score
      FROM point_records pr
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN community_profiles cp ON cp.user_id = u.id
      GROUP BY pr.user_id
      ORDER BY total_score DESC
      LIMIT ?
    `).all(limitVal);

    // 获取当前用户排名
    const userRank = db.prepare(`
      SELECT ranking FROM (
        SELECT pr.user_id, SUM(pr.points) as total_score,
               ROW_NUMBER() OVER (ORDER BY SUM(pr.points) DESC) as ranking
        FROM point_records pr
        GROUP BY pr.user_id
      ) ranked WHERE user_id = ?
    `).get(userId);

    // 隐藏手机号和登录名的部分信息
    const maskedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      user_id: item.id,
      nickname: item.community_nickname || (item.login_name ? `${item.login_name.slice(0, 2)}***` : `用户${index + 1}`),
      total_score: item.total_score,
      is_self: item.id === userId
    }));

    res.json({
      code: 0,
      message: 'ok',
      data: {
        my_rank: userRank ? userRank.ranking : null,
        leaderboard: maskedLeaderboard
      }
    });
  } catch (err) {
    console.error('[Achievement] 获取排行榜失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
