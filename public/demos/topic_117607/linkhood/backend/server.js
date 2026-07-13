require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/circles', require('./routes/circles'));
app.use('/api/needs', require('./routes/needs'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/feedbacks', require('./routes/feedbacks'));
app.use('/api/users', require('./routes/users'));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
});

// 数据库连接并启动服务
async function start() {
  try {
    await sequelize.authenticate();
    console.log('MySQL 数据库连接成功');
    app.listen(PORT, () => {
      console.log(`邻聚后端服务已启动，端口: ${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    // 如果数据库未就绪，5秒后重试
    setTimeout(start, 5000);
  }
}

start();
