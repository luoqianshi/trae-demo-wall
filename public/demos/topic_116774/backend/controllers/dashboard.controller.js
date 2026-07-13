/**
 * 仪表盘控制器
 * 创建日期: 2026-07-10
 */

const User = require('../models/User');
const Knowledge = require('../models/Knowledge');
const Interview = require('../models/Interview');
const SOP = require('../models/SOP');
const response = require('../utils/response');

const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.count();
    const knowledgeCount = await Knowledge.count();
    const verifiedKnowledgeCount = await Knowledge.count({ where: { status: 'verified' } });
    const interviewCount = await Interview.count();
    const completedInterviewCount = await Interview.count({ where: { status: 'completed' } });
    const sopCount = await SOP.count();

    res.json(response.success({
      users: userCount,
      knowledge: knowledgeCount,
      verifiedKnowledge: verifiedKnowledgeCount,
      interviews: interviewCount,
      completedInterviews: completedInterviewCount,
      sops: sopCount
    }, '获取成功'));
  } catch (err) {
    console.error('获取仪表盘数据失败:', err);
    res.status(500).json(response.internalError('获取仪表盘数据失败', err.message));
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const recentInterviews = await Interview.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'expert', attributes: ['id', 'username'] }]
    });
    const recentKnowledge = await Knowledge.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'contributor', attributes: ['id', 'username'] }]
    });

    res.json(response.success({
      interviews: recentInterviews,
      knowledge: recentKnowledge
    }, '获取成功'));
  } catch (err) {
    console.error('获取最近活动失败:', err);
    res.status(500).json(response.internalError('获取最近活动失败', err.message));
  }
};

module.exports = { getDashboardStats, getRecentActivity };
