const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * JWT Access Token 认证中间件
 * 从 Authorization: Bearer <token> 中提取并验证 token
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      data: null
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { expiresIn: '1h' });
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '令牌已过期',
        data: null
      });
    }
    return res.status(401).json({
      code: 401,
      message: '无效的令牌',
      data: null
    });
  }
}

/**
 * 验证 Refresh Token 的中间件
 */
function refreshToken(req, res, next) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({
      code: 401,
      message: '未提供刷新令牌',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        code: 401,
        message: '无效的刷新令牌',
        data: null
      });
    }
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({
      code: 401,
      message: '刷新令牌已过期或无效',
      data: null
    });
  }
}

/**
 * 可选认证 - 如果有token就解析，没有也不报错
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.userId, role: decoded.role };
    } catch (err) {
      // 忽略错误，不设置 req.user
    }
  }
  next();
}

module.exports = { auth, refreshToken, optionalAuth };
