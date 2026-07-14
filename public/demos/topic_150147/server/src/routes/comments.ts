import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取项目评论列表（公开）
router.get('/task/:taskId', (req, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const comments = db.prepare(
      `SELECT c.*, u.real_name, u.username, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(taskId, Number(pageSize), offset);

    const total = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE task_id = ?')
      .get(taskId) as { cnt: number };

    res.json({
      code: 0,
      data: {
        list: comments,
        total: total.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 添加评论（需登录）
router.post('/task/:taskId', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ code: 400, message: '评论内容不能为空' });
      return;
    }

    const result = db.prepare('INSERT INTO comments (user_id, task_id, content) VALUES (?, ?, ?)')
      .run(req.userId!, taskId, content.trim());

    // 返回新创建的评论
    const comment = db.prepare(
      `SELECT c.*, u.real_name, u.username, u.avatar
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    ).get(result.lastInsertRowid);

    res.json({ code: 0, message: '评论成功', data: comment });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 删除评论（仅作者或管理员）
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id) as any;
    if (!comment) {
      res.status(404).json({ code: 404, message: '评论不存在' });
      return;
    }
    if (comment.user_id !== req.userId && req.userRole !== 'platform_admin') {
      res.status(403).json({ code: 403, message: '无权限' });
      return;
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ code: 0, message: '删除成功' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;