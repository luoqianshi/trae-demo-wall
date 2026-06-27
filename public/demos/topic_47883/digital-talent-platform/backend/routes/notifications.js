/**
 * 通知路由
 * 项目发布通知、讲座预告、评审安排、交付提醒、团队/面试通知
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const NOTIFY_TYPES = {
  PROJECT: 'project',       // 项目发布通知
  LECTURE: 'lecture',       // 讲座/培训预告
  REVIEW: 'review',         // 评审安排
  DEADLINE: 'deadline',     // 交付截止提醒
  TEAM: 'team',             // 团队组建通知
  INTERVIEW: 'interview',   // 面试通知
  SYSTEM: 'system'          // 系统公告
};

/** GET /api/notifications - 通知列表 */
router.get('/', authenticate, (req, res) => {
  try {
    const { type, isRead, page = 1, limit = 10 } = req.query;
    let list = db.find('notifications', { userId: req.user.userId });

    if (type) list = list.filter(n => n.type === type);
    if (isRead !== undefined) list = list.filter(n => n.isRead === (isRead === 'true'));
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const unreadCount = list.filter(n => !n.isRead).length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        list: paginated,
        unreadCount,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/notifications/unread-count - 未读数量 */
router.get('/unread-count', authenticate, (req, res) => {
  const list = db.find('notifications', { userId: req.user.userId });
  res.json({ success: true, data: { unreadCount: list.filter(n => !n.isRead).length } });
});

/** POST /api/notifications/:id/read - 标记已读 */
router.post('/:id/read', authenticate, (req, res) => {
  const n = db.findById('notifications', req.params.id);
  if (!n || n.userId !== req.user.userId) return res.status(404).json({ success: false, message: '通知不存在' });
  db.update('notifications', req.params.id, { isRead: true, readAt: new Date().toISOString() });
  res.json({ success: true, message: '已标记为已读' });
});

/** POST /api/notifications/read-all - 全部已读 */
router.post('/read-all', authenticate, (req, res) => {
  const list = db.find('notifications', { userId: req.user.userId, isRead: false });
  list.forEach(n => db.update('notifications', n.id, { isRead: true, readAt: new Date().toISOString() }));
  res.json({ success: true, message: `已标记 ${list.length} 条通知为已读` });
});

/** DELETE /api/notifications/:id - 删除通知 */
router.delete('/:id', authenticate, (req, res) => {
  const n = db.findById('notifications', req.params.id);
  if (!n || n.userId !== req.user.userId) return res.status(404).json({ success: false, message: '通知不存在' });
  db.remove('notifications', req.params.id);
  res.json({ success: true, message: '删除成功' });
});

// ===== 内部工具函数：发送通知 =====

/**
 * 发送通知给指定用户
 * @param {string} userId 目标用户ID
 * @param {string} type 通知类型
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {Object} extra 额外数据
 */
function sendNotification(userId, type, title, content, extra = {}) {
  if (!Object.values(NOTIFY_TYPES).includes(type)) return null;
  return db.insert('notifications', {
    userId, type, title, content,
    isRead: false, extra: extra || {},
    readAt: null
  });
}

/**
 * 广播通知给多个用户
 * @param {Array} userIds 用户ID数组
 * @param {string} type 通知类型
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {Object} extra 额外数据
 */
function broadcastNotification(userIds, type, title, content, extra = {}) {
  return userIds.map(uid => sendNotification(uid, type, title, content, extra));
}

/**
 * 按角色广播通知
 * @param {string} role 目标角色
 * @param {string} type 通知类型
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {Object} extra 额外数据
 */
function broadcastByRole(role, type, title, content, extra = {}) {
  const users = db.find('users', { role, status: 'active' });
  return broadcastNotification(users.map(u => u.id), type, title, content, extra);
}

module.exports = router;
module.exports.sendNotification = sendNotification;
module.exports.broadcastNotification = broadcastNotification;
module.exports.broadcastByRole = broadcastByRole;
module.exports.NOTIFY_TYPES = NOTIFY_TYPES;
