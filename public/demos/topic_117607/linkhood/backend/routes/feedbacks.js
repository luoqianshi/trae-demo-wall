const express = require('express');
const { Feedback, Circle, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 获取反馈列表
router.get('/', async (req, res) => {
  try {
    const { circleId, status } = req.query;
    const where = {};
    if (circleId) where.circleId = circleId;
    if (status) where.status = status;
    const feedbacks = await Feedback.findAll({
      where,
      order: [['boosts', 'DESC'], ['createdAt', 'DESC']],
      include: [
        { model: Circle, as: 'circle', attributes: ['id', 'name'] },
        { model: User, as: 'publisher', attributes: ['id', 'nickname', 'avatar'] }
      ]
    });
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取反馈列表失败', error: err.message });
  }
});

// 获取反馈详情
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id, {
      include: [
        { model: Circle, as: 'circle', attributes: ['id', 'name'] },
        { model: User, as: 'publisher', attributes: ['id', 'nickname', 'avatar'] }
      ]
    });
    if (!feedback) return res.status(404).json({ success: false, message: '反馈不存在' });
    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取反馈详情失败', error: err.message });
  }
});

// 提交反馈
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, circleId } = req.body;
    if (!title || !circleId) {
      return res.status(400).json({ success: false, message: '标题和邻圈不能为空' });
    }
    const feedback = await Feedback.create({
      title,
      description,
      circleId,
      publisherId: req.user.id
    });
    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: '提交反馈失败', error: err.message });
  }
});

// 助力反馈
router.post('/:id/boost', authenticate, async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: '反馈不存在' });
    await feedback.increment('boosts');
    res.json({ success: true, data: { boosts: feedback.boosts + 1 } });
  } catch (err) {
    res.status(500).json({ success: false, message: '助力失败', error: err.message });
  }
});

module.exports = router;
