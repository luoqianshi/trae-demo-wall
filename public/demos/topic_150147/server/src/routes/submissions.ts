import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 提交作品
router.post('/tasks/:taskId/submit', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { content, fileUrls } = req.body;
    const taskId = req.params.taskId;
    const userId = req.userId!;

    // 检查任务是否存在
    const task = db.prepare('SELECT id, status FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      res.status(404).json({ code: 404, message: '任务不存在' });
      return;
    }

    // 检查是否已提交
    const existing = db.prepare(
      'SELECT id FROM submissions WHERE task_id = ? AND user_id = ?'
    ).get(taskId, userId) as any;

    if (existing) {
      db.prepare(
        `UPDATE submissions SET content = ?, file_urls = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(content || '', JSON.stringify(fileUrls || []), existing.id);
      res.json({ code: 0, data: { id: existing.id }, message: '提交更新成功' });
    } else {
      const result = db.prepare(
        `INSERT INTO submissions (task_id, user_id, content, file_urls, status)
         VALUES (?, ?, ?, ?, 'submitted')`
      ).run(taskId, userId, content || '', JSON.stringify(fileUrls || []));
      res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '提交成功' });
    }
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '提交失败: ' + err.message });
  }
});

// 获取任务的提交列表
router.get('/tasks/:taskId/submissions', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const submissions = db.prepare(
      `SELECT s.*, u.real_name as student_name, u.username as student_username
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.task_id = ?
       ORDER BY s.submitted_at DESC`
    ).all(req.params.taskId);

    const parsed = submissions.map((s: any) => ({
      ...s,
      file_urls: JSON.parse(s.file_urls || '[]'),
    }));

    res.json({ code: 0, data: parsed });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取提交列表失败: ' + err.message });
  }
});

// 获取我的提交记录
router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { page = 1, pageSize = 15 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const submissions = db.prepare(
      `SELECT s.*, t.title as task_title, t.category, t.difficulty
       FROM submissions s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.user_id = ?
       ORDER BY s.submitted_at DESC
       LIMIT ? OFFSET ?`
    ).all(req.userId!, Number(pageSize), offset);

    const total = (db.prepare(
      'SELECT COUNT(*) as cnt FROM submissions WHERE user_id = ?'
    ).get(req.userId!) as any).cnt;

    const parsed = submissions.map((s: any) => ({
      ...s,
      file_urls: JSON.parse(s.file_urls || '[]'),
    }));

    res.json({
      code: 0,
      data: {
        list: parsed,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取提交记录失败: ' + err.message });
  }
});

// 评分
router.post('/:id/evaluate', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { score, feedback } = req.body;
    db.prepare(
      `UPDATE submissions SET score = ?, feedback = ?, status = 'evaluated', evaluator_id = ?, evaluated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(score, feedback || '', req.userId!, req.params.id);

    res.json({ code: 0, message: '评分成功' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '评分失败: ' + err.message });
  }
});

// 获取未评分提交数
router.get('/pending-count', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const count = db.prepare(
      "SELECT COUNT(*) as cnt FROM submissions WHERE status = 'submitted'"
    ).get() as { cnt: number };

    res.json({ code: 0, data: { count: count.cnt } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取待评分数量失败: ' + err.message });
  }
});

export default router;