/**
 * 认证中间件
 * 创建日期: 2026-07-10
 */

const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const response = require('../utils/response');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(response.unauthorized('请先登录'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(response.unauthorized('Token已过期'));
    }
    return res.status(401).json(response.unauthorized('Token无效'));
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json(response.forbidden('权限不足'));
    }
    next();
  };
};

module.exports = { authenticate, requireRole };