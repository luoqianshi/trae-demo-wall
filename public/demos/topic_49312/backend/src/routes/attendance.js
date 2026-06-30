/**
 * 考勤管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { success, badRequest, notFound, page } = require('../utils/response');
const { authenticate } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

/**
 * 根据 user_id 查找对应的 employee 记录（通过 users.real_name = employees.name 匹配）
 */
function findEmployeeByUserId(userId) {
  const user = db.prepare('SELECT real_name FROM users WHERE id = ?').get(userId);
  if (!user || !user.real_name) return null;
  return db.prepare('SELECT id, name, department_id FROM employees WHERE name = ?').get(user.real_name);
}

/**
 * GET /api/attendance - 考勤列表
 */
router.get('/', operationLogger('考勤管理'), (req, res) => {
  const {
    pageNum = 1, pageSize = 10,
    employeeId, departmentId,
    startDate, endDate, status, month, date
  } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  // 普通员工只能看自己的
  if (req.userRole === 'employee') {
    where += ' AND a.user_id = ?';
    params.push(req.userId);
  }
  // 部门经理只能看本部门
  if (req.userRole === 'manager') {
    where += ' AND e.department_id = ?';
    params.push(req.userDepartmentId);
  }
  // HR/Admin可以按employeeId/departmentId筛选
  if (['admin', 'hr'].includes(req.userRole)) {
    if (employeeId) {
      where += ' AND a.employee_id = ?';
      params.push(parseInt(employeeId));
    }
    if (departmentId) {
      where += ' AND e.department_id = ?';
      params.push(parseInt(departmentId));
    }
  }

  // 日期筛选
  if (date) {
    where += ' AND a.date = ?';
    params.push(date);
  }
  if (month) {
    where += ' AND a.date LIKE ?';
    params.push(`${month}%`);
  }
  if (startDate) {
    where += ' AND a.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND a.date <= ?';
    params.push(endDate);
  }
  if (status) {
    where += ' AND a.status = ?';
    params.push(status);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as total FROM attendance a
    LEFT JOIN employees e ON a.employee_id = e.id
    ${where}
  `).get(...params).total;

  const list = db.prepare(`
    SELECT a.*, e.name as employee_name, e.employee_no,
           d.name as department_name
    FROM attendance a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    ${where}
    ORDER BY a.date DESC, a.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

/**
 * POST /api/attendance/check-in - 签到
 */
router.post('/check-in', operationLogger('考勤管理'), (req, res) => {
  const { location } = req.body;
  const today = dayjs().format('YYYY-MM-DD');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // 通过user_id查找关联的员工
  const emp = findEmployeeByUserId(req.userId);
  if (!emp) {
    return badRequest(res, '未找到员工信息，请联系HR');
  }
  const employeeId = emp.id;

  // 检查今天是否已有签到记录
  const exist = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employeeId, today);

  if (exist && exist.check_in) {
    return badRequest(res, '今日已签到');
  }

  // 计算是否迟到（9:00上班）
  const workStart = dayjs().hour(9).minute(0).second(0);
  const nowTime = dayjs();
  const lateMinutes = nowTime.isAfter(workStart) ? nowTime.diff(workStart, 'minute') : 0;
  const status = lateMinutes > 0 ? 'late' : 'normal';

  if (exist) {
    db.prepare(`
      UPDATE attendance SET check_in=?, check_in_location=?, status=?, late_minutes=?, updated_at=?
      WHERE id=?
    `).run(now, location || null, status, lateMinutes, now, exist.id);
  } else {
    db.prepare(`
      INSERT INTO attendance (employee_id, user_id, date, check_in, check_in_location, status, late_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(employeeId, req.userId, today, now, location || null, status, lateMinutes, now, now);
  }

  success(res, { clockIn: now, status, lateMinutes }, '签到成功');
});

/**
 * POST /api/attendance/check-out - 签退
 */
router.post('/check-out', operationLogger('考勤管理'), (req, res) => {
  const { location } = req.body;
  const today = dayjs().format('YYYY-MM-DD');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  // 通过user_id查找关联的员工
  const emp = findEmployeeByUserId(req.userId);
  if (!emp) {
    return badRequest(res, '未找到员工信息');
  }
  const employeeId = emp.id;

  const record = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employeeId, today);
  if (!record || !record.check_in) {
    return badRequest(res, '请先签到');
  }
  if (record.check_out) {
    return badRequest(res, '今日已签退');
  }

  // 计算工作时长（18:00下班）
  const workEnd = dayjs().hour(18).minute(0).second(0);
  const nowTime = dayjs();
  const earlyMinutes = nowTime.isBefore(workEnd) ? workEnd.diff(nowTime, 'minute') : 0;
  const checkInTime = dayjs(record.check_in);
  const workHours = (nowTime - checkInTime) / (1000 * 60 * 60);

  let status = record.status;
  if (earlyMinutes > 0 && status === 'normal') status = 'early';

  db.prepare(`
    UPDATE attendance SET check_out=?, check_out_location=?, status=?, early_minutes=?, work_hours=?, updated_at=?
    WHERE id=?
  `).run(now, location || null, status, earlyMinutes, workHours.toFixed(2), now, record.id);

  success(res, { clockOut: now, workHours: workHours.toFixed(2) }, '签退成功');
});

/**
 * GET /api/attendance/stats/summary - 考勤统计汇总
 */
router.get('/stats/summary', operationLogger('考勤管理'), (req, res) => {
  const { month } = req.query;
  const targetMonth = month || dayjs().format('YYYY-MM');

  let where = "WHERE a.date LIKE ?";
  const params = [`${targetMonth}%`];

  if (req.userRole === 'employee') {
    where += ' AND a.user_id = ?';
    params.push(req.userId);
  }
  if (req.userRole === 'manager') {
    where += ' AND e.department_id = ?';
    params.push(req.userDepartmentId);
  }

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN a.status = 'normal' THEN 1 ELSE 0 END) as normal_days,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN a.status = 'early' THEN 1 ELSE 0 END) as early_days,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) as leave_days,
      COALESCE(SUM(a.overtime_hours), 0) as total_overtime,
      COALESCE(SUM(a.late_minutes), 0) as total_late_minutes
    FROM attendance a
    LEFT JOIN employees e ON a.employee_id = e.id
    ${where}
  `).get(...params);

  success(res, stats);
});

module.exports = router;
