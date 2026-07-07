const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DB_PATH = path.join(__dirname, '../data/db.json');
const JWT_SECRET = 'ai-seckill-system-secret-key-2024';
const JWT_EXPIRES_IN = '1h';

let db = null;

function loadDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    db = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      db = {
        users: [],
        products: [],
        orders: [],
        riskLogs: [],
        userActions: []
      };
      saveDb();
    } else {
      throw err;
    }
  }
  return db;
}

function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('保存数据库失败:', err);
  }
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function generateId(prefix = 'id') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
  
  req.user = decoded;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  next();
}

module.exports = {
  loadDb,
  saveDb,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateId,
  requireAuth,
  requireAdmin,
  getDb: () => db
};
