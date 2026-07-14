import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 所有收藏接口都需要登录
router.use(authMiddleware);

// 获取我的收藏列表
router.get('/', (req: AuthRequest, res: Response): void => {
  try {
    const favorites = db.prepare(
      `SELECT f.id as fav_id, f.created_at as fav_time,
              t.*, u.real_name as creator_name,
              (SELECT COUNT(*) FROM submissions WHERE task_id = t.id) as submission_count
       FROM favorites f
       JOIN tasks t ON f.task_id = t.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`
    ).all(req.userId!);

    res.json({ code: 0, data: favorites });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取收藏失败: ' + err.message });
  }
});

// 添加收藏
router.post('/:taskId', (req: AuthRequest, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);

    // 检查任务是否存在
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      res.status(404).json({ code: 404, message: '任务不存在' });
      return;
    }

    // 检查是否已收藏
    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND task_id = ?')
      .get(req.userId!, taskId);
    if (existing) {
      res.json({ code: 0, message: '已收藏', data: { favorited: true } });
      return;
    }

    db.prepare('INSERT INTO favorites (user_id, task_id) VALUES (?, ?)')
      .run(req.userId!, taskId);

    res.json({ code: 0, message: '收藏成功', data: { favorited: true } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '收藏失败: ' + err.message });
  }
});

// 取消收藏
router.delete('/:taskId', (req: AuthRequest, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND task_id = ?')
      .run(req.userId!, taskId);

    res.json({ code: 0, message: '已取消收藏', data: { favorited: false } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '取消收藏失败: ' + err.message });
  }
});

// 批量查询收藏状态（用于列表页展示收藏图标）
router.post('/check', (req: AuthRequest, res: Response): void => {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      res.json({ code: 0, data: {} });
      return;
    }

    const rows = db.prepare(
      `SELECT task_id FROM favorites WHERE user_id = ? AND task_id IN (${taskIds.map(() => '?').join(',')})`
    ).all(req.userId!, ...taskIds) as any[];

    const favMap: Record<number, boolean> = {};
    rows.forEach(r => { favMap[r.task_id] = true; });

    res.json({ code: 0, data: favMap });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '查询失败: ' + err.message });
  }
});

export default router;