import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { config } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 用户注册
router.post('/register', (req: AuthRequest, res: Response): void => {
  try {
    const { username, password, realName, role, phone, institutionId } = req.body;

    if (!username || !password) {
      res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ code: 400, message: '用户名至少3位' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ code: 400, message: '密码至少6位' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(400).json({ code: 400, message: '用户名已存在' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = role || 'student';
    const result = db.prepare(
      `INSERT INTO users (username, password_hash, real_name, role, phone, institution_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(username, passwordHash, realName || '', userRole, phone || '', institutionId || null);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, role: userRole, institutionId: institutionId || null },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.json({
      code: 0,
      data: {
        token,
        userId: result.lastInsertRowid,
        role: userRole,
        realName: realName || '',
        username,
      },
      message: '注册成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '注册失败: ' + err.message });
  }
});

// 用户登录
router.post('/login', (req: AuthRequest, res: Response): void => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
      return;
    }

    const user = db.prepare(
      'SELECT id, username, password_hash, real_name, role, phone, email, avatar, institution_id, status FROM users WHERE username = ?'
    ).get(username) as any;

    if (!user) {
      res.status(400).json({ code: 400, message: '用户名或密码错误' });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({ code: 403, message: '账号已被禁用' });
      return;
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(400).json({ code: 400, message: '用户名或密码错误' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, institutionId: user.institution_id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.json({
      code: 0,
      data: {
        token,
        userId: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        institutionId: user.institution_id,
      },
      message: '登录成功',
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '登录失败: ' + err.message });
  }
});

// 获取当前用户信息
router.get('/profile', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const user = db.prepare(
      'SELECT id, username, real_name, role, phone, email, avatar, institution_id, status, created_at FROM users WHERE id = ?'
    ).get(req.userId!) as any;

    if (!user) {
      res.status(404).json({ code: 404, message: '用户不存在' });
      return;
    }

    // 获取机构信息
    let institution = null;
    if (user.institution_id) {
      institution = db.prepare('SELECT id, name, type, status, subscription_type FROM institutions WHERE id = ?')
        .get(user.institution_id);
    }

    res.json({
      code: 0,
      data: { ...user, institution },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

// 刷新Token - 在token过期前续期
router.post('/refresh', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const user = db.prepare(
      'SELECT id, username, real_name, role, phone, email, avatar, institution_id FROM users WHERE id = ?'
    ).get(req.userId!) as any;

    if (!user) {
      res.status(404).json({ code: 404, message: '用户不存在' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    res.json({ code: 0, data: { token } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '刷新Token失败' });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { realName, phone, email, avatar } = req.body;
    db.prepare(
      'UPDATE users SET real_name = COALESCE(?, real_name), phone = COALESCE(?, phone), email = COALESCE(?, email), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(realName, phone, email, avatar, req.userId!);

    res.json({ code: 0, message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '更新失败: ' + err.message });
  }
});

// 获取个人学习统计
router.get('/stats', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;

    // 已完成项目数
    const completed = db.prepare(
      'SELECT COUNT(*) as cnt FROM task_progress WHERE user_id = ? AND completed = 1'
    ).get(userId) as { cnt: number };

    // 进行中项目数
    const inProgress = db.prepare(
      'SELECT COUNT(*) as cnt FROM task_progress WHERE user_id = ? AND completed = 0'
    ).get(userId) as { cnt: number };

    // 提交作品数
    const submissions = db.prepare(
      'SELECT COUNT(*) as cnt FROM submissions WHERE user_id = ?'
    ).get(userId) as { cnt: number };

    // 收藏数
    const favorites = db.prepare(
      'SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?'
    ).get(userId) as { cnt: number };

    // 最近完成的项目（取前5个）
    const recentCompleted = db.prepare(
      `SELECT t.id, t.title, t.cover_image, t.category, tp.updated_at as completed_at
       FROM task_progress tp
       JOIN tasks t ON tp.task_id = t.id
       WHERE tp.user_id = ? AND tp.completed = 1
       ORDER BY tp.updated_at DESC LIMIT 5`
    ).all(userId);

    res.json({
      code: 0,
      data: {
        completed: completed.cnt,
        inProgress: inProgress.cnt,
        submissions: submissions.cnt,
        favorites: favorites.cnt,
        recentCompleted,
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: '获取统计失败: ' + err.message });
  }
});

export default router;