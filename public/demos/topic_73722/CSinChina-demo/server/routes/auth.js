const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, all } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, institution } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '请填写所有必填字段：邮箱、密码、姓名' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = role === 'scientist' ? 'scientist' : 'public';

    const result = await run(
      'INSERT INTO users (email, password_hash, name, role, institution) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, name, userRole, institution || '']
    );

    const token = jwt.sign(
      { id: result.lastID, email, name, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: result.lastID, email, name, role: userRole, institution: institution || '' }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institution: user.institution || ''
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, email, name, role, institution, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;