/**
 * 员工异动管理路由
 * 支持：调岗、晋升、降职、降薪、转正
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { encrypt, decrypt, maskSensitiveData } = require('../utils/crypto');
const { success, fail, badRequest, notFound, page: pageResult } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

// 表初始化标志（延迟初始化，等待数据库加载完成）
let tablesReady = false;
function ensureTables() {
  if (tablesReady) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      old_department_id INTEGER,
      new_department_id INTEGER,
      old_position TEXT,
      new_position TEXT,
      old_salary REAL,
      old_salary_enc TEXT,
      new_salary REAL,
      new_salary_enc TEXT,
      effective_date TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at TEXT,
      reject_reason TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);
  tablesReady = true;
}

// 在数据库初始化完成后创建表
db.ready.then(() => ensureTables()).catch(err => console.error('employee_changes表初始化失败:', err));

// 有效的异动类型（与前端保持一致）
const VALID_CHANGE_TYPES = ['transfer', 'promotion', 'demotion', 'salary_cut', 'regularization'];

/**
 * 将数据库返回的 snake_case 字段映射为前端使用的 camelCase 字段
 */
function mapChangeRow(row) {
  if (!row) return row;
  const result = {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeNo: row.employee_no,
    changeType: row.change_type,
    fromDepartmentId: row.old_department_id,
    fromDepartment: row.old_department_id,
    fromDepartmentName: row.from_department_name,
    toDepartmentId: row.new_department_id,
    toDepartment: row.new_department_id,
    toDepartmentName: row.to_department_name,
    fromPosition: row.old_position,
    toPosition: row.new_position,
    oldSalary: row.old_salary,
    newSalary: row.new_salary,
    effectiveDate: row.effective_date,
    reason: row.reason,
    status: row.status,
    approvedBy: row.approved_by,
    approverName: row.approver_name,
    approvedAt: row.approved_at,
    rejectReason: row.reject_reason,
    createdBy: row.created_by,
    creatorName: row.creator_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  return result;
}

/**
 * 解密并处理薪资敏感字段
 */
function processSalaryFields(row, isSensitiveRole) {
  const r = { ...row };
  // 解密薪资（从 _enc 字段解密后覆盖）
  if (r.oldSalary !== null && r.oldSalary !== undefined) {
    // 已从 real 字段取值
  }
  if (!isSensitiveRole) {
    return maskSensitiveData(r, {
      salaryFields: ['oldSalary', 'newSalary']
    });
  }
  return r;
}

/**
 * GET /api/employee-changes - 异动列表（分页、筛选）
 */
router.get('/', operationLogger('员工异动'), (req, res) => {
  const { pageNum = 1, pageSize = 10, page: pageQuery = 1, employeeId, keyword = '', changeType = '', status = '' } = req.query;
  const currentPage = parseInt(pageNum) || parseInt(pageQuery) || 1;
  const offset = (currentPage - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  // 普通员工只能查看自己的异动记录（通过 users.real_name = employees.name 关联）
  if (req.userRole === 'employee') {
    where += ' AND ec.employee_id IN (SELECT e.id FROM employees e JOIN users u ON e.name = u.real_name WHERE u.id = ?)';
    params.push(req.userId);
  } else if (employeeId) {
    where += ' AND ec.employee_id = ?';
    params.push(parseInt(employeeId));
  }
  if (keyword) {
    where += ' AND (e.name LIKE ? OR e.employee_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (changeType) { where += ' AND ec.change_type = ?'; params.push(changeType); }
  if (status) { where += ' AND ec.status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM employee_changes ec LEFT JOIN employees e ON ec.employee_id = e.id ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT ec.*,
      e.name as employee_name, e.employee_no,
      d_old.name as from_department_name,
      d_new.name as to_department_name,
      u.real_name as approver_name,
      c.real_name as creator_name
    FROM employee_changes ec
    LEFT JOIN employees e ON ec.employee_id = e.id
    LEFT JOIN departments d_old ON ec.old_department_id = d_old.id
    LEFT JOIN departments d_new ON ec.new_department_id = d_new.id
    LEFT JOIN users u ON ec.approved_by = u.id
    LEFT JOIN users c ON ec.created_by = c.id
    ${where}
    ORDER BY ec.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const result = list.map(item => {
    // 解密加密薪资字段
    if (item.old_salary_enc) {
      try { item.old_salary = parseFloat(decrypt(item.old_salary_enc)) || item.old_salary; } catch(e) {}
    }
    if (item.new_salary_enc) {
      try { item.new_salary = parseFloat(decrypt(item.new_salary_enc)) || item.new_salary; } catch(e) {}
    }
    const mapped = mapChangeRow(item);
    return processSalaryFields(mapped, isSensitiveRole);
  });

  pageResult(res, result, total, currentPage, pageSize);
});

/**
 * GET /api/employee-changes/:id - 异动详情
 */
router.get('/:id', operationLogger('员工异动'), (req, res) => {
  const change = db.prepare(`
    SELECT ec.*,
      e.name as employee_name, e.employee_no,
      d_old.name as from_department_name,
      d_new.name as to_department_name,
      u.real_name as approver_name,
      c.real_name as creator_name
    FROM employee_changes ec
    LEFT JOIN employees e ON ec.employee_id = e.id
    LEFT JOIN departments d_old ON ec.old_department_id = d_old.id
    LEFT JOIN departments d_new ON ec.new_department_id = d_new.id
    LEFT JOIN users u ON ec.approved_by = u.id
    LEFT JOIN users c ON ec.created_by = c.id
    WHERE ec.id = ?
  `).get(parseInt(req.params.id));

  if (!change) return notFound(res, '异动记录不存在');

  if (change.old_salary_enc) {
    try { change.old_salary = parseFloat(decrypt(change.old_salary_enc)) || change.old_salary; } catch(e) {}
  }
  if (change.new_salary_enc) {
    try { change.new_salary = parseFloat(decrypt(change.new_salary_enc)) || change.new_salary; } catch(e) {}
  }

  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const mapped = mapChangeRow(change);
  success(res, processSalaryFields(mapped, isSensitiveRole));
});

/**
 * POST /api/employee-changes - 提交异动申请
 */
router.post('/', requireAdminOrHR, operationLogger('员工异动'), (req, res) => {
  const {
    employeeId, changeType,
    fromDepartmentId, toDepartmentId,
    fromPosition, toPosition,
    oldSalary, newSalary,
    effectiveDate, reason
  } = req.body;

  if (!employeeId || !changeType || !effectiveDate) {
    return badRequest(res, '员工、异动类型和生效日期不能为空');
  }
  if (!VALID_CHANGE_TYPES.includes(changeType)) {
    return badRequest(res, '无效的异动类型');
  }

  // 检查员工是否存在
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(parseInt(employeeId));
  if (!emp) return notFound(res, '员工不存在');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // 自动填充原始信息（如果前端未传）
  const oldDeptId = fromDepartmentId !== undefined && fromDepartmentId !== null && fromDepartmentId !== ''
    ? parseInt(fromDepartmentId) : emp.department_id;
  const oldPos = fromPosition || emp.position;

  // 获取当前薪资（从salaries表取active记录的base_salary作为参考）
  let oldSal = oldSalary;
  if (oldSal === undefined || oldSal === null || oldSal === '') {
    const salaryRec = db.prepare('SELECT base_salary FROM salaries WHERE employee_id = ? AND status = ? ORDER BY effective_date DESC LIMIT 1').get(emp.id, 'active');
    oldSal = salaryRec ? salaryRec.base_salary : 0;
  }
  oldSal = oldSal ? parseFloat(oldSal) : 0;
  const newSal = newSalary !== undefined && newSalary !== null && newSalary !== '' ? parseFloat(newSalary) : null;

  const result = db.prepare(`
    INSERT INTO employee_changes (employee_id, change_type, old_department_id, new_department_id,
      old_position, new_position, old_salary, old_salary_enc, new_salary, new_salary_enc,
      effective_date, reason, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    parseInt(employeeId),
    changeType,
    oldDeptId,
    toDepartmentId ? parseInt(toDepartmentId) : null,
    oldPos || null,
    toPosition || null,
    oldSal,
    encrypt(String(oldSal)),
    newSal,
    newSal !== null ? encrypt(String(newSal)) : null,
    effectiveDate,
    reason || null,
    'pending',
    req.userId,
    now,
    now
  );

  success(res, { id: result.lastInsertRowid }, '异动申请提交成功', 201);
});

/**
 * PUT /api/employee-changes/:id/approve - 审批通过（联动更新员工档案）
 */
router.put('/:id/approve', requireAdminOrHR, operationLogger('员工异动'), (req, res) => {
  const id = parseInt(req.params.id);
  const change = db.prepare('SELECT * FROM employee_changes WHERE id = ?').get(id);
  if (!change) return notFound(res, '异动记录不存在');
  if (change.status !== 'pending') return badRequest(res, '该申请已审批，无法重复操作');

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(change.employee_id);
  if (!emp) return notFound(res, '关联员工不存在');

  // 通过姓名查找关联的user_id（employees表无user_id字段，通过real_name匹配）
  const userRec = db.prepare('SELECT id FROM users WHERE real_name = ?').get(emp.name);
  const empUserId = userRec ? userRec.id : null;

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // 解密new_salary用于薪资表更新
  let newSalaryVal = change.new_salary;
  if (change.new_salary_enc) {
    try { newSalaryVal = parseFloat(decrypt(change.new_salary_enc)) || change.new_salary; } catch(e) {}
  }

  // 使用事务保证数据一致性
  const executeApproval = db.transaction(() => {
    // 1. 更新异动记录状态
    db.prepare(`
      UPDATE employee_changes SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(req.userId, now, now, id);

    // 2. 联动更新员工档案
    let newDeptId = emp.department_id;
    let newPos = emp.position;
    let newStatus = emp.status;

    if (change.new_department_id) {
      newDeptId = change.new_department_id;
    }
    if (change.new_position) {
      newPos = change.new_position;
    }

    // 转正时更新员工状态为 active
    if (change.change_type === 'regularization') {
      newStatus = 'active';
    }

    db.prepare(`
      UPDATE employees SET department_id = ?, position = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newDeptId, newPos, newStatus, now, emp.id);

    // 3. 如果有薪资变动，更新薪资表
    if (newSalaryVal !== null && newSalaryVal !== undefined) {
      // 将旧薪资置为 inactive
      db.prepare("UPDATE salaries SET status = 'inactive', updated_at = ? WHERE employee_id = ? AND status = 'active'")
        .run(now, emp.id);

      // 创建新的薪资记录
      db.prepare(`
        INSERT INTO salaries (employee_id, user_id, base_salary, base_salary_enc, position_salary,
          position_salary_enc, performance_bonus, performance_bonus_enc, allowance, allowance_enc,
          social_insurance, social_insurance_enc, housing_fund, housing_fund_enc, tax, tax_enc,
          effective_date, status, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        emp.id, empUserId,
        newSalaryVal, encrypt(String(newSalaryVal)),
        0, encrypt('0'),
        0, encrypt('0'),
        0, encrypt('0'),
        0, encrypt('0'),
        0, encrypt('0'),
        0, encrypt('0'),
        change.effective_date, 'active',
        `异动调薪（${change.change_type}）`, now, now
      );
    }
  });

  try {
    executeApproval();
    success(res, null, '审批通过，员工档案已同步更新');
  } catch (err) {
    console.error('异动审批事务失败:', err);
    return fail(res, '审批失败：' + err.message, 500);
  }
});

/**
 * PUT /api/employee-changes/:id/reject - 审批驳回
 */
router.put('/:id/reject', requireAdminOrHR, operationLogger('员工异动'), (req, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const change = db.prepare('SELECT * FROM employee_changes WHERE id = ?').get(id);
  if (!change) return notFound(res, '异动记录不存在');
  if (change.status !== 'pending') return badRequest(res, '该申请已审批，无法重复操作');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare(`
    UPDATE employee_changes SET status = 'rejected', approved_by = ?, approved_at = ?,
      reject_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(req.userId, now, reason || null, now, id);

  success(res, null, '已驳回');
});

/**
 * PUT /api/employee-changes/:id/cancel - 取消申请
 */
router.put('/:id/cancel', operationLogger('员工异动'), (req, res) => {
  const id = parseInt(req.params.id);
  const change = db.prepare('SELECT * FROM employee_changes WHERE id = ?').get(id);
  if (!change) return notFound(res, '异动记录不存在');
  if (change.status !== 'pending') return badRequest(res, '已审批的申请无法取消');
  // 只有创建者或admin/hr可取消
  if (change.created_by !== req.userId && !['admin', 'hr'].includes(req.userRole)) {
    return fail(res, '无权限操作', 403);
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare(`
    UPDATE employee_changes SET status = 'cancelled', updated_at = ? WHERE id = ?
  `).run(now, id);

  success(res, null, '已取消');
});

module.exports = router;
