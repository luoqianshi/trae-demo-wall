import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取公开任务列表（无需登录）
router.get('/', (req, res: Response): void => {
  try {
    const { page = 1, pageSize = 20, category, difficulty, keyword, grade_level, sortBy } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const params: any[] = [];

    let whereClause = "WHERE t.status = 'published'";

    if (category) {
      whereClause += ' AND t.category = ?';
      params.push(category);
    }
    if (difficulty) {
      whereClause += ' AND t.difficulty = ?';
      params.push(difficulty);
    }
    if (grade_level) {
      whereClause += ' AND t.grade_level = ?';
      params.push(grade_level);
    }
    if (keyword) {
      whereClause += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 动态排序
    let orderClause = 'ORDER BY t.created_at DESC';
    const sort = sortBy as string;
    if (sort === 'created_at_asc') orderClause = 'ORDER BY t.created_at ASC';
    else if (sort === 'submissions_desc') orderClause = 'ORDER BY submission_count DESC, t.created_at DESC';
    else if (sort === 'submissions_asc') orderClause = 'ORDER BY submission_count ASC, t.created_at DESC';

    const tasks = db.prepare(
      `SELECT t.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM submissions WHERE task_id = t.id) as submission_count,
        (SELECT COUNT(*) FROM favorites WHERE task_id = t.id) as favorite_count
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`
    ).all(...params, Number(pageSize), offset);

    const total = db.prepare(
      `SELECT COUNT(*) as cnt FROM tasks t ${whereClause}`
    ).get(...params) as { cnt: number };

    res.json({
      code: 0,
      data: {
        list: tasks,
        total: total.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取任务列表失败: ' + err.message });
  }
});

// 获取任务详情（无需登录）
router.get('/:id', (req, res: Response): void => {
  try {
    const task = db.prepare(
      `SELECT t.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM submissions WHERE task_id = t.id) as submission_count,
        (SELECT COUNT(*) FROM favorites WHERE task_id = t.id) as favorite_count
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ?`
    ).get(req.params.id) as any;

    if (!task) {
      res.status(404).json({ code: 404, message: '任务不存在' });
      return;
    }

    // 解析steps_json为结构化数组
    if (task.steps_json) {
      try {
        task.steps = JSON.parse(task.steps_json);
      } catch {
        task.steps = [];
      }
    } else {
      task.steps = [];
    }

    // 视频字段映射便于前端使用
    task.ai_video = task.ai_video_url || '';
    task.external_video = task.external_video_url || '';

    res.json({ code: 0, data: task });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取任务详情失败: ' + err.message });
  }
});

// 创建任务
router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { title, description, category, difficulty, requirements, reference_materials, cover_image, grade_level, estimated_time } = req.body;

    if (!title) {
      res.status(400).json({ code: 400, message: '标题为必填项' });
      return;
    }

    const result = db.prepare(
      `INSERT INTO tasks (title, description, category, difficulty, requirements, reference_materials, cover_image, grade_level, estimated_time, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, description || '', category || 'other', difficulty || 'beginner', requirements || '', reference_materials || '', cover_image || '', grade_level || '', estimated_time || '', req.userId!);

    res.json({
      code: 0,
      data: { id: result.lastInsertRowid },
      message: '任务创建成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '创建失败: ' + err.message });
  }
});

// 更新任务
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { title, description, category, difficulty, requirements, reference_materials, cover_image, grade_level, estimated_time, status } = req.body;

    db.prepare(
      `UPDATE tasks SET
       title = COALESCE(?, title), description = COALESCE(?, description),
       category = COALESCE(?, category), difficulty = COALESCE(?, difficulty),
       requirements = COALESCE(?, requirements), reference_materials = COALESCE(?, reference_materials),
       cover_image = COALESCE(?, cover_image), grade_level = COALESCE(?, grade_level),
       estimated_time = COALESCE(?, estimated_time), status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(title, description, category, difficulty, requirements, reference_materials, cover_image, grade_level, estimated_time, status, req.params.id);

    res.json({ code: 0, message: '任务更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '更新失败: ' + err.message });
  }
});

// 获取我的任务列表（创建者）
router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const tasks = db.prepare(
      `SELECT * FROM tasks WHERE created_by = ? ORDER BY created_at DESC`
    ).all(req.userId!);

    res.json({ code: 0, data: tasks });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取失败: ' + err.message });
  }
});

// 热门推荐任务（按提交数排序，取前8个）
router.get('/hot/recommended', (_req, res: Response): void => {
  try {
    const hotTasks = db.prepare(
      `SELECT t.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM submissions WHERE task_id = t.id) as submission_count,
        (SELECT COUNT(*) FROM favorites WHERE task_id = t.id) as favorite_count
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.status = 'published'
       ORDER BY submission_count DESC, t.created_at DESC
       LIMIT 8`
    ).all();

    res.json({ code: 0, data: hotTasks });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取推荐失败: ' + err.message });
  }
});

export default router;