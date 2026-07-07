// 认证路由模块
// 提供用户注册、登录和获取当前用户信息功能

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// JWT token 有效期 7 天
const TOKEN_EXPIRES_IN = '7d';

/**
 * POST /register - 用户注册
 * body: { username, password }
 * 返回: { success, data: { token, user: { id, username, role } } }
 */
router.post('/register', (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length < 2) {
      return res.status(400).json({
        success: false,
        message: '用户名至少需要 2 个字符'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少需要 6 个字符'
      });
    }

    // 检查用户名是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 哈希密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 插入新用户
    const result = db.prepare(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
    ).run(username, hashedPassword, 'user');

    // 生成 JWT token
    const user = { id: result.lastInsertRowid, username, role: 'user' };
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /login - 用户登录
 * body: { username, password }
 * 返回: { success, data: { token, user: { id, username, role } } }
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查询用户
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 校验密码
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /me - 获取当前用户信息
 * 需要 authRequired
 * 返回: { success, data: { id, username, role, createdAt } }
 */
router.get('/me', authRequired, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, role, created_at FROM users WHERE id = ?'
    ).get(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
