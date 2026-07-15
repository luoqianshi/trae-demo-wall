import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import vocabularyRoutes from './routes/vocabulary';
import historyRoutes from './routes/history';
import adminRoutes from './routes/admin';
import { startCronJobs } from './services/newsCrawler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: {
      status: 'running',
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 阅知AI后端服务已启动`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV !== 'test') {
    startCronJobs();
  }
});
