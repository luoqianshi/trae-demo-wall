import healthRoutes from './health.js';
import userRoutes from './user.js';
import evalRoutes from './eval.js';
import reportRoutes from './report.js';
import coachRoutes from './coach.js';

export async function registerRoutes(fastify) {
  // 健康检查
  fastify.register(healthRoutes, { prefix: '/health' });

  // 用户相关
  fastify.register(userRoutes, { prefix: '/api/user' });

  // 评测相关
  fastify.register(evalRoutes, { prefix: '/api/eval' });

  // 报告相关
  fastify.register(reportRoutes, { prefix: '/api/report' });

  // 训练相关
  fastify.register(coachRoutes, { prefix: '/api/coach' });
}
