const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../utils/db');

router.get('/overview', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const productId = req.query.productId;
  
  const today = new Date().toISOString().split('T')[0];
  
  let products = db.products;
  if (productId) {
    products = db.products.filter(p => p.id === productId);
  }
  
  let orders = db.orders;
  let riskLogs = db.riskLogs;
  if (productId) {
    orders = db.orders.filter(o => o.productId === productId);
    const productUsers = [...new Set(orders.map(o => o.userId))];
    riskLogs = db.riskLogs.filter(r => productUsers.includes(r.userId));
  }
  
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const todayInterceptions = riskLogs.filter(r => r.timestamp.startsWith(today));
  
  const riskModule = require('./risk');
  const onlineUsers = riskModule.getOnlineUsersList();
  
  const stats = {
    onlineUsers: onlineUsers.length,
    onlineUsersList: onlineUsers.slice(0, 10),
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    todayInterceptions: todayInterceptions.length,
    totalInterceptions: riskLogs.length,
    selectedProductId: productId || 'all'
  };
  
  res.json({ code: 200, data: stats });
});

router.get('/products', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  
  const productStats = db.products.map(p => {
    const orderCount = db.orders.filter(o => o.productId === p.id).length;
    const soldPercent = ((p.originalStock - p.stock) / p.originalStock * 100).toFixed(1);
    
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      price: p.price,
      stock: p.stock,
      originalStock: p.originalStock,
      sold: p.originalStock - p.stock,
      soldPercent: parseFloat(soldPercent),
      status: p.status,
      seckillStartTime: p.seckillStartTime
    };
  });
  
  res.json({ code: 200, data: productStats });
});

router.get('/orders/daily', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  const dailyData = last7Days.map(date => {
    const orders = db.orders.filter(o => o.createdAt.startsWith(date));
    const interceptions = db.riskLogs.filter(r => r.timestamp.startsWith(date));
    
    return {
      date,
      orders: orders.length,
      interceptions: interceptions.length
    };
  });
  
  res.json({ code: 200, data: dailyData });
});

router.get('/orders/hourly', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const today = new Date().toISOString().split('T')[0];
  
  const hourlyData = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    const orders = db.orders.filter(o => 
      o.createdAt.startsWith(today) && o.createdAt.slice(11, 13) === hourStr
    );
    const interceptions = db.riskLogs.filter(r =>
      r.timestamp.startsWith(today) && r.timestamp.slice(11, 13) === hourStr
    );
    
    hourlyData.push({
      hour: `${hourStr}:00`,
      orders: orders.length,
      interceptions: interceptions.length
    });
  }
  
  res.json({ code: 200, data: hourlyData });
});

router.get('/risk/summary', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  
  const reasons = {};
  db.riskLogs.forEach(log => {
    reasons[log.reason] = (reasons[log.reason] || 0) + 1;
  });
  
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = db.riskLogs.filter(r => r.timestamp.startsWith(today));
  
  const summary = {
    totalLogs: db.riskLogs.length,
    todayLogs: todayLogs.length,
    reasonDistribution: reasons,
    topReasons: Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }))
  };
  
  res.json({ code: 200, data: summary });
});

router.get('/system', requireAuth, requireAdmin, (req, res) => {
  const { orderQueue, rateLimiter, circuitBreaker } = require('../utils/queue');
  
  const queueStats = orderQueue.getStats();
  const limiterStats = rateLimiter.getStats();
  const breakerStats = circuitBreaker.getStats();
  
  res.json({
    code: 200,
    data: {
      queue: queueStats,
      rateLimiter: limiterStats,
      circuitBreaker: breakerStats,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
