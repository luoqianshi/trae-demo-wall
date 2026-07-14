import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取项目评分统计（公开）
router.get('/task/:taskId', (req, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);
    const avgScore = db.prepare(
      'SELECT ROUND(AVG(score), 1) as avg, COUNT(*) as count FROM ratings WHERE task_id = ?'
    ).get(taskId) as { avg: number; count: number };

    res.json({ code: 0, data: { avg: avgScore.avg || 0, count: avgScore.count } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 获取当前用户对某任务的评分（需登录）
router.get('/task/:taskId/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);
    const row = db.prepare('SELECT score FROM ratings WHERE user_id = ? AND task_id = ?')
      .get(req.userId!, taskId) as { score: number } | undefined;
    res.json({ code: 0, data: { score: row?.score || 0 } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 评分（需登录）
router.post('/task/:taskId', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const taskId = Number(req.params.taskId);
    const { score } = req.body;
    if (!score || score < 1 || score > 5) {
      res.status(400).json({ code: 400, message: '评分需在1-5之间' });
      return;
    }

    db.prepare(
      'INSERT OR REPLACE INTO ratings (user_id, task_id, score) VALUES (?, ?, ?)'
    ).run(req.userId!, taskId, score);

    res.json({ code: 0, message: '评分成功' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;