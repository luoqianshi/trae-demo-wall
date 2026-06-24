const express = require('express');
const router = express.Router();
const { generateId, requireAuth } = require('../utils/db');
const { orderQueue, rateLimiter, circuitBreaker } = require('../utils/queue');
const stockService = require('../utils/stock');
const lockService = require('../utils/lock');

const ORDER_COOLDOWN = 10000;
const userLastOrder = {};

router.post('/seckill', requireAuth, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.userId;
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  if (!productId) {
    return res.status(400).json({ code: 400, message: '商品ID不能为空' });
  }

  const rateLimitResult = rateLimiter.check(clientIp);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({ code: 429, message: rateLimitResult.message });
  }

  const db = require('../utils/db').getDb();
  const riskModule = require('./risk');

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  if (!riskModule.isUserOnline(userId)) {
    return res.status(401).json({ code: 401, message: '请先登录或刷新页面保持在线状态' });
  }

  const riskScore = riskModule.getRiskScore(userId);

  if (riskScore >= 100) {
    riskModule.logRisk(userId, '秒杀下单', '高风险用户，直接拦截');
    return res.status(403).json({ code: 403, message: '您的账号存在异常行为，已被系统限制抢购' });
  }

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }

  if (product.status !== 'active') {
    return res.status(400).json({ code: 400, message: '商品未上架' });
  }

  const now = new Date().toISOString();
  if (now < product.seckillStartTime) {
    return res.status(400).json({ code: 400, message: '秒杀尚未开始' });
  }

  if (userLastOrder[userId] && Date.now() - userLastOrder[userId] < ORDER_COOLDOWN) {
    const remaining = Math.ceil((ORDER_COOLDOWN - (Date.now() - userLastOrder[userId])) / 1000);
    return res.status(400).json({ code: 400, message: `请稍后再试，${remaining}秒后可再次抢购` });
  }

  const existingOrder = db.orders.find(o => o.userId === userId && o.productId === productId);
  if (existingOrder) {
    return res.status(400).json({ code: 400, message: '您已成功抢购此商品，不可重复抢购' });
  }

  riskModule.logUserAction(userId, '秒杀尝试');

  const isRisky = riskModule.checkRisk(userId);
  if (isRisky) {
    riskModule.logRisk(userId, '秒杀下单', '高频操作检测，疑似黄牛脚本');
    return res.status(403).json({ code: 403, message: '检测到异常操作，已被AI风控拦截' });
  }

  if (riskScore >= 70) {
    const delayMs = (riskScore - 70) * 50;
    setTimeout(() => {
      processOrder(userId, productId, product, res, db, riskModule);
    }, delayMs);
    return;
  }

  await processOrder(userId, productId, product, res, db, riskModule);
});

async function processOrder(userId, productId, product, res, db, riskModule) {
  const lockResourceKey = `stock_${productId}`;
  let lockAcquired = false;

  try {
    const lockResult = await lockService.acquireLock(lockResourceKey, userId);
    if (!lockResult.success) {
      return res.status(400).json({ code: 400, message: '系统繁忙，请稍后重试' });
    }
    lockAcquired = true;

    const availableStock = stockService.getAvailableStock(productId);
    if (availableStock <= 0) {
      return res.status(400).json({ code: 400, message: '库存不足，抢购失败' });
    }

    const existingOrder = db.orders.find(o => o.userId === userId && o.productId === productId);
    if (existingOrder) {
      return res.status(400).json({ code: 400, message: '您已成功抢购此商品，不可重复抢购' });
    }

    const holdResult = stockService.holdStock(productId, userId, 1);
    if (!holdResult.success) {
      return res.status(400).json({ code: 400, message: holdResult.message });
    }

    const newOrder = {
      id: generateId('o'),
      userId,
      productId,
      productName: product.name,
      price: product.price,
      status: 'pending',
      holdId: holdResult.holdId,
      createdAt: new Date().toISOString()
    };

    db.orders.push(newOrder);
    userLastOrder[userId] = Date.now();
    require('../utils/db').saveDb();

    res.json({
      code: 200,
      message: '抢购成功',
      data: {
        orderId: newOrder.id,
        productName: product.name,
        price: product.price,
        remainingStock: availableStock - 1,
        expiresAt: holdResult.expiredAt
      }
    });
  } finally {
    if (lockAcquired) {
      lockService.releaseLock(lockResourceKey, 'order_completed');
    }
  }
}

router.get('/my', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const orders = db.orders.filter(o => o.userId === req.user.userId);
  res.json({ code: 200, data: orders });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  if (order.userId !== req.user.userId && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无权查看此订单' });
  }

  res.json({ code: 200, data: order });
});

router.get('/', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }

  const db = require('../utils/db').getDb();
  res.json({ code: 200, data: db.orders });
});

router.get('/my', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const userId = req.user.id;

  const userOrders = db.orders.filter(o => o.userId === userId).map(order => {
    const product = db.products.find(p => p.id === order.productId);
    return {
      ...order,
      productName: product ? product.name : '未知商品',
      productPrice: product ? product.price : 0,
      productImage: product ? product.image : ''
    };
  });

  res.json({ code: 200, data: userOrders });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const orderId = req.params.id;

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权查看此订单' });
  }

  const product = db.products.find(p => p.id === order.productId);
  const user = db.users.find(u => u.id === order.userId);

  res.json({
    code: 200,
    data: {
      ...order,
      productName: product ? product.name : '未知商品',
      productPrice: product ? product.price : 0,
      productImage: product ? product.image : '',
      productType: product ? product.type : '',
      productDescription: product ? product.description : '',
      userName: user ? user.username : '未知用户'
    }
  });
});

router.post('/:id/pay', requireAuth, async (req, res) => {
  const db = require('../utils/db').getDb();
  const orderId = req.params.id;

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  if (order.userId !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权操作此订单' });
  }

  if (order.status === 'paid') {
    return res.status(400).json({ code: 400, message: '订单已支付' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ code: 400, message: '订单已取消' });
  }

  const lockResourceKey = `stock_${order.productId}`;
  let lockAcquired = false;

  try {
    const lockResult = await lockService.acquireLock(lockResourceKey, req.user.id);
    if (!lockResult.success) {
      return res.status(400).json({ code: 400, message: '系统繁忙，请稍后重试' });
    }
    lockAcquired = true;

    const holdRecord = stockService.getHoldRecord(order.holdId);
    if (!holdRecord || holdRecord.released) {
      order.status = 'cancelled';
      require('../utils/db').saveDb();
      return res.status(400).json({ code: 400, message: '预扣库存已过期，请重新下单' });
    }

    if (Date.now() > holdRecord.expiredAt) {
      stockService.releaseHold(order.holdId, 'expired');
      order.status = 'cancelled';
      require('../utils/db').saveDb();
      return res.status(400).json({ code: 400, message: '订单已过期，请重新下单' });
    }

    const confirmResult = stockService.confirmHold(order.holdId, orderId);
    if (!confirmResult.success) {
      order.status = 'cancelled';
      require('../utils/db').saveDb();
      return res.status(400).json({ code: 400, message: confirmResult.message });
    }

    const randomDelay = Math.floor(Math.random() * 2000) + 500;

    setTimeout(() => {
      const success = Math.random() > 0.15;

      if (success) {
        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        db.save();

        res.json({
          code: 200,
          message: '支付成功',
          data: {
            orderId: order.id,
            status: 'paid',
            paidAt: order.paidAt,
            amount: order.price
          }
        });
      } else {
        stockService.rollbackStock(orderId);
        order.status = 'failed';
        db.save();

        res.json({
          code: 400,
          message: '支付失败，请重试',
          data: {
            orderId: order.id,
            status: order.status
          }
        });
      }
    }, randomDelay);
  } finally {
    if (lockAcquired) {
      lockService.releaseLock(lockResourceKey, 'payment_completed');
    }
  }
});

router.post('/:id/cancel', requireAuth, (req, res) => {
  const db = require('../utils/db').getDb();
  const orderId = req.params.id;

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  if (order.userId !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权操作此订单' });
  }

  if (order.status === 'paid') {
    return res.status(400).json({ code: 400, message: '订单已支付，无法取消' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ code: 400, message: '订单已取消' });
  }

  if (order.holdId) {
    stockService.releaseHold(order.holdId, 'user_cancel');
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  require('../utils/db').saveDb();

  res.json({ code: 200, message: '订单已取消，库存已释放' });
});

router.delete('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }

  const db = require('../utils/db').getDb();
  const orderId = req.params.id;
  const orderIndex = db.orders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }

  const deletedOrder = db.orders[orderIndex];

  if (deletedOrder.status === 'pending' && deletedOrder.holdId) {
    stockService.releaseHold(deletedOrder.holdId, 'admin_delete');
  } else if (deletedOrder.status === 'paid') {
    stockService.rollbackStock(orderId);
  }

  const product = db.products.find(p => p.id === deletedOrder.productId);
  if (product && (deletedOrder.status === 'paid' || deletedOrder.status === 'pending')) {
    product.stock += 1;
  }

  db.orders.splice(orderIndex, 1);
  require('../utils/db').saveDb();

  res.json({ code: 200, message: '订单删除成功，库存已恢复' });
});

router.delete('/', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }

  const db = require('../utils/db').getDb();

  db.orders.forEach(order => {
    if (order.status === 'pending' && order.holdId) {
      stockService.releaseHold(order.holdId, 'admin_clear');
    }

    const product = db.products.find(p => p.id === order.productId);
    if (product) {
      product.stock += 1;
    }
  });

  db.orders = [];
  db.riskLogs = [];
  db.userActions = [];
  require('../utils/db').saveDb();

  res.json({ code: 200, message: '所有数据已清空，库存已恢复' });
});

module.exports = router;