const express = require('express');
const { Circle, CircleMember, User, Need, Activity, Feedback } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 获取邻圈列表
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const where = { status: 'active' };
    if (type) where.type = type;
    const circles = await Circle.findAll({
      where,
      order: [['memberCount', 'DESC']]
    });
    res.json({ success: true, data: circles });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取邻圈列表失败', error: err.message });
  }
});

// 获取我已加入的邻圈
router.get('/joined', authenticate, async (req, res) => {
  try {
    const memberships = await CircleMember.findAll({
      where: { userId: req.user.id, status: 'approved' },
      attributes: ['circleId']
    });
    const circleIds = memberships.map(m => m.circleId);
    if (!circleIds.length) {
      return res.json({ success: true, data: [] });
    }
    const circles = await Circle.findAll({
      where: { id: circleIds, status: 'active' },
      order: [['memberCount', 'DESC']]
    });
    res.json({ success: true, data: circles });
  } catch (err) {
    console.error('获取已加入邻圈失败:', err.message);
    res.status(500).json({ success: false, message: '获取已加入邻圈失败', error: err.message });
  }
});

// 获取邻圈详情
router.get('/:id', async (req, res) => {
  try {
    const circle = await Circle.findByPk(req.params.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'nickname', 'avatar', 'creditScore'], through: { attributes: ['role', 'status'] } },
        { model: Need, as: 'needs', where: { status: 'active' }, required: false, separate: true },
        { model: Activity, as: 'activities', where: { status: 'upcoming' }, required: false, separate: true },
        { model: Feedback, as: 'feedbacks', where: { status: ['open', 'processing'] }, required: false, separate: true }
      ]
    });
    if (!circle) {
      return res.status(404).json({ success: false, message: '邻圈不存在' });
    }
    res.json({ success: true, data: circle });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取邻圈详情失败', error: err.message });
  }
});

// 申请加入邻圈
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { applyReason } = req.body;
    const circle = await Circle.findByPk(req.params.id);
    if (!circle) {
      return res.status(404).json({ success: false, message: '邻圈不存在' });
    }
    const [member, created] = await CircleMember.findOrCreate({
      where: { userId: req.user.id, circleId: circle.id },
      defaults: {
        userId: req.user.id,
        circleId: circle.id,
        role: 'member',
        status: circle.verifyType === 'admin' ? 'pending' : 'approved',
        applyReason
      }
    });
    if (!created) {
      return res.status(400).json({ success: false, message: '您已申请或已加入该邻圈' });
    }
    res.json({ success: true, data: member, message: circle.verifyType === 'admin' ? '申请已提交，等待管理员审核' : '加入成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '申请加入失败', error: err.message });
  }
});

// 审核加入申请（管理员）
router.post('/:id/review/:userId', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const circle = await Circle.findByPk(req.params.id);
    if (!circle) return res.status(404).json({ success: false, message: '邻圈不存在' });

    const myMembership = await CircleMember.findOne({
      where: { userId: req.user.id, circleId: circle.id, role: ['admin', 'owner'] }
    });
    if (!myMembership) {
      return res.status(403).json({ success: false, message: '无权审核' });
    }

    const member = await CircleMember.findOne({
      where: { userId: req.params.userId, circleId: circle.id, status: 'pending' }
    });
    if (!member) {
      return res.status(404).json({ success: false, message: '申请记录不存在' });
    }

    await member.update({ status });
    if (status === 'approved') {
      await circle.increment('memberCount');
    }
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: '审核失败', error: err.message });
  }
});

module.exports = router;
