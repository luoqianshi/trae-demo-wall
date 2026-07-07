const express = require('express');
const router = express.Router();
const { loadDb, saveDb, hashPassword, comparePassword, generateToken, generateId, requireAuth, requireAdmin } = require('../utils/db');

loadDb();

router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }
  
  const db = require('../utils/db').getDb();
  
  if (db.users.some(u => u.username === username)) {
    return res.status(400).json({ code: 400, message: '用户名已存在' });
  }
  
  const hourKey = Math.floor(Date.now() / 3600000);
  if (!ipRegisterCounts[clientIp]) {
    ipRegisterCounts[clientIp] = { count: 0, hour: hourKey };
  }
  
  if (ipRegisterCounts[clientIp].hour !== hourKey) {
    ipRegisterCounts[clientIp] = { count: 1, hour: hourKey };
  } else {
    ipRegisterCounts[clientIp].count++;
    if (ipRegisterCounts[clientIp].count > MAX_REGISTERS_PER_IP_HOUR) {
      return res.status(403).json({ code: 403, message: '检测到异常注册行为，请稍后再试' });
    }
  }
  
  const newUser = {
    id: generateId('u'),
    username,
    password: hashPassword(password),
    email: email || '',
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    registeredIp: clientIp
  };
  
  db.users.push(newUser);
  saveDb();
  
  res.json({ code: 200, message: '注册成功', data: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

const ipLoginMap = {};
const MAX_LOGINS_PER_IP = 1;
const MAX_REGISTERS_PER_IP_HOUR = 100;
const ipRegisterCounts = {};

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }
  
  const db = require('../utils/db').getDb();
  const user = db.users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
  
  if (!comparePassword(password, user.password)) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
  
  if (user.status === 'banned') {
    return res.status(403).json({ 
      code: 403, 
      message: '账号已被封禁，如有疑问请联系管理员',
      bannedAt: user.bannedAt,
      bannedReason: user.bannedReason
    });
  }
  
  const riskModule = require('./risk');
  
  if (!ipLoginMap[clientIp]) {
    ipLoginMap[clientIp] = [];
  }
  
  if (!ipLoginMap[clientIp].includes(user.id)) {
    ipLoginMap[clientIp].push(user.id);
  }
  
  const token = generateToken(user.id, user.role);
  
  riskModule.logUserAction(user.id, '登录');
  riskModule.updateOnlineUser(user.id, clientIp, req);
  
  res.json({ 
    code: 200, 
    message: '登录成功', 
    data: { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      status: user.status,
      token 
    } 
  });
});

router.get('/me', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const user = db.users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  res.json({ 
    code: 200, 
    data: { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      email: user.email 
    } 
  });
});

router.get('/list', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const riskModule = require('./risk');
  
  const users = db.users.map(u => {
    const userActions = db.userActions.filter(a => a.userId === u.id);
    const userRiskLogs = db.riskLogs.filter(r => r.userId === u.id);
    const userOrders = db.orders.filter(o => o.userId === u.id);
    
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email,
      status: u.status || 'active',
      bannedAt: u.bannedAt,
      bannedReason: u.bannedReason,
      createdAt: u.createdAt,
      stats: {
        totalActions: userActions.length,
        riskLogs: userRiskLogs.length,
        totalOrders: userOrders.length,
        riskScore: u.role === 'admin' ? 0 : riskModule.getRiskScore(u.id),
        isOnline: riskModule.isUserOnline(u.id)
      }
    };
  });
  
  res.json({ code: 200, data: users });
});

router.get('/:id', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const riskModule = require('./risk');
  const userId = req.params.id;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  const userActions = db.userActions.filter(a => a.userId === userId);
  const userRiskLogs = db.riskLogs.filter(r => r.userId === userId);
  const userOrders = db.orders.filter(o => o.userId === userId);
  
  res.json({ 
    code: 200, 
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      status: user.status || 'active',
      bannedAt: user.bannedAt,
      bannedReason: user.bannedReason,
      createdAt: user.createdAt,
      actions: userActions.slice(-50),
      riskLogs: userRiskLogs,
      orders: userOrders,
      stats: {
        totalActions: userActions.length,
        riskLogs: userRiskLogs.length,
        totalOrders: userOrders.length,
        riskScore: user.role === 'admin' ? 0 : riskModule.getRiskScore(userId),
        isOnline: riskModule.isUserOnline(userId)
      }
    }
  });
});

router.put('/:id/status', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const userId = req.params.id;
  const { status, reason } = req.body;
  
  if (userId === 'admin') {
    return res.status(400).json({ code: 400, message: '不能修改管理员账号状态' });
  }
  
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  if (status === 'banned') {
    user.status = 'banned';
    user.bannedAt = new Date().toISOString();
    user.bannedReason = reason || '违反用户协议';
  } else {
    user.status = 'active';
    user.bannedAt = null;
    user.bannedReason = null;
  }
  
  saveDb();
  
  res.json({ 
    code: 200, 
    message: status === 'banned' ? '用户已被封禁' : '用户已解封',
    data: { status: user.status }
  });
});

router.post('/batch-ban', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const { userIds, reason } = req.body;
  
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ code: 400, message: '用户ID列表不能为空' });
  }
  
  let successCount = 0;
  let failCount = 0;
  
  userIds.forEach(userId => {
    if (userId === 'admin') {
      failCount++;
      return;
    }
    
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.status = 'banned';
      user.bannedAt = new Date().toISOString();
      user.bannedReason = reason || '批量封禁：检测到异常行为';
      successCount++;
    } else {
      failCount++;
    }
  });
  
  saveDb();
  
  res.json({ 
    code: 200, 
    message: `批量封禁完成：成功 ${successCount} 人，失败 ${failCount} 人`,
    data: { successCount, failCount }
  });
});

router.post('/auto-ban', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const riskModule = require('./risk');
  const { threshold = 60 } = req.body;
  
  const riskyUsers = db.users.filter(u => {
    if (u.role === 'admin') return false;
    if (u.status === 'banned') return false;
    return riskModule.getRiskScore(u.id) >= threshold;
  });
  
  const userIds = riskyUsers.map(u => u.id);
  
  riskyUsers.forEach(user => {
    user.status = 'banned';
    user.bannedAt = new Date().toISOString();
    user.bannedReason = `自动封禁：风险评分超过 ${threshold} 分`;
  });
  
  saveDb();
  
  res.json({ 
    code: 200, 
    message: `自动封禁完成：共封禁 ${riskyUsers.length} 个高风险账号`,
    data: { bannedCount: riskyUsers.length, userIds }
  });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const userId = req.params.id;
  
  if (userId === 'admin') {
    return res.status(400).json({ code: 400, message: '不能删除管理员账号' });
  }
  
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  const deletedUser = db.users.splice(userIndex, 1)[0];
  
  db.orders = db.orders.filter(o => o.userId !== userId);
  db.userActions = db.userActions.filter(a => a.userId !== userId);
  db.riskLogs = db.riskLogs.filter(r => r.userId !== userId);
  
  saveDb();
  
  res.json({ 
    code: 200, 
    message: `用户「${deletedUser.username}」已注销`,
    data: { id: userId, username: deletedUser.username }
  });
});

router.post('/batch-delete', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const { userIds } = req.body;
  
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ code: 400, message: '用户ID列表不能为空' });
  }
  
  let successCount = 0;
  let failCount = 0;
  const deletedUsernames = [];
  
  userIds.forEach(userId => {
    if (userId === 'admin') {
      failCount++;
      return;
    }
    
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const deletedUser = db.users.splice(userIndex, 1)[0];
      deletedUsernames.push(deletedUser.username);
      successCount++;
    } else {
      failCount++;
    }
  });
  
  const validUserIds = userIds.filter(id => id !== 'admin');
  db.orders = db.orders.filter(o => !validUserIds.includes(o.userId));
  db.userActions = db.userActions.filter(a => !validUserIds.includes(a.userId));
  db.riskLogs = db.riskLogs.filter(r => !validUserIds.includes(r.userId));
  
  saveDb();
  
  res.json({ 
    code: 200, 
    message: `批量注销完成：成功 ${successCount} 人，失败 ${failCount} 人`,
    data: { successCount, failCount, deletedUsernames }
  });
});

router.get('/behavior-trace/:id', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const userId = req.params.id;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  
  const userActions = db.userActions.filter(a => a.userId === userId);
  const userRiskLogs = db.riskLogs.filter(r => r.userId === userId);
  const userOrders = db.orders.filter(o => o.userId === userId);
  
  const timeline = [];
  
  userActions.slice(-100).forEach(action => {
    timeline.push({
      type: 'action',
      timestamp: action.timestamp,
      action: action.action,
      details: action.details || '',
      productId: action.productId,
      riskScore: action.riskScore || 0
    });
  });
  
  userRiskLogs.forEach(log => {
    timeline.push({
      type: 'risk',
      timestamp: log.timestamp,
      action: log.action,
      details: log.reason,
      riskScore: log.riskScore || 0
    });
  });
  
  userOrders.forEach(order => {
    timeline.push({
      type: 'order',
      timestamp: order.createdAt,
      action: order.status === 'success' ? '抢购成功' : '抢购失败',
      details: `商品: ${order.productName}`,
      productId: order.productId,
      orderId: order.id
    });
  });
  
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  const actionStats = {
    totalActions: userActions.length,
    clickCount: userActions.filter(a => a.action === '点击抢购').length,
    viewCount: userActions.filter(a => a.action === '查看商品').length,
    loginCount: userActions.filter(a => a.action === '登录').length,
    avgInterval: 0,
    maxClicksPerMinute: 0
  };
  
  if (userActions.length > 1) {
    const intervals = [];
    const sortedActions = userActions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    for (let i = 1; i < sortedActions.length; i++) {
      const diff = new Date(sortedActions[i].timestamp) - new Date(sortedActions[i-1].timestamp);
      intervals.push(diff);
    }
    
    actionStats.avgInterval = intervals.length > 0 ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : 0;
    
    const minuteGroups = {};
    userActions.forEach(action => {
      const minuteKey = Math.floor(new Date(action.timestamp).getTime() / 60000);
      minuteGroups[minuteKey] = (minuteGroups[minuteKey] || 0) + 1;
    });
    actionStats.maxClicksPerMinute = Math.max(...Object.values(minuteGroups), 0);
  }
  
  res.json({
    code: 200,
    data: {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status || 'active'
      },
      timeline,
      stats: actionStats,
      riskLogs: userRiskLogs,
      orders: userOrders
    }
  });
});

router.get('/behavior-stats', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  
  const allActions = db.userActions;
  const allRiskLogs = db.riskLogs;
  const allOrders = db.orders;
  
  const hourlyStats = {};
  const today = new Date().toDateString();
  
  allActions.forEach(action => {
    const actionDate = new Date(action.timestamp).toDateString();
    if (actionDate === today) {
      const hour = new Date(action.timestamp).getHours();
      hourlyStats[hour] = hourlyStats[hour] || { actions: 0, risks: 0, orders: 0 };
      hourlyStats[hour].actions++;
    }
  });
  
  allRiskLogs.forEach(log => {
    const logDate = new Date(log.timestamp).toDateString();
    if (logDate === today) {
      const hour = new Date(log.timestamp).getHours();
      hourlyStats[hour] = hourlyStats[hour] || { actions: 0, risks: 0, orders: 0 };
      hourlyStats[hour].risks++;
    }
  });
  
  allOrders.forEach(order => {
    const orderDate = new Date(order.createdAt).toDateString();
    if (orderDate === today) {
      const hour = new Date(order.createdAt).getHours();
      hourlyStats[hour] = hourlyStats[hour] || { actions: 0, risks: 0, orders: 0 };
      hourlyStats[hour].orders++;
    }
  });
  
  const result = Object.keys(hourlyStats).map(hour => ({
    hour: `${hour}:00`,
    ...hourlyStats[hour]
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  
  res.json({
    code: 200,
    data: result
  });
});

module.exports = router;
