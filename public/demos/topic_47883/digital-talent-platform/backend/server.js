/**
 * 数字智能产教项目云平台 - 后端服务
 * Node.js + Express + JSON文件数据库
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== 路由引入 =====
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const teamRoutes = require('./routes/teams');
const uploadRoutes = require('./routes/uploads');
const chaoxingRoutes = require('./routes/chaoxing');
const resourceRoutes = require('./routes/resources');
const notificationRoutes = require('./routes/notifications');
const discussionRoutes = require('./routes/discussions');
const assignmentRoutes = require('./routes/assignments');
const examRoutes = require('./routes/exams');
const questionRoutes = require('./routes/questions');
const statsRoutes = require('./routes/stats');
const interviewRoutes = require('./routes/interviews');

// ===== API路由注册 =====
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/chaoxing', chaoxingRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/interviews', interviewRoutes);

// ===== 健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    data: {
      service: 'digital-talent-platform-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// ===== API文档 =====
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '数字智能产教项目云平台 API',
    data: {
      version: '1.0.0',
      endpoints: {
        auth: {
          description: '用户认证',
          routes: [
            { method: 'POST', path: '/api/auth/register', desc: '用户注册（企业/教师/学生）' },
            { method: 'POST', path: '/api/auth/login', desc: '用户登录' },
            { method: 'GET', path: '/api/auth/me', desc: '获取当前用户信息（需Token）' },
            { method: 'PUT', path: '/api/auth/me', desc: '更新用户信息（需Token）' },
            { method: 'POST', path: '/api/auth/change-password', desc: '修改密码（需Token）' }
          ]
        },
        projects: {
          description: '项目管理',
          routes: [
            { method: 'GET', path: '/api/projects', desc: '查询项目列表（支持筛选分页）' },
            { method: 'GET', path: '/api/projects/:id', desc: '获取项目详情' },
            { method: 'POST', path: '/api/projects', desc: '发布项目（企业/教师）' },
            { method: 'PUT', path: '/api/projects/:id', desc: '更新项目信息' },
            { method: 'POST', path: '/api/projects/:id/apply', desc: '申请接单（学生）' },
            { method: 'POST', path: '/api/projects/:id/approve', desc: '审核通过申请' },
            { method: 'POST', path: '/api/projects/:id/progress', desc: '更新项目进度' },
            { method: 'GET', path: '/api/projects/:id/progress', desc: '获取进度记录' },
            { method: 'POST', path: '/api/projects/:id/complete', desc: '标记项目完成' },
            { method: 'GET', path: '/api/projects/:id/applications', desc: '获取申请列表' }
          ]
        },
        teams: {
          description: '团队管理',
          routes: [
            { method: 'GET', path: '/api/teams', desc: '查询团队列表' },
            { method: 'GET', path: '/api/teams/:id', desc: '获取团队详情' },
            { method: 'POST', path: '/api/teams', desc: '创建团队（学生）' },
            { method: 'PUT', path: '/api/teams/:id', desc: '更新团队信息' },
            { method: 'POST', path: '/api/teams/:id/members', desc: '邀请成员' },
            { method: 'DELETE', path: '/api/teams/:id/members/:userId', desc: '移除成员' },
            { method: 'DELETE', path: '/api/teams/:id', desc: '解散团队' }
          ]
        },
        uploads: {
          description: '文件上传',
          routes: [
            { method: 'POST', path: '/api/uploads', desc: '上传文件（单文件）' },
            { method: 'POST', path: '/api/uploads/avatar', desc: '上传头像' },
            { method: 'POST', path: '/api/uploads/multiple', desc: '批量上传文件' }
          ]
        },
        chaoxing: {
          description: '超星泛雅（学习通）系统对接',
          routes: [
            { method: 'GET', path: '/api/chaoxing/config', desc: '获取超星对接配置' },
            { method: 'GET', path: '/api/chaoxing/auth-url', desc: '获取超星授权登录URL' },
            { method: 'POST', path: '/api/chaoxing/callback', desc: '超星授权回调处理' },
            { method: 'POST', path: '/api/chaoxing/bind', desc: '绑定超星账号（需登录）' },
            { method: 'POST', path: '/api/chaoxing/unbind', desc: '解绑超星账号（需登录）' },
            { method: 'GET', path: '/api/chaoxing/profile', desc: '获取超星绑定信息（需登录）' },
            { method: 'GET', path: '/api/chaoxing/courses', desc: '同步超星课程/班级（需登录）' },
            { method: 'POST', path: '/api/chaoxing/refresh-token', desc: '刷新超星Token（需登录）' }
          ]
        },
        resources: {
          description: '资料库（企业标准、作品集、课件等）',
          routes: [
            { method: 'GET', path: '/api/resources', desc: '查询资料列表（支持类型/关键词筛选）' },
            { method: 'GET', path: '/api/resources/:id', desc: '获取资料详情' },
            { method: 'POST', path: '/api/resources', desc: '上传资料（需登录）' },
            { method: 'PUT', path: '/api/resources/:id', desc: '更新资料信息' },
            { method: 'DELETE', path: '/api/resources/:id', desc: '删除资料' },
            { method: 'POST', path: '/api/resources/:id/download', desc: '记录下载' }
          ]
        },
        notifications: {
          description: '通知中心',
          routes: [
            { method: 'GET', path: '/api/notifications', desc: '获取通知列表（含未读数）' },
            { method: 'GET', path: '/api/notifications/unread-count', desc: '获取未读通知数量' },
            { method: 'POST', path: '/api/notifications/:id/read', desc: '标记单条已读' },
            { method: 'POST', path: '/api/notifications/read-all', desc: '标记全部已读' },
            { method: 'DELETE', path: '/api/notifications/:id', desc: '删除通知' }
          ]
        },
        discussions: {
          description: '讨论区（技术答疑、团队招募等）',
          routes: [
            { method: 'GET', path: '/api/discussions', desc: '获取话题列表' },
            { method: 'GET', path: '/api/discussions/:id', desc: '获取话题详情（含回复）' },
            { method: 'POST', path: '/api/discussions', desc: '发布话题（需登录）' },
            { method: 'POST', path: '/api/discussions/:id/replies', desc: '回复话题' },
            { method: 'DELETE', path: '/api/discussions/:id', desc: '删除话题' }
          ]
        },
        assignments: {
          description: '作业/成果提交与评审',
          routes: [
            { method: 'GET', path: '/api/assignments', desc: '查询作业列表' },
            { method: 'GET', path: '/api/assignments/:id', desc: '获取作业详情' },
            { method: 'POST', path: '/api/assignments', desc: '提交成果物（学生）' },
            { method: 'POST', path: '/api/assignments/:id/review', desc: '评审打分（企业/教师）' },
            { method: 'POST', path: '/api/assignments/:id/iterate', desc: '提交迭代修改' }
          ]
        },
        exams: {
          description: '考试系统（岗位认证、准入测评）',
          routes: [
            { method: 'GET', path: '/api/exams', desc: '查询考试列表' },
            { method: 'GET', path: '/api/exams/:id', desc: '获取考试详情' },
            { method: 'POST', path: '/api/exams', desc: '创建考试（教师/企业）' },
            { method: 'POST', path: '/api/exams/:id/start', desc: '开始考试' },
            { method: 'POST', path: '/api/exams/:id/submit', desc: '提交答卷（自动评分）' },
            { method: 'GET', path: '/api/exams/:id/records', desc: '获取考试记录' }
          ]
        },
        questions: {
          description: '题库管理',
          routes: [
            { method: 'GET', path: '/api/questions', desc: '查询题目列表' },
            { method: 'GET', path: '/api/questions/:id', desc: '获取题目详情' },
            { method: 'POST', path: '/api/questions', desc: '创建题目' },
            { method: 'PUT', path: '/api/questions/:id', desc: '更新题目' },
            { method: 'DELETE', path: '/api/questions/:id', desc: '删除题目' },
            { method: 'POST', path: '/api/questions/:id/use', desc: '记录题目使用' }
          ]
        },
        stats: {
          description: '统计分析',
          routes: [
            { method: 'GET', path: '/api/stats/overview', desc: '平台总览数据' },
            { method: 'GET', path: '/api/stats/projects', desc: '项目交付率统计' },
            { method: 'GET', path: '/api/stats/students', desc: '学生能力排行' },
            { method: 'GET', path: '/api/stats/enterprises', desc: '企业活跃度统计' },
            { method: 'GET', path: '/api/stats/teachers', desc: '教师工作量统计' },
            { method: 'GET', path: '/api/stats/radar/:studentId', desc: '学生能力雷达图数据' }
          ]
        },
        interviews: {
          description: '远程面试/评审室',
          routes: [
            { method: 'GET', path: '/api/interviews', desc: '查询面试/评审列表' },
            { method: 'GET', path: '/api/interviews/:id', desc: '获取详情' },
            { method: 'POST', path: '/api/interviews', desc: '预约面试/评审' },
            { method: 'POST', path: '/api/interviews/:id/start', desc: '开始面试' },
            { method: 'POST', path: '/api/interviews/:id/end', desc: '结束面试' },
            { method: 'POST', path: '/api/interviews/:id/feedback', desc: '提交点评反馈' },
            { method: 'POST', path: '/api/interviews/:id/join', desc: '加入房间' }
          ]
        }
      }
    }
  });
});

// ===== 404处理 =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `接口不存在: ${req.method} ${req.path}`
  });
});

// ===== 全局错误处理 =====
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// ===== 启动服务 =====
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  数字智能产教项目云平台 - 后端服务');
  console.log('  Digital Talent Platform API Server');
  console.log('='.repeat(50));
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API文档:  http://localhost:${PORT}/api`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

module.exports = app;
