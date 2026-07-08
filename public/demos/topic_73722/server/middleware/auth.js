const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }
}

function scientistOnly(req, res, next) {
  if (req.user.role !== 'scientist') {
    return res.status(403).json({ error: '仅科学家/研究机构用户可执行此操作' });
  }
  next();
}

module.exports = { authMiddleware, scientistOnly };