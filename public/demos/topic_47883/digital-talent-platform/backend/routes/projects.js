/**
 * 项目路由
 * 处理项目发布、查询、接单、进度更新
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// 项目状态枚举
const PROJECT_STATUS = {
  DRAFT: 'draft',           // 草稿
  PENDING: 'pending',       // 待审核
  OPEN: 'open',             // 开放接单
  IN_PROGRESS: 'in_progress', // 进行中
  REVIEW: 'review',         // 评审中
  COMPLETED: 'completed',   // 已完成
  CLOSED: 'closed'          // 已关闭
};

/**
 * GET /api/projects
 * 查询项目列表（支持筛选和分页）
 */
router.get('/', (req, res) => {
  try {
    const { status, category, keyword, page = 1, limit = 10 } = req.query;
    let projects = db.getTable('projects');

    // 按状态筛选
    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    // 按分类筛选
    if (category) {
      projects = projects.filter(p => p.category === category);
    }

    // 关键词搜索（标题和描述）
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      projects = projects.filter(p =>
        (p.title && p.title.toLowerCase().includes(lowerKeyword)) ||
        (p.description && p.description.toLowerCase().includes(lowerKeyword))
      );
    }

    // 排序：最新的在前面
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const total = projects.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedProjects = projects.slice(start, end);

    // 填充发布者信息
    const enrichedProjects = paginatedProjects.map(p => {
      const publisher = db.findById('users', p.publisherId);
      return {
        ...p,
        publisher: publisher ? {
          id: publisher.id,
          name: publisher.name,
          orgName: publisher.orgName,
          role: publisher.role
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        list: enrichedProjects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('查询项目失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/projects/:id
 * 获取项目详情
 */
router.get('/:id', (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    // 填充发布者信息
    const publisher = db.findById('users', project.publisherId);
    const enrichedProject = {
      ...project,
      publisher: publisher ? {
        id: publisher.id,
        name: publisher.name,
        orgName: publisher.orgName,
        role: publisher.role
      } : null
    };

    // 如果项目已有接单团队，填充团队信息
    if (project.teamId) {
      const team = db.findById('teams', project.teamId);
      if (team) {
        enrichedProject.team = team;
      }
    }

    res.json({ success: true, data: enrichedProject });
  } catch (err) {
    console.error('获取项目详情失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/projects
 * 发布项目（仅企业/教师）
 */
router.post('/', authenticate, requireRole('enterprise', 'teacher'), (req, res) => {
  try {
    const {
      title,
      description,
      category,
      techStack,
      requirements,
      deliverables,
      deadline,
      teamSize,
      budget,
      attachments
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: '项目名称和描述不能为空'
      });
    }

    const project = db.insert('projects', {
      publisherId: req.user.userId,
      publisherRole: req.user.role,
      title,
      description,
      category: category || '其他',
      techStack: techStack || [],
      requirements: requirements || '',
      deliverables: deliverables || [],
      deadline: deadline || '',
      teamSize: teamSize || 3,
      budget: budget || '',
      attachments: attachments || [],
      status: PROJECT_STATUS.OPEN,
      teamId: null,
      progress: 0,
      views: 0
    });

    res.status(201).json({
      success: true,
      message: '项目发布成功',
      data: project
    });
  } catch (err) {
    console.error('发布项目失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/projects/:id
 * 更新项目信息（仅发布者）
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    // 仅发布者或管理员可修改
    if (project.publisherId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权修改此项目' });
    }

    const updates = {};
    const allowedFields = [
      'title', 'description', 'category', 'techStack',
      'requirements', 'deliverables', 'deadline', 'teamSize', 'budget', 'attachments'
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = db.update('projects', req.params.id, updates);
    res.json({ success: true, message: '更新成功', data: updated });
  } catch (err) {
    console.error('更新项目失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/projects/:id/apply
 * 学生申请接单（组建团队后）
 */
router.post('/:id/apply', authenticate, requireRole('student'), (req, res) => {
  try {
    const { teamId, proposal } = req.body;
    if (!teamId || !proposal) {
      return res.status(400).json({ success: false, message: '请提供团队ID和项目立项书' });
    }

    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    if (project.status !== PROJECT_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: '该项目当前不接受申请' });
    }

    // 验证团队是否存在且当前用户是队长
    const team = db.findById('teams', teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }
    if (team.leaderId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '只有队长可以提交项目申请' });
    }

    // 创建申请记录
    const application = db.insert('applications', {
      projectId: req.params.id,
      teamId,
      leaderId: req.user.userId,
      proposal,
      status: 'pending',
      reviewedBy: null,
      reviewComment: ''
    });

    res.status(201).json({
      success: true,
      message: '申请提交成功，等待审核',
      data: application
    });
  } catch (err) {
    console.error('申请项目失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/projects/:id/approve
 * 审核通过申请（仅项目发布者）
 */
router.post('/:id/approve', authenticate, (req, res) => {
  try {
    const { applicationId } = req.body;
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    if (project.publisherId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权操作此项目' });
    }

    const application = db.findById('applications', applicationId);
    if (!application || application.projectId !== req.params.id) {
      return res.status(404).json({ success: false, message: '申请记录不存在' });
    }

    // 更新申请状态
    db.update('applications', applicationId, {
      status: 'approved',
      reviewedBy: req.user.userId
    });

    // 更新项目状态
    db.update('projects', req.params.id, {
      status: PROJECT_STATUS.IN_PROGRESS,
      teamId: application.teamId,
      startedAt: new Date().toISOString()
    });

    res.json({ success: true, message: '已批准申请，项目开始执行' });
  } catch (err) {
    console.error('审核申请失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/projects/:id/progress
 * 更新项目进度
 */
router.post('/:id/progress', authenticate, (req, res) => {
  try {
    const { progress, milestone, content } = req.body;
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    // 仅项目相关成员可更新
    const isPublisher = project.publisherId === req.user.userId;
    const isTeamMember = project.teamId && db.findById('teams', project.teamId)?.members?.includes(req.user.userId);
    if (!isPublisher && !isTeamMember) {
      return res.status(403).json({ success: false, message: '无权更新此项目' });
    }

    // 更新进度
    if (progress !== undefined) {
      db.update('projects', req.params.id, { progress: Math.min(100, Math.max(0, progress)) });
    }

    // 添加进度记录
    if (milestone || content) {
      db.insert('progress', {
        projectId: req.params.id,
        userId: req.user.userId,
        userName: req.user.name,
        milestone: milestone || '',
        content: content || '',
        progress: progress || project.progress
      });
    }

    res.json({ success: true, message: '进度更新成功' });
  } catch (err) {
    console.error('更新进度失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/projects/:id/progress
 * 获取项目进度记录
 */
router.get('/:id/progress', (req, res) => {
  try {
    const records = db.find('progress', { projectId: req.params.id });
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: records });
  } catch (err) {
    console.error('获取进度失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/projects/:id/complete
 * 标记项目完成
 */
router.post('/:id/complete', authenticate, (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    if (project.publisherId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权操作此项目' });
    }

    db.update('projects', req.params.id, {
      status: PROJECT_STATUS.COMPLETED,
      completedAt: new Date().toISOString(),
      progress: 100
    });

    res.json({ success: true, message: '项目已标记为完成' });
  } catch (err) {
    console.error('完成项目失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/projects/:id/applications
 * 获取项目的申请列表（仅发布者）
 */
router.get('/:id/applications', authenticate, (req, res) => {
  try {
    const project = db.findById('projects', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    if (project.publisherId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权查看申请列表' });
    }

    let applications = db.find('applications', { projectId: req.params.id });
    applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 填充团队信息
    const enriched = applications.map(app => {
      const team = db.findById('teams', app.teamId);
      return {
        ...app,
        team: team ? {
          id: team.id,
          name: team.name,
          leaderId: team.leaderId,
          memberCount: team.members.length
        } : null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('获取申请列表失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
