/**
 * 员工档案路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { encrypt, decrypt, maskSensitiveData } = require('../utils/crypto');
const { success, fail, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR, requireAdminOrHROrManager } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();

router.use(authenticate);

// 敏感字段
const SENSITIVE_FIELDS = ['id_card', 'phone', 'bank_card'];

/**
 * GET /api/employees
 * 获取员工列表（分页）
 */
router.get('/', requireAdminOrHROrManager, operationLogger('员工档案'), (req, res) => {
  const { pageNum = 1, pageSize = 10, keyword = '', status = '', departmentId = '', position = '',
    onboardThisMonth, resignedThisMonth, late } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (e.name LIKE ? OR e.employee_no LIKE ? OR e.phone LIKE ? OR e.email LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    where += ' AND e.status = ?';
    params.push(status);
  }
  if (departmentId) {
    where += ' AND e.department_id = ?';
    params.push(parseInt(departmentId));
  }
  if (position) {
    where += ' AND e.position LIKE ?';
    params.push(`%${position}%`);
  }

  // 本月入职员工
  if (onboardThisMonth === 'true' || onboardThisMonth === '1') {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
    where += ' AND e.entry_date >= ? AND e.entry_date <= ?';
    params.push(monthStart, monthEnd);
  }

  // 本月离职员工
  if (resignedThisMonth === 'true' || resignedThisMonth === '1') {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
    where += " AND e.status = 'resigned' AND e.leave_date >= ? AND e.leave_date <= ?";
    params.push(monthStart, monthEnd);
  }

  // 迟到员工（通过attendance表关联查询本月有迟到记录的员工）
  if (late === 'true' || late === '1') {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    where += ' AND e.id IN (SELECT DISTINCT a.employee_id FROM attendance a WHERE a.status = ? AND a.date >= ?)';
    params.push('late', monthStart);
  }

  const countSql = `SELECT COUNT(*) as total FROM employees e ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT e.*, d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ${where}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const maskedList = list.map(item => {
    // 解密敏感字段
    const decrypted = { ...item };
    SENSITIVE_FIELDS.forEach(f => {
      if (decrypted[f]) decrypted[f] = decrypt(decrypted[f]);
    });
    // 非admin/hr脱敏
    if (!isSensitiveRole) {
      return maskSensitiveData(decrypted);
    }
    return decrypted;
  });

  page(res, maskedList, total, pageNum, pageSize);
});

/**
 * GET /api/employees/:id
 * 获取员工详情
 */
router.get('/:id', operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare(`
    SELECT e.*, d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = ?
  `).get(parseInt(id));

  if (!emp) {
    return notFound(res, '员工不存在');
  }

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const decrypted = { ...emp };
  SENSITIVE_FIELDS.forEach(f => {
    if (decrypted[f]) decrypted[f] = decrypt(decrypted[f]);
  });

  if (!isSensitiveRole) {
    return success(res, maskSensitiveData(decrypted));
  }

  success(res, decrypted);
});

/**
 * POST /api/employees
 * 创建员工档案
 */
router.post('/', requireAdminOrHR, operationLogger('员工档案'), (req, res) => {
  const {
    employeeNo, name, gender, birthDate, idCard, phone, email, address,
    bankCard, bankName, education, major, departmentId, position,
    entryDate, contractStart, contractEnd, probationEnd, remark
  } = req.body;

  if (!employeeNo || !name) {
    return badRequest(res, '工号和姓名不能为空');
  }

  const existNo = db.prepare('SELECT id FROM employees WHERE employee_no = ?').get(employeeNo);
  if (existNo) {
    return fail(res, '工号已存在', 400);
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const stmt = db.prepare(`
    INSERT INTO employees (employee_no, name, gender, birth_date, id_card, phone, email, address,
      bank_card, bank_name, education, major, department_id, position, entry_date,
      contract_start, contract_end, probation_end, remark, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    employeeNo, name, gender || '未知', birthDate || null,
    idCard ? encrypt(idCard) : null,
    phone ? encrypt(phone) : null,
    email || null, address || null,
    bankCard ? encrypt(bankCard) : null,
    bankName || null, education || null, major || null,
    departmentId || null, position || null, entryDate || null,
    contractStart || null, contractEnd || null, probationEnd || null,
    remark || null, now, now
  );

  success(res, { id: result.lastInsertRowid }, '员工档案创建成功', 201);
});

/**
 * PUT /api/employees/:id
 * 更新员工档案
 */
router.put('/:id', requireAdminOrHR, operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(parseInt(id));
  if (!emp) {
    return notFound(res, '员工不存在');
  }

  const {
    name, gender, birthDate, idCard, phone, email, address,
    bankCard, bankName, education, major, departmentId, position,
    entryDate, contractStart, contractEnd, probationEnd, status, leaveDate, remark
  } = req.body;

  db.prepare(`
    UPDATE employees SET name=?, gender=?, birth_date=?, id_card=?, phone=?, email=?, address=?,
      bank_card=?, bank_name=?, education=?, major=?, department_id=?, position=?,
      entry_date=?, contract_start=?, contract_end=?, probation_end=?, status=?, leave_date=?,
      remark=?, updated_at=?
    WHERE id = ?
  `).run(
    name ?? emp.name,
    gender ?? emp.gender,
    birthDate ?? emp.birth_date,
    idCard ? encrypt(idCard) : emp.id_card,
    phone ? encrypt(phone) : emp.phone,
    email ?? emp.email,
    address ?? emp.address,
    bankCard ? encrypt(bankCard) : emp.bank_card,
    bankName ?? emp.bank_name,
    education ?? emp.education,
    major ?? emp.major,
    departmentId !== undefined ? departmentId : emp.department_id,
    position ?? emp.position,
    entryDate ?? emp.entry_date,
    contractStart ?? emp.contract_start,
    contractEnd ?? emp.contract_end,
    probationEnd ?? emp.probation_end,
    status ?? emp.status,
    leaveDate ?? emp.leave_date,
    remark ?? emp.remark,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    parseInt(id)
  );

  success(res, null, '员工档案更新成功');
});

/**
 * DELETE /api/employees/:id
 * 删除员工档案
 */
router.delete('/:id', requireAdminOrHR, operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(parseInt(id));
  if (!emp) {
    return notFound(res, '员工不存在');
  }

  db.prepare('DELETE FROM employees WHERE id = ?').run(parseInt(id));
  success(res, null, '员工档案删除成功');
});

/**
 * GET /api/employees/:id/contracts - 员工合同信息
 */
router.get('/:id/contracts', operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(parseInt(id));
  if (!emp) return notFound(res, '员工不存在');

  const contract = {
    id: emp.id,
    employeeId: emp.id,
    employeeName: emp.name,
    employeeNo: emp.employee_no,
    contractStart: emp.contract_start,
    contractEnd: emp.contract_end,
    probationEnd: emp.probation_end,
    status: (() => {
      if (emp.status === 'resigned') return 'expired';
      if (!emp.contract_end) return 'active';
      return dayjs().isAfter(dayjs(emp.contract_end)) ? 'expired' : 'active';
    })()
  };

  success(res, contract);
});

/**
 * GET /api/employees/:id/attendance - 员工最近考勤概况
 */
router.get('/:id/attendance', operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare('SELECT id, name, employee_no FROM employees WHERE id = ?').get(parseInt(id));
  if (!emp) return notFound(res, '员工不存在');

  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');

  // 本月考勤统计
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN status = 'early' THEN 1 ELSE 0 END) as early_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days,
      SUM(COALESCE(work_hours, 0)) as total_work_hours,
      SUM(COALESCE(overtime_hours, 0)) as total_overtime_hours
    FROM attendance
    WHERE employee_id = ? AND date >= ? AND date <= ?
  `).get(parseInt(id), monthStart, today);

  // 最近10条考勤记录
  const recentRecords = db.prepare(`
    SELECT date, check_in, check_out, status, late_minutes, early_minutes, work_hours
    FROM attendance
    WHERE employee_id = ?
    ORDER BY date DESC
    LIMIT 10
  `).all(parseInt(id));

  success(res, {
    employee: emp,
    monthStats: stats,
    recentRecords
  });
});

/**
 * GET /api/employees/:id/performance - 员工绩效概况
 */
router.get('/:id/performance', operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare('SELECT id, name, employee_no FROM employees WHERE id = ?').get(parseInt(id));
  if (!emp) return notFound(res, '员工不存在');

  // 最近4个季度的绩效记录
  const records = db.prepare(`
    SELECT id, period, period_type, score, grade, status, self_evaluation, manager_evaluation,
      self_score, self_comment, manager_score, manager_comment, total_score,
      created_at, rated_at
    FROM performances
    WHERE employee_id = ?
    ORDER BY period DESC
    LIMIT 8
  `).all(parseInt(id));

  // 计算平均分
  const completedRecords = records.filter(r => r.score !== null && r.score !== undefined);
  const avgScore = completedRecords.length > 0
    ? (completedRecords.reduce((sum, r) => sum + (r.total_score || r.score || 0), 0) / completedRecords.length).toFixed(2)
    : null;

  success(res, {
    employee: emp,
    averageScore: avgScore,
    recordCount: records.length,
    records
  });
});

/**
 * GET /api/employees/:id/changes - 员工异动记录
 */
router.get('/:id/changes', operationLogger('员工档案'), (req, res) => {
  const { id } = req.params;
  const emp = db.prepare('SELECT id, name, employee_no FROM employees WHERE id = ?').get(parseInt(id));
  if (!emp) return notFound(res, '员工不存在');

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);

  const records = db.prepare(`
    SELECT ec.*,
      d_old.name as from_department_name,
      d_new.name as to_department_name,
      u.real_name as approver_name,
      c.real_name as creator_name
    FROM employee_changes ec
    LEFT JOIN departments d_old ON ec.old_department_id = d_old.id
    LEFT JOIN departments d_new ON ec.new_department_id = d_new.id
    LEFT JOIN users u ON ec.approved_by = u.id
    LEFT JOIN users c ON ec.created_by = c.id
    WHERE ec.employee_id = ?
    ORDER BY ec.created_at DESC
  `).all(parseInt(id));

  const result = records.map(item => {
    // 解密薪资字段
    if (item.old_salary_enc) {
      try { item.old_salary = parseFloat(decrypt(item.old_salary_enc)) || item.old_salary; } catch(e) {}
    }
    if (item.new_salary_enc) {
      try { item.new_salary = parseFloat(decrypt(item.new_salary_enc)) || item.new_salary; } catch(e) {}
    }
    if (!isSensitiveRole) {
      return maskSensitiveData({ ...item });
    }
    return item;
  });

  success(res, {
    employee: emp,
    records: result
  });
});

module.exports = router;
