/**
 * 智萃WisdomFlow 后端应用入口
 * 创建日期: 2026-07-10
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后重试',
    timestamp: Date.now()
  }
});
app.use('/api/', apiLimiter);

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const interviewRoutes = require('./routes/interview.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const sopRoutes = require('./routes/sop.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const taskRoutes = require('./routes/task.routes');
const graphRoutes = require('./routes/knowledge-graph.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1/sops', sopRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/graph', graphRoutes);

app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'WisdomFlow Backend Service is running',
    timestamp: Date.now()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    timestamp: Date.now()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    timestamp: Date.now()
  });
});

module.exports = app;