/**
 * 离职管理路由
 * 支持：主动离职、被动离职的申请、审批、确认生效
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
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
    CREATE TABLE IF NOT EXISTS resignations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      reason TEXT,
      resignation_type TEXT DEFAULT 'voluntary',
      expected_date TEXT,
      actual_date TEXT,
      handover_to INTEGER,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at TEXT,
      reject_reason TEXT,
      confirmed_by INTEGER,
      confirmed_at TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);
  tablesReady = true;
}

// 在数据库初始化完成后创建表
db.ready.then(() => ensureTables()).catch(err => console.error('resignations表初始化失败:', err));

// 有效的离职类型
const VALID_RESIGNATION_TYPES = ['voluntary', 'involuntary'];
// 有效的状态
const VALID_STATUSES = ['pending', 'approved', 'confirmed', 'rejected', 'cancelled'];

/**
 * 将数据库返回的 snake_case 字段映射为前端使用的 camelCase 字段
 */
function mapResignationRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeNo: row.employee_no,
    departmentId: row.department_id,
    departmentName: row.department_name,
    position: row.position,
    joinDate: row.entry_date,
    reason: row.reason,
    resignationType: row.resignation_type,
    expectedDate: row.expected_date,
    actualDate: row.actual_date,
    handoverTo: row.handover_to,
    handoverToName: row.handover_to_name,
    status: row.status,
    approvedBy: row.approved_by,
    approverName: row.approver_name,
    approvedAt: row.approved_at,
    rejectReason: row.reject_reason,
    confirmedBy: row.confirmed_by,
    confirmerName: row.confirmer_name,
    confirmedAt: row.confirmed_at,
    createdBy: row.created_by,
    creatorName: row.creator_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/resignations - 离职列表（分页、筛选）
 */
router.get('/', operationLogger('离职管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, page: pageQuery = 1, employeeId, keyword = '', status = '' } = req.query;
  const currentPage = parseInt(pageNum) || parseInt(pageQuery) || 1;
  const offset = (currentPage - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (req.userRole === 'employee') {
    // 通过 users.real_name = employees.name 关联
    where += ' AND r.employee_id IN (SELECT e.id FROM employees e JOIN users u ON e.name = u.real_name WHERE u.id = ?)';
    params.push(req.userId);
  } else if (employeeId) {
    where += ' AND r.employee_id = ?';
    params.push(parseInt(employeeId));
  }
  if (keyword) {
    where += ' AND (e.name LIKE ? OR e.employee_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) { where += ' AND r.status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM resignations r LEFT JOIN employees e ON r.employee_id = e.id ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT r.*,
      e.name as employee_name, e.employee_no, e.entry_date,
      e.department_id, e.position,
      d.name as department_name,
      u.real_name as approver_name,
      cu.real_name as confirmer_name,
      h.name as handover_to_name,
      c.real_name as creator_name
    FROM resignations r
    LEFT JOIN employees e ON r.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON r.approved_by = u.id
    LEFT JOIN users cu ON r.confirmed_by = cu.id
    LEFT JOIN employees h ON r.handover_to = h.id
    LEFT JOIN users c ON r.created_by = c.id
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const result = list.map(mapResignationRow);
  pageResult(res, result, total, currentPage, pageSize);
});

/**
 * GET /api/resignations/:id - 离职详情
 */
router.get('/:id', operationLogger('离职管理'), (req, res) => {
  const record = db.prepare(`
    SELECT r.*,
      e.name as employee_name, e.employee_no, e.entry_date,
      e.department_id, e.position,
      d.name as department_name,
      u.real_name as approver_name,
      cu.real_name as confirmer_name,
      h.name as handover_to_name,
      c.real_name as creator_name
    FROM resignations r
    LEFT JOIN employees e ON r.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON r.approved_by = u.id
    LEFT JOIN users cu ON r.confirmed_by = cu.id
    LEFT JOIN employees h ON r.handover_to = h.id
    LEFT JOIN users c ON r.created_by = c.id
    WHERE r.id = ?
  `).get(parseInt(req.params.id));

  if (!record) return notFound(res, '离职记录不存在');
  success(res, mapResignationRow(record));
});

/**
 * POST /api/resignations - 提交离职申请
 */
router.post('/', requireAdminOrHR, operationLogger('离职管理'), (req, res) => {
  const { employeeId, reason, resignationType = 'voluntary', expectedDate, handoverTo } = req.body;

  if (!employeeId || !reason || !expectedDate) {
    return badRequest(res, '员工、离职原因和期望离职日期不能为空');
  }
  if (resignationType && !VALID_RESIGNATION_TYPES.includes(resignationType)) {
    return badRequest(res, '无效的离职类型');
  }

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(parseInt(employeeId));
  if (!emp) return notFound(res, '员工不存在');
  if (emp.status === 'resigned') return badRequest(res, '该员工已离职');

  // 检查是否有未完成的离职申请
  const exist = db.prepare("SELECT id FROM resignations WHERE employee_id = ? AND status IN ('pending', 'approved')").get(parseInt(employeeId));
  if (exist) return badRequest(res, '该员工已有进行中的离职申请');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(`
    INSERT INTO resignations (employee_id, reason, resignation_type, expected_date, handover_to,
      status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    parseInt(employeeId),
    reason,
    resignationType,
    expectedDate,
    handoverTo ? parseInt(handoverTo) : null,
    'pending',
    req.userId,
    now,
    now
  );

  success(res, { id: result.lastInsertRowid }, '离职申请提交成功', 201);
});

/**
 * PUT /api/resignations/:id/approve - 审批通过
 */
router.put('/:id/approve', requireAdminOrHR, operationLogger('离职管理'), (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.prepare('SELECT * FROM resignations WHERE id = ?').get(id);
  if (!record) return notFound(res, '离职记录不存在');
  if (record.status !== 'pending') return badRequest(res, '该申请已审批，无法重复操作');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare(`
    UPDATE resignations SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.userId, now, now, id);

  success(res, null, '审批通过，离职流程已启动');
});

/**
 * PUT /api/resignations/:id/reject - 审批驳回
 */
router.put('/:id/reject', requireAdminOrHR, operationLogger('离职管理'), (req, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const record = db.prepare('SELECT * FROM resignations WHERE id = ?').get(id);
  if (!record) return notFound(res, '离职记录不存在');
  if (record.status !== 'pending') return badRequest(res, '该申请已审批，无法重复操作');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare(`
    UPDATE resignations SET status = 'rejected', approved_by = ?, approved_at = ?,
      reject_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(req.userId, now, reason || null, now, id);

  success(res, null, '已驳回');
});

/**
 * PUT /api/resignations/:id/confirm - 确认离职生效
 * 联动：冻结员工账号、停止考勤、更新员工状态为resigned
 */
router.put('/:id/confirm', requireAdminOrHR, operationLogger('离职管理'), (req, res) => {
  const id = parseInt(req.params.id);
  const { actualDate } = req.body;
  const record = db.prepare('SELECT * FROM resignations WHERE id = ?').get(id);
  if (!record) return notFound(res, '离职记录不存在');
  if (record.status !== 'approved') return badRequest(res, '只有已审批通过的申请才能确认离职');

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(record.employee_id);
  if (!emp) return notFound(res, '关联员工不存在');

  // 通过姓名查找关联的user_id（employees表无user_id字段，通过real_name匹配）
  const userRec = db.prepare('SELECT id FROM users WHERE real_name = ?').get(emp.name);
  const empUserId = userRec ? userRec.id : null;

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const actual = actualDate || dayjs().format('YYYY-MM-DD');

  // 使用事务保证数据一致性
  const executeConfirm = db.transaction(() => {
    // 1. 更新离职记录状态
    db.prepare(`
      UPDATE resignations SET status = 'confirmed', confirmed_by = ?, confirmed_at = ?,
        actual_date = ?, updated_at = ?
      WHERE id = ?
    `).run(req.userId, now, actual, now, id);

    // 2. 更新员工状态为 resigned，记录离职日期
    db.prepare(`
      UPDATE employees SET status = 'resigned', leave_date = ?, updated_at = ?
      WHERE id = ?
    `).run(actual, now, emp.id);

    // 3. 冻结关联用户账号（设置 status = 0 禁用）
    if (empUserId) {
      db.prepare(`
        UPDATE users SET status = 0, updated_at = ? WHERE id = ?
      `).run(now, empUserId);
    }

    // 4. 将该员工的考勤记录标记为已离职状态（如有未来日期的打卡记录可删除/标记）
    // 停止后续考勤：将该员工在离职日期之后的排班/考勤记录标记为 leave/inactive
    db.prepare(`
      UPDATE attendance SET status = 'leave', remark = '已离职', updated_at = ?
      WHERE employee_id = ? AND date >= ? AND status IN ('normal', 'late', 'early', 'absent')
    `).run(now, emp.id, actual);

    // 5. 将该员工的有效薪资记录置为 inactive
    db.prepare(`
      UPDATE salaries SET status = 'inactive', updated_at = ?
      WHERE employee_id = ? AND status = 'active'
    `).run(now, emp.id);
  });

  try {
    executeConfirm();
    success(res, null, '离职已生效，员工账号已冻结，考勤和薪资已停止');
  } catch (err) {
    console.error('确认离职事务失败:', err);
    return fail(res, '操作失败：' + err.message, 500);
  }
});

/**
 * PUT /api/resignations/:id/cancel - 取消申请
 */
router.put('/:id/cancel', operationLogger('离职管理'), (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.prepare('SELECT * FROM resignations WHERE id = ?').get(id);
  if (!record) return notFound(res, '离职记录不存在');
  if (!['pending', 'approved'].includes(record.status)) {
    return badRequest(res, '当前状态无法取消');
  }
  if (record.status === 'approved') {
    // 已审批的只有admin/hr可以取消
    if (!['admin', 'hr'].includes(req.userRole)) {
      return fail(res, '无权限操作已审批的申请', 403);
    }
  } else {
    // pending状态，创建者或admin/hr可以取消
    if (record.created_by !== req.userId && !['admin', 'hr'].includes(req.userRole)) {
      return fail(res, '无权限操作', 403);
    }
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare(`
    UPDATE resignations SET status = 'cancelled', updated_at = ? WHERE id = ?
  `).run(now, id);

  success(res, null, '已取消');
});

module.exports = router;
