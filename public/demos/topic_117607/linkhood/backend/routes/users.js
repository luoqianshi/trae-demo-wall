const express = require('express');
const { User, Need, Order, AuthRecord } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 获取用户公开信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'nickname', 'avatar', 'creditScore', 'role', 'createdAt']
    });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户信息失败', error: err.message });
  }
});

// 获取用户发布的需求
router.get('/:id/needs', async (req, res) => {
  try {
    const needs = await Need.findAll({
      where: { publisherId: req.params.id, status: 'active' },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'publisher', attributes: ['id', 'nickname', 'avatar'] }]
    });
    res.json({ success: true, data: needs });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户发布失败', error: err.message });
  }
});

// 更新个人信息
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { nickname, avatar, gender, age, phone, email } = req.body;
    await req.user.update({ nickname, avatar, gender, age, phone, email });
    res.json({ success: true, data: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新个人信息失败', error: err.message });
  }
});

module.exports = router;
