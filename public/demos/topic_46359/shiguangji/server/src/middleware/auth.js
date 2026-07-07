// 认证中间件
// 提供 JWT token 验证与权限校验

const jwt = require('jsonwebtoken');

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'shiguangji_secret_key_2026';

/**
 * 验证 JWT token 中间件
 * 从 Authorization header 读取 Bearer token，验证后将用户信息挂到 req.user
 */
function authRequired(req, res, next) {
  try {
    // 从请求头获取 Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌，请先登录'
      });
    }

    // 提取 token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效'
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 将用户信息挂到 req 对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期，请重新登录'
      });
    }
    return res.status(401).json({
      success: false,
      message: '认证失败：' + error.message
    });
  }
}

/**
 * 管理员权限校验中间件
 * 在 authRequired 基础上检查 role === 'admin'
 */
function adminRequired(req, res, next) {
  // 先执行认证校验
  authRequired(req, res, () => {
    // 检查是否为管理员
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      });
    }
    next();
  });
}

module.exports = { authRequired, adminRequired, JWT_SECRET };
