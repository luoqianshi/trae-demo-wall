import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'pbl-platform-jwt-change-me-in-production',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || './data/pbl.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  wx: {
    appId: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
  },
  agnes: {
    apiKey: process.env.AGNES_API_KEY || '',
    apiBase: process.env.AGNES_API_BASE || 'https://apihub.agnes-ai.com',
  },
};