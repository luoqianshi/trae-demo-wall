/**
 * 面试管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { success, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/interviews
 */
router.get('/', requireAdminOrHR, operationLogger('面试管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, keyword = '', status = '', jobId = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];
  if (keyword) { where += ' AND (r.name LIKE ?)'; params.push(`%${keyword}%`); }
  if (status) { where += ' AND i.status = ?'; params.push(status); }
  if (jobId) { where += ' AND i.job_id = ?'; params.push(parseInt(jobId)); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM interviews i LEFT JOIN resumes r ON i.resume_id = r.id ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT i.*, r.name as candidate_name, j.title as job_title, u.real_name as interviewer_name
    FROM interviews i
    LEFT JOIN resumes r ON i.resume_id = r.id
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN users u ON i.interviewer_id = u.id
    ${where}
    ORDER BY i.scheduled_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

/**
 * GET /api/interviews/:id
 */
router.get('/:id', requireAdminOrHR, operationLogger('面试管理'), (req, res) => {
  const interview = db.prepare(`
    SELECT i.*, r.name as candidate_name, r.phone as candidate_phone, j.title as job_title, u.real_name as interviewer_name
    FROM interviews i
    LEFT JOIN resumes r ON i.resume_id = r.id
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN users u ON i.interviewer_id = u.id
    WHERE i.id = ?
  `).get(parseInt(req.params.id));
  if (!interview) return notFound(res, '面试不存在');
  success(res, interview);
});

/**
 * POST /api/interviews
 */
router.post('/', requireAdminOrHR, operationLogger('面试管理'), (req, res) => {
  const { resumeId, jobId, round, interviewType, interviewerId, scheduledAt, durationMinutes, location } = req.body;
  if (!resumeId || !jobId || !scheduledAt) return badRequest(res, '简历、岗位、面试时间不能为空');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(`
    INSERT INTO interviews (resume_id, job_id, round, interview_type, interviewer_id, scheduled_at,
      duration_minutes, location, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(resumeId, jobId, round || 1, interviewType || 'onsite', interviewerId || null,
    scheduledAt, durationMinutes || 60, location || null, now, now);

  // 更新简历状态
  db.prepare('UPDATE resumes SET status = ?, updated_at = ? WHERE id = ?').run('interview', now, resumeId);

  success(res, { id: result.lastInsertRowid }, '面试安排成功', 201);
});

/**
 * PUT /api/interviews/:id
 */
router.put('/:id', requireAdminOrHR, operationLogger('面试管理'), (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(parseInt(req.params.id));
  if (!interview) return notFound(res, '面试不存在');

  const { round, interviewType, interviewerId, scheduledAt, durationMinutes, location, status, feedback, score, interviewerRemark } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.prepare(`
    UPDATE interviews SET round=?, interview_type=?, interviewer_id=?, scheduled_at=?, duration_minutes=?,
      location=?, status=?, feedback=?, score=?, interviewer_remark=?, updated_at=?
    WHERE id=?
  `).run(round ?? interview.round, interviewType ?? interview.interview_type,
    interviewerId ?? interview.interviewer_id, scheduledAt ?? interview.scheduled_at,
    durationMinutes ?? interview.duration_minutes, location ?? interview.location,
    status ?? interview.status, feedback ?? interview.feedback, score ?? interview.score,
    interviewerRemark ?? interview.interviewer_remark, now, parseInt(req.params.id));

  success(res, null, '面试更新成功');
});

/**
 * DELETE /api/interviews/:id
 */
router.delete('/:id', requireAdminOrHR, operationLogger('面试管理'), (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(parseInt(req.params.id));
  if (!interview) return notFound(res, '面试不存在');
  db.prepare('DELETE FROM interviews WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, '面试删除成功');
});

module.exports = router;
