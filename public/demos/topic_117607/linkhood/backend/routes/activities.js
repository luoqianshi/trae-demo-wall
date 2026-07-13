const express = require('express');
const { Activity, Circle, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 获取活动列表
router.get('/', async (req, res) => {
  try {
    const { circleId, type, status = 'upcoming' } = req.query;
    const where = { status };
    if (circleId) where.circleId = circleId;
    if (type) where.type = type;
    const activities = await Activity.findAll({
      where,
      order: [['eventTime', 'ASC']],
      include: [
        { model: Circle, as: 'circle', attributes: ['id', 'name'] },
        { model: User, as: 'organizer', attributes: ['id', 'nickname', 'avatar'] }
      ]
    });
    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取活动列表失败', error: err.message });
  }
});

// 获取活动详情
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        { model: Circle, as: 'circle', attributes: ['id', 'name'] },
        { model: User, as: 'organizer', attributes: ['id', 'nickname', 'avatar'] }
      ]
    });
    if (!activity) return res.status(404).json({ success: false, message: '活动不存在' });
    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取活动详情失败', error: err.message });
  }
});

// 发布活动
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, type, eventTime, location, maxPeople, fee, circleId } = req.body;
    if (!title || !type || !circleId) {
      return res.status(400).json({ success: false, message: '标题、类型和邻圈不能为空' });
    }
    const activity = await Activity.create({
      title,
      description,
      type,
      eventTime: eventTime ? new Date(eventTime) : null,
      location,
      maxPeople,
      fee: fee || 0,
      circleId,
      organizerId: req.user.id
    });
    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: '发布活动失败', error: err.message });
  }
});

// 报名活动
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: '活动不存在' });
    if (activity.maxPeople && activity.enrolledCount >= activity.maxPeople) {
      return res.status(400).json({ success: false, message: '活动名额已满' });
    }
    await activity.increment('enrolledCount');
    res.json({ success: true, data: { enrolledCount: activity.enrolledCount + 1 } });
  } catch (err) {
    res.status(500).json({ success: false, message: '报名失败', error: err.message });
  }
});

module.exports = router;
