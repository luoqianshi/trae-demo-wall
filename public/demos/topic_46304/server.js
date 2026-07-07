/* ============================================================
 * 本地运行入口 - 同时提供 API 服务和静态资源
 *
 * 用法：
 *   npm install
 *   npm start
 *
 * 然后浏览器访问 http://localhost:3000
 *
 * 为什么需要这个文件：
 *   api/[[path]].js 是 IGA Pages serverless function，仅导出 Express
 *   app 而不启动服务器。本地运行需要一个 HTTP 服务器同时处理：
 *   1. /api/* 请求 → 转发给路由模块
 *   2. 其他请求 → 返回 public/ 下的静态资源
 * ============================================================ */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API 路由 - 挂载到 /api 前缀
// （IGA Pages 部署时 /api 前缀由平台自动剥离，本地需手动挂载）
app.use('/api/novels', require('./routes/novels'));
app.use('/api/library', require('./routes/library'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/generate', require('./routes/generate'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/covers', require('./routes/covers'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'memory (non-persistent)',
  });
});

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('  灵笔 AI 小说生成器已启动');
  console.log('  访问地址: http://localhost:' + PORT);
  console.log('');
  console.log('  注意: 使用内存存储，重启后数据丢失');
  console.log('');
});
