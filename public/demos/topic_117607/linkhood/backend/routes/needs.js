const express = require('express');
const { Need, User, Circle, Comment } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 获取需求列表
router.get('/', async (req, res) => {
  try {
    const { category, circleId, keyword, page = 1, limit = 20 } = req.query;
    const where = { status: 'active' };
    if (category) where.category = category;
    if (circleId) where.circleId = circleId;
    if (keyword) {
      where.title = { [require('sequelize').Op.like]: `%${keyword}%` };
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await Need.findAndCountAll({
      where,
      order: [['boosts', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: User, as: 'publisher', attributes: ['id', 'nickname', 'avatar', 'creditScore'] },
        { model: Circle, as: 'circle', attributes: ['id', 'name', 'type'] }
      ]
    });
    res.json({ success: true, data: { list: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取需求列表失败', error: err.message });
  }
});

// 获取需求详情
router.get('/:id', async (req, res) => {
  try {
    const need = await Need.findByPk(req.params.id, {
      include: [
        { model: User, as: 'publisher', attributes: ['id', 'nickname', 'avatar', 'creditScore', 'role'] },
        { model: Circle, as: 'circle', attributes: ['id', 'name', 'type'] },
        { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }] }
      ]
    });
    if (!need) return res.status(404).json({ success: false, message: '需求不存在' });
    res.json({ success: true, data: need });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取需求详情失败', error: err.message });
  }
});

// 发布需求
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, price, circleId, address, contact, tags, distance } = req.body;
    if (!title || !category || !circleId) {
      return res.status(400).json({ success: false, message: '标题、分类和邻圈不能为空' });
    }
    const need = await Need.create({
      title,
      description,
      category,
      price,
      circleId,
      address,
      contact,
      tags: tags || [],
      publisherId: req.user.id,
      distance: distance || '本邻圈'
    });
    res.json({ success: true, data: need });
  } catch (err) {
    res.status(500).json({ success: false, message: '发布需求失败', error: err.message });
  }
});

// 助力需求
router.post('/:id/boost', authenticate, async (req, res) => {
  try {
    const need = await Need.findByPk(req.params.id);
    if (!need) return res.status(404).json({ success: false, message: '需求不存在' });
    await need.increment('boosts');
    res.json({ success: true, data: { boosts: need.boosts + 1 } });
  } catch (err) {
    res.status(500).json({ success: false, message: '助力失败', error: err.message });
  }
});

// 添加评论
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const comment = await Comment.create({
      content,
      needId: req.params.id,
      userId: req.user.id,
      parentId: parentId || null
    });
    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: '评论失败', error: err.message });
  }
});

module.exports = router;
