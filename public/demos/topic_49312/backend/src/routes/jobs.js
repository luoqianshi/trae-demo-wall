/**
 * 招聘岗位路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { success, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

// 招聘模块：admin/hr/manager可访问，普通员工不可
function requireRecruitmentAccess(req, res, next) {
  if (['admin', 'hr', 'manager'].includes(req.userRole)) return next();
  return res.status(403).json({ code: 403, success: false, message: '无权限访问招聘模块' });
}

/**
 * GET /api/jobs - 岗位列表
 */
router.get('/', requireRecruitmentAccess, operationLogger('招聘岗位'), (req, res) => {
  const { pageNum = 1, pageSize = 10, keyword = '', status = '', departmentId = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];
  if (keyword) { where += ' AND (j.title LIKE ? OR j.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (status) { where += ' AND j.status = ?'; params.push(status); }
  if (departmentId) { where += ' AND j.department_id = ?'; params.push(parseInt(departmentId)); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM jobs j ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT j.*, d.name as department_name, u.real_name as creator_name,
      (SELECT COUNT(*) FROM resumes r WHERE r.job_id = j.id) as resume_count
    FROM jobs j
    LEFT JOIN departments d ON j.department_id = d.id
    LEFT JOIN users u ON j.created_by = u.id
    ${where}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

/**
 * GET /api/jobs/:id
 */
router.get('/:id', requireRecruitmentAccess, operationLogger('招聘岗位'), (req, res) => {
  const job = db.prepare(`
    SELECT j.*, d.name as department_name, u.real_name as creator_name
    FROM jobs j
    LEFT JOIN departments d ON j.department_id = d.id
    LEFT JOIN users u ON j.created_by = u.id
    WHERE j.id = ?
  `).get(parseInt(req.params.id));
  if (!job) return notFound(res, '岗位不存在');
  success(res, job);
});

/**
 * POST /api/jobs
 */
router.post('/', requireAdminOrHR, operationLogger('招聘岗位'), (req, res) => {
  const { title, departmentId, description, requirements, salaryRange, location, headcount, status } = req.body;
  if (!title) return badRequest(res, '岗位名称不能为空');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(`
    INSERT INTO jobs (title, department_id, description, requirements, salary_range, location, headcount, status, publish_date, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, departmentId || null, description || null, requirements || null, salaryRange || null,
    location || null, headcount || 1, status || 'open', now, req.userId, now, now);

  success(res, { id: result.lastInsertRowid }, '岗位创建成功', 201);
});

/**
 * PUT /api/jobs/:id
 */
router.put('/:id', requireAdminOrHR, operationLogger('招聘岗位'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(req.params.id));
  if (!job) return notFound(res, '岗位不存在');

  const { title, departmentId, description, requirements, salaryRange, location, headcount, status, closeDate } = req.body;
  db.prepare(`
    UPDATE jobs SET title=?, department_id=?, description=?, requirements=?, salary_range=?, location=?, headcount=?, status=?, close_date=?, updated_at=?
    WHERE id=?
  `).run(title || job.title, departmentId || job.department_id, description || job.description,
    requirements || job.requirements, salaryRange || job.salary_range, location || job.location,
    headcount || job.headcount, status || job.status, closeDate || job.close_date,
    dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '岗位更新成功');
});

/**
 * DELETE /api/jobs/:id
 */
router.delete('/:id', requireAdminOrHR, operationLogger('招聘岗位'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(req.params.id));
  if (!job) return notFound(res, '岗位不存在');
  db.prepare('DELETE FROM jobs WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, '岗位删除成功');
});

module.exports = router;
