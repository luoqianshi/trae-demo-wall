/**
 * 统计路由
 * 项目交付率、学生排行、企业活跃度、教师工作量、能力雷达图
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/** GET /api/stats/overview - 平台总览数据 */
router.get('/overview', (req, res) => {
  try {
    const users = db.getTable('users');
    const projects = db.getTable('projects');
    const teams = db.getTable('teams');
    const assignments = db.getTable('assignments');

    const completedProjects = projects.filter(p => p.status === 'completed');
    const inProgressProjects = projects.filter(p => p.status === 'in_progress');
    const reviewedAssignments = assignments.filter(a => a.status === 'reviewed');

    // 计算平均交付率
    const totalAssignments = assignments.length;
    const deliveryRate = totalAssignments > 0 ? Math.round((reviewedAssignments.length / totalAssignments) * 100) : 0;

    res.json({
      success: true,
      data: {
        userCount: { total: users.length, enterprise: users.filter(u => u.role === 'enterprise').length, teacher: users.filter(u => u.role === 'teacher').length, student: users.filter(u => u.role === 'student').length },
        projectCount: { total: projects.length, completed: completedProjects.length, inProgress: inProgressProjects.length, open: projects.filter(p => p.status === 'open').length },
        teamCount: teams.length,
        assignmentCount: { total: totalAssignments, reviewed: reviewedAssignments.length, deliveryRate },
        avgScore: reviewedAssignments.length > 0 ? Math.round(reviewedAssignments.reduce((s, a) => s + (a.score || 0), 0) / reviewedAssignments.length) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/stats/projects - 项目统计 */
router.get('/projects', (req, res) => {
  try {
    const projects = db.getTable('projects');
    const statusStats = {};
    const monthStats = {};

    projects.forEach(p => {
      statusStats[p.status] = (statusStats[p.status] || 0) + 1;
      const month = p.createdAt.substring(0, 7);
      monthStats[month] = (monthStats[month] || 0) + 1;
    });

    res.json({ success: true, data: { statusStats, monthStats, categoryStats: getCategoryStats(projects) } });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/stats/students - 学生排行 */
router.get('/students', (req, res) => {
  try {
    const { sort = 'score', limit = 20 } = req.query;
    const students = db.find('users', { role: 'student' });
    const assignments = db.getTable('assignments');

    const ranked = students.map(s => {
      const studentAssignments = assignments.filter(a => a.studentId === s.id && a.status === 'reviewed');
      const avgScore = studentAssignments.length > 0 ? studentAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / studentAssignments.length : 0;
      const projectCount = studentAssignments.length;

      return {
        id: s.id, name: s.name, major: s.major,
        avgScore: Math.round(avgScore * 10) / 10,
        projectCount,
        totalScore: studentAssignments.reduce((sum, a) => sum + (a.score || 0), 0)
      };
    });

    if (sort === 'score') ranked.sort((a, b) => b.avgScore - a.avgScore);
    else if (sort === 'count') ranked.sort((a, b) => b.projectCount - a.projectCount);

    res.json({ success: true, data: ranked.slice(0, parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/stats/enterprises - 企业活跃度 */
router.get('/enterprises', (req, res) => {
  try {
    const enterprises = db.find('users', { role: 'enterprise' });
    const projects = db.getTable('projects');

    const ranked = enterprises.map(e => {
      const ep = projects.filter(p => p.publisherId === e.id);
      return {
        id: e.id, name: e.name, orgName: e.orgName,
        projectCount: ep.length,
        completedCount: ep.filter(p => p.status === 'completed').length,
        inProgressCount: ep.filter(p => p.status === 'in_progress').length
      };
    }).sort((a, b) => b.projectCount - a.projectCount);

    res.json({ success: true, data: ranked });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/stats/teachers - 教师工作量 */
router.get('/teachers', (req, res) => {
  try {
    const teachers = db.find('users', { role: 'teacher' });
    const projects = db.getTable('projects');
    const progress = db.getTable('progress');

    const ranked = teachers.map(t => {
      const tp = projects.filter(p => p.publisherId === t.id);
      const guidanceCount = progress.filter(p => p.userId === t.id).length;
      return {
        id: t.id, name: t.name,
        projectCount: tp.length,
        guidanceCount,
        completedCount: tp.filter(p => p.status === 'completed').length
      };
    }).sort((a, b) => b.guidanceCount - a.guidanceCount);

    res.json({ success: true, data: ranked });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/stats/radar/:studentId - 学生能力雷达图数据 */
router.get('/radar/:studentId', (req, res) => {
  try {
    const student = db.findById('users', req.params.studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }

    const assignments = db.find('assignments', { studentId: req.params.studentId, status: 'reviewed' });
    const examRecords = db.find('exam_records', { studentId: req.params.studentId, status: 'submitted' });

    // 模拟能力维度评分（实际可基于评审数据计算）
    const dimensions = {
      technicalAbility: calcDimension(assignments, '技术能力', 0.3),
      projectManagement: calcDimension(assignments, '项目管理', 0.2),
      teamwork: calcDimension(assignments, '团队协作', 0.2),
      innovation: calcDimension(assignments, '创新能力', 0.15),
      communication: calcDimension(assignments, '沟通表达', 0.15)
    };

    res.json({
      success: true,
      data: {
        student: { id: student.id, name: student.name },
        dimensions,
        totalAssignments: assignments.length,
        totalExams: examRecords.length,
        avgScore: assignments.length > 0 ? Math.round(assignments.reduce((s, a) => s + (a.score || 0), 0) / assignments.length) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 辅助函数
function getCategoryStats(projects) {
  const stats = {};
  projects.forEach(p => {
    const cat = p.category || '其他';
    stats[cat] = (stats[cat] || 0) + 1;
  });
  return stats;
}

function calcDimension(assignments, dimension, weight) {
  if (assignments.length === 0) return 60;
  const base = assignments.reduce((s, a) => s + (a.score || 0), 0) / assignments.length;
  return Math.min(100, Math.round(base * weight + 60 * (1 - weight)));
}

module.exports = router;
