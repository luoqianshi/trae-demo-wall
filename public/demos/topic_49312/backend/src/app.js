/**
 * HR系统后端主入口文件
 * 包含：JWT认证、权限中间件、路由注册、错误处理、日志记录
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入工具和中间件
const { fail } = require('./utils/response');
const logger = require('./utils/logger');
const { getClientIP } = require('./middleware/auth');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const employeeRoutes = require('./routes/employees');
const jobRoutes = require('./routes/jobs');
const resumeRoutes = require('./routes/resumes');
const interviewRoutes = require('./routes/interviews');
const offerRoutes = require('./routes/offers');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const performanceRoutes = require('./routes/performances');
const salaryRoutes = require('./routes/salaries');
const employeeChangeRoutes = require('./routes/employee-changes');
const resignationRoutes = require('./routes/resignations');
const logRoutes = require('./routes/logs');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// CORS跨域配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件（记录所有请求）
app.use((req, res, next) => {
  const startTime = Date.now();
  const ip = getClientIP(req);

  // 响应结束时记录系统级访问日志
  res.on('finish', () => {
    const executionTime = Date.now() - startTime;
    // 仅记录错误和慢请求到控制台
    if (res.statusCode >= 400 || executionTime > 3000) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${executionTime}ms - IP:${ip}`);
    }
  });

  next();
});

// ==================== 路由注册 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'HR系统后端服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    },
    success: true
  });
});

// API路由
app.use('/api/auth', authRoutes);           // 认证模块（登录/登出/修改密码）
app.use('/api/users', userRoutes);          // 用户管理
app.use('/api/departments', departmentRoutes); // 部门管理
app.use('/api/employees', employeeRoutes);  // 员工档案
app.use('/api/jobs', jobRoutes);            // 招聘岗位
app.use('/api/resumes', resumeRoutes);      // 简历管理
app.use('/api/interviews', interviewRoutes); // 面试管理
app.use('/api/offers', offerRoutes);        // Offer管理
app.use('/api/attendance', attendanceRoutes); // 考勤管理
app.use('/api/leaves', leaveRoutes);        // 请假管理
app.use('/api/performances', performanceRoutes); // 绩效管理
app.use('/api/salaries', salaryRoutes);     // 薪资管理（含工资记录）
app.use('/api/employee-changes', employeeChangeRoutes); // 员工异动管理
app.use('/api/resignations', resignationRoutes); // 离职管理
app.use('/api/logs', logRoutes);            // 操作日志
app.use('/api/reports', reportRoutes);      // BI数据报表

// ==================== 404处理 ====================
app.use((req, res) => {
  logger.log({
    module: 'system',
    action: '404',
    content: `访问不存在的路径: ${req.method} ${req.originalUrl}`,
    method: req.method,
    url: req.originalUrl,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || '',
    status: 0
  });
  return fail(res, `接口不存在: ${req.method} ${req.originalUrl}`, 404);
});

// ==================== 全局错误处理 ====================
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);

  logger.log({
    userId: req.userId || null,
    username: req.user?.username || null,
    module: 'system',
    action: 'error',
    content: `服务器错误: ${err.message}`,
    method: req.method,
    url: req.originalUrl,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || '',
    status: 0,
    result: { stack: err.stack?.substring(0, 500) }
  });

  if (err.name === 'UnauthorizedError') {
    return fail(res, '未授权访问', 401);
  }

  if (err.type === 'entity.parse.failed') {
    return fail(res, '请求数据格式错误', 400);
  }

  if (err.type === 'entity.too.large') {
    return fail(res, '请求数据过大', 413);
  }

  return fail(res, process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message, 500);
});

// ==================== 启动服务 ====================
// 先初始化数据库（sql.js 需要异步加载 WASM）
const db = require('./utils/db');
db.ready.then(() => {
  // 自动修复admin用户的real_name（如果为空或null，兼容已初始化的旧数据库）
  try {
    const fixAdminStmt = db.prepare(
      `UPDATE users SET real_name = ? WHERE username = ? AND (real_name IS NULL OR TRIM(real_name) = '')`
    );
    const fixResult = fixAdminStmt.run('系统管理员', 'admin');
    if (fixResult.changes > 0) {
      console.log('[数据修复] 已自动更新admin用户的real_name为"系统管理员"');
    }
  } catch (e) {
    console.warn('[数据修复] 更新admin real_name失败（可忽略）:', e.message);
  }

  const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('HR系统后端服务启动成功！');
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/api/health`);
    console.log(`默认管理员: admin / admin123`);
    console.log('========================================\n');
  });

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务...');
    db.close();
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务...');
    db.close();
    server.close(() => {
      process.exit(0);
    });
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});

module.exports = app;
