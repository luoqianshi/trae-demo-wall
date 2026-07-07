/**
 * 用户管理路由
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { encrypt, decrypt, maskSensitiveData } = require('../utils/crypto');
const { success, fail, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR, requireAdmin } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();

// 所有接口需要认证
router.use(authenticate);

/**
 * GET /api/users
 * 获取用户列表（分页）
 */
router.get('/', requireAdminOrHR, operationLogger('用户管理'), (req, res) => {
  const { pageNum = 1, pageSize = 10, keyword = '', role = '', status = '', departmentId = '' } = req.query;
  const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (role) {
    where += ' AND u.role = ?';
    params.push(role);
  }
  if (status !== '') {
    where += ' AND u.status = ?';
    params.push(parseInt(status));
  }
  if (departmentId) {
    where += ' AND u.department_id = ?';
    params.push(parseInt(departmentId));
  }

  // 普通员工只能看自己的信息
  if (req.userRole === 'employee') {
    where += ' AND u.id = ?';
    params.push(req.userId);
  }

  const countSql = `SELECT COUNT(*) as total FROM users u ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT u.id, u.username, u.real_name, u.email, u.phone, u.role, u.department_id,
           u.status, u.last_login_at, u.created_at, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

  // 解密并根据角色脱敏
  const isSensitiveRole = ['admin', 'hr'].includes(req.userRole);
  const maskedList = list.map(item => {
    const decrypted = {
      ...item,
      phone: decrypt(item.phone)
    };
    // 非admin/hr只能看脱敏数据
    if (!isSensitiveRole) {
      return maskSensitiveData(decrypted);
    }
    return decrypted;
  });

  page(res, maskedList, total, pageNum, pageSize);
});

/**
 * GET /api/users/:id
 * 获取用户详情
 */
router.get('/:id', requireAdminOrHR, operationLogger('用户管理'), (req, res) => {
  const { id } = req.params;

  // 普通员工只能看自己
  if (req.userRole === 'employee' && parseInt(id) !== req.userId) {
    return fail(res, '无权限查看其他用户信息', 403);
  }

  const user = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.email, u.phone, u.role, u.department_id,
           u.status, u.last_login_at, u.created_at, u.updated_at, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(parseInt(id));

  if (!user) {
    return notFound(res, '用户不存在');
  }

  const result = {
    ...user,
    phone: decrypt(user.phone)
  };

  // 非admin/hr脱敏
  if (!['admin', 'hr'].includes(req.userRole)) {
    return success(res, maskSensitiveData(result));
  }

  success(res, result);
});

/**
 * POST /api/users
 * 创建用户（仅admin/hr）
 */
router.post('/', requireAdminOrHR, operationLogger('用户管理'), (req, res) => {
  const { username, password, realName, email, phone, role, departmentId, status = 1 } = req.body;

  if (!username || !password) {
    return badRequest(res, '用户名和密码不能为空');
  }

  if (password.length < 6) {
    return badRequest(res, '密码长度不能少于6位');
  }

  // 检查用户名是否已存在
  const existUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existUser) {
    return fail(res, '用户名已存在', 400);
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const encryptedPhone = phone ? encrypt(phone) : null;

  const stmt = db.prepare(`
    INSERT INTO users (username, password, real_name, email, phone, role, department_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = stmt.run(
    username,
    hashedPassword,
    realName || null,
    email || null,
    encryptedPhone,
    role || 'employee',
    departmentId || null,
    status,
    now,
    now
  );

  success(res, { id: result.lastInsertRowid }, '用户创建成功', 201);
});

/**
 * PUT /api/users/:id
 * 更新用户信息
 */
router.put('/:id', requireAdminOrHR, operationLogger('用户管理'), (req, res) => {
  const { id } = req.params;
  const { realName, email, phone, role, departmentId, status } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(id));
  if (!user) {
    return notFound(res, '用户不存在');
  }

  // HR不能修改admin账号
  if (user.role === 'admin' && req.userRole !== 'admin') {
    return fail(res, '无权限修改管理员账号', 403);
  }

  const encryptedPhone = phone ? encrypt(phone) : user.phone;

  db.prepare(`
    UPDATE users SET real_name = ?, email = ?, phone = ?, role = ?, department_id = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    realName || user.real_name,
    email || user.email,
    encryptedPhone,
    role || user.role,
    departmentId !== undefined ? departmentId : user.department_id,
    status !== undefined ? status : user.status,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    parseInt(id)
  );

  success(res, null, '用户更新成功');
});

/**
 * DELETE /api/users/:id
 * 删除用户（仅admin）
 */
router.delete('/:id', requireAdmin, operationLogger('用户管理'), (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.userId) {
    return fail(res, '不能删除自己的账号', 400);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(id));
  if (!user) {
    return notFound(res, '用户不存在');
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(parseInt(id));
  success(res, null, '用户删除成功');
});

/**
 * PUT /api/users/:id/reset-password
 * 重置用户密码（admin/hr），重置为默认密码"123456"
 */
router.put('/:id/reset-password', requireAdminOrHR, operationLogger('用户管理'), (req, res) => {
  const { id } = req.params;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(id));
  if (!user) {
    return notFound(res, '用户不存在');
  }

  const defaultPassword = '123456';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(
    hashedPassword,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    parseInt(id)
  );

  success(res, null, '密码已重置为默认密码123456');
});

module.exports = router;
