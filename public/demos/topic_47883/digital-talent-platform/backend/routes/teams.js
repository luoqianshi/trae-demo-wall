/**
 * 团队路由
 * 处理团队组建、成员管理、项目关联
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/teams
 * 查询团队列表
 */
router.get('/', (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    let teams = db.getTable('teams');

    // 关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      teams = teams.filter(t =>
        (t.name && t.name.toLowerCase().includes(lowerKeyword)) ||
        (t.description && t.description.toLowerCase().includes(lowerKeyword))
      );
    }

    // 排序
    teams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const total = teams.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedTeams = teams.slice(start, end);

    // 填充成员信息
    const enrichedTeams = paginatedTeams.map(t => {
      const members = t.members.map(memberId => {
        const user = db.findById('users', memberId);
        return user ? {
          id: user.id,
          name: user.name,
          role: user.role,
          major: user.major,
          avatar: user.avatar
        } : null;
      }).filter(Boolean);

      const leader = db.findById('users', t.leaderId);

      return {
        ...t,
        leader: leader ? {
          id: leader.id,
          name: leader.name,
          major: leader.major,
          avatar: leader.avatar
        } : null,
        members,
        memberCount: members.length
      };
    });

    res.json({
      success: true,
      data: {
        list: enrichedTeams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('查询团队失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/teams/:id
 * 获取团队详情
 */
router.get('/:id', (req, res) => {
  try {
    const team = db.findById('teams', req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }

    // 填充成员信息
    const members = team.members.map(memberId => {
      const user = db.findById('users', memberId);
      return user ? {
        id: user.id,
        name: user.name,
        role: user.role,
        major: user.major,
        avatar: user.avatar
      } : null;
    }).filter(Boolean);

    const leader = db.findById('users', team.leaderId);

    // 查询团队参与的项目
    const projects = db.find('projects', { teamId: team.id });

    res.json({
      success: true,
      data: {
        ...team,
        leader: leader ? {
          id: leader.id,
          name: leader.name,
          major: leader.major,
          avatar: leader.avatar
        } : null,
        members,
        memberCount: members.length,
        projects: projects.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          progress: p.progress
        }))
      }
    });
  } catch (err) {
    console.error('获取团队详情失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/teams
 * 创建团队（仅学生）
 */
router.post('/', authenticate, requireRole('student'), (req, res) => {
  try {
    const { name, description, tags } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '团队名称不能为空' });
    }

    const team = db.insert('teams', {
      name,
      description: description || '',
      leaderId: req.user.userId,
      members: [req.user.userId],
      tags: tags || [],
      maxMembers: 6,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: '团队创建成功',
      data: team
    });
  } catch (err) {
    console.error('创建团队失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/teams/:id
 * 更新团队信息（仅队长）
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const team = db.findById('teams', req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }
    if (team.leaderId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '只有队长可以修改团队信息' });
    }

    const { name, description, tags } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;

    const updated = db.update('teams', req.params.id, updates);
    res.json({ success: true, message: '更新成功', data: updated });
  } catch (err) {
    console.error('更新团队失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/teams/:id/members
 * 邀请成员加入团队（仅队长）
 */
router.post('/:id/members', authenticate, (req, res) => {
  try {
    const { userId } = req.body;
    const team = db.findById('teams', req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }
    if (team.leaderId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '只有队长可以邀请成员' });
    }

    // 检查成员是否存在
    const targetUser = db.findById('users', userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    if (targetUser.role !== 'student') {
      return res.status(400).json({ success: false, message: '只能邀请学生加入团队' });
    }

    // 检查是否已在团队中
    if (team.members.includes(userId)) {
      return res.status(409).json({ success: false, message: '该成员已在团队中' });
    }

    // 检查团队是否已满
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ success: false, message: '团队人数已达上限' });
    }

    // 添加成员
    const updated = db.update('teams', req.params.id, {
      members: [...team.members, userId]
    });

    res.json({ success: true, message: '成员邀请成功', data: updated });
  } catch (err) {
    console.error('邀请成员失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * DELETE /api/teams/:id/members/:userId
 * 移除团队成员（仅队长）
 */
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  try {
    const team = db.findById('teams', req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }
    if (team.leaderId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '只有队长可以移除成员' });
    }

    const targetId = req.params.userId;
    if (targetId === team.leaderId) {
      return res.status(400).json({ success: false, message: '不能移除队长' });
    }

    const newMembers = team.members.filter(id => id !== targetId);
    db.update('teams', req.params.id, { members: newMembers });

    res.json({ success: true, message: '成员已移除' });
  } catch (err) {
    console.error('移除成员失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * DELETE /api/teams/:id
 * 解散团队（仅队长）
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const team = db.findById('teams', req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }
    if (team.leaderId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '只有队长可以解散团队' });
    }

    // 检查团队是否有进行中项目
    const activeProjects = db.find('projects', { teamId: team.id })
      .filter(p => ['in_progress', 'review'].includes(p.status));
    if (activeProjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: '团队有进行中项目，无法解散'
      });
    }

    db.remove('teams', req.params.id);
    res.json({ success: true, message: '团队已解散' });
  } catch (err) {
    console.error('解散团队失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
