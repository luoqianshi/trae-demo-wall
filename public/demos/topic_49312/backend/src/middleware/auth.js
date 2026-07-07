/**
 * JWT认证中间件 & 权限控制中间件
 */
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { unauthorized, forbidden } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'hr-system-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 生成JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWT认证中间件 - 验证用户是否登录
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, '请先登录');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 从数据库查询用户最新信息
    const user = db.prepare('SELECT id, username, real_name, email, role, department_id, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return unauthorized(res, '用户不存在');
    }

    if (user.status !== 1) {
      return unauthorized(res, '账号已被禁用');
    }

    // 将用户信息挂载到req对象
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.userDepartmentId = user.department_id || null;

    // 对于manager/employee角色，如果users表中department_id为空，尝试从employees表获取
    if (!req.userDepartmentId && ['manager', 'employee'].includes(user.role)) {
      const emp = db.prepare('SELECT department_id FROM employees WHERE name = ?').get(user.real_name);
      if (emp) {
        req.userDepartmentId = emp.department_id;
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, '登录已过期，请重新登录');
    }
    return unauthorized(res, '无效的token');
  }
}

/**
 * 可选认证中间件 - 有token则解析，没有也不拦截
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, real_name, email, role, department_id, status FROM users WHERE id = ?').get(decoded.id);
      if (user && user.status === 1) {
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;
      }
    } catch (e) {
      // token无效时忽略
    }
  }
  next();
}

/**
 * 权限控制中间件 - 角色权限校验
 * @param  {...string} roles 允许的角色列表
 * 角色层级: admin > hr > manager > employee
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, '请先登录');
    }

    // admin拥有所有权限
    if (req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(res, '无权限执行此操作');
    }

    next();
  };
}

/**
 * 权限控制 - 管理员或HR
 */
function requireAdminOrHR(req, res, next) {
  if (!req.user) {
    return unauthorized(res, '请先登录');
  }
  if (['admin', 'hr'].includes(req.user.role)) {
    return next();
  }
  return forbidden(res, '仅管理员或HR可执行此操作');
}

/**
 * 权限控制 - 仅管理员
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return unauthorized(res, '请先登录');
  }
  if (req.user.role !== 'admin') {
    return forbidden(res, '仅管理员可执行此操作');
  }
  next();
}

/**
 * 权限控制 - 管理员、HR或经理（只读查看权限）
 * 员工不可访问管理类数据
 */
function requireAdminOrHROrManager(req, res, next) {
  if (!req.user) {
    return unauthorized(res, '请先登录');
  }
  if (['admin', 'hr', 'manager'].includes(req.user.role)) {
    return next();
  }
  return forbidden(res, '无权限访问');
}

/**
 * 权限控制 - 管理员或HR（写操作权限）
 */
function requireAdminOrHRWrite(req, res, next) {
  if (!req.user) {
    return unauthorized(res, '请先登录');
  }
  if (['admin', 'hr'].includes(req.user.role)) {
    return next();
  }
  return forbidden(res, '仅管理员或HR可执行此操作');
}

/**
 * 获取客户端真实IP
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : '') ||
    '127.0.0.1';
}

module.exports = {
  generateToken,
  authenticate,
  optionalAuth,
  requireRoles,
  requireAdminOrHR,
  requireAdminOrHROrManager,
  requireAdminOrHRWrite,
  requireAdmin,
  getClientIP,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
