/**
 * 薪资管理路由
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

// 薪资加密字段
const SALARY_FIELDS = ['base_salary', 'position_salary', 'performance_bonus', 'allowance',
  'social_insurance', 'housing_fund', 'tax'];

const SALARY_ENC_FIELDS = ['base_salary_enc', 'position_salary_enc', 'performance_bonus_enc',
  'allowance_enc', 'social_insurance_enc', 'housing_fund_enc', 'tax_enc'];

/**
 * GET /api/salaries - 薪资结构列表
 */
router.get('/', operationLogger('薪资管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, employeeId, status = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (req.userRole === 'employee') {
    where += ' AND s.user_id = ?';
    params.push(req.userId);
  } else if (employeeId) {
    where += ' AND s.employee_id = ?';
    params.push(parseInt(employeeId));
  }
  if (status) { where += ' AND s.status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM salaries s ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT s.*, e.name as employee_name, e.employee_no
    FROM salaries s
    LEFT JOIN employees e ON s.employee_id = e.id
    ${where}
    ORDER BY s.effective_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const result = list.map(item => {
    if (!isSensitiveRole) {
      return maskSensitiveData({ ...item });
    }
    return item;
  });

  page(res, result, total, pageNum, pageSize);
});

/**
 * POST /api/salaries - 设置薪资结构
 */
router.post('/', requireAdminOrHR, operationLogger('薪资管理'), (req, res) => {
  const { employeeId, baseSalary, positionSalary, performanceBonus, allowance,
    socialInsurance, housingFund, tax, effectiveDate, remark } = req.body;

  if (!employeeId || !effectiveDate) {
    return badRequest(res, '员工和生效日期不能为空');
  }

  // 将之前的薪资记录置为失效
  db.prepare("UPDATE salaries SET status = 'inactive', updated_at = ? WHERE employee_id = ? AND status = 'active'")
    .run(dayjs().format('YYYY-MM-DD HH:mm:ss'), employeeId);

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(`
    INSERT INTO salaries (employee_id, user_id, base_salary, base_salary_enc, position_salary,
      position_salary_enc, performance_bonus, performance_bonus_enc, allowance, allowance_enc,
      social_insurance, social_insurance_enc, housing_fund, housing_fund_enc, tax, tax_enc,
      effective_date, status, remark, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    employeeId, req.userId,
    baseSalary || 0, encrypt(String(baseSalary || 0)),
    positionSalary || 0, encrypt(String(positionSalary || 0)),
    performanceBonus || 0, encrypt(String(performanceBonus || 0)),
    allowance || 0, encrypt(String(allowance || 0)),
    socialInsurance || 0, encrypt(String(socialInsurance || 0)),
    housingFund || 0, encrypt(String(housingFund || 0)),
    tax || 0, encrypt(String(tax || 0)),
    effectiveDate, 'active', remark || null, now, now
  );

  success(res, { id: result.lastInsertRowid }, '薪资结构设置成功', 201);
});

/**
 * GET /api/salaries/my-slips - 当前用户的工资条列表
 */
router.get('/my-slips', operationLogger('薪资管理'), (req, res) => {
  // 通过req.userId关联users.real_name -> employees.name找到employee_id
  const empRecord = db.prepare(
    'SELECT e.id as employee_id FROM employees e JOIN users u ON e.name = u.real_name WHERE u.id = ?'
  ).get(req.userId);

  if (!empRecord) {
    return success(res, []);
  }

  const slips = db.prepare(`
    SELECT sr.*, e.name as employee_name, e.employee_no
    FROM salary_records sr
    LEFT JOIN employees e ON sr.employee_id = e.id
    WHERE sr.employee_id = ?
    ORDER BY sr.period DESC
  `).all(empRecord.employee_id);

  // 工资条属于敏感数据，进行脱敏处理
  const result = slips.map(item => {
    return maskSensitiveData({ ...item });
  });

  success(res, result);
});

/**
 * GET /api/salaries/:id
 */
router.get('/:id', operationLogger('薪资管理'), (req, res) => {
  const salary = db.prepare(`
    SELECT s.*, e.name as employee_name
    FROM salaries s
    LEFT JOIN employees e ON s.employee_id = e.id
    WHERE s.id = ?
  `).get(parseInt(req.params.id));
  if (!salary) return notFound(res, '薪资记录不存在');

  if (!['admin', 'hr'].includes(req.userRole)) {
    return success(res, maskSensitiveData({ ...salary }));
  }
  success(res, salary);
});

/**
 * DELETE /api/salaries/:id
 */
router.delete('/:id', requireAdminOrHR, operationLogger('薪资管理'), (req, res) => {
  const salary = db.prepare('SELECT * FROM salaries WHERE id = ?').get(parseInt(req.params.id));
  if (!salary) return notFound(res, '薪资记录不存在');
  db.prepare('DELETE FROM salaries WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, '薪资记录删除成功');
});

// ==================== 工资记录 salary_records ====================

/**
 * GET /api/salaries/records/list - 工资发放记录列表
 */
router.get('/records/list', operationLogger('工资记录'), (req, res) => {
  const { pageNum = 1, pageSize = 10, employeeId, period, status = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (req.userRole === 'employee') {
    where += ' AND sr.user_id = ?';
    params.push(req.userId);
  } else if (employeeId) {
    where += ' AND sr.employee_id = ?';
    params.push(parseInt(employeeId));
  }
  if (period) { where += ' AND sr.period = ?'; params.push(period); }
  if (status) { where += ' AND sr.status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM salary_records sr ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT sr.*, e.name as employee_name, e.employee_no,
      u.real_name as creator_name, c.real_name as confirmer_name
    FROM salary_records sr
    LEFT JOIN employees e ON sr.employee_id = e.id
    LEFT JOIN users u ON sr.created_by = u.id
    LEFT JOIN users c ON sr.confirmed_by = c.id
    ${where}
    ORDER BY sr.period DESC, sr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const result = list.map(item => {
    if (!isSensitiveRole) {
      return maskSensitiveData({ ...item });
    }
    return item;
  });

  page(res, result, total, pageNum, pageSize);
});

/**
 * POST /api/salaries/records - 生成工资记录
 */
router.post('/records', requireAdminOrHR, operationLogger('工资记录'), (req, res) => {
  const { employeeId, period, baseSalary, positionSalary, performanceBonus, allowance,
    overtimePay, otherAdditions, socialInsurance, housingFund, tax, otherDeductions, remark } = req.body;

  if (!employeeId || !period) {
    return badRequest(res, '员工和工资月份不能为空');
  }

  const exist = db.prepare('SELECT id FROM salary_records WHERE employee_id = ? AND period = ?').get(employeeId, period);
  if (exist) return badRequest(res, '该员工此月份已有工资记录');

  const grossSalary = (Number(baseSalary) || 0) + (Number(positionSalary) || 0) +
    (Number(performanceBonus) || 0) + (Number(allowance) || 0) +
    (Number(overtimePay) || 0) + (Number(otherAdditions) || 0);
  const totalDeductions = (Number(socialInsurance) || 0) + (Number(housingFund) || 0) +
    (Number(tax) || 0) + (Number(otherDeductions) || 0);
  const netSalary = grossSalary - totalDeductions;

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // 查找关联的salary_id和user_id
  const salaryRecord = db.prepare('SELECT s.id as salary_id, s.user_id FROM salaries s WHERE s.employee_id = ? AND s.status = ? ORDER BY s.effective_date DESC LIMIT 1').get(employeeId, 'active');
  const salaryId = salaryRecord ? salaryRecord.salary_id : null;
  const salaryUserId = salaryRecord ? salaryRecord.user_id : null;

  const result = db.prepare(`
    INSERT INTO salary_records (employee_id, salary_id, user_id, period, base_salary, position_salary,
      performance_bonus, allowance, overtime_pay, other_additions, social_insurance, housing_fund,
      tax, other_deductions, gross_salary, net_salary, status, created_by, remark, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(employeeId, salaryId, salaryUserId, period, baseSalary || 0, positionSalary || 0,
    performanceBonus || 0, allowance || 0, overtimePay || 0, otherAdditions || 0,
    socialInsurance || 0, housingFund || 0, tax || 0, otherDeductions || 0,
    grossSalary, netSalary, 'draft', req.userId, remark || null, now, now);

  success(res, { id: result.lastInsertRowid, grossSalary, netSalary }, '工资记录生成成功', 201);
});

/**
 * PUT /api/salaries/records/:id/confirm - 确认工资
 */
router.put('/records/:id/confirm', requireAdminOrHR, operationLogger('工资记录'), (req, res) => {
  const record = db.prepare('SELECT * FROM salary_records WHERE id = ?').get(parseInt(req.params.id));
  if (!record) return notFound(res, '工资记录不存在');
  if (record.status !== 'draft') return badRequest(res, '只有草稿状态可确认');

  db.prepare(`
    UPDATE salary_records SET status = 'confirmed', confirmed_by = ?, updated_at = ? WHERE id = ?
  `).run(req.userId, dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '工资确认成功');
});

/**
 * PUT /api/salaries/records/:id/pay - 发放工资
 */
router.put('/records/:id/pay', requireAdminOrHR, operationLogger('工资记录'), (req, res) => {
  const record = db.prepare('SELECT * FROM salary_records WHERE id = ?').get(parseInt(req.params.id));
  if (!record) return notFound(res, '工资记录不存在');
  if (record.status !== 'confirmed') return badRequest(res, '请先确认工资再发放');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare(`
    UPDATE salary_records SET status = 'paid', paid_at = ?, updated_at = ? WHERE id = ?
  `).run(now, now, parseInt(req.params.id));

  success(res, null, '工资发放成功');
});

/**
 * GET /api/salaries/records/:id
 */
router.get('/records/:id', operationLogger('工资记录'), (req, res) => {
  const record = db.prepare(`
    SELECT sr.*, e.name as employee_name, e.employee_no
    FROM salary_records sr
    LEFT JOIN employees e ON sr.employee_id = e.id
    WHERE sr.id = ?
  `).get(parseInt(req.params.id));
  if (!record) return notFound(res, '工资记录不存在');

  if (!['admin', 'hr'].includes(req.userRole) && record.user_id !== req.userId) {
    return success(res, maskSensitiveData({ ...record }));
  }
  success(res, record);
});

/**
 * DELETE /api/salaries/records/:id
 */
router.delete('/records/:id', requireAdminOrHR, operationLogger('工资记录'), (req, res) => {
  const record = db.prepare('SELECT * FROM salary_records WHERE id = ?').get(parseInt(req.params.id));
  if (!record) return notFound(res, '工资记录不存在');
  if (record.status === 'paid') return badRequest(res, '已发放的工资记录不能删除');
  db.prepare('DELETE FROM salary_records WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, '工资记录删除成功');
});

module.exports = router;
