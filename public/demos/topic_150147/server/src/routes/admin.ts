import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 所有管理接口需要管理员或教师权限
router.use(authMiddleware);
router.use(roleMiddleware('platform_admin', 'teacher'));

// ========== 仪表盘统计 ==========
router.get('/dashboard', (_req: AuthRequest, res: Response): void => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
    const taskCount = (db.prepare('SELECT COUNT(*) as cnt FROM tasks').get() as any).cnt;
    const submissionCount = (db.prepare('SELECT COUNT(*) as cnt FROM submissions').get() as any).cnt;
    const pendingCount = (db.prepare("SELECT COUNT(*) as cnt FROM submissions WHERE status = 'submitted'").get() as any).cnt;
    const activeUserCount = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE status = 'active'").get() as any).cnt;

    res.json({
      code: 0,
      data: {
        userCount,
        activeUserCount,
        taskCount,
        submissionCount,
        pendingCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取统计数据失败: ' + err.message });
  }
});

// ========== 用户管理 ==========

// 获取用户列表
router.get('/users', (req: AuthRequest, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, keyword, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const params: any[] = [];

    let whereClause = 'WHERE 1=1';
    if (keyword) {
      whereClause += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (role) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }
    if (status) {
      whereClause += ' AND u.status = ?';
      params.push(status);
    }

    const users = db.prepare(
      `SELECT u.*, i.name as institution_name
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, Number(pageSize), offset);

    const total = (db.prepare(
      `SELECT COUNT(*) as cnt FROM users u ${whereClause}`
    ).get(...params) as any).cnt;

    res.json({
      code: 0,
      data: { list: users, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取用户列表失败: ' + err.message });
  }
});

// 编辑用户
router.put('/users/:id', (req: AuthRequest, res: Response): void => {
  try {
    const { role, status, realName, phone, email } = req.body;
    const userId = req.params.id;

    db.prepare(
      `UPDATE users SET
       role = COALESCE(?, role),
       status = COALESCE(?, status),
       real_name = COALESCE(?, real_name),
       phone = COALESCE(?, phone),
       email = COALESCE(?, email),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(role || null, status || null, realName || null, phone || null, email || null, userId);

    res.json({ code: 0, message: '用户信息已更新' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '更新用户失败: ' + err.message });
  }
});

// ========== 任务管理 ==========

// 获取任务列表（含草稿和已归档）
router.get('/tasks', (req: AuthRequest, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, status, category, keyword } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const params: any[] = [];

    let whereClause = 'WHERE 1=1';
    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }
    if (category) {
      whereClause += ' AND t.category = ?';
      params.push(category);
    }
    if (keyword) {
      whereClause += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const tasks = db.prepare(
      `SELECT t.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM submissions WHERE task_id = t.id) as submission_count
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, Number(pageSize), offset);

    const total = (db.prepare(
      `SELECT COUNT(*) as cnt FROM tasks t ${whereClause}`
    ).get(...params) as any).cnt;

    res.json({
      code: 0,
      data: { list: tasks, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取任务列表失败: ' + err.message });
  }
});

// 编辑任务
router.put('/tasks/:id', (req: AuthRequest, res: Response): void => {
  try {
    const { title, description, category, difficulty, status, grade_level, estimated_time } = req.body;
    db.prepare(
      `UPDATE tasks SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       category = COALESCE(?, category),
       difficulty = COALESCE(?, difficulty),
       status = COALESCE(?, status),
       grade_level = COALESCE(?, grade_level),
       estimated_time = COALESCE(?, estimated_time),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(title || null, description || null, category || null, difficulty || null, status || null, grade_level || null, estimated_time || null, req.params.id);

    res.json({ code: 0, message: '任务已更新' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '更新任务失败: ' + err.message });
  }
});

// 删除任务
router.delete('/tasks/:id', (req: AuthRequest, res: Response): void => {
  try {
    // 先删除关联的提交和进度
    db.prepare('DELETE FROM submissions WHERE task_id = ?').run(req.params.id);
    db.prepare('DELETE FROM task_progress WHERE task_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ code: 0, message: '任务已删除' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '删除任务失败: ' + err.message });
  }
});

// ========== 提交管理 ==========

// 获取提交列表
router.get('/submissions', (req: AuthRequest, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, status, taskId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const params: any[] = [];

    let whereClause = 'WHERE 1=1';
    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }
    if (taskId) {
      whereClause += ' AND s.task_id = ?';
      params.push(taskId);
    }

    const submissions = db.prepare(
      `SELECT s.*, t.title as task_title, u.real_name as student_name, u.username as student_username
       FROM submissions s
       JOIN tasks t ON s.task_id = t.id
       JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.submitted_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, Number(pageSize), offset);

    const total = (db.prepare(
      `SELECT COUNT(*) as cnt FROM submissions s ${whereClause}`
    ).get(...params) as any).cnt;

    const parsed = submissions.map((s: any) => ({
      ...s,
      file_urls: JSON.parse(s.file_urls || '[]'),
    }));

    res.json({
      code: 0,
      data: { list: parsed, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取提交列表失败: ' + err.message });
  }
});

// 评分
router.post('/submissions/:id/evaluate', (req: AuthRequest, res: Response): void => {
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

export default router;