/**
 * 简历管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { encrypt, decrypt, maskSensitiveData } = require('../utils/crypto');
const { success, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/resumes - 简历列表
 */
router.get('/', requireAdminOrHR, operationLogger('简历管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, keyword = '', status = '', jobId = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];
  if (keyword) { where += ' AND (r.name LIKE ? OR r.phone LIKE ? OR r.email LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (jobId) { where += ' AND r.job_id = ?'; params.push(parseInt(jobId)); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM resumes r ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT r.*, j.title as job_title, u.real_name as hr_name
    FROM resumes r
    LEFT JOIN jobs j ON r.job_id = j.id
    LEFT JOIN users u ON r.hr_user_id = u.id
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  // 解密手机号
  const result = list.map(item => ({
    ...item,
    phone: decrypt(item.phone)
  }));

  page(res, result, total, pageNum, pageSize);
});

/**
 * GET /api/resumes/:id
 */
router.get('/:id', requireAdminOrHR, operationLogger('简历管理'), (req, res) => {
  const resume = db.prepare(`
    SELECT r.*, j.title as job_title, u.real_name as hr_name
    FROM resumes r
    LEFT JOIN jobs j ON r.job_id = j.id
    LEFT JOIN users u ON r.hr_user_id = u.id
    WHERE r.id = ?
  `).get(parseInt(req.params.id));
  if (!resume) return notFound(res, '简历不存在');

  resume.phone = decrypt(resume.phone);
  success(res, resume);
});

/**
 * POST /api/resumes - 录入简历
 */
router.post('/', requireAdminOrHR, operationLogger('简历管理'), (req, res) => {
  const { jobId, name, gender, phone, email, education, workYears, expectedSalary, currentSalary, resumeFile, source, remark } = req.body;
  if (!jobId || !name || !phone) return badRequest(res, '岗位、姓名、手机号不能为空');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(`
    INSERT INTO resumes (job_id, name, gender, phone, email, education, work_years, expected_salary,
      current_salary, resume_file, source, hr_user_id, remark, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(jobId, name, gender || null, encrypt(phone), email || null, education || null,
    workYears || 0, expectedSalary || null, currentSalary || null, resumeFile || null,
    source || null, req.userId, remark || null, now, now);

  success(res, { id: result.lastInsertRowid }, '简历录入成功', 201);
});

/**
 * PUT /api/resumes/:id - 更新简历
 */
router.put('/:id', requireAdminOrHR, operationLogger('简历管理'), (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(parseInt(req.params.id));
  if (!resume) return notFound(res, '简历不存在');

  const { name, gender, phone, email, education, workYears, expectedSalary, currentSalary, resumeFile, source, status, hrUserId, remark } = req.body;

  db.prepare(`
    UPDATE resumes SET name=?, gender=?, phone=?, email=?, education=?, work_years=?, expected_salary=?,
      current_salary=?, resume_file=?, source=?, status=?, hr_user_id=?, remark=?, updated_at=?
    WHERE id=?
  `).run(name || resume.name, gender || resume.gender,
    phone ? encrypt(phone) : resume.phone,
    email || resume.email, education || resume.education, workYears || resume.work_years,
    expectedSalary || resume.expected_salary, currentSalary || resume.current_salary,
    resumeFile || resume.resume_file, source || resume.source, status || resume.status,
    hrUserId || resume.hr_user_id, remark || resume.remark,
    dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '简历更新成功');
});

/**
 * DELETE /api/resumes/:id
 */
router.delete('/:id', requireAdminOrHR, operationLogger('简历管理'), (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(parseInt(req.params.id));
  if (!resume) return notFound(res, '简历不存在');
  db.prepare('DELETE FROM resumes WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, '简历删除成功');
});

module.exports = router;
