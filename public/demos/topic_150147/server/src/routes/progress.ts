import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 所有进度接口都需要登录
router.use(authMiddleware);

// 开始学习任务 - 记录首次学习
router.post('/start', (req: AuthRequest, res: Response): void => {
  try {
    const { taskId, totalSteps } = req.body;
    const userId = req.userId!;

    if (!taskId) {
      res.status(400).json({ code: 400, message: 'taskId 为必填项' });
      return;
    }

    // 检查任务是否存在
    const task = db.prepare('SELECT id, steps_json FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      res.status(404).json({ code: 404, message: '任务不存在' });
      return;
    }

    // 计算总步骤数
    let stepsCount = totalSteps || 0;
    if (!stepsCount && task.steps_json) {
      try {
        const steps = JSON.parse(task.steps_json);
        stepsCount = Array.isArray(steps) ? steps.length : 0;
      } catch { stepsCount = 0; }
    }

    // 插入或忽略（已存在则不重复创建）
    db.prepare(
      `INSERT OR IGNORE INTO task_progress (user_id, task_id, current_step, total_steps, completed)
       VALUES (?, ?, 0, ?, 0)`
    ).run(userId, taskId, stepsCount);

    // 如果是已存在记录，更新 total_steps（以防步骤数变化）
    db.prepare(
      `UPDATE task_progress SET total_steps = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND task_id = ?`
    ).run(stepsCount, userId, taskId);

    res.json({ code: 0, message: '开始学习', data: { currentStep: 0, totalSteps: stepsCount } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '操作失败: ' + err.message });
  }
});

// 更新学习进度
router.put('/:taskId', (req: AuthRequest, res: Response): void => {
  try {
    const { currentStep } = req.body;
    const taskId = req.params.taskId;
    const userId = req.userId!;

    if (currentStep === undefined || currentStep === null) {
      res.status(400).json({ code: 400, message: 'currentStep 为必填项' });
      return;
    }

    const existing = db.prepare(
      'SELECT id, total_steps FROM task_progress WHERE user_id = ? AND task_id = ?'
    ).get(userId, taskId) as any;

    if (!existing) {
      // 首次记录，自动创建进度
      const task = db.prepare('SELECT steps_json FROM tasks WHERE id = ?').get(taskId) as any;
      let totalSteps = 0;
      if (task?.steps_json) {
        try { totalSteps = JSON.parse(task.steps_json).length; } catch { /* ignore */ }
      }
      db.prepare(
        `INSERT INTO task_progress (user_id, task_id, current_step, total_steps)
         VALUES (?, ?, ?, ?)`
      ).run(userId, taskId, currentStep, totalSteps);
    } else {
      db.prepare(
        `UPDATE task_progress SET current_step = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND task_id = ?`
      ).run(currentStep, userId, taskId);
    }

    res.json({ code: 0, message: '进度已更新', data: { currentStep } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '更新进度失败: ' + err.message });
  }
});

// 标记任务完成
router.put('/:taskId/complete', (req: AuthRequest, res: Response): void => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId!;

    const existing = db.prepare(
      'SELECT id, total_steps FROM task_progress WHERE user_id = ? AND task_id = ?'
    ).get(userId, taskId) as any;

    if (!existing) {
      const task = db.prepare('SELECT steps_json FROM tasks WHERE id = ?').get(taskId) as any;
      let totalSteps = 0;
      if (task?.steps_json) {
        try { totalSteps = JSON.parse(task.steps_json).length; } catch { /* ignore */ }
      }
      db.prepare(
        `INSERT INTO task_progress (user_id, task_id, current_step, total_steps, completed)
         VALUES (?, ?, ?, ?, 1)`
      ).run(userId, taskId, totalSteps, totalSteps);
    } else {
      db.prepare(
        `UPDATE task_progress SET completed = 1, current_step = total_steps, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND task_id = ?`
      ).run(userId, taskId);
    }

    res.json({ code: 0, message: '任务已完成' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '操作失败: ' + err.message });
  }
});

// 获取我的学习进度列表
router.get('/my', (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const progressList = db.prepare(
      `SELECT tp.*, t.title as task_title, t.category, t.cover_image
       FROM task_progress tp
       JOIN tasks t ON tp.task_id = t.id
       WHERE tp.user_id = ?
       ORDER BY tp.updated_at DESC`
    ).all(userId);

    res.json({ code: 0, data: progressList });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取进度失败: ' + err.message });
  }
});

// 获取某个任务的学习进度
router.get('/:taskId', (req: AuthRequest, res: Response): void => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId!;

    const progress = db.prepare(
      'SELECT * FROM task_progress WHERE user_id = ? AND task_id = ?'
    ).get(userId, taskId);

    if (!progress) {
      res.json({ code: 0, data: null });
      return;
    }

    res.json({ code: 0, data: progress });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取进度失败: ' + err.message });
  }
});

export default router;