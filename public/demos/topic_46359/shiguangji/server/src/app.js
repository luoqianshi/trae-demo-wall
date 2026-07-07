// 食光机服务器应用入口
// 配置 Express 应用、中间件、静态文件和路由

// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 引入数据库初始化模块（首次启动时初始化数据库和创建默认管理员）
const db = require('./database');

// 引入路由模块
const authRoutes = require('./routes/auth');
const recordsRoutes = require('./routes/records');
const aiRoutes = require('./routes/ai');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const communityRoutes = require('./routes/community');

const app = express();

// 端口号
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件配置
app.use(cors()); // 跨域支持
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码请求体

// 静态文件：/uploads 映射到 uploads 目录
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 静态文件：根路径 / 映射到 public 目录（前端文件）
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// 挂载 API 路由
app.use('/api/auth', authRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'shiguangji-server',
      time: new Date().toISOString()
    }
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 404 处理（API 路径未匹配时）
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`食光机服务器已启动: http://localhost:${PORT}`);
});

module.exports = app;
