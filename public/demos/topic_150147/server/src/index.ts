import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { initDatabase } from './models/init';
import { seedDefaultData } from './models/init';
import { seedTaskData } from './models/init';

// 路由
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import submissionRoutes from './routes/submissions';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notifications';
import imageGenRoutes from './routes/imageGen';
import progressRoutes from './routes/progress';
import adminRoutes from './routes/admin';
import favoriteRoutes from './routes/favorites';
import ratingRoutes from './routes/ratings';
import commentRoutes from './routes/comments';

const app = express();

// CORS - 生产环境限制来源域名
const corsOptions = {
  origin: config.nodeEnv === 'production'
    ? ['https://your-domain.com', /\.your-domain\.com$/]
    : '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, _res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  _res.on('finish', () => {
    const duration = Date.now() - start;
    const status = _res.statusCode;
    const icon = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${icon} ${method} ${originalUrl} ${status} ${duration}ms`);
  });
  next();
});

// 静态文件服务
app.use('/uploads', express.static(path.resolve(config.uploadDir)));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));
app.use('/videos', express.static(path.join(__dirname, '..', 'public', 'videos')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/images', imageGenRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/comments', commentRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'PBL Platform API is running', time: new Date().toISOString() });
});

// 404处理
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// 初始化数据库（表结构）- 每次启动都执行（幂等）
initDatabase();

// 种子数据 - 仅在 --seed 参数时执行
if (process.argv.includes('--seed')) {
  console.log('[Seed] 开始初始化种子数据...');
  seedDefaultData();
  seedTaskData();
  console.log('[Seed] 种子数据初始化完成');
}

app.listen(config.port, () => {
  console.log(`[PBL Server] 服务已启动: http://localhost:${config.port}`);
  console.log(`[PBL Server] 环境: ${config.nodeEnv}`);
});

export default app;