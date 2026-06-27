/**
 * 认证路由
 * 处理用户注册、登录、信息查询
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// 角色枚举
const ROLES = {
  ENTERPRISE: 'enterprise',  // 企业
  TEACHER: 'teacher',        // 教师
  STUDENT: 'student'         // 学生
};

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { role, account, password, name, email, phone, orgName, orgCode, studentId, major } = req.body;

    // 参数校验
    if (!role || !account || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：role, account, password, name'
      });
    }

    // 校验角色
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `无效的角色，可选: ${Object.values(ROLES).join(', ')}`
      });
    }

    // 校验密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位'
      });
    }

    // 检查账号是否已存在
    const existingUser = db.findOne('users', { account });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '该账号已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户
    const user = db.insert('users', {
      role,
      account,
      password: hashedPassword,
      name,
      email: email || '',
      phone: phone || '',
      orgName: orgName || '',
      orgCode: orgCode || '',
      studentId: studentId || '',
      major: major || '',
      avatar: '',
      status: 'active'
    });

    // 生成Token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      account: user.account
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          role: user.role,
          account: user.account,
          name: user.name,
          email: user.email,
          orgName: user.orgName
        }
      }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { account, password, role } = req.body;

    if (!account || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供账号和密码'
      });
    }

    // 查找用户
    const user = db.findOne('users', { account });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误'
      });
    }

    // 校验角色（如果提供了）
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: '角色不匹配，请使用正确的入口登录'
      });
    }

    // 校验密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误'
      });
    }

    // 检查状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员'
      });
    }

    // 生成Token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      account: user.account
    });

    // 更新最后登录时间
    db.update('users', user.id, { lastLoginAt: new Date().toISOString() });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          role: user.role,
          account: user.account,
          name: user.name,
          email: user.email,
          phone: user.phone,
          orgName: user.orgName,
          orgCode: user.orgCode,
          studentId: user.studentId,
          major: user.major,
          avatar: user.avatar
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get('/me', authenticate, (req, res) => {
  const user = db.findById('users', req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({
    success: true,
    data: {
      id: user.id,
      role: user.role,
      account: user.account,
      name: user.name,
      email: user.email,
      phone: user.phone,
      orgName: user.orgName,
      orgCode: user.orgCode,
      studentId: user.studentId,
      major: user.major,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }
  });
});

/**
 * PUT /api/auth/me
 * 更新当前用户信息
 */
router.put('/me', authenticate, (req, res) => {
  const { name, email, phone, avatar, orgName, major } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (avatar !== undefined) updates.avatar = avatar;
  if (orgName !== undefined) updates.orgName = orgName;
  if (major !== undefined) updates.major = major;

  const user = db.update('users', req.user.userId, updates);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, message: '更新成功', data: user });
});

/**
 * POST /api/auth/change-password
 * 修改密码
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '请提供旧密码和新密码（新密码至少6位）'
      });
    }

    const user = db.findById('users', req.user.userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '旧密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.update('users', req.user.userId, { password: hashedPassword });
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
