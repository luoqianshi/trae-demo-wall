/**
 * 操作日志路由
 */
const express = require('express');
const db = require('../utils/db');
const { success, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/logs - 操作日志列表（仅管理员/HR可查看）
 */
router.get('/', requireAdminOrHR, operationLogger('操作日志'), (req, res) => {
  const { pageNum = 1, pageSize = 20, module = '', userId = '', keyword = '', startDate, endDate } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (module) { where += ' AND l.module = ?'; params.push(module); }
  if (userId) { where += ' AND l.user_id = ?'; params.push(parseInt(userId)); }
  if (keyword) {
    where += ' AND (l.content LIKE ? OR l.username LIKE ? OR l.real_name LIKE ? OR l.ip LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (startDate) { where += ' AND l.created_at >= ?'; params.push(startDate + ' 00:00:00'); }
  if (endDate) { where += ' AND l.created_at <= ?'; params.push(endDate + ' 23:59:59'); }

  const total = db.prepare(`SELECT COUNT(*) as total FROM operation_logs l ${where}`).get(...params).total;
  const list = db.prepare(`
    SELECT l.* FROM operation_logs l
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

/**
 * GET /api/logs/modules - 获取所有模块列表
 */
router.get('/modules/list', requireAdminOrHR, (req, res) => {
  const modules = db.prepare('SELECT DISTINCT module FROM operation_logs ORDER BY module').all();
  success(res, modules.map(m => m.module));
});

/**
 * GET /api/logs/stats - 日志统计
 */
router.get('/stats/summary', requireAdminOrHR, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCount = db.prepare("SELECT COUNT(*) as count FROM operation_logs WHERE date(created_at) = date('now', 'localtime')").get().count;
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get().count;
  const failCount = db.prepare('SELECT COUNT(*) as count FROM operation_logs WHERE status = 0').get().count;
  const userCount = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM operation_logs WHERE user_id IS NOT NULL').get().count;

  success(res, {
    todayCount,
    totalCount,
    failCount,
    userCount
  });
});

/**
 * GET /api/logs/my - 获取当前用户的操作日志
 */
router.get('/my/list', operationLogger('操作日志'), (req, res) => {
  const { pageNum = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  const total = db.prepare('SELECT COUNT(*) as total FROM operation_logs WHERE user_id = ?').get(req.userId).total;
  const list = db.prepare(`
    SELECT * FROM operation_logs WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.userId, parseInt(pageSize), offset);

  page(res, list, total, pageNum, pageSize);
});

module.exports = router;
