/**
 * 认证中间件
 * 验证JWT Token并解析用户信息
 */

const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'digital-talent-platform-secret-key-2026';
const JWT_EXPIRES = '7d';

/**
 * 生成JWT Token
 * @param {Object} payload 用户数据
 * @returns {string} Token字符串
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * 验证Token中间件
 * 解析token并将用户信息附加到req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 验证用户是否仍然存在
    const user = db.findById('users', decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });
    }
    req.user = {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      orgName: user.orgName
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }
}

/**
 * 角色权限检查中间件
 * @param  {...string} allowedRoles 允许的角色
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `权限不足，需要以下角色之一: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = {
  generateToken,
  authenticate,
  requireRole,
  JWT_SECRET
};
