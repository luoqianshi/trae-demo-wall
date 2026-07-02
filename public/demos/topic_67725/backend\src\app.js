import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { registerRoutes } from './routes/index.js';

dotenv.config({ path: process.cwd() + '/.env' });

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

// CORS
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
});

// 全局错误处理
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(error.statusCode || 500).send({
    error: true,
    code: error.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development'
      ? error.message
      : '服务器内部错误'
  });
});

// 注册路由
await registerRoutes(fastify);

// 启动
const start = async () => {
  try {
    const port = parseInt(process.env.PORT) || 3000;
    await fastify.listen({ port, host: process.env.HOST || '0.0.0.0' });
    fastify.log.info(`见澄明后端服务已启动: http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
