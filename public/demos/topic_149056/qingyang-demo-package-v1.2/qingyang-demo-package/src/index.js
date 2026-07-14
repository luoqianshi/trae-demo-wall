const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// 初始化数据库（创建表等）
const { db, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 中间件 ==========

// CORS 跨域
app.use(cors({
  origin: '*', // 测试版允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer 文件上传配置（内存存储，测试版）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// ========== 静态文件（禁用JS/CSS缓存，确保代码更新生效） ==========
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ========== 健康检查 ==========
app.get('/api/v1/ping', (req, res) => {
  res.json({ code: 0, message: 'pong', data: { timestamp: new Date().toISOString(), version: '1.1.0' } });
});

// ========== 异步初始化数据库，然后注册路由 ==========
async function startServer() {
  try {
    // 等待数据库初始化完成
    await initDatabase();

    // 导入路由（数据库初始化后再导入，确保 db 可用）
    const authRoutes = require('./routes/auth');
    const healthRoutes = require('./routes/health');
    const planRoutes = require('./routes/plan');
    const trackingRoutes = require('./routes/tracking');
    const communityRoutes = require('./routes/community');
    const achievementRoutes = require('./routes/achievement');
    const nutritionRoutes = require('./routes/nutrition');
    const fitnessRoutes = require('./routes/fitness');
    const analysisRoutes = require('./routes/analysis');

    // ========== 路由注册 ==========

    // 认证路由（无需JWT）
    app.use('/api/v1/auth', authRoutes);

    // 健康信息路由（需JWT）
    app.use('/api/v1/health', healthRoutes);

    // 方案路由（需JWT）
    app.use('/api/v1/plans', planRoutes);

    // 追踪路由（需JWT）
    app.use('/api/v1/tracking', trackingRoutes);

    // 社区路由（需JWT）
    app.use('/api/v1/community', communityRoutes);

    // 成就路由（需JWT）
    app.use('/api/v1/achievements', achievementRoutes);

    // 饮食知识库路由
    app.use('/api/v1/nutrition', nutritionRoutes);

    // 运动知识库路由
    app.use('/api/v1/fitness', fitnessRoutes);

    // 体检档案分析路由
    app.use('/api/v1/analysis', analysisRoutes);

    // ========== 404 处理 ==========
    app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: `接口不存在: ${req.method} ${req.path}`,
        data: null
      });
    });

    // ========== 全局错误处理 ==========
    app.use((err, req, res, next) => {
      console.error('[Server Error]', err);

      if (err instanceof multer.MulterError) {
        return res.status(400).json({ code: 400, message: `文件上传错误: ${err.message}`, data: null });
      }

      res.status(500).json({
        code: 500,
        message: err.message || '服务器内部错误',
        data: null
      });
    });

    // ========== 启动服务器 ==========
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  轻养助手APP - 测试版后端服务');
      console.log(`  服务器运行中: http://localhost:${PORT}`);
      console.log('  API文档: http://localhost:3000/api/v1/ping');
      console.log('========================================');
      console.log('');
    });

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = app;
