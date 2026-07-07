/**
 * 请假管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { success, fail, badRequest, notFound, page } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();

// 所有接口需要认证
router.use(authenticate);

// 状态值标准化：兼容数字和字符串
const LEAVE_PENDING = 0;
function normStatus(s) {
  if (typeof s === 'number') return s;
  return { pending: 0, approved: 1, rejected: 2, cancelled: 3 }[s] ?? 0;
}
function isPending(s) { return normStatus(s) === LEAVE_PENDING; }

/**
 * 检查当前用户是否有权审批指定请假记录
 * admin/hr 可以审批所有
 * manager 只能审批本部门的请假
 */
function canApproveLeave(req, leave) {
  if (['admin', 'hr'].includes(req.userRole)) {
    return true;
  }
  if (req.userRole === 'manager') {
    // 查询请假员工的部门
    const emp = db.prepare('SELECT department_id FROM employees WHERE id = ?').get(leave.employee_id);
    return emp && emp.department_id === req.userDepartmentId;
  }
  return false;
}

/**
 * GET /api/leaves
 * 获取请假列表（分页）
 */
router.get('/', operationLogger('请假管理'), (req, res) => {
  // 兼容前端传 type 参数（作为 leaveType 的别名）
  const {
    pageNum = 1,
    pageSize = 10,
    status = '',
    leaveType = '',
    type = '',
    employeeId = '',
    departmentId = '',
    startDate = '',
    endDate = ''
  } = req.query;
  const finalLeaveType = leaveType || type;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (status !== '' && status !== null && status !== undefined) {
    // 支持数字状态(0,1,2)和字符串状态(pending,approved,rejected,cancelled)
    let statusVal = status;
    if (status === 'pending') statusVal = 0;
    else if (status === 'approved') statusVal = 1;
    else if (status === 'rejected') statusVal = 2;
    else if (status === 'cancelled') statusVal = 3;
    where += ' AND l.status = ?';
    params.push(parseInt(statusVal));
  }
  if (finalLeaveType) {
    where += ' AND l.leave_type = ?';
    params.push(finalLeaveType);
  }
  if (employeeId) {
    where += ' AND l.employee_id = ?';
    params.push(parseInt(employeeId));
  }
  if (departmentId) {
    where += ' AND e.department_id = ?';
    params.push(parseInt(departmentId));
  }
  if (startDate) {
    where += ' AND l.start_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND l.end_date <= ?';
    params.push(endDate);
  }

  // 普通员工只能看自己的请假记录
  if (req.userRole === 'employee') {
    where += ' AND l.employee_id IN (SELECT id FROM employees WHERE name = (SELECT real_name FROM users WHERE id = ?))';
    params.push(req.userId);
  }
  // 部门经理只能看本部门的请假记录
  if (req.userRole === 'manager') {
    where += ' AND e.department_id = ?';
    params.push(req.userDepartmentId);
  }

  const countSql = `SELECT COUNT(*) as total FROM leaves l LEFT JOIN employees e ON l.employee_id = e.id ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  const list = db.prepare(`
    SELECT l.*, e.name as employee_name, e.employee_no, e.department_id,
           d.name as department_name,
           u.real_name as approver_name, e.name as applicant_name
    FROM leaves l
    LEFT JOIN employees e ON l.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON l.approved_by = u.id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  // 统一状态为数字（兼容种子数据中的字符串状态）
  const statusMap = { pending: 0, approved: 1, rejected: 2, cancelled: 3 };
  const normalizedList = list.map(item => {
    if (typeof item.status === 'string') {
      item.status = statusMap[item.status] ?? 0;
    }
    return item;
  });

  page(res, normalizedList, total, pageNum, pageSize);
});

/**
 * GET /api/leaves/:id
 * 获取请假详情
 */
router.get('/:id', operationLogger('请假管理'), (req, res) => {
  const { id } = req.params;

  const leave = db.prepare(`
    SELECT l.*, e.name as employee_name, e.employee_no, e.department_id,
           d.name as department_name,
           u.real_name as approver_name
    FROM leaves l
    LEFT JOIN employees e ON l.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON l.approved_by = u.id
    WHERE l.id = ?
  `).get(parseInt(id));

  if (!leave) {
    return notFound(res, '请假记录不存在');
  }

  // 权限检查：普通员工只能看自己的（通过姓名匹配）
  if (req.userRole === 'employee') {
    const emp = db.prepare('SELECT name FROM employees WHERE id = ?').get(leave.employee_id);
    const curUser = db.prepare('SELECT real_name FROM users WHERE id = ?').get(req.userId);
    if (!emp || !curUser || emp.name !== curUser.real_name) {
      return fail(res, '无权限查看此请假记录', 403);
    }
  }

  success(res, leave);
});

/**
 * POST /api/leaves
 * 提交请假申请
 */
router.post('/', operationLogger('请假管理'), (req, res) => {
  let { employeeId, leaveType, type, startDate, endDate, reason } = req.body;

  // 兼容前端传 type 作为 leaveType
  leaveType = leaveType || type;

  // 如果没有传employeeId，尝试从当前用户获取
  if (!employeeId) {
    const user = db.prepare('SELECT real_name FROM users WHERE id = ?').get(req.userId);
    if (user && user.real_name) {
      const emp = db.prepare('SELECT id FROM employees WHERE name = ?').get(user.real_name);
      if (emp) employeeId = emp.id;
    }
  }

  if (!employeeId || !leaveType || !startDate || !endDate) {
    return badRequest(res, '员工、请假类型、开始日期、结束日期不能为空');
  }

  // 检查员工是否存在
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(parseInt(employeeId));
  if (!employee) {
    return notFound(res, '员工不存在');
  }

  // 普通员工只能为自己提交请假（通过姓名匹配）
  if (req.userRole === 'employee') {
    const currentUser = db.prepare('SELECT real_name FROM users WHERE id = ?').get(req.userId);
    if (!currentUser || currentUser.real_name !== employee.name) {
      return fail(res, '只能为自己提交请假申请', 403);
    }
  }

  // 计算请假天数
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = end.diff(start, 'day') + 1;

  if (days <= 0) {
    return badRequest(res, '结束日期必须大于等于开始日期');
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const stmt = db.prepare(`
    INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days, reason, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  const result = stmt.run(
    parseInt(employeeId),
    leaveType,
    startDate,
    endDate,
    days,
    reason || '',
    now,
    now
  );

  success(res, { id: result.lastInsertRowid }, '请假申请提交成功', 201);
});

/**
 * PUT /api/leaves/:id
 * 更新请假申请（仅待审批状态可修改）
 */
router.put('/:id', operationLogger('请假管理'), (req, res) => {
  const { id } = req.params;
  const { leaveType, type, startDate, endDate, reason } = req.body;
  const finalLeaveType = leaveType || type;

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(parseInt(id));
  if (!leave) {
    return notFound(res, '请假记录不存在');
  }

  // 只有待审批状态可以修改
  if (!isPending(leave.status)) {
    return fail(res, '只能修改待审批的请假申请', 400);
  }

  // 权限检查
  if (req.userRole === 'employee') {
    const emp = db.prepare('SELECT name FROM employees WHERE id = ?').get(leave.employee_id);
    const curUser = db.prepare('SELECT real_name FROM users WHERE id = ?').get(req.userId);
    if (!emp || !curUser || emp.name !== curUser.real_name) {
      return fail(res, '只能修改自己的请假申请', 403);
    }
  }

  let days = leave.days;
  if (startDate && endDate) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    days = end.diff(start, 'day') + 1;
    if (days <= 0) {
      return badRequest(res, '结束日期必须大于等于开始日期');
    }
  }

  db.prepare(`
    UPDATE leaves SET leave_type = ?, start_date = ?, end_date = ?, days = ?, reason = ?, updated_at = ?
    WHERE id = ?
  `).run(
    finalLeaveType || leave.leave_type,
    startDate || leave.start_date,
    endDate || leave.end_date,
    days,
    reason !== undefined ? reason : leave.reason,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    parseInt(id)
  );

  success(res, null, '请假申请更新成功');
});

/**
 * PUT /api/leaves/:id/approve
 * 审批请假（通过或驳回） - 支持action参数或单独调用
 * body: { action: 'approve'|'reject', reason?: string, remark?: string }
 */
router.put('/:id/approve', operationLogger('请假管理'), (req, res) => {
  const { id } = req.params;
  const { action = 'approve', reason = '', remark = '' } = req.body;
  const rejectReason = reason || remark || '';

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(parseInt(id));
  if (!leave) {
    return notFound(res, '请假记录不存在');
  }

  if (!isPending(leave.status)) {
    return fail(res, '只能审批待审批的请假申请', 400);
  }

  // 权限检查
  if (!canApproveLeave(req, leave)) {
    return fail(res, '无权限审批此请假申请', 403);
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  if (action === 'reject') {
    db.prepare('UPDATE leaves SET status = 2, approved_by = ?, approved_at = ?, remark = ?, updated_at = ? WHERE id = ?').run(
      req.userId,
      now,
      rejectReason,
      now,
      parseInt(id)
    );
    success(res, null, '驳回成功');
  } else {
    db.prepare('UPDATE leaves SET status = 1, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?').run(
      req.userId,
      now,
      now,
      parseInt(id)
    );
    success(res, null, '审批通过成功');
  }
});

/**
 * PUT /api/leaves/:id/reject
 * 审批驳回（便捷路由，等价于 approve?action=reject）
 */
router.put('/:id/reject', operationLogger('请假管理'), (req, res) => {
  const { id } = req.params;
  const { reason = '', remark = '' } = req.body;
  const rejectReason = reason || remark || '';

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(parseInt(id));
  if (!leave) {
    return notFound(res, '请假记录不存在');
  }

  if (!isPending(leave.status)) {
    return fail(res, '只能审批待审批的请假申请', 400);
  }

  if (!canApproveLeave(req, leave)) {
    return fail(res, '无权限审批此请假申请', 403);
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare('UPDATE leaves SET status = 2, approved_by = ?, approved_at = ?, remark = ?, updated_at = ? WHERE id = ?').run(
    req.userId,
    now,
    rejectReason,
    now,
    parseInt(id)
  );

  success(res, null, '驳回成功');
});

/**
 * DELETE /api/leaves/:id
 * 删除/撤销请假申请（仅待审批状态且本人或管理员可删除）
 */
router.delete('/:id', operationLogger('请假管理'), (req, res) => {
  const { id } = req.params;

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(parseInt(id));
  if (!leave) {
    return notFound(res, '请假记录不存在');
  }

  // 普通员工只能删除自己的待审批请假
  if (req.userRole === 'employee') {
    const emp = db.prepare('SELECT name FROM employees WHERE id = ?').get(leave.employee_id);
    const curUser = db.prepare('SELECT real_name FROM users WHERE id = ?').get(req.userId);
    if (!emp || !curUser || emp.name !== curUser.real_name) {
      return fail(res, '只能撤销自己的请假申请', 403);
    }
    if (!isPending(leave.status)) {
      return fail(res, '只能撤销待审批的请假申请', 400);
    }
  }
  // manager只能撤销本部门员工的待审批请假
  if (req.userRole === 'manager') {
    const emp = db.prepare('SELECT department_id FROM employees WHERE id = ?').get(leave.employee_id);
    if (!emp || emp.department_id !== req.userDepartmentId) {
      return fail(res, '只能撤销本部门员工的请假申请', 403);
    }
  }

  db.prepare('DELETE FROM leaves WHERE id = ?').run(parseInt(id));
  success(res, null, '请假记录删除成功');
});

module.exports = router;
