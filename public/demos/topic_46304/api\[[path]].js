/* ============================================================
 * IGA Pages serverless 入口 - catch-all 路由
 *
 * IGA Pages 的 RequestHandler 检测到 Express app（_router 属性）后，
 * 会调用 app(req, res, callback)，并自动剥离 /api 前缀。
 * 因此路由挂载不带 /api 前缀。
 *
 * 文件名 [[path]].js 对应 IGA Pages 的可选 catch-all 语法：
 * 正则 ^/api(?:/(?<path>.*))?$ 匹配 /api、/api/novels、/api/novels/123 等
 * ============================================================ */
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由挂载（routePrefix /api 已被 IGA Pages 自动剥离）
app.use('/novels', require('../routes/novels'));
app.use('/library', require('../routes/library'));
app.use('/settings', require('../routes/settings'));
app.use('/generate', require('../routes/generate'));
app.use('/dashboard', require('../routes/dashboard'));
app.use('/covers', require('../routes/covers'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'memory (non-persistent)',
  });
});

module.exports = app;
