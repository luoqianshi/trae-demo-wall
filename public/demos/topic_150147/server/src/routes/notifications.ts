import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取我的通知
router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, unreadOnly } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [req.userId];
    if (unreadOnly === '1') {
      whereClause += ' AND is_read = 0';
    }

    const notifications = db.prepare(
      `SELECT * FROM notifications ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, Number(pageSize), offset);

    const total = (db.prepare(
      `SELECT COUNT(*) as cnt FROM notifications ${whereClause}`
    ).get(...params) as any).cnt;

    const unreadCount = (db.prepare(
      'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.userId) as any).cnt;

    res.json({
      code: 0,
      data: {
        list: notifications,
        total,
        unreadCount,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取通知失败' });
  }
});

// 标记通知为已读
router.put('/:id/read', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ code: 0, message: '已标记为已读' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

// 全部标记为已读
router.put('/read-all', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.userId);
    res.json({ code: 0, message: '全部已读' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

// 获取未读通知数量
router.get('/unread-count', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const count = (db.prepare(
      'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.userId) as any).cnt;
    res.json({ code: 0, data: { count } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

// 工具函数：创建通知（供其他路由调用）
export function createNotification(userId: number, title: string, content: string, type: string = 'system', relatedType: string = '', relatedId: number = 0): void {
  try {
    db.prepare(
      `INSERT INTO notifications (user_id, title, content, type, related_type, related_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, title, content, type, relatedType, relatedId);
  } catch { /* 静默失败，不影响主流程 */ }
}

export default router;