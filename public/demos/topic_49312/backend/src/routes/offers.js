/**
 * Offer管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { encrypt } = require('../utils/crypto');
const { success, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/offers
 */
router.get('/', requireAdminOrHR, operationLogger('Offer管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, keyword = '', status = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];
  if (keyword) { where += ' AND (o.offer_no LIKE ? OR r.name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (status) { where += ' AND o.status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM offers o LEFT JOIN resumes r ON o.resume_id = r.id ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT o.*, r.name as candidate_name, j.title as job_title, d.name as department_name,
      u.real_name as creator_name, a.real_name as approver_name
    FROM offers o
    LEFT JOIN resumes r ON o.resume_id = r.id
    LEFT JOIN jobs j ON o.job_id = j.id
    LEFT JOIN departments d ON o.department_id = d.id
    LEFT JOIN users u ON o.created_by = u.id
    LEFT JOIN users a ON o.approved_by = a.id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

/**
 * GET /api/offers/:id
 */
router.get('/:id', requireAdminOrHR, operationLogger('Offer管理'), (req, res) => {
  const offer = db.prepare(`
    SELECT o.*, r.name as candidate_name, j.title as job_title, d.name as department_name
    FROM offers o
    LEFT JOIN resumes r ON o.resume_id = r.id
    LEFT JOIN jobs j ON o.job_id = j.id
    LEFT JOIN departments d ON o.department_id = d.id
    WHERE o.id = ?
  `).get(parseInt(req.params.id));
  if (!offer) return notFound(res, 'Offer不存在');
  success(res, offer);
});

/**
 * POST /api/offers
 */
router.post('/', requireAdminOrHR, operationLogger('Offer管理'), (req, res) => {
  const { resumeId, jobId, position, departmentId, salary, entryDate, offerDate, validUntil, content } = req.body;
  if (!resumeId || !jobId || !position || !salary || !offerDate) {
    return badRequest(res, '必填字段不能为空');
  }

  const offerNo = 'OF' + dayjs().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 1000);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const result = db.prepare(`
    INSERT INTO offers (resume_id, job_id, offer_no, salary, salary_encrypted, position, department_id,
      entry_date, offer_date, valid_until, status, content, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(resumeId, jobId, offerNo, salary, encrypt(String(salary)), position, departmentId || null,
    entryDate || null, offerDate, validUntil || null, 'pending', content || null, req.userId, now, now);

  // 更新简历状态
  db.prepare('UPDATE resumes SET status = ?, updated_at = ? WHERE id = ?').run('offer', now, resumeId);

  success(res, { id: result.lastInsertRowid, offerNo }, 'Offer创建成功', 201);
});

/**
 * PUT /api/offers/:id
 */
router.put('/:id', requireAdminOrHR, operationLogger('Offer管理'), (req, res) => {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(parseInt(req.params.id));
  if (!offer) return notFound(res, 'Offer不存在');

  const { position, departmentId, salary, entryDate, validUntil, status, content, approvedBy } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.prepare(`
    UPDATE offers SET position=?, department_id=?, salary=?, salary_encrypted=?, entry_date=?,
      valid_until=?, status=?, content=?, approved_by=?, approved_at=?, updated_at=?
    WHERE id=?
  `).run(position ?? offer.position, departmentId ?? offer.department_id,
    salary ?? offer.salary, salary ? encrypt(String(salary)) : offer.salary_encrypted,
    entryDate ?? offer.entry_date, validUntil ?? offer.valid_until, status ?? offer.status,
    content ?? offer.content, approvedBy ?? offer.approved_by,
    status === 'accepted' ? now : offer.approved_at, now, parseInt(req.params.id));

  success(res, null, 'Offer更新成功');
});

/**
 * DELETE /api/offers/:id
 */
router.delete('/:id', requireAdminOrHR, operationLogger('Offer管理'), (req, res) => {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(parseInt(req.params.id));
  if (!offer) return notFound(res, 'Offer不存在');
  db.prepare('DELETE FROM offers WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, 'Offer删除成功');
});

module.exports = router;
