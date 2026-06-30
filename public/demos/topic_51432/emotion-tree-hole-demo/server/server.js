// 情感树洞AI后端服务主入口
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json({ limit: '1mb' })); // 解析JSON请求体
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'running', time: new Date().toISOString() } });
});

// API路由
app.use('/api', routes);

// 静态文件服务（提供assets目录访问）
app.use('/assets', express.static(require('path').join(__dirname, '..', 'assets')));

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 启动服务
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log('================================================');
    console.log(`  🌳 情感树洞AI后端服务已启动`);
    console.log(`  📡 服务地址: http://localhost:${PORT}`);
    console.log(`  💚 健康检查: http://localhost:${PORT}/health`);
    console.log(`  📚 API基础路径: http://localhost:${PORT}/api`);
    console.log('================================================');
  });
}

start();

module.exports = app;
