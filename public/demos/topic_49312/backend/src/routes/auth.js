/**
 * 认证路由 - 登录、登出、获取当前用户信息、修改密码
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { decrypt, maskSensitiveData } = require('../utils/crypto');
const { success, fail, badRequest } = require('../utils/response');
const { generateToken, authenticate } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', operationLogger('认证'), (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return badRequest(res, '用户名和密码不能为空');
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = 1').get(username);

  if (!user) {
    return fail(res, '用户名或密码错误', 401);
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return fail(res, '用户名或密码错误', 401);
  }

  // 更新最后登录时间
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    user.id
  );

  // 生成Token
  const token = generateToken({
    id: user.id,
    username: user.username,
    role: user.role
  });

  // 返回用户信息（解密手机号）
  const userInfo = {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    email: user.email,
    phone: decrypt(user.phone),
    role: user.role,
    departmentId: user.department_id,
    lastLoginAt: user.last_login_at
  };

  success(res, {
    token,
    user: userInfo
  }, '登录成功');
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get('/me', authenticate, operationLogger('认证'), (req, res) => {
  const user = db.prepare(`
    SELECT u.*, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(req.userId);

  if (!user) {
    return fail(res, '用户不存在', 404);
  }

  const userInfo = {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    email: user.email,
    phone: decrypt(user.phone),
    role: user.role,
    departmentId: user.department_id,
    departmentName: user.department_name,
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at
  };

  success(res, userInfo);
});

/**
 * PUT /api/auth/password
 * 修改密码
 */
router.put('/password', authenticate, operationLogger('认证'), (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return badRequest(res, '旧密码和新密码不能为空');
  }

  if (newPassword.length < 6) {
    return badRequest(res, '新密码长度不能少于6位');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return fail(res, '旧密码错误', 400);
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(
    hashedPassword,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    req.userId
  );

  success(res, null, '密码修改成功');
});

/**
 * POST /api/auth/logout
 * 登出（前端清除token即可，这里仅记录日志）
 */
router.post('/logout', authenticate, operationLogger('认证'), (req, res) => {
  success(res, null, '登出成功');
});

module.exports = router;
