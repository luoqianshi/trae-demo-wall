const express = require('express');
const router = express.Router();
const { generateId, requireAuth, requireAdmin } = require('../utils/db');
const { deviceFingerprint, proxyDetector } = require('../utils/device');

const MAX_CLICKS_PER_MINUTE = 15;
const MIN_REQUEST_INTERVAL = 300;
const RISK_SCORE_THRESHOLD = 50;

const userClickCounts = {};
const userLastRequest = {};
const userRiskScores = {};
const onlineUsers = {};
const ipRequestCounts = {};
const MAX_REQUESTS_PER_IP_MINUTE = 50;
const userDeviceMap = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(onlineUsers).forEach(userId => {
    if (now - onlineUsers[userId].lastActivity > 300000) {
      delete onlineUsers[userId];
    }
  });
}, 30000);

setInterval(() => {
  const now = Date.now();
  Object.keys(userRiskScores).forEach(userId => {
    if (userRiskScores[userId] > 0) {
      userRiskScores[userId] = Math.max(0, userRiskScores[userId] - 1);
    }
  });
}, 10000);

function logUserAction(userId, actionType, ip = '127.0.0.1') {
  const db = require('../utils/db').getDb();
  
  const action = {
    id: generateId('a'),
    userId,
    actionType,
    timestamp: new Date().toISOString(),
    ip: ip
  };
  
  db.userActions.push(action);
  
  if (db.userActions.length > 10000) {
    db.userActions = db.userActions.slice(-5000);
  }
  
  require('../utils/db').saveDb();
  
  if (onlineUsers[userId]) {
    onlineUsers[userId].lastActivity = Date.now();
  }
  
  updateClickCount(userId, ip);
  checkRequestInterval(userId);
}

function updateClickCount(userId, ip = '127.0.0.1') {
  const now = Date.now();
  const minuteKey = Math.floor(now / 60000);
  const secondKey = Math.floor(now / 1000);
  
  if (!userClickCounts[userId]) {
    userClickCounts[userId] = { seconds: {} };
  }
  
  if (!userClickCounts[userId].seconds) {
    userClickCounts[userId].seconds = {};
  }
  
  userClickCounts[userId][minuteKey] = (userClickCounts[userId][minuteKey] || 0) + 1;
  userClickCounts[userId].seconds[secondKey] = (userClickCounts[userId].seconds[secondKey] || 0) + 1;
  
  const recentSeconds = Object.keys(userClickCounts[userId].seconds || {})
    .map(k => parseInt(k))
    .filter(k => secondKey - k <= 5);
  
  const clicksIn5Seconds = recentSeconds.reduce((sum, k) => sum + (userClickCounts[userId].seconds[k] || 0), 0);
  
  if (clicksIn5Seconds > 3) {
    updateRiskScore(userId, 20);
  }
  
  const recentMinutes = Object.keys(userClickCounts[userId])
    .filter(k => k !== 'seconds')
    .map(k => parseInt(k))
    .filter(k => minuteKey - k <= 5);
  
  const totalClicks = recentMinutes.reduce((sum, k) => sum + (userClickCounts[userId][k] || 0), 0);
  
  if (totalClicks > MAX_CLICKS_PER_MINUTE * 5) {
    updateRiskScore(userId, 30);
  }
  
  if (!ipRequestCounts[ip]) {
    ipRequestCounts[ip] = {};
  }
  ipRequestCounts[ip][minuteKey] = (ipRequestCounts[ip][minuteKey] || 0) + 1;
  
  const ipRecentMinutes = Object.keys(ipRequestCounts[ip])
    .map(k => parseInt(k))
    .filter(k => minuteKey - k <= 1);
  
  const ipTotalRequests = ipRecentMinutes.reduce((sum, k) => sum + (ipRequestCounts[ip][k] || 0), 0);
  
  if (ipTotalRequests > MAX_REQUESTS_PER_IP_MINUTE) {
    updateRiskScore(userId, 50);
  }
}

function checkRequestInterval(userId) {
  const now = Date.now();
  
  if (userLastRequest[userId]) {
    const interval = now - userLastRequest[userId];
    
    if (interval < MIN_REQUEST_INTERVAL) {
      updateRiskScore(userId, 20);
    }
  }
  
  userLastRequest[userId] = now;
}

function updateRiskScore(userId, points) {
  userRiskScores[userId] = (userRiskScores[userId] || 0) + points;
  
  if (userRiskScores[userId] > 100) {
    userRiskScores[userId] = 100;
  }
  
  setTimeout(() => {
    if (userRiskScores[userId]) {
      userRiskScores[userId] = Math.max(0, userRiskScores[userId] - points);
    }
  }, 60000);
}

function checkRisk(userId) {
  const score = userRiskScores[userId] || 0;
  return score >= RISK_SCORE_THRESHOLD;
}

function updateOnlineUser(userId, ip, req) {
  const fingerprint = deviceFingerprint.generateFingerprint(req);
  
  deviceFingerprint.registerDevice(fingerprint, userId, req.headers['user-agent']);
  
  const proxyResult = proxyDetector.detectProxy(req);
  let deviceRiskScore = 0;
  
  if (proxyResult.isProxy) {
    deviceRiskScore += 50;
  }
  
  if (proxyResult.isDataCenter) {
    deviceRiskScore += 30;
  }
  
  if (deviceRiskScore > 0) {
    updateRiskScore(userId, deviceRiskScore);
  }
  
  if (!userDeviceMap[userId]) {
    userDeviceMap[userId] = new Set();
  }
  userDeviceMap[userId].add(fingerprint);
  
  if (userDeviceMap[userId].size > 5) {
    updateRiskScore(userId, 30);
  }
  
  onlineUsers[userId] = {
    ip: ip || '127.0.0.1',
    lastActivity: Date.now(),
    loginTime: Date.now(),
    deviceFingerprint: fingerprint,
    isProxy: proxyResult.isProxy,
    proxyScore: proxyResult.suspiciousScore
  };
}

function isUserOnline(userId) {
  return !!onlineUsers[userId];
}

function getRiskScore(userId) {
  return userRiskScores[userId] || 0;
}

function getOnlineUsersCount() {
  return Object.keys(onlineUsers).length;
}

function getOnlineUsersList() {
  return Object.keys(onlineUsers).map(userId => ({
    userId,
    ...onlineUsers[userId]
  }));
}

function logRisk(userId, action, reason) {
  const db = require('../utils/db').getDb();
  
  const riskLog = {
    id: generateId('r'),
    userId,
    action,
    reason,
    timestamp: new Date().toISOString(),
    riskScore: userRiskScores[userId] || 0
  };
  
  db.riskLogs.push(riskLog);
  
  if (db.riskLogs.length > 5000) {
    db.riskLogs = db.riskLogs.slice(-2000);
  }
  
  require('../utils/db').saveDb();
}

router.post('/log', requireAuth, (req, res) => {
  const { actionType } = req.body;
  
  if (!actionType) {
    return res.status(400).json({ code: 400, message: '操作类型不能为空' });
  }
  
  logUserAction(req.user.userId, actionType);
  
  res.json({ code: 200, message: '操作记录成功' });
});

router.get('/status', requireAuth, (req, res) => {
  const userId = req.user.userId;
  const score = userRiskScores[userId] || 0;
  const isRisky = score >= RISK_SCORE_THRESHOLD;
  
  res.json({ 
    code: 200, 
    data: { 
      riskScore: score, 
      isRisky,
      status: isRisky ? '风险用户' : score > 50 ? '关注用户' : '正常用户'
    } 
  });
});

router.get('/logs', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  res.json({ code: 200, data: db.riskLogs });
});

router.get('/actions', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  res.json({ code: 200, data: db.userActions });
});

router.post('/analyze', requireAuth, requireAdmin, (req, res) => {
  const { userId } = req.body;
  const db = require('../utils/db').getDb();
  
  const userActions = db.userActions.filter(a => a.userId === userId);
  const userRiskLogs = db.riskLogs.filter(r => r.userId === userId);
  const score = userRiskScores[userId] || 0;
  
  const analysis = {
    userId,
    totalActions: userActions.length,
    riskLogs: userRiskLogs.length,
    riskScore: score,
    status: score >= RISK_SCORE_THRESHOLD ? '风险用户' : score > 50 ? '关注用户' : '正常用户',
    recentActions: userActions.slice(-20)
  };
  
  res.json({ code: 200, data: analysis });
});

module.exports = router;
module.exports.logUserAction = logUserAction;
module.exports.checkRisk = checkRisk;
module.exports.logRisk = logRisk;
module.exports.updateOnlineUser = updateOnlineUser;
module.exports.isUserOnline = isUserOnline;
module.exports.getRiskScore = getRiskScore;
module.exports.getOnlineUsersCount = getOnlineUsersCount;
module.exports.getOnlineUsersList = getOnlineUsersList;
