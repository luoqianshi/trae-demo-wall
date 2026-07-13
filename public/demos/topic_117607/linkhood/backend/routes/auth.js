const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuthRecord } = require('../models');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    const exists = await User.findOne({ where: { username } });
    if (exists) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashed,
      nickname: nickname || username,
      creditScore: 70
    });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      data: { id: user.id, username: user.username, nickname: user.nickname, token }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '注册失败', error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }
    await user.update({ lastLoginAt: new Date() });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        creditScore: user.creditScore,
        avatar: user.avatar,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '登录失败', error: err.message });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    const authRecords = await AuthRecord.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({
      success: true,
      data: { ...req.user.toJSON(), authRecords }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户信息失败', error: err.message });
  }
});

// 提交认证
router.post('/auth-record', authenticate, async (req, res) => {
  try {
    const { type, realName, certNo, description, industry } = req.body;
    const record = await AuthRecord.create({
      userId: req.user.id,
      type,
      realName,
      certNo,
      description,
      industry,
      status: 'pending'
    });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: '提交认证失败', error: err.message });
  }
});

// 获取我的认证列表
router.get('/auth-records', authenticate, async (req, res) => {
  try {
    const records = await AuthRecord.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取认证记录失败', error: err.message });
  }
});

module.exports = router;
