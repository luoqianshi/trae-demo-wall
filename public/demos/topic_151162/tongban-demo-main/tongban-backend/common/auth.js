const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tongban_secret_key_2024';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录', data: null });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
  }

  const user = await get('SELECT id, phone, nickname, avatar, role, status FROM users WHERE id = ?', [decoded.userId]);
  
  if (!user || user.status !== 'active') {
    return res.status(401).json({ code: 401, message: '账号不存在或已被禁用', data: null });
  }

  req.user = user;
  next();
}

async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await get('SELECT id, phone, nickname, avatar, role, status FROM users WHERE id = ?', [decoded.userId]);
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  }
  
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuth
};
