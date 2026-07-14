const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// 手机号格式校验（中国大陆手机号）
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * POST /api/v1/auth/register
 * 注册 - 手机号只做格式校验，密码bcrypt加密
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, login_name, password } = req.body;

    // 参数校验
    if (!phone && !login_name) {
      return res.status(400).json({ code: 400, message: '手机号和登录名至少提供一个', data: null });
    }
    if (!password) {
      return res.status(400).json({ code: 400, message: '密码不能为空', data: null });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码长度不能少于6位', data: null });
    }

    // 手机号格式校验（测试版只做格式校验）
    if (phone && !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ code: 400, message: '手机号格式不正确', data: null });
    }

    // 检查重复
    if (phone) {
      const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
      if (existingPhone) {
        return res.status(409).json({ code: 409, message: '该手机号已注册', data: null });
      }
    }
    if (login_name) {
      const existingName = db.prepare('SELECT id FROM users WHERE login_name = ?').get(login_name);
      if (existingName) {
        return res.status(409).json({ code: 409, message: '该登录名已被使用', data: null });
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 插入用户
    const result = db.prepare(
      'INSERT INTO users (phone, login_name, password_hash) VALUES (?, ?, ?)'
    ).run(phone || null, login_name || null, passwordHash);

    const userId = result.lastInsertRowid;

    // 创建初始积分记录
    db.prepare('INSERT INTO point_records (user_id, points, event_type) VALUES (?, ?, ?)')
      .run(userId, 10, 'register');

    res.status(201).json({
      code: 0,
      message: '注册成功',
      data: {
        userId,
        phone,
        login_name
      }
    });
  } catch (err) {
    console.error('[Auth] 注册失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * POST /api/v1/auth/login
 * 登录 - 返回JWT双Token
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, login_name, password } = req.body;
    console.log('[Auth] 登录请求:', { phone: phone || null, login_name: login_name || null, hasPassword: !!password });

    if (!password) {
      return res.status(400).json({ code: 400, message: '密码不能为空', data: null });
    }
    if (!phone && !login_name) {
      return res.status(400).json({ code: 400, message: '手机号和登录名至少提供一个', data: null });
    }

    // 查找用户
    let user;
    if (phone) {
      user = db.prepare('SELECT * FROM users WHERE phone = ? AND status = ?').get(phone, 'active');
      console.log('[Auth] 按手机号查询:', phone, user ? '找到用户' : '未找到');
    } else {
      user = db.prepare('SELECT * FROM users WHERE login_name = ? AND status = ?').get(login_name, 'active');
      console.log('[Auth] 按登录名查询:', login_name, user ? '找到用户' : '未找到');
    }

    if (!user) {
      return res.status(401).json({ code: 401, message: '账号或密码错误', data: null });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[Auth] 密码验证结果:', isMatch ? '匹配' : '不匹配');
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: '账号或密码错误', data: null });
    }

    // 生成 Access Token (1小时过期)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 生成 Refresh Token (7天过期)
    const refreshTokenValue = jwt.sign(
      { userId: user.id, role: user.role, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user.id,
          phone: user.phone,
          login_name: user.login_name,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('[Auth] 登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * POST /api/v1/auth/refresh
 * 刷新Token
 */
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ code: 401, message: '未提供刷新令牌', data: null });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ code: 401, message: '无效的刷新令牌', data: null });
      }
    } catch (err) {
      return res.status(401).json({ code: 401, message: '刷新令牌已过期或无效', data: null });
    }

    // 验证用户仍然有效
    const user = db.prepare('SELECT id, role, status FROM users WHERE id = ?').get(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ code: 401, message: '用户状态异常', data: null });
    }

    // 生成新的 Access Token
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 生成新的 Refresh Token
    const newRefreshToken = jwt.sign(
      { userId: user.id, role: user.role, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 0,
      message: '令牌刷新成功',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (err) {
    console.error('[Auth] 刷新令牌失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
