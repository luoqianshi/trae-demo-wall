/**
 * 作业/成果提交路由
 * 任务接单、成果物提交、远程评审打分与反馈、迭代修改记录
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/** GET /api/assignments - 作业/成果列表 */
router.get('/', authenticate, (req, res) => {
  try {
    const { projectId, studentId, status, page = 1, limit = 10 } = req.query;
    let list = db.getTable('assignments');

    if (projectId) list = list.filter(a => a.projectId === projectId);
    if (studentId) list = list.filter(a => a.studentId === studentId);
    if (status) list = list.filter(a => a.status === status);

    // 学生只能看自己的
    if (req.user.role === 'student') {
      list = list.filter(a => a.studentId === req.user.userId);
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(a => {
      const p = db.findById('projects', a.projectId);
      const s = db.findById('users', a.studentId);
      return {
        ...a,
        project: p ? { id: p.id, title: p.title } : null,
        student: s ? { id: s.id, name: s.name } : null
      };
    });

    res.json({
      success: true,
      data: {
        list: paginated,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/assignments/:id - 作业详情 */
router.get('/:id', authenticate, (req, res) => {
  const a = db.findById('assignments', req.params.id);
  if (!a) return res.status(404).json({ success: false, message: '作业不存在' });
  if (req.user.role === 'student' && a.studentId !== req.user.userId) {
    return res.status(403).json({ success: false, message: '无权查看' });
  }

  const p = db.findById('projects', a.projectId);
  const s = db.findById('users', a.studentId);
  const iterations = db.find('assignment_iterations', { assignmentId: a.id })
    .sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt));

  res.json({
    success: true,
    data: {
      ...a,
      project: p ? { id: p.id, title: p.title } : null,
      student: s ? { id: s.id, name: s.name } : null,
      iterations
    }
  });
});

/** POST /api/assignments - 提交成果 */
router.post('/', authenticate, requireRole('student'), (req, res) => {
  const { projectId, title, description, files } = req.body;
  if (!projectId || !title) return res.status(400).json({ success: false, message: '项目ID和标题必填' });

  const project = db.findById('projects', projectId);
  if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

  const assignment = db.insert('assignments', {
    projectId,
    studentId: req.user.userId,
    title,
    description: description || '',
    files: files || [],
    status: 'submitted',
    score: null,
    feedback: '',
    reviewedBy: null,
    reviewedAt: null
  });

  res.status(201).json({ success: true, message: '提交成功', data: assignment });
});

/** POST /api/assignments/:id/review - 评审打分（企业/教师） */
router.post('/:id/review', authenticate, requireRole('enterprise', 'teacher'), (req, res) => {
  const { score, feedback } = req.body;
  if (score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ success: false, message: '请提供0-100之间的分数' });
  }

  const a = db.findById('assignments', req.params.id);
  if (!a) return res.status(404).json({ success: false, message: '作业不存在' });

  const updated = db.update('assignments', req.params.id, {
    score,
    feedback: feedback || '',
    status: 'reviewed',
    reviewedBy: req.user.userId,
    reviewedAt: new Date().toISOString()
  });

  res.json({ success: true, message: '评审完成', data: updated });
});

/** POST /api/assignments/:id/iterate - 迭代修改 */
router.post('/:id/iterate', authenticate, requireRole('student'), (req, res) => {
  const { description, files } = req.body;
  const a = db.findById('assignments', req.params.id);
  if (!a) return res.status(404).json({ success: false, message: '作业不存在' });
  if (a.studentId !== req.user.userId) return res.status(403).json({ success: false, message: '无权修改' });

  const iteration = db.insert('assignment_iterations', {
    assignmentId: req.params.id,
    description: description || '',
    files: files || [],
    version: (db.find('assignment_iterations', { assignmentId: req.params.id }).length + 1)
  });

  db.update('assignments', req.params.id, { status: 'iterated' });
  res.status(201).json({ success: true, message: '迭代记录已保存', data: iteration });
});

module.exports = router;
