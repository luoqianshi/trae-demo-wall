const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const { advancedRateLimiter } = require('./middleware/rateLimiter');
const { monitor } = require('./utils/monitor');
const { messageQueue } = require('./utils/messageQueue');
const { requireAuth } = require('./utils/db');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://yourdomain.com'] 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json({ 
  limit: '100kb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '100kb'
}));

app.use(express.static(__dirname));

app.use('/api', advancedRateLimiter.middleware());

app.use((req, res, next) => {
  monitor.recordRequest(true);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self';");
  
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  logger.info(`Request: ${req.method} ${req.path} from ${clientIp}`, {
    method: req.method,
    path: req.path,
    ip: clientIp,
    userAgent: req.headers['user-agent']
  });
  
  next();
});

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const riskRoutes = require('./routes/risk');
const statsRoutes = require('./routes/stats');
const captchaRoutes = require('./routes/captcha');

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/captcha', captchaRoutes);

app.get('/', (req, res) => {
  res.send('AI赋能微服务秒杀系统后端服务运行中');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

app.get('/api/monitor/metrics', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  res.json({ code: 200, data: monitor.getMetrics() });
});

app.get('/api/monitor/alerts', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  res.json({ code: 200, data: monitor.getAlertHistory() });
});

app.post('/api/monitor/alerts/:id/acknowledge', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  const result = monitor.acknowledgeAlert(req.params.id);
  res.json(result.success ? { code: 200, ...result } : { code: 404, message: '告警不存在' });
});

app.get('/api/monitor/status', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  res.json({ code: 200, data: monitor.getStatus() });
});

app.get('/api/rate-limiter/stats', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  res.json({ code: 200, data: advancedRateLimiter.getStats() });
});

app.post('/api/rate-limiter/unblock/ip', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ code: 400, message: 'IP地址不能为空' });
  }
  const result = advancedRateLimiter.unblockIP(ip);
  res.json({ code: result.success ? 200 : 400, ...result });
});

app.post('/api/rate-limiter/unblock/user', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ code: 400, message: '用户ID不能为空' });
  }
  const result = advancedRateLimiter.unblockUser(userId);
  res.json({ code: result.success ? 200 : 400, ...result });
});

app.get('/api/queue/stats', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  res.json({ code: 200, data: messageQueue.getStats() });
});

app.post('/api/queue/purge/:name', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  const result = messageQueue.purgeQueue(req.params.name);
  res.json({ code: result.success ? 200 : 400, ...result });
});

app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  res.status(404).json({ 
    code: 404, 
    message: '接口不存在' 
  });
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      code: 403, 
      message: '跨域请求被拒绝' 
    });
  }
  
  res.status(err.status || 500).json({ 
    code: err.status || 500, 
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message 
  });
});

const db = require('./utils/db');
const riskModule = require('./routes/risk');

io.on('connection', (socket) => {
  logger.info('User connected:', { socketId: socket.id });
  
  socket.on('join', (data) => {
    socket.join('seckill-room');
    logger.info('User joined seckill room:', { socketId: socket.id, data });
    
    const dbData = db.getDb();
    const stats = {
      onlineCount: io.sockets.sockets.size,
      totalStock: dbData.products.reduce((sum, p) => sum + p.stock, 0),
      todayOrders: dbData.orders.filter(o => {
        const orderDate = new Date(o.createdAt).toDateString();
        return orderDate === new Date().toDateString();
      }).length,
      todayInterceptions: dbData.riskLogs.filter(r => {
        const logDate = new Date(r.timestamp).toDateString();
        return logDate === new Date().toDateString();
      }).length
    };
    
    io.to('seckill-room').emit('stats-update', stats);
  });
  
  socket.on('subscribe-product', (productId) => {
    socket.join(`product-${productId}`);
    const product = db.getDb().products.find(p => p.id === productId);
    if (product) {
      socket.emit('stock-update', { productId, stock: product.stock });
    }
  });
  
  socket.on('disconnect', () => {
    logger.info('User disconnected:', { socketId: socket.id });
    
    const dbData = db.getDb();
    const stats = {
      onlineCount: io.sockets.sockets.size,
      totalStock: dbData.products.reduce((sum, p) => sum + p.stock, 0),
      todayOrders: dbData.orders.filter(o => {
        const orderDate = new Date(o.createdAt).toDateString();
        return orderDate === new Date().toDateString();
      }).length,
      todayInterceptions: dbData.riskLogs.filter(r => {
        const logDate = new Date(r.timestamp).toDateString();
        return logDate === new Date().toDateString();
      }).length
    };
    
    io.to('seckill-room').emit('stats-update', stats);
  });
});

global.io = io;

setInterval(() => {
  try {
    const dbData = db.getDb();
    const stats = {
      onlineCount: io.sockets.sockets.size,
      totalStock: dbData.products.reduce((sum, p) => sum + p.stock, 0),
      todayOrders: dbData.orders.filter(o => {
        const orderDate = new Date(o.createdAt).toDateString();
        return orderDate === new Date().toDateString();
      }).length,
      todayInterceptions: dbData.riskLogs.filter(r => {
        const logDate = new Date(r.timestamp).toDateString();
        return logDate === new Date().toDateString();
      }).length,
      timestamp: Date.now()
    };
    
    io.to('seckill-room').emit('stats-update', stats);
    
    dbData.products.forEach(product => {
      io.to(`product-${product.id}`).emit('stock-update', {
        productId: product.id,
        stock: product.stock,
        timestamp: Date.now()
      });
    });
  } catch (error) {
    logger.error('Error in stats interval:', { error: error.message });
  }
}, 3000);

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason: reason.message || reason, promise });
});

httpServer.listen(PORT, () => {
  logger.info('Server started:', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log('\n========================================');
  console.log('AI赋能微服务秒杀系统后端服务已启动');
  console.log(`服务端口: http://localhost:${PORT}`);
  console.log('WebSocket服务已启用');
  console.log('========================================\n');
});