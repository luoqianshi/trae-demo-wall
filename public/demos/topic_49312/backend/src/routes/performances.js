/**
 * 绩效管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { success, fail, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

// 确保评分相关字段存在
let columnsReady = false;
function ensureColumns() {
  if (columnsReady) return;
  const cols = [
    'self_score REAL',
    'self_comment TEXT',
    'manager_score REAL',
    'manager_comment TEXT',
    'total_score REAL'
  ];
  cols.forEach(colDef => {
    const colName = colDef.split(' ')[0];
    try {
      db.exec(`ALTER TABLE performances ADD COLUMN ${colDef}`);
    } catch(e) {
      // 列已存在则忽略
    }
  });
  columnsReady = true;
}
if (db.ready) {
  db.ready.then(() => ensureColumns()).catch(() => ensureColumns());
} else {
  ensureColumns();
}

/**
 * GET /api/performances - 绩效列表
 */
router.get('/', operationLogger('绩效管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, employeeId, period, status = '', periodType = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (req.userRole === 'employee') {
    where += ' AND p.user_id = ?';
    params.push(req.userId);
  } else if (employeeId) {
    where += ' AND p.employee_id = ?';
    params.push(parseInt(employeeId));
  }
  if (period) { where += ' AND p.period = ?'; params.push(period); }
  if (status) { where += ' AND p.status = ?'; params.push(status); }
  if (periodType) { where += ' AND p.period_type = ?'; params.push(periodType); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM performances p ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT p.*, e.name as employee_name, e.employee_no, u.real_name as rater_name
    FROM performances p
    LEFT JOIN employees e ON p.employee_id = e.id
    LEFT JOIN users u ON p.rated_by = u.id
    ${where}
    ORDER BY p.period DESC, p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

/**
 * GET /api/performances/:id
 */
router.get('/:id', operationLogger('绩效管理'), (req, res) => {
  const perf = db.prepare(`
    SELECT p.*, e.name as employee_name, u.real_name as rater_name
    FROM performances p
    LEFT JOIN employees e ON p.employee_id = e.id
    LEFT JOIN users u ON p.rated_by = u.id
    WHERE p.id = ?
  `).get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');
  success(res, perf);
});

/**
 * POST /api/performances - 创建绩效考核
 */
router.post('/', requireAdminOrHR, operationLogger('绩效管理'), (req, res) => {
  const { employeeId, period, periodType, kpiContent } = req.body;
  if (!employeeId || !period) return badRequest(res, '员工和考核周期不能为空');

  const exist = db.prepare('SELECT id FROM performances WHERE employee_id = ? AND period = ?').get(employeeId, period);
  if (exist) return badRequest(res, '该员工此周期已有考核记录');

  // 通过employeeId查找关联的user_id
  const empRecord = db.prepare('SELECT u.id as user_id FROM employees e, users u WHERE e.name = u.real_name AND e.id = ?').get(employeeId);
  const userId = empRecord ? empRecord.user_id : null;

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(`
    INSERT INTO performances (employee_id, user_id, period, period_type, kpi_content, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(employeeId, userId, period, periodType || 'quarterly', kpiContent || null, 'pending', now, now);

  success(res, { id: result.lastInsertRowid }, '绩效考核创建成功', 201);
});

/**
 * PUT /api/performances/:id/self-eval - 自评
 */
router.put('/:id/self-eval', operationLogger('绩效管理'), (req, res) => {
  const { selfEvaluation } = req.body;
  const perf = db.prepare('SELECT * FROM performances WHERE id = ?').get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');
  if (perf.user_id && perf.user_id !== req.userId && req.userRole === 'employee') {
    return fail(res, '无权限操作', 403);
  }

  db.prepare(`
    UPDATE performances SET self_evaluation=?, status=?, updated_at=? WHERE id=?
  `).run(selfEvaluation, 'manager_eval', dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '自评提交成功');
});

/**
 * PUT /api/performances/:id/manager-eval - 主管评
 */
router.put('/:id/manager-eval', requireAdminOrHR, operationLogger('绩效管理'), (req, res) => {
  const { score, grade, managerEvaluation } = req.body;
  const perf = db.prepare('SELECT * FROM performances WHERE id = ?').get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');

  db.prepare(`
    UPDATE performances SET score=?, grade=?, manager_evaluation=?, status=?, rated_by=?, rated_at=?, updated_at=?
    WHERE id=?
  `).run(score ?? perf.score, grade ?? perf.grade, managerEvaluation ?? perf.manager_evaluation,
    'completed', req.userId, dayjs().format('YYYY-MM-DD HH:mm:ss'),
    dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '绩效评分成功');
});

/**
 * PUT /api/performances/:id
 */
router.put('/:id', requireAdminOrHR, operationLogger('绩效管理'), (req, res) => {
  const perf = db.prepare('SELECT * FROM performances WHERE id = ?').get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');

  const { score, grade, kpiContent, selfEvaluation, managerEvaluation, hrEvaluation, status, remark } = req.body;
  db.prepare(`
    UPDATE performances SET score=?, grade=?, kpi_content=?, self_evaluation=?, manager_evaluation=?,
      hr_evaluation=?, status=?, remark=?, rated_by=?, rated_at=?, updated_at=?
    WHERE id=?
  `).run(score ?? perf.score, grade ?? perf.grade, kpiContent ?? perf.kpi_content,
    selfEvaluation ?? perf.self_evaluation, managerEvaluation ?? perf.manager_evaluation,
    hrEvaluation ?? perf.hr_evaluation, status ?? perf.status, remark ?? perf.remark,
    status === 'completed' ? req.userId : perf.rated_by,
    status === 'completed' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : perf.rated_at,
    dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '绩效更新成功');
});

/**
 * DELETE /api/performances/:id
 */
router.delete('/:id', requireAdminOrHR, operationLogger('绩效管理'), (req, res) => {
  const perf = db.prepare('SELECT * FROM performances WHERE id = ?').get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');
  db.prepare('DELETE FROM performances WHERE id = ?').run(parseInt(req.params.id));
  success(res, null, '绩效记录删除成功');
});

/**
 * PUT /api/performances/:id/self-evaluate - 员工自评
 */
router.put('/:id/self-evaluate', operationLogger('绩效管理'), (req, res) => {
  const { selfScore, selfComment } = req.body;
  const perf = db.prepare('SELECT * FROM performances WHERE id = ?').get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');

  // 权限检查：员工只能自评自己的记录
  if (perf.user_id && perf.user_id !== req.userId && req.userRole === 'employee') {
    return fail(res, '无权限操作', 403);
  }

  if (selfScore === undefined || selfScore === null) {
    return badRequest(res, '自评分数不能为空');
  }

  const score = parseFloat(selfScore);
  if (isNaN(score) || score < 0 || score > 100) {
    return badRequest(res, '自评分数必须在0-100之间');
  }

  db.prepare(`
    UPDATE performances SET self_score=?, self_comment=?, status=?, updated_at=? WHERE id=?
  `).run(score, selfComment || null, 'manager_eval', dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, null, '自评提交成功');
});

/**
 * PUT /api/performances/:id/manager-evaluate - 经理评分
 */
router.put('/:id/manager-evaluate', requireAdminOrHR, operationLogger('绩效管理'), (req, res) => {
  const { managerScore, managerComment } = req.body;
  const perf = db.prepare('SELECT * FROM performances WHERE id = ?').get(parseInt(req.params.id));
  if (!perf) return notFound(res, '绩效记录不存在');

  if (managerScore === undefined || managerScore === null) {
    return badRequest(res, '经理评分不能为空');
  }

  const mScore = parseFloat(managerScore);
  if (isNaN(mScore) || mScore < 0 || mScore > 100) {
    return badRequest(res, '经理评分必须在0-100之间');
  }

  // 计算总分：自评占30%，经理评占70%（如果有自评分数）
  let totalScore;
  if (perf.self_score !== null && perf.self_score !== undefined) {
    totalScore = (perf.self_score * 0.3 + mScore * 0.7).toFixed(2);
  } else {
    totalScore = mScore.toFixed(2);
  }

  // 根据总分计算等级
  let grade;
  const ts = parseFloat(totalScore);
  if (ts >= 90) grade = 'S';
  else if (ts >= 80) grade = 'A';
  else if (ts >= 70) grade = 'B';
  else if (ts >= 60) grade = 'C';
  else grade = 'D';

  db.prepare(`
    UPDATE performances SET manager_score=?, manager_comment=?, total_score=?, score=?, grade=?,
      status=?, rated_by=?, rated_at=?, updated_at=?
    WHERE id=?
  `).run(mScore, managerComment || null, totalScore, totalScore, grade,
    'completed', req.userId, dayjs().format('YYYY-MM-DD HH:mm:ss'),
    dayjs().format('YYYY-MM-DD HH:mm:ss'), parseInt(req.params.id));

  success(res, { totalScore, grade }, '经理评分成功');
});

module.exports = router;
